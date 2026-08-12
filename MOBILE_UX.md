# J&T Supplies CRM — Mobile UX & Architecture Guide

> Purpose-built, highly responsive operational CRM experience for mobile screens (320px–768px).

---

## 1. Core Mobile Design Principles

1. **Card-First Interface:** Tables are not suitable for mobile screens. Under the `md` breakpoint (`< 768px`), all primary operational lists (**Orders**, **Queries**, **Customers**) render as purpose-built **Mobile Cards**.
2. **Zero Page Horizontal Scroll:** The page container (`html`, `body`, `main`) NEVER scrolls horizontally. Only explicit filter-chip containers use `overflow-x-auto`.
3. **Instant Operational Clarity:** A user looking at any mobile order card understands within 2 seconds:
   - What order/customer this is.
   - The 6-stage progress checklist (`Received` → `SO` → `Invoice` → `Dispatch` → `Match` → `POD`).
   - The exact **NEXT ACTION** required to advance the order.
4. **Touch Target Standard:** All interactive elements (buttons, filter chips, dropdown triggers, bottom nav items) have a minimum touch target area of **44 × 44px**.

---

## 2. Navigation Architecture

```
┌────────────────────────────────────────────────────────────┐
│ COMPACT HEADER (56px) — Brand Logo, Title, Bell, Avatar    │
├────────────────────────────────────────────────────────────┤
│ MAIN WORKSPACE CONTENT                                     │
│ (Order cards / Query cards / Customer cards)               │
│                                                            │
├────────────────────────────────────────────────────────────┤
│ FIXED BOTTOM NAVIGATION BAR (md:hidden)                     │
│ [ ⌂ Home ] [ ▣ Orders ] [ ⚠ Queries ] [ ♙ Customers ] [ ••• ] │
└────────────────────────────────────────────────────────────┘
```

### Bottom Navigation Bar (`MobileBottomNav.tsx`)
- Fixed at the bottom of the viewport on mobile devices (`md:hidden`).
- High-visibility active indicator with teal accent highlight.
- **"More" Operations Sheet:** Opens a slide-up drawer containing shortcuts for **Shift Handover**, **Out of Stock**, **Products Catalog**, **Notifications**, and **Admin Tools**.
- **Page Padding:** `AppShell` applies `pb-20` on mobile so no page content is ever obscured by the bottom bar.

---

## 3. Mobile Order Card Anatomy (`MobileOrderCard.tsx`)

Each order card presents essential operational context without clutter:

```
┌────────────────────────────────────────────────────────────┐
│ CUST-00042        [KELOWNA]                            ••• │
│                                                            │
│ ABC Medical Supplies                                       │
│ Kelowna • Main Route                                       │
│                                                            │
│ [ ✓ Rec  ✓ SO  ✓ Inv  ✓ Disp  ⏳ Match  ○ POD ]             │
│                                                            │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ NEXT ACTION: MATCH SALES ORDER WITH INVOICE  [Execute] │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                            │
│ ⏳ Wait for Dispatch / Check Match          10 mins ago   │
└────────────────────────────────────────────────────────────┘
```

- **Top Row:** Customer/Order Code badge, Operational Area badge (`[KELOWNA]` or `[OUTSIDE KELOWNA]`), and 3-dot dropdown menu (`•••` for Quick Actions: View Details, Check Match, Report Issue).
- **Customer Row:** Company name (15px bold text), City, Route.
- **Workflow Checklist Rail:** Visual status chips showing completed stages with green checkmarks and active glowing indicators (`Rec` → `SO` → `Invoice` → `Dispatch` → `Match` → `POD`).
- **NEXT ACTION Banner:** High-visibility banner highlighting the next required stage (e.g. `NEXT: DISPATCH ORDER`, `NEXT: MATCH SALES ORDER WITH INVOICE`, `NEXT: SEND POD`, or `✓ Completed`).
- **Order Match Indicator:** `⏳ Wait for Dispatch` before dispatch, `[ Check Match ]` after dispatch, `✓ SAME` or `⚠ DIFFERENT` (with expandable difference note).

---

## 4. Mobile Order Details Drawer

Tapping any order card opens the mobile **Order Details** panel:
- **Header:** Order number, customer code, and customer company name.
- **Customer & Route Info:** Full location details and route schedule context.
- **Workflow Stepper:** Visual 5-stage progress indicator.
- **Order Match Adjudication:** `SAME` vs `DIFFERENT` status + difference note.
- **Documents & Audit Trail:** Sales Order #, Invoice #, linked queries, and step history timeline.
- **Sticky Action Bar:** Fixed bottom bar providing a 1-tap `[ NEXT ACTION ]` button and a prominent `[ ⚠ REPORT ISSUE ]` button that pre-populates order and customer information into a new query.

---

## 5. Touch Target & Responsive Breakpoints

| Breakpoint | Range         | Layout Behavior                                                      |
| ---------- | ------------- | -------------------------------------------------------------------- |
| Small Mobile | `320px–374px` | 1-column stacked cards, full-width inputs, 44px min touch targets    |
| Standard Mobile | `375px–429px` | 1-column order cards, 2-column KPI grid on Dashboard                |
| Large Mobile / Phablet | `430px–767px` | 1-column order cards, 2-column KPI grid, fluid horizontal filter rails|
| Tablet / Desktop | `≥ 768px`     | Desktop AppShell (Sidebar + Header), 1920px data tables, zero cards |

---

## 6. Mobile Realtime & Network Feedback

- **Live Updates:** `subscribeOrdersRealtime` updates local card states silently when changes occur from other users/devices without page reloads or layout jumps.
- **Connection Pill:** Header displays live status (`Supabase Live` / `Local Mode` / `Checking`).
