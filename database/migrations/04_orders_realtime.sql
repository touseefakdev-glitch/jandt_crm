-- =============================================================================
-- MIGRATION 04: ORDERS MODULE REBUILD — Workflow, Operational Areas & Realtime
--
-- Summary:
--   1. Extends public.profiles with an operational_area assignment.
--   2. Extends public.daily_order_operations with the full daily workflow:
--        - POD Sent (pod_sent / pod_sent_at / pod_sent_by)
--        - Order Match (order_match SAME|DIFFERENT + difference_note + invoice_updated)
--        - Exceptions (exception_status NONE|ERROR + exception_note)
--        - Operational Area (KELOWNA | OUTSIDE_KELOWNA) + updated_by
--   3. Backfills operational_area + exceptions from existing rows.
--   4. Enables ROW LEVEL SECURITY on the orders module tables with
--      area-scoped policies (admin = all areas, agent = own area).
--   5. Publishes daily_order_operations + daily_order_operation_history to the
--      Supabase Realtime publication so two open browsers stay in sync.
--   6. Adds indexes justified by the Orders page queries.
--
-- SAFE TO RE-RUN. No data is dropped, deleted, or reset.
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. PROFILES — Operational Area Assignment
-- -----------------------------------------------------------------------------
ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS operational_area VARCHAR(20) NOT NULL DEFAULT 'BOTH'
    CONSTRAINT profiles_operational_area_check
        CHECK (operational_area IN ('KELOWNA', 'OUTSIDE_KELOWNA', 'BOTH'));

-- -----------------------------------------------------------------------------
-- 2. DAILY ORDER OPERATIONS — Defensive table create (corrected FK) then add
--    the new workflow columns. If the table already exists this block is a
--    no-op and the ALTER statements below apply the new columns instead.
-- -----------------------------------------------------------------------------
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

    -- POD (proof of delivery) sent — after dispatch
    pod_sent BOOLEAN NOT NULL DEFAULT FALSE,
    pod_sent_at TIMESTAMPTZ,
    pod_sent_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    -- Order vs invoice matching
    order_match VARCHAR(10),
    difference_note TEXT,
    invoice_updated BOOLEAN NOT NULL DEFAULT FALSE,

    -- Exceptions / escalated errors
    error_flag BOOLEAN NOT NULL DEFAULT FALSE,
    exception_status VARCHAR(10) NOT NULL DEFAULT 'NONE',
    exception_note TEXT,
    error_query_id UUID REFERENCES public.customer_queries(id) ON DELETE SET NULL,

    -- Operational area + audit
    operational_area VARCHAR(20) NOT NULL DEFAULT 'OUTSIDE_KELOWNA',
    status VARCHAR(50) NOT NULL DEFAULT 'not_started',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

    CONSTRAINT unique_customer_operation_date UNIQUE (customer_id, operation_date),
    CONSTRAINT daily_order_operations_order_match_check
        CHECK (order_match IN ('SAME', 'DIFFERENT')),
    CONSTRAINT daily_order_operations_exception_status_check
        CHECK (exception_status IN ('NONE', 'ERROR')),
    CONSTRAINT daily_order_operations_operational_area_check
        CHECK (operational_area IN ('KELOWNA', 'OUTSIDE_KELOWNA'))
);

ALTER TABLE public.daily_order_operations
    ADD COLUMN IF NOT EXISTS pod_sent BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS pod_sent_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS pod_sent_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS order_match VARCHAR(10),
    ADD COLUMN IF NOT EXISTS difference_note TEXT,
    ADD COLUMN IF NOT EXISTS invoice_updated BOOLEAN NOT NULL DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS exception_status VARCHAR(10) NOT NULL DEFAULT 'NONE',
    ADD COLUMN IF NOT EXISTS exception_note TEXT,
    ADD COLUMN IF NOT EXISTS operational_area VARCHAR(20) NOT NULL DEFAULT 'OUTSIDE_KELOWNA',
    ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Keep updated_at maintained at the database layer as well
DROP TRIGGER IF EXISTS update_daily_order_operations_modtime ON public.daily_order_operations;
CREATE TRIGGER update_daily_order_operations_modtime
    BEFORE UPDATE ON public.daily_order_operations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- -----------------------------------------------------------------------------
-- 3. BACKFILLS — derive operational_area from the route schedule, migrate the
--    legacy error_flag into the structured exception model.
-- -----------------------------------------------------------------------------
UPDATE public.daily_order_operations op
SET operational_area = 'KELOWNA'
FROM public.route_schedules rs
WHERE rs.city_or_route = op.route
  AND rs.portal = 'kelowna'
  AND rs.active = TRUE
  AND op.operational_area = 'OUTSIDE_KELOWNA';

UPDATE public.daily_order_operations
SET exception_status = 'ERROR',
    exception_note = COALESCE(exception_note, 'Legacy error flagged on this operation — see the linked query for details.')
WHERE error_flag = TRUE
  AND exception_status = 'NONE';

