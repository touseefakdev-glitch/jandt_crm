# Changelog

All notable changes to the **J&T Supplies CRM** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

## [1.34.1] - 2026-08-12

### Fixed & Security
- **Critical Bug Fix — Customer Update Persistence & Error Handling.**
  - **Awaited Supabase `.update()`**: Converted `localDb.updateCustomer`, `createCustomer`, and `toggleCustomerStatus` to `async` methods that await direct targeted Supabase PostgreSQL updates (`supabase.from('customers').update(payload).eq('id', customerId).select().single()`).
  - **Explicit Error Propagation**: Removed swallowed background Promise errors. If Supabase returns an error, the operation throws an exception, presents an error toast (*"Customer could not be updated: [error]"*), and leaves the form open for correction without falsely claiming success.
  - **Race Condition Resolution**: Prevented `refreshCustomers()` from fetching stale un-updated data by awaiting the Supabase update response before triggering list refetches.
  - **Double-Submission Prevention**: Added `isSubmitting` state to `CustomerFormModal.tsx` to disable the submit button while database requests are pending.
  - **Documentation**: Updated `DATABASE_ARCHITECTURE.md` and `CHANGELOG.md`.

## [1.34.0] - 2026-08-12

### Changed & Security
- **Critical Database Audit — Made Supabase PostgreSQL the Single Source of Truth.**
  - **Eliminated `localStorage` Database Mirroring**: Removed local storage table writes and reads for CRM database tables. `localStorage` is restricted strictly to non-critical UI display preferences (`sidebar_collapsed`, `theme_mode`).
  - **Direct Supabase Single Source of Truth**: All operational modules (**Customers**, **Products**, **Orders / Daily Operations**, **Queries**, **Users / Profiles**, **Teams & Schedules**, **Shift Handovers**, **Notifications**) write and read directly from Supabase PostgreSQL.
  - **Database Connection Error State**: Added `DatabaseErrorBanner.tsx` component so that when Supabase is unreachable or unconfigured, an explicit connection error state (*"Unable to connect to the CRM database. Please check your connection."*) with a 1-tap **Retry Connection** button is rendered, avoiding silent fallback to fake local data.
  - **Security & Service Role Audit**: Confirmed `SUPABASE_SERVICE_ROLE_KEY` is not exposed in frontend code. Client uses RLS-enforced anonymous key (`VITE_SUPABASE_ANON_KEY`).
  - **Documentation**: Created `DATABASE_ARCHITECTURE.md`; updated `PROJECT_SPEC.md` and `CHANGELOG.md`.

## [1.33.0] - 2026-08-12

### Changed
- **Order Workflow Change — Moved Sales Order vs. Invoice Matching to After Dispatch.**
  - **New Workflow Sequence**: `Order Received` ➔ `Sales Order` ➔ `Invoiced` ➔ `Dispatched` ➔ `SO vs Invoice Match` ➔ `POD Sent`.
  - **Invoice Creation Scope**: Creating an invoice sets `invoiced = true`. It does **not** trigger matching, set match results, or auto-complete the order.
  - **Post-Dispatch Match Gate**: Before dispatch (`!op.dispatched`), matching status shows `⏳ Wait for Dispatch`. After dispatch (`op.dispatched === true`), matching becomes active (`MATCH REQUIRED` / `Check Match`).
  - **POD Advancement Gate**: Advancing to `POD Sent` requires the post-dispatch match to be completed (`MATCHED_SAME` or `MATCHED_DIFFERENT` with an updated invoice).
  - **Next Action Banner**: Updated to guide agents sequentially (`NEXT: DISPATCH ORDER` ➔ `NEXT: MATCH SALES ORDER WITH INVOICE` ➔ `NEXT: SEND POD`).
  - **Validation & Guards**: `updateDailyOrderMatch` in `src/services/db.ts` enforces `op.dispatched === true`.
  - **Documentation**: Updated `PROJECT_SPEC.md`, `MOBILE_UX.md`, and `CHANGELOG.md`.

## [1.32.0] - 2026-08-12

### Added & Changed
- **Mobile Orders Module — Complete Mobile Responsive UX Renovation.**
  - **Mobile Card Architecture**: On viewports `< 768px`, desktop data tables on **Orders**, **Queries**, and **Customers** automatically switch to purpose-built **Mobile Cards** (`MobileOrderCard.tsx`, `MobileQueryCard.tsx`, `MobileCustomerCard.tsx`) designed for 1-tap readability and fast action execution.
  - **Mobile Bottom Navigation Bar (`MobileBottomNav.tsx`)**: Fixed bottom navigation bar on mobile screen (`md:hidden`) with `Home`, `Orders`, `Queries`, `Customers`, and a slide-up **More** operations sheet for Shift Handover, Out of Stock, Notifications, and Admin shortcuts.
  - **NEXT ACTION Prominent Banner**: Every mobile order card prominently highlights what step comes next (e.g. `NEXT: GENERATE SALES ORDER` with a 1-tap `[Execute]` button or `✓ ALL STAGES COMPLETED`).
  - **Mobile Filter Rails**: Horizontally scrollable filter chips (`overflow-x-auto`) for quick stage filtering (`All`, `Pending`, `Received`, `SO`, `Invoiced`, `Dispatched`, `POD`, `Exceptions`).
  - **Zero Horizontal Page Scroll**: Guaranteed 0 page-level horizontal scrolling across target mobile screen sizes (`320px`, `360px`, `375px`, `390px`, `414px`, `430px`, `768px`).
  - **Mobile Touch Targets**: All interactive elements satisfy the **44px minimum touch area** standard.
  - **Mobile Dashboard**: Responsive 2-column KPI grid (`grid-cols-2 gap-3`) on mobile for operational summary metrics.
  - **Documentation**: Added `MOBILE_UX.md`; updated `PROJECT_SPEC.md` and `CHANGELOG.md`.
- **No business logic, database structure, Supabase sync, API contracts, workflow logic, or authentication rules changed** — strictly frontend mobile visual/UX renovation.

## [1.31.0] - 2026-08-12

### Changed
- **Premium CRM UI/UX Renovation — Soft 3D / Depth-first design for 1920×1080 desktops.**
  - **Full-width fluid layout**: `AppShell` content now spans the full viewport (max 1920px) beside the sidebar instead of being capped at `max-w-7xl`. Main content automatically consumes the workspace; **no page-level horizontal scrolling** at 1920px. Oversized tables scroll inside their own `crm-table-scroll` wrapper only.
  - **Design tokens**: refined palette (deep navy `#102A43`, electric teal `#00A6A6`, surfaces `#F4F7FB`/`#FFFFFF`/`#DCE4EF` borders, text `#132A4A`), layered shadow stack (`card` → `elevated` → `popover` → `overlay` + `lift`/`glow-teal`/`inset-top`), `panel` radius (16px), Inter 800 weight, radial-tinted premium page background, and a `shimmer` skeleton animation.
  - **App shell**: sidebar narrowed to `240px` expanded / `72px` collapsed with a navy-gradient brand header, gradient active-route tint + teal indicator; sticky 56px **glass header** (`backdrop-blur`).
  - **Reusable primitives**: new `WorkflowStepper` (horizontal 5-stage progress rail with done/current/pending/error states) wired into the Order Detail drawer; premium `StatCard` (KPI with hover lift, gradient accent bar, optional trend indicator); elevated `Button` (teal gradient primary, hover lift), `Card` header gradient, `Modal`/`Drawer` (16px radius, blur backdrop, gradient headers), `Toast` (gradient accent bar), `Skeleton` (shimmer sweep), `Tabs`, `Pagination` (gradient active page), `Badge`, `PageHeader` (decorative gradient glow).
  - **Dashboard redesign**: operations-first control center — operational KPI row (Orders Today / Pending / Support Queries / Dispatched), Order Activity feed, Workflow Quick Status funnel with per-stage progress, active-support-ticket table, and secondary catalog/customer/notification metrics. Daily-order metrics are derived read-only from the existing local store (`getDailyOrderOperations`).
  - **Admin nav**: admin tab bar now wraps (no internal horizontal scroll) with navy-gradient active pills.
  - **Documentation**: added `DESIGN_SYSTEM.md`; updated `PROJECT_SPEC.md` with the new UI/UX architecture and design tokens.
- **No business logic, database, auth, Supabase, routes, orders workflow, queries workflow, or permissions changed** — strictly visual/UX/layout/component work.

