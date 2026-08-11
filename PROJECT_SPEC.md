# J&T Supplies CRM - Technical & Product Specification

## Project Overview
**J&T Supplies CRM** is a production-ready internal Customer Relationship Management application designed to streamline customer service, order fulfillment, product availability tracking, shift handovers, and operational auditing for J&T Supplies. The application supports multi-role access tailored to administrators, sales representatives, and customer support staff.

---

## Business Goals
1. **Operational Efficiency**: Provide a centralized, high-speed interface for managing customer interactions, orders, tickets, and product availability across multi-shift team schedules.
2. **Role Separation & Security**: Ensure strict role-based access control (RBAC) at both frontend navigation and database/backend policy levels.
3. **Seamless Shift Transition**: Facilitate operational continuity across overnight shifts via real-time notifications, shift handover notes, and team handover logs.
4. **Data Integrity & Traceability**: Maintain a normalized PostgreSQL/Supabase database schema with complete audit trail capabilities for critical operational actions.

---

## User Roles

### 1. Admin (`admin`)
- **System Rights**: Full read/write access across all system modules, settings, users, teams, shifts, and handovers.
- **Key Responsibilities**: User account provisioning, team management, role configuration, database maintenance, customer deactivation, ticket assignment/override, order workflow override, product catalog & availability management, system notifications, shift configuration, and overall system audits.

### 2. Sales Agent (`sales_agent`)
- **System Rights**: Access to customer records, customer query history viewing, order creation/workflows, product catalog & availability viewing, sales metrics, notifications, and shift handovers.
- **Key Responsibilities**: Creating and updating customer accounts, processing incoming customer orders through permitted workflow stages, viewing product availability alerts, updating sales pipeline, tracking customer history, adding order items to shift handovers. (**Internal Support Notes & Product Availability Modification Restricted**).

### 3. Support Agent (`support_agent`)
- **System Rights**: Access to customer records, full customer support query/ticket management, order status and document viewing, product catalog & availability viewing, notifications, shift handovers, and handover item completion.
- **Key Responsibilities**: Creating/updating customer accounts, creating/resolving/closing support tickets, posting internal agent notes, handling customer inquiries, viewing order fulfillment context, referencing product availability status, adding query items to shift handovers, and handing off open items to incoming shift teams.

---

## Teams & Shift Schedule
Operational teams work across business-defined shift intervals:

### Team 1
- **Configured Shift Schedule**: `3 PM – 11 AM`
- **Primary Function**: Daytime to morning operational coverage and order processing.

### Team 2
- **Configured Shift Schedule**: `12 PM – 8 AM`
- **Primary Function**: Afternoon to overnight operational coverage and support handling.

*Note: Shift times represent business-configured operational intervals. The CRM handles overnight time boundaries flexibly without silent reinterpretation.*

---

## Current Implemented Features
- **Production Web Application Shell**: Responsive desktop-first application layout featuring topbar header metadata (user, role badge, team, shift info, current date), notification bell with real-time unread counter, and collapsible role-filtered sidebar.
- **Authentication System**: Secure email/password authentication with session persistence, route protection, and instant single-click demo account switcher for rapid role testing.
- **Role-Based Authorization**: Client-side route guards combined with database-level Row Level Security (RLS) policies.
- **Database Foundation**: Normalized PostgreSQL/Supabase schema for `teams`, `profiles`, `customers`, `query_categories`, `customer_queries`, `query_activities`, `query_internal_notes`, `notifications`, `orders`, `order_items`, `order_status_history`, `order_documents`, `product_categories`, `product_brands`, `products`, `product_availability_history`, `shifts`, `shift_handovers`, and `shift_handover_items`.
- **Dashboard Foundation**: Operational welcome screen displaying database-backed metrics for Support Queries, Order Fulfillment, Out of Stock Items, Unread Notifications, Shift Status, and Orders Requiring Attention table.
- **Customer Management Module (Step 2)**: Complete customer repository featuring auto-sequential code generation (`CUST-000001`), real-time search, status filtering, pagination, creation/editing modals, Admin deactivation controls, and detailed profile page (`/customers/:id`).
- **Customer Query / Support Ticket Management System (Step 3 & Step 8)**: Complete operational support ticket system featuring `QRY-000001` auto-numbering, controlled status workflow matrix (`New` -> `Assigned` -> `In Progress` -> `Waiting for Customer` -> `Resolved` -> `Closed` / `Reopened`), mandatory resolution text, mandatory reopen reason, mandatory closure reason, agent assignment & team routing, Support Agent Workspace (`/queries`) with workspace tabs (`All Queries`, `My Queries`, `Team Queries`), workload KPI summary cards, multi-field search and filters, Query Creation Modal with **Existing Open Queries Warning Banner**, Related Order selector, Related Product selector, Confidential Internal Notes (protected from Sales Agent role), Query Document Attachments (`query_attachments`), immutable activity history audit trail, notifications integration, customer profile integration, related order card (`ORD-000001`), related product availability card (`SKU`), and dashboard query metrics.
- **Order Management Module (Step 4)**: Complete order fulfillment system featuring `ORD-000001` auto-numbering, 6-stage sequential workflow (`Order Received` -> `Sales Order Done` -> `Invoiced` -> `Dispatched` -> `Signed Invoice Sent` -> `Completed`), workflow checklist card, Next Action Instruction box, line items snapshot engine, financial totals calculation, document attachment management, immutable status history audit trail, cancellation with mandatory reason, Admin override, My Orders view, Dashboard Order metrics, and Query/Customer integrations.
- **Product & Availability Management Module (Step 5)**: Complete product catalog and availability tracking system featuring SKU management, category/brand taxonomies, availability statuses (`Available`, `Out of Stock`, `Discontinued`), mandatory unavailability reasons, expected resupply dates, immutable availability audit history, agent notifications, Out of Stock alerts view (`/out-of-stock`), order form availability warning banners, query product references, and dashboard alerts.
- **Notifications & Alerts System (Step 6)**: Centralized, event-driven notification engine featuring database persistence, role targeting, duplicate prevention, priority levels (`URGENT`, `HIGH`, `NORMAL`, `LOW`), real-time header popover badge, dedicated `/notifications` management center, read/unread filters, mark all read, and direct record navigation links.
- **Shift Handover & Team Operations (Step 7)**: Complete operational handover system featuring flexible overnight shift representation, automatic pending work pull (open queries, pending orders, out-of-stock items), priority notes, handover workflow (`Submitted` -> `Acknowledged`), item completion tracking, notifications integration, dedicated `/shift-handover` page, and dashboard status widget.
- **Project Documentation**: Standardized `PROJECT_SPEC.md` and `CHANGELOG.md`.

