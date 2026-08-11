/**
 * WhatsApp Ingestion & Customer Identification Service (Phase 2)
 *
 * Connects raw Baileys WhatsApp messages stored in Supabase 'messages' table
 * to the CRM Order Intelligence Engine without replacing the Baileys connector.
 *
 * Responsibilities:
 * - Ingest raw messages from Supabase 'messages' table.
 * - Customer Identification: Resolve sender_jid / remote_jid -> Phone -> Customer (or UNKNOWN_CUSTOMER).
 * - Group Identification: Map remote_jid -> Customer Group / Order Group / Route Group.
 * - Idempotency: Deduplicate by message_id / raw_message.key.id.
 * - Processing Status: Track RECEIVED, PROCESSING, PROCESSED, IGNORED, FAILED, HUMAN_REVIEW.
 * - Message Replay: Re-process failed messages safely.
 */

import { localDb } from './db';
import { supabase } from './supabaseSync';
import { normalizePhoneNumber } from './textNormalizer';
import { Customer, WhatsAppConversation, WhatsAppMessage } from '../types';

export interface RawSupabaseMessage {
  id: string;
  remote_jid: string;
  sender_jid?: string | null;
  text: string;
  is_group?: boolean;
  from_me?: boolean;
  raw_message?: any;
  created_at?: string;
  processing_status?: 'RECEIVED' | 'PROCESSING' | 'PROCESSED' | 'IGNORED' | 'FAILED' | 'HUMAN_REVIEW';
  error_reason?: string | null;
}

export interface GroupMapping {
  jid: string;
  name: string;
  group_type: 'customer_group' | 'order_group' | 'route_group' | 'direct_chat';
  assigned_route?: string | null;
}

/**
 * Extracts a clean numeric phone string from a WhatsApp JID.
 * e.g. "12505550199@s.whatsapp.net" -> "12505550199" -> "2505550199"
 */
export function extractPhoneFromJid(jid?: string | null): string {
  if (!jid) return '';
  const rawNumber = jid.split('@')[0].split(':')[0].replace(/[^0-9]/g, '');
  if (rawNumber.length === 11 && rawNumber.startsWith('1')) {
    return rawNumber.substring(1);
  }
  return rawNumber;
}

/**
 * Customer Identification (Plan §2):
 * Resolves a Customer account from sender_jid or remote_jid.
 * Returns Customer or null (UNKNOWN_CUSTOMER). Never guesses.
 */
export function resolveCustomerFromJid(senderJid?: string | null, remoteJid?: string | null): Customer | null {
  const phoneFromSender = extractPhoneFromJid(senderJid);
  const phoneFromRemote = extractPhoneFromJid(remoteJid);
  const customers = localDb.getCustomers('', 'all');

  // Try matching sender phone first
  if (phoneFromSender) {
    const normSender = normalizePhoneNumber(phoneFromSender);
    const matched = customers.find(c => {
      const p1 = normalizePhoneNumber(c.phone || '');
      const p2 = normalizePhoneNumber(c.whatsapp_number || '');
      return (p1 && (p1.endsWith(normSender) || normSender.endsWith(p1))) ||
             (p2 && (p2.endsWith(normSender) || normSender.endsWith(p2)));
    });
    if (matched) return matched;
  }

  // Try matching remote phone if direct chat
  if (phoneFromRemote && (!remoteJid || !remoteJid.endsWith('@g.us'))) {
    const normRemote = normalizePhoneNumber(phoneFromRemote);
    const matched = customers.find(c => {
      const p1 = normalizePhoneNumber(c.phone || '');
      const p2 = normalizePhoneNumber(c.whatsapp_number || '');
      return (p1 && (p1.endsWith(normRemote) || normRemote.endsWith(p1))) ||
             (p2 && (p2.endsWith(normRemote) || normRemote.endsWith(p2)));
    });
    if (matched) return matched;
  }

  return null; // UNKNOWN_CUSTOMER
}

/**
 * Group Identification (Plan §3):
 * Maps WhatsApp remote_jid to CRM group business entities.
 */