## [1.30.0] - 2026-08-12

### Changed
- **Rolled back the recent role/permission integration and restored the previous stable CRM behavior.**
  - Removed the role-based Operations/Queries UI, capability model (`src/services/access.ts`), permission-derived sidebar sections, My Work center (`/my-work` + `MyWorkQueues`), and the query `verified` status flow (four-eyes verification) with its database migration (`05_query_verified_status.sql`).
  - Removed the role-test demo accounts (Tauseef Ali, Sukhjeet) and Team 2 from local seed data; `database/seed.sql` and `src/services/db.ts` restored to the pre-role account set.
  - Orders, Queries, Customers, Products, the KELOWNA / OUTSIDE KELOWNA operational areas, the full order workflow (Order Received → Sales Order → Invoiced → Dispatched → POD Sent, Order Match, Exceptions), Supabase Realtime, and the pre-existing performance work are unchanged.
  - No application data was deleted; database objects added by the role work (the `verified` enum value, `verified_at` / `verified_by` columns) may remain in Supabase temporarily and are unused by the app.

## [1.28.0] - 2026-08-12

### Added
- **Orders Module Realtime Rebuild**:
  - **Workflow extension**: new `POD Sent` step (after `Dispatched`) and `Order Match` adjudication (`SAME` / `DIFFERENT` with optional `difference_note` + `invoice_updated`) on daily order operations, plus an `Operational Error` path (`exception_status = ERROR`, exception note, `error_query_id` → `customer_queries`).
  - **Operational areas**: `profiles.operational_area` (`KELOWNA` / `OUTSIDE_KELOWNA` / `BOTH`), per-operation area derived from route schedule portal, area-scoped visibility in the Orders module. Editable in Admin Users (UserFormModal).
  - **Realtime sync**: new `src/services/realtime.ts` — Postgres Changes subscription on `daily_order_operations` + `daily_order_operation_history` merged into the local store (no feedback loop) with a 30s polling fallback; Orders page shows a live sync badge (`Live Sync` / `Auto-Refresh` / `Local Only`).
  - **Order Match UI**: `OrderMatchModal` on the Orders table to confirm same/different with invoice-updated flag.
  - **Orders table**: 12-column layout with `POD Sent` and `Order Match` columns, pagination (25/page), upcoming-date navigation chips, and a `Tomorrow` shortcut.
  - **Best-effort Supabase auth**: `AuthContext.login` now also calls `supabase.auth.signInWithPassword` so RLS-secured tables work in the cloud.
  - **Backend**: `getDailyOrderOperations` is operational-area aware; new `updateDailyOrderMatch`, `setDailyOrderException`, `clearDailyOrderException`, `getOperationalDatesForRange`; `updateDailyOrderOperationStep` / `revertDailyOrderOperationStep` extended with `pod_sent`; new audit actions (`daily_operation_pod_sent`, `daily_operation_match_updated`, `daily_operation_exception_flagged`, `daily_operation_exception_cleared`).
- **Database migration** `database/migrations/04_orders_realtime.sql`: workflow columns + backfills, `update_daily_order_operations_modtime` trigger, RLS on `route_schedules` / `daily_order_operations` / `daily_order_operation_history` with area-scoped policies (legacy anon seed policies dropped), `supabase_realtime` publication, and Orders-module indexes. `database/schema.sql` + `seed.sql` updated (incl. fixed FK `error_query_id` → `customer_queries`).
  - **Self-creates missing tables**: the deployed DB may not have `route_schedules`, `daily_order_operations`, or `daily_order_operation_history` yet (the app previously kept them only in localStorage, so sync never created them). The migration now `CREATE TABLE IF NOT EXISTS` all three before altering/backfilling, so it runs cleanly on a DB that has never seen the Orders module.

### Note
- After applying migration 04, Supabase Auth users must exist for the seeded profile emails (their passwords) — the app logs into Supabase Auth on login; without an authenticated session the migrated tables are read-only to the app.

---

## [1.27.0] - 2026-08-12

### Removed
- **WhatsApp Module completely removed** from the CRM. This is a breaking removal — no WhatsApp code, runtime, or UI remains.
  - **Deleted pages/routes**: WhatsApp Inbox (`/whatsapp-conversations`), WhatsApp Monitor (`/whatsapp-monitor`), Admin WhatsApp Settings (`/admin/whatsapp-settings`), Admin Order Requests (`/admin/order-requests`), and the WhatsApp Simulator.
  - **Deleted components**: `AttentionAlertPopups` (removed from `AppShell`) and the global in-app popup center.
  - **Deleted services**: `whatsappConnectorService`, `whatsappIngestionService`, `whatsappMonitoringService`, `messageClassifier`, `orderParser`, `productMatcher`, `resilientProcessing`, `textNormalizer`, `messagingService`, `orderDraftService`, `aiService`, `attentionAlertService`, `dailyOrderRequestCore`, `dailyOrderRequestService`, `routeRoutingService`.
  - **Deleted infrastructure**: Baileys Node.js worker microservice (`./connector`), `api/` serverless cron function (`/api/daily-order-request`), and `vercel.json` cron schedule.
  - **Removed dependencies**: `@whiskeysockets/baileys`, `qrcode`, `qrcode-terminal`, `@types/qrcode`, `pino`, `dotenv`; removed `whatsapp` and `start` npm scripts (lockfile pruned).
  - **Removed data access**: WhatsApp-specific types, storage keys, seed entries, reset paths, and the "WhatsApp Order Intelligence — Phase A" data-access layer in `db.ts`; WhatsApp `TABLE_MAP` entries in `supabaseSync`; WhatsApp permission methods; `whatsapp.attention_required` notification type and `notifyWhatsAppAttentionRequired`.
  - **Removed database objects** (see `database/migrations/02_remove_whatsapp.sql`, destructive): tables `whatsapp_contacts`, `whatsapp_conversations`, `whatsapp_messages`, `order_drafts`, `order_draft_items`, `product_aliases`, `customer_product_aliases`, `route_destinations`, `agent_attention_alerts`, `order_intake_events`, `order_request_config`, `order_reminders`, `order_processing_errors`, `whatsapp_connector_status`, `whatsapp_outbox`, `whatsapp_baileys_auth`; enums `message_classification`, `order_draft_status`, `match_method`, `attention_priority`, `alert_status`, `bot_status`. `database/schema.sql` updated accordingly.
  - **Kept by design**: customer `whatsapp_number` field (contact data, still displayed/editable in Customers, Customer Detail, CSV import, and customer search), the CRM Query module, and all CRM business data.
- **Documentation**: Removed all WhatsApp architecture/spec sections from `PROJECT_SPEC.md`; removed `database/migrations/01_whatsapp_cloud_infrastructure.sql`; deleted `tests/` (WhatsApp pipeline tests), `scripts/matchContactsAndUpdateSupabase.ts` (hardcoded local paths + leaked key).
- Verified with `npx tsc --noEmit` (exit 0) and `npm run build` (exit 0).

---

## [1.26.0] - 2026-08-11

### Added
- **Enterprise CRM UI/UX Design System**:
  - **Design tokens**: Curated palette (deep navy `#102A43`, electric teal `#00A6A6`, warm amber `#F2B84B`, success green `#2E8B57`, error red `#D64545`, surface grays `#F5F7FA`/`#FFFFFF`/`#E9EFF5`/`#D9E2EC`), border radii (cards 12px, buttons/inputs 8px, badges pill), and a layered shadow system (xs → overlay Layer 1–3) defined in `tailwind.config.js`, with a design-system CSS layer in `src/index.css`.
  - **Data Table System**: Rewritten `Table` primitive — self-contained `overflow-x-auto` scroller, `minWidth`/`stickyHeader` support, per-column `width`/`align`, `truncate` (ellipsis + native `title` tooltip) and `maxWidth`. Every data table in the app now applies explicit column widths + truncation, eliminating text collisions and horizontal overflow.
  - **Reusable primitives**: New `TableToolbar` (search / filter tabs / clear-filters container), `Tooltip`, `Checkbox`, `Drawer`, `ErrorState`, `DataTable`, and `Skeleton` loading placeholders; upgraded `Card` (`flush`/`elevated`/`hoverable`), `Button` (iconOnly/sizes), `PageHeader`, `Modal`, `EmptyState` (with actions), `StatCard`.
  - **App Shell**: Rewritten `AppShell` + `Sidebar` (brand header, active-route indicator, section groups, shift footer, mobile drawer, collapsed rail).
  - **Full page migration** to the design system: Customers, Products, Orders, OutOfStock, Queries, Notifications, Dashboard, WhatsApp Conversations, WhatsApp Monitor, all tabular admin pages, and detail pages (Customer, Product, Order, Query, ShiftHandover). Toolbars converted to `TableToolbar`, overflow cards to `Card flush`, and all raw `<table>` markup replaced with the enterprise `Table`.