---

## Shift & Team Operations

### Teams
The system maintains normalized team entities (`Team 1`, `Team 2`). Each active user profile is associated with a `team_id`. Administrators can view, edit, activate/deactivate teams and configure shift schedule metadata.

### Shift Configuration
Shifts are represented in the `shifts` table:
- `id`: UUID Primary Key
- `team_id`: UUID REFERENCES teams(id)
- `shift_date`: DATE NOT NULL DEFAULT CURRENT_DATE
- `start_time`: VARCHAR(20) (e.g. `3:00 PM` or `15:00`)
- `end_time`: VARCHAR(20) (e.g. `11:00 AM` or `11:00`)
- `status`: shift_status (`upcoming`, `active`, `completed`)
- `opened_at`, `closed_at`, `opened_by`, `closed_by`, `created_at`, `updated_at`

### Overnight Shift Handling
Because configured shift schedules (Team 1: `3 PM – 11 AM`, Team 2: `12 PM – 8 AM`) span across midnight, shift time evaluations do NOT rely on simple numerical logic like `start_time < current_time < end_time`. The shift model stores time strings explicitly alongside operational status (`active`, `completed`) in the configured application timezone, fully supporting legitimate overnight shifts.

### Current Shift Detection
`getCurrentShiftForTeam(teamId)` resolves the active operational shift for a team. If no active shift record exists for the current date, the system initializes an active shift record based on team configuration without blocking user workflows.

### Shift Handover
A shift handover enables the outgoing operational team to document shift activities and flag unresolved items for the incoming team.

### Handover Statuses
- `draft`: Created but not yet finalized.
- `submitted`: Finalized by outgoing team; awaiting incoming team acknowledgement.
- `acknowledged`: Received and formally acknowledged by an incoming team member.

### Handover Items
A handover references underlying CRM records without duplicating core data:
- `id`: UUID Primary Key
- `handover_id`: UUID REFERENCES shift_handovers(id)
- `entity_type`: handover_entity_type (`query`, `order`, `product`, `customer`, `general_task`)
- `entity_id`: UUID / VARCHAR
- `priority`: (`low`, `medium`, `high`, `urgent`)
- `note`: TEXT NOT NULL
- `action_required`: TEXT
- `is_completed`: BOOLEAN DEFAULT FALSE
- `completed_at`, `completed_by`, `completion_note`

### Handover Permissions
- **Admin**: Full access to view, create, acknowledge, review, and audit handovers across all teams.
- **Support Agent**: Access to current shift, pending support work, creating handovers, adding support query items, acknowledging incoming handovers, and completing handover items.
- **Sales Agent**: Access to team handovers, adding relevant order items, viewing order-related handover items.

### Handover Notifications
- **Handover Submitted**: Triggers `📋 Shift Handover Ready` notification to all incoming team members and Admins.
- **Handover Acknowledged**: Triggers `✅ Shift Handover Acknowledged` notification to outgoing team members and Admins.

### Handover History
The `/shift-handover` page provides a searchable, filterable archive of all historical handovers, including date, outgoing team, incoming team, submitted by, acknowledged by, and flagged items count.

### Handover Integration with Queries
Handover items referencing support queries render the query number (`QRY-000123`), customer, subject, priority, and status, with a direct clickable link to `/queries/:id`.

### Handover Integration with Orders
Handover items referencing orders render the order number (`ORD-000456`), customer, status stage, and grand total, with a direct clickable link to `/orders/:id`.

---

## Order Management System

> **CRITICAL BUSINESS RULE — NO INVENTORY TRACKING**:
> J&T Supplies does **NOT** maintain physical inventory inside this CRM. Product `quantity` ordered represents customer demand quantity, NOT stock levels or warehouse deductions. Product availability status (`available`, `out_of_stock`, `discontinued`) is purely informational. Selecting an `out_of_stock` product triggers a warning alert with expected availability details, but does not block the order.

### Order Lifecycle
```text
Order Received ➔ Sales Order Done ➔ Invoiced ➔ Dispatched ➔ Signed Invoice Sent ➔ Completed (or Cancelled)
```

### Order Statuses
- `order_received`: Order received and recorded in CRM.
- `sales_order_done`: Sales Order preparation step completed.
- `invoiced`: Commercial invoice generated and attached/issued.
- `dispatched`: Order goods dispatched for shipment.
- `signed_invoice_sent`: Signed invoice copy received and dispatched to customer.
- `completed`: Order workflow fully finalized.
- `cancelled`: Order cancelled with mandatory cancellation reason.

### Order Numbering
- Format: `ORD-XXXXXX` (e.g. `ORD-000001`).
- Safely generated backend-side in `db.ts` (`generateOrderNumber`), checking for uniqueness and preventing duplicates.

