-- ==============================================================================
-- Migration 07: Add delivery_date Column to daily_order_operations Table
-- Description: Adds delivery_date column for explicit tracking of scheduled delivery
--              dates alongside order processing dates in Supabase PostgreSQL.
-- ==============================================================================

-- 1. Add delivery_date column if it does not already exist
ALTER TABLE public.daily_order_operations
ADD COLUMN IF NOT EXISTS delivery_date DATE NULL;

-- 2. Add delivery_date column to history table if applicable
ALTER TABLE public.daily_order_operation_history
ADD COLUMN IF NOT EXISTS delivery_date DATE NULL;

-- 3. Create index for high-performance delivery date queries
CREATE INDEX IF NOT EXISTS idx_daily_order_operations_delivery_date
ON public.daily_order_operations(delivery_date);

-- 4. Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
