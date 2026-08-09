-- =============================================================================
-- J&T Supplies CRM — Seed Data & App Access Policies
-- Run this in the Supabase SQL Editor AFTER schema.sql has been applied
-- (the new Vercel-linked project has tables but no data).
--
-- It is idempotent and safe to re-run.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Teams (aligned with src/services/db.ts SEED_TEAMS)
-- ---------------------------------------------------------------------------
INSERT INTO public.teams (id, name, shift_info, shift_start, shift_end, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Team 1', '3 PM – 11 AM', '15:00', '11:00', TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Team 2', '12 PM – 8 AM', '12:00', '08:00', TRUE)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    shift_info = EXCLUDED.shift_info,
    shift_start = EXCLUDED.shift_start,
    shift_end = EXCLUDED.shift_end;

-- ---------------------------------------------------------------------------
-- 2. Profiles (aligned with src/services/db.ts SEED_USERS — the app logs in
--    by email against these rows, so emails MUST match)
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, role, team_id, is_active) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'tauseef@jtsupplies.com', 'Tauseef (Admin)', 'admin', '11111111-1111-1111-1111-111111111111', TRUE),
    ('b2222222-2222-2222-2222-222222222222', 'muzammil@jtsupplies.com', 'Muzammil (Sales)', 'sales_agent', '11111111-1111-1111-1111-111111111111', TRUE),
    ('c3333333-3333-3333-3333-333333333333', 'abdulrehman@jtsupplies.com', 'Abdul Rehman (Support)', 'support_agent', '22222222-2222-2222-2222-222222222222', TRUE),
    ('d4444444-4444-4444-4444-444444444444', 'sohail@jtsupplies.com', 'Sohail (Sales)', 'sales_agent', '11111111-1111-1111-1111-111111111111', TRUE),
    ('e5555555-5555-5555-5555-555555555555', 'aasil@jtsupplies.com', 'Aasil (Support)', 'support_agent', '22222222-2222-2222-2222-222222222222', TRUE)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    team_id = EXCLUDED.team_id,
    is_active = TRUE;

-- ---------------------------------------------------------------------------
-- 3. Query Categories
-- ---------------------------------------------------------------------------
INSERT INTO public.query_categories (id, name, description) VALUES
    ('00000000-0000-0000-0001-000000000001', 'Order Issue', 'Order discrepancies, wrong quantities, or missing order confirmation'),
    ('00000000-0000-0000-0001-000000000002', 'Delivery Issue', 'Carrier delays, damaged packaging, or incorrect delivery address'),
    ('00000000-0000-0000-0001-000000000003', 'Invoice Issue', 'Billing errors, tax exempt status, or missing commercial invoices'),
    ('00000000-0000-0000-0001-000000000004', 'Product Issue', 'Defective items, technical specifications, or quality assurance inquiries'),
    ('00000000-0000-0000-0001-000000000005', 'Stock Availability', 'Product availability inquiries, backorder lead times, or stock restock dates'),
    ('00000000-0000-0000-0001-000000000006', 'Payment Issue', 'Payment gateway failures, wire transfer confirmations, or credit terms'),
    ('00000000-0000-0000-0001-000000000007', 'Customer Information', 'Account contact details, address updates, or tax exemption status'),
    ('00000000-0000-0000-0001-000000000008', 'General Inquiry', 'General business inquiries, catalog requests, or support shift info'),
    ('00000000-0000-0000-0001-000000000009', 'Other', 'Uncategorized customer tickets requiring agent evaluation')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 4. Product Categories & Brands
-- ---------------------------------------------------------------------------
INSERT INTO public.product_categories (id, name, description) VALUES
    ('00000000-0000-0000-0002-000000000001', 'Food Wrap', 'Commercial food packaging wraps, cling wraps, parchment and wax paper sheets'),
    ('00000000-0000-0000-0002-000000000002', 'Foil Items', 'Standard, heavy-duty, and freezer aluminum foil rolls and insulated sheets'),
    ('00000000-0000-0000-0002-000000000003', 'Bags', 'Grease proof dry wax sandwich bags and commercial food service paper bags'),
    ('00000000-0000-0000-0002-000000000004', 'Pizza Essentials', 'Standard and corrugated pizza box inserts, liners, and liners cases')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_brands (id, name, description) VALUES
    ('00000000-0000-0000-0003-000000000001', 'J&T Packaging', 'Premium commercial food packaging products'),
    ('00000000-0000-0000-0003-000000000002', 'GenPak / Royal', 'High quality cling film rolls and baking paper supplies'),
    ('00000000-0000-0000-0003-000000000003', 'FoilPro', 'Heavy-duty commercial aluminum foil and freezer paper rolls'),
    ('00000000-0000-0000-0003-000000000004', 'PizzaGuard', 'Corrugated and moisture-resistant pizza liner products')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Products