- Verified with `npx tsc --noEmit` (exit 0) and `npm run build` (exit 0).

---

## [1.25.0] - 2026-08-11

### Added
- **WhatsApp Cloud Infrastructure**:
  - **Removed production local dependencies**: Removed production dependency on local personal PC, local Windows paths, local IP addresses, browser state, local terminal windows, and local filesystem auth.
  - **Cloud worker module** (`./connector`): Isolated 24/7 persistent Baileys Node.js 22 worker microservice with `Dockerfile` and `railway.json` for 1-click deployment on Railway, Render, Fly.io, or VPS.
  - **Persistent Supabase auth store**: Implemented `useSupabaseAuthState` storing Baileys session keys directly into Supabase `whatsapp_baileys_auth` database table. Authentication state survives container redeployments and server restarts without local disk dependencies.
  - **Connector health & heartbeat**: Implemented 15-second heartbeat loop updating `whatsapp_connector_status` in Supabase; derived `OFFLINE` status if heartbeat exceeds 45 seconds.
  - **Outbound message queue (`whatsapp_outbox`)**: Added database outbox queue (`PENDING`, `SENDING`, `SENT`, `FAILED`, `RETRYING`) allowing CRM agents and automated services to queue messages for asynchronous cloud dispatching.
  - **Inbound message deduplication**: Enforced idempotency check using WhatsApp `message.key.id` to prevent duplicate message ingestion.
  - **Admin WhatsApp Dashboard** (`/admin/whatsapp-settings`): Created live Admin UI showing connection status, heartbeat freshness, daily message traffic, outbox queue metrics, live QR code pairing display, request reconnect button, and unlink session controls.
  - **Resilient auto-reconnect**: Exponential backoff reconnection algorithm (3s → 6s → 12s → 24s → max 60s) on WebSocket drops.
  - **Documentation**: Updated `PROJECT_SPEC.md` with complete "Production WhatsApp Infrastructure" specification section.

---

## [1.24.0] - 2026-08-11

### Added
- **WhatsApp Ordering — Phase 8 (Production Hardening)**:
  - **Duplicate protection (idempotency)**: `confirmDraft` no longer creates a second order — drafts already `CONFIRMED`/`FORWARDED` return the existing draft with "no duplicate will be created"; `forwardConfirmedOrderToRoute` guards on status `FORWARDED`; ingestion keeps message-level dedupe; reminders keep `(customer_id, delivery_date)` dedupe.
  - **Full audit trail**: typed `OrderIntakeEventType` union (24 events incl. `message_classified`, `clarification_requested`, `order_created`, `draft_rejected`, `draft_edited`, `route_forwarded`, `retry_queued`, `processing_error`); new CRM audit actions `order_draft_rejected`, `order_draft_edited`, `order_forwarded`, `processing_error_recorded`, `processing_error_resolved`.
  - **Monitoring dashboard** (`/whatsapp-monitor`, new main-nav tab): 7 KPIs (Messages Today, Orders Detected, Orders Confirmed, Needs Clarification, Human Reviews, Failed Messages, Failed Sends) plus failed reminders, open error table with **Retry** (admin/sales only), classification breakdown, and a recent-intake-activity feed with drill-down links.
  - **Error recovery**: new `order_processing_errors` table (+ 3 indexes, RLS read policy, `supabaseSync` map `jt_crm_order_processing_errors`); `db.recordOrderProcessingError` dedupes per `(message_id, stage)` and bumps `attempt_count`; `getOrderProcessingErrors`/`updateOrderProcessingError`/`resolveOrderProcessingError`; `reprocessWhatsAppMessage`/`retryFailedMessage` re-run the resilient pipeline with idempotency guards and resolve successful retries.
  - **AI-failure deterministic fallback**: new `resilientProcessing.ts` — `safeClassify`/`safeParse`/`safeMatch` never throw; `processMessageSafely` catches any pipeline failure, records the error, logs `processing_error`, raises a high-priority attention alert, and returns a `human_review` outcome so no customer order is silently lost.
  - **Ingestion wiring**: `whatsappIngestionService.ingestRawSupabaseMessages` now runs every inbound message through `processMessageSafely`, persists `raw_payload`, sets `processing_status` (`classified`/`draft_created`/`awaiting_confirmation`/`confirmed`/`escalated`), and records `ingest`-stage failures.
  - **Human control**: WhatsApp Message Center gains Reject Draft (with reason, audit-logged, never auto-replies), Edit Draft via `editOrderDraftItems` (audit-logged), Retry for failed messages, and Raw Message / Matching Result / Audit Trail inspector modals; new permission `canManageWhatsAppOrderProcessing` (admin + sales_agent).
  - **Security**: `api/daily-order-request.ts` now compares `CRON_SECRET` in constant time (`safeEqual`); verified no secrets exist anywhere in `src/`.
  - **Documentation**: `PROJECT_SPEC.md` — Phase 8 section (10 hardening areas + production readiness report) and consolidated **WhatsApp Ordering System** reference (16 subsections); `CHANGELOG.md` `[1.24.0]`.

---

## [1.23.0] - 2026-08-11

### Added
- **WhatsApp Order Intelligence — Phase 7 (Automated Daily Order Request)**:
  - **Backend scheduler (no browser timers)**: Vercel Cron (`*/30 * * * *`) triggers `api/daily-order-request.ts`, which computes the current time in the configured business timezone and dispatches only when it matches the configured send time (default `09:00`, timezone-aware since Vercel cron is UTC).
  - **Serverless run flow**: loads `order_request_config`, computes tomorrow's delivery date in the business timezone, resolves active routes from `route_schedules`, filters eligible active customers with a WhatsApp number, **deduplicates** against already-sent `order_reminders` for that date, writes outbound messages to the Supabase `messages` table for the Baileys connector, and records `sent`/`failed` reminders with `message_id` and `error_reason`.
  - Optional `CRON_SECRET` authorization gate for the cron endpoint; `?force=1` bypasses the send-time check for manual testing.
  - **Configurable template** with `{{customer_name}}`, `{{route}}`, `{{delivery_date}}` placeholders and a default "Good morning… / Your delivery is scheduled for {{route}} tomorrow… / J&T Supplies" message.
  - **Admin Control Center** (`/admin/order-requests`, admin-only): send time / timezone / enabled toggle / template editor with live preview, **Run Now** manual trigger (same service, deduped), filterable reminder history table, and **Retry** for failed reminders (bumps `attempt_count`, keeps audit trail).
  - **Shared pure core** (`dailyOrderRequestCore.ts`): environment-agnostic date math, route resolution, template rendering, and eligibility filtering reused by both the browser UI and the Node serverless function.
  - **New Supabase tables** `order_request_config` (single-row automation config) and `order_reminders` (unique `(customer_id, delivery_date)` dedupe, status/sent_at/message_id/error_reason/attempt_count) with RLS read policies; registered in `supabaseSync.ts` `TABLE_MAP` for local-first write-through sync (`jt_crm_order_request_config`, `jt_crm_order_reminders`).
  - Removed stale `sanitizeRow` stripping of `customers.route` / `customers.whatsapp_number` so the serverless function and Baileys connector see real customer routing/contact data in Supabase.
  - New audit actions `order_request_config_updated`, `order_request_sent`, `order_request_failed`, `order_request_retried`.
  - Updated `PROJECT_SPEC.md` with the full Phase 7 scheduling, run-flow, template, admin, schema, and sync specifications.

---

## [1.22.0] - 2026-08-11

