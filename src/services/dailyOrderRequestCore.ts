/**
 * Phase 7 — Automated Daily Order Request Core Logic
 *
 * Pure, environment-agnostic helpers shared by the browser admin UI and the
 * Vercel serverless cron function (api/daily-order-request.ts).
 *
 * No localStorage / import.meta.env / Supabase client dependencies here.
 */

export interface OrderRequestTemplateParams {
  customerName: string;
  route: string;
  deliveryDate: string;
}

export const DEFAULT_ORDER_REQUEST_TEMPLATE = [
  'Good morning {{customer_name}}.',
  '',
  'Your delivery is scheduled for {{route}} tomorrow.',
  '',
  "Please send us your order for tomorrow's delivery.",
  '',
  'Thank you,',
  'J&T Supplies',
].join('\n');

/** Fallback weekly route schedule used when no DB-backed schedules are available. */
export const FALLBACK_WEEKLY_ROUTE_SCHEDULE: Record<string, string[]> = {
  Monday: ['Kelowna'],
  Tuesday: ['Kelowna', 'West Kelowna', 'Summerland'],
  Wednesday: ['Kelowna', 'Penticton', 'West Kelowna', 'Osoyoos', 'Oliver'],
  Thursday: ['Kelowna', 'Penticton', 'Princeton', 'Keremeos', 'Osoyoos', 'Oliver', 'Merritt'],
  Friday: ['Vernon', 'Salmon Arm', 'Lake Country', 'Armstrong'],
  Saturday: ['Vernon', 'Kamloops', 'Falkland', 'Chase', 'Salmon Arm', 'Lake Country'],
  Sunday: ['Kelowna', 'Penticton', 'Osoyoos', 'Oliver', 'West Kelowna'],
};

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** YYYY-MM-DD date key for a Date, computed in UTC to avoid local TZ drift. */
export function toDateKey(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Returns the current date components in a given IANA timezone.
 * e.g. "Tuesday, August 11 09:00" in America/Vancouver.
 */
export function getNowInTimezone(timezone: string, reference: Date = new Date()): {
  hour: number;
  minute: number;
  dateKey: string;
  dayName: string;
} {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone || 'America/Vancouver',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    weekday: 'long',
  });
  const parts = formatter.formatToParts(reference);
  const get = (type: string) => parts.find(p => p.type === type)?.value || '';

  let hour = Number(get('hour'));
  if (hour === 24) hour = 0;
  const minute = Number(get('minute'));
  const month = get('month');
  const day = get('day');
  const year = get('year');

  return {
    hour,
    minute,
    dateKey: `${year}-${month}-${day}`,
    dayName: get('weekday'),
  };
}

/**
 * Computes tomorrow's date key and weekday name in a given business timezone.
 */
export function getTomorrowInTimezone(timezone: string, reference: Date = new Date()): {
  dateKey: string;
  dayName: string;
} {
  const now = getNowInTimezone(timezone, reference);
  const [y, m, d] = now.dateKey.split('-').map(Number);
  const tomorrow = new Date(Date.UTC(y, m - 1, d + 1));
  return {
    dateKey: toDateKey(tomorrow),
    dayName: DAY_NAMES[tomorrow.getUTCDay()],
  };
}

/** Returns true when the current time (in timezone) matches the configured send time HH:MM. */
export function isSendTimeNow(sendTime: string, timezone: string, reference: Date = new Date()): boolean {
  const now = getNowInTimezone(timezone, reference);
  const [h, m] = (sendTime || '09:00').split(':').map(Number);
  return now.hour === (isNaN(h) ? 9 : h) && now.minute === (isNaN(m) ? 0 : m);
}

/** Lowercase day name → active route names for that day from schedule rows. */
export function getRoutesForDay(
  schedules: Array<{ day_of_week: string; city_or_route: string; active?: boolean }>,
  dayName: string,
  fallback: Record<string, string[]> = FALLBACK_WEEKLY_ROUTE_SCHEDULE
): string[] {
  const day = dayName.toLowerCase();
  const scheduled = schedules
    .filter(s => (s.active === undefined || s.active) && s.day_of_week.toLowerCase() === day)
    .map(s => s.city_or_route);

  if (scheduled.length > 0) return scheduled;

  const fallbackKey = Object.keys(fallback).find(k => k.toLowerCase() === day);
  return fallbackKey ? fallback[fallbackKey] : [];
}

/**
 * Renders the configurable order request template.
 * Supports {{customer_name}}, {{route}}, {{delivery_date}} placeholders.
 */
export function renderOrderRequestTemplate(
  template: string,
  params: OrderRequestTemplateParams
): string {
  const tpl = template || DEFAULT_ORDER_REQUEST_TEMPLATE;
  return tpl
    .replace(/\{\{customer_name\}\}/g, params.customerName)
    .replace(/\{\{route\}\}/g, params.route)
    .replace(/\{\{delivery_date\}\}/g, params.deliveryDate);
}

/** Human-friendly delivery date label, e.g. "Tuesday, August 11". */
export function formatDeliveryDateLabel(dateKey: string): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return `${DAY_NAMES[date.getUTCDay()]}, ${MONTH_NAMES[date.getUTCMonth()]} ${date.getUTCDate()}`;
}

/**
 * Builds a WhatsApp JID from a customer's stored phone/whatsapp number.
 * Adds the +1 Canada/US country code when the number is 10 digits.
 * Returns empty string when no usable number exists (ineligible customer).
 */
export function buildJidFromPhone(phone?: string | null): string {
  if (!phone) return '';
  const digits = phone.replace(/[^0-9]/g, '');
  if (digits.length === 10) return `1${digits}@s.whatsapp.net`;
  if (digits.length === 11 && digits.startsWith('1')) return `${digits}@s.whatsapp.net`;
  return digits ? `${digits}@s.whatsapp.net` : '';
}

/** Filters eligible customers: active, assigned to one of the given routes, reachable by WhatsApp. */
export function filterEligibleCustomers<T extends { status?: string; route?: string | null; whatsapp_number?: string | null }>(
  customers: T[],
  routes: string[]
): T[] {
  const normalizedRoutes = routes.map(r => r.toLowerCase());
  return customers.filter(c => {
    if (c.status && c.status !== 'active') return false;
    const route = (c.route || '').toLowerCase();
    if (!route || !normalizedRoutes.includes(route)) return false;
    return !!buildJidFromPhone(c.whatsapp_number);
  });
}
