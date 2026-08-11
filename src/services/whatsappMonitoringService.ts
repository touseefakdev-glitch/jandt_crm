/**
 * WhatsApp Ordering Monitoring Service (Phase 8)
 *
 * Produces the 7 core KPIs for the WhatsApp ordering production dashboard:
 *   1. Messages Today
 *   2. Orders Detected
 *   3. Orders Confirmed
 *   4. Needs Clarification
 *   5. Human Reviews
 *   6. Failed Messages
 *   7. Failed Sends
 *
 * plus failed reminders, open processing errors, per-classification breakdown,
 * recent intake activity and the raw error/reminder lists used to drill down.
 */
import { localDb } from './db';
import {
  WhatsAppMonitoringStats,
  MessageClassification,
  ProcessingErrorRecord,
  OrderRequestReminder,
} from '../types';

const CLASSIFICATION_KEYS: MessageClassification[] = [
  'ORDER', 'ORDER_CORRECTION', 'ORDER_CONFIRMATION', 'NON_ORDER',
  'QUESTION', 'COMPLAINT', 'GREETING', 'UNKNOWN',
];

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export function getWhatsAppMonitoringStats(): WhatsAppMonitoringStats {
  const dateKey = new Date().toISOString().slice(0, 10);
  const todayStart = startOfToday();

  const messages = localDb.getWhatsAppMessages();
  const drafts = localDb.getOrderDrafts();
  const errors = localDb.getOrderProcessingErrors();
  const events = localDb.getOrderIntakeEvents();
  const reminders = localDb.getOrderRequestReminders();

  const messagesToday = messages.filter(m => (m.created_at || '') >= todayStart);
  const inboundToday = messagesToday.filter(m => m.direction === 'inbound');
  const outboundToday = messagesToday.filter(m => m.direction === 'outbound');

  // Orders Detected: draft created today with an internal reference (i.e. parsed into a real order).
  const ordersDetected = drafts.filter(d => d.internal_reference && d.created_at >= todayStart).length;

  // Orders Confirmed: drafts confirmed (or forwarded) at any point, counting today's confirmations.
  const ordersConfirmed = drafts.filter(d =>
    (d.status === 'CONFIRMED' || d.status === 'FORWARDED') && (d.confirmed_at || '') >= todayStart
  ).length;

  // Needs Clarification: drafts still awaiting clarification / confirmation today.
  const needsClarification = drafts.filter(d => d.created_at >= todayStart && (
    d.status === 'NEEDS_CLARIFICATION' || d.status === 'AWAITING_CONFIRMATION'
  )).length;

  // Human Reviews: drafts escalated to human review + messages awaiting human attention.
  const humanReviews = drafts.filter(d => d.status === 'HUMAN_REVIEW' && d.created_at >= todayStart).length
    + messages.filter(m => m.processing_status === 'escalated' && (m.created_at || '') >= todayStart).length;

  // Failed Messages: messages stuck in an error state.
  const failedMessages = messages.filter(m => m.processing_status === 'error').length;

  // Failed Sends: outbound messages that failed, drafts that errored while forwarding.
  const failedSends = messages.filter(m => m.direction === 'outbound' && m.processing_status === 'error').length
    + events.filter(e => e.event_type === 'processing_error' && (e.created_at || '') >= todayStart).length;

  const failedReminders = reminders.filter(r => r.status === 'failed').length;

  const byClassification = {} as Partial<Record<MessageClassification, number>>;
  CLASSIFICATION_KEYS.forEach(k => { byClassification[k] = 0; });
  messagesToday.forEach(m => {
    if (m.classification) byClassification[m.classification] = (byClassification[m.classification] || 0) + 1;
  });

  const openErrors: ProcessingErrorRecord[] = errors.filter(e => e.status === 'open' || e.status === 'retrying');
  const failedRemindersList: OrderRequestReminder[] = reminders.filter(r => r.status === 'failed');

  return {
    dateKey,
    messagesToday: messagesToday.length,
    inboundToday: inboundToday.length,
    outboundToday: outboundToday.length,
    ordersDetected,
    ordersConfirmed,
    needsClarification,
    humanReviews,
    failedMessages,
    failedSends,
    failedReminders,
    openProcessingErrors: openErrors.length,
    byClassification,
    recentActivity: [...events].slice(0, 20),
    openErrors,
    failedRemindersList,
  };
}

export const whatsappMonitoringService = {
  getWhatsAppMonitoringStats,
};
