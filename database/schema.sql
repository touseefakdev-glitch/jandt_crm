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
CREATE TYPE query_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed', 'reopened');
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
    ('a1111111-1111-1111-1111-111111111111', 'admin@jtsupplies.com', 'Sarah Connor (Admin)', 'admin', '11111111-1111-1111-1111-111111111111'),
    ('b2222222-2222-2222-2222-222222222222', 'sales@jtsupplies.com', 'Alex Mercer (Sales)', 'sales_agent', '11111111-1111-1111-1111-111111111111'),
    ('c3333333-3333-3333-3333-333333333333', 'support@jtsupplies.com', 'Elena Rostova (Support)', 'support_agent', '22222222-2222-2222-2222-222222222222')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.customers (id, customer_code, company_name, contact_person, phone, email, address, city, country, status) VALUES
    ('10000000-0000-0000-0000-000000000001', 'CUST-000001', 'Apex Industrial Dynamics', 'Marcus Vance', '+1 (555) 234-5678', 'm.vance@apexind.com', '100 Industrial Parkway', 'Chicago', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000002', 'CUST-000002', 'Vanguard Freight & Logistics', 'Brenda Holloway', '+1 (555) 876-5432', 'b.holloway@vanguardfl.com', '450 Terminal Way', 'Houston', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000003', 'CUST-000003', 'Horizon Healthcare Systems', 'Dr. David Chen', '+1 (555) 345-6789', 'd.chen@horizonhealth.org', '780 Medical Center Blvd', 'Boston', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000004', 'CUST-000004', 'Summit Retail Distributors', 'Rachel Adams', '+1 (555) 901-2345', 'radams@summitretail.com', '120 Commerce Way', 'Atlanta', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000005', 'CUST-000005', 'Pacific Rim Manufacturing', 'Kenji Sato', '+1 (555) 678-9012', 'ksato@pacificrimmfg.com', '890 Logistics Hwy', 'Seattle', 'USA', 'active'),
    ('10000000-0000-0000-0000-000000000006', 'CUST-000006', 'Legacy Construction Corp', 'Tom Sterling', '+1 (555) 432-1098', 'tsterling@legacyconst.com', '34 Builders Square', 'Denver', 'USA', 'inactive')
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
    ('00000000-0000-0000-0002-000000000001', 'Industrial Cleaners', 'Heavy-duty degreasers, solvent cleaners, and surface sanitizers'),
    ('00000000-0000-0000-0002-000000000002', 'Packaging Supplies', 'Corrugated boxes, stretch film, sealing tape, and strapping'),
    ('00000000-0000-0000-0002-000000000003', 'Safety & PPE', 'Protective gloves, respirators, eye protection, and safety vests'),
    ('00000000-0000-0000-0002-000000000004', 'Warehouse Equipment', 'Pallet jacks, storage bins, shelving units, and hand trucks')
ON CONFLICT (name) DO NOTHING;

-- Product Brands (group 0003 in segment 4)
INSERT INTO public.product_brands (id, name, description) VALUES
    ('00000000-0000-0000-0003-000000000001', 'J&T ProClean', 'Premium industrial cleaning solutions'),
    ('00000000-0000-0000-0003-000000000002', 'PackGuard', 'Heavy-duty commercial packaging products'),
    ('00000000-0000-0000-0003-000000000003', 'SafeShield', 'Certified personal protective equipment'),
    ('00000000-0000-0000-0003-000000000004', 'DuraLift', 'Industrial warehouse machinery and storage accessories')
ON CONFLICT (name) DO NOTHING;

