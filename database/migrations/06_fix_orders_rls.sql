-- =============================================================================
-- MIGRATION 06: ORDERS MODULE RLS POLICIES & TRIGGER CONFIRMATION
--
-- Summary:
--   1. Ensures RLS policies on public.daily_order_operations,
--      public.daily_order_operation_history, public.route_schedules,
--      public.orders, and public.order_status_history allow read, insert,
--      update, and delete operations for authenticated and anon app clients.
--   2. Verifies the updated_at trigger is active on public.daily_order_operations
--      and public.orders so updated_at is automatically updated on every write.
--
-- SAFE TO RE-RUN.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Enable RLS on Orders tables
-- -----------------------------------------------------------------------------
ALTER TABLE public.daily_order_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_order_operation_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_schedules ENABLE ROW LEVEL SECURITY;
DO $enable_orders_rls$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
        EXECUTE 'ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;';
        EXECUTE 'ALTER TABLE public.order_status_history ENABLE ROW LEVEL SECURITY;';
    END IF;
END $enable_orders_rls$;

-- -----------------------------------------------------------------------------
-- 2. Permissive App RLS Policies (allows reads/writes from frontend client)
-- -----------------------------------------------------------------------------

-- daily_order_operations
DROP POLICY IF EXISTS "App full access daily_order_operations" ON public.daily_order_operations;
DROP POLICY IF EXISTS "Area scoped operations access" ON public.daily_order_operations;
DROP POLICY IF EXISTS "App anon full access daily_order_operations" ON public.daily_order_operations;
CREATE POLICY "App full access daily_order_operations"
    ON public.daily_order_operations FOR ALL
    USING (true)
    WITH CHECK (true);

-- daily_order_operation_history
DROP POLICY IF EXISTS "App full access daily_order_operation_history" ON public.daily_order_operation_history;
DROP POLICY IF EXISTS "Area scoped history access" ON public.daily_order_operation_history;
DROP POLICY IF EXISTS "App anon full access daily_order_operation_history" ON public.daily_order_operation_history;
CREATE POLICY "App full access daily_order_operation_history"
    ON public.daily_order_operation_history FOR ALL
    USING (true)
    WITH CHECK (true);

-- route_schedules
DROP POLICY IF EXISTS "App full access route_schedules" ON public.route_schedules;
DROP POLICY IF EXISTS "Authenticated read route schedules" ON public.route_schedules;
DROP POLICY IF EXISTS "Admin write route schedules" ON public.route_schedules;
DROP POLICY IF EXISTS "App anon full access route_schedules" ON public.route_schedules;
CREATE POLICY "App full access route_schedules"
    ON public.route_schedules FOR ALL
    USING (true)
    WITH CHECK (true);

-- orders (sales orders table if present)
DO $orders_policies$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
        DROP POLICY IF EXISTS "App full access orders" ON public.orders;
        DROP POLICY IF EXISTS "Authenticated users can read orders" ON public.orders;
        DROP POLICY IF EXISTS "App anon full access orders" ON public.orders;
        EXECUTE 'CREATE POLICY "App full access orders" ON public.orders FOR ALL USING (true) WITH CHECK (true);';

        DROP POLICY IF EXISTS "App full access order_status_history" ON public.order_status_history;
        DROP POLICY IF EXISTS "Authenticated users can read order status history" ON public.order_status_history;
        DROP POLICY IF EXISTS "App anon full access order_status_history" ON public.order_status_history;
        EXECUTE 'CREATE POLICY "App full access order_status_history" ON public.order_status_history FOR ALL USING (true) WITH CHECK (true);';
    END IF;
END $orders_policies$;

-- -----------------------------------------------------------------------------
-- 3. AUTOMATED TIMESTAMP UPDATE TRIGGERS
-- -----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_daily_order_operations_modtime ON public.daily_order_operations;
CREATE TRIGGER update_daily_order_operations_modtime
    BEFORE UPDATE ON public.daily_order_operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DO $orders_trigger$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'orders') THEN
        DROP TRIGGER IF EXISTS update_orders_modtime ON public.orders;
        EXECUTE 'CREATE TRIGGER update_orders_modtime BEFORE UPDATE ON public.orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();';
    END IF;
END $orders_trigger$;

COMMIT;
