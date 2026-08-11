/**
 * Cloud-Hosted Persistent WhatsApp Connector Worker for JT Supplies CRM
 *
 * Platform Architecture:
 * - Runs as a 24/7 persistent Node.js worker service on cloud infrastructure (Railway / Render / Fly.io / VPS).
 * - Authenticates via Baileys WebSocket protocol using native multi-file auth state synced to Supabase DB.
 * - Updates connector status & heartbeat every 15s in Supabase (`whatsapp_connector_status`).
 * - Dispatches queued outbound messages from Supabase outbox (`whatsapp_outbox`).
 * - Ingests inbound WhatsApp messages into Supabase (`messages`) with idempotency deduplication.
 */

require('dotenv').config({ path: '../.env' });
require('dotenv').config();

const {
  default: makeWASocket,
  DisconnectReason,
  fetchLatestBaileysVersion,
  Browsers,
} = require('@whiskeysockets/baileys');
const qrcode = require('qrcode-terminal');
const pino = require('pino');
const { supabase } = require('./supabase');
const { getAuthManager } = require('./authManager');
const { processOutbox } = require('./outboxProcessor');
const { processOrderMessage } = require('./orderHandler');

const CONNECTOR_NAME = process.env.CONNECTOR_NAME || 'default_connector';
const HEARTBEAT_INTERVAL_MS = 15000;
const OUTBOX_POLL_INTERVAL_MS = 4000;
const COMMAND_POLL_INTERVAL_MS = 5000;

let socket = null;
let heartbeatTimer = null;
let outboxTimer = null;
let commandTimer = null;
let reconnectAttempts = 0;
let isConnecting = false;
let authManager = null;

/**
 * Updates connector status and heartbeat in Supabase database
 */
async function updateStatus(status, extra = {}) {
  try {
    const payload = {
      connector_name: CONNECTOR_NAME,
      status,
      last_heartbeat: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      version: '1.0.0',
      ...extra,
    };

    const { error } = await supabase
      .from('whatsapp_connector_status')
      .upsert(payload, { onConflict: 'connector_name' });

    if (error) {
      console.error('[ConnectorStatus] DB update error:', error.message);
    }
  } catch (err) {
    console.error('[ConnectorStatus] Exception during status update:', err.message);
  }
}

/**
 * Main Worker Initialization
 */
async function startWorker(forceFresh = false) {
  if (isConnecting) return;
  isConnecting = true;

  console.log(`[Worker] Starting JT Supplies Cloud WhatsApp Connector (${CONNECTOR_NAME})...`);
  await updateStatus('CONNECTING', { error_message: null });

  try {
    authManager = await getAuthManager();

    if (forceFresh) {
      console.log('[Worker] Force fresh requested. Clearing auth state...');
      await authManager.clearAuthState();
      authManager = await getAuthManager();
    }

    const { state, saveCreds, clearAuthState } = authManager;
    const { version } = await fetchLatestBaileysVersion().catch(() => ({ version: undefined }));

    if (socket) {
      try {
        socket.ev.removeAllListeners();
        socket.end(new Error('Re-initializing worker'));
      } catch (e) {}
      socket = null;
    }

    socket = makeWASocket({
      version,
      auth: state,
      browser: Browsers.macOS('Desktop'),
      logger: pino({ level: 'silent' }),
      printQRInTerminal: true,
      connectTimeoutMs: 60000,
      defaultQueryTimeoutMs: 60000,
      keepAliveIntervalMs: 25000,
      markOnlineOnConnect: true,
      syncFullHistory: false,
    });

    socket.ev.on('creds.update', async () => {
      await saveCreds();
    });

    socket.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        console.log('\n======================================================');
        console.log('📲 QR Code Generated! Scan via WhatsApp > Linked Devices:');
        console.log('======================================================\n');
        try {
          qrcode.generate(qr, { small: true });
        } catch (e) {}

        console.log('[Worker] Publishing QR pairing string to Supabase Admin Dashboard...');
        await updateStatus('AUTH_REQUIRED', {
          qr_code_data: qr,
          error_message: 'Scan QR code in CRM Admin Settings to pair WhatsApp.',
        });
      }

      if (connection === 'open') {
        reconnectAttempts = 0;
        isConnecting = false;
        console.log('✅ [Worker] WhatsApp Connection Established Successfully!');

        await saveCreds();

        await updateStatus('CONNECTED', {
          connected_at: new Date().toISOString(),
          qr_code_data: null,
          error_message: null,
        });

        startHeartbeatLoop();
        startOutboxLoop();
      }

      if (connection === 'close') {
        isConnecting = false;
        stopLoops();

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        console.warn(`[Worker] Connection closed (status: ${statusCode}). Should reconnect: ${shouldReconnect}`);

        if (shouldReconnect) {
          reconnectAttempts++;
          const delayMs = Math.min(3000 * Math.pow(1.5, reconnectAttempts), 60000);
          console.log(`[Worker] Reconnecting in ${Math.round(delayMs / 1000)}s (Attempt #${reconnectAttempts})...`);

          await updateStatus('RECONNECTING', {
            error_message: `Connection lost. Auto-reconnecting attempt #${reconnectAttempts}...`,
          });

          setTimeout(() => startWorker(false), delayMs);
        } else {
          console.error('[Worker] Device logged out or rejected. Wiping auth state and generating fresh QR...');
          await clearAuthState();
          await updateStatus('AUTH_REQUIRED', {
            qr_code_data: null,
            error_message: 'Logged out. Generating fresh QR code...',
          });
          setTimeout(() => startWorker(true), 2000);
        }
      }
    });

    // Handle inbound messages
    socket.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify') return;

      for (const msg of messages) {
        if (!msg.message || msg.key.fromMe) continue;

        const messageId = msg.key.id;
        const remoteJid = msg.key.remoteJid;
        const senderJid = msg.key.participant || remoteJid;
        const isGroup = remoteJid?.endsWith('@g.us');
        const text =
          msg.message.conversation ||
          msg.message.extendedTextMessage?.text ||
          msg.message.imageMessage?.caption ||
          '';

        if (!text && !msg.message.imageMessage) continue;

        try {
          const { data: existing } = await supabase
            .from('messages')
            .select('id')
            .eq('remote_jid', remoteJid)
            .eq('sender_jid', senderJid)
            .eq('text', text)
            .gte('created_at', new Date(Date.now() - 60000).toISOString())
            .maybeSingle();

          if (existing) {
            console.log(`[Worker] Duplicate message ${messageId} ignored.`);
            continue;
          }
        } catch (e) {}

        console.log(`[Worker] Inbound message received from ${remoteJid}: "${text.substring(0, 40)}..."`);

        try {
          const { error: insertErr } = await supabase.from('messages').insert({
            remote_jid: remoteJid,
            sender_jid: senderJid,
            text,
            is_group: isGroup,
            from_me: false,
            raw_message: msg,
            processing_status: 'RECEIVED',
          });

          if (insertErr) {
            console.error('[Worker] Error inserting message to Supabase:', insertErr.message);
          } else {
            console.log('[Worker] Message persisted to Supabase database.');
            await incrementInboundMetric();
          }
        } catch (dbErr) {
          console.error('[Worker] Supabase message insert exception:', dbErr.message);
        }

        // Process Order logic
        if (text) {
          const customerGroupJid = process.env.CUSTOMER_GROUP_JID;
          const orderGroupJid = process.env.ORDER_GROUP_JID;
          const isCustomerGroup = customerGroupJid ? remoteJid === customerGroupJid : true;

          await processOrderMessage(
            socket,
            remoteJid,
            senderJid,
            text,
            isCustomerGroup,
            orderGroupJid
          );
        }
      }
    });

  } catch (err) {
    isConnecting = false;
    console.error('[Worker] Fatal error initializing worker:', err.message);
    await updateStatus('ERROR', { error_message: err.message });
    setTimeout(() => startWorker(false), 10000);
  }
}

