import { createClient } from '@supabase/supabase-js';

// Support both Vite (VITE_*) and Vercel/Vercel-Supabase integration (NEXT_PUBLIC_*) env names
const supabaseUrl =
  import.meta.env?.VITE_SUPABASE_URL ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_URL ||
  '';
const supabaseAnonKey =
  import.meta.env?.VITE_SUPABASE_ANON_KEY ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  import.meta.env?.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  '';

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// localStorage key → Supabase table name mapping ordered by FK dependencies
export const TABLE_MAP: Record<string, string> = {
  // Level 1: Taxonomies & Teams
  jt_crm_teams:              'teams',
  jt_crm_query_categories:   'query_categories',
  jt_crm_product_categories: 'product_categories',
  jt_crm_product_brands:     'product_brands',

  // Level 2: Profiles & Shifts
  jt_crm_users:              'profiles',
  jt_crm_shifts:             'shifts',

  // Level 3: Customers, Products, Notifications & Handovers
  jt_crm_customers:          'customers',
  jt_crm_products:           'products',
  jt_crm_notifications:      'notifications',
  jt_crm_handovers:          'shift_handovers',

  // Level 4: Orders & Order Sub-Entities
  jt_crm_orders:             'orders',
  jt_crm_order_items:        'order_items',
  jt_crm_order_history:      'order_status_history',
  jt_crm_order_documents:    'order_documents',

  // Level 5: Customer Queries & Query Sub-Entities
  jt_crm_queries:            'customer_queries',
  jt_crm_query_activities:   'query_activities',
  jt_crm_query_notes:        'query_internal_notes',
  jt_crm_query_attachments:  'query_attachments',
  jt_crm_handover_items:     'shift_handover_items',
  // Level 6: Customer Product History & System Logs
  jt_crm_customer_product_history: 'customer_product_history',
  jt_crm_system_settings:    'system_settings',
  jt_crm_audit_logs:         'audit_logs',

  // WhatsApp Order Intelligence (Phase A)
  jt_crm_whatsapp_contacts:              'whatsapp_contacts',
  jt_crm_whatsapp_conversations:         'whatsapp_conversations',
  jt_crm_whatsapp_messages:              'whatsapp_messages',
  jt_crm_order_drafts:                   'order_drafts',
  jt_crm_order_draft_items:              'order_draft_items',
  jt_crm_product_aliases:                'product_aliases',
  jt_crm_customer_product_aliases:       'customer_product_aliases',
  jt_crm_route_destinations:             'route_destinations',
  jt_crm_agent_attention_alerts:         'agent_attention_alerts',
  jt_crm_order_intake_events:            'order_intake_events',

  // Phase 7: Automated Daily Order Request
  jt_crm_order_request_config:           'order_request_config',
  jt_crm_order_reminders:                'order_reminders',

  // Phase 8: Production Hardening (error recovery)
  jt_crm_order_processing_errors:        'order_processing_errors',
};


// In-memory data store cache backed by localStorage & Supabase sync
const memoryStore = new Map<string, string>();
const previousRowIds = new Map<string, Set<string>>();
const syncTimers = new Map<string, number>();
let syncQueue: Promise<void> = Promise.resolve();

// Regex matching standard Postgres UUID format
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Broadcast database updates so React UI components refresh instantly. */
export function notifyDataUpdated(): void {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('crm_db_updated'));
  }
}

/** Read a stored table/object from in-memory cache, falling back to localStorage. */
export function storageGet(key: string): string | null {
  if (memoryStore.has(key)) {
    return memoryStore.get(key)!;
  }
  const fromLs = localStorage.getItem(key);
  if (fromLs !== null) {
    memoryStore.set(key, fromLs);
    return fromLs;
  }
  return null;
}

/** Write to memoryStore AND localStorage, AND schedule write-through to Supabase. */
export function storageSet(key: string, value: string): void {
  memoryStore.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('[Storage] localStorage.setItem failed:', e);
  }
  scheduleTableSync(key, value);
  notifyDataUpdated();
}

/** Prime memoryStore AND localStorage without triggering a Supabase write. */
export function storagePrime(key: string, value: string): void {
  memoryStore.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('[Storage] localStorage.setItem failed:', e);
  }
  notifyDataUpdated();
}

