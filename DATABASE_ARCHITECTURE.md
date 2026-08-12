# J&T Supplies CRM — Database Architecture & Data Sync Guide

> **Single Source of Truth:** Supabase PostgreSQL is the sole authoritative database for all production CRM data.

---

## 1. System Architecture Diagram

```
                              ┌───────────────────────────┐
                              │       VERCEL HOSTED       │
                              │       CRM FRONTEND        │
                              └─────────────┬─────────────┘
                                            │
                                            ▼
                              ┌───────────────────────────┐
                              │  SUPABASE CLIENT (JS SDK) │
                              │ (Anon Key / RLS Enforced) │
                              └─────────────┬─────────────┘
                                            │
               ┌────────────────────────────┴────────────────────────────┐
               ▼                                                         ▼
┌─────────────────────────────┐                           ┌─────────────────────────────┐
│    SUPABASE POSTGRESQL      │                           │      SUPABASE REALTIME      │
│  (Database Single Source)   │                           │ (Postgres Changes Push Engine)│
└─────────────────────────────┘                           └─────────────────────────────┘
```

---

## 2. Environment Variables & Security Rules

### Required Frontend Environment Variables
Set in `.env.local` for local development and in the **Vercel Project Settings ➔ Environment Variables** panel for production:

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

*(Alternative variable names supported for Vercel integration: `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`)*

### Strict Security Principles
1. **Anon Key Scope Only:** The frontend application only uses the Supabase Anonymous Key (`ANON_KEY`), which is subject to Row Level Security (RLS) policies.
2. **Service Role Key Security:** The `SUPABASE_SERVICE_ROLE_KEY` is **NEVER** exposed, bundled, or referenced in client-side code.
3. **No Fallback to Fake Local Databases:** If Supabase connection fails or credentials are missing, the UI displays a prominent `DatabaseErrorBanner` (*"Unable to connect to the CRM database. Please check your connection."*) with a 1-tap **Retry Connection** button rather than silently serving local storage or mock array data.

---

## 3. Data Mutation Flow

Every database mutation follows this strict progression contract:

```
  USER ACTION
      ↓
FRONTEND VALIDATION
      ↓
DIRECT SUPABASE WRITE (insert / update / upsert / delete)
      ↓
SUCCESSFUL RESPONSE ACKNOWLEDGMENT
      ↓
UI STATE UPDATE & REALTIME BROADCAST
```

If the Supabase PostgreSQL write fails (e.g. RLS violation or constraint error), the operation throws an explicit exception, a error toast is presented to the user, and the UI state is **not** updated.

---

## 4. PostgreSQL Table Mapping

| Module | Supabase Table | Realtime Enabled | Primary Key | Description |
| ------ | -------------- | ---------------- | ----------- | ----------- |
| **Teams** | `teams` | Yes | `id` (UUID) | Shift teams and schedules |
| **Profiles** | `profiles` | Yes | `id` (UUID) | User profiles & assigned operational areas |
| **Customers** | `customers` | Yes | `id` (UUID) | Customer directory, routes, cities |
| **Products** | `products` | Yes | `id` (UUID) | Product catalog & availability status |
| **Product Categories** | `product_categories` | Yes | `id` (UUID) | Product taxonomy categories |
| **Product Brands** | `product_brands` | Yes | `id` (UUID) | Product brand taxonomy |
| **Daily Operations** | `daily_order_operations` | Yes | `id` (UUID) | Route-based daily order operations & workflow steps |
| **Daily Op History** | `daily_order_operation_history` | Yes | `id` (UUID) | Audit timeline for order step transitions & reversions |
| **Support Queries** | `customer_queries` | Yes | `id` (UUID) | Customer support tickets & issues |
| **Query Activities** | `query_activities` | Yes | `id` (UUID) | Query lifecycle status & assignment history |
| **Query Notes** | `query_internal_notes` | Yes | `id` (UUID) | Agent internal discussion notes |
| **Query Attachments** | `query_attachments` | Yes | `id` (UUID) | Linked files and image attachments |
| **Shift Handovers** | `shift_handovers` | Yes | `id` (UUID) | Shift transition notes & handover tracking |
| **Notifications** | `notifications` | Yes | `id` (UUID) | Event notifications for agents and admins |
| **Audit Logs** | `audit_logs` | No | `id` (UUID) | Immutable audit log of administrative actions |

---

## 5. Local Storage Policy

`localStorage` is strictly restricted to non-critical UI display preferences:
- `jt_crm_sidebar_collapsed` (`true` / `false`)
- `jt_crm_theme_mode` (`light` / `dark`)

`localStorage` is **NEVER** used to persist, shadow, or act as an authoritative store for CRM database tables.
