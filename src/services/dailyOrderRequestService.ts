/**
 * Phase 7 — Automated Daily Order Request Browser Service
 *
 * Orchestrates the daily order request run from the admin UI (manual "Run Now"
 * and manual retry of failed reminders). The scheduled trigger is handled by
 * the Vercel cron serverless function (api/daily-order-request.ts) which shares
 * the pure helpers from dailyOrderRequestCore.
 *
 * Dispatch: outbound messages are written to the Supabase 'messages' table so
 * the external Baileys connector picks them up and sends them to customers.
 */

import { localDb } from './db';
import { supabase } from './supabaseSync';
import { messagingService } from './messagingService';
import {
  buildJidFromPhone,
  filterEligibleCustomers,
  formatDeliveryDateLabel,
  getRoutesForDay,
  getTomorrowInTimezone,
  renderOrderRequestTemplate,
} from './dailyOrderRequestCore';
import { OrderRequestReminder, OrderRequestReminderStatus } from '../types';

export interface OrderRequestRunResult {
  deliveryDate: string;
  deliveryDateLabel: string;
  routes: string[];
  eligibleCustomers: number;
  sent: number;
  skipped: number;
  failed: number;
  reminders: Array<{ customerName: string; route: string; status: OrderRequestReminderStatus; messageId?: string | null; error?: string | null }>;
}

const MAX_RETRY_ATTEMPTS = 3;

/**
 * Runs the daily order request for tomorrow's delivery (manual trigger).
 * Deduplicates against reminders already marked 'sent' for that delivery date.
 */
export async function runDailyOrderRequest(currentUserId: string, referenceDate: Date = new Date()): Promise<OrderRequestRunResult> {
  const config = localDb.getOrderRequestConfig();
  const timezone = config.timezone || 'America/Vancouver';

  const tomorrow = getTomorrowInTimezone(timezone, referenceDate);
  const deliveryDate = tomorrow.dateKey;
  const deliveryDateLabel = formatDeliveryDateLabel(deliveryDate);

  const schedules = localDb.getRouteSchedules();
  const routes = getRoutesForDay(schedules, tomorrow.dayName);

  const allCustomers = localDb.getCustomers('', 'all');
  const eligible = filterEligibleCustomers(allCustomers, routes);

  // Existing reminders for this delivery date — dedupe by customer_id
  const existing = localDb.getOrderRequestReminders({ deliveryDate });
  const sentCustomerIds = new Set(
    existing.filter(r => r.status === 'sent').map(r => r.customer_id)
  );

  const result: OrderRequestRunResult = {
    deliveryDate,
    deliveryDateLabel,
    routes,
    eligibleCustomers: eligible.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    reminders: [],
  };

  for (const customer of eligible) {
    if (sentCustomerIds.has(customer.id)) {
      result.skipped++;
      continue;
    }

    const route = (customer.route || '').trim();
    const messageText = renderOrderRequestTemplate(config.template, {
      customerName: customer.company_name,
      route,
      deliveryDate: deliveryDateLabel,
    });

    const dispatch = await dispatchOrderRequest({
      customerId: customer.id,
      customerName: customer.company_name,
      whatsappNumber: customer.whatsapp_number,
      route,
      deliveryDate,
      messageText,
      currentUserId,
    });

    if (dispatch.success) {
      result.sent++;
      result.reminders.push({ customerName: customer.company_name, route, status: 'sent', messageId: dispatch.messageId });
    } else {
      result.failed++;
      result.reminders.push({ customerName: customer.company_name, route, status: 'failed', error: dispatch.error });
    }
  }

  return result;
}

/**
 * Re-dispatches a single failed reminder. Keeps audit trail + retry count.
 */