-- ---------------------------------------------------------------------------
INSERT INTO public.products
(id, sku, product_name, description, category_id, brand_id, unit_price, availability_status, availability_notes, expected_available_date) VALUES
    ('00000000-0000-0000-0004-000000000001', 'FPK-GEN-ALUMINFOIL-500FT', 'Aluminum Foil Roll - Width 12 inches x 500ft (6/Case)', 'Food Packaging · Food Wrap | Item Code: 199001 | Pack: Case-6-Pcs | Base UOM: Pieces | Target: Pieces | Min SP: $28.00 | Desired SP: $29.00 | Max SP: $40.50', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000003', 29.00, 'available', 'In stock for immediate commercial delivery.', NULL),
    ('00000000-0000-0000-0004-000000000002', 'FPK-FOIL-ALUMINFOIL-18IN', 'Aluminum Foil Roll Heavy Duty - Width 18 inches – Length 45Cmx100m (4/Case)', 'Food Packaging · Foil Items | Item Code: 106001 | Pack: Case-4-Pcs | Base UOM: Pieces | Target: Pieces | Min SP: $32.99 | Desired SP: $32.99 | Max SP: $38.22', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0003-000000000003', 32.99, 'available', 'Heavy-duty 18-inch commercial foil in stock.', NULL),
    ('00000000-0000-0000-0004-000000000003', 'FPK-FOIL-ALUMINFOILWIDTH-18IN', 'Aluminum Foil Roll – Width 18in – Length 152m (per roll)', 'Food Packaging · Foil Items | Item Code: 106002 | Base UOM: Roll | Target: Roll | Min SP: $33.00 | Desired SP: $38.00 | Max SP: $44.02', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0003-000000000003', 38.00, 'available', 'Standard 152m single roll packaging.', NULL),
    ('00000000-0000-0000-0004-000000000004', 'FPK-GEN-CLINGWRAP-2000FT', 'Cling Wrap Roll 11in – Film PVC 2000 ft – Royal (with cutter)', 'Food Packaging · Food Wrap | Item Code: 199002 | Base UOM: Roll | Target: Roll | Min SP: $34.00 | Desired SP: $35.00 | Max SP: $40.55', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000002', 35.00, 'available', 'Equipped with safety slide cutter box.', NULL),
    ('00000000-0000-0000-0004-000000000005', 'FPK-GEN-CLINGWRAPFILM-2000FT', 'Cling Wrap Roll 12in – Film PVC 2000 ft', 'Food Packaging · Food Wrap | Item Code: 199003 | Base UOM: Roll | Target: Roll | Min SP: $30.00 | Desired SP: $35.00 | Max SP: $39.00', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000002', 35.00, 'available', 'Commercial PVC cling film 12-inch roll.', NULL),
    ('00000000-0000-0000-0004-000000000006', 'FPK-GEN-CLINGWRAPFILMPVC-2000FT', 'Cling Wrap Roll 18in – Film PVC 2000 ft (with cutter)', 'Food Packaging · Food Wrap | Item Code: 199004 | Base UOM: Roll | Target: Roll | Min SP: $35.00 | Desired SP: $37.00 | Max SP: $42.86', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000002', 37.00, 'available', 'Wide 18-inch roll with integrated cutter.', NULL),
    ('00000000-0000-0000-0004-000000000007', 'FPK-GEN-ITEM-1', 'Cling Wrap Roll 24in – Film PVC 2000 ft (with cutter)', 'Food Packaging · Food Wrap | Item Code: 199005 | Base UOM: Roll | Target: Roll | Min SP: $45.00 | Desired SP: $49.99 | Max SP: $57.91', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000002', 49.99, 'available', 'Extra-wide 24-inch PVC film with cutter.', NULL),
    ('00000000-0000-0000-0004-000000000008', 'FPK-GEN-PAPERWAX-8X11IN', 'Paper Wax Dry 8×11in Scale - 2000/Pack (4/CS)', 'Food Packaging · Food Wrap | Item Code: 199006 | Pack: Case-8000-Pcs (+Pack-2000) | Base UOM: Pieces | Target: Case | Min SP: $140.00 | Desired SP: $144.00 | Max SP: $167.20', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000001', 144.00, 'available', 'Bulk scale dry wax paper case (8000 sheets).', NULL),
    ('00000000-0000-0000-0004-000000000009', 'FPK-FOIL-FREEZENATURA-18IN', 'Freezer Roll – Natural – Width 18in', 'Food Packaging · Foil Items | Item Code: 106003 | Base UOM: Roll | Target: Roll | Min SP: $49.00 | Desired SP: $50.00 | Max SP: $57.92', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0003-000000000003', 50.00, 'out_of_stock', 'Resupply shipment in transit from paper mill.', CURRENT_DATE + INTERVAL '7 days'),
    ('00000000-0000-0000-0004-000000000010', 'FPK-FOIL-FREEZEROSE-18IN', 'Freezer Roll – Rose – Width 18in', 'Food Packaging · Foil Items | Item Code: 106004 | Base UOM: Roll | Target: Roll | Min SP: $49.00 | Desired SP: $50.00 | Max SP: $57.92', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0003-000000000003', 50.00, 'available', 'Rose tint freezer paper roll in stock.', NULL),
    ('00000000-0000-0000-0004-000000000011', 'FPK-BAG-GREASEPROOF-6X0.75X6.75', 'Grease Proof Dry Wax Sandwich Bags 6"X3/4"x6 3/4" / 6x0.75x6.75 - 1000/CS', 'Food Packaging · Bags | Item Code: 101001 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $31.00 | Desired SP: $34.00 | Max SP: $40.00', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0003-000000000001', 34.00, 'available', 'Grease-proof dry wax paper sandwich bags (1000/CS).', NULL),
    ('00000000-0000-0000-0004-000000000012', 'FPK-GEN-INSULAALUMIN-12X12IN', 'Insulated Aluminium Foil Paper Sheets – 12×12in (1000/CS)', 'Food Packaging · Food Wrap | Item Code: 199007 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $39.00 | Desired SP: $42.00 | Max SP: $48.60', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000003', 42.00, 'available', '12x12 pre-cut insulated foil sheets (1000/CS).', NULL),
    ('00000000-0000-0000-0004-000000000013', 'FPK-GEN-INSULAALUMIN-14X14IN', 'Insulated Aluminium Foil Paper Sheets – 14×14in (1000/CS)', 'Food Packaging · Food Wrap | Item Code: 199008 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $45.00 | Desired SP: $50.00 | Max SP: $57.90', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000003', 50.00, 'available', '14x14 pre-cut insulated foil sheets (1000/CS).', NULL),
    ('00000000-0000-0000-0004-000000000014', 'FPK-GEN-PIZZALINER-11X11', 'Pizza Liner 11x11 400/CS', 'Food Packaging · Pizza Essentials | Item Code: 199009 | Pack: Case-400-Pcs | Base UOM: Pieces | Target: Case | Min SP: $36.00 | Desired SP: $40.00 | Max SP: $48.00', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0003-000000000004', 40.00, 'available', '11x11 pizza liners (400/CS).', NULL),
    ('00000000-0000-0000-0004-000000000015', 'FPK-GEN-PIZZALINER-13X13', 'Pizza Liner 13x13 - Corrugated - 400/CS', 'Food Packaging · Pizza Essentials | Item Code: 199010 | Pack: Case-400-Pcs | Base UOM: Pieces | Target: Case | Min SP: $79.00 | Desired SP: $84.00 | Max SP: $95.00', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0003-000000000004', 84.00, 'available', 'Corrugated 13x13 pizza liners (400/CS).', NULL),
    ('00000000-0000-0000-0004-000000000016', 'FPK-GEN-PIZZALINER-15X15', 'Pizza Liner 15x15 - Corrugated - 400/CS', 'Food Packaging · Pizza Essentials | Item Code: 199011 | Pack: Case-400-Pcs | Base UOM: Pieces | Target: Case | Min SP: $85.00 | Desired SP: $92.00 | Max SP: $105.00', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0003-000000000004', 92.00, 'available', 'Corrugated 15x15 pizza liners (400/CS).', NULL),
    ('00000000-0000-0000-0004-000000000017', 'FPK-GEN-PIZZALINER-9X9', 'Pizza Liner 9x9 - 400/CS', 'Food Packaging · Pizza Essentials | Item Code: 199012 | Pack: Case-400-Pcs | Base UOM: Pieces | Target: Case | Min SP: $28.00 | Desired SP: $34.00 | Max SP: $40.24', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0003-000000000004', 34.00, 'available', '9x9 pizza box liners (400/CS).', NULL),
    ('00000000-0000-0000-0004-000000000018', 'FPK-GEN-PARCHMPAPER-16X24IN', 'Parchment Paper – Sheet 16×24in (1000/CS)', 'Food Packaging · Food Wrap | Item Code: 199013 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $120.00 | Desired SP: $124.00 | Max SP: $143.60', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000002', 124.00, 'available', '16x24 commercial parchment paper sheets (1000/CS).', NULL),
    ('00000000-0000-0000-0004-000000000019', 'FPK-GEN-PATTYPAPER-5.25X5.25IN', 'Patty Paper 5.25x5.25in (1000/CS)', 'Food Packaging · Food Wrap | Item Code: 199014 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $9.50 | Desired SP: $10.00 | Max SP: $10.60', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000001', 10.00, 'available', '5.25x5.25 burger patty interleaving paper (1000/CS).', NULL),
    ('00000000-0000-0000-0004-000000000020', 'FPK-GEN-WAXPAPER-12X12IN', 'Wax Paper – Black & White – Liner Basket Black Check - 12×12in (1000/CS)', 'Food Packaging · Food Wrap | Item Code: 199015 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $34.00 | Desired SP: $36.00 | Max SP: $41.70', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000001', 36.00, 'available', 'Black check printed basket liner wax paper (1000/CS).', NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Customers
-- ---------------------------------------------------------------------------
INSERT INTO public.customers (id, customer_code, company_name, contact_person, phone, email, address, city, country, status, notes) VALUES
    ('10000000-0000-0000-0000-000000000001', 'CUST-000001', '0941791 BC.ltd', 'Gurpreet Singh', '+1 (604) 555-0191', 'contact@0941791bc.ca', '10245 152 St', 'Surrey', 'Canada', 'active', '17 items priced. Key commercial food packaging account.'),
    ('10000000-0000-0000-0000-000000000002', 'CUST-000002', '4G Commercial', 'Tariq Mahmood', '+1 (250) 555-0144', 'orders@4gcommercial.com', '880 Commercial Way', 'Vancouver', 'Canada', 'active', '8 items priced. Commercial supply client.'),
    ('10000000-0000-0000-0000-000000000003', 'CUST-000003', '5309 Main street, Unit 100', 'Usman Ali', '+1 (604) 555-5309', 'unit100@mainstreetsupplies.ca', '5309 Main Street, Unit 100', 'Vancouver', 'Canada', 'active', '1 item priced. Retail location customer.'),
    ('10000000-0000-0000-0000-000000000004', 'CUST-000004', 'AA Tire Kelowna', 'Bilal Ahmed', '+1 (250) 555-0177', 'service@aatilekelowna.com', '1920 Enterprise Way', 'Kelowna', 'Canada', 'active', '3 items priced. Commercial customer.'),
    ('10000000-0000-0000-0000-000000000005', 'CUST-000005', 'Academy Store', 'Farhan Khan', '+1 (604) 555-0122', 'manager@academystore.ca', '3450 Academy Way', 'Burnaby', 'Canada', 'active', '5 items priced. Campus supply store.'),
    ('10000000-0000-0000-0000-000000000006', 'CUST-000006', 'Afrofusion Kamloops', 'Zubair Siddiqui', '+1 (250) 555-0188', 'kitchen@afrofusionkamloops.com', '450 Tranquille Rd', 'Kamloops', 'Canada', 'active', '18 items priced. Restaurant & food wrapping customer.'),
    ('10000000-0000-0000-0000-000000000007', 'CUST-000007', 'Alcatraz Chicken', 'Hamza Malik', '+1 (604) 555-0199', 'info@alcatrazchicken.com', '1120 Robson St', 'Vancouver', 'Canada', 'active', '5 items priced. Fast food chain - regular foil & wrap orders.')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Orders (referenced by customer queries below)
-- ---------------------------------------------------------------------------
INSERT INTO public.orders
(id, order_number, customer_id, sales_agent_id, current_status, subtotal, total_discount, total_tax, grand_total, notes, created_by, updated_by) VALUES
    ('00000000-0000-0000-0005-000000000001', 'ORD-000001', '10000000-0000-0000-0000-000000000001', 'b2222222-2222-2222-2222-222222222222', 'invoiced', 1010.00, 20.00, 50.50, 1040.50, 'Bulk food packaging foil rolls and dry wax paper shipment.', 'b2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222'),
    ('00000000-0000-0000-0005-000000000002', 'ORD-000002', '10000000-0000-0000-0000-000000000006', 'd4444444-4444-4444-4444-444444444444', 'dispatched', 958.00, 30.00, 47.90, 975.90, 'Restaurant food wrap and corrugated pizza liner order.', 'd4444444-4444-4444-4444-444444444444', 'd4444444-4444-4444-4444-444444444444'),
    ('00000000-0000-0000-0005-000000000003', 'ORD-000003', '10000000-0000-0000-0000-000000000007', 'b2222222-2222-2222-2222-222222222222', 'order_received', 870.00, 0.00, 43.50, 913.50, 'Fast food sandwich bags and black check basket liners.', 'b2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222'),
    ('00000000-0000-0000-0005-000000000004', 'ORD-000004', '10000000-0000-0000-0000-000000000002', 'a1111111-1111-1111-1111-111111111111', 'completed', 2239.80, 100.00, 111.99, 2251.79, 'Commercial cling wrap 24in and parchment paper sheets.', 'a1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. Customer Queries
-- ---------------------------------------------------------------------------
INSERT INTO public.customer_queries
(id, query_number, customer_id, subject, description, category_id, priority, status, assigned_to, created_by) VALUES
    ('00000000-0000-0000-0006-000000000001', 'QRY-000001', '10000000-0000-0000-0000-000000000006', 'Delivery Status for Cling Wrap & Pizza Liners Order', 'Afrofusion Kamloops requested delivery tracking for order ORD-000002. Dispatch confirmation needed for Kamloops delivery.', '00000000-0000-0000-0001-000000000002', 'high', 'in_progress', 'c3333333-3333-3333-3333-333333333333', 'd4444444-4444-4444-4444-444444444444'),
    ('00000000-0000-0000-0006-000000000002', 'QRY-000002', '10000000-0000-0000-0000-000000000001', 'Restock Lead Time for Freezer Roll Natural 18in', '0941791 BC.ltd requested stock availability and restock date for Freezer Roll Natural 18in (FPK-FOIL-FREEZENATURA-18IN).', '00000000-0000-0000-0001-000000000005', 'urgent', 'waiting_customer', 'e5555555-5555-5555-5555-555555555555', 'b2222222-2222-2222-2222-222222222222'),
    ('00000000-0000-0000-0006-000000000003', 'QRY-000003', '10000000-0000-0000-0000-000000000007', 'Sandwich Bags Material Quality & Compliance Inquiry', 'Alcatraz Chicken requested QA specification sheet for Grease Proof Dry Wax Sandwich Bags (FPK-BAG-GREASEPROOF-6X0.75X6.75).', '00000000-0000-0000-0001-000000000004', 'medium', 'resolved', 'c3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 9. App Access Policies
--    The app talks to Supabase with the publishable (anon) key and no per-user
--    auth session. schema.sql only grants SELECT, which would make every
--    write-through fail. These policies open full access to the anon role so
--    the CRM can create/update/delete records.
--
--    WARNING: This is permissive by design for this internal demo app.
--    Do NOT use in production — use authenticated RLS + a service role there.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
    t text;
    tables text[] := ARRAY[
        'teams', 'profiles', 'customers',
        'query_categories', 'customer_queries', 'query_activities',
        'query_internal_notes', 'query_attachments', 'notifications',
        'orders', 'order_items', 'order_status_history', 'order_documents',
        'product_categories', 'product_brands', 'products',
        'product_availability_history', 'shifts', 'shift_handovers',
        'shift_handover_items', 'system_settings', 'audit_logs'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        EXECUTE format('DROP POLICY IF EXISTS "App anon full access %1$s" ON public.%1$I', t);
        EXECUTE format(
            'CREATE POLICY "App anon full access %1$s" ON public.%1$I FOR ALL USING (true) WITH CHECK (true)',
            t
        );
    END LOOP;
END $$;

