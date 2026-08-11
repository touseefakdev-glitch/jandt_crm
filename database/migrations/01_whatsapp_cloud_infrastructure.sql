-- =============================================================================
-- Migration 01: WhatsApp Cloud Infrastructure Tables
-- Adds whatsapp_connector_status, whatsapp_outbox, and whatsapp_baileys_auth
-- =============================================================================

-- Connector Health & Status Table
CREATE TABLE IF NOT EXISTS public.whatsapp_connector_status (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    connector_name VARCHAR(100) NOT NULL DEFAULT 'default_connector' UNIQUE,
    status VARCHAR(50) NOT NULL DEFAULT 'DISCONNECTED', -- CONNECTED, CONNECTING, DISCONNECTED, RECONNECTING, AUTH_REQUIRED, OFFLINE, ERROR
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

-- Outbound Message Dispatch Queue
CREATE TABLE IF NOT EXISTS public.whatsapp_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    remote_jid VARCHAR(255) NOT NULL,
    text TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, SENDING, SENT, FAILED, RETRYING
    retry_count INTEGER NOT NULL DEFAULT 0,
    max_retries INTEGER NOT NULL DEFAULT 3,
    error_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Persistent Baileys Authentication Storage (Cloud-backed)
CREATE TABLE IF NOT EXISTS public.whatsapp_baileys_auth (
    id VARCHAR(255) PRIMARY KEY,
    value JSONB NOT NULL,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.whatsapp_connector_status ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_outbox ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_baileys_auth ENABLE ROW LEVEL SECURITY;

-- Allow anonymous & authenticated access for single-tenant CRM backend operations
CREATE POLICY "Allow read access to whatsapp_connector_status" ON public.whatsapp_connector_status FOR SELECT USING (true);
CREATE POLICY "Allow write access to whatsapp_connector_status" ON public.whatsapp_connector_status FOR ALL USING (true);

CREATE POLICY "Allow read access to whatsapp_outbox" ON public.whatsapp_outbox FOR SELECT USING (true);
CREATE POLICY "Allow write access to whatsapp_outbox" ON public.whatsapp_outbox FOR ALL USING (true);

CREATE POLICY "Allow read access to whatsapp_baileys_auth" ON public.whatsapp_baileys_auth FOR SELECT USING (true);
CREATE POLICY "Allow write access to whatsapp_baileys_auth" ON public.whatsapp_baileys_auth FOR ALL USING (true);

-- Insert initial default record for connector status
INSERT INTO public.whatsapp_connector_status (connector_name, status, version)
VALUES ('default_connector', 'DISCONNECTED', '1.0.0')
ON CONFLICT (connector_name) DO NOTHING;
