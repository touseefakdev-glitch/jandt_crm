# J&T Supplies CRM — Phase 1 Performance Report

> Database & backend performance optimization. Measured against the live Supabase project
> (`lsibpbdxbyxhnbsgodxa`) on 2026-08-12.

---

## 1. Baseline Measurements (live project)

Raw read probe results against the production Supabase using the app's publishable key:

| Table | Row count (Content-Range) |
| --- | --- |
| `customers` | **393** |
| `products` | **1022** |
| `teams` | 1 |
| `profiles` | 1 |
| `orders` | 0 |
| `customer_queries` | 0 |
| `notifications` | 0 |
| `order_items` | 0 |
| `query_activities` | 0 |
| `daily_order_operations` | **404 — table does not exist** |

### Where the time goes today (before optimization)

1. **Full-table hydration on every login / mount.**
   `src/services/supabaseSync.ts` `initializeFromSupabase()` runs `select('*')` against **all 25
   tables** on (a) app mount and (b) every login. With 1022 products + 393 customers (full columns,
   including `description`, `availability_notes`, etc.) this downloads on the order of **1 MB+ of JSON**
   through the browser, JSON.parses it, writes it to `localStorage` (a synchronous, blocking write of
   the same 1 MB+), then re-renders the whole app via the `crm_db_updated` event.

2. **No server-side pagination, filtering, sorting, or search.**
   Every list page loads *everything* and then slices/filters/sorts in JavaScript:
   - `Customers.tsx` → `localDb.getCustomers()` (all 393) then `.slice()` for page 1 of 10.
   - `Products.tsx` → `localDb.getProducts()` (all 1022) then `.slice()`.
   - `Queries.tsx` → `localDb.getQueries()` (full), plus ~13 derived count memos that each re-scan.
   - `Notifications.tsx`, `OutOfStock.tsx`, `Dashboard.tsx`, `Header.tsx` → same pattern.
   - Search is `String.includes()` over the full array on every keystroke.

3. **Per-row localStorage writes + notification storms during CSV import.**
   `csvImporter.ts` `executeImport()` calls `localDb.createProduct/createCustomer` per row. Each
   write does `storageSet()` → `localStorage.setItem` (blocking full re-serialize of the growing
   array) + `notifyDataUpdated()` (React re-render) + a debounced Supabase upsert per row. 1000 rows
   ⇒ 1000 synchronous serializations, 1000 re-renders, 1000 debounce timers. Duplicate detection is
   O(n²) (`existingProducts.find(...)` inside the row loop).

4. **Supabase sync is fire-and-forget.**
   Each table has a 400 ms debounce + serialized write queue, but reads are never coordinated with
   writes — a freshly created record can be missing from a re-fetch that races the sync.

### Findings that affect the architecture

- **RLS in the live project permits anon reads** (the app uses only the publishable/anon key, no
  Supabase auth). `database/schema.sql` in this repo declares `auth.role() = 'authenticated'`
  policies, but the deployed project's dashboard policies differ. This means server-first queries
  **do work** today, but they must degrade gracefully if the project's RLS is ever tightened or the
  connection goes offline.
- **`public.daily_order_operations` does not exist in production** (404). `schema.sql` declares
  `error_query_id UUID REFERENCES public.queries(id)` — a table that doesn't exist
  (`queries`, not `customer_queries`) — so that CREATE TABLE fails. The Daily Order Operations
  workflow therefore runs entirely on `localStorage` and its rows never sync. **Deferred out of this
  phase; flagged for Phase 2.**
- **No Realtime subscriptions exist anywhere** in the codebase (grep: 0 hits). Nothing to remove.
  All live updates flow through localStorage → `crm_db_updated` event.
- **`orders` / `customer_queries` / `notifications` are currently empty** in production, so the
  biggest immediate win is customers + products.

---

## 2. What Changed (Phase 1)

