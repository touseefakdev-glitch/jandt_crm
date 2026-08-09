# Changelog

All notable changes to the **J&T Supplies CRM** project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to Semantic Versioning.

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