### Added
- **WhatsApp Order Intelligence — Phase 6 (Human Attention, Non-Order Messages & Agent Alerts)**:
  - Full message classification taxonomy implemented (`ORDER`, `ORDER_CORRECTION`, `ORDER_CONFIRMATION`, `QUESTION`, `COMPLAINT`, `GREETING`, `NON_ORDER`, `UNKNOWN`). Renamed `ORDER_CLARIFICATION` → `ORDER_CORRECTION` across `messageClassifier.ts`, `orderDraftService.ts`, types, badges, and the `message_classification` enum in `database/schema.sql`.
  - Added safe Web Audio chime (`playAlertSound`) in `attentionAlertService.ts` for high/urgent priority alerts respecting browser autoplay restrictions.
  - **Global in-app popup center** (`AttentionAlertPopups.tsx`) — toast-style popup per attention alert with **Open Conversation / Dismiss / Create Query** actions. Renders in `AppShell`, subscribes to new alerts via `subscribeToAttentionAlerts`, and replays recent unresolved alerts on mount (session-deduplicated). "Open Conversation" deep-links to `/whatsapp-conversations?conversation=<id>`.
  - Real-time alert subscription/broadcast in `attentionAlertService.ts`; all pipeline alert creation now routes through `raiseAttentionAlert` (dedupe + sound + notify), including `orderDraftService` escalation paths.
  - **CRM notification integration** — new `whatsapp.attention_required` notification event (`notifyWhatsAppAttentionRequired`) surfaces customer-attention alerts in the Header bell / Notifications module. Urgent query conversions also dispatch `notifyUrgentQueryCreated`.
  - Linked attention alerts directly to the existing CRM Customer Query module (`customer_queries` table) via `convertAlertToQuery` (`QRY-XXXXXX`) without creating duplicate ticket systems.
  - Verified human agent takeover controls (`human_takeover` / `pauseBot`) setting `bot_status = 'human_takeover'` (`BOT_PAUSED`).
  - **Message ingestion classification** — `whatsappIngestionService` now classifies inbound Baileys messages and raises attention alerts for `QUESTION`, `COMPLAINT`, `UNKNOWN`, and other attention-required messages instead of defaulting every message to `ORDER`.
  - Fixed route access (`canAccessPath`) so all roles can open WhatsApp Inbox / Simulator.
  - Updated `PROJECT_SPEC.md` with the completed Phase 6 classification, popup, sound, popup-action, query-conversion, and agent-takeover specifications.

---

## [1.21.0] - 2026-08-11

### Added
- **WhatsApp Order Intelligence — Phase 5 (Confirmed Order Routing)**:
  - Added `routeRoutingService.ts` for confirmed order routing, weekly route schedule delivery date calculation, internal route message payload formatting, and Baileys destination resolution.
  - Implemented weekly route schedule matrix (Mon–Sun covering Kelowna, West Kelowna, Summerland, Penticton, Osoyoos, Oliver, Princeton, Keremeos, Merritt, Vernon, Salmon Arm, Lake Country, Armstrong, Kamloops, Falkland, Chase).
  - Standardized internal route operational message payload (`📦 NEW ORDER CONFIRMED` with Customer, Route, Delivery Date, Items list, and CRM Reference `CRM-ORD-XXXXXX`).
  - Configured dynamic destination resolution (`resolveDestinationJidForRoute`) using `ORDER_GROUP_JID` and `route_destinations` table without hardcoding JIDs in business logic.
  - Linked confirmed intake orders directly into the CRM 6-stage operational pipeline (`Order Received ✓` ➔ `Sales Order Generated` ➔ `Invoiced` ➔ `Dispatched` ➔ `Error`).
  - Updated `PROJECT_SPEC.md` with complete Phase 5 routing architecture and delivery schedule matrix.

---

## [1.20.0] - 2026-08-11

### Added
- **WhatsApp Order Intelligence — Phase 4 (WhatsApp Order Draft & Customer Confirmation)**:
  - Verified and documented complete customer confirmation workflow: Parse ➔ Match ➔ Order Draft ➔ Clarification ➔ Confirmation Message ➔ Customer YES ➔ Confirmed Order (`CRM-ORD-XXXXXX`).
  - Audited full draft state taxonomy (`NEW`, `ANALYZING`, `DRAFT_CREATED`, `NEEDS_CLARIFICATION`, `AWAITING_CONFIRMATION`, `CUSTOMER_CORRECTING`, `CONFIRMED`, `FORWARDED`, `CANCELLED`, `HUMAN_REVIEW`).
  - Standardized confirmation summary text template and post-confirmation order received message.
  - Verified customer correction handling (`"make gloves 10"`, `"remove masks"`, `"add 2 tapes"`) updating active draft line items and re-issuing confirmation requests.
  - Enforced strict affirmative intent for transition to `CONFIRMED` state and verified idempotency protection against duplicate confirmation replies.
  - Maintained human agent control and `human_takeover` / `pauseBot` overrides (`BOT_PAUSED`).
  - Updated `PROJECT_SPEC.md` with complete Phase 4 confirmation specifications and state machine documentation.

---

## [1.19.0] - 2026-08-11

### Added
- **WhatsApp Order Intelligence — Phase 3 (Customer History & Product Matching Engine)**:
  - Verified and documented complete Customer History + Catalog Order Intelligence Layer.
  - Enforced deterministic priority chain: SKU (1.0) ➔ Exact Name (0.97) ➔ Customer Alias (0.95) ➔ Global Alias (0.90) ➔ Customer History (0.80–0.90) ➔ Normalized Name (0.60–0.90).
  - Enforced low-confidence and ambiguity protection: ambiguous mentions or confidence < 0.60 trigger `NEEDS_CLARIFICATION` and prompt for customer input instead of guessing.
  - Enforced customer history context (*"send my usual gloves"*) while ensuring explicit customer intent (e.g. *"send black gloves medium"*) always overrides history.
  - Enforced quantity and unit integrity: missing quantities trigger `NEEDS_CLARIFICATION` prompt (*"How many would you like?"*).
  - Maintained human review interface in `/whatsapp-conversations` and `/whatsapp-simulator` with controls to `Approve`, `Edit`, `Reject`, or `Request Clarification`.
  - Added test coverage verification across 12 test scenarios (exact match, misspelling, abbreviation, multi-product, missing quantity, ambiguity, customer history, unknown product, correction, duplicate message, non-order message, mixed order + question).
  - Updated `PROJECT_SPEC.md` with complete Phase 3 specifications and test scenario compliance matrix.

---

## [1.18.0] - 2026-08-11

### Added
- **WhatsApp Connector Integration — Phase 1 Audit & Architecture Contract**:
  - Conducted full technical audit of existing Node.js Baileys microservice (`whatsapp-connector`).
  - Documented complete message lifecycle: `WhatsApp` ➔ `Baileys Connector` ➔ `Supabase (messages)` ➔ `CRM Order Intelligence Engine` ➔ `Order Group JID`.
  - Documented environment variables (`CUSTOMER_GROUP_JID`, `ORDER_GROUP_JID`, `SUPABASE_URL`, `SUPABASE_KEY`, `AUTH_FOLDER`).
  - Audited and mapped schema structures (`products`, `groups`, `messages`, `orders`, `order_items`).
  - Defined System-of-Record ownership rules (Connector = Communication Gateway, CRM = Business Logic & Operations, Supabase = Shared Persistent Layer).
  - Established idempotency key protocol (`msg.key.id` / `remote_jid + message_id`) and message processing status taxonomy (`RECEIVED`, `PROCESSING`, `PROCESSED`, `IGNORED`, `FAILED`, `HUMAN_REVIEW`).
  - Updated `PROJECT_SPEC.md` with complete Phase 1 integration contract and architecture specifications.

---

## [1.17.0] - 2026-08-11

### Added
- **WhatsApp Order Intelligence — Phase B (Simulator Testing Workbench)**:
  - Added `/whatsapp-simulator` route and page component (`src/pages/WhatsAppSimulator.tsx`).
  - Interactive testing workbench allowing sales and support agents to test messy customer WhatsApp messages against the 393 live customer accounts and 1,022 product catalog items.
  - Included 8 quick preset test scenarios (Multi-product orders, customer history "usual", ambiguous mentions, missing quantities, exact SKUs, non-order questions, urgent complaints, order confirmations).
  - Real-time Visual Pipeline Inspector showing text normalization, message classification, candidate extraction, product catalog match methods, ambiguity prompts, order draft references (`CRM-ORD-XXXXXX`), and human attention alert triggers.
