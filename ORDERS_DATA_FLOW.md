# Orders Data Flow & Persistence Architecture

This document specifies the technical architecture for Orders status data persistence and realtime synchronization in J&T Supplies CRM.

---

## 1. Core Architecture Principles

1. **Supabase = Single Source of Truth**
   - The authoritative data store for all Order operations is Supabase PostgreSQL (`daily_order_operations` and `orders` tables).
   - In-memory state, React state, and `localStorage` act purely as local caches.

2. **No Fake Success**
   - The UI does NOT mutate state or display success notifications permanently until Supabase confirms the mutation.
   - Flow: `User Action` → `Validate` → `Send Supabase UPSERT/UPDATE` → `Await Response` → `Confirm Success` → `Update Local Cache & UI`.

3. **Realtime Synchronization**
   - All connected browser sessions subscribe to Supabase Realtime changes (`INSERT`, `UPDATE`, `DELETE`) on `daily_order_operations` and `daily_order_operation_history`.
   - Incoming realtime changes are timestamp-checked (`updated_at` watermark) to prevent stale overwrites.

---

## 2. Table Schemas & Identifiers

### Primary Table: `public.daily_order_operations`

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` (PK) | Primary Key (Passed through all update flows) |
| `customer_id` | `UUID` (FK) | References `public.customers(id)` |
| `operation_date` | `DATE` | Operational Date (`YYYY-MM-DD`) |
| `route` | `VARCHAR(100)` | Operational Route/City Name |
| `order_received` | `BOOLEAN` | Stage 1 Status |
| `order_received_at` | `TIMESTAMPTZ` | Timestamp when Order Received was marked |
| `order_received_by` | `UUID` (FK) | References profile who performed step 1 |
| `sales_order_generated` | `BOOLEAN` | Stage 2 Status |
| `sales_order_number` | `VARCHAR(100)` | Sales Order Reference Number (SO-XXXXX) |
| `sales_order_generated_at` | `TIMESTAMPTZ` | Timestamp when SO was generated |
| `sales_order_generated_by` | `UUID` (FK) | References profile who performed step 2 |
| `invoiced` | `BOOLEAN` | Stage 3 Status |
| `invoice_number` | `VARCHAR(100)` | Commercial Invoice Number (INV-XXXXX) |
| `invoiced_at` | `TIMESTAMPTZ` | Timestamp when Invoiced |
| `invoiced_by` | `UUID` (FK) | References profile who performed step 3 |
| `dispatched` | `BOOLEAN` | Stage 4 Status |
| `dispatched_at` | `TIMESTAMPTZ` | Timestamp when Dispatched |
| `dispatched_by` | `UUID` (FK) | References profile who performed step 4 |
| `order_match` | `VARCHAR(10)` | Post-dispatch Match: `'SAME'` or `'DIFFERENT'` |
| `difference_note` | `TEXT` | Discrepancy details when match is `'DIFFERENT'` |
| `invoice_updated` | `BOOLEAN` | Post-dispatch invoice amendment flag |
| `pod_sent` | `BOOLEAN` | Stage 5 Status |
| `pod_sent_at` | `TIMESTAMPTZ` | Timestamp when Proof of Delivery sent |
| `pod_sent_by` | `UUID` (FK) | References profile who performed step 5 |
| `status` | `VARCHAR(50)` | Overall operation status |
| `operational_area` | `VARCHAR(20)` | `'KELOWNA'` or `'OUTSIDE_KELOWNA'` |
| `updated_at` | `TIMESTAMPTZ` | Database updated timestamp |
| `updated_by` | `UUID` (FK) | Last modifier profile |

---

## 3. Order Workflow Progression Sequence

```
ORDER RECEIVED (Step 1)
       ↓
SALES ORDER (Step 2 — SO Number Required)
       ↓
INVOICED (Step 3 — Invoice Number Required)
       ↓
DISPATCHED (Step 4)
       ↓
SO / INVOICE MATCH (Post-Dispatch — SAME / DIFFERENT)
       ↓
POD SENT (Step 5)
```

---

## 4. Mutation Flow

```
User Click in UI (Orders.tsx / OrderDetailDrawer.tsx / MobileOrderCard.tsx)
                  │
                  ▼
localDb.updateDailyOrderOperationStep(id, step, refNum, userId)
                  │
                  ▼
Build clean payload with UUID primary key & updated timestamps
                  │
                  ▼
supabase.from('daily_order_operations').upsert(cleanRow, { onConflict: 'id' }).select().single()
                  │
        ┌─────────┴─────────┐
        ▼                   ▼
     Success             Failure
        │                   │
Merge returned row       Throw Error
        │                   │
Update Local Cache       Catch in UI Handler
        │                   │
Notify UI Components     Display Error Toast
        │                Revert UI State
        ▼
Supabase Realtime Broadcasts Event
        │
        ▼
Other Connected Browsers Receive Event & Update UI Automatically
```

---

## 5. Verification Checkpoints

- **Row Level Security (RLS)**: Policies permit authenticated and anon app client operations (`FOR ALL USING (true) WITH CHECK (true)`).
- **Primary Key Integrity**: Every update query references `id` (UUID).
- **Zero-Row Mutation Handling**: If a query affects zero rows or returns an error, the operation throws an exception and local state remains unchanged.
- **Refresh Resilience**: A browser reload re-reads persisted data directly from Supabase.
