-- =============================================================================
-- J&T Supplies CRM Database Schema Foundation
-- Postgres / Supabase compliant schema with Row Level Security (RLS)
-- =============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Create Enums
CREATE TYPE user_role AS ENUM ('admin', 'sales_agent', 'support_agent');
CREATE TYPE customer_status AS ENUM ('active', 'inactive');
CREATE TYPE query_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE query_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'reopened');
CREATE TYPE order_status AS ENUM ('order_received', 'sales_order_done', 'invoiced', 'dispatched', 'signed_invoice_sent', 'completed', 'cancelled');
CREATE TYPE document_type AS ENUM ('sales_order', 'invoice', 'dispatch_document', 'signed_invoice', 'other');
CREATE TYPE product_availability AS ENUM ('available', 'out_of_stock', 'discontinued');

-- 2. Create Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    shift_info VARCHAR(100) NOT NULL, -- e.g., '3 PM – 11 AM'
    shift_start TIME,
    shift_end TIME,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create Profiles / Users Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(), -- Maps to auth.users.id in Supabase
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'sales_agent',
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'CUST-000001'
    company_name VARCHAR(255) NOT NULL,
    contact_person VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(100) DEFAULT 'USA',
    notes TEXT,
    status customer_status NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 5. Create Query Categories Table
CREATE TABLE IF NOT EXISTS public.query_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Create Customer Queries Table
CREATE TABLE IF NOT EXISTS public.customer_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_number VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'QRY-000001'
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID REFERENCES public.query_categories(id) ON DELETE SET NULL,
    priority query_priority NOT NULL DEFAULT 'medium',
    status query_status NOT NULL DEFAULT 'open',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    assigned_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution TEXT,
    closed_at TIMESTAMPTZ,
    closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    closure_reason TEXT,
    reopened_at TIMESTAMPTZ,
    reopened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reopen_reason TEXT,
    internal_notes TEXT
);

-- 7. Create Query Activity / Audit History Table
CREATE TABLE IF NOT EXISTS public.query_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID NOT NULL REFERENCES public.customer_queries(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL,
    previous_value TEXT,
    new_value TEXT,
    description TEXT NOT NULL,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8. Create Query Internal Agent Notes Table (Protected from Sales role)
CREATE TABLE IF NOT EXISTS public.query_internal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID NOT NULL REFERENCES public.customer_queries(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 8b. Create Query Attachments Table
CREATE TABLE IF NOT EXISTS public.query_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID NOT NULL REFERENCES public.customer_queries(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_size INT,
    file_type VARCHAR(100),
    file_path VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create Notification Priority Enum
DO $$ BEGIN
    CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 9. Create Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50), -- 'query', 'order', 'product', 'system'
    entity_id UUID,
    priority notification_priority NOT NULL DEFAULT 'normal',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    link_path VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backwards Compatibility Alias View/Index for user_id
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_user_id ON public.notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);

-- 10. Create Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE, -- e.g., 'ORD-000001'
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    sales_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    order_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expected_delivery_date DATE,
    current_status order_status NOT NULL DEFAULT 'order_received',
    subtotal NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    total_tax NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    grand_total NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    order_received_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sales_order_done_at TIMESTAMPTZ,
    invoiced_at TIMESTAMPTZ,
    dispatched_at TIMESTAMPTZ,
    signed_invoice_sent_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    cancelled_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- 11. Create Order Line Items Table (Historical Snapshot Fields)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID, -- Optional foreign key reference to products table
    product_name_snapshot VARCHAR(255) NOT NULL,
    sku_snapshot VARCHAR(100) NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12,2) NOT NULL CHECK (unit_price >= 0),
    discount NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    tax NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    line_total NUMERIC(12,2) NOT NULL CHECK (line_total >= 0),
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. Create Order Status History Table (Immutable Audit Log)
CREATE TABLE IF NOT EXISTS public.order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    previous_status order_status,
    new_status order_status NOT NULL,
    action VARCHAR(255) NOT NULL,
    notes TEXT,
    performed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 13. Create Order Documents Table (Attachment Metadata)
