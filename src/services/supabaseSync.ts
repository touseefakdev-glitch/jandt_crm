import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

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
  jt_crm_product_history:    'product_availability_history',

  // Level 6: System & Logs
  jt_crm_system_settings:    'system_settings',
  jt_crm_audit_logs:         'audit_logs',
};

// In-memory data store cache backed by localStorage & Supabase sync
const memoryStore = new Map<string, string>();
const previousRowIds = new Map<string, Set<string>>();
const syncTimers = new Map<string, number>();
let syncQueue: Promise<void> = Promise.resolve();

// Regex matching standard Postgres UUID format
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
}

/** Prime memoryStore AND localStorage without triggering a Supabase write. */
export function storagePrime(key: string, value: string): void {
  memoryStore.set(key, value);
  try {
    localStorage.setItem(key, value);
  } catch (e) {
    console.warn('[Storage] localStorage.setItem failed:', e);
  }
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

  // Alias field not present in database table
  if (table === 'notifications') delete clean['user_id'];

  Object.keys(clean).forEach((k) => {
    const v = clean[k];
    if (v !== null && typeof v === 'object') {
      delete clean[k];
    }
  });

  return clean;
}

// --- Hydration ----------------------------------------------------------------

/**
 * Loads all Supabase tables into memory and localStorage.
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
