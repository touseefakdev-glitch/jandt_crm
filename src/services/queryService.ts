import { supabase, isServerReadsBlocked } from './supabaseSync';
import {
  Customer,
  Product,
  CustomerQuery,
  CRMNotification,
  QueryCategory,
  ProductCategory,
  ProductBrand,
  Team,
  Order,
  UserProfile,
} from '../types';

/**
 * Server-first query layer (Phase 1).
 *
 * Every list/aggregate read goes to Postgres with server-side pagination,
 * SQL search/filter/sort, column selection, and small join lookups — instead of
 * downloading every table into localStorage and filtering in the browser.
 *
 * If Supabase is unavailable (no client, offline, or the anon key cannot read —
 * see supabaseSync.isServerReadsBlocked) these throw ServerUnavailableError and
 * the calling hook falls back to the local database service.
 */

export const LIST_PAGE_SIZE = 10;

export class ServerUnavailableError extends Error {
  constructor() {
    super('Server queries unavailable — falling back to local data.');
    this.name = 'ServerUnavailableError';
  }
}

function throwIfServerUnavailable(): void {
  if (!supabase || isServerReadsBlocked()) {
    throw new ServerUnavailableError();
  }
}

/** True when server-first queries can run (client configured + reads allowed). */
export function canUseServerQueries(): boolean {
  return !!supabase && !isServerReadsBlocked();
}

export interface ServerListResult<T> {
  data: T[];
  total: number;
}

/** Strips PostgREST `or()`-breaking characters from a search term. */
function orValue(term: string): string {
  return term
    .replace(/["(),]/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');
}

function ilikeClauses(term: string, columns: string[]): string {
  const clean = orValue(term);
  if (!clean) return '';
  const escaped = clean.replace(/%/g, '\\%').replace(/_/g, '\\_');
  return columns.map((c) => `${c}.ilike.*${escaped}*`).join(',');
}

/** Fetches referenced rows (column-selective) and returns an id → row map. */
async function lookupRows<T extends { id: string }>(
  table: string,
  select: string,
  ids: string[],
  limit = 500
): Promise<Map<string, T>> {
  const map = new Map<string, T>();
  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) return map;
  const CHUNK = 100;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const chunk = unique.slice(i, i + CHUNK);
    const { data, error } = await supabase!.from(table).select(select).in('id', chunk).limit(limit);
    if (error) throw error;
    (data as unknown as T[]).forEach((row) => map.set(row.id, row));
  }
  return map;
}

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export interface FetchCustomersParams {
  searchTerm?: string;
  status?: 'all' | 'active' | 'inactive';
  page: number;
  pageSize?: number;
  signal?: AbortSignal;
}