CREATE TABLE IF NOT EXISTS public.order_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 14. Step 5: Product Categories & Brands Tables
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.product_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 15. Step 5: Products Table (CRITICAL: NO PHYSICAL INVENTORY QUANTITY FIELDS)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sku VARCHAR(100) NOT NULL UNIQUE,
    product_name VARCHAR(255) NOT NULL,
    description TEXT,
    category_id UUID REFERENCES public.product_categories(id) ON DELETE SET NULL,
    brand_id UUID REFERENCES public.product_brands(id) ON DELETE SET NULL,
    unit_price NUMERIC(12,2) NOT NULL DEFAULT 0.00,
    availability_status product_availability NOT NULL DEFAULT 'available',
    availability_notes TEXT,
    expected_available_date DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 16. Step 5: Product Availability History Table (Immutable Audit Log)
CREATE TABLE IF NOT EXISTS public.product_availability_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    previous_status product_availability,
    new_status product_availability NOT NULL,
    reason TEXT,
    expected_available_date DATE,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_queries_number ON public.customer_queries(query_number);
CREATE INDEX IF NOT EXISTS idx_queries_status ON public.customer_queries(status);
CREATE INDEX IF NOT EXISTS idx_queries_customer ON public.customer_queries(customer_id);
CREATE INDEX IF NOT EXISTS idx_queries_assigned ON public.customer_queries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(current_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_agent ON public.orders(sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_availability ON public.products(availability_status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);

-- Automated Timestamp Update Triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_modtime BEFORE UPDATE ON public.teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customers_modtime BEFORE UPDATE ON public.customers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_queries_modtime BEFORE UPDATE ON public.customer_queries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_availability_history ENABLE ROW LEVEL SECURITY;

-- Allow read access to all authenticated users
CREATE POLICY "Authenticated users can read teams" ON public.teams FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read customers" ON public.customers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read query categories" ON public.query_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read queries" ON public.customer_queries FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read query activities" ON public.query_activities FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read notifications" ON public.notifications FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read orders" ON public.orders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read order items" ON public.order_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read order status history" ON public.order_status_history FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read order documents" ON public.order_documents FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read product categories" ON public.product_categories FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read product brands" ON public.product_brands FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read products" ON public.products FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read product availability history" ON public.product_availability_history FOR SELECT USING (auth.role() = 'authenticated');

-- Protect Internal Agent Notes from Sales Agent role
CREATE POLICY "Support agents and admins can read internal notes" 
ON public.query_internal_notes FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role IN ('admin', 'support_agent')
    )
);

