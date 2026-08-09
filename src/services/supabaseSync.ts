import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// localStorage key → Supabase table name mapping
export const TABLE_MAP: Record<string, string> = {
  jt_crm_teams:              'teams',
  jt_crm_users:              'profiles',
  jt_crm_customers:          'customers',
  jt_crm_query_categories:   'query_categories',
  jt_crm_queries:            'customer_queries',
  jt_crm_query_activities:   'query_activities',
  jt_crm_query_notes:        'query_internal_notes',
  jt_crm_query_attachments:  'query_attachments',
  jt_crm_notifications:      'notifications',
  jt_crm_orders:             'orders',
  jt_crm_order_items:        'order_items',
  jt_crm_order_history:      'order_status_history',
  jt_crm_order_documents:    'order_documents',
  jt_crm_product_categories: 'product_categories',
  jt_crm_product_brands:     'product_brands',
  jt_crm_products:           'products',
  jt_crm_product_history:    'product_availability_history',
  jt_crm_shifts:             'shifts',
  jt_crm_handovers:          'shift_handovers',
  jt_crm_handover_items:     'shift_handover_items',
  jt_crm_audit_logs:         'audit_logs',
  jt_crm_system_settings:    'system_settings',
};

// =============================================================================
// In-memory data store (Supabase-first)
//
// Business data is no longer persisted to localStorage. All reads are served
// from this in-memory store, which is hydrated from Supabase (initializeFromSupabase,
// called after a successful Supabase sign-in) and written through to Supabase
// (debounced + serialized) on every mutation via storageSet.
// =============================================================================

const memoryStore = new Map<string, string>();
const previousRowIds = new Map<string, Set<string>>();
const syncTimers = new Map<string, number>();
let syncQueue: Promise<void> = Promise.resolve();

// Matches the canonical Postgres UUID format used by Supabase primary keys.
// Demo seed records in db.ts use non-UUID ids (e.g. 'prod-0001-...') and are
// intentionally local-only; the authoritative DB seed lives in database/schema.sql.
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Read a stored table/object from the in-memory store. */
export function storageGet(key: string): string | null {
  return memoryStore.has(key) ? memoryStore.get(key)! : null;
}

/**
 * Write a table/object to the in-memory store and schedule a write-through to
 * Supabase. Callers remain synchronous; the Supabase write is debounced so rapid
 * local mutations coalesce into a single upsert of the final state.
 */
export function storageSet(key: string, value: string): void {
  memoryStore.set(key, value);
  scheduleTableSync(key, value);
}

/** Sets the in-memory store WITHOUT triggering a Supabase write (seeding / hydration). */
export function storagePrime(key: string, value: string): void {
  memoryStore.set(key, value);
}

export function storageClear(): void {
  memoryStore.clear();
  previousRowIds.clear();
}

// --- Write-through sync -------------------------------------------------------

function scheduleTableSync(key: string, value: string): void {
  const existing = syncTimers.get(key);
  if (existing) window.clearTimeout(existing);

  syncTimers.set(
    key,
    window.setTimeout(() => {
      syncTimers.delete(key);
      // Serialize writes to preserve parent→child FK ordering (e.g. orders before order_items).
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

  const { error } = await supabase.from(table).upsert(validRows, { onConflict: 'id' });
  if (error) {
    console.error(`[Supabase] upsert ${table}:`, error.message);
    return;
  }

  // Remove rows that were previously synced but no longer exist locally.
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

  // Legacy alias not present in the notifications schema
  if (table === 'notifications') delete clean['user_id'];

  Object.keys(clean).forEach((k) => {
    const v = clean[k];
    // JSON.parse never produces Date objects, so any object/array value is a join
    if (v !== null && typeof v === 'object') {
      delete clean[k];
    }
  });

  return clean;
}

// --- Hydration ----------------------------------------------------------------

/**
 * Loads all Supabase tables into the in-memory store so the sync LocalDatabaseService
 * facade serves live data. Must run AFTER authentication so RLS SELECT policies apply.
 * Tables that fail or are empty keep their current (seeded) contents.
 */
export async function initializeFromSupabase(): Promise<void> {
  if (!supabase) return;

  try {
    const entries = Object.entries(TABLE_MAP);

    const results = await Promise.allSettled(
      entries.map(([, table]) => supabase!.from(table).select('*'))
    );

    results.forEach((result, i) => {
      const [lsKey] = entries[i];
      if (result.status === 'rejected') {
        console.warn(`[Supabase] Failed to load ${TABLE_MAP[lsKey]}:`, result.reason);
        return;
      }
      const { data, error } = result.value;
      if (error) {
        console.warn(`[Supabase] Failed to load ${TABLE_MAP[lsKey]}:`, error.message);
        return;
      }
      if (data && data.length > 0) {
        storagePrime(lsKey, JSON.stringify(data));
        previousRowIds.set(
          lsKey,
          new Set(data.map((row) => (row as { id?: unknown }).id as string))
        );
      }
    });
  } catch (err) {
    console.error('[Supabase] initializeFromSupabase failed:', err);
  }
}
