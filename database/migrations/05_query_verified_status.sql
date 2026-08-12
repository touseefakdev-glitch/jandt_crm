-- =============================================================================
-- MIGRATION 05: QUERY CENTER — Verified Resolution Status
--
-- Summary:
--   1. Adds a 'verified' value to the query_status enum, enabling the
--      OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> VERIFIED -> CLOSED
--      resolution flow (Phase 2 "Role-Based Orders & Query Operations UI").
--      A failed verification returns a query to IN_PROGRESS.
--   2. Adds verified_at / verified_by columns to public.customer_queries so the
--      verification actor and timestamp are permanently recorded (four-eyes
--      handoff: a user cannot verify a query they resolved themselves).
--   3. Backfills nothing destructive. SAFE TO RE-RUN.
-- =============================================================================

BEGIN;

-- 1. Extend the query_status enum (Postgres 12+: ADD VALUE in a transaction).
--    Note: a fresh schema.sql already contains 'verified' in the CREATE TYPE,
--    so this is only needed for existing deployments.
DO $$ BEGIN
    ALTER TYPE query_status ADD VALUE IF NOT EXISTS 'verified';
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 2. Verification audit columns on customer_queries.
ALTER TABLE public.customer_queries
    ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE public.customer_queries
    ADD COLUMN IF NOT EXISTS verified_by UUID
        REFERENCES public.profiles(id) ON DELETE SET NULL;

-- 3. Query filtering by verification status.
CREATE INDEX IF NOT EXISTS idx_queries_verified ON public.customer_queries(verified_at)
    WHERE verified_at IS NOT NULL;

COMMIT;
