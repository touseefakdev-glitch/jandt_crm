// Realtime layer for the Orders module.
//
// Two mechanisms keep open browsers in sync without a manual refresh:
//   1. Supabase Postgres Changes Realtime — instant pushes for
//      daily_order_operations + daily_order_operation_history (published in
//      migration 04). RLS area-scoped policies apply to these events, so an
//      agent only ever receives rows from their operational area.
//   2. Polling fallback — every 30s the changed rows (by updated_at watermark)
//      are fetched and merged. This covers environments where Realtime is not
//      configured or the connection drops, while staying cheap because only
//      rows changed since the last poll are downloaded.
//
// Merged rows are written with storagePrime (no write-through sync scheduled),
// which prevents feedback loops between the two mechanisms and the writer.
import type { RealtimeChannel } from '@supabase/supabase-js';
import { supabase, storageGet, storagePrime } from './supabaseSync';

const OPS_KEY = 'jt_crm_daily_order_operations';
const HISTORY_KEY = 'jt_crm_daily_order_operation_history';

const POLL_INTERVAL_MS = 30_000;
const POLL_WINDOW_BACK = 10; // days of history to include in the first poll

let channel: RealtimeChannel | null = null;
let pollTimer: number | null = null;
let isPolling = false;
let lastPollAt = 0;
let subscribers = 0;

type ChangePayload<T = Record<string, unknown>> = {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new?: T;
  old?: { id?: string };
};

function mergeRow(key: string, row: Record<string, unknown>): void {
  if (!row || typeof row.id !== 'string') return;
  const id = row.id;

  const raw = storageGet(key);
  const list: Array<Record<string, unknown>> = raw ? JSON.parse(raw) : [];

  const idx = list.findIndex(r => r.id === id);
  let changed: boolean;

  if (idx >= 0) {
    const merged = { ...list[idx], ...row };
    // Skip identical writes to avoid re-broadcasting the same row forever
    changed = JSON.stringify(merged) !== JSON.stringify(list[idx]);
    if (changed) list[idx] = merged;
  } else {
    list.unshift(row);
    changed = true;
  }

  if (changed) {
    storagePrime(key, JSON.stringify(list));
  }
}

function removeRow(key: string, id: string): void {
  const raw = storageGet(key);
  const list: Array<Record<string, unknown>> = raw ? JSON.parse(raw) : [];
  const next = list.filter(r => r.id !== id);
  if (next.length !== list.length) {
    storagePrime(key, JSON.stringify(next));
  }
}

function handleOperationsChange(payload: ChangePayload): void {
  if (payload.eventType === 'DELETE') {
    const id = payload.old?.id;
    if (id) removeRow(OPS_KEY, id);
    return;
  }
  if (payload.new) mergeRow(OPS_KEY, payload.new);
}

function handleHistoryChange(payload: ChangePayload): void {
  if (payload.eventType === 'DELETE') {
    const id = payload.old?.id;
    if (id) removeRow(HISTORY_KEY, id);
    return;
  }
  if (payload.new) mergeRow(HISTORY_KEY, payload.new);
}

function isoDaysAgo(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

/**
 * Polls daily_order_operations for rows whose updated_at changed since the last
 * poll (using a watermark) and merges them into the local store.
 */
async function pollOrders(): Promise<void> {
  if (!supabase || isPolling) return;
  isPolling = true;
  try {
    const now = Date.now();
    const since = lastPollAt > 0
      ? new Date(lastPollAt).toISOString()
      : isoDaysAgo(POLL_WINDOW_BACK);

    const { data, error } = await supabase
      .from('daily_order_operations')
      .select('*')
      .gte('updated_at', since);

    if (error) {
      console.debug('[OrdersRealtime] poll skipped:', error.message);
      return;
    }

    if (data && data.length > 0) {
      const raw = storageGet(OPS_KEY);
      const list: Array<Record<string, unknown>> = raw ? JSON.parse(raw) : [];
      let changed = false;

      for (const row of data) {
        const idx = list.findIndex(r => r.id === (row as { id?: string }).id);
        if (idx >= 0) {
          const merged = { ...list[idx], ...row };
          if (JSON.stringify(merged) !== JSON.stringify(list[idx])) {
            list[idx] = merged;
            changed = true;
          }
        } else {
          list.unshift(row as Record<string, unknown>);
          changed = true;
        }
      }

      if (changed) {
        storagePrime(OPS_KEY, JSON.stringify(list));
      }
    }
  } catch (err) {
    console.debug('[OrdersRealtime] poll failed:', err);
  } finally {
    lastPollAt = Date.now();
    isPolling = false;
  }
}

/** Ensure a single shared channel across multiple subscribers (ref-counted). */
export function subscribeOrdersRealtime(
  onStatus?: (status: 'live' | 'connecting' | 'polling' | 'offline') => void
): () => void {
  subscribers += 1;

  if (subscribers === 1 && supabase && !channel) {
    channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_order_operations' },
        (payload) => handleOperationsChange(payload as ChangePayload)
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'daily_order_operation_history' },
        (payload) => handleHistoryChange(payload as ChangePayload)
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('[OrdersRealtime] Subscribed to order operations.');
          onStatus?.('live');
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
          // Fall back to polling — the periodic fetch below keeps data fresh.
          onStatus?.('polling');
        }
      });

    // Polling fallback: keeps the view fresh even if realtime delivery fails
    // (no auth session, publication not configured, or flaky connection).
    pollTimer = window.setInterval(() => {
      void pollOrders();
    }, POLL_INTERVAL_MS);
    void pollOrders();
  }

  return () => {
    subscribers = Math.max(0, subscribers - 1);
    if (subscribers === 0) {
      if (channel) {
        void supabase?.removeChannel(channel);
        channel = null;
      }
      if (pollTimer !== null) {
        window.clearInterval(pollTimer);
        pollTimer = null;
      }
      lastPollAt = 0;
      onStatus?.('offline');
    }
  };
}

/** For test/diagnostic use — force a polling cycle now. */
export async function refreshOrdersRealtime(): Promise<void> {
  await pollOrders();
}
