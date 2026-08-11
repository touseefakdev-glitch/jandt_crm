import { supabase } from './supabaseSync';

export interface WhatsAppConnectorStatus {
  id: string;
  connector_name: string;
  status: 'CONNECTED' | 'CONNECTING' | 'DISCONNECTED' | 'RECONNECTING' | 'AUTH_REQUIRED' | 'OFFLINE' | 'ERROR';
  last_heartbeat: string;
  connected_at: string | null;
  last_message_received_at: string | null;
  last_message_sent_at: string | null;
  messages_received_today: number;
  messages_sent_today: number;
  qr_code_data: string | null;
  error_message: string | null;
  version: string;
  updated_at: string;
  is_offline: boolean;
  seconds_since_heartbeat: number;
}

export interface OutboxSummary {
  pending: number;
  sending: number;
  sent: number;
  failed: number;
}

export const whatsappConnectorService = {
  /**
   * Fetches the current connector status from Supabase.
   * Derives 'OFFLINE' if heartbeat is older than 45 seconds.
   */
  async getConnectorStatus(): Promise<WhatsAppConnectorStatus | null> {
    if (!supabase) return null;
    try {
      const { data, error } = await supabase
        .from('whatsapp_connector_status')
        .select('*')
        .eq('connector_name', 'default_connector')
        .maybeSingle();

      if (error || !data) {
        return null;
      }

      const now = new Date().getTime();
      const lastHeartbeatTime = new Date(data.last_heartbeat || data.updated_at).getTime();
      const secondsSinceHeartbeat = Math.floor((now - lastHeartbeatTime) / 1000);
      const isOffline = secondsSinceHeartbeat > 45;

      let effectiveStatus = data.status;
      if (isOffline && data.status !== 'AUTH_REQUIRED') {
        effectiveStatus = 'OFFLINE';
      }

      return {
        ...data,
        status: effectiveStatus,
        is_offline: isOffline,
        seconds_since_heartbeat: secondsSinceHeartbeat,
      };
    } catch (err) {
      console.error('[whatsappConnectorService] Error fetching status:', err);
      return null;
    }
  },

  /**
   * Enqueues an outbound message to the database outbox queue.
   */
  async enqueueOutboundMessage(remoteJid: string, text: string): Promise<{ success: boolean; id?: string; error?: string }> {
    if (!supabase) return { success: false, error: 'Supabase client not initialized.' };
    try {
      const { data, error } = await supabase
        .from('whatsapp_outbox')
        .insert({
          remote_jid: remoteJid,
          text: text,
          status: 'PENDING',
          retry_count: 0,
        })
        .select('id')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, id: data.id };
    } catch (err: any) {
      return { success: false, error: err?.message || 'Failed to queue message.' };
    }
  },

  /**
   * Fetches outbox queue statistics.
   */
  async getOutboxSummary(): Promise<OutboxSummary> {
    if (!supabase) return { pending: 0, sending: 0, sent: 0, failed: 0 };
    try {
      const { data, error } = await supabase
        .from('whatsapp_outbox')
        .select('status');

      if (error || !data) {
        return { pending: 0, sending: 0, sent: 0, failed: 0 };
      }

      const summary: OutboxSummary = { pending: 0, sending: 0, sent: 0, failed: 0 };
      data.forEach((item: { status: string }) => {
        if (item.status === 'PENDING') summary.pending++;
        else if (item.status === 'SENDING') summary.sending++;
        else if (item.status === 'SENT') summary.sent++;
        else if (item.status === 'FAILED') summary.failed++;
      });

      return summary;
    } catch (e) {
      return { pending: 0, sending: 0, sent: 0, failed: 0 };
    }
  },

  /**
   * Triggers a reconnect by updating status in database to RECONNECTING.
   */
  async requestReconnect(): Promise<boolean> {
    if (!supabase) return false;
    try {
      const { error } = await supabase
        .from('whatsapp_connector_status')
        .update({
          status: 'RECONNECTING',
          error_message: 'Manual reconnect requested from Admin UI.',
          updated_at: new Date().toISOString(),
        })
        .eq('connector_name', 'default_connector');

      return !error;
    } catch (e) {
      return false;
    }
  },

  /**
   * Unlinks the session and requests QR code re-pairing.
   */
  async unlinkSession(): Promise<boolean> {
    if (!supabase) return false;
    try {
      // Clear Baileys auth keys
      await supabase.from('whatsapp_baileys_auth').delete().neq('id', 'keep_table');

      // Update status to AUTH_REQUIRED
      const { error } = await supabase
        .from('whatsapp_connector_status')
        .update({
          status: 'AUTH_REQUIRED',
          qr_code_data: null,
          error_message: 'Session cleared by Admin. Pair device using QR code.',
          updated_at: new Date().toISOString(),
        })
        .eq('connector_name', 'default_connector');

      return !error;
    } catch (e) {
      return false;
    }
  },
};
