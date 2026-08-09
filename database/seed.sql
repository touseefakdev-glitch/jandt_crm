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
    ('00000000-0000-0000-0002-000000000001', 'Industrial Cleaners', 'Heavy-duty degreasers, solvent cleaners, and surface sanitizers'),
    ('00000000-0000-0000-0002-000000000002', 'Packaging Supplies', 'Corrugated boxes, stretch film, sealing tape, and strapping'),
    ('00000000-0000-0000-0002-000000000003', 'Safety & PPE', 'Protective gloves, respirators, eye protection, and safety vests'),
    ('00000000-0000-0000-0002-000000000004', 'Warehouse Equipment', 'Pallet jacks, storage bins, shelving units, and hand trucks')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.product_brands (id, name, description) VALUES
    ('00000000-0000-0000-0003-000000000001', 'J&T ProClean', 'Premium industrial cleaning solutions'),
    ('00000000-0000-0000-0003-000000000002', 'PackGuard', 'Heavy-duty commercial packaging products'),
    ('00000000-0000-0000-0003-000000000003', 'SafeShield', 'Certified personal protective equipment'),
    ('00000000-0000-0000-0003-000000000004', 'DuraLift', 'Industrial warehouse machinery and storage accessories')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5. Products
-- ---------------------------------------------------------------------------
INSERT INTO public.products
(id, sku, product_name, description, category_id, brand_id, unit_price, availability_status, availability_notes, expected_available_date) VALUES
    ('00000000-0000-0000-0004-000000000001', 'IND-CLEAN-500', 'ProClean Heavy-Duty Degreaser 5Gal', 'Concentrated solvent degreaser suitable for heavy machinery and shop floors.', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000001', 145.00, 'available', 'In stock and ready for distributor shipping.', NULL),
    ('00000000-0000-0000-0004-000000000002', 'PKG-FILM-80G', 'PackGuard Heavy Stretch Film 80 Gauge', 'High-clarity pallet wrapping film with high puncture resistance.', '00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0003-000000000002', 65.00, 'out_of_stock', 'Raw chemical resin shortage from main supplier. Resupply shipment scheduled.', CURRENT_DATE + INTERVAL '7 days'),
    ('00000000-0000-0000-0004-000000000003', 'PPE-GLOVE-NIT-L', 'SafeShield Nitrile Gloves Powder-Free (Box 100)', 'Medical grade 5-mil powder-free nitrile examination gloves.', '00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0003-000000000003', 22.50, 'available', 'Fully available across main distribution network.', NULL),
    ('00000000-0000-0000-0004-000000000004', 'WHS-JACK-5500', 'DuraLift Hydraulic Pallet Jack 5500 lbs', 'Heavy-duty steel frame hydraulic pallet jack with polyurethane wheels.', '00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0003-000000000004', 480.00, 'out_of_stock', 'Factory line overhaul. Lead time approximately 2 weeks.', CURRENT_DATE + INTERVAL '14 days'),
    ('00000000-0000-0000-0004-000000000005', 'IND-SAN-100', 'ProClean Surface Sanitizer Wipes 500ct', 'Hospital-grade surface disinfectant wipes.', '00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0003-000000000001', 38.00, 'discontinued', 'Product replaced by IND-SAN-200 series.', NULL)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. Customers
-- ---------------------------------------------------------------------------
INSERT INTO public.customers (id, customer_code, company_name, contact_person, phone, email, address, city, country, status) VALUES
    ('10000000-0000-0000-0000-000000000001', 'CUST-000001', 'Apex Industrial Dynamics', 'Marcus Vance', '+1 (555) 234-5678', 'm.vance@apexind.com', '100 Industrial Parkway', 'Chicago', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000002', 'CUST-000002', 'Vanguard Freight & Logistics', 'Brenda Holloway', '+1 (555) 876-5432', 'b.holloway@vanguardfl.com', '450 Terminal Way', 'Houston', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000003', 'CUST-000003', 'Horizon Healthcare Systems', 'Dr. David Chen', '+1 (555) 345-6789', 'd.chen@horizonhealth.org', '780 Medical Center Blvd', 'Boston', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000004', 'CUST-000004', 'Summit Retail Distributors', 'Rachel Adams', '+1 (555) 901-2345', 'radams@summitretail.com', '120 Commerce Way', 'Atlanta', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000005', 'CUST-000005', 'Pacific Rim Manufacturing', 'Kenji Sato', '+1 (555) 678-9012', 'ksato@pacificrimmfg.com', '890 Logistics Hwy', 'Seattle', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000006', 'CUST-000006', 'Legacy Construction Corp', 'Tom Sterling', '+1 (555) 432-1098', 'tsterling@legacyconst.com', '34 Builders Square', 'Denver', 'USA', 'inactive')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 7. Orders (referenced by customer queries below)
-- ---------------------------------------------------------------------------
INSERT INTO public.orders
(id, order_number, customer_id, sales_agent_id, current_status, subtotal, total_discount, total_tax, grand_total, notes, created_by, updated_by) VALUES
    ('00000000-0000-0000-0005-000000000001', 'ORD-000001', '10000000-0000-0000-0000-000000000001', 'b2222222-2222-2222-2222-222222222222', 'invoiced', 1450.00, 50.00, 140.00, 1540.00, 'Heavy machinery hydraulic components shipment.', 'b2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222'),
    ('00000000-0000-0000-0005-000000000002', 'ORD-000002', '10000000-0000-0000-0000-000000000002', 'b2222222-2222-2222-2222-222222222222', 'dispatched', 2800.00, 100.00, 270.00, 2970.00, 'Priority freight delivery to logistics terminal hub.', 'b2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222'),
    ('00000000-0000-0000-0005-000000000003', 'ORD-000003', '10000000-0000-0000-0000-000000000003', 'a1111111-1111-1111-1111-111111111111', 'order_received', 750.00, 0.00, 75.00, 825.00, 'Sterile healthcare supplies replenishment order.', 'a1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111'),
    ('00000000-0000-0000-0005-000000000004', 'ORD-000004', '10000000-0000-0000-0000-000000000004', 'b2222222-2222-2222-2222-222222222222', 'completed', 4200.00, 200.00, 400.00, 4400.00, 'Bulk packaging and retail distribution order.', 'b2222222-2222-2222-2222-222222222222', 'b2222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 8. Customer Queries
-- ---------------------------------------------------------------------------
INSERT INTO public.customer_queries
(id, query_number, customer_id, subject, description, category_id, priority, status, assigned_to, created_by) VALUES
    ('00000000-0000-0000-0006-000000000001', 'QRY-000001', '10000000-0000-0000-0000-000000000001', 'Urgent Delivery Status for Hydraulic Degreaser Order', 'Customer requested immediate delivery tracking for order ORD-000001. Carrier shipment appears delayed near Chicago hub.', '00000000-0000-0000-0001-000000000002', 'high', 'in_progress', 'c3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222'),
    ('00000000-0000-0000-0006-000000000002', 'QRY-000002', '10000000-0000-0000-0000-000000000002', 'Availability Inquiry for Heavy Stretch Film 80G', 'Vanguard Freight wants to place a bulk order of 200 rolls of PackGuard Heavy Stretch Film 80G. Product is marked Out of Stock.', '00000000-0000-0000-0001-000000000005', 'urgent', 'waiting_customer', 'c3333333-3333-3333-3333-333333333333', 'c3333333-3333-3333-3333-333333333333'),
    ('00000000-0000-0000-0006-000000000003', 'QRY-000003', '10000000-0000-0000-0000-000000000003', 'Sterile Glove Certificate of Compliance', 'Horizon Healthcare requested formal QA compliance documentation for SafeShield Nitrile Gloves.', '00000000-0000-0000-0001-000000000004', 'medium', 'resolved', 'c3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111')
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