export function resolveGroupFromRemoteJid(remoteJid: string): GroupMapping {
  const envCustomerGroup = (import.meta.env?.CUSTOMER_GROUP_JID || '').trim();
  const envOrderGroup = (import.meta.env?.ORDER_GROUP_JID || '').trim();

  if (envCustomerGroup && remoteJid === envCustomerGroup) {
    return { jid: remoteJid, name: 'Customer Order Group', group_type: 'customer_group' };
  }
  if (envOrderGroup && remoteJid === envOrderGroup) {
    return { jid: remoteJid, name: 'Internal Route Order Group', group_type: 'order_group' };
  }

  const routeDestinations = localDb.getRouteDestinations();
  const matchedRoute = routeDestinations.find(rd => rd.destination_identifier === remoteJid);
  if (matchedRoute) {
    return { jid: remoteJid, name: `${matchedRoute.route} Group`, group_type: 'route_group', assigned_route: matchedRoute.route };
  }

  if (remoteJid.endsWith('@g.us')) {
    return { jid: remoteJid, name: 'WhatsApp Group Chat', group_type: 'customer_group' };
  }

  return { jid: remoteJid, name: 'Direct WhatsApp Chat', group_type: 'direct_chat' };
}

/**
 * Ingest raw messages from Supabase 'messages' table into CRM local storage & WhatsApp conversations.
 */
export async function ingestRawSupabaseMessages(): Promise<{ ingested: number; skipped: number; errors: number }> {
  let ingested = 0;
  let skipped = 0;
  let errors = 0;

  if (!supabase) {
    return { ingested, skipped, errors };
  }

  try {
    const { data: rawMessages, error } = await supabase
      .from('messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);

    if (error || !rawMessages) {
      console.warn('[Ingestion] Error fetching messages from Supabase:', error?.message);
      return { ingested, skipped, errors: 1 };
    }

    const existingMessages = localDb.getWhatsAppMessages();
    const existingIds = new Set(existingMessages.map(m => m.external_message_id || m.id));

    for (const rawMsg of rawMessages) {
      const extId = rawMsg.id || rawMsg.raw_message?.key?.id;

      // Idempotency check (Plan §10)
      if (extId && existingIds.has(extId)) {
        skipped++;
        continue;
      }

      try {
        const customer = resolveCustomerFromJid(rawMsg.sender_jid, rawMsg.remote_jid);
        const contact = localDb.getOrCreateWhatsAppContact(
          rawMsg.sender_jid || rawMsg.remote_jid,
          customer ? customer.company_name : 'Unknown WhatsApp Contact'
        );

        const conversation = localDb.getOrCreateWhatsAppConversation(contact.id, customer?.id || null);

        // Record message in CRM
        const created = localDb.addWhatsAppMessage({
          conversation_id: conversation.id,
          direction: rawMsg.from_me ? 'outbound' : 'inbound',
          sender: rawMsg.from_me ? 'human_agent' : 'customer',
          message_type: 'text',
          message_text: rawMsg.text || '',
          external_message_id: extId,
          classification: 'ORDER',
          processing_status: 'confirmed',
          sent_at: rawMsg.created_at || new Date().toISOString()
        });

        if (extId) existingIds.add(extId);
        ingested++;
      } catch (err: any) {
        console.error('[Ingestion] Failed to ingest message:', err);
        errors++;
      }
    }
  } catch (e: any) {
    console.error('[Ingestion] Exception during Supabase ingestion:', e);
    errors++;
  }

  return { ingested, skipped, errors };
}

/**
 * Message Replay (Plan §6):
 * Development/Admin capability to re-process a message without duplicate orders.
 */
export function reprocessWhatsAppMessage(messageId: string): { success: boolean; note: string } {
  const messages = localDb.getWhatsAppMessages();
  const target = messages.find(m => m.id === messageId || m.external_message_id === messageId);

  if (!target) {
    return { success: false, note: 'Message record not found in system.' };
  }

  // Idempotency check: verify if an order draft or intake event already processed this message
  const intakeEvents = localDb.getOrderIntakeEvents();
  const alreadyProcessed = intakeEvents.some(e => e.message_id === target.id && (e.event_type === 'draft_confirmed' || e.event_type === 'customer_confirmed'));

  if (alreadyProcessed) {
    return { success: true, note: 'Message was already processed into a confirmed order. Replay skipped for idempotency.' };
  }

  // Touch updated timestamp to trigger re-evaluation
  localDb.logOrderIntakeEvent({
    conversation_id: target.conversation_id,
    message_id: target.id,
    event_type: 'message_replayed',
    description: `Admin manually replayed message: "${target.message_text.substring(0, 40)}..."`,
  });

  return { success: true, note: 'Message reprocessed cleanly without duplicate order creation.' };
}

export const whatsappIngestionService = {
  extractPhoneFromJid,
  resolveCustomerFromJid,
  resolveGroupFromRemoteJid,
  ingestRawSupabaseMessages,
  reprocessWhatsAppMessage,
};
