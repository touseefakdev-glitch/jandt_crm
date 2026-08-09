-- =============================================================================
-- J&T Supplies CRM Database Schema Foundation
-- Postgres / Supabase compliant schema with Row Level Security (RLS)
-- FIX: Reordered tables to resolve foreign key dependency chain
-- =============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- ENUMS
-- =============================================================================
CREATE TYPE user_role AS ENUM ('admin', 'sales_agent', 'support_agent');
CREATE TYPE customer_status AS ENUM ('active', 'inactive');
CREATE TYPE query_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE query_status AS ENUM ('new', 'assigned', 'open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'reopened');
CREATE TYPE order_status AS ENUM ('order_received', 'sales_order_done', 'invoiced', 'dispatched', 'signed_invoice_sent', 'completed', 'cancelled');
CREATE TYPE document_type AS ENUM ('sales_order', 'invoice', 'dispatch_document', 'signed_invoice', 'other');
CREATE TYPE product_availability AS ENUM ('available', 'out_of_stock', 'discontinued');

DO $$ BEGIN
    CREATE TYPE notification_priority AS ENUM ('low', 'normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE shift_status AS ENUM ('upcoming', 'active', 'completed');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE handover_status AS ENUM ('draft', 'submitted', 'acknowledged');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE handover_entity_type AS ENUM ('query', 'order', 'product', 'customer', 'general_task');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- =============================================================================
-- LEVEL 1: No dependencies
-- =============================================================================

-- Teams Table
CREATE TABLE IF NOT EXISTS public.teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    shift_info VARCHAR(100) NOT NULL,
    shift_start TIME,
    shift_end TIME,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Query Categories Table
CREATE TABLE IF NOT EXISTS public.query_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product Categories Table
CREATE TABLE IF NOT EXISTS public.product_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Product Brands Table
CREATE TABLE IF NOT EXISTS public.product_brands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- LEVEL 2: Depends on teams
-- =============================================================================

-- Profiles / Users Table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'sales_agent',
    team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Shifts Table
CREATE TABLE IF NOT EXISTS public.shifts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID NOT NULL REFERENCES public.teams(id) ON DELETE CASCADE,
    shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
    start_time VARCHAR(20) NOT NULL,
    end_time VARCHAR(20) NOT NULL,
    status shift_status NOT NULL DEFAULT 'active',
    opened_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    closed_at TIMESTAMPTZ,
    opened_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    closed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- LEVEL 3: Depends on profiles
-- =============================================================================

-- Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_code VARCHAR(50) NOT NULL UNIQUE,
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

-- Products Table
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

-- Product Availability History Table
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

-- Notifications Table
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    recipient_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    actor_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    priority notification_priority NOT NULL DEFAULT 'normal',
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    link_path VARCHAR(255),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
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

-- =============================================================================
-- LEVEL 4: Depends on customers & profiles
-- =============================================================================

-- Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
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

-- Order Line Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
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

-- Order Status History Table
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

-- Order Documents Table
CREATE TABLE IF NOT EXISTS public.order_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    document_type document_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    uploaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- LEVEL 5: Depends on customers, orders, products, profiles, query_categories
-- =============================================================================

-- Customer Queries Table (requires orders & products to exist first)
CREATE TABLE IF NOT EXISTS public.customer_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_number VARCHAR(50) NOT NULL UNIQUE,
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

-- Query Activity / Audit History Table
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

-- Query Internal Agent Notes Table
CREATE TABLE IF NOT EXISTS public.query_internal_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    query_id UUID NOT NULL REFERENCES public.customer_queries(id) ON DELETE CASCADE,
    note TEXT NOT NULL,
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Query Attachments Table
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

-- =============================================================================
-- LEVEL 6: Misc tables with no external FK dependencies
-- =============================================================================

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

-- Audit Logs Table
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

-- =============================================================================
-- PERFORMANCE INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_customers_code ON public.customers(customer_code);
CREATE INDEX IF NOT EXISTS idx_customers_status ON public.customers(status);
CREATE INDEX IF NOT EXISTS idx_queries_number ON public.customer_queries(query_number);
CREATE INDEX IF NOT EXISTS idx_queries_status ON public.customer_queries(status);
CREATE INDEX IF NOT EXISTS idx_queries_customer ON public.customer_queries(customer_id);
CREATE INDEX IF NOT EXISTS idx_queries_assigned ON public.customer_queries(assigned_to);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON public.notifications(priority);
CREATE INDEX IF NOT EXISTS idx_orders_number ON public.orders(order_number);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(current_status);
CREATE INDEX IF NOT EXISTS idx_orders_customer ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_agent ON public.orders(sales_agent_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON public.products(sku);
CREATE INDEX IF NOT EXISTS idx_products_availability ON public.products(availability_status);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_brand ON public.products(brand_id);
CREATE INDEX IF NOT EXISTS idx_shifts_team_status ON public.shifts(team_id, status);
CREATE INDEX IF NOT EXISTS idx_handovers_outgoing_team ON public.shift_handovers(outgoing_team_id);
CREATE INDEX IF NOT EXISTS idx_handovers_incoming_team ON public.shift_handovers(incoming_team_id);
CREATE INDEX IF NOT EXISTS idx_handover_items_handover_id ON public.shift_handover_items(handover_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON public.audit_logs(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);

-- =============================================================================
-- AUTOMATED TIMESTAMP UPDATE TRIGGERS
-- =============================================================================
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
CREATE TRIGGER update_shifts_modtime BEFORE UPDATE ON public.shifts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_internal_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.query_attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_availability_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shifts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_handovers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shift_handover_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

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
CREATE POLICY "Authenticated users can read shifts" ON public.shifts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read shift handovers" ON public.shift_handovers FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read shift handover items" ON public.shift_handover_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read system settings" ON public.system_settings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read audit logs" ON public.audit_logs FOR SELECT USING (auth.role() = 'authenticated');

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

-- =============================================================================
-- SEED DATA
-- =============================================================================

INSERT INTO public.teams (id, name, shift_info, shift_start, shift_end) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Team 1', '3 PM – 11 AM', '15:00', '11:00'),
    ('22222222-2222-2222-2222-222222222222', 'Team 2', '12 PM – 8 AM', '12:00', '08:00')
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.profiles (id, email, full_name, role, team_id) VALUES
    ('a1111111-1111-1111-1111-111111111111', 'tauseef@jtsupplies.com', 'Tauseef (Admin)', 'admin', '11111111-1111-1111-1111-111111111111'),
    ('b2222222-2222-2222-2222-222222222222', 'muzammil@jtsupplies.com', 'Muzammil (Sales)', 'sales_agent', '11111111-1111-1111-1111-111111111111'),
    ('c3333333-3333-3333-3333-333333333333', 'abdulrehman@jtsupplies.com', 'Abdul Rehman (Support)', 'support_agent', '22222222-2222-2222-2222-222222222222'),
    ('d4444444-4444-4444-4444-444444444444', 'sohail@jtsupplies.com', 'Sohail (Sales)', 'sales_agent', '11111111-1111-1111-1111-111111111111'),
    ('e5555555-5555-5555-5555-555555555555', 'aasil@jtsupplies.com', 'Aasil (Support)', 'support_agent', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.customers (id, customer_code, company_name, contact_person, phone, email, address, city, country, status, notes) VALUES
    ('10000000-0000-0000-0000-000000000001', 'CUST-000001', '0941791 BC.ltd', 'Gurpreet Singh', '+1 (604) 555-0191', 'contact@0941791bc.ca', '10245 152 St', 'Surrey', 'Canada', 'active', '17 items priced. Key commercial food packaging account.'),
    ('10000000-0000-0000-0000-000000000002', 'CUST-000002', '4G Commercial', 'Tariq Mahmood', '+1 (250) 555-0144', 'orders@4gcommercial.com', '880 Commercial Way', 'Vancouver', 'Canada', 'active', '8 items priced. Commercial supply client.'),
    ('10000000-0000-0000-0000-000000000003', 'CUST-000003', '5309 Main street, Unit 100', 'Usman Ali', '+1 (604) 555-5309', 'unit100@mainstreetsupplies.ca', '5309 Main Street, Unit 100', 'Vancouver', 'Canada', 'active', '1 item priced. Retail location customer.'),
    ('10000000-0000-0000-0000-000000000004', 'CUST-000004', 'AA Tire Kelowna', 'Bilal Ahmed', '+1 (250) 555-0177', 'service@aatilekelowna.com', '1920 Enterprise Way', 'Kelowna', 'Canada', 'active', '3 items priced. Commercial customer.'),
    ('10000000-0000-0000-0000-000000000005', 'CUST-000005', 'Academy Store', 'Farhan Khan', '+1 (604) 555-0122', 'manager@academystore.ca', '3450 Academy Way', 'Burnaby', 'Canada', 'active', '5 items priced. Campus supply store.'),
    ('10000000-0000-0000-0000-000000000006', 'CUST-000006', 'Afrofusion Kamloops', 'Zubair Siddiqui', '+1 (250) 555-0188', 'kitchen@afrofusionkamloops.com', '450 Tranquille Rd', 'Kamloops', 'Canada', 'active', '18 items priced. Restaurant & food wrapping customer.'),
    ('10000000-0000-0000-0000-000000000007', 'CUST-000007', 'Alcatraz Chicken', 'Hamza Malik', '+1 (604) 555-0199', 'info@alcatrazchicken.com', '1120 Robson St', 'Vancouver', 'Canada', 'active', '5 items priced. Fast food chain - regular foil & wrap orders.')
ON CONFLICT (customer_code) DO NOTHING;

-- Query Categories (group 0001 in segment 4)
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
ON CONFLICT (name) DO NOTHING;

-- Product Categories (group 0002 in segment 4)
INSERT INTO public.product_categories (id, name, description) VALUES
    ('00000000-0000-0000-0002-000000000001', 'Food Wrap', 'Commercial food packaging wraps, cling wraps, parchment and wax paper sheets'),
    ('00000000-0000-0000-0002-000000000002', 'Foil Items', 'Standard, heavy-duty, and freezer aluminum foil rolls and insulated sheets'),
    ('00000000-0000-0000-0002-000000000003', 'Bags', 'Grease proof dry wax sandwich bags and commercial food service paper bags'),
    ('00000000-0000-0000-0002-000000000004', 'Pizza Essentials', 'Standard and corrugated pizza box inserts, liners, and liners cases')
ON CONFLICT (name) DO NOTHING;

-- Product Brands (group 0003 in segment 4)
INSERT INTO public.product_brands (id, name, description) VALUES
    ('00000000-0000-0000-0003-000000000001', 'J&T Packaging', 'Premium commercial food packaging products'),
    ('00000000-0000-0000-0003-000000000002', 'GenPak / Royal', 'High quality cling film rolls and baking paper supplies'),
    ('00000000-0000-0000-0003-000000000003', 'FoilPro', 'Heavy-duty commercial aluminum foil and freezer paper rolls'),
    ('00000000-0000-0000-0003-000000000004', 'PizzaGuard', 'Corrugated and moisture-resistant pizza liner products')
ON CONFLICT (name) DO NOTHING;

-- Products (group 0004 in segment 4)
INSERT INTO public.products
(id, sku, product_name, description, category_id, brand_id, unit_price, availability_status, availability_notes, expected_available_date) VALUES
    (
        '00000000-0000-0000-0004-000000000001',
        'FPK-GEN-ALUMINFOIL-500FT',
        'Aluminum Foil Roll - Width 12 inches x 500ft (6/Case)',
        'Food Packaging · Food Wrap | Item Code: 199001 | Pack: Case-6-Pcs | Base UOM: Pieces | Target: Pieces | Min SP: $28.00 | Desired SP: $29.00 | Max SP: $40.50',
        '00000000-0000-0000-0002-000000000001',
        '00000000-0000-0000-0003-000000000003',
        29.00, 'available', 'In stock for immediate commercial delivery.', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000002',
        'FPK-FOIL-ALUMINFOIL-18IN',
        'Aluminum Foil Roll Heavy Duty - Width 18 inches – Length 45Cmx100m (4/Case)',
        'Food Packaging · Foil Items | Item Code: 106001 | Pack: Case-4-Pcs | Base UOM: Pieces | Target: Pieces | Min SP: $32.99 | Desired SP: $32.99 | Max SP: $38.22',
        '00000000-0000-0000-0002-000000000002',
        '00000000-0000-0000-0003-000000000003',
        32.99, 'available', 'Heavy-duty 18-inch commercial foil in stock.', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000003',
        'FPK-FOIL-ALUMINFOILWIDTH-18IN',
        'Aluminum Foil Roll – Width 18in – Length 152m (per roll)',
        'Food Packaging · Foil Items | Item Code: 106002 | Base UOM: Roll | Target: Roll | Min SP: $33.00 | Desired SP: $38.00 | Max SP: $44.02',
        '00000000-0000-0000-0002-000000000002',
        '00000000-0000-0000-0003-000000000003',
        38.00, 'available', 'Standard 152m single roll packaging.', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000004',
        'FPK-GEN-CLINGWRAP-2000FT',
        'Cling Wrap Roll 11in – Film PVC 2000 ft – Royal (with cutter)',
        'Food Packaging · Food Wrap | Item Code: 199002 | Base UOM: Roll | Target: Roll | Min SP: $34.00 | Desired SP: $35.00 | Max SP: $40.55',
        '00000000-0000-0000-0002-000000000001',
        '00000000-0000-0000-0003-000000000002',
        35.00, 'available', 'Equipped with safety slide cutter box.', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000005',
        'FPK-GEN-CLINGWRAPFILM-2000FT',
        'Cling Wrap Roll 12in – Film PVC 2000 ft',
        'Food Packaging · Food Wrap | Item Code: 199003 | Base UOM: Roll | Target: Roll | Min SP: $30.00 | Desired SP: $35.00 | Max SP: $39.00',
        '00000000-0000-0000-0002-000000000001',
        '00000000-0000-0000-0003-000000000002',
        35.00, 'available', 'Commercial PVC cling film 12-inch roll.', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000006',
        'FPK-GEN-CLINGWRAPFILMPVC-2000FT',
        'Cling Wrap Roll 18in – Film PVC 2000 ft (with cutter)',
        'Food Packaging · Food Wrap | Item Code: 199004 | Base UOM: Roll | Target: Roll | Min SP: $35.00 | Desired SP: $37.00 | Max SP: $42.86',
        '00000000-0000-0000-0002-000000000001',
        '00000000-0000-0000-0003-000000000002',
        37.00, 'available', 'Wide 18-inch roll with integrated cutter.', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000007',
        'FPK-GEN-ITEM-1',
        'Cling Wrap Roll 24in – Film PVC 2000 ft (with cutter)',
        'Food Packaging · Food Wrap | Item Code: 199005 | Base UOM: Roll | Target: Roll | Min SP: $45.00 | Desired SP: $49.99 | Max SP: $57.91',
        '00000000-0000-0000-0002-000000000001',
        '00000000-0000-0000-0003-000000000002',
        49.99, 'available', 'Extra-wide 24-inch PVC film with cutter.', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000008',
        'FPK-GEN-PAPERWAX-8X11IN',
        'Paper Wax Dry 8×11in Scale - 2000/Pack (4/CS)',
        'Food Packaging · Food Wrap | Item Code: 199006 | Pack: Case-8000-Pcs (+Pack-2000) | Base UOM: Pieces | Target: Case | Min SP: $140.00 | Desired SP: $144.00 | Max SP: $167.20',
        '00000000-0000-0000-0002-000000000001',
        '00000000-0000-0000-0003-000000000001',
        144.00, 'available', 'Bulk scale dry wax paper case (8000 sheets).', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000009',
        'FPK-FOIL-FREEZENATURA-18IN',
        'Freezer Roll – Natural – Width 18in',
        'Food Packaging · Foil Items | Item Code: 106003 | Base UOM: Roll | Target: Roll | Min SP: $49.00 | Desired SP: $50.00 | Max SP: $57.92',
        '00000000-0000-0000-0002-000000000002',
        '00000000-0000-0000-0003-000000000003',
        50.00, 'out_of_stock', 'Resupply shipment in transit from paper mill.', CURRENT_DATE + INTERVAL '7 days'
    ),
    (
        '00000000-0000-0000-0004-000000000010',
        'FPK-FOIL-FREEZEROSE-18IN',
        'Freezer Roll – Rose – Width 18in',
        'Food Packaging · Foil Items | Item Code: 106004 | Base UOM: Roll | Target: Roll | Min SP: $49.00 | Desired SP: $50.00 | Max SP: $57.92',
        '00000000-0000-0000-0002-000000000002',
        '00000000-0000-0000-0003-000000000003',
        50.00, 'available', 'Rose tint freezer paper roll in stock.', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000011',
        'FPK-BAG-GREASEPROOF-6X0.75X6.75',
        'Grease Proof Dry Wax Sandwich Bags 6"X3/4"x6 3/4" / 6x0.75x6.75 - 1000/CS',
        'Food Packaging · Bags | Item Code: 101001 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $31.00 | Desired SP: $34.00 | Max SP: $40.00',
        '00000000-0000-0000-0002-000000000003',
        '00000000-0000-0000-0003-000000000001',
        34.00, 'available', 'Grease-proof dry wax paper sandwich bags (1000/CS).', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000012',
        'FPK-GEN-INSULAALUMIN-12X12IN',
        'Insulated Aluminium Foil Paper Sheets – 12×12in (1000/CS)',
        'Food Packaging · Food Wrap | Item Code: 199007 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $39.00 | Desired SP: $42.00 | Max SP: $48.60',
        '00000000-0000-0000-0002-000000000001',
        '00000000-0000-0000-0003-000000000003',
        42.00, 'available', '12x12 pre-cut insulated foil sheets (1000/CS).', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000013',
        'FPK-GEN-INSULAALUMIN-14X14IN',
        'Insulated Aluminium Foil Paper Sheets – 14×14in (1000/CS)',
        'Food Packaging · Food Wrap | Item Code: 199008 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $45.00 | Desired SP: $50.00 | Max SP: $57.90',
        '00000000-0000-0000-0002-000000000001',
        '00000000-0000-0000-0003-000000000003',
        50.00, 'available', '14x14 pre-cut insulated foil sheets (1000/CS).', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000014',
        'FPK-GEN-PIZZALINER-11X11',
        'Pizza Liner 11x11 400/CS',
        'Food Packaging · Pizza Essentials | Item Code: 199009 | Pack: Case-400-Pcs | Base UOM: Pieces | Target: Case | Min SP: $36.00 | Desired SP: $40.00 | Max SP: $48.00',
        '00000000-0000-0000-0002-000000000004',
        '00000000-0000-0000-0003-000000000004',
        40.00, 'available', '11x11 pizza liners (400/CS).', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000015',
        'FPK-GEN-PIZZALINER-13X13',
        'Pizza Liner 13x13 - Corrugated - 400/CS',
        'Food Packaging · Pizza Essentials | Item Code: 199010 | Pack: Case-400-Pcs | Base UOM: Pieces | Target: Case | Min SP: $79.00 | Desired SP: $84.00 | Max SP: $95.00',
        '00000000-0000-0000-0002-000000000004',
        '00000000-0000-0000-0003-000000000004',
        84.00, 'available', 'Corrugated 13x13 pizza liners (400/CS).', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000016',
        'FPK-GEN-PIZZALINER-15X15',
        'Pizza Liner 15x15 - Corrugated - 400/CS',
        'Food Packaging · Pizza Essentials | Item Code: 199011 | Pack: Case-400-Pcs | Base UOM: Pieces | Target: Case | Min SP: $85.00 | Desired SP: $92.00 | Max SP: $105.00',
        '00000000-0000-0000-0002-000000000004',
        '00000000-0000-0000-0003-000000000004',
        92.00, 'available', 'Corrugated 15x15 pizza liners (400/CS).', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000017',
        'FPK-GEN-PIZZALINER-9X9',
        'Pizza Liner 9x9 - 400/CS',
        'Food Packaging · Pizza Essentials | Item Code: 199012 | Pack: Case-400-Pcs | Base UOM: Pieces | Target: Case | Min SP: $28.00 | Desired SP: $34.00 | Max SP: $40.24',
        '00000000-0000-0000-0002-000000000004',
        '00000000-0000-0000-0003-000000000004',
        34.00, 'available', '9x9 pizza box liners (400/CS).', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000018',
        'FPK-GEN-PARCHMPAPER-16X24IN',
        'Parchment Paper – Sheet 16×24in (1000/CS)',
        'Food Packaging · Food Wrap | Item Code: 199013 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $120.00 | Desired SP: $124.00 | Max SP: $143.60',
        '00000000-0000-0000-0002-000000000001',
        '00000000-0000-0000-0003-000000000002',
        124.00, 'available', '16x24 commercial parchment paper sheets (1000/CS).', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000019',
        'FPK-GEN-PATTYPAPER-5.25X5.25IN',
        'Patty Paper 5.25x5.25in (1000/CS)',
        'Food Packaging · Food Wrap | Item Code: 199014 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $9.50 | Desired SP: $10.00 | Max SP: $10.60',
        '00000000-0000-0000-0002-000000000001',
        '00000000-0000-0000-0003-000000000001',
        10.00, 'available', '5.25x5.25 burger patty interleaving paper (1000/CS).', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000020',
        'FPK-GEN-WAXPAPER-12X12IN',
        'Wax Paper – Black & White – Liner Basket Black Check - 12×12in (1000/CS)',
        'Food Packaging · Food Wrap | Item Code: 199015 | Pack: Case-1000-Pcs | Base UOM: Pieces | Target: Case | Min SP: $34.00 | Desired SP: $36.00 | Max SP: $41.70',
        '00000000-0000-0000-0002-000000000001',
        '00000000-0000-0000-0003-000000000001',
        36.00, 'available', 'Black check printed basket liner wax paper (1000/CS).', NULL
    )
ON CONFLICT (sku) DO NOTHING;

-- Orders (group 0005 in segment 4)
INSERT INTO public.orders
(id, order_number, customer_id, sales_agent_id, current_status, subtotal, total_discount, total_tax, grand_total, notes, created_by, updated_by) VALUES
    (
        '00000000-0000-0000-0005-000000000001',
        'ORD-000001',
        '10000000-0000-0000-0000-000000000001',
        'b2222222-2222-2222-2222-222222222222',
        'invoiced', 1010.00, 20.00, 50.50, 1040.50,
        'Bulk food packaging foil rolls and dry wax paper shipment.',
        'b2222222-2222-2222-2222-222222222222',
        'b2222222-2222-2222-2222-222222222222'
    ),
    (
        '00000000-0000-0000-0005-000000000002',
        'ORD-000002',
        '10000000-0000-0000-0000-000000000006',
        'd4444444-4444-4444-4444-444444444444',
        'dispatched', 958.00, 30.00, 47.90, 975.90,
        'Restaurant food wrap and corrugated pizza liner order.',
        'd4444444-4444-4444-4444-444444444444',
        'd4444444-4444-4444-4444-444444444444'
    ),
    (
        '00000000-0000-0000-0005-000000000003',
        'ORD-000003',
        '10000000-0000-0000-0000-000000000007',
        'b2222222-2222-2222-2222-222222222222',
        'order_received', 870.00, 0.00, 43.50, 913.50,
        'Fast food sandwich bags and black check basket liners.',
        'b2222222-2222-2222-2222-222222222222',
        'b2222222-2222-2222-2222-222222222222'
    ),
    (
        '00000000-0000-0000-0005-000000000004',
        'ORD-000004',
        '10000000-0000-0000-0000-000000000002',
        'a1111111-1111-1111-1111-111111111111',
        'completed', 2239.80, 100.00, 111.99, 2251.79,
        'Commercial cling wrap 24in and parchment paper sheets.',
        'a1111111-1111-1111-1111-111111111111',
        'a1111111-1111-1111-1111-111111111111'
    )
ON CONFLICT (order_number) DO NOTHING;

-- Customer Queries (group 0006 in segment 4)
INSERT INTO public.customer_queries
(id, query_number, customer_id, subject, description, category_id, priority, status, assigned_to, created_by) VALUES
    (
        '00000000-0000-0000-0006-000000000001',
        'QRY-000001',
        '10000000-0000-0000-0000-000000000006',
        'Delivery Status for Cling Wrap & Pizza Liners Order',
        'Afrofusion Kamloops requested delivery tracking for order ORD-000002. Dispatch confirmation needed for Kamloops delivery.',
        '00000000-0000-0000-0001-000000000002',
        'high', 'in_progress',
        'c3333333-3333-3333-3333-333333333333',
        'd4444444-4444-4444-4444-444444444444'
    ),
    (
        '00000000-0000-0000-0006-000000000002',
        'QRY-000002',
        '10000000-0000-0000-0000-000000000001',
        'Restock Lead Time for Freezer Roll Natural 18in',
        '0941791 BC.ltd requested stock availability and restock date for Freezer Roll Natural 18in (FPK-FOIL-FREEZENATURA-18IN).',
        '00000000-0000-0000-0001-000000000005',
        'urgent', 'waiting_customer',
        'e5555555-5555-5555-5555-555555555555',
        'b2222222-2222-2222-2222-222222222222'
    ),
    (
        '00000000-0000-0000-0006-000000000003',
        'QRY-000003',
        '10000000-0000-0000-0000-000000000007',
        'Sandwich Bags Material Quality & Compliance Inquiry',
        'Alcatraz Chicken requested QA specification sheet for Grease Proof Dry Wax Sandwich Bags (FPK-BAG-GREASEPROOF-6X0.75X6.75).',
        '00000000-0000-0000-0001-000000000004',
        'medium', 'resolved',
        'c3333333-3333-3333-3333-333333333333',
        'a1111111-1111-1111-1111-111111111111'
    )
ON CONFLICT (query_number) DO NOTHING;

-- Order Items
INSERT INTO public.order_items (id, order_id, product_id, product_name_snapshot, sku_snapshot, quantity, unit_price, discount, tax, line_total, notes) VALUES
    ('00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0004-000000000001', 'Aluminum Foil Roll - Width 12 inches x 500ft (6/Case)', 'FPK-GEN-ALUMINFOIL-500FT', 10, 29.00, 10.00, 14.50, 294.50, 'Case-6-Pcs packaging.'),
    ('00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0004-000000000008', 'Paper Wax Dry 8×11in Scale - 2000/Pack (4/CS)', 'FPK-GEN-PAPERWAX-8X11IN', 5, 144.00, 10.00, 36.00, 746.00, 'Case of 4 packs.'),
    ('00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0004-000000000006', 'Cling Wrap Roll 18in – Film PVC 2000 ft (with cutter)', 'FPK-GEN-CLINGWRAPFILMPVC-2000FT', 10, 37.00, 15.00, 18.50, 373.50, 'With safety cutter box.'),
    ('00000000-0000-0000-0007-000000000004', '00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0004-000000000015', 'Pizza Liner 13x13 - Corrugated - 400/CS', 'FPK-GEN-PIZZALINER-13X13', 5, 84.00, 15.00, 21.00, 426.00, 'Corrugated 400/CS.')
ON CONFLICT (id) DO NOTHING;

-- Order Status History
INSERT INTO public.order_status_history (id, order_id, previous_status, new_status, action, notes, performed_by) VALUES
    ('00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0005-000000000001', NULL, 'order_received', 'Order Received', 'Initial customer order registered by Muzammil.', 'b2222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Order Documents
INSERT INTO public.order_documents (id, order_id, document_type, file_name, file_path, uploaded_by) VALUES
    ('00000000-0000-0000-0009-000000000001', '00000000-0000-0000-0005-000000000001', 'sales_order', 'Sales_Order_ORD-000001.pdf', '/documents/ORD-000001/Sales_Order_ORD-000001.pdf', 'b2222222-2222-2222-2222-222222222222')
ON CONFLICT (id) DO NOTHING;

-- Query Activities
INSERT INTO public.query_activities (id, query_id, event_type, previous_value, new_value, description, performed_by) VALUES
    ('00000000-0000-0000-0014-000000000001', '00000000-0000-0000-0006-000000000001', 'query_created', NULL, 'open', 'Query QRY-000001 created for customer', 'd4444444-4444-4444-4444-444444444444'),
    ('00000000-0000-0000-0014-000000000002', '00000000-0000-0000-0006-000000000001', 'status_change', 'open', 'in_progress', 'Query status changed from Open to In Progress', 'c3333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- Query Notes
INSERT INTO public.query_internal_notes (id, query_id, note, author_id) VALUES
    ('00000000-0000-0000-0015-000000000001', '00000000-0000-0000-0006-000000000001', 'Carrier tracking updated for Kamloops regional hub.', 'c3333333-3333-3333-3333-333333333333')
ON CONFLICT (id) DO NOTHING;

-- Notifications
INSERT INTO public.notifications (id, recipient_user_id, actor_user_id, notification_type, title, message, entity_type, entity_id, priority, link_path) VALUES
    ('00000000-0000-0000-0016-000000000001', 'c3333333-3333-3333-3333-333333333333', 'a1111111-1111-1111-1111-111111111111', 'query.assigned', '🎫 Support Ticket Assigned', 'Query QRY-000001 for Afrofusion Kamloops has been assigned to your support queue. Priority: HIGH', 'query', '00000000-0000-0000-0006-000000000001', 'high', '/queries/00000000-0000-0000-0006-000000000001'),
    ('00000000-0000-0000-0016-000000000002', 'b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'product.availability_changed', '🔴 Product Out of Stock Alert', 'Product FPK-FOIL-FREEZENATURA-18IN (Freezer Roll – Natural – Width 18in) is OUT OF STOCK. Reason: Resupply in transit.', 'product', '00000000-0000-0000-0004-000000000009', 'high', '/products/00000000-0000-0000-0004-000000000009')
ON CONFLICT (id) DO NOTHING;

-- System Settings
INSERT INTO public.system_settings (id, company_name, crm_title, timezone, date_format, currency_symbol, pagination_limit, updated_by) VALUES
    ('00000000-0000-0000-0000-0000000000a1', 'J&T Supplies', 'J&T Supplies CRM', 'America/Vancouver', 'MMM D, YYYY h:mm A', '$', 10, 'a1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