-- SEED DATA SETUP
INSERT INTO public.teams (id, name, shift_info, shift_start, shift_end) VALUES
    ('t1111111-1111-1111-1111-111111111111', 'Team 1', '3 PM – 11 AM', '15:00', '11:00'),
    ('t2222222-2222-2222-2222-222222222222', 'Team 2', '12 PM – 8 AM', '12:00', '08:00')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role, team_id) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'admin@jtsupplies.com', 'Sarah Connor (Admin)', 'admin', 't1111111-1111-1111-1111-111111111111'),
    ('b2222222-2222-2222-2222-222222222222', 'sales@jtsupplies.com', 'Alex Mercer (Sales)', 'sales_agent', 't1111111-1111-1111-1111-111111111111'),
    ('c3333333-3333-3333-3333-333333333333', 'support@jtsupplies.com', 'Elena Rostova (Support)', 'support_agent', 't2222222-2222-2222-2222-222222222222')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.customers (id, customer_code, company_name, contact_person, phone, email, address, city, country, status) VALUES
    ('10000000-0000-0000-0000-000000000001', 'CUST-000001', 'Apex Industrial Dynamics', 'Marcus Vance', '+1 (555) 234-5678', 'm.vance@apexind.com', '100 Industrial Parkway', 'Chicago', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000002', 'CUST-000002', 'Vanguard Freight & Logistics', 'Brenda Holloway', '+1 (555) 876-5432', 'b.holloway@vanguardfl.com', '450 Terminal Way', 'Houston', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000003', 'CUST-000003', 'Horizon Healthcare Systems', 'Dr. David Chen', '+1 (555) 345-6789', 'd.chen@horizonhealth.org', '780 Medical Center Blvd', 'Boston', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000004', 'CUST-000004', 'Summit Retail Distributors', 'Rachel Adams', '+1 (555) 901-2345', 'radams@summitretail.com', '120 Commerce Way', 'Atlanta', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000005', 'CUST-000005', 'Pacific Rim Manufacturing', 'Kenji Sato', '+1 (555) 678-9012', 'ksato@pacificrimmfg.com', '890 Logistics Hwy', 'Seattle', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000006', 'CUST-000006', 'Legacy Construction Corp', 'Tom Sterling', '+1 (555) 432-1098', 'tsterling@legacyconst.com', '34 Builders Square', 'Denver', 'USA', 'inactive')
ON CONFLICT (customer_code) DO NOTHING;

INSERT INTO public.query_categories (id, name, description) VALUES
    ('cat-0001-0000-0000-000000000001', 'Order Issue', 'Order discrepancies, wrong quantities, or missing order confirmation'),
    ('cat-0002-0000-0000-000000000002', 'Delivery Issue', 'Carrier delays, damaged packaging, or incorrect delivery address'),
    ('cat-0003-0000-0000-000000000003', 'Invoice Issue', 'Billing errors, tax exempt status, or missing commercial invoices'),
    ('cat-0004-0000-0000-000000000004', 'Product Issue', 'Defective items, technical specifications, or quality assurance inquiries'),
    ('cat-0005-0000-0000-000000000005', 'Stock Availability', 'Product availability inquiries, backorder lead times, or stock restock dates'),
    ('cat-0006-0000-0000-000000000006', 'Payment Issue', 'Payment gateway failures, wire transfer confirmations, or credit terms'),
    ('cat-0007-0000-0000-000000000007', 'Customer Information', 'Account contact details, address updates, or tax exemption status'),
    ('cat-0008-0000-0000-000000000008', 'General Inquiry', 'General business inquiries, catalog requests, or support shift info'),
    ('cat-0009-0000-0000-000000000009', 'Other', 'Uncategorized customer tickets requiring agent evaluation')
ON CONFLICT (name) DO NOTHING;

-- Seed Initial Product Categories & Brands
INSERT INTO public.product_categories (id, name, description) VALUES
    ('pcat-0001-0000-0000-000000000001', 'Industrial Cleaners', 'Heavy-duty degreasers, solvent cleaners, and surface sanitizers'),
    ('pcat-0002-0000-0000-000000000002', 'Packaging Supplies', 'Corrugated boxes, stretch film, sealing tape, and strapping'),
    ('pcat-0003-0000-0000-000000000003', 'Safety & PPE', 'Protective gloves, respirators, eye protection, and safety vests'),
    ('pcat-0004-0000-0000-000000000004', 'Warehouse Equipment', 'Pallet jacks, storage bins, shelving units, and hand trucks')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.product_brands (id, name, description) VALUES
    ('pbrd-0001-0000-0000-000000000001', 'J&T ProClean', 'Premium industrial cleaning solutions'),
    ('pbrd-0002-0000-0000-000000000002', 'PackGuard', 'Heavy-duty commercial packaging products'),
    ('pbrd-0003-0000-0000-000000000003', 'SafeShield', 'Certified personal protective equipment'),
    ('pbrd-0004-0000-0000-000000000004', 'DuraLift', 'Industrial warehouse machinery and storage accessories')
ON CONFLICT (name) DO NOTHING;

-- Seed Initial Products (NO PHYSICAL INVENTORY QUANTITIES)
INSERT INTO public.products 
(id, sku, product_name, description, category_id, brand_id, unit_price, availability_status, availability_notes, expected_available_date) VALUES
    (
        'prod-0001-0000-0000-000000000001',
        'IND-CLEAN-500',
        'ProClean Heavy-Duty Degreaser 5Gal',
        'Concentrated solvent degreaser suitable for heavy machinery and shop floors.',
        'pcat-0001-0000-0000-000000000001',
        'pbrd-0001-0000-0000-000000000001',
        145.00,
        'available',
        'In stock and ready for distributor shipping.',
        NULL
    ),
    (
        'prod-0002-0000-0000-000000000002',
        'PKG-FILM-80G',
        'PackGuard Heavy Stretch Film 80 Gauge',
        'High-clarity pallet wrapping film with high puncture resistance.',
        'pcat-0002-0000-0000-000000000002',
        'pbrd-0002-0000-0000-000000000002',
        65.00,
        'out_of_stock',
        'Raw chemical resin shortage from main supplier. Resupply shipment scheduled.',
        CURRENT_DATE + INTERVAL '7 days'
    ),
    (
        'prod-0003-0000-0000-000000000003',
        'PPE-GLOVE-NIT-L',
        'SafeShield Nitrile Gloves Powder-Free (Box 100)',
        'Medical grade 5-mil powder-free nitrile examination gloves.',
        'pcat-0003-0000-0000-000000000003',
        'pbrd-0003-0000-0000-000000000003',
        22.50,
        'available',
        'Fully available across main distribution network.',
        NULL
    ),
    (
        'prod-0004-0000-0000-000000000004',
        'WHS-JACK-5500',
        'DuraLift Hydraulic Pallet Jack 5500 lbs',
        'Heavy-duty steel frame hydraulic pallet jack with polyurethane wheels.',
        'pcat-0004-0000-0000-000000000004',
        'pbrd-0004-0000-0000-000000000004',
        480.00,
        'out_of_stock',
        'Factory line overhaul. Lead time approximately 2 weeks.',
        CURRENT_DATE + INTERVAL '14 days'
    ),
    (
        'prod-0005-0000-0000-000000000005',
        'IND-SAN-100',
        'ProClean Surface Sanitizer Wipes 500ct',
        'Hospital-grade surface disinfectant wipes.',
        'pcat-0001-0000-0000-000000000001',
        'pbrd-0001-0000-0000-000000000001',
        38.00,
        'discontinued',
        'Product replaced by IND-SAN-200 series.',
        NULL
    )
ON CONFLICT (sku) DO NOTHING;

-- 15. Create Shift Handover Enums & Tables
DO $$ BEGIN
    CREATE TYPE shift_status AS ENUM ('upcoming', 'active', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE handover_status AS ENUM ('draft', 'submitted', 'acknowledged');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE handover_entity_type AS ENUM ('query', 'order', 'product', 'customer', 'general_task');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Shifts Table
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time VARCHAR(20) NOT NULL, -- e.g. "3:00 PM"
    end_time VARCHAR(20) NOT NULL,   -- e.g. "11:00 AM" (supports overnight shifts)
    status shift_status NOT NULL DEFAULT 'active',
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shift Handovers Table
CREATE TABLE IF NOT EXISTS public.shift_handovers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shift_id UUID REFERENCES public.shifts(id) ON DELETE SET NULL,
    outgoing_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    incoming_team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,
    important_notes TEXT,
    status handover_status NOT NULL DEFAULT 'draft',
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    submitted_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ
);

-- Shift Handover Items Table
CREATE TABLE IF NOT EXISTS public.shift_handover_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    handover_id UUID NOT NULL REFERENCES public.shift_handovers(id) ON DELETE CASCADE,
    entity_type handover_entity_type NOT NULL DEFAULT 'general_task',
    entity_id VARCHAR(255),
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    note TEXT NOT NULL,
    action_required TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    completed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    completion_note TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shift Handover Performance Indexes
CREATE INDEX IF NOT EXISTS idx_shifts_team_status ON public.shifts(team_id, status);
CREATE INDEX IF NOT EXISTS idx_handovers_outgoing_team ON public.shift_handovers(outgoing_team_id);
CREATE INDEX IF NOT EXISTS idx_handovers_incoming_team ON public.shift_handovers(incoming_team_id);
CREATE INDEX IF NOT EXISTS idx_handover_items_handover_id ON public.shift_handover_items(handover_id);

-- System Settings Table
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    company_name VARCHAR(255) NOT NULL DEFAULT 'J&T Supplies',
    crm_title VARCHAR(255) NOT NULL DEFAULT 'J&T Supplies CRM',
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/New_York',
    date_format VARCHAR(50) NOT NULL DEFAULT 'MMM D, YYYY h:mm A',
    currency_symbol VARCHAR(10) NOT NULL DEFAULT '$',
    pagination_limit INT NOT NULL DEFAULT 10,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Immutable System Audit Logs Table
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255),
    entity_number VARCHAR(100),
    summary TEXT NOT NULL,
    previous_value TEXT,
    new_value TEXT
);

-- Audit Logs Performance Indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);


