# Mobile UI/UX Renovation & Architecture Specification
**J&T Supplies CRM — Operational Mobile Application Experience**

---

## 1. Executive Summary & Design Principles

The mobile interface of the J&T Supplies CRM has been completely audited and renovated. Rather than shrinking desktop layouts or forcing wide tables onto small mobile screens, the CRM now implements a **Mobile-First Operational Card Architecture** across all modules.

### Key Architectural Guidelines
1. **Responsive Dual Viewports**:
   - Mobile View (`block md:hidden`): Touch-first stacked operational cards, large touch targets ($\ge 44\text{px}$), vertical workflow timelines, quick action buttons, and clear typography.
   - Desktop View (`hidden md:block`): Preserved multi-column tabular view ($\ge 1024\text{px}$) with sticky columns, dense metrics, and full keyboard-driven navigation.
2. **Strict Horizontal Scroll Elimination**:
   - Zero `overflow-x` scrolling on primary screens. Cards automatically adapt to device viewports across **320px**, **360px**, **375px**, **390px**, **414px**, **430px**, and **768px**.
3. **Touch-First Target Guidelines**:
   - All interactive buttons, inputs, tabs, checkboxes, and links guarantee a minimum touch target height of **$44\text{px}$** with proper active state scaling feedback (`active:scale-[0.99]`).
4. **Input Focus Stability**:
   - Controlled state bindings preserve continuous DOM focus during rapid typing, preventing input blur bugs after entering single characters.

---

## 2. Renovated Mobile Layouts by Module

### 📦 Operational Orders Workspace (`/orders`)
- **Mobile Cards (`<MobileOrderCard>`)**:
  - Displays customer name, company code, city, route badge, and grand total.
  - **Vertical Workflow Timeline**: Replaces horizontal multi-step progress bars with a clear vertical timeline showing step status (Received $\rightarrow$ Sales Order $\rightarrow$ Invoiced $\rightarrow$ Dispatched).
  - **Quick Action Row**: Minimum $44\text{px}$ tap targets for step toggle, order match update (`SAME` / `DIFFERENT`), reporting errors, and updating Sales Orders / Invoices.
  - **Mobile Toolbar**: Responsive filter selects with clean grid layout and sticky tab bar.

### 🏢 Customer Management (`/customers`)
- **Mobile Cards (`<MobileCustomerCard>`)**:
  - Compact header with customer company avatar, status badge, code, and contact person.
  - **Direct Contact Touch Buttons**:
    - 📞 **Direct Phone Call**: Opens system dialer with `tel:${phone}`.
    - 💬 **WhatsApp Quick Chat**: Opens WhatsApp web/app directly with `https://wa.me/${cleanPhone}`.
  - **Profile Action**: Dedicated full-width tap target for profile navigation and editing.

### 🗂️ Customer Issue & Queries Center (`/queries`)
- **Mobile Cards (`<MobileQueryCard>` & `<MobileBackOrderCard>`)**:
  - Priority and status badges on top right.
  - Category tag (`Wrong Item`, `Return Request`, `Price Issue`, `Quality Issue`, `Item Not Received`, `Other`).
  - Order and product reference badges.
  - **Back Orders Mobile Card**: Shows customer, product, quantity, delivery reason, and next delivery date with 1-tap status updates (`PENDING` $\rightarrow$ `SCHEDULED` $\rightarrow$ `SENT` $\rightarrow$ `COMPLETED`).

### 📦 Catalog Products & Out of Stock Alerts (`/products`, `/out-of-stock`)
- **Mobile Cards (`<MobileProductCard>` & `<MobileOutOfStockCard>`)**:
  - Monospaced SKU tag, availability badge, unit price, category, and brand metadata.
  - Unavailability reason alert box with expected return date.
  - Quick action buttons for viewing product profile, editing details, and restoring availability.

### 👥 User Administration & Route Schedules (`/admin/users`, `/admin/route-schedules`)
- **Mobile User Cards**: User avatar, role badge, operational team, email, and active/inactive status toggle.
- **Mobile Route Schedule Cards**: Day of week, city/route name, portal badge (Kelowna vs Outside Kelowna), and activation toggle.

---

## 3. Supported Devices & Viewport Range

| Device Screen Size | Width (px) | Primary Layout Strategy |
| :--- | :--- | :--- |
| **Small Mobile** | `320px` – `360px` | 1-Column Stacked Cards, Full-Width Inputs, Large Action Buttons |
| **Standard Mobile** | `375px` – `390px` | 1-Column Cards, 2-Column Metrics, Sticky Bottom Navigation |
| **Large Mobile / Phablet**| `414px` – `430px` | Extended Card Layout, Touch-Optimized Modals |
| **Tablet Portrait** | `768px` | Hybrid Responsive Grid (2-Column Cards) |
| **Desktop / Laptop** | `> 1024px` | Full Table Layout with Sticky Columns & Keyboard Controls |

---

## 4. Design System Tokens & Classes

- **Brand Color Palette**:
  - Electric Teal: `#00A6A6` (`brand-600`, `teal-600`)
  - Deep Navy: `#102A43` (`navy-800`, `slate-900`)
  - Warm Amber: `#F2B84B` (`amber-500`)
  - Soft Neutral Card Background: `#FFFFFF` with `#E9EFF5` border
- **CSS Utility Classes**:
  - `.crm-card`: Elevated mobile container with smooth border transitions.
  - `.rounded-btn`: $10\text{px}$ smooth border radius matching 3D visual depth.
  - `min-h-[44px]`: Minimum touch target height for mobile controls.