-- -----------------------------------------------------------------------------
-- 4. ROW LEVEL SECURITY — per-area access for the orders module.
--
-- Identity is resolved by email (profiles.email = auth.jwt() ->> 'email') so it
-- works regardless of whether the Supabase Auth user id matches the profile id.
-- Rules:
--   - admin           → full access to every operational area
--   - area = BOTH     → full access
--   - area = KELOWNA / OUTSIDE_KELOWNA → access limited to that area
-- -----------------------------------------------------------------------------
ALTER TABLE public.route_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_order_operations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_order_operation_history ENABLE ROW LEVEL SECURITY;

-- Remove the legacy permissive seed policies (seed.sql creates "App anon full access") so
-- area-scoped authorization is the only path into the orders module.
DROP POLICY IF EXISTS "App anon full access route_schedules" ON public.route_schedules;
DROP POLICY IF EXISTS "App anon full access daily_order_operations" ON public.daily_order_operations;
DROP POLICY IF EXISTS "App anon full access daily_order_operation_history" ON public.daily_order_operation_history;

-- route_schedules: read for any authenticated user, full control for admins
DROP POLICY IF EXISTS "Authenticated read route schedules" ON public.route_schedules;
CREATE POLICY "Authenticated read route schedules"
    ON public.route_schedules FOR SELECT
    USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admin write route schedules" ON public.route_schedules;
CREATE POLICY "Admin write route schedules"
    ON public.route_schedules FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.email = auth.jwt() ->> 'email'
              AND p.is_active = TRUE
              AND p.role = 'admin'
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.email = auth.jwt() ->> 'email'
              AND p.is_active = TRUE
              AND p.role = 'admin'
        )
    );

-- daily_order_operations: area-scoped access (read, insert, update, delete)
DROP POLICY IF EXISTS "Area scoped operations access" ON public.daily_order_operations;
CREATE POLICY "Area scoped operations access"
    ON public.daily_order_operations FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.email = auth.jwt() ->> 'email'
              AND p.is_active = TRUE
              AND (
                    p.role = 'admin'
                    OR p.operational_area = 'BOTH'
                    OR p.operational_area = daily_order_operations.operational_area
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles p
            WHERE p.email = auth.jwt() ->> 'email'
              AND p.is_active = TRUE
              AND (
                    p.role = 'admin'
                    OR p.operational_area = 'BOTH'
                    OR p.operational_area = daily_order_operations.operational_area
              )
        )
    );

-- daily_order_operation_history: area-scoped via the parent operation
DROP POLICY IF EXISTS "Area scoped history access" ON public.daily_order_operation_history;
CREATE POLICY "Area scoped history access"
    ON public.daily_order_operation_history FOR ALL
    USING (
        EXISTS (
            SELECT 1
            FROM public.daily_order_operations o
            JOIN public.profiles p ON p.email = auth.jwt() ->> 'email'
            WHERE o.id = daily_order_operation_history.operation_id
              AND p.is_active = TRUE
              AND (
                    p.role = 'admin'
                    OR p.operational_area = 'BOTH'
                    OR p.operational_area = o.operational_area
              )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1
            FROM public.daily_order_operations o
            JOIN public.profiles p ON p.email = auth.jwt() ->> 'email'
            WHERE o.id = daily_order_operation_history.operation_id
              AND p.is_active = TRUE
              AND (
                    p.role = 'admin'
                    OR p.operational_area = 'BOTH'
                    OR p.operational_area = o.operational_area
              )
        )
    );

-- -----------------------------------------------------------------------------
-- 5. SUPABASE REALTIME PUBLICATION
-- -----------------------------------------------------------------------------
DO $realtime_pub$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'daily_order_operations'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_order_operations';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
          AND schemaname = 'public'
          AND tablename = 'daily_order_operation_history'
    ) THEN
        EXECUTE 'ALTER PUBLICATION supabase_realtime ADD TABLE public.daily_order_operation_history';
    END IF;
END $realtime_pub$;

-- -----------------------------------------------------------------------------
-- 6. INDEXES — justified by the queries the Orders module actually runs:
--    · Orders page: filter by (operation_date, route), order by updated_at DESC,
--      filter by status, RLS filters by operational_area.
--    · History timeline: newest-first per operation.
--    · Orders (sales orders): recent-first ordering on the orders screen.
-- -----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_daily_ops_date_route
    ON public.daily_order_operations (operation_date, route);
CREATE INDEX IF NOT EXISTS idx_daily_ops_area
    ON public.daily_order_operations (operational_area);
CREATE INDEX IF NOT EXISTS idx_daily_ops_status
    ON public.daily_order_operations (status);
CREATE INDEX IF NOT EXISTS idx_daily_ops_updated_at
    ON public.daily_order_operations (updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_daily_ops_history_op_ts
    ON public.daily_order_operation_history (operation_id, timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_orders_updated_at
    ON public.orders (updated_at DESC);

COMMIT;