export function storageClear(): void {
  memoryStore.clear();
  previousRowIds.clear();
  notifyDataUpdated();
}

// --- Connection status ---------------------------------------------------------

export type SupabaseConnectionState = 'unknown' | 'online' | 'offline' | 'not_configured';

let connectionState: SupabaseConnectionState = 'unknown';
let lastConnectionError: string | null = null;
const connectionListeners = new Set<(state: SupabaseConnectionState) => void>();

/** Diagnostics for the UI: which host this build is pointed at and the key prefix in use. */
export function getSupabaseConfig(): {
  host: string | null;
  configured: boolean;
  keyPrefix: string;
} {
  let host: string | null = null;
  try {
    if (supabaseUrl) host = new URL(supabaseUrl).host;
  } catch {}
  const keyPrefix = supabaseAnonKey.length > 12 ? supabaseAnonKey.slice(0, 12) : supabaseAnonKey;
  return { host, configured: !!supabase, keyPrefix };
}

export function getSupabaseConnectionState(): SupabaseConnectionState {
  return connectionState;
}

export function getLastConnectionError(): string | null {
  return lastConnectionError;
}

export function subscribeToConnectionState(
  listener: (state: SupabaseConnectionState) => void
): () => void {
  connectionListeners.add(listener);
  return () => connectionListeners.delete(listener);
}

/**
 * Lightweight reachability probe against a real table. A paused/deleted project
 * resets the TLS connection and reports 'offline' so the UI can stop silently
 * falling back to seed data.
 */
export async function checkSupabaseConnection(): Promise<SupabaseConnectionState> {
  const { host, configured } = getSupabaseConfig();
  if (!configured) {
    lastConnectionError =
      'Supabase is not configured: set VITE_SUPABASE_URL + VITE_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) for this build.';
    connectionState = 'not_configured';
    connectionListeners.forEach((l) => l(connectionState));
    console.warn(`[Supabase] Not configured (host=${host}). ${lastConnectionError}`);
    return connectionState;
  }
  try {
    const { error } = await supabase!.from('teams').select('id').limit(1);
    if (error) {
      lastConnectionError = `${error.message} (${error.code || 'error'})`;
      connectionState = 'offline';
      console.error(`[Supabase] Reachability probe to ${host} failed:`, lastConnectionError);
    } else {
      lastConnectionError = null;
      connectionState = 'online';
      console.log(`[Supabase] Online — connected to ${host}`);
    }
  } catch (err) {
    lastConnectionError = err instanceof Error ? err.message : String(err);
    connectionState = 'offline';
    console.error(`[Supabase] Network error reaching ${host}:`, lastConnectionError);
  }
  connectionListeners.forEach((l) => l(connectionState));
  return connectionState;
}

// --- Write-through sync -------------------------------------------------------

function scheduleTableSync(key: string, value: string): void {
  const existing = syncTimers.get(key);
  if (existing) window.clearTimeout(existing);

  syncTimers.set(
    key,
    window.setTimeout(() => {
      syncTimers.delete(key);
      syncQueue = syncQueue
        .then(() => syncTableToSupabase(key, value))
        .catch((err) => console.error('[Supabase] write failed:', err));
    }, 400)
  );
}

async function syncTableToSupabase(key: string, value: string): Promise<void> {
  if (!supabase) return;
  const table = TABLE_MAP[key];
  if (!table) return;

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return;
  }

  const rawRows = Array.isArray(parsed) ? parsed : parsed == null ? [] : [parsed];
  const validRows = rawRows
    .filter(
      (row): row is Record<string, unknown> =>
        !!row &&
        typeof row === 'object' &&
        typeof (row as Record<string, unknown>).id === 'string' &&
        UUID_RE.test((row as Record<string, unknown>).id as string)
    )
    .map((row) => sanitizeRow(table, row));

  if (validRows.length === 0) return;

  // Batch upserts in chunks of 100 to prevent payload limits
  const BATCH_SIZE = 100;
  for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
    const chunk = validRows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`[Supabase] upsert ${table} batch ${Math.floor(i / BATCH_SIZE) + 1}:`, error.message);
      return;
    }
  }

  // Remove rows that were deleted locally
  const currentIds = new Set(validRows.map((row) => row.id as string));
  const previous = previousRowIds.get(key);
  if (previous && previous.size > 0) {
    const removed = [...previous].filter((id) => !currentIds.has(id));
    if (removed.length > 0) {
      const { error: delError } = await supabase.from(table).delete().in('id', removed);
      if (delError) console.error(`[Supabase] delete ${table}:`, delError.message);
    }
  }
  previousRowIds.set(key, currentIds);
}

