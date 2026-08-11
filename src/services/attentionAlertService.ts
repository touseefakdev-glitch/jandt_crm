/**
 * Agent Attention Alert Service for the WhatsApp Order Intelligence System.
 *
 * Raises CRM alerts for messages that require human attention (plan §34–§38):
 * NON_ORDER, QUESTION, COMPLAINT, UNKNOWN and urgent messages. Alerts carry a
 * priority (normal/high/urgent) and can be acknowledged, resolved, or converted
 * into an existing Customer Query (plan §39).
 */
import { localDb } from './db';
import {
  AgentAttentionAlert,
  AttentionPriority,
  MessageClassification,
} from '../types';
import { normalizeText } from './textNormalizer';
import { notificationService } from './notificationService';

const URGENCY_KEYWORDS = ['urgent', 'asap', 'emergency', 'immediately', 'right away', 'today'];

type AlertListener = (alert: AgentAttentionAlert) => void;

const alertListeners = new Set<AlertListener>();

/** Subscribe to newly raised attention alerts (powers the in-app popup center). */
export function subscribeToAttentionAlerts(listener: AlertListener): () => void {
  alertListeners.add(listener);
  return () => {
    alertListeners.delete(listener);
  };
}

function broadcastAlert(alert: AgentAttentionAlert) {
  alertListeners.forEach((listener) => {
    try {
      listener(alert);
    } catch (err) {
      console.error('Error broadcasting attention alert to listener:', err);
    }
  });
}

/** Raises a CRM notification + Web Audio chime for the alert's priority. */
function notifyAlert(alert: AgentAttentionAlert) {
  if (alert.priority === 'urgent' || alert.priority === 'high') {
    playAlertSound();
  }
  const customer = alert.customer_id ? localDb.getCustomerById(alert.customer_id) : null;
  notificationService.notifyWhatsAppAttentionRequired({
    alertId: alert.id,
    conversationId: alert.conversation_id,
    customerName: customer?.company_name || 'Unknown Customer',
    messageText: alert.message_text,
    classification: alert.classification || 'UNKNOWN',
    priority: alert.priority,
    linkPath: alert.conversation_id
      ? `/whatsapp-conversations?conversation=${encodeURIComponent(alert.conversation_id)}`
      : '/whatsapp-conversations',
  });
}

/** Classifies a text's attention priority using urgency keywords. */
export function assessPriority(rawText: string, base: AttentionPriority = 'normal'): AttentionPriority {
  const text = normalizeText(rawText);
  const hasUrgency = URGENCY_KEYWORDS.some(k => text.includes(k));
  if (hasUrgency) return 'urgent';
  return base;
}

/** Safely plays an alert chime using Web Audio API respecting browser autoplay restrictions. */
export function playAlertSound() {
  if (typeof window === 'undefined') return;
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime); // A5 note
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.25);
    gain.gain.setValueAtTime(0.15, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.25);
  } catch (_) {}
}

/** Creates an attention alert for a message, deduplicating identical open alerts. */
export function raiseAttentionAlert(input: {
  customerId?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  classification?: MessageClassification | null;
  messageText: string;
  priority?: AttentionPriority;
  suppressNotifications?: boolean;
}): AgentAttentionAlert {
  const existing = localDb.getAgentAttentionAlerts({ status: 'new', conversationId: input.conversationId || undefined });
  const dup = existing.find(a => a.message_text === input.messageText);
  if (dup) return dup;

  const priority = input.priority ?? assessPriority(input.messageText);

  const alert = localDb.createAgentAttentionAlert({
    customer_id: input.customerId ?? null,
    conversation_id: input.conversationId ?? null,
    message_id: input.messageId ?? null,
    classification: input.classification ?? null,
    message_text: input.messageText,
    priority,
  });

  if (!input.suppressNotifications) {
    notifyAlert(alert);
  }
  broadcastAlert(alert);
  return alert;
}

/** Summary counts for the alert center dashboard (plan §38). */
export function getAlertSummary() {
  return localDb.getUnresolvedAlertCounts();
}

/** Lists open alerts, newest first, optionally filtered. */
export function getOpenAlerts(): AgentAttentionAlert[] {
  return localDb.getAgentAttentionAlerts({ status: 'new' });
}

export function acknowledgeAlert(id: string, userId: string): AgentAttentionAlert | null {
  return localDb.acknowledgeAgentAttentionAlert(id, userId);
}

export function resolveAlert(id: string, userId: string, resolution: string): AgentAttentionAlert | null {
  return localDb.resolveAgentAttentionAlert(id, userId, resolution);
}

/** Converts an alert into an existing Customer Query (plan §39). */
export function convertAlertToQuery(
  alert: AgentAttentionAlert,
  userId: string,
  subject?: string
): { alert: AgentAttentionAlert | null; queryId: string | null } {
  if (!alert.customer_id) {
    return { alert: null, queryId: null };
  }
  const customer = localDb.getCustomerById(alert.customer_id);
  const query = localDb.createQuery(
    {
      customer_id: alert.customer_id,
      subject: subject || `WhatsApp Attention — ${customer?.company_name || 'Unknown Customer'}`,
      description: alert.message_text,
      priority: alert.priority === 'urgent' ? 'urgent' : alert.priority === 'high' ? 'high' : 'medium',
    },
    userId
  );
  const updated = localDb.linkAlertToQuery(alert.id, query.id);
  if (query.priority === 'urgent') {
    notificationService.notifyUrgentQueryCreated({
      queryNumber: query.query_number,
      queryId: query.id,
      customerName: customer?.company_name || 'Unknown Customer',
      subject: query.subject,
    });
  }
  return { alert: updated, queryId: query.id };
}

export const attentionAlertService = {
  raiseAttentionAlert,
  assessPriority,
  getAlertSummary,
  getOpenAlerts,
  acknowledgeAlert,
  resolveAlert,
  convertAlertToQuery,
  playAlertSound,
  subscribeToAttentionAlerts,
};