### 2.1 Server-first list queries with real pagination, search, filter, sort
New `src/services/queryService.ts` + `src/hooks/useServerListQuery.ts`:

- List pages now query **one page at a time** from Postgres (`range()`), with `count=exact` for
  totals and **column selection** instead of `select('*')`.
- **Search/filter/sort happen in SQL** (ILIKE / eq / in / orderBy), not in the browser.
- Related display fields (`customer`, `order`, `product`, `category`, `assigned agent`) are joined
  via small column-selective lookups (`id, sku` / `id, company_name, customer_code`), not full tables.
- Search input is **debounced** (250–400 ms) via `useDebouncedValue`.
- In-flight requests are **deduplicated/cancelled** with `AbortController`.
- After any local write (`crm_db_updated`), pages silently re-fetch from the server (gated so
  hydration doesn't cause a refetch storm).

Migrated pages: Customers, Products, Queries, Notifications, Out of Stock, Dashboard (counts +
recent), Header (unread count + dropdown).

**Deferred (documented limitations):**
- `Orders.tsx` (Daily Order Operations) stays on `localDb` because its backing table is missing in
  production (see §1) — it is a write-heavy workflow tool, not a list page.
- Detail pages (`CustomerDetail`, `QueryDetail`, `ProductDetail`, `OrderDetail`) keep reading the
  hydrated `localDb` copy; they are single-record views and their in-page audit trails are small.
  Their freshness equals hydration freshness, same as today.

### 2.2 Hydration made lazy, cached, and TTL-bounded
- Hydration now runs **once per page load** (session guard) instead of on every login.
- Each table is only re-fetched if its local copy is **stale** (5-minute TTL) or missing.
- Hydration state is exposed (`isHydrating()`) so list hooks can skip refetches during it.

### 2.3 CSV import batching
- Duplicate detection now uses `Set`/`Map` lookups (O(n) instead of O(n²)).
- Rows are accumulated and written with a single **`storageSetBatch()`** per table (one localStorage
  write + one notify + one debounced sync instead of thousands).
- Supabase upserts are chunked (100/batch). Progress callbacks keep the UI responsive.
- `flushPendingSyncs()` lets pages force the debounced write queue to drain before a server re-read.

### 2.4 Database indexes
New `database/migrations/03_performance_indexes.sql`:
- `pg_trgm` GIN trigram indexes on the searched text columns (company name, product name, SKU,
  query subject, notification title/message) so `ILIKE '%…%'` uses indexes instead of seq scans.
- Composite + B-tree indexes on the filter/sort columns used by the new queries
  (status + created_at, priority + status, is_read + recipient, etc.) and on all `order_items`,
  `query_*` child-table FK columns.

---

## 3. After (expected) — to be filled with runtime measurements

| Metric | Before | After |
| --- | --- | --- |
| Customers page payload | all 393 rows, full columns | 10 rows/page, selected columns |
| Products page payload | all 1022 rows, full columns | 10 rows/page, selected columns |
| Search | full-array `includes()` per keystroke | SQL ILIKE (pg_trgm indexed), debounced |
| CSV import of 1000 rows | ~1000 localStorage writes + re-renders | 1 write/table + chunked upserts |
| Hydration | all 25 tables on every login | once per load + 5-min TTL |
| Detail-page correctness | reads stale hydrated copy | unchanged (documented) |

*(Runtime timing screenshots/console measurements to be appended after deploy.)*

---

## 4. Out of Scope / Follow-ups (Phase 2)

- Create `public.daily_order_operations` (and fix the `REFERENCES public.queries(id)` typo →
  `customer_queries`) and sync the Daily Order Operations storage key.
- Implement real Supabase Auth so `auth.role() = 'authenticated'` policies apply and per-user data
  isolation works.
- Add a Realtime subscription to `notifications` (and later business tables) for cross-agent live
  updates.
- Server-side file storage for `query_attachments` / `order_documents` (currently localStorage only).