/** Strips TypeScript-side joined/computed fields so only real Supabase columns are written. */
function sanitizeRow(table: string, row: Record<string, unknown>): Record<string, unknown> {
  const clean: Record<string, unknown> = { ...row };

  // Alias fields not present in database tables
  if (table === 'notifications') delete clean['user_id'];

  // Convert empty string UUID foreign keys to null so PostgreSQL UUID fields do not fail
  ['assigned_to', 'assigned_team_id', 'created_by', 'resolved_by', 'closed_by', 'reopened_by', 'customer_id', 'order_id', 'product_id', 'category_id', 'performed_by', 'author_id', 'uploaded_by', 'team_id', 'user_id', 'brand_id'].forEach((field) => {
    if (clean[field] === '') {
      clean[field] = null;
    }
  });

  Object.keys(clean).forEach((k) => {
    const v = clean[k];
    if (v !== null && typeof v === 'object') {
      delete clean[k];
    }
  });

  return clean;
}

// --- Hydration ----------------------------------------------------------------

/** Helper to fetch all rows for a table using pagination */
async function fetchAllRemoteRows(table: string): Promise<Record<string, unknown>[]> {
  const allRows: Record<string, unknown>[] = [];
  let page = 0;
  const PAGE_SIZE = 1000;
  while (true) {
    const { data, error } = await supabase!
      .from(table)
      .select('*')
      .range(page * PAGE_SIZE, (page + 1) * PAGE_SIZE - 1);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allRows.push(...(data as Record<string, unknown>[]));
    if (data.length < PAGE_SIZE) break;
    page++;
  }
  return allRows;
}

/**
 * Loads all Supabase tables into memory and localStorage.
 */
export async function initializeFromSupabase(): Promise<void> {
  if (!supabase) {
    console.warn('[Supabase] Client is null — VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY is missing.');
    return;
  }

  try {
    const entries = Object.entries(TABLE_MAP);

    const results = await Promise.allSettled(
      entries.map(([, table]) => fetchAllRemoteRows(table))
    );

    for (let i = 0; i < entries.length; i++) {
      const [lsKey] = entries[i];
      const result = results[i];

      if (result.status === 'rejected') {
        console.warn(`[Supabase] Failed to load ${TABLE_MAP[lsKey]}:`, result.reason);
        continue;
      }

      const remoteData = result.value || [];
      const remoteCount = remoteData.length;

      const localData = storageGet(lsKey);
      let localCount = 0;
      if (localData) {
        try {
          const parsedLocal = JSON.parse(localData);
          localCount = Array.isArray(parsedLocal) ? parsedLocal.length : (parsedLocal ? 1 : 0);
        } catch {}
      }

      if (remoteCount >= localCount && remoteCount > 0) {
        storagePrime(lsKey, JSON.stringify(remoteData));
        previousRowIds.set(
          lsKey,
          new Set(remoteData.map((row) => (row as { id?: unknown }).id as string))
        );
        console.log(`[Supabase] Loaded ${remoteCount} rows into '${lsKey}' from Supabase table '${TABLE_MAP[lsKey]}'.`);
      } else if (localCount > 0) {
        if (localData) {
          console.log(`[Supabase] Local dataset for '${lsKey}' (${localCount} rows) is larger than remote Supabase (${remoteCount} rows). Pushing local data to Supabase...`);
          await syncTableToSupabase(lsKey, localData);
        }
      }
    }
    notifyDataUpdated();
  } catch (err) {
    console.error('[Supabase] initializeFromSupabase failed:', err);
  }
}

/**
 * Clears local cache and re-hydrates completely from Supabase.
 */
export async function forceResyncFromSupabase(): Promise<boolean> {
  if (!supabase) return false;
  storageClear();
  await initializeFromSupabase();
  return true;
}