export async function retryOrderRequestReminder(reminder: OrderRequestReminder, currentUserId: string): Promise<{ success: boolean; error?: string }> {
  const nextAttempt = (reminder.attempt_count || 0) + 1;
  const route = reminder.route || '';
  const messageText = renderOrderRequestTemplate(
    localDb.getOrderRequestConfig().template,
    {
      customerName: reminder.customer_name,
      route,
      deliveryDate: formatDeliveryDateLabel(reminder.delivery_date),
    }
  );

  const customer = localDb.getCustomers('', 'all').find(c => c.id === reminder.customer_id);

  const dispatch = await dispatchOrderRequest({
    customerId: reminder.customer_id,
    customerName: reminder.customer_name,
    whatsappNumber: customer?.whatsapp_number,
    route,
    deliveryDate: reminder.delivery_date,
    messageText,
    currentUserId,
  });

  localDb.retryOrderRequestReminder(reminder.id, currentUserId);

  if (!dispatch.success) {
    const reason = dispatch.error || 'retry_failed';
    localDb.upsertOrderRequestReminder({
      customer_id: reminder.customer_id,
      customer_name: reminder.customer_name,
      route,
      delivery_date: reminder.delivery_date,
      status: 'failed',
      sent_at: null,
      message_id: null,
      message_text: messageText,
      error_reason: reason,
      attempt_count: Math.min(nextAttempt, MAX_RETRY_ATTEMPTS),
    }, currentUserId);
    return { success: false, error: reason };
  }

  localDb.upsertOrderRequestReminder({
    customer_id: reminder.customer_id,
    customer_name: reminder.customer_name,
    route,
    delivery_date: reminder.delivery_date,
    status: 'sent',
    sent_at: new Date().toISOString(),
    message_id: dispatch.messageId,
    message_text: messageText,
    error_reason: null,
    attempt_count: Math.min(nextAttempt, MAX_RETRY_ATTEMPTS),
  }, currentUserId);

  return { success: true };
}

async function dispatchOrderRequest(params: {
  customerId: string;
  customerName: string;
  whatsappNumber?: string | null;
  route: string;
  deliveryDate: string;
  messageText: string;
  currentUserId: string;
}): Promise<{ success: boolean; messageId?: string | null; error?: string }> {
  const jid = buildJidFromPhone(params.whatsappNumber);
  if (!jid) {
    const reason = 'customer_has_no_whatsapp_number';
    localDb.upsertOrderRequestReminder({
      customer_id: params.customerId,
      customer_name: params.customerName,
      route: params.route,
      delivery_date: params.deliveryDate,
      status: 'failed',
      sent_at: null,
      message_id: null,
      message_text: params.messageText,
      error_reason: reason,
      attempt_count: 1,
    }, params.currentUserId);
    return { success: false, error: reason };
  }

  let messageId: string | null = null;
  let dispatchError: string | null = null;

  // Primary path: write to Supabase 'messages' table for Baileys connector pickup
  if (supabase) {
    try {
      const { data, error } = await supabase.from('messages').insert({
        remote_jid: jid,
        text: params.messageText,
        is_group: false,
        from_me: true,
        processing_status: 'PROCESSED',
      }).select('id').single();

      if (error) {
        dispatchError = error.message;
      } else {
        messageId = data?.id || null;
      }
    } catch (e: any) {
      dispatchError = e?.message || 'supabase_insert_failed';
    }
  }

  // Secondary path: provider stub for local/dev environments
  if (!supabase || dispatchError) {
    const stub = await messagingService.sendMessage({
      toWhatsAppNumber: params.whatsappNumber || jid,
      messageText: params.messageText,
      templateName: 'daily_order_request',
      parameters: { customer_name: params.customerName, route: params.route },
    });
    if (stub.success) {
      messageId = messageId || stub.messageId || null;
    } else {
      dispatchError = dispatchError || stub.error || 'dispatch_failed';
    }
  }

  if (dispatchError) {
    localDb.upsertOrderRequestReminder({
      customer_id: params.customerId,
      customer_name: params.customerName,
      route: params.route,
      delivery_date: params.deliveryDate,
      status: 'failed',
      sent_at: null,
      message_id: null,
      message_text: params.messageText,
      error_reason: dispatchError,
      attempt_count: 1,
    }, params.currentUserId);
    return { success: false, error: dispatchError };
  }

  localDb.upsertOrderRequestReminder({
    customer_id: params.customerId,
    customer_name: params.customerName,
    route: params.route,
    delivery_date: params.deliveryDate,
    status: 'sent',
    sent_at: new Date().toISOString(),
    message_id: messageId,
    message_text: params.messageText,
    error_reason: null,
    attempt_count: 1,
  }, params.currentUserId);

  return { success: true, messageId };
}

export const dailyOrderRequestService = {
  runDailyOrderRequest,
  retryOrderRequestReminder,
};
