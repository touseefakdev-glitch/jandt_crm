# Changelog

All notable changes to the **J&T Supplies CRM** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

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