- **WhatsApp Order Intelligence — Phase C (Human Review Workspace)**:
  - Added `/whatsapp-conversations` route and page component (`src/pages/WhatsAppConversations.tsx`).
  - Directory of active WhatsApp customer conversations filterable by `Attention Required`, `Awaiting Confirmation`, `Human Active`, `Confirmed`, and `All`.
  - Real-time chat stream with sender tags (Customer vs AI Bot vs Human Agent) and classification badges.
  - Side Inspector panel displaying Order Draft details, matched catalog line items, confidence scores, and internal reference numbers.
  - Controls for `Human Takeover` (*Bot Paused* vs *Bot Active*), `Pause Bot`, `Resume Bot`, draft line item editing, quantity adjustments, manual draft confirmation, and 1-click conversion of attention alerts into CRM Support Queries (`QRY-XXXXXX`).
- **Sidebar & App Navigation**:
  - Added **WhatsApp Inbox** (`/whatsapp-conversations`) and **WhatsApp Simulator** (`/whatsapp-simulator`) to the primary Operations navigation section in `Sidebar.tsx`.

---

## [1.16.0] - 2026-08-11

### Changed
- **Local Application Clean Slate Data Reset**:
  - **Database Seeding (`src/services/db.ts`)**: Removed demo user accounts (`Muzammil`, `Abdul Rehman`, `Sohail`, `Aasil`), leaving 1 default Admin account (`tauseef@jtsupplies.com` / `Tauseef (Admin)`) for local authentication.
  - **Clean Slate Version Control**: Updated `SEED_DATA_VERSION` to `v4-clean-slate`. Implemented automatic localStorage upgrade logic to reset local catalog data to clean slate state on application startup.
  - **Auto-Seeding Disabled**: Disabled automatic startup execution of `ensureHtmlBusinessDataSeeded()` so the local database initializes empty (0 products, 0 customers, 0 orders).
  - **Dynamic Import Optimization**: Made `seedHtmlData.ts` (2.1 MB) dynamically imported so it remains available for manual admin bulk import (`AdminImport.tsx`) without adding overhead to application startup.
- **Test Suite Updates (`tests/integrationTest.ts`)**:
  - Added self-contained test catalog setup (3 test customers and 3 test products) so the WhatsApp Order Intelligence test suite runs independently on a clean slate database.
- **Supabase Sync Hardening (`src/services/supabaseSync.ts`)**:
  - Implemented page-based fetching (`fetchAllRemoteRows`) to bypass row limits when pulling remote Supabase records.
  - Chunked client upserts into batches of 100 to prevent payload limits.

---

## [1.15.0] - 2026-08-10

### Added
- **WhatsApp Order Intelligence — Phase A (Foundation)**:
  - **Schema (`database/schema.sql`)**: New enums `message_classification`, `order_draft_status`, `match_method`, `attention_priority`, `alert_status`, `bot_status`; extended `whatsapp_conversations` (`route`, `delivery_date`, `bot_status`) and `whatsapp_messages` (`sender`, `classification`, `processing_status`, `processed_at`); new tables `order_drafts`, `order_draft_items`, `product_aliases`, `customer_product_aliases`, `route_destinations`, `agent_attention_alerts`, `order_intake_events` with indexes and `authenticated` RLS read policies.
  - **Incoming Message Pipeline (`src/services/`)**:
    - `textNormalizer.ts`: normalization, tokenization, phone normalization, edit-distance / overlap similarity utilities.
    - `messageClassifier.ts`: classification (`ORDER`, `QUESTION`, `COMPLAINT`, `CONFIRMATION`, `GREETING`, `UNKNOWN`, …) with complaint precedence and urgency detection.
    - `orderParser.ts`: multi-line segment split into `quantity`/`unit`/mention; strips leading phrases and filler/date words (`kal`, `bhai`, `today`, …); flags missing quantities (never invented).
    - `productMatcher.ts`: priority matching chain (SKU → exact name → customer/global alias → customer history → normalized name) with `MIN_MATCH_CONFIDENCE = 0.6` and `AMBIGUITY_DELTA = 0.15`; ambiguity-driven clarification instead of guessing.
    - `orderDraftService.ts`: full draft lifecycle (`NEW_MESSAGE` → `DRAFT_CREATED` / `NEEDS_CLARIFICATION` / `AWAITING_CONFIRMATION` → `CONFIRMED` / `FORWARDED` / `CANCELLED` / `HUMAN_REVIEW`), explicit-only confirmation, `pauseBot`/`resumeBot`/`takeOverConversation`, internal reference assignment (`CRM-ORD-XXXXXX`), and confirmation / order-received / route / order-request message templates.
    - `attentionAlertService.ts`: human-review alerts with priority assessment and acknowledge/resolve/convert-to-query workflows.
  - **Data Access (`src/services/db.ts` & `src/services/supabaseSync.ts`)**: Full CRUD for WhatsApp contacts/conversations/messages, order drafts/items, aliases, route destinations, agent alerts, and intake events; new storage keys registered in the Supabase `TABLE_MAP` write-through; defensive `import.meta.env?.*` reads for Node portability.
  - **Verification**: `tests/quickTest.ts` (31 unit assertions) and `tests/integrationTest.ts` (20 integration assertions against the real 1,022-product / 393-customer / 6,479-history catalog) — all pass; `tsc --noEmit` and `npm run build` clean.

---

## [1.14.0] - 2026-08-10

### Added
- **HTML Business Data Integration & Future WhatsApp/AI Preparation**:
  - **Source Inspection & Parsing (`src/utils/htmlDataParser.ts`)**:
    - Inspection of `Untitled-1.html` ("J &T Supplies — Price Reference"): Parsed 1,022 products with unique SKUs and Item Codes (`desiredSPBase`, `minSPBase`, `maxSPBase`, `unitGroup`, `targets`).
    - Inspection of `index.html` ("J &T Supplies — Customer Price List"): Parsed 393 commercial customer accounts and 6,479 historical customer-product relationships with 100% item code match rate against product catalog.
    - Zero fake data generated: Phone, WhatsApp, City, and Route remain empty for missing records.
  - **Database & Model Extensions (`database/schema.sql` & `src/types/index.ts`)**:
    - Created `customer_product_history` table and TypeScript model (`customer_id`, `product_id`, `source_item_code`, `source_item_name`, `packaging_unit`, `customer_price`, `inner_unit`, `inner_qty`, `unit_price`, `import_batch_id`).
    - Added future WhatsApp tables (`whatsapp_contacts`, `whatsapp_conversations`, `whatsapp_messages`).
  - **Database Service Auto-Seeding (`src/services/db.ts` & `src/data/seedHtmlData.ts`)**:
    - Pre-seeded CRM in-memory & localStorage store with all 1,022 products, 393 customers, and 6,479 historical purchasing relationship records.
    - Added `getCustomerProductHistory`, `getCustomerProductHistoryByCustomerName`, and `importHTMLBusinessData` methods.
  - **Admin HTML Import UI (`src/pages/admin/AdminImport.tsx`)**:
    - Added Auto-Detected HTML Business Data card and upload parser.
    - Added interactive Import Preview displaying summary statistics (1,022 Products, 393 Customers, 6,479 Relationships, 100% Match Rate) and preview tabs.
    - Added controlled import confirmation flow logging `import_jobs`.
  - **Customer Profile Historical Purchasing View (`src/pages/CustomerDetail.tsx`)**:
    - Added **"Historical Purchasing Catalog"** tab displaying agreed prices, packaging units, inner pack details, and current catalog stock availability badges.
    - Concept Separation: Kept historical purchase pricing strictly separate from live inventory stock availability.
  - **Vendor-Agnostic AI & WhatsApp Service Abstractions (`src/services/aiService.ts` & `src/services/messagingService.ts`)**:
    - `AIService` class with validated tool functions: `findCustomerByWhatsApp`, `searchProducts`, `getProductDetails`, `getCustomerHistory`, `checkProductAvailability`, `createOrderRequest` (draft proposal), `createCustomerQuery` (human escalation).
    - `MessagingProvider` interface and stub implementation for future WhatsApp gateway integration.
    - Strict security boundaries: Zero raw SQL/database write access for AI. The AI cannot alter prices, modify stock, change customer data, or issue invoices.
  - **Documentation**: Updated `PROJECT_SPEC.md` and `CHANGELOG.md` with comprehensive data mappings, import rules, and WhatsApp/AI architectural boundaries.

---