/**
 * Periodically sends 15-second heartbeat
 */
function startHeartbeatLoop() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  heartbeatTimer = setInterval(async () => {
    if (socket && socket.ws && socket.ws.isOpen) {
      await updateStatus('CONNECTED');
    }
  }, HEARTBEAT_INTERVAL_MS);
}

/**
 * Periodically processes outbound message queue
 */
function startOutboxLoop() {
  if (outboxTimer) clearInterval(outboxTimer);
  outboxTimer = setInterval(async () => {
    if (socket && socket.ws && socket.ws.isOpen) {
      await processOutbox(socket);
    }
  }, OUTBOX_POLL_INTERVAL_MS);
}

/**
 * Listens for Admin commands (RECONNECTING / AUTH_REQUIRED) from CRM UI continuously
 */
function startCommandLoop() {
  if (commandTimer) clearInterval(commandTimer);
  commandTimer = setInterval(async () => {
    try {
      const { data } = await supabase
        .from('whatsapp_connector_status')
        .select('status, qr_code_data')
        .eq('connector_name', CONNECTOR_NAME)
        .maybeSingle();

      if (data) {
        if (data.status === 'RECONNECTING') {
          console.log('[Worker] Admin UI requested reconnection. Restarting worker socket...');
          isConnecting = false;
          await startWorker(false);
        } else if (data.status === 'AUTH_REQUIRED' && !data.qr_code_data && !isConnecting) {
          console.log('[Worker] AUTH_REQUIRED with missing QR detected. Generating fresh QR code...');
          isConnecting = false;
          await startWorker(true);
        }
      }
    } catch (e) {}
  }, COMMAND_POLL_INTERVAL_MS);
}

function stopLoops() {
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  if (outboxTimer) clearInterval(outboxTimer);
}

async function incrementInboundMetric() {
  try {
    const { data } = await supabase
      .from('whatsapp_connector_status')
      .select('messages_received_today')
      .eq('connector_name', CONNECTOR_NAME)
      .maybeSingle();

    const currentCount = data?.messages_received_today || 0;

    await supabase
      .from('whatsapp_connector_status')
      .update({
        messages_received_today: currentCount + 1,
        last_message_received_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('connector_name', CONNECTOR_NAME);
  } catch (e) {
    console.warn('[Worker] Metric update error:', e.message);
  }
}

// Graceful process shutdown handlers
process.on('SIGINT', async () => {
  console.log('[Worker] Graceful shutdown requested (SIGINT)...');
  stopLoops();
  if (commandTimer) clearInterval(commandTimer);
  await updateStatus('DISCONNECTED', { error_message: 'Worker stopped manually.' });
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('[Worker] Container terminating (SIGTERM)...');
  stopLoops();
  if (commandTimer) clearInterval(commandTimer);
  await updateStatus('DISCONNECTED', { error_message: 'Container shut down.' });
  process.exit(0);
});

// Always run command listener loop
startCommandLoop();
startWorker(false);
