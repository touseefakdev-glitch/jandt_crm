-- ==============================================================================
-- Migration 08: Create back_orders Table & Add Issue Fields to queries Table
-- Description: Establishes dedicated Back Order tracking and issue-specific fields
-- ==============================================================================

-- 1. Add issue-specific columns to queries table
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

-- 2. Create public.back_orders table
CREATE TABLE IF NOT EXISTS public.back_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    query_id UUID NOT NULL REFERENCES public.queries(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
    product_id UUID NULL REFERENCES public.products(id) ON DELETE SET NULL,
    product_name_snapshot VARCHAR(255) NOT NULL,
    sku_snapshot VARCHAR(100) NULL,
    quantity NUMERIC(10,2) NOT NULL DEFAULT 1,
    reason TEXT NOT NULL,
    original_order_id UUID NULL REFERENCES public.orders(id) ON DELETE SET NULL,
    original_order_number VARCHAR(100) NULL,
    original_delivery_date DATE NULL,
    next_delivery_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    notes TEXT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_back_orders_customer_id ON public.back_orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_back_orders_query_id ON public.back_orders(query_id);
CREATE INDEX IF NOT EXISTS idx_back_orders_status ON public.back_orders(status);
CREATE INDEX IF NOT EXISTS idx_back_orders_next_delivery ON public.back_orders(next_delivery_date);

-- 4. Enable RLS and add permissive policies
ALTER TABLE public.back_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all for authenticated and anon users on back_orders" ON public.back_orders;

CREATE POLICY "Allow all for authenticated and anon users on back_orders"
ON public.back_orders
FOR ALL
USING (true)
WITH CHECK (true);

-- 5. Auto updated_at trigger
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

-- 6. Reload schema
NOTIFY pgrst, 'reload schema';