## [1.13.0] - 2026-08-10

### Added
- **Full Application Data Reset**: Performed a complete, safe application data reset removing all business, customer, product, query, daily operation, order, notification, import, and audit history records while preserving system infrastructure, database schemas, authentication users, roles, categories, brands, system settings, portals, and weekly route schedules.
- **Clean Reset State (`src/services/db.ts`)**:
  - Reset seed datasets for business entities (`SEED_CUSTOMERS`, `SEED_PRODUCTS`, `SEED_QUERIES`, `SEED_ACTIVITIES`, `SEED_NOTES`, `SEED_NOTIFICATIONS`, `SEED_ORDERS`, `SEED_ORDER_ITEMS`, `SEED_ORDER_HISTORY`, `SEED_ORDER_DOCUMENTS`, `SEED_PRODUCT_HISTORY`, `SEED_SHIFTS`, `SEED_HANDOVERS`, `SEED_HANDOVER_ITEMS`) to empty arrays `[]`.
  - Added `clearAllBusinessData()` helper method in `LocalDatabaseService` to purge any stored in-memory or localStorage demo rows.
  - Preserved system configuration seeds (`SEED_TEAMS`, `SEED_USERS`, `SEED_CATEGORIES`, `SEED_PRODUCT_CATEGORIES`, `SEED_PRODUCT_BRANDS`, `SEED_ROUTE_SCHEDULES`).
  - Standardized Thursday weekly route schedule to a single `Kelowna` route entry.
- **SQL Schema & Seed Reset (`database/schema.sql` & `database/seed.sql`)**:
  - Removed all business data seed `INSERT` statements from `database/schema.sql` and `database/seed.sql`.
  - Maintained all table definitions (`CREATE TABLE`), indexes, foreign key constraints, triggers, RLS policies, system setting defaults, and weekly route schedule seeds.

---

## [1.12.0] - 2026-08-10

### Added
- **UI/UX Upgrade: Professional Design System**: Complete visual overhaul of J&T Supplies CRM into a premium internal operations platform without altering underlying business logic, permissions, schemas, or workflows.
- **Design Tokens & Palette (`tailwind.config.js` & `src/index.css`)**:
  - **Deep Navy (`#102A43`)**: Application shell, sidebar, and primary operational headers.
  - **Electric Teal (`#00A6A6`)**: Primary action buttons, active navigation indicators (`▌ Daily Operations`), and highlights.
  - **Warm Amber (`#F2B84B`)**: Pending statuses, warnings, and attention banners.
  - **Success Green (`#2E8B57`)**: Completed states, positive operational milestones, and availability indicators.
  - **Error Red (`#D64545`)**: Critical warnings, customer operational error badges, and destructive actions.
  - **Surface & Border Tokens**: `#F5F7FA` main background, `#FFFFFF` cards, `#E9EFF5` subtle backgrounds, `#D9E2EC` borders, `#172B4D` primary text, `#52606D` secondary text.
  - **Standardized Border Radii**: Cards `12px`, Buttons `8px`, Inputs `8px`, Badges `9999px`.
- **Component Primitives Overhauled (`src/components/ui/`)**:
  - `Button.tsx`: Teal primary, Navy secondary, Red destructive, Outline, and Ghost variants with 8px radius.
  - `Card.tsx`: 12px radius, `#D9E2EC` crisp borders, and clean typography headers.
  - `Input.tsx`, `Select.tsx`, `Textarea.tsx`: Custom focus rings, 8px radius, and `#829AB1` placeholders.
  - `Table.tsx`: Compact 12px padding, `#F5F7FA` headers, hover states, and clear row borders.
  - `Modal.tsx`: Crisp backdrop blur, 12px radius, and Deep Navy headers.
  - `StatCard.tsx`: Top indicator bars in subtle semantic colors.
  - `Sidebar.tsx`: Deep Navy background, grouped Operations & Administration sections, and Electric Teal active bar indicator (`▌`).
  - `Header.tsx`: Clean breadcrumbs, notification bell, profile menu, and live Supabase status pill.
- **Page Layout Refinement**:
  - `Login.tsx`: Deep Navy background with Electric Teal brand identity.
  - `Dashboard.tsx`: Operational control center with subtle KPI cards and active shift status.
  - `Orders.tsx`: Route-Based Daily Operations centerpiece with high-contrast milestone checkboxes, monospace reference badges (`SO-XXXXXX`, `INV-XXXXXX`), and sticky customer column.
  - `CustomerDetail.tsx`: Refined contact cards highlighting WhatsApp, Phone, City, and Route.
  - `AdminImport.tsx`: Crisp 4-step CSV import wizard stepper.

---

## [1.11.0] - 2026-08-10

