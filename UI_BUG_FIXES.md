# UI Bug Fixes — Input Focus Loss Resolution

## Issue Summary
**Problem**: Input fields across the application (Customer Name, Phone, WhatsApp, City, Route, SKU, Product Name, Sales Order #, Invoice #, Query Subject, Descriptions, Notes, Textareas, Search fields) were losing focus after every single character typed.

---

## Root Cause Analysis
- **Location**: `src/components/ui/Modal.tsx` and `src/components/ui/Drawer.tsx`
- **Mechanism**:
  1. `Modal` and `Drawer` contained a `useEffect` hook managing keyboard listeners and focus traps.
  2. The `useEffect` depended on `[isOpen, handleKeyDown]`, where `handleKeyDown` depended on `[closeOnEsc, onClose]`.
  3. Form components pass `onClose` to `<Modal>` and `<Drawer>` as an inline callback (e.g. `onClose={() => setIsModalOpen(false)}`).
  4. Every character typed into a form input updated form state and re-rendered the parent, producing a new `onClose` function reference.
  5. The changed `onClose` reference caused `handleKeyDown` to update, triggering the `useEffect` cleanup function in `Modal` / `Drawer`.
  6. The cleanup function executed `previouslyFocused.current?.focus()`, which instantly transferred DOM focus away from the active input field to the background page element.
  7. 50ms later, a timeout in the newly mounted effect focused the first focusable element inside the modal.

---

## Technical Fix
1. **Decoupled `onClose` Prop**:
   - Introduced `onCloseRef = useRef(onClose)` in both `Modal.tsx` and `Drawer.tsx`.
   - Updated `onCloseRef.current = onClose` on every render without triggering effect lifecycle tear-down.
2. **Separated Keyboard & Open/Close Lifecycle Effects**:
   - Keydown event listener effect depends strictly on `[isOpen, closeOnEsc]` and invokes `onCloseRef.current?.()`.
   - Open/close lifecycle effect depends strictly on `[isOpen]`.
   - Focus restoration (`previouslyFocused.current?.focus()`) and initial focus auto-selection run **only** when `isOpen` transitions between `false` and `true`, and never during form re-renders while `isOpen` is `true`.

---

## Affected Components Verified Fixed

| Component / Module | Affected Fields | Status |
| :--- | :--- | :--- |
| **Customer Forms** (`CustomerFormModal.tsx`) | Customer Name, Contact Person, Phone, WhatsApp, Email, Street Address, City, Route, Country, Internal Notes | **FIXED** |
| **Product Forms** (`ProductFormModal.tsx`) | SKU / Product Code, Product Name, Unit Price, Description & Specs, Availability Notes, Expected Date | **FIXED** |
| **Order Forms** (`SOModal.tsx`, `InvoiceModal.tsx`, `UndoStepModal.tsx`, `ReportErrorModal.tsx`, `OrderMatchModal.tsx`) | Sales Order #, Invoice #, Undo Reason, Error Ticket Description, Difference Note | **FIXED** |
| **Query Forms** (`QueryFormModal.tsx`, `QueryStatusModal.tsx`, `QueryAssignModal.tsx`) | Customer Filter Search, Subject Line, Detailed Description, Confidential Agent Notes, Status Reason | **FIXED** |
| **Drawers** (`OrderDetailDrawer.tsx`) | Step Notes, Operation Detail inputs | **FIXED** |
| **Global Search Bars** (`Customers.tsx`, `Products.tsx`, `Orders.tsx`, `Queries.tsx`, `AdminUsers.tsx`, `TableToolbar.tsx`) | Search input fields | **FIXED** |
