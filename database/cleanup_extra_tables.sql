-- =============================================================================
-- J&T Supplies CRM — Clean up extra / legacy Supabase tables
--
-- SAFE TO RE-RUN. Drops only tables the application no longer uses:
--   * WhatsApp / Baileys modules (removed from the app)
--   * Legacy order intake / drafts / reminders (replaced by the daily
--     operations workflow)
--   * Any leftover rows in the app-model tables from removed experimental
--     modules.
--
-- Any OTHER tables reported by report_extra_tables.sql must be reviewed and,
-- if confirmed unnecessary, appended to the explicit DROP list below — this
-- script never deletes tables it does not know about.
--
-- Run in the Supabase Dashboard SQL Editor after report_extra_tables.sql.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1. Legacy WhatsApp / Baileys module
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.whatsapp_baileys_auth CASCADE;
DROP TABLE IF EXISTS public.whatsapp_connector_status CASCADE;
DROP TABLE IF EXISTS public.whatsapp_outbox CASCADE;
DROP TABLE IF EXISTS public.whatsapp_messages CASCADE;
DROP TABLE IF EXISTS public.whatsapp_conversations CASCADE;
DROP TABLE IF EXISTS public.whatsapp_contacts CASCADE;

-- ---------------------------------------------------------------------------
-- 2. Legacy order intake / drafts / reminders (pre-daily-operations)
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.order_processing_errors CASCADE;
DROP TABLE IF EXISTS public.order_reminders CASCADE;
DROP TABLE IF EXISTS public.order_request_config CASCADE;
DROP TABLE IF EXISTS public.order_intake_events CASCADE;
DROP TABLE IF EXISTS public.order_drafts CASCADE;
DROP TABLE IF EXISTS public.order_draft_items CASCADE;
DROP TABLE IF EXISTS public.route_destinations CASCADE;
DROP TABLE IF EXISTS public.agent_attention_alerts CASCADE;
DROP TABLE IF EXISTS public.customer_product_aliases CASCADE;
DROP TABLE IF EXISTS public.product_aliases CASCADE;

-- ---------------------------------------------------------------------------
-- 3. Confirmed-extra tables reported by report_extra_tables.sql
--    `messages` was a leftover from a removed experimental module — unused by
--    the current application (verified via codebase search).
-- ---------------------------------------------------------------------------
DROP TABLE IF EXISTS public.messages CASCADE;

-- ---------------------------------------------------------------------------
-- 4. Example: append any additional confirmed-extra tables here:
-- ---------------------------------------------------------------------------
-- DROP TABLE IF EXISTS public.<table_name> CASCADE;

COMMIT;