### Added
- **Route-Based Daily Order Operations Dashboard (Step 10 REBUILD)**: Replaced traditional e-commerce cart/order entry with operational milestone processing for scheduled route customers.
- **Milestone Workflow Engine**:
  - `Order Received` ➔ `Sales Order Generated` (requires SO #) ➔ `Invoiced` (requires Invoice #) ➔ `Dispatched`.
  - Sequential dependency enforcement preventing premature step checks.
  - Step reversion modal requiring mandatory audit reason logging.
  - Automatic Customer Query generation when reporting operational errors (`⚠ Error QRY-XXXXXX`).
- **Portal Views & Route Schedule Management**:
  - Filtered views for `Kelowna Portal`, `Outside Kelowna Portal`, and `All Portals`.
  - Admin weekly route schedule manager at `/admin/routes` to toggle and create active city route schedules per day of week.
- **Database Tables & Types**:
  - Created `route_schedules`, `daily_order_operations`, and `daily_order_operation_history` tables.
  - Added TypeScript definitions for `RouteSchedule`, `DailyOrderOperation`, and `DailyOrderOperationHistory`.
  - Updated seed dataset with realistic Interior BC & Okanagan customers across all route cities.

---

## [1.10.0] - 2026-08-10

### Added
- **CSV Import System for Products & Customers (Step 11)**: Built a complete, production-grade CSV import system allowing authorized Administrators to import product catalog items and customer accounts with full validation, duplicate detection, strategy selection, preview, error report downloads, import history, audit logging, and availability change notifications under the **NO INVENTORY** architecture.
- **Import Discoverability**: Added admin-gated "Import CSV" buttons to the Products Catalog and Customer Directory page headers, deep-linking into the import wizard with the matching import type pre-selected (`/admin/import?type=products` / `?type=customers`).
- **NO INVENTORY Architecture Enforced**:
  - Product CSV import manages product catalog display names, categories, SKUs, and availability status (`Available` / `Out of Stock`) only.
  - Stock quantity, warehouse stock, reserved quantity, reorder level, and inventory movement are explicitly excluded.
- **Customer & Product Schema Extension**:
  - Extended `Customer` entity and database table with `whatsapp_number` and `route` string fields.
  - Preserved phone numbers and WhatsApp numbers strictly as text strings (never converted to numeric/integer types) to retain leading zeros, country codes, and formatting.
  - Created `import_jobs` table and `ImportJob` interface.
- **CSV Parser & Validation Engine (`src/utils/csvImporter.ts`)**:
  - PapaParse integration supporting standard UTF-8 CSVs, BOM stripping, and quote handling.
  - Max 5MB file upload size protection with error messaging.
  - Header validation enforcing required fields:
    - Products: `product_name`, `category`, `sku`, `availability`
    - Customers: `customer_name`, `whatsapp_number`, `phone_number`, `city`, `route`
  - Normalized product availability values (`Available` / `Out of Stock`).
  - Row-level validation reporting exact row numbers and failure reasons.
  - SKU duplicate detection within CSV file and against database catalog.
  - Customer contact duplicate candidate detection.
  - Downloadable CSV import templates (`products_import_template.csv`, `customers_import_template.csv`).
  - Downloadable Error Report CSV (`product_import_errors.csv`, `customer_import_errors.csv`).
- **Import Strategies**:
  - `Create New Only` (Default): Creates non-existing records; skips existing SKUs or customer matches.
  - `Update Existing`: Overwrites matched records with imported CSV values.
  - `Skip Existing`: Leaves matched records untouched without raising errors.
- **Product Availability Notification Rules**:
  - Updating existing products from `Available` ➔ `Out of Stock` triggers system-wide `🔴 Product Out of Stock Alert`.
  - Updating existing products from `Out of Stock` ➔ `Available` triggers system-wide `🟢 Product Available Again`.
  - Unchanged status or initial creation of out-of-stock products does NOT dispatch notifications.
- **Admin Data Import Pages (`src/pages/admin/AdminImport.tsx` & `AdminImportHistory.tsx`)**:
  - Interactive 5-step wizard: 1. Select Type ➔ 2. Upload CSV ➔ 3. Validate & Preview ➔ 4. Confirm ➔ 5. Results.
  - Pre-import preview displaying total rows, valid records, errors, duplicates, strategy selector, and error export.
  - Confirmation modal detailing execution counts before database transactions.
  - Import History page (`/admin/import/history`) listing past import jobs, status badges, strategy, row counts, user, and error download.
- **RBAC Authorization (`src/services/permissions.ts`)**:
  - Enforced `PermissionsService.canPerformImport` restricting import routes, file uploads, and bulk operations strictly to Admin role.
- **System Audit Logging**:
  - Recorded immutable audit log events for `import_products` and `import_customers` actions.

---

## [1.9.0] - 2026-08-09

### Added
- **Order Management & Order Workflow Hardening (Step 10)**: Extended and hardened the complete Order Management system enforcing sequential workflow transitions, document requirement validations, financial calculations, workspace filters, cross-module integrations, and strict RBAC authorization under the **NO INVENTORY** architecture.
- **NO INVENTORY Architecture Confirmation**:
  - Confirmed that product `quantity` ordered represents customer demand quantity, NOT physical stock balances or warehouse deductions.
  - Product availability status (`available`, `out_of_stock`, `discontinued`) is purely informational.
  - Added live **Product Availability Warning Banner** in Order Creation modal when selecting `out_of_stock` products.
- **Order Database & Numbering (`src/services/db.ts`)**:
  - Safe backend sequential order number generation `ORD-XXXXXX` (e.g. `ORD-000001`), checking duplicates.
  - Added `customer_reference` (PO # / Ref #) and `team_id` to order entities and forms.
- **Controlled Workflow Transitions & Document Validations**:
  - Sequential progression: `Order Received` ➔ `Sales Order Done` ➔ `Invoiced` ➔ `Dispatched` ➔ `Signed Invoice Sent` ➔ `Completed` (or `Cancelled`).
  - Document checks: Transition to `invoiced` validates existence of Invoice/Sales Order document. Transition to `signed_invoice_sent` validates existence of Signed Invoice document.
  - System Administrators can perform "Admin Override" with audit trail logging.
- **Order Workspace Tabs & Filters (`src/pages/Orders.tsx`)**:
  - Added workspace tabs for `All Orders`, `My Assigned Orders`, and `Team Orders`.
  - Added multi-field search (Order #, Customer Name/Code, Customer Ref, Sales Agent, Product SKU/Name).
  - Added filter controls for Status, Sales Agent, Customer, Date Range (`startDate`, `endDate`), and Product.
  - Added **Clear Filters** button.
- **Order Details Page (`src/pages/OrderDetail.tsx`)**:
  - Prominent **Visual Workflow Checklist & Timeline Card** with stage timestamps and next action hint button.
  - **Document Status Indicators**: `Invoice: Available / Not Available` and `Signed Invoice: Available / Not Available`.
  - Purchased Line Items table with explicit NO INVENTORY notice.
  - Related Customer Card (`/customers/:id`).
  - **Related Support Queries Card** with direct clickable links (`/queries/:id`).
  - Order Documents Tab with upload modal.
  - Immutable Order Activity Audit Log timeline.
- **Cross-Module Integrations**:
  - Customer Profile (`CustomerDetail.tsx`): Displays `Orders` tab.
  - Product Details (`ProductDetail.tsx`): Displays `Related Orders` tab with customer demand notice.
  - Support Query Details (`QueryDetail.tsx`): Displays Related Order card.
  - Shift Handover (`ShiftHandover.tsx` & `HandoverFormModal.tsx`): Pulls pending orders as handover items.
- **Permissions Enforcement (`src/services/permissions.ts`)**:
  - Enforced RBAC rules for Admin (Full access & Admin override), Sales Agent (Full sales workflow 1-6, document upload, cancellation with reason), and Support Agent (View-only, no pricing or status modification).

### Documentation
- Updated [PROJECT_SPEC.md](file:///c:/Users/TIW%20COMPUTER/Desktop/CRM/PROJECT_SPEC.md) and [CHANGELOG.md](file:///c:/Users/TIW%20COMPUTER/Desktop/CRM/CHANGELOG.md).

---

## [1.8.0] - 2026-08-09

### Added
- **Admin Panel, User Management & Permissions System (Step 9)**: Built a complete, application-level Admin Panel with centralized User Management, Role Permissions, Team Operations, Shift Configuration, Taxonomy Management, System Settings, and Immutable Audit Logs.
- **Database Schema Updates (`database/schema.sql`)**:
  - Added `system_settings` table (`company_name`, `crm_title`, `timezone`, `date_format`, `currency_symbol`, `pagination_limit`).
  - Added `audit_logs` table (`timestamp`, `user_id`, `action`, `entity_type`, `entity_id`, `entity_number`, `summary`, `previous_value`, `new_value`).
  - Added indexes for audit log filtering by timestamp, user, action, and entity.
- **TypeScript Definitions & RBAC (`src/types/index.ts` & `src/services/permissions.ts`)**:
  - Created centralized `PermissionsService` engine (`canManageUsers`, `canManageTeams`, `canManageSystemSettings`, `canViewAuditLogs`, `canManageTaxonomies`, `canChangeProductAvailability`, `canProgressOrderWorkflow`, `canManageQueries`).
  - Defined `SystemSettings`, `AuditLog`, `UserFormInput`, `TeamFormInput`, `CategoryFormInput`, `BrandFormInput`, `ShiftConfigInput`.
- **Data Access Engine (`src/services/db.ts`)**:
  - Added user management methods (`createUser`, `updateUser`, `setUserActiveStatus`, `getUserActiveWork`).
  - Added team management methods (`createTeam`, `updateTeam`, `setTeamActiveStatus`).
  - Added taxonomy & category methods (`addQueryCategory`, `updateQueryCategory`, `addProductCategory`, `updateProductCategory`, `addProductBrand`, `updateProductBrand`).
  - Added system settings methods (`getSystemSettings`, `updateSystemSettings`).
  - Added immutable audit log methods (`getAuditLogs`, `logAudit`).
  - Added default seeds for system settings and initial audit logs.
- **Admin Layout & Navigation (`src/components/admin/AdminLayout.tsx` & `src/components/layout/Sidebar.tsx`)**:
  - Added shared Admin tabbed header navigation bar across sub-pages.
  - Restricted `/admin/*` routes strictly to users with `admin` role via `canAccessPath()` and `ProtectedRoute.tsx`.
- **Admin Dashboard (`src/pages/admin/AdminDashboard.tsx`)**:
  - Real database KPI summary cards for Users, Queries, Orders, Products, Shifts, and System Settings.
  - Quick action buttons (`+ Add User`, `+ Add Product`, `+ Add Customer`, `+ Create Order`, `View Urgent Queries`, `View Out-of-Stock`, `View Pending Orders`, `View Handover`).
- **User Management & Profile (`src/pages/admin/AdminUsers.tsx`, `UserFormModal.tsx`, `UserDeactivateModal.tsx`, `AdminUserProfile.tsx`)**:
  - Users data table with search, role filter, team filter, status filter, and pagination.
  - User creation & edit modal with invitation setup simulation (never storing/displaying plaintext passwords).
  - User deactivation modal with **Active Work Check** (alerts if agent has open queries or pending orders before deactivating, preserving historical data).
  - User profile page displaying activity statistics and action timeline.
- **Operational Team Management (`src/pages/admin/AdminTeams.tsx` & `TeamFormModal.tsx`)**:
  - Team directory cards displaying active roster members, shift info, and team workload summary (open queries, pending orders).
  - Team creation & edit modal.
- **Interactive Roles & Permissions Matrix (`src/pages/admin/AdminRoles.tsx`)**:
  - Role permissions matrix comparing Admin, Sales Agent, and Support Agent access rights across all 11 system modules.
- **Taxonomy & Category Management (`AdminQueryCategories.tsx`, `AdminProductCategories.tsx`, `AdminProductBrands.tsx`)**:
  - Management screens for query categories, product categories, and product brands with Add, Edit, and Activate/Deactivate actions (deactivation preserves historical data references).
- **Shift Schedule Configuration (`src/pages/admin/AdminShifts.tsx`)**:
  - Shift configuration supporting overnight schedules (Team 1 `3 PM – 11 AM`, Team 2 `12 PM – 8 AM`) across midnight without numerical `start < end` constraints.
- **System Settings (`src/pages/admin/AdminSettings.tsx`)**:
  - Configurable application settings (Company Name, CRM Title, Timezone, Date Format, Currency Symbol, Pagination Limit). Safe application-level controls only.
- **Immutable System Audit Logs (`src/pages/admin/AdminAuditLogs.tsx`)**:
  - Immutable audit logs table with multi-field search, user/action/entity filters, value delta snippets, and pagination.

### Documentation
- Updated [PROJECT_SPEC.md](file:///c:/Users/TIW%20COMPUTER/Desktop/CRM/PROJECT_SPEC.md) and [CHANGELOG.md](file:///c:/Users/TIW%20COMPUTER/Desktop/CRM/CHANGELOG.md).

---

## [1.7.0] - 2026-08-09

### Added
- **Customer Query / Support Ticket Management System Completion (Step 8)**: Completed and perfected the operational Customer Query / Support Ticket System.
- **Database Schema Updates (`database/schema.sql`)**:
  - Added `order_id`, `product_id`, `assigned_team_id`, and `closure_reason` to `customer_queries` table.
  - Created `query_attachments` table for query document uploads.
- **TypeScript Definitions (`src/types/index.ts`)**:
  - Updated `QueryStatus` (`new`, `assigned`, `in_progress`, `waiting_customer`, `resolved`, `closed`, `reopened`, `open`).
  - Added `order_id`, `assigned_team_id`, `closure_reason`, `attachments` to `CustomerQuery`.
  - Added `QueryFormInput` and `QueryAttachment` interfaces.
- **Data Access & Query Service Methods (`src/services/db.ts`)**:
  - Controlled workflow transition matrix with server-side validation.
  - Enforced mandatory resolution summary before `Resolved`, mandatory reopen reason before `Reopened`, and optional closure reason before `Closed`.
  - `getQueryAttachments()`, `addQueryAttachment()`.
  - Enhanced `getQueries()` with multi-field search (query #, customer name/code/phone, subject, order #, SKU, agent name) and workspace tab filters (`team_id`, `myQueriesOnly`).
- **Support Ticket Creation Modal (`src/components/queries/QueryFormModal.tsx`)**:
  - Added **Existing Open Queries Warning Banner** alerting agents when a selected customer has active open tickets.
  - Added Related Order dropdown (filtered strictly by selected customer).
  - Added Related Catalog Product dropdown and priority selector.
- **Support Agent Workspace (`src/pages/Queries.tsx`)**:
  - Added workspace tabs for `All Tickets`, `My Assigned Queries`, and `Team Queries`.
  - Added tab-specific workload KPI summary cards (`Urgent`, `High Priority`, `Waiting for Customer`, `In Progress`, `Resolved Today`).
  - Added multi-field search and filters bar with quick agent assign modal.
- **Query Detail Page (`src/pages/QueryDetail.tsx`)**:
  - Added Related Customer Card, Related Customer Order Card (`ORD-000001`), Related Product Card (`SKU`).
  - Added Confidential Internal Agent Notes tab (protected from Sales Agent role).
  - Added Query Document Attachments tab with file upload interface.
  - Added immutable activity history audit trail and workflow action bar.
- **Dashboard Integration (`src/pages/Dashboard.tsx`)**:
  - Integrated real database query metrics for Open Queries, Urgent Queries, My Open Queries, and Waiting for Customer.
  - Added **Active Support Tickets Requiring Attention** table widget.

### Documentation
- Updated [PROJECT_SPEC.md](file:///c:/Users/TIW%20COMPUTER/Desktop/CRM/PROJECT_SPEC.md) and [CHANGELOG.md](file:///c:/Users/TIW%20COMPUTER/Desktop/CRM/CHANGELOG.md).

---

## [1.6.0] - 2026-08-09

### Added
- **Shift Handover & Team Operations System (Step 7)**: Built a complete operational shift handover system connecting Team 1 (`3 PM – 11 AM`) and Team 2 (`12 PM – 8 AM`) with flexible overnight shift representation.
- **Database Schema Updates (`database/schema.sql`)**: Created `shift_status`, `handover_status`, and `handover_entity_type` enums, and created `shifts`, `shift_handovers`, and `shift_handover_items` tables with performance indexes and RLS policies.
- **TypeScript Definitions (`src/types/index.ts`)**: Added `Shift`, `ShiftHandover`, `ShiftHandoverItem`, `ShiftStatus`, `HandoverStatus`, `HandoverEntityType`, and `HandoverFormInput` interfaces.
- **Data Access & Handover Service Methods (`src/services/db.ts`)**:
  - `getShifts()`, `getCurrentShiftForTeam()`, `createShift()`
  - `getHandovers()`, `getHandoverById()`, `createHandover()`, `submitHandover()`, `acknowledgeHandover()`
  - `getHandoverItems()`, `completeHandoverItem()`
  - `getPendingWorkForHandover(outgoingTeamId)`: Automatic pending work aggregator pulling unresolved support queries, pending orders, and out-of-stock products for inclusion in shift handovers.
- **Shift Handover Form Modal (`src/components/handover/HandoverFormModal.tsx`)**: Modal allowing outgoing agents to specify receiving incoming team, shift summary, operational notes, and select flagged pending items with priority, notes, and action required.
- **Shift Handover Detail View Modal (`src/components/handover/HandoverDetailModal.tsx`)**: Modal displaying full handover breakdown, outgoing/incoming team metadata, summary, flagged items with direct CRM links (`/queries/:id`, `/orders/:id`, `/products/:id`), incoming team acknowledgement button, and item completion modal.
- **Shift Handover Page (`/shift-handover` — `src/pages/ShiftHandover.tsx`)**: Primary operational page featuring Current Operational Shift card, active team agent roster, submitted handover receipt callout banner, and searchable/filterable Handover History table.
- **Notification Integration (`src/services/notificationService.ts`)**:
  - `notifyHandoverSubmitted()`: Dispatches `📋 Shift Handover Ready` notification to incoming team members and Admins upon handover submission.
  - `notifyHandoverAcknowledged()`: Dispatches `✅ Shift Handover Acknowledged` notification to outgoing team members and Admins.
- **Dashboard Integration (`src/pages/Dashboard.tsx`)**: Added **Shift & Team Operations Status** widget displaying active team, shift interval, latest handover status, and pending items, plus a `⚠️ Shift Handover Action Required` alert banner when a submitted handover awaits receipt.

### Documentation
- Updated [PROJECT_SPEC.md](file:///c:/Users/TIW%20COMPUTER/Desktop/CRM/PROJECT_SPEC.md) with `## Shift & Team Operations` section, updated permissions matrix, and `## Known Questions / Clarifications` for business shift times.
- Updated [CHANGELOG.md](file:///c:/Users/TIW%20COMPUTER/Desktop/CRM/CHANGELOG.md).

---

## [1.5.0] - 2026-08-09

### Added
- **Notifications & Alerts System (Step 6)**: Centralized event-driven notification engine, database schema, priority levels, header popover badge, and dedicated `/notifications` management center page.

---

## [1.4.0] - 2026-08-09

### Added
- **Product & Availability / Out-of-Stock Management (Step 5)**: Product catalog table, Out of Stock alerts view, product detail profile, availability audit history, order warning banners, and query product references.

---

## [1.3.0] - 2026-08-09

### Added
- **Order Management Module (Step 4)**: Sequential 6-stage order fulfillment workflow, calculation engine, document checklist, status history audit trail, orders list view, and detail view.

---

## [1.2.0] - 2026-08-09

### Added
- **Customer Query / Support Ticket Management System (Step 3)**: Customer support queries, priority/category management, resolution/reopen workflows, confidential internal notes, and activity log.

---

## [1.1.0] - 2026-08-09

### Added
- **Customer Management Module (Step 2)**: Customer repository, auto-sequential code generation, search, filters, and customer detail profile.

---

## [1.0.0] - 2026-08-09

### Added
- **Project Foundation & Application Shell**.
