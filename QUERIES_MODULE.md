# Customer Issue & Resolution Center (Queries Module) — v1.37.0 Specification

## Overview

The **Queries Module** in J&T CRM has been completely audited and rebuilt into a simple, non-technical **Customer Issue & Resolution Center**.

It is specifically tailored for daily operational workflow handling customer issues:
1. **Wrong Item Received** (`wrong_item`)
2. **Item Return / Invoice Change Request** (`invoice_change`)
3. **Price Issue** (`price_issue`)
4. **Quality Issue** (`quality_issue`)
5. **Item Not Received** (`item_not_received`)
6. **Item Returned** (`item_returned`)
7. **Back Order / Send on Next Delivery** (`back_order`)
8. **Other Customer Issue** (`other`)

---

## Core Operational Questions

Every customer issue record immediately answers four fundamental operational questions:

| Question | CRM Implementation |
|---|---|
| **WHO?** | Customer Company Name, Customer Code, Phone, WhatsApp, City, Route, Next Delivery Date |
| **WHAT?** | Product Item Name, SKU, Catalog Price, Order #, Expected vs Billed Price / Received Item |
| **WHAT TO DO?** | Resolution Action (`Replace Item`, `Return Item`, `Credit Customer`, `Correct Invoice`, `Correct Price`, `Send on Next Delivery`) |
| **IS IT DONE?** | Issue Status (`OPEN`, `IN_PROGRESS`, `WAITING`, `RESOLVED`, `CLOSED`) |

---

## Independent Back Order Subsystem

### Business Rule
> **Closing or resolving a Customer Issue does NOT cancel or delete a pending Back Order.**

- When a customer issue is logged with action *"Send on Next Delivery"* or category *"Item Not Received"* / *"Back Order"*, a dedicated **Back Order** record is automatically created in `public.back_orders`.
- **Next Delivery Date Calculation**: Calculated dynamically using the customer's route/city delivery schedule in `America/Vancouver` Pacific time.
- **Statuses**: `PENDING` ➔ `SCHEDULED` ➔ `SENT` ➔ `COMPLETED`.
- Back orders remain visible and active in the **Pending Back Orders** view tab until physically fulfilled and marked `COMPLETED`.

---

## Database Architecture

### Supabase Table: `public.queries`
- `issue_type`: VARCHAR(100) (1 of 8 primary categories)
- `action_required`: VARCHAR(100)
- `expected_price`: NUMERIC(12,2)
- `charged_price`: NUMERIC(12,2)
- `price_difference`: NUMERIC(12,2)
- `expected_item`: VARCHAR(255)
- `received_item`: VARCHAR(255)
- `quantity_affected`: NUMERIC(10,2)
- `invoice_number_ref`: VARCHAR(100)
- `back_order_id`: UUID

### Supabase Table: `public.back_orders`
- `id`: UUID (Primary Key)
- `query_id`: UUID (FK ➔ `queries.id`)
- `customer_id`: UUID (FK ➔ `customers.id`)
- `product_id`: UUID (FK ➔ `products.id`)
- `product_name_snapshot`: VARCHAR(255)
- `sku_snapshot`: VARCHAR(100)
- `quantity`: NUMERIC(10,2)
- `reason`: TEXT
- `original_order_id`: UUID (FK ➔ `orders.id`)
- `original_order_number`: VARCHAR(100)
- `original_delivery_date`: DATE
- `next_delivery_date`: DATE (America/Vancouver route schedule)
- `status`: VARCHAR(50) (`PENDING` | `SCHEDULED` | `SENT` | `COMPLETED`)
- `created_at`, `updated_at`: TIMESTAMPTZ

---

## User Workflows

### 1. Logging a Customer Issue (`+ NEW CUSTOMER ISSUE`)
1. Click **+ New Customer Issue** from header or toolbar.
2. **Step 1 (WHO)**: Search and select Customer. Live panel reveals customer contact info, open queries, and pending back orders.
3. **Step 2 (WHAT TYPE)**: Select 1 of 8 visual issue category cards.
4. **Step 3 (ITEM/ORDER)**: Select catalog product and/or customer order.
5. **Step 4 (DETAILS)**: Provide title, problem description, and issue-specific fields (prices, items, quantities).
6. **Step 5 (ACTION & SAVE)**: Select required resolution action and toggle optional Back Order creation. Save.

### 2. Resolving a Customer Issue
1. Open Query Detail (`/queries/:id`).
2. Click **Start Working** (`IN_PROGRESS`).
3. Click **Resolve Issue** (`RESOLVED`). Resolution text is saved and timestamped with agent ID.
4. Click **Close Issue** (`CLOSED`).