export async function fetchCustomersPage(
  params: FetchCustomersParams
): Promise<ServerListResult<Customer>> {
  throwIfServerUnavailable();
  const { searchTerm = '', status = 'all', page, pageSize = LIST_PAGE_SIZE } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase!.from('customers').select('*', { count: 'exact' });
  if (status !== 'all') query = query.eq('status', status);
  if (searchTerm.trim()) {
    const clauses = ilikeClauses(searchTerm, [
      'customer_code',
      'company_name',
      'contact_person',
      'phone',
      'whatsapp_number',
      'email',
      'city',
      'route',
    ]);
    if (clauses) query = query.or(`(${clauses})`);
  }
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;
  return { data: (data as Customer[]) || [], total: count || 0 };
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export interface FetchProductsParams {
  searchTerm?: string;
  availability_status?: string;
  category_id?: string;
  brand_id?: string;
  activeOnly?: boolean;
  page: number;
  pageSize?: number;
}

export async function fetchProductsPage(
  params: FetchProductsParams
): Promise<ServerListResult<Product>> {
  throwIfServerUnavailable();
  const {
    searchTerm = '',
    availability_status,
    category_id,
    brand_id,
    activeOnly,
    page,
    pageSize = LIST_PAGE_SIZE,
  } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase!.from('products').select('*', { count: 'exact' });
  if (availability_status && availability_status !== 'all') {
    query = query.eq('availability_status', availability_status);
  }
  if (category_id && category_id !== 'all') query = query.eq('category_id', category_id);
  if (brand_id && brand_id !== 'all') query = query.eq('brand_id', brand_id);
  if (activeOnly) query = query.eq('is_active', true);

  if (searchTerm.trim()) {
    const clauses = ilikeClauses(searchTerm, ['sku', 'product_name', 'description']);
    if (clauses) query = query.or(`(${clauses})`);
  }

  query = query.order('product_name', { ascending: true }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;
  const rows = (data as Product[]) || [];

  const categoryIds = rows.map((p) => p.category_id || '').filter(Boolean);
  const brandIds = rows.map((p) => p.brand_id || '').filter(Boolean);
  const [categories, brands] = await Promise.all([
    lookupRows<ProductCategory>('product_categories', 'id, name', categoryIds),
    lookupRows<ProductBrand>('product_brands', 'id, name', brandIds),
  ]);

  const enriched: Product[] = rows.map((p) => ({
    ...p,
    category: p.category_id ? categories.get(p.category_id) || null : null,
    brand: p.brand_id ? brands.get(p.brand_id) || null : null,
  }));

  return { data: enriched, total: count || 0 };
}

// ---------------------------------------------------------------------------
// Customer queries
// ---------------------------------------------------------------------------

const QUERY_SELECT_COLUMNS = [
  'id',
  'query_number',
  'customer_id',
  'order_id',
  'product_id',
  'subject',
  'description',
  'category_id',
  'priority',
  'status',
  'assigned_to',
  'assigned_team_id',
  'created_by',
  'created_at',
  'updated_at',
  'resolved_at',
  'resolved_by',
  'closed_at',
  'closed_by',
  'reopened_at',
  'reopened_by',
  'reopen_reason',
  'closure_reason',
].join(',');

export interface FetchQueriesParams {
  searchTerm?: string;
  status?: string;
  priority?: string;
  category_id?: string;
  assigned_to?: string;
  team_id?: string;
  workspace?: 'all' | 'my' | 'team';
  /** Team of the current user, applied when workspace === 'team'. */
  workspaceTeamId?: string;
  userId?: string;
  page: number;
  pageSize?: number;
}

export async function fetchQueriesPage(
  params: FetchQueriesParams
): Promise<ServerListResult<CustomerQuery>> {
  throwIfServerUnavailable();
  const {
    searchTerm = '',
    status,
    priority,
    category_id,
    assigned_to,
    team_id,
    workspace = 'all',
    workspaceTeamId,
    userId,
    page,
    pageSize = LIST_PAGE_SIZE,
  } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase!.from('customer_queries').select(QUERY_SELECT_COLUMNS, { count: 'exact' });

  if (workspace === 'my' && userId) query = query.eq('assigned_to', userId);
  else if (workspace === 'team' && workspaceTeamId) query = query.eq('assigned_team_id', workspaceTeamId);

  if (status && status !== 'all') {
    if (status === 'open') {
      query = query.in('status', ['new', 'open', 'assigned']);
    } else {
      query = query.eq('status', status);
    }
  }
  if (priority && priority !== 'all') query = query.eq('priority', priority);
  if (category_id && category_id !== 'all') query = query.eq('category_id', category_id);
  if (assigned_to && assigned_to !== 'all') query = query.eq('assigned_to', assigned_to);
  if (team_id && team_id !== 'all') query = query.eq('assigned_team_id', team_id);

  // Resolve the search term against related entities so the filter can run in SQL.
  if (searchTerm.trim()) {
    const clean = orValue(searchTerm);
    const clauses: string[] = ilikeClauses(clean, ['query_number', 'subject', 'description'])
      ? ilikeClauses(clean, ['query_number', 'subject', 'description']).split(',')
      : [];

    const [custIds, orderIds, productIds, profileIds] = await Promise.all([
      (async () => {
        const { data, error } = await supabase!
          .from('customers')
          .select('id')
          .or(`(${ilikeClauses(clean, ['company_name', 'customer_code', 'phone'])})`)
          .limit(100);
        if (error) throw error;
        return (data || []).map((r) => r.id as string);
      })(),
      (async () => {
        const { data, error } = await supabase!
          .from('orders')
          .select('id')
          .or(`(${ilikeClauses(clean, ['order_number'])})`)
          .limit(100);
        if (error) throw error;
        return (data || []).map((r) => r.id as string);
      })(),
      (async () => {
        const { data, error } = await supabase!
          .from('products')
          .select('id')
          .or(`(${ilikeClauses(clean, ['sku'])})`)
          .limit(100);
        if (error) throw error;
        return (data || []).map((r) => r.id as string);
      })(),
      (async () => {
        const { data, error } = await supabase!
          .from('profiles')
          .select('id')
          .or(`(${ilikeClauses(clean, ['full_name'])})`)
          .limit(100);
        if (error) throw error;
        return (data || []).map((r) => r.id as string);
      })(),
    ]);

    if (custIds.length) clauses.push(`customer_id.in.(${custIds.join(',')})`);
    if (orderIds.length) clauses.push(`order_id.in.(${orderIds.join(',')})`);
    if (productIds.length) clauses.push(`product_id.in.(${productIds.join(',')})`);
    if (profileIds.length) clauses.push(`assigned_to.in.(${profileIds.join(',')})`);

    if (clauses.length > 0) {
      query = query.or(`(${clauses.join(',')})`);
    }
  }

  query = query.order('updated_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;
  const rows = (data as unknown as CustomerQuery[]) || [];

  // Join related display entities with column-selective lookups.
  const [customers, categories, orders, products, profiles, teams] = await Promise.all([
    lookupRows<Customer>('customers', 'id, company_name, customer_code, status', rows.map((q) => q.customer_id)),
    lookupRows<QueryCategory>('query_categories', 'id, name', rows.map((q) => q.category_id || '')),
    lookupRows<Order>('orders', 'id, order_number', rows.map((q) => q.order_id || '')),
    lookupRows<Product>('products', 'id, sku', rows.map((q) => q.product_id || '')),
    lookupRows<{ id: string; full_name: string }>('profiles', 'id, full_name', [
      ...rows.map((q) => q.assigned_to || ''),
      ...rows.map((q) => q.created_by || ''),
    ]),
    lookupRows<Team>('teams', 'id, name', rows.map((q) => q.assigned_team_id || '')),
  ]);

  const enriched: CustomerQuery[] = rows.map((q) => {
    const assignedUser = q.assigned_to ? profiles.get(q.assigned_to) || null : null;
    const assignedTeamId = q.assigned_team_id || (assignedUser ? (assignedUser as { team_id?: string | null }).team_id || null : null);
    return {
      ...q,
      customer: q.customer_id ? customers.get(q.customer_id) || null : null,
      order: q.order_id ? orders.get(q.order_id) || null : null,
      category: q.category_id ? categories.get(q.category_id) || null : null,
      product: q.product_id ? products.get(q.product_id) || null : null,
      assigned_to_profile: assignedUser as UserProfile | null,
      assigned_team_id: assignedTeamId,
      assigned_team: assignedTeamId ? teams.get(assignedTeamId) || null : null,
      created_by_profile: q.created_by ? (profiles.get(q.created_by) as UserProfile | null) || null : null,
    };
  });

  return { data: enriched, total: count || 0 };
}

// ---------------------------------------------------------------------------
// Notifications
// ---------------------------------------------------------------------------

const NOTIFICATION_SELECT_COLUMNS = [
  'id',
  'recipient_user_id',
  'actor_user_id',
  'notification_type',
  'title',
  'message',
  'entity_type',
  'entity_id',
  'priority',
  'is_read',
  'read_at',
  'link_path',
  'created_at',
].join(',');

export interface FetchNotificationsParams {
  userId: string;
  unreadOnly?: boolean;
  /** Explicit read-state filter — `true` selects read notifications. */
  isRead?: boolean;
  priority?: string;
  entityType?: string;
  searchTerm?: string;
  page: number;
  pageSize?: number;
}

export async function fetchNotificationsPage(
  params: FetchNotificationsParams
): Promise<ServerListResult<CRMNotification>> {
  throwIfServerUnavailable();
  const {
    userId,
    unreadOnly,
    isRead,
    priority,
    entityType,
    searchTerm = '',
    page,
    pageSize = LIST_PAGE_SIZE,
  } = params;
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase!
    .from('notifications')
    .select(NOTIFICATION_SELECT_COLUMNS, { count: 'exact' })
    .eq('recipient_user_id', userId);

  if (unreadOnly) query = query.eq('is_read', false);
  else if (isRead === true) query = query.eq('is_read', true);
  if (priority && priority !== 'all') query = query.eq('priority', priority);
  if (entityType && entityType !== 'all') query = query.eq('entity_type', entityType);
  if (searchTerm.trim()) {
    const clauses = ilikeClauses(searchTerm, ['title', 'message', 'link_path']);
    if (clauses) query = query.or(`(${clauses})`);
  }
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  if (error) throw error;
  const rows = (data as unknown as CRMNotification[]) || [];

  const profiles = await lookupRows<{ id: string; full_name: string }>(
    'profiles',
    'id, full_name',
    rows.map((n) => n.actor_user_id || '')
  );
  const enriched: CRMNotification[] = rows.map((n) => ({
    ...n,
    user_id: n.recipient_user_id,
    priority: n.priority || 'normal',
    actor_profile: n.actor_user_id ? (profiles.get(n.actor_user_id) as UserProfile | null) || null : null,
  }));

  return { data: enriched, total: count || 0 };
}

// ---------------------------------------------------------------------------
// Out of stock
// ---------------------------------------------------------------------------

export interface FetchOutOfStockParams {
  searchTerm?: string;
  page: number;
  pageSize?: number;
}

export async function fetchOutOfStockPage(
  params: FetchOutOfStockParams
): Promise<ServerListResult<Product>> {
  const result = await fetchProductsPage({
    searchTerm: params.searchTerm,
    availability_status: 'out_of_stock',
    page: params.page,
    pageSize: params.pageSize,
  });
  return result;
}

// ---------------------------------------------------------------------------
// Counts (head queries)
// ---------------------------------------------------------------------------

async function countWhere(
  table: string,
  apply: (q: ReturnType<typeof createCountQuery>) => ReturnType<typeof createCountQuery> = (q) => q
): Promise<number> {
  let q = createCountQuery(table);
  q = apply(q);
  const { count, error } = await q;
  if (error) throw error;
  return count || 0;
}

function createCountQuery(table: string) {
  return supabase!.from(table).select('id', { count: 'exact', head: true });
}

export interface DashboardStats {
  totalCustomers: number;
  activeCustomers: number;
  totalProducts: number;
  activeProducts: number;
  outOfStock: number;
  discontinued: number;
  totalQueries: number;
  openQueries: number;
  urgentQueries: number;
  myOpenQueries: number;
  unreadNotifications: number;
  urgentNotifications: number;
}

const OPEN_QUERY_STATUSES = ['new', 'open', 'assigned', 'in_progress', 'reopened'];

export async function fetchDashboardStats(userId: string): Promise<DashboardStats> {
  throwIfServerUnavailable();

  const [
    totalCustomers,
    activeCustomers,
    totalProducts,
    activeProducts,
    outOfStock,
    discontinued,
    totalQueries,
    openQueries,
    urgentQueries,
    myOpenQueries,
    unreadNotifications,
    urgentNotifications,
  ] = await Promise.all([
    countWhere('customers'),
    countWhere('customers', (q) => q.eq('status', 'active')),
    countWhere('products'),
    countWhere('products', (q) => q.eq('is_active', true)),
    countWhere('products', (q) => q.eq('availability_status', 'out_of_stock')),
    countWhere('products', (q) => q.eq('availability_status', 'discontinued')),
    countWhere('customer_queries'),
    countWhere('customer_queries', (q) => q.in('status', OPEN_QUERY_STATUSES)),
    countWhere('customer_queries', (q) => q.eq('priority', 'urgent').not('status', 'in', '("closed","resolved")')),
    countWhere('customer_queries', (q) => q.eq('assigned_to', userId).not('status', 'in', '("closed","resolved")')),
    countWhere('notifications', (q) => q.eq('recipient_user_id', userId).eq('is_read', false)),
    countWhere('notifications', (q) => q.eq('recipient_user_id', userId).in('priority', ['urgent', 'high']).eq('is_read', false)),
  ]);

  return {
    totalCustomers,
    activeCustomers,
    totalProducts,
    activeProducts,
    outOfStock,
    discontinued,
    totalQueries,
    openQueries,
    urgentQueries,
    myOpenQueries,
    unreadNotifications,
    urgentNotifications,
  };
}

export interface QueryWorkspaceStats {
  all: number;
  my: number;
  team: number;
  myUrgent: number;
  myHigh: number;
  myWaiting: number;
  myInProgress: number;
  myResolved: number;
  teamNew: number;
  teamAssigned: number;
  teamInProgress: number;
  teamWaiting: number;
  teamUrgent: number;
}

export async function fetchQueryWorkspaceStats(
  userId: string,
  teamId?: string | null
): Promise<QueryWorkspaceStats> {
  throwIfServerUnavailable();

  const active = (q: ReturnType<typeof createCountQuery>) =>
    q.not('status', 'in', '("closed","resolved")');

  const [
    all,
    my,
    myUrgent,
    myHigh,
    myWaiting,
    myInProgress,
    myResolved,
    team,
    teamNew,
    teamAssigned,
    teamInProgress,
    teamWaiting,
    teamUrgent,
  ] = await Promise.all([
    countWhere('customer_queries'),
    countWhere('customer_queries', (q) => q.eq('assigned_to', userId)),
    countWhere('customer_queries', (q) => q.eq('assigned_to', userId).eq('priority', 'urgent').not('status', 'in', '("closed","resolved")')),
    countWhere('customer_queries', (q) => q.eq('assigned_to', userId).eq('priority', 'high').not('status', 'in', '("closed","resolved")')),
    countWhere('customer_queries', (q) => q.eq('assigned_to', userId).eq('status', 'waiting_customer')),
    countWhere('customer_queries', (q) => q.eq('assigned_to', userId).eq('status', 'in_progress')),
    countWhere('customer_queries', (q) => q.eq('assigned_to', userId).eq('status', 'resolved')),
    countWhere('customer_queries', (q) => q.eq('assigned_team_id', teamId || '00000000-0000-0000-0000-000000000000')),
    countWhere('customer_queries', (q) => q.eq('assigned_team_id', teamId || '').in('status', ['new', 'open'])),
    countWhere('customer_queries', (q) => q.eq('assigned_team_id', teamId || '').eq('status', 'assigned')),
    countWhere('customer_queries', (q) => q.eq('assigned_team_id', teamId || '').eq('status', 'in_progress')),
    countWhere('customer_queries', (q) => q.eq('assigned_team_id', teamId || '').eq('status', 'waiting_customer')),
    countWhere('customer_queries', (q) => q.eq('assigned_team_id', teamId || '').eq('priority', 'urgent').not('status', 'in', '("closed","resolved")')),
  ]);

  return {
    all,
    my,
    team: teamId ? team : 0,
    myUrgent,
    myHigh,
    myWaiting,
    myInProgress,
    myResolved,
    teamNew: teamId ? teamNew : 0,
    teamAssigned: teamId ? teamAssigned : 0,
    teamInProgress: teamId ? teamInProgress : 0,
    teamWaiting: teamId ? teamWaiting : 0,
    teamUrgent: teamId ? teamUrgent : 0,
  };
}

export async function fetchUnreadNotificationCounts(
  userId: string
): Promise<{ unread: number; urgent: number }> {
  throwIfServerUnavailable();
  const [unread, urgent] = await Promise.all([
    countWhere('notifications', (q) => q.eq('recipient_user_id', userId).eq('is_read', false)),
    countWhere('notifications', (q) =>
      q.eq('recipient_user_id', userId).eq('is_read', false).in('priority', ['urgent', 'high'])
    ),
  ]);
  return { unread, urgent };
}

export interface NotificationTabCounts {
  all: number;
  unread: number;
}

export async function fetchNotificationCounts(userId: string): Promise<NotificationTabCounts> {
  throwIfServerUnavailable();
  const [all, unread] = await Promise.all([
    countWhere('notifications', (q) => q.eq('recipient_user_id', userId)),
    countWhere('notifications', (q) => q.eq('recipient_user_id', userId).eq('is_read', false)),
  ]);
  return { all, unread };
}

export interface ProductTabCounts {
  all: number;
  outOfStock: number;
  discontinued: number;
}

export async function fetchProductTabCounts(): Promise<ProductTabCounts> {
  throwIfServerUnavailable();
  const [all, outOfStock, discontinued] = await Promise.all([
    countWhere('products'),
    countWhere('products', (q) => q.eq('availability_status', 'out_of_stock')),
    countWhere('products', (q) => q.eq('availability_status', 'discontinued')),
  ]);
  return { all, outOfStock, discontinued };
}
