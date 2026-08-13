# Simplified 4-Field Customer Issue & Resolution Center (Queries Module)

## Overview

The **Queries Module** in JT Supplies CRM is designed as a fast 10–15 second customer problem report system. An agent receives a customer call/complaint and logs it immediately without filling complicated multi-step forms.

---

## 1. Core 4-Field Creation Form

Creating a new Query requires ONLY 4 simple inputs:

1. **Customer \***: Search by Customer Name (e.g. `ABC Medical Supplies`). Selecting a customer displays a quick confirmation badge (`ABC Medical Supplies — Kelowna`).
2. **Category \***: Dropdown with 6 short categories:
   - `Wrong Item Received`
   - `Return Request`
   - `Price Issue`
   - `Quality Issue`
   - `Item Not Received`
   - `Other`
3. **Reference** *(Optional)*: Selector for `Product` | `Invoice` | `Order` + search box to link a specific SKU, Invoice #, or Order # if applicable.
4. **Explain the issue \***: Large text area (`"Briefly explain what happened..."`).

---

## 2. Automatic Defaults & Workflow

- **Default Status**: Every newly created Query automatically starts as **`OPEN`** (`QRY-XXXXXX`).
- **Default Priority**: Defaults to `Normal` (`medium`).
- **No Initial Clutter**: Priority selectors, quantities, prices, action dropdowns, and assignee selectors are eliminated from initial creation.

---

## 3. Operations & Management Workflow

Management actions take place on the Query details page (`/queries/:id`):

```
+ NEW QUERY (10–15 sec)
       ↓
  Default OPEN
       ↓
Open Query Details (/queries/:id)
       ↓
 ┌─────────────────────────────────────────────────────────┐
 │ Management Actions:                                     │
 │ • Start Working (IN PROGRESS)                           │
 │ • Wait for Info (WAITING)                               │
 │ • Assign Agent                                          │
 │ • + Create Back Order (Queue item for next delivery)   │
 │ • Post Internal Notes                                   │
 │ • Resolve Query                                         │
 └─────────────────────────────────────────────────────────┘
       ↓
   RESOLVED / CLOSED
```

---

## 4. Back Orders Management

If a query involves missing items or items that need to be delivered later (e.g., `Item Not Received`), the user clicks **`+ Create Back Order`** on the Query Detail page.

The item is queued for the customer's next scheduled delivery date calculated in `America/Vancouver` Pacific time. Query resolution (`RESOLVED`/`CLOSED`) does not delete the Back Order record. Back Orders remain `PENDING`/`SCHEDULED` until dispatched.
