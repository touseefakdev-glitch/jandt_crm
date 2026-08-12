-- =============================================================================
-- J&T Supplies CRM — Seed Data & App Access Policies
-- System Configuration & Base Setup ONLY (Clean Reset State)
-- =============================================================================

-- ---------------------------------------------------------------------------
-- 1. Teams
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
-- 2. Profiles (Authentication Accounts)
-- ---------------------------------------------------------------------------
INSERT INTO public.profiles (id, email, full_name, role, team_id, operational_area, is_active) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'tauseef@jtsupplies.com', 'Tauseef (Admin)', 'admin', '11111111-1111-1111-1111-111111111111', 'BOTH', TRUE),
    ('b2222222-2222-2222-2222-222222222222', 'muzammil@jtsupplies.com', 'Muzammil (Sales)', 'sales_agent', '11111111-1111-1111-1111-111111111111', 'KELOWNA', TRUE),
    ('c3333333-3333-3333-3333-333333333333', 'abdulrehman@jtsupplies.com', 'Abdul Rehman (Support)', 'support_agent', '22222222-2222-2222-2222-222222222222', 'BOTH', TRUE),
    ('d4444444-4444-4444-4444-444444444444', 'sohail@jtsupplies.com', 'Sohail (Sales)', 'sales_agent', '11111111-1111-1111-1111-111111111111', 'OUTSIDE_KELOWNA', TRUE),
    ('e5555555-5555-5555-5555-555555555555', 'aasil@jtsupplies.com', 'Aasil (Support)', 'support_agent', '22222222-2222-2222-2222-222222222222', 'BOTH', TRUE)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    role = EXCLUDED.role,
    team_id = EXCLUDED.team_id,
    operational_area = EXCLUDED.operational_area,
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
-- 5. Weekly Route Schedule
-- ---------------------------------------------------------------------------
INSERT INTO public.route_schedules (id, day_of_week, city_or_route, portal, active) VALUES
    ('00000000-0000-0000-0020-000000000001', 'monday', 'Kelowna', 'kelowna', true),
    
    ('00000000-0000-0000-0020-000000000002', 'tuesday', 'Kelowna', 'kelowna', true),
    ('00000000-0000-0000-0020-000000000003', 'tuesday', 'West Kelowna', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000004', 'tuesday', 'Summerland', 'outside_kelowna', true),
    
    ('00000000-0000-0000-0020-000000000005', 'wednesday', 'Kelowna', 'kelowna', true),
    ('00000000-0000-0000-0020-000000000006', 'wednesday', 'Penticton', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000007', 'wednesday', 'West Kelowna', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000008', 'wednesday', 'Osoyoos', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000009', 'wednesday', 'Oliver', 'outside_kelowna', true),
    
    ('00000000-0000-0000-0020-000000000010', 'thursday', 'Kelowna', 'kelowna', true),
    ('00000000-0000-0000-0020-000000000011', 'thursday', 'Penticton', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000012', 'thursday', 'Princeton', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000013', 'thursday', 'Keremeos', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000014', 'thursday', 'Osoyoos', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000015', 'thursday', 'Oliver', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000016', 'thursday', 'Merritt', 'outside_kelowna', true),
    
    ('00000000-0000-0000-0020-000000000017', 'friday', 'Vernon', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000018', 'friday', 'Salmon Arm', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000019', 'friday', 'Lake Country', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000020', 'friday', 'Armstrong', 'outside_kelowna', true),
    
    ('00000000-0000-0000-0020-000000000021', 'saturday', 'Vernon', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000022', 'saturday', 'Kamloops', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000023', 'saturday', 'Falkland', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000024', 'saturday', 'Chase', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000025', 'saturday', 'Salmon Arm', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000026', 'saturday', 'Lake Country', 'outside_kelowna', true),
    
    ('00000000-0000-0000-0020-000000000027', 'sunday', 'Kelowna', 'kelowna', true),
    ('00000000-0000-0000-0020-000000000028', 'sunday', 'Penticton', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000029', 'sunday', 'Osoyoos', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000030', 'sunday', 'Oliver', 'outside_kelowna', true),
    ('00000000-0000-0000-0020-000000000031', 'sunday', 'West Kelowna', 'outside_kelowna', true)
ON CONFLICT (id) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 6. App Access Policies
-- Note: route_schedules, daily_order_operations and
-- daily_order_operation_history are intentionally NOT included here — their
-- access is controlled by area-scoped RLS from migration 04_orders_realtime.sql.
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
        'shift_handover_items', 'system_settings', 'audit_logs',
        'import_jobs', 'customer_product_history'
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
