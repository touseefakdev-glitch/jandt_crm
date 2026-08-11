const { supabase } = require('./supabase');

/**
 * Outbox Queue Processor for Cloud Connector
 * Polls & processes pending outbound WhatsApp messages queued by CRM users/services.
 */
async function processOutbox(sock) {
  if (!sock) return 0;

  try {
    const { data: pendingMessages, error } = await supabase
      .from('whatsapp_outbox')
      .select('*')
      .eq('status', 'PENDING')
      .order('created_at', { ascending: true })
      .limit(10);

    if (error || !pendingMessages || pendingMessages.length === 0) {
      return 0;
    }

    let processedCount = 0;

    for (const msg of pendingMessages) {
      try {
        // Mark as SENDING
        await supabase
          .from('whatsapp_outbox')
          .update({ status: 'SENDING', updated_at: new Date().toISOString() })
          .eq('id', msg.id);

        console.log(`[Outbox] Dispatching message ${msg.id} to ${msg.remote_jid}...`);

        await sock.sendMessage(msg.remote_jid, { text: msg.text });

        // Update status to SENT
        await supabase
          .from('whatsapp_outbox')
          .update({
            status: 'SENT',
            processed_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('id', msg.id);

        // Update connector sent message metrics
        await updateSentMetric();

        processedCount++;
        console.log(`[Outbox] Successfully sent message ${msg.id}`);
      } catch (sendErr) {
        console.error(`[Outbox] Failed to send message ${msg.id}:`, sendErr.message);

        const newRetryCount = (msg.retry_count || 0) + 1;
        const maxRetries = msg.max_retries || 3;
        const finalStatus = newRetryCount >= maxRetries ? 'FAILED' : 'PENDING';

        await supabase
          .from('whatsapp_outbox')
          .update({
            status: finalStatus,
            retry_count: newRetryCount,
            error_reason: sendErr.message,
            updated_at: new Date().toISOString(),
          })
          .eq('id', msg.id);
      }
    }

    return processedCount;
  } catch (err) {
    console.error('[Outbox] Outbox queue check exception:', err.message);
    return 0;
  }
}

async function updateSentMetric() {
  try {
    const { data } = await supabase
      .from('whatsapp_connector_status')
      .select('messages_sent_today')
      .eq('connector_name', 'default_connector')
      .maybeSingle();

    const currentCount = data?.messages_sent_today || 0;

    await supabase
      .from('whatsapp_connector_status')
      .update({
        messages_sent_today: currentCount + 1,
        last_message_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('connector_name', 'default_connector');
  } catch (e) {
    console.warn('[Outbox] Metric update warning:', e.message);
  }
}

module.exports = { processOutbox };