### Order Creation
- Searchable customer account selector with option to create new customer inline.
- Optional `customer_reference` (Customer PO # / Ref #).
- Assigned Sales Agent (defaults to logged-in user if Sales Agent).
- Order Date & Expected Delivery Date selection.
- Line Items selector from Product Catalog displaying live SKU, product name, brand, category, and availability status.

### Order Items
- Line items snapshot product name, SKU, ordered quantity, unit price, line discount, line tax, and line total.
- Ordered quantity represents **quantity ordered by customer demand**, NOT physical inventory deduction.

### Order Totals
- Financial calculations performed server-side in `calculateOrderTotals()`:
  - Subtotal = Σ (quantity * unit_price)
  - Total Discount = Σ (discount)
  - Total Tax = Σ (tax)
  - Grand Total = Subtotal - Total Discount + Total Tax
- Uses configured business currency symbol (default `$`).

### Order Assignment
- Assigned to a Sales Agent and associated with their operational team.
- Records assignment history in `order_status_history`.
- Emits `Order Assigned` notification to assigned agent.

### Order Documents
- Document types: `Sales Order`, `Invoice`, `Signed Invoice`, `Dispatch Document`, `Other`.
- Secure file references stored in `order_documents` key.
- Order Details page displays explicit status badges:
  - `Invoice: Available / Not Available`
  - `Signed Invoice: Available / Not Available`

### Order Workflow & Status Transition Rules
- Transitions enforce strict sequential progression via `advanceOrderStatus()`:
  `order_received` ➔ `sales_order_done` ➔ `invoiced` ➔ `dispatched` ➔ `signed_invoice_sent` ➔ `completed`.
- Mandatory Document Checks:
  - Advancing to `invoiced` requires an Invoice or Sales Order document reference.
  - Advancing to `signed_invoice_sent` requires a Signed Invoice document reference.
- System Administrators can perform "Admin Override" to progress stages when documents are processed offline, which logs an audit entry.
- Mandatory cancellation reason required when cancelling an order.

### Order History
- Immutable history stored in `order_status_history` logging timestamp, previous status, new status, action label, notes, and performed by profile.

### Order Notifications
- **Order Created**: Notifies Sales Agent and Admins.
- **Order Assigned**: Notifies assigned Sales Agent.
- **Order Status Changed**: Notifies Sales Agent, Support Agents, and Admins.
- **Order Cancelled**: Notifies assigned agent and Admins with cancellation reason.

### Order Permissions
- **Admin**: Full access (Create, Edit, Workflow Progression, Document Upload, Cancellation, Admin Override).
- **Sales Agent**: Full sales access (Create, Edit early-stage orders, View assigned orders, Progress workflow stages 1-6, Upload documents, Cancel order with reason).
- **Support Agent**: View-only access (Search orders, View order details, View status & documents, View customer & product history context). Restricted from status progression, pricing edits, line item edits, or cancellation.
### Route-Based Daily Order Operations Dashboard (Step 10 REBUILD)
- **Operational Model**: Replaced traditional e-commerce order management (shopping cart, product line items, subtotals, unit prices, inventory deductions) with a **Route-Based Daily Order Operations Dashboard**.
- **Customer Scheduled Workflows**: Agents process scheduled customers per route/city for any selected date using sequential operational milestone checkboxes:
  1. `Order Received` (Checkbox with timestamp & actor log)
  2. `Sales Order Generated` (Checkbox requiring mandatory Sales Order Reference #)
  3. `Invoiced` (Checkbox requiring mandatory Invoice Reference #)
  4. `Dispatched` (Checkbox with timestamp & actor log)
- **Workflow Dependency Rules**: Strict progression contract (`Order Received` ➔ `SO Generated` ➔ `Invoiced` ➔ `Dispatched`). Cannot mark a step complete without completing the preceding step.
- **Reversion / Undo Guard**: Reverting any completed step prompts for a mandatory audit reason and resets subsequent completed steps.
- **Operational Error Reporting & Query Integration**: Checking `Error` prompts for issue description and priority, automatically creating a Customer Query ticket linked to the daily operation record (`⚠ Error QRY-XXXXXX`).
- **Portal Views & Weekly Route Schedules**: Filtered views for `Kelowna Portal`, `Outside Kelowna Portal`, and `All Portals`. Admin route schedule management at `/admin/routes` configures day-of-week active cities and routes.
- **Customer Profile Integration**: Customer Detail displays `Daily Route Operations` history tab with all past operational dates, statuses, SO #, and Invoice #.

---

## Known Questions / Clarifications

> [!NOTE]
> **Business Shift Schedule Clarification**:
> The business-provided shift schedules are:
> - **Team 1**: `3 PM – 11 AM` (20-hour interval)
> - **Team 2**: `12 PM – 8 AM` (20-hour interval)
>
> Because these shift intervals overlap and exceed standard 8-hour or 12-hour shifts, the CRM preserves these exact values in team configuration and supports overnight flexible shift representation. Formal clarification from business stakeholders is requested regarding whether these shift strings represent 8-hour intervals (e.g., `3 PM – 11 PM` and `12 AM – 8 AM`) or intended overlapping overnight shifts.

---

## Notifications & Alerts

### Notification Architecture
Notifications are driven by a centralized event dispatcher (`NotificationService`). Business operations across the CRM emit standardized events (`query.assigned`, `query.reopened`, `order.assigned`, `order.status_changed`, `product.availability_changed`, `system.admin`).

---

## Authorization / Permissions

| Route / Module | Admin | Sales Agent | Support Agent |
| :--- | :---: | :---: | :---: |
| `/dashboard` | Full Access | Full Access | Full Access |
| `/customers` | Full Access (View, Search, Create, Edit, Deactivate) | Full Access (View, Search, Create, Edit) | Full Access (View, Search, Create, Edit) |
| `/customers/:id` | Full Profile View & Edit | Full Profile View & Edit | Full Profile View & Edit |
| `/queries` | Full Management (Create, Assign, Workflow, Resolve, Close, Reopen) | View Customer Query History (No Ticket Editing / Notes) | Full Ticket Handling (Create, Assign, Workflow, Notes, Resolve, Close, Reopen) |
| `/queries/:id` | Full View, Internal Notes, & Audit Log | View Details (Internal Notes Hidden) | Full View, Internal Notes, & Audit Log |
| `/orders` | Full Access (Create, Edit, Workflow, Admin Override, Cancel) | Full Access (Create, Edit Early, Progress Steps, Upload Docs) | View Customer Orders & Documents (No Workflow Editing) |
| `/orders/:id` | Full View, Workflow Actions, Docs, & Audit Log | Full View, Permitted Workflow Actions, & Docs | View Details, Items, Docs, & History (No Workflow Editing) |
| `/products` | Full Access (Create, Edit, Availability Change, Deactivate) | View Catalog, Search, Pricing, & Availability Status | View Catalog, Search, Pricing, & Availability Status |
| `/products/:id` | Full View, Edit, Availability Change, Audit Trail | View Profile, Specs, Availability Status, & History | View Profile, Specs, Availability Status, & History |
| `/out-of-stock` | Full View & Restore Availability | View Out of Stock Alerts & Reasons | View Out of Stock Alerts & Reasons |
| `/notifications` | Full Access (Own Notifications) | Full Access (Own Notifications) | Full Access (Own Notifications) |
| `/shift-handover` | Full Access (View All, Create, Acknowledge, Audit) | View Team Handovers, Add Order Items | Full Shift Operations (Create, Select Pending, Acknowledge, Complete Items) |
| `/admin` | Full Access (Dashboard, Users, Teams, Roles Matrix, Data Import, Import History, Categories, Brands, Shifts, Settings, Audit Logs) | Access Restricted 🚫 | Access Restricted 🚫 |
| `/admin/import` | Full Access (Upload, Validate, Preview, Confirm, Execute CSV Imports) | Access Restricted 🚫 | Access Restricted 🚫 |
| `/admin/import/history` | Full Access (View Import History & Download Error Reports) | Access Restricted 🚫 | Access Restricted 🚫 |

---

## Routes
- `/login`: Public login screen branded for J&T Supplies CRM.
- `/dashboard`: Primary operational metrics, shift status widget, and greeting.
- `/customers`: Customers directory & table list view.
- `/customers/:id`: Detailed customer profile & linked tickets/orders.
- `/queries`: Support queries management table list view.
- `/queries/:id`: Detailed support ticket, internal notes, & audit trail history view.
- `/orders`: Order management table list view.
- `/orders/:id`: Detailed order profile, 6-stage checklist, items table, docs, & audit history view.
- `/products`: Product catalog management table list view.
- `/products/:id`: Detailed product profile, availability banner, audit history, & related orders.
- `/out-of-stock`: Dedicated Out-of-Stock alerts list view.
- `/notifications`: Full Notifications & Alerts management center page.
- `/shift-handover`: Complete Shift Handover & Team Operations center.
- `/admin`: Centralized Admin Control Center (`/admin` Dashboard, `/admin/users`, `/admin/users/:id`, `/admin/teams`, `/admin/roles`, `/admin/import`, `/admin/import/history`, `/admin/query-categories`, `/admin/product-categories`, `/admin/product-brands`, `/admin/shifts`, `/admin/settings`, `/admin/audit-logs`).

---

## CSV Import System

> **CRITICAL BUSINESS RULE — NO INVENTORY TRACKING**:
> Product import manages product catalog and availability only. It does NOT create or maintain inventory quantities, physical stock balances, or warehouse movements. Product availability (`Available` / `Out of Stock`) is informational only.

### Product CSV Import
Fields:
- `product_name`: Required. Product display name.
- `category`: Required. Product category name (resolved or created dynamically).
- `sku`: Required. Must be unique across catalog and CSV file.
- `availability`: Required. Allowed values: `Available`, `Out of Stock`.

### Customer CSV Import
Fields:
- `customer_name`: Required. Company or business customer display name.
- `whatsapp_number`: Optional. Preserved strictly as string/text (never converted to integer).
- `phone_number`: Optional. Preserved strictly as string/text (never converted to integer).
- `city`: Optional. City location text.
- `route`: Optional. Operational delivery route text.

### CSV Validation
Upload validation enforces file existence, `.csv` format check, UTF-8 BOM stripping, 5MB file size ceiling, header row existence, and required header presence. Invalid rows raise detailed row-level error messages with row numbers.

### Duplicate Detection
- **Products**: SKU uniqueness is checked against the uploaded CSV rows and active database products.
- **Customers**: Contact numbers (phone/WhatsApp) and business names are matched against existing records to flag candidate duplicates for Admin review.

### Import Strategies
1. **Create New Only** (Default & safest): Creates non-existing records; skips existing SKUs or customer matches.
2. **Update Existing**: Updates matched records with imported CSV values.
3. **Skip Existing**: Leaves matched records unchanged without erroring.

### Import Preview
Interactive pre-import preview displaying total rows, valid records count, row-level validation errors, duplicate matches, preview table, strategy selector, and error report export.

### Import Confirmation
Mandatory confirmation modal detailing execution counts (Create, Update, Skip, Error) before committing transactions to the database.

### Import Results
Post-import dashboard presenting exact breakdown (Total Processed, Created, Updated, Skipped, Failed) with direct links to view products/customers, download error reports, or start a new import.

### Import Error Reports
Exportable CSV file (`product_import_errors.csv`, `customer_import_errors.csv`) containing original row index, original row data, and specific error reason.

### Import History
Centralized audit history table (`/admin/import/history`) listing past `import_jobs`, strategy used, timestamp, row counts, admin user profile, and error report downloads.

### Import Audit Logging
Every import event records an immutable system audit log entry under `import_products` or `import_customers` actions.

### Product Availability Import Rules
When using `Update Existing` strategy:
- Updating status from `Available` ➔ `Out of Stock` triggers system-wide `🔴 Product Out of Stock Alert` notification.
- Updating status from `Out of Stock` ➔ `Available` triggers system-wide `🟢 Product Available Again` notification.
- Unchanged availability status does NOT trigger notifications.
- New products imported as `Out of Stock` do NOT trigger change notifications.

### Customer Matching Rules
Matches customers by phone, WhatsApp, or exact company name + phone/WhatsApp combination without silently merging or corrupting existing order/query relationships.

### Security
Strict server-side and permission engine RBAC check (`PermissionsService.canPerformImport`) ensuring only System Administrators can access import routes and perform bulk updates.

---

## Professional Design System & Visual Hierarchy

The application follows a curated, operational visual identity designed for high data density, clarity, and speed on desktop displays.

### Design Tokens & Palette
- **Deep Navy (`#102A43`)**: Primary structural color for app shell, navigation sidebar, and primary operations cards.
- **Electric Teal (`#00A6A6`)**: Primary action accent, focus rings, and active navigation indicator (`▌ Daily Operations`).
- **Warm Amber (`#F2B84B`)**: Pending statuses, warnings, and attention banners.
- **Success Green (`#2E8B57`)**: Completed states, positive operational milestones, and available product badges.
- **Error Red (`#D64545`)**: Critical warnings, customer operational error badges, and destructive actions.
- **Surfaces & Layout**: `#F5F7FA` main background, `#FFFFFF` cards, `#E9EFF5` subtle containers, `#D9E2EC` crisp borders, `#172B4D` primary text, `#52606D` secondary text.
- **Border Radii**: Cards `12px`, Buttons `8px`, Inputs `8px`, Badges `9999px`.

---

## Full Application Data Reset

The CRM application is configured with a clean, 0-data baseline for immediate production use and CSV imports.

### Business Data Baseline
- **Customers**: 0
- **Products**: 0
- **Customer Queries**: 0
- **Daily Operations Records**: 0
- **Sales Orders & Invoices**: 0
- **Notifications**: 0
- **CSV Import History**: 0
- **Business Audit History**: 0

### Preserved System Infrastructure
- **Tables & Schemas**: All database tables, columns, indexes, foreign key constraints, triggers, and RLS policies.
- **Admin Auth & Users**: Admin user `Tauseef (Admin)` (`tauseef@jtsupplies.com`) and team profiles (`Muzammil`, `Abdul Rehman`, `Sohail`, `Aasil`).
- **Teams & Roles**: `Team 1` (3 PM – 11 AM), `Team 2` (12 PM – 8 AM), and RBAC roles (`admin`, `sales_agent`, `support_agent`).
- **Taxonomies & Settings**: Query Categories, Product Categories, Product Brands, System Settings, and Portals (`Kelowna Portal`, `Outside Kelowna Portal`).
- **Weekly Route Schedule**: Monday to Sunday schedule preserved (with Thursday deduplicated to a single `Kelowna` route entry).

## External HTML Data Sources

### Product HTML Source
- **File**: `Untitled-1.html` ("J &T Supplies — Price Reference")
- **Structure**: Contains JavaScript array `const DATA = [...]` with 1,022 detailed product items.
- **Fields Extracted**: `itemCode` (e.g. `199001.0`), `name`, `sku` (e.g. `FPK-GEN-ALUMINFOIL-500FT`), `category` (e.g. `Food Packaging`), `subcategory` (e.g. `Food Wrap`), `unitName` (`Pieces`, `Roll`), `salesUnitName`, `unitGroup`, `targets`, `desiredSPBase`, `minSPBase`, `maxSPBase`.
- **Quality**: 1,022 unique SKUs, 1,022 unique item codes, 0 duplicate records.

### Customer HTML Source
- **File**: `index.html` ("J &T Supplies — Customer Price List")
- **Structure**: Contains JavaScript object `const RAW = { data: { "Customer Name": [ [itemCode, itemName, unit, price, innerUnit, innerQty, unitPrice], ... ] } }`.
- **Fields Extracted**: Customer Name (393 accounts), Historical product ordering list for each customer (6,479 total relationships).
- **Match Quality**: 100% (6,479 out of 6,479) historical item records match exact `itemCode` keys in the main product catalog.

### Product Data Mapping
- Maps `name`, `sku`, `category`, `desiredSPBase` to core CRM `products` catalog fields.
- `desiredSPBase` maps to `unit_price`.
- Operational & pricing metadata (`minSPBase`, `maxSPBase`, `unitGroup`, `targets`) preserved in structured product attributes.

### Customer Data Mapping
- Customer Name maps to `company_name` in the CRM `customers` module.
- `customer_code` auto-generated (`CUST-0001`, `CUST-0002`).
- Missing fields in HTML source (Phone number, WhatsApp number, City, Route) remain empty (`NULL` / empty string).
- **No fake data is invented.**

### Historical Customer-Product Data
- Saved in dedicated `customer_product_history` database table (`customer_id`, `product_id`, `source_item_code`, `source_item_name`, `packaging_unit`, `customer_price`, `inner_unit`, `inner_qty`, `unit_price`, `import_batch_id`).
- Displayed in the Customer Profile under the **"Historical Purchasing Catalog"** tab.
- **Separation of Concepts**: Historical customer ordering behavior is strictly separated from live inventory stock availability. Past purchase price does NOT imply current stock availability.

### Data Normalization
- Customer names trimmed and whitespace-normalized while preserving official display names.
- Product names and item codes normalized for exact matching across files.

### Duplicate Detection
- Product SKU and Item Code matching to prevent duplicate product creation.
- Normalized customer name matching (`lowercase`, whitespace/special char stripped) to prevent duplicate customer accounts.

### Import Process
- Controlled workflow: Upload / Select HTML Files ➔ Parse & Extract ➔ Validate ➔ Normalize ➔ Match ➔ Interactive Import Preview ➔ Review Warnings ➔ Confirm Import ➔ Execute Batch ➔ Import History Log.

---

## Future WhatsApp Integration

> WhatsApp and AI ordering automation are future capabilities. The current implementation only prepares and structures the data and architecture required for future integration.

### Customer Identification
- Future incoming WhatsApp conversations will identify customer accounts via verified `whatsapp_number` (phone number string match).

### WhatsApp Architecture
- Decoupled database schema:
  - `whatsapp_contacts`: (`id`, `customer_id`, `whatsapp_number`, `display_name`, `is_verified`)
  - `whatsapp_conversations`: (`id`, `customer_id`, `whatsapp_contact_id`, `status`, `started_at`, `last_message_at`)
  - `whatsapp_messages`: (`id`, `conversation_id`, `direction`, `message_type`, `message_text`, `external_message_id`, `sent_at`)

### Messaging Layer
- Abstract interface `MessagingProvider` (`sendMessage`, `receiveWebhook`, `verifyContact`) in `src/services/messagingService.ts` to allow changing messaging gateways (Meta WhatsApp Business API, Twilio) without modifying core CRM business logic.

### AI Service Layer
- Abstract interface `AIService` in `src/services/aiService.ts` defining strict, validated tool functions:
  - `findCustomerByWhatsApp(whatsappNumber)`
  - `searchProducts(query)`
  - `getProductDetails(productId)`
  - `getCustomerHistory(customerId)`
  - `checkProductAvailability(productId)`
  - `createOrderRequest(customerId, items, notes)` (Generates draft proposal for human review)
  - `createCustomerQuery(customerId, issueDescription)` (Human escalation to Customer Query module)

### Customer History Context
- When a customer asks for "my usual order", the future AI bot queries `getCustomerHistory` to provide exact product recommendations based on past purchasing behavior.

### Product Catalog Context
- The future AI bot checks `checkProductAvailability` to inform customers of live catalog availability (`Available` vs `Out of Stock`).

### Order Confirmation
- Required human & customer confirmation workflow before any order is created. The AI proposes orders; the customer explicitly confirms before internal draft order requests are generated.

### Human Handoff
- If the AI cannot process a request with high confidence, it invokes `createCustomerQuery` to assign the conversation to a human support agent in the existing Customer Query system.

### Security Model
- No direct AI database credentials or SQL execution permissions.
- The AI communicates exclusively through validated TypeScript/API service functions.

### AI Permissions
- Read: Customer profiles, Product catalog, Inventory availability status, Customer purchasing history.
- Propose: Draft order proposals, clarifying questions.
- Escalate: Create Customer Query for human agent intervention.
- **Strictly Prohibited**: The AI cannot change product prices, modify customer profiles, alter inventory stock, or automatically issue invoices.

### Future Provider Abstraction
- The CRM maintains clean service interfaces for both AI models (LLM providers) and WhatsApp gateways, preventing vendor lock-in.

---

## WhatsApp Order Intelligence — Phase A (Foundation)

> Implemented per the WhatsApp Order Intelligence & Route Order Automation Architecture plan (Phase A). This phase delivers the offline foundation: customer identity binding, conversation/message model, order draft model, product matching engine, customer history matching, and human attention alerts. No simulator or live messaging gateway is included.

### Schema Extensions (`database/schema.sql`)
- New enums: `message_classification`, `order_draft_status`, `match_method`, `attention_priority`, `alert_status`, `bot_status`.
- `whatsapp_conversations` extended: `route`, `delivery_date`, `bot_status`.
- `whatsapp_messages` extended: `sender`, `classification`, `processing_status`, `processed_at`.
- New tables: `order_drafts`, `order_draft_items`, `product_aliases`, `customer_product_aliases`, `route_destinations`, `agent_attention_alerts`, `order_intake_events`.
- RLS: `authenticated` users receive read access; write flows persist through the in-app service layer.

### Incoming Message Pipeline
1. **Text Normalization** (`src/services/textNormalizer.ts`) — lowercase, diacritic/URL stripping, Unicode→ASCII, whitespace collapse, phone normalization, token helpers, edit-distance & overlap similarity utilities.
2. **Message Classification** (`src/services/messageClassifier.ts`) — `ORDER`, `ORDER_CLARIFICATION`, `ORDER_CONFIRMATION`, `NON_ORDER`, `QUESTION`, `COMPLAINT`, `GREETING`, `UNKNOWN`. Complaint messages take precedence when no order-line structure exists; urgency keywords raise priority to `urgent`.
3. **Order Parsing** (`src/services/orderParser.ts`) — splits multi-line orders into segments, extracts `quantity`, `unit`, and product mention; strips leading phrases (`send`, `i need`, …) and date/filler words (`kal`, `aaj`, `today`, `bhai`, `hi`, …); understands word numbers and trailing units. Quantities are never invented — missing quantity is flagged (`quantityMissing`).
4. **Product Matching** (`src/services/productMatcher.ts`) — priority chain: SKU (1.0) → exact name (0.97) → customer alias (0.95) → global alias (0.9) → customer history (containment 0.8–0.9; partial overlap de-weighted) → normalized name (containment 0.9 / overlap ≥ 0.6 / fuzzy ratio ≥ 0.75). Constants: `MIN_MATCH_CONFIDENCE = 0.6`, `AMBIGUITY_DELTA = 0.15`. Ambiguous short mentions (≤ 2 tokens with multiple contenders, or top-2 within delta) return a clarification question instead of a guess. SKU/exact-name matches are never ambiguous.
5. **Order Draft Service** (`src/services/orderDraftService.ts`) — orchestrates `processIncomingMessage`, `confirmDraft`, `applyCorrection`, `pauseBot`, `resumeBot`, `takeOverConversation`; renders confirmation summaries, "order received", route order, and order-request templates. Confirmation is explicit only; drafts move to `CONFIRMED` only on explicit confirmation, then receive an internal reference (`CRM-ORD-XXXXXX`).
6. **Attention Alerts** (`src/services/attentionAlertService.ts`) — raises human-review alerts for questions, complaints, low-confidence orders, and priority escalations; supports `add`/`acknowledge`/`resolve`/`convertAlertToQuery` and alert summaries by priority.

### Matching Rules (enforced)
- History is context only and never overrides an explicit mention in the message.
- Low-confidence matches produce clarification, never guesses.
- Quantity is never invented; missing quantities are flagged for confirmation.

### Storage
- New localStorage keys prefixed `jt_crm_order_*`, `jt_crm_whatsapp_*`, `jt_crm_product_aliases`, `jt_crm_customer_product_aliases`, `jt_crm_route_destinations`, `jt_crm_agent_attention_alerts`, `jt_crm_order_intake_events`; all registered in `supabaseSync.ts` `TABLE_MAP` for write-through. `import.meta.env` reads are optional-chained for Node/test portability.

### Verification
- `npx tsx tests/quickTest.ts` (unit — normalization, classification, parsing, matching, ambiguity, confirmation) and `npx tsx tests/integrationTest.ts` (real 1,022-product / 393-customer catalog flows: order parse → draft → clarification → SKU confirm → internal reference → alerts → intake events). Both suites pass.

---

## WhatsApp Order Intelligence — Phase B (Simulator Workbench)

> Implemented `/whatsapp-simulator` testing workbench for real-world messy customer WhatsApp messages.

### Interactive Features
- **Customer Account Selector**: Select from 393 live customer accounts to pull real history and route metadata.
- **Preset Scenarios**: Multi-product orders, customer history ("usual"), ambiguous mentions, missing quantities, exact SKUs, non-order questions, urgent complaints, order confirmations.
- **Visual Pipeline Inspector**: Displays step-by-step text normalization, message classification, candidate extraction, product catalog matching methods, ambiguity choice prompts, order draft reference generation, and human attention alert triggers.

---

## WhatsApp Order Intelligence — Phase C (Human Review Workspace)

> Implemented `/whatsapp-conversations` inbox and human review workspace for sales and support agents.

### Workspace Capabilities
- **Conversation List & Filters**: Directory of active customer WhatsApp chats filterable by `Attention Required`, `Awaiting Confirmation`, `Human Active`, `Confirmed`, and `All`.
- **Live Chat Stream**: Real-time message history with classification badges and sender tags.
- **Order Draft Inspector**: Displays matched catalog products, line items, quantities, match methods, confidence scores, and internal reference.
- **Human Control Toolbar**: `Human Takeover` toggle (*Bot Paused* vs *Bot Active*), `Pause Bot` / `Resume Bot` controls.
- **Draft Management**: Edit items, change quantities, manual draft approval & confirmation.
- **Query Conversion**: Single-click conversion of non-order attention alerts into formal CRM Support Queries (`QRY-XXXXXX`).

---

## WhatsApp Connector Integration

### Existing Connector
- Node.js microservice (`whatsapp-connector` at `C:\Users\TIW COMPUTER\Desktop\whatsapp-connector`).
- Dependencies: `@whiskeysockets/baileys` (v6.7.9), `@supabase/supabase-js`, `pino`, `qrcode-terminal`, `dotenv`.
- Authenticates directly with WhatsApp Web using Baileys multi-file auth state stored in `./auth` (or `/data/auth` on cloud volume).

### Baileys Architecture
- Listens to WhatsApp messages via `sock.ev.on('messages.upsert')`.
- Renders QR code in terminal for linked device pair setup.
- Captures raw incoming text, `remoteJid` (group/chat JID), `sender_jid` (`participant`), `from_me` flag, and full raw message payload.
- Automatically reconnects on non-logout disconnects.

### Connector Responsibilities
- Primary role: **Communication Gateway & Message Transport**.
- Receives WhatsApp messages and persists raw events to Supabase.
- Sends outbound messages to customer groups and forwards confirmed order summaries to internal route groups (`ORDER_GROUP_JID`).

### CRM Responsibilities
- Primary role: **Business Logic & Operations Engine**.
- Owns Customer account binding (`whatsapp_number` / group JID match), Product Catalog (1,022 SKUs), Customer Purchasing History (6,479 relationships), Multi-level Order Intelligence matching engine, Ambiguity Detection, Order Draft lifecycle (`CRM-ORD-XXXXXX`), Human Takeover, Attention Alerts, and 6-stage Daily Operations Workflow.

### Supabase Responsibilities
- Primary role: **Shared Persistent Data Layer**.
- Maintains unified records for `messages`, `products`, `orders`, `order_items`, `whatsapp_conversations`, `order_drafts`, `order_draft_items`, and `agent_attention_alerts`.

### Message Lifecycle
1. Customer sends message to WhatsApp Group JID.
2. Baileys fires `messages.upsert` in `whatsapp-connector`.
3. Connector extracts `message_id`, `remote_jid`, `sender_jid`, `text`, `is_group`, `from_me`, `raw_message`.
4. Connector writes message record to Supabase table `messages` with `processing_status = 'RECEIVED'`.
5. CRM Order Intelligence Engine reads message, checks idempotency key (`message_id`), updates `processing_status = 'PROCESSING'`, runs classification & product matching, updates order draft, and records `processing_status = 'PROCESSED'`.

### Integration Contract
- **Incoming Message Path**: `WhatsApp` ➔ `Baileys Connector` ➔ `Supabase (messages)` ➔ `CRM Order Intelligence Engine`.
- **Outgoing Message Path**: `CRM` ➔ `Supabase Outbox / Messaging Gateway` ➔ `Baileys Connector (sock.sendMessage)` ➔ `WhatsApp Group JID`.

### Idempotency
- Uses the native WhatsApp `msg.key.id` (or combined `remote_jid + message_id`) as the primary idempotency key.
- Duplicate message events with an already-processed `message_id` are flagged `IGNORED` and skipped without creating duplicate order draft items.

### Error Handling
- Unparseable or low-confidence messages set `processing_status = 'HUMAN_REVIEW'` or `'FAILED'` with `error_reason`.
- Failed messages trigger human attention alerts in `agent_attention_alerts` for agent intervention.

### Environment Variables
- `CUSTOMER_GROUP_JID`: Customer WhatsApp group JID (e.g. `120363431515227779@g.us`).
- `ORDER_GROUP_JID`: Internal operations route group JID (e.g. `120363409575608646@g.us`).
- `SUPABASE_URL`: Live Supabase project URL (`https://zdedyandanzkgvlaivfw.supabase.co`).
- `SUPABASE_ANON_KEY` / `SUPABASE_KEY`: Supabase client access credentials.
- `AUTH_FOLDER`: Local/volume session persistence directory (default `./auth`).

### Database Ownership
- `products`: Owned by CRM catalog. Connector reads for quick fallback match.
- `customers`: Owned by CRM. Matched by `phone` or `whatsapp_number` / group JID.
- `messages`: Owned jointly (Connector writes raw transport data, CRM updates processing status & classification).
- `orders` & `order_items`: Owned by CRM operations (fed by confirmed WhatsApp intake drafts).

---

## WhatsApp Order Intelligence — Phase 3 (Customer History & Product Matching Engine)

> Implemented Order Intelligence Layer utilizing Product Catalog (1,022 items), Customer Accounts (393 accounts), Customer Historical Purchasing Records (6,479 relationships), Product Aliases, Customer-Specific Aliases, and WhatsApp message text parsing.

### Core Processing Flow
1. **Input Payload**: `Customer Account` + `Raw Message Text` + `Product Catalog` + `Customer Historical Products`.
2. **Extraction Engine**: Splits text into distinct segments and extracts product mention strings, numeric quantities, and packaging units.
3. **Deterministic Priority Chain**:
   - `SKU` (Score `1.0`)
   - `Exact Product Name` (Score `0.97`)
   - `Customer-Specific Alias` (Score `0.95`)
   - `Global Product Alias` (Score `0.90`)
   - `Customer Historical Purchase` (Score `0.80–0.90`)
   - `Normalized Token / Fuzzy Match` (Score `0.60–0.90`)
4. **Low-Confidence & Ambiguity Protection**:
   - Mentions with multiple contenders (top-2 within `AMBIGUITY_DELTA = 0.15`) or confidence below `0.60` trigger status `NEEDS_CLARIFICATION` and generate a clarification question listing option choices.
   - Low-confidence products are **never guessed automatically**.
5. **Customer Purchasing History as Context**:
   - Historical entries provide context for vague phrases like *"send my usual gloves"*.
   - **Explicit Intent Priority**: Current explicit customer text (e.g. *"send black gloves medium"*) always takes precedence over historical preferences.
6. **Quantity & Unit Integrity**:
   - Quantities are never invented. Missing quantities set status `NEEDS_CLARIFICATION` and prompt: *"How many would you like?"*.
7. **Order Draft Lifecycle**:
   - Draft records created in `order_drafts` and `order_draft_items` capturing Customer ID, Route, Delivery Date, Customer Text, Matched Product ID, Matched Product Name, Quantity, Unit, Match Method, Match Confidence, and Status.
8. **Human Review Operations**:
   - Agents review drafts in `/whatsapp-conversations` and `/whatsapp-simulator` with controls to `Approve`, `Edit`, `Reject`, or `Request Clarification`.
   - **No Automated WhatsApp Sending**: In Phase 3, no automated messages are sent to real WhatsApp customers during testing.

### Verified Test Cases (12 Test Scenarios)
- ✅ Exact product match (SKU & exact catalog name)
- ✅ Misspelling (diacritic removal & fuzzy token matching)
- ✅ Abbreviation (alias & short code matching)
- ✅ Multiple products in single message (multi-segment splitting)
- ✅ Missing quantity (`quantityMissing` & clarification prompt)
- ✅ Ambiguous product (multiple contenders trigger choice prompt)
- ✅ Customer historical product (*"send my usual gloves"*)
- ✅ Unknown product (`unmatched` candidates trigger prompt)
- ✅ Customer correction (updating active draft line items)
- ✅ Duplicate message (idempotency key check on `message_id`)
- ✅ Non-order message (`GREETING`, `QUESTION`, `COMPLAINT` handling)
- ✅ Mixed order + question (order draft created + attention alert raised for secondary question)

---

## Change Log
All technical changes are logged in [CHANGELOG.md](file:///c:/Users/TIW%20COMPUTER/Desktop/CRM/CHANGELOG.md).



