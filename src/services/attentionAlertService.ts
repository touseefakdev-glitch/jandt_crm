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

const URGENCY_KEYWORDS = ['urgent', 'asap', 'emergency', 'immediately', 'right away', 'today'];

/** Classifies a text's attention priority using urgency keywords. */
export function assessPriority(rawText: string, base: AttentionPriority = 'normal'): AttentionPriority {
  const text = normalizeText(rawText);
  const hasUrgency = URGENCY_KEYWORDS.some(k => text.includes(k));
  if (hasUrgency) return 'urgent';
  return base;
}

/** Creates an attention alert for a message, deduplicating identical open alerts. */
export function raiseAttentionAlert(input: {
  customerId?: string | null;
  conversationId?: string | null;
  messageId?: string | null;
  classification?: MessageClassification | null;
  messageText: string;
  priority?: AttentionPriority;
}): AgentAttentionAlert {
  const existing = localDb.getAgentAttentionAlerts({ status: 'new', conversationId: input.conversationId || undefined });
  const dup = existing.find(a => a.message_text === input.messageText);
  if (dup) return dup;

  return localDb.createAgentAttentionAlert({
    customer_id: input.customerId ?? null,
    conversation_id: input.conversationId ?? null,
    message_id: input.messageId ?? null,
    classification: input.classification ?? null,
    message_text: input.messageText,
    priority: input.priority ?? assessPriority(input.messageText),
  });
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
};
