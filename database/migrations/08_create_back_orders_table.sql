-- ==============================================================================
-- Migration 08: Create back_orders Table & Add Issue Fields to queries Table
-- Description: Establishes dedicated Back Order tracking and issue-specific fields
-- ==============================================================================

-- 1. Ensure public.queries table exists
CREATE TABLE IF NOT EXISTS public.queries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_number VARCHAR(100) NOT NULL UNIQUE,
    customer_id UUID NOT NULL,
    order_id UUID NULL,
    product_id UUID NULL,
    subject VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    category_id UUID NULL,
    priority VARCHAR(50) NOT NULL DEFAULT 'medium',
    status VARCHAR(50) NOT NULL DEFAULT 'new',
    assigned_to UUID NULL,
    assigned_team_id UUID NULL,
    created_by UUID NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    resolved_at TIMESTAMPTZ NULL,
    resolved_by UUID NULL,
    resolution TEXT NULL,
    closed_at TIMESTAMPTZ NULL,
    closed_by UUID NULL,
    closure_reason TEXT NULL,
    reopened_at TIMESTAMPTZ NULL,
    reopened_by UUID NULL,
    reopen_reason TEXT NULL,
    internal_notes TEXT NULL
);

-- 2. Add issue-specific columns to public.queries
ALTER TABLE public.queries
ADD COLUMN IF NOT EXISTS issue_type VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS action_required VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS expected_price NUMERIC(12,2) NULL,
ADD COLUMN IF NOT EXISTS charged_price NUMERIC(12,2) NULL,
ADD COLUMN IF NOT EXISTS price_difference NUMERIC(12,2) NULL,
ADD COLUMN IF NOT EXISTS expected_item VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS received_item VARCHAR(255) NULL,
ADD COLUMN IF NOT EXISTS quantity_affected NUMERIC(10,2) NULL,
ADD COLUMN IF NOT EXISTS invoice_number_ref VARCHAR(100) NULL,
ADD COLUMN IF NOT EXISTS back_order_id UUID NULL;

-- 3. Create public.back_orders table
CREATE TABLE IF NOT EXISTS public.back_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID NOT NULL,
    customer_id UUID NOT NULL,
    product_id UUID NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    sku_snapshot VARCHAR(100) NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    original_order_id UUID NULL,
    original_order_number VARCHAR(100) NULL,
    original_delivery_date DATE NULL,
    next_delivery_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_back_orders_customer_id ON public.back_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_back_orders_query_id ON public.back_orders(query_id);
CREATE INDEX IF NOT EXISTS idx_back_orders_status ON public.back_orders(status);
CREATE INDEX IF NOT EXISTS idx_back_orders_next_delivery ON public.back_orders(next_delivery_date);
CREATE INDEX IF NOT EXISTS idx_queries_issue_type ON public.queries(issue_type);

-- 5. Enable RLS and add permissive policies
ALTER TABLE public.queries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.back_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated and anon users on queries" ON public.queries;
CREATE POLICY "Allow all for authenticated and anon users on queries"
ON public.queries
FOR ALL
USING (true)
WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all for authenticated and anon users on back_orders" ON public.back_orders;
CREATE POLICY "Allow all for authenticated and anon users on back_orders"
ON public.back_orders
FOR ALL
USING (true)
WITH CHECK (true);

-- 6. Auto updated_at trigger
CREATE OR REPLACE FUNCTION public.update_back_orders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_back_orders_updated_at ON public.back_orders;

CREATE TRIGGER trigger_update_back_orders_updated_at
BEFORE UPDATE ON public.back_orders
FOR EACH ROW
EXECUTE FUNCTION public.update_back_orders_updated_at();

-- 7. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
