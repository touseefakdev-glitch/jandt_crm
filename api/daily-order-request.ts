/**
 * Phase 7 — Automated Daily Order Request (Vercel Cron Serverless Function)
 *
 * Triggered by Vercel Cron (every 30 minutes). Because Vercel cron runs in UTC,
 * this function computes the current time in the configured business timezone and
 * only dispatches when it matches the configured send time (default 09:00).
 *
 * Flow:
 *   1. Load automation config from Supabase (order_request_config).
 *   2. If disabled, or it is not the send time (unless ?force=1), exit.
 *   3. Compute tomorrow's delivery date in the business timezone.
 *   4. Determine tomorrow's active routes (route_schedules).
 *   5. Find eligible active customers on those routes with a WhatsApp number.
 *   6. Deduplicate against order_reminders already marked 'sent' for that date.
 *   7. Dispatch each reminder to the Supabase 'messages' table for the Baileys
 *      connector, then record the reminder (sent/failed) in order_reminders.
 *
 * Security: verifies Authorization: Bearer $CRON_SECRET when configured.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  buildJidFromPhone,
  filterEligibleCustomers,
  formatDeliveryDateLabel,
  getRoutesForDay,
  getTomorrowInTimezone,
  isSendTimeNow,
  renderOrderRequestTemplate,
} from '../src/services/dailyOrderRequestCore';

export const config = {
  runtime: 'nodejs22.x',
};

const supabaseUrl =
  process.env.VITE_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';
const supabaseKey =
  process.env.VITE_SUPABASE_ANON_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  '';

const CONFIG_ID = '00000000-0000-0000-0000-0000000000c1';

interface DispatchSummary {
  deliveryDate: string;
  deliveryDateLabel: string;
  routes: string[];
  eligible: number;
  sent: number;
  skipped: number;
  failed: number;
  reason?: string;
  reminders: Array<{ customerName: string; route: string; status: string; messageId?: string | null; error?: string | null }>;
}

export default async function handler(req: Request): Promise<Response> {
  const url = new URL(req.url);
  const force = url.searchParams.get('force') === '1';

  if (req.method !== 'GET' && req.method !== 'POST') {
    return json({ error: 'method_not_allowed' }, 405);
  }

  // Optional CRON_SECRET gate (set in Vercel env). Vercel cron sends Authorization: Bearer $CRON_SECRET.
  // Phase 8 security: compared in constant time so a timing side-channel can't
  // leak the secret. The secret never reaches the browser — it is env-only.
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret) {
    const auth = req.headers.get('authorization') || '';
    const bearer = auth.startsWith('Bearer ') ? auth.slice(7) : '';
    if (!safeEqual(bearer, cronSecret)) {
      return json({ error: 'unauthorized' }, 401);
    }
  }

  if (!supabaseUrl || !supabaseKey) {
    return json({ error: 'supabase_not_configured' }, 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const summary = await runDailyOrderRequest(supabase, force);
    return json({ ok: true, ...summary });
  } catch (err: any) {
    return json({ ok: false, error: err?.message || 'run_failed' }, 500);
  }
}

export async function runDailyOrderRequest(supabase: SupabaseClient, force = false): Promise<DispatchSummary> {
  // 1. Load config
  const { data: configRows, error: configError } = await supabase
    .from('order_request_config')
    .select('*')
    .limit(1);
  if (configError) throw new Error(`config_load_failed: ${configError.message}`);

  const config = configRows && configRows.length > 0 ? configRows[0] : null;
  const enabled = config ? config.enabled !== false : true;
  const sendTime = config?.send_time || '09:00';
  const timezone = config?.timezone || 'America/Vancouver';
  const template = config?.template || undefined;

  if (!enabled) {
    return emptySummary(timezone, undefined, 'disabled');
  }

  if (!force && !isSendTimeNow(sendTime, timezone)) {
    return emptySummary(timezone, undefined, 'not_send_time');
  }

  // 2. Tomorrow in business timezone
  const tomorrow = getTomorrowInTimezone(timezone);
  const deliveryDate = tomorrow.dateKey;
  const deliveryDateLabel = formatDeliveryDateLabel(deliveryDate);

  // 3. Tomorrow's active routes
  const { data: scheduleRows, error: scheduleError } = await supabase
    .from('route_schedules')
    .select('day_of_week, city_or_route, active');
  if (scheduleError) throw new Error(`route_schedules_load_failed: ${scheduleError.message}`);

  const routes = getRoutesForDay(scheduleRows || [], tomorrow.dayName);

  // 4. Eligible customers
  const { data: customerRows, error: customersError } = await supabase
    .from('customers')
    .select('id, company_name, route, whatsapp_number, status');
  if (customersError) throw new Error(`customers_load_failed: ${customersError.message}`);

  const eligible = filterEligibleCustomers(customerRows || [], routes);

  // 5. Already-sent reminders for this delivery date (dedupe)
  const { data: existingRows, error: existingError } = await supabase
    .from('order_reminders')
    .select('customer_id, status')
    .eq('delivery_date', deliveryDate);
  if (existingError) throw new Error(`reminders_load_failed: ${existingError.message}`);

  const sentCustomerIds = new Set(
    (existingRows || []).filter(r => r.status === 'sent').map(r => r.customer_id)
  );

  const summary: DispatchSummary = {
    deliveryDate,
    deliveryDateLabel,
    routes,
    eligible: eligible.length,
    sent: 0,
    skipped: 0,
    failed: 0,
    reminders: [],
  };

  // 6. Dispatch each reminder
  for (const customer of eligible) {
    if (sentCustomerIds.has(customer.id)) {
      summary.skipped++;
      continue;
    }

    const route = (customer.route || '').trim();
    const jid = buildJidFromPhone(customer.whatsapp_number);
    if (!jid) {
      await recordReminder(supabase, {
        customer_id: customer.id,
        customer_name: customer.company_name,
        route,
        delivery_date: deliveryDate,
        status: 'failed',
        sent_at: null,
        message_id: null,
        message_text: renderOrderRequestTemplate(template || '', {
          customerName: customer.company_name,
          route,
          deliveryDate: deliveryDateLabel,
        }),
        error_reason: 'customer_has_no_whatsapp_number',
        attempt_count: 1,
      });
      summary.failed++;
      summary.reminders.push({ customerName: customer.company_name, route, status: 'failed', error: 'customer_has_no_whatsapp_number' });
      continue;
    }

    const messageText = renderOrderRequestTemplate(template || '', {
      customerName: customer.company_name,
      route,
      deliveryDate: deliveryDateLabel,
    });

    try {
      const { data, error } = await supabase.from('messages').insert({
        remote_jid: jid,
        text: messageText,
        is_group: false,
        from_me: true,
        processing_status: 'PROCESSED',
      }).select('id').single();

      if (error) throw error;

      await recordReminder(supabase, {
        customer_id: customer.id,
        customer_name: customer.company_name,
        route,
        delivery_date: deliveryDate,
        status: 'sent',
        sent_at: new Date().toISOString(),
        message_id: data?.id || null,
        message_text: messageText,
        error_reason: null,
        attempt_count: 1,
      });
      summary.sent++;
      summary.reminders.push({ customerName: customer.company_name, route, status: 'sent', messageId: data?.id || null });
    } catch (err: any) {
      const reason = err?.message || 'dispatch_failed';
      await recordReminder(supabase, {
        customer_id: customer.id,
        customer_name: customer.company_name,
        route,
        delivery_date: deliveryDate,
        status: 'failed',
        sent_at: null,
        message_id: null,
        message_text: messageText,
        error_reason: reason,
        attempt_count: 1,
      }).catch(() => undefined);
      summary.failed++;
      summary.reminders.push({ customerName: customer.company_name, route, status: 'failed', error: reason });
    }
  }

  return summary;
}

async function recordReminder(supabase: SupabaseClient, reminder: {
  customer_id: string;
  customer_name: string;
  route: string;
  delivery_date: string;
  status: string;
  sent_at: string | null;
  message_id: string | null;
  message_text: string;
  error_reason: string | null;
  attempt_count: number;
}): Promise<void> {
  await supabase.from('order_reminders').upsert(reminder, { onConflict: 'customer_id,delivery_date' });
}

function emptySummary(timezone: string, deliveryDate?: string, reason?: string): DispatchSummary {
  return {
    deliveryDate: deliveryDate || '',
    deliveryDateLabel: '',
    routes: [],
    eligible: 0,
    sent: 0,
    skipped: 0,
    failed: 0,
    reason,
    reminders: [],
  };
}

/** Constant-time string comparison to avoid leaking CRON_SECRET via timing. */
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}