-- Products (group 0004 in segment 4)
INSERT INTO public.products
(id, sku, product_name, description, category_id, brand_id, unit_price, availability_status, availability_notes, expected_available_date) VALUES
    (
        '00000000-0000-0000-0004-000000000001',
        'IND-CLEAN-500',
        'ProClean Heavy-Duty Degreaser 5Gal',
        'Concentrated solvent degreaser suitable for heavy machinery and shop floors.',
        '00000000-0000-0000-0002-000000000001',
        '00000000-0000-0000-0003-000000000001',
        145.00, 'available', 'In stock and ready for distributor shipping.', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000002',
        'PKG-FILM-80G',
        'PackGuard Heavy Stretch Film 80 Gauge',
        'High-clarity pallet wrapping film with high puncture resistance.',
        '00000000-0000-0000-0002-000000000002',
        '00000000-0000-0000-0003-000000000002',
        65.00, 'out_of_stock', 'Raw chemical resin shortage from main supplier. Resupply shipment scheduled.',
        CURRENT_DATE + INTERVAL '7 days'
    ),
    (
        '00000000-0000-0000-0004-000000000003',
        'PPE-GLOVE-NIT-L',
        'SafeShield Nitrile Gloves Powder-Free (Box 100)',
        'Medical grade 5-mil powder-free nitrile examination gloves.',
        '00000000-0000-0000-0002-000000000003',
        '00000000-0000-0000-0003-000000000003',
        22.50, 'available', 'Fully available across main distribution network.', NULL
    ),
    (
        '00000000-0000-0000-0004-000000000004',
        'WHS-JACK-5500',
        'DuraLift Hydraulic Pallet Jack 5500 lbs',
        'Heavy-duty steel frame hydraulic pallet jack with polyurethane wheels.',
        '00000000-0000-0000-0002-000000000004',
        '00000000-0000-0000-0003-000000000004',
        480.00, 'out_of_stock', 'Factory line overhaul. Lead time approximately 2 weeks.',
        CURRENT_DATE + INTERVAL '14 days'
    ),
    (
        '00000000-0000-0000-0004-000000000005',
        'IND-SAN-100',
        'ProClean Surface Sanitizer Wipes 500ct',
        'Hospital-grade surface disinfectant wipes.',
        '00000000-0000-0000-0002-000000000001',
        '00000000-0000-0000-0003-000000000001',
        38.00, 'discontinued', 'Product replaced by IND-SAN-200 series.', NULL
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
        'invoiced', 1450.00, 50.00, 140.00, 1540.00,
        'Heavy machinery hydraulic components shipment.',
        'b2222222-2222-2222-2222-222222222222',
        'b2222222-2222-2222-2222-222222222222'
    ),
    (
        '00000000-0000-0000-0005-000000000002',
        'ORD-000002',
        '10000000-0000-0000-0000-000000000002',
        'b2222222-2222-2222-2222-222222222222',
        'dispatched', 2800.00, 100.00, 270.00, 2970.00,
        'Priority freight delivery to logistics terminal hub.',
        'b2222222-2222-2222-2222-222222222222',
        'b2222222-2222-2222-2222-222222222222'
    ),
    (
        '00000000-0000-0000-0005-000000000003',
        'ORD-000003',
        '10000000-0000-0000-0000-000000000003',
        'a1111111-1111-1111-1111-111111111111',
        'order_received', 750.00, 0.00, 75.00, 825.00,
        'Sterile healthcare supplies replenishment order.',
        'a1111111-1111-1111-1111-111111111111',
        'a1111111-1111-1111-1111-111111111111'
    ),
    (
        '00000000-0000-0000-0005-000000000004',
        'ORD-000004',
        '10000000-0000-0000-0000-000000000004',
        'b2222222-2222-2222-2222-222222222222',
        'completed', 4200.00, 200.00, 400.00, 4400.00,
        'Bulk packaging and retail distribution order.',
        'b2222222-2222-2222-2222-222222222222',
        'b2222222-2222-2222-2222-222222222222'
    )
ON CONFLICT (order_number) DO NOTHING;

-- Customer Queries (group 0006 in segment 4)
INSERT INTO public.customer_queries
(id, query_number, customer_id, subject, description, category_id, priority, status, assigned_to, created_by) VALUES
    (
        '00000000-0000-0000-0006-000000000001',
        'QRY-000001',
        '10000000-0000-0000-0000-000000000001',
        'Urgent Delivery Status for Hydraulic Degreaser Order',
        'Customer requested immediate delivery tracking for order ORD-000001. Carrier shipment appears delayed near Chicago hub.',
        '00000000-0000-0000-0001-000000000002',
        'high', 'in_progress',
        'c3333333-3333-3333-3333-333333333333',
        'b2222222-2222-2222-2222-222222222222'
    ),
    (
        '00000000-0000-0000-0006-000000000002',
        'QRY-000002',
        '10000000-0000-0000-0000-000000000002',
        'Availability Inquiry for Heavy Stretch Film 80G',
        'Vanguard Freight wants to place a bulk order of 200 rolls of PackGuard Heavy Stretch Film 80G. Product is marked Out of Stock.',
        '00000000-0000-0000-0001-000000000005',
        'urgent', 'waiting_customer',
        'c3333333-3333-3333-3333-333333333333',
        'c3333333-3333-3333-3333-333333333333'
    ),
    (
        '00000000-0000-0000-0006-000000000003',
        'QRY-000003',
        '10000000-0000-0000-0000-000000000003',
        'Sterile Glove Certificate of Compliance',
        'Horizon Healthcare requested formal QA compliance documentation for SafeShield Nitrile Gloves.',
        '00000000-0000-0000-0001-000000000004',
        'medium', 'resolved',
        'c3333333-3333-3333-3333-333333333333',
        'a1111111-1111-1111-1111-111111111111'
    )
ON CONFLICT (query_number) DO NOTHING;
