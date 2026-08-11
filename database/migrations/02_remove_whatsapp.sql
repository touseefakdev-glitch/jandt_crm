-- =============================================================================
-- Migration 02: Remove WhatsApp Module
-- =============================================================================
-- Destructive change: drops all WhatsApp-specific tables, indexes, policies,
-- enums, and related data. This CANNOT be undone.
--
-- DECISION: The WhatsApp module (Baileys connector, message ingestion,
-- order-draft pipeline, daily order request automation, monitoring) has been
-- removed from the CRM. Customers are NOT affected: the `customers.whatsapp_number`
-- column is preserved as contact data and the CRM's own tables (teams, profiles,
-- customers, products, orders, queries, shifts, handovers, audit_logs, etc.)
-- are untouched.
--
-- Run this ONLY after deploying the WhatsApp-free app build.
-- =============================================================================

BEGIN;

-- --- Drop WhatsApp Cloud Infrastructure tables (connector runtime) -----------
DROP TABLE IF EXISTS public.whatsapp_baileys_auth CASCADE;
DROP TABLE IF EXISTS public.whatsapp_outbox CASCADE;
DROP TABLE IF EXISTS public.whatsapp_connector_status CASCADE;

-- --- Drop WhatsApp Order Intelligence tables ---------------------------------
DROP TABLE IF EXISTS public.order_processing_errors CASCADE;
DROP TABLE IF EXISTS public.order_reminders CASCADE;
DROP TABLE IF EXISTS public.order_request_config CASCADE;
DROP TABLE IF EXISTS public.order_intake_events CASCADE;
DROP TABLE IF EXISTS public.agent_attention_alerts CASCADE;
DROP TABLE IF EXISTS public.route_destinations CASCADE;
DROP TABLE IF EXISTS public.customer_product_aliases CASCADE;
DROP TABLE IF EXISTS public.product_aliases CASCADE;
DROP TABLE IF EXISTS public.order_draft_items CASCADE;
DROP TABLE IF EXISTS public.order_drafts CASCADE;
DROP TABLE IF EXISTS public.whatsapp_messages CASCADE;
DROP TABLE IF EXISTS public.whatsapp_conversations CASCADE;
DROP TABLE IF EXISTS public.whatsapp_contacts CASCADE;

-- --- Drop WhatsApp-specific enums --------------------------------------------
DROP TYPE IF EXISTS public.bot_status CASCADE;
DROP TYPE IF EXISTS public.alert_status CASCADE;
DROP TYPE IF EXISTS public.attention_priority CASCADE;
DROP TYPE IF EXISTS public.match_method CASCADE;
DROP TYPE IF EXISTS public.order_draft_status CASCADE;
DROP TYPE IF EXISTS public.message_classification CASCADE;

COMMIT;
