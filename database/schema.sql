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

-- WhatsApp Order Intelligence Enums (Phase A)
DO $$ BEGIN
    CREATE TYPE message_classification AS ENUM (
        'ORDER', 'ORDER_CORRECTION', 'ORDER_CONFIRMATION', 'NON_ORDER',
        'QUESTION', 'COMPLAINT', 'GREETING', 'UNKNOWN'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE order_draft_status AS ENUM (
        'NEW_MESSAGE', 'ANALYZING', 'DRAFT_CREATED', 'NEEDS_CLARIFICATION',
        'AWAITING_CONFIRMATION', 'CUSTOMER_CORRECTING', 'CONFIRMED',
        'FORWARDED', 'CANCELLED', 'HUMAN_REVIEW'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE match_method AS ENUM (
        'sku', 'exact_name', 'normalized_name', 'alias', 'customer_alias',
        'customer_history', 'semantic', 'unknown'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE attention_priority AS ENUM ('normal', 'high', 'urgent');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE alert_status AS ENUM ('new', 'acknowledged', 'resolved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE bot_status AS ENUM ('active', 'paused', 'human_takeover');
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
    whatsapp_number VARCHAR(50),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    route VARCHAR(100),
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

-- System Settings
INSERT INTO public.system_settings (id, company_name, crm_title, timezone, date_format, currency_symbol, pagination_limit, updated_by) VALUES
    ('00000000-0000-0000-0000-0000000000a1', 'J&T Supplies', 'J&T Supplies CRM', 'America/Vancouver', 'MMM D, YYYY h:mm A', '$', 10, 'a1111111-1111-1111-1111-111111111111')
ON CONFLICT (id) DO NOTHING;

-- Import Jobs Table (Step 11 CSV Import System)
CREATE TABLE IF NOT EXISTS public.import_jobs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    import_type VARCHAR(50) NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    import_strategy VARCHAR(50) NOT NULL DEFAULT 'create_new_only',
    total_rows INTEGER NOT NULL DEFAULT 0,
    created_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    failed_count INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'completed',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    errors_json TEXT
);

-- =============================================================================
-- STEP 10 REBUILD: ROUTE-BASED DAILY ORDER OPERATIONS
-- =============================================================================

-- Route Schedules Table
CREATE TABLE IF NOT EXISTS public.route_schedules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    day_of_week VARCHAR(20) NOT NULL, -- monday, tuesday, wednesday, thursday, friday, saturday, sunday
    city_or_route VARCHAR(100) NOT NULL,
    portal VARCHAR(50) NOT NULL DEFAULT 'outside_kelowna', -- kelowna, outside_kelowna
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_day_city UNIQUE (day_of_week, city_or_route)
);

-- Daily Order Operations Table
CREATE TABLE IF NOT EXISTS public.daily_order_operations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    operation_date DATE NOT NULL,
    route VARCHAR(100) NOT NULL,
    
    order_received BOOLEAN NOT NULL DEFAULT FALSE,
    order_received_at TIMESTAMPTZ,
    order_received_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    sales_order_generated BOOLEAN NOT NULL DEFAULT FALSE,
    sales_order_number VARCHAR(100),
    sales_order_generated_at TIMESTAMPTZ,
    sales_order_generated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    invoiced BOOLEAN NOT NULL DEFAULT FALSE,
    invoice_number VARCHAR(100),
    invoiced_at TIMESTAMPTZ,
    invoiced_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    dispatched BOOLEAN NOT NULL DEFAULT FALSE,
    dispatched_at TIMESTAMPTZ,
    dispatched_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    
    error_flag BOOLEAN NOT NULL DEFAULT FALSE,
    error_query_id UUID REFERENCES public.queries(id) ON DELETE SET NULL,
    
    status VARCHAR(50) NOT NULL DEFAULT 'not_started',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_customer_operation_date UNIQUE (customer_id, operation_date)
);

-- Daily Order Operation History Audit Table
CREATE TABLE IF NOT EXISTS public.daily_order_operation_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    operation_id UUID NOT NULL REFERENCES public.daily_order_operations(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    action VARCHAR(100) NOT NULL,
    previous_state VARCHAR(50),
    new_state VARCHAR(50) NOT NULL,
    reference_number VARCHAR(100),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reason TEXT,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Initial Weekly Route Schedule Seed Data
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

-- =============================================================================
-- HISTORICAL CUSTOMER-PRODUCT RELATIONSHIPS & FUTURE WHATSAPP AUTOMATION SCHEMA
-- =============================================================================

-- Customer Product History Table
CREATE TABLE IF NOT EXISTS public.customer_product_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    source_item_code VARCHAR(100) NOT NULL,
    source_item_name VARCHAR(255) NOT NULL,
    packaging_unit VARCHAR(50),
    customer_price NUMERIC(12,2),
    inner_unit VARCHAR(50),
    inner_qty NUMERIC(12,2),
    unit_price NUMERIC(12,4),
    import_batch_id UUID REFERENCES public.import_jobs(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_customer_source_item UNIQUE (customer_id, source_item_code)
);

-- Future WhatsApp Contacts Table
CREATE TABLE IF NOT EXISTS public.whatsapp_contacts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    whatsapp_number VARCHAR(50) NOT NULL UNIQUE,
    display_name VARCHAR(255),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Future WhatsApp Conversations Table
CREATE TABLE IF NOT EXISTS public.whatsapp_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    whatsapp_contact_id UUID REFERENCES public.whatsapp_contacts(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'active', -- active, closed, escalated_to_human
    route VARCHAR(100),
    delivery_date DATE,
    bot_status bot_status NOT NULL DEFAULT 'active', -- active, paused, human_takeover
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Future WhatsApp Messages Table
CREATE TABLE IF NOT EXISTS public.whatsapp_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES public.whatsapp_conversations(id) ON DELETE CASCADE,
    direction VARCHAR(20) NOT NULL DEFAULT 'inbound', -- inbound, outbound
    message_type VARCHAR(50) NOT NULL DEFAULT 'text', -- text, template, interactive
    message_text TEXT,
    external_message_id VARCHAR(255),
    sender VARCHAR(255),
    classification message_classification,
    processing_status VARCHAR(50) NOT NULL DEFAULT 'received', -- received, classified, parsed, draft_created, awaiting_confirmation, confirmed, escalated, error
    processed_at TIMESTAMPTZ,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- WHATSAPP ORDER INTELLIGENCE — PHASE A FOUNDATION
-- =============================================================================

-- Order Drafts Table (temporary order intake before customer confirmation)
CREATE TABLE IF NOT EXISTS public.order_drafts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
    route VARCHAR(100),
    delivery_date DATE,
    status order_draft_status NOT NULL DEFAULT 'NEW_MESSAGE',
    overall_confidence NUMERIC(5,4) NOT NULL DEFAULT 0,
    clarification_reason TEXT,
    pending_question TEXT,
    confirmed_at TIMESTAMPTZ,
    confirmed_message TEXT,
    confirmation_message_id UUID REFERENCES public.whatsapp_messages(id) ON DELETE SET NULL,
    internal_reference VARCHAR(50),
    bot_paused BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Draft Items Table (preserves what customer said vs matched product)
CREATE TABLE IF NOT EXISTS public.order_draft_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_draft_id UUID NOT NULL REFERENCES public.order_drafts(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
    customer_text TEXT NOT NULL,
    matched_product_name VARCHAR(255),
    quantity NUMERIC(12,2),
    unit VARCHAR(50),
    match_method match_method NOT NULL DEFAULT 'unknown',
    match_confidence NUMERIC(5,4) NOT NULL DEFAULT 0,
    status VARCHAR(50) NOT NULL DEFAULT 'candidate', -- candidate, matched, needs_clarification, confirmed, rejected
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Global Product Aliases Table (customer-facing names for catalog products)
CREATE TABLE IF NOT EXISTS public.product_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    alias VARCHAR(255) NOT NULL,
    normalized_alias VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_product_alias UNIQUE (product_id, normalized_alias)
);

-- Customer-Specific Product Aliases Table
CREATE TABLE IF NOT EXISTS public.customer_product_aliases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    alias VARCHAR(255) NOT NULL,
    normalized_alias VARCHAR(255) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_customer_alias UNIQUE (customer_id, product_id, normalized_alias)
);

-- Route Destinations Table (configurable destination for confirmed route orders)
CREATE TABLE IF NOT EXISTS public.route_destinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    route VARCHAR(100) NOT NULL,
    destination_type VARCHAR(50) NOT NULL DEFAULT 'whatsapp_group', -- whatsapp_group, whatsapp_number, email
    destination_identifier VARCHAR(255) NOT NULL,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_route_destination UNIQUE (route, destination_type, destination_identifier)
);

-- Agent Attention Alerts Table (human attention for non-order / question / complaint / unknown)
CREATE TABLE IF NOT EXISTS public.agent_attention_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.whatsapp_messages(id) ON DELETE SET NULL,
    classification message_classification,
    message_text TEXT,
    priority attention_priority NOT NULL DEFAULT 'normal',
    status alert_status NOT NULL DEFAULT 'new',
    assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    resolution TEXT,
    query_id UUID REFERENCES public.customer_queries(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Order Intake Events Table (audit trail for WhatsApp order intelligence actions)
CREATE TABLE IF NOT EXISTS public.order_intake_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_draft_id UUID REFERENCES public.order_drafts(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.whatsapp_messages(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL, -- message_received, classified, candidate_extracted, product_matched, history_used, clarification_requested, customer_confirmed, draft_confirmed, draft_cancelled, route_forwarded, human_takeover, bot_paused, bot_resumed, escalation_created
    description TEXT NOT NULL,
    confidence NUMERIC(5,4),
    payload JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- PHASE 7: AUTOMATED DAILY ORDER REQUEST
-- =============================================================================

-- Order Request Automation Configuration (single row, id fixed)
CREATE TABLE IF NOT EXISTS public.order_request_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    send_time VARCHAR(10) NOT NULL DEFAULT '09:00', -- 24h HH:MM in business timezone
    timezone VARCHAR(100) NOT NULL DEFAULT 'America/Vancouver',
    template TEXT NOT NULL DEFAULT 'Good morning {{customer_name}}.
Your delivery is scheduled for {{route}} tomorrow.
Please send us your order for tomorrow''s delivery.
Thank you,
J&T Supplies',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL
);

-- Seed default config row
INSERT INTO public.order_request_config (id, enabled, send_time, timezone)
VALUES ('00000000-0000-0000-0000-0000000000c1', TRUE, '09:00', 'America/Vancouver')
ON CONFLICT (id) DO NOTHING;

-- Daily Order Request Reminder Log (per customer per delivery date, dedupe)
CREATE TABLE IF NOT EXISTS public.order_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    customer_name VARCHAR(255),
    route VARCHAR(100),
    delivery_date DATE NOT NULL, -- the delivery date the reminder was for
    status VARCHAR(20) NOT NULL DEFAULT 'sent', -- sent, failed
    sent_at TIMESTAMPTZ,
    message_id VARCHAR(255), -- Baileys message id when dispatched
    message_text TEXT,
    error_reason TEXT,
    attempt_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_customer_delivery UNIQUE (customer_id, delivery_date)
);

-- =============================================================================
-- PHASE 8: PRODUCTION HARDENING
-- =============================================================================

-- Order Processing Error Log (error recovery: nothing silently disappears)
-- Failed messages are stored here for retry / manual review.
CREATE TABLE IF NOT EXISTS public.order_processing_errors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES public.whatsapp_conversations(id) ON DELETE SET NULL,
    message_id UUID REFERENCES public.whatsapp_messages(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    stage VARCHAR(30) NOT NULL, -- ingest, classify, parse, match, dispatch, ai, supabase
    error_code VARCHAR(100) NOT NULL,
    error_message TEXT,
    raw_message_text TEXT,
    external_message_id VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'open', -- open, retrying, resolved, dismissed
    attempt_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- WHATSAPP ORDER INTELLIGENCE INDEXES
-- =============================================================================
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_customer ON public.whatsapp_conversations(customer_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_conversations_contact ON public.whatsapp_conversations(whatsapp_contact_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_conversation ON public.whatsapp_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_classification ON public.whatsapp_messages(classification);
CREATE INDEX IF NOT EXISTS idx_whatsapp_messages_processing ON public.whatsapp_messages(processing_status);
CREATE INDEX IF NOT EXISTS idx_order_drafts_customer ON public.order_drafts(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_drafts_status ON public.order_drafts(status);
CREATE INDEX IF NOT EXISTS idx_order_drafts_conversation ON public.order_drafts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_order_draft_items_draft ON public.order_draft_items(order_draft_id);
CREATE INDEX IF NOT EXISTS idx_order_draft_items_product ON public.order_draft_items(product_id);
CREATE INDEX IF NOT EXISTS idx_product_aliases_normalized ON public.product_aliases(normalized_alias);
CREATE INDEX IF NOT EXISTS idx_customer_product_aliases_customer ON public.customer_product_aliases(customer_id);
CREATE INDEX IF NOT EXISTS idx_agent_attention_alerts_status ON public.agent_attention_alerts(status);
CREATE INDEX IF NOT EXISTS idx_agent_attention_alerts_priority ON public.agent_attention_alerts(priority);
CREATE INDEX IF NOT EXISTS idx_order_intake_events_draft ON public.order_intake_events(order_draft_id);
CREATE INDEX IF NOT EXISTS idx_route_destinations_route ON public.route_destinations(route);
CREATE INDEX IF NOT EXISTS idx_order_reminders_customer ON public.order_reminders(customer_id);
CREATE INDEX IF NOT EXISTS idx_order_reminders_delivery ON public.order_reminders(delivery_date);
CREATE INDEX IF NOT EXISTS idx_order_reminders_status ON public.order_reminders(status);
CREATE INDEX IF NOT EXISTS idx_order_processing_errors_status ON public.order_processing_errors(status);
CREATE INDEX IF NOT EXISTS idx_order_processing_errors_created ON public.order_processing_errors(created_at);
CREATE INDEX IF NOT EXISTS idx_order_processing_errors_message ON public.order_processing_errors(message_id);

-- =============================================================================
-- WHATSAPP ORDER INTELLIGENCE ROW LEVEL SECURITY
-- =============================================================================
ALTER TABLE public.whatsapp_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_draft_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_product_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_destinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.agent_attention_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_intake_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_request_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_processing_errors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read whatsapp contacts" ON public.whatsapp_contacts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read whatsapp conversations" ON public.whatsapp_conversations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read whatsapp messages" ON public.whatsapp_messages FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read order drafts" ON public.order_drafts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read order draft items" ON public.order_draft_items FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read product aliases" ON public.product_aliases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read customer product aliases" ON public.customer_product_aliases FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read route destinations" ON public.route_destinations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read agent attention alerts" ON public.agent_attention_alerts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read order intake events" ON public.order_intake_events FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read order request config" ON public.order_request_config FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read order reminders" ON public.order_reminders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read order processing errors" ON public.order_processing_errors FOR SELECT USING (auth.role() = 'authenticated');

-- =============================================================================
-- WHATSAPP CLOUD INFRASTRUCTURE TABLES
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.whatsapp_connector_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_name VARCHAR(100) NOT NULL DEFAULT 'default_connector' UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'DISCONNECTED',
    last_heartbeat TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    connected_at TIMESTAMPTZ,
    last_message_received_at TIMESTAMPTZ,
    last_message_sent_at TIMESTAMPTZ,
    messages_received_today INTEGER NOT NULL DEFAULT 0,
    messages_sent_today INTEGER NOT NULL DEFAULT 0,
    qr_code_data TEXT,
    error_message TEXT,
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.whatsapp_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remote_jid VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    error_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS public.whatsapp_baileys_auth (
    id VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.whatsapp_connector_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_baileys_auth ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access to whatsapp_connector_status" ON public.whatsapp_connector_status FOR SELECT USING (true);
CREATE POLICY "Allow write access to whatsapp_connector_status" ON public.whatsapp_connector_status FOR ALL USING (true);
CREATE POLICY "Allow read access to whatsapp_outbox" ON public.whatsapp_outbox FOR SELECT USING (true);
CREATE POLICY "Allow write access to whatsapp_outbox" ON public.whatsapp_outbox FOR ALL USING (true);
CREATE POLICY "Allow read access to whatsapp_baileys_auth" ON public.whatsapp_baileys_auth FOR SELECT USING (true);
CREATE POLICY "Allow write access to whatsapp_baileys_auth" ON public.whatsapp_baileys_auth FOR ALL USING (true);

INSERT INTO public.whatsapp_connector_status (connector_name, status, version)
VALUES ('default_connector', 'DISCONNECTED', '1.0.0')
ON CONFLICT (connector_name) DO NOTHING;

