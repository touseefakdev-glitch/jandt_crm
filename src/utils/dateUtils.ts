import { BUSINESS_TIMEZONE, DEFAULT_LOCALE, ROUTE_DELIVERY_SCHEDULE } from '../config/businessConfig';
import { DayOfWeek } from '../types';

/**
 * Returns today's date formatted as YYYY-MM-DD in America/Vancouver timezone.
 */
export function getVancouverToday(): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(new Date());
}

/**
 * Returns a date YYYY-MM-DD offset by +days or -days relative to dateStr in America/Vancouver.
 */
export function getOffsetDateString(dateStr: string, offsetDays: number): string {
  if (!dateStr || dateStr.length < 10) return getVancouverToday();
  const parts = dateStr.substring(0, 10).split('-').map(Number);
  // Noon UTC avoids DST boundary shifts
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2] + offsetDays, 12, 0, 0));
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BUSINESS_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
}

/**
 * Gets the delivery date for a processing date.
 * Business Rule: Delivery Date is the calendar day AFTER Processing Date.
 */
export function getDeliveryDateFromProcessingDate(processingDateStr: string): string {
  return getOffsetDateString(processingDateStr, 1);
}

/**
 * Gets the processing date for a delivery date.
 * Business Rule: Processing Date is the calendar day BEFORE Delivery Date.
 */
export function getProcessingDateFromDeliveryDate(deliveryDateStr: string): string {
  return getOffsetDateString(deliveryDateStr, -1);
}

/**
 * Gets the lowercase weekday name ('monday', 'tuesday', etc.) for a date string in America/Vancouver.
 */
export function getVancouverWeekday(dateStr: string): DayOfWeek {
  if (!dateStr || dateStr.length < 10) return 'monday';
  const parts = dateStr.substring(0, 10).split('-').map(Number);
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BUSINESS_TIMEZONE,
    weekday: 'long',
  });
  return formatter.format(d).toLowerCase() as DayOfWeek;
}

/**
 * Formats a date string cleanly (e.g. "Wednesday, August 19, 2026") in America/Vancouver.
 */
export function formatDateLong(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const parts = dateStr.substring(0, 10).split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return '—';
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
  return d.toLocaleDateString(DEFAULT_LOCALE, {
    timeZone: BUSINESS_TIMEZONE,
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Formats a date string compactly (e.g. "Wed, Aug 19") in America/Vancouver.
 */
export function formatDateShort(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  const parts = dateStr.substring(0, 10).split('-').map(Number);
  if (parts.length < 3 || isNaN(parts[0])) return '—';
  const d = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2], 12, 0, 0));
  return d.toLocaleDateString(DEFAULT_LOCALE, {
    timeZone: BUSINESS_TIMEZONE,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

/**
 * Calculates the next scheduled delivery date (YYYY-MM-DD) for a customer
 * based on their route or city schedule in America/Vancouver time.
 */
export function calculateNextDeliveryDateForCustomer(customerRouteOrCity?: string | null): string {
  const todayStr = getVancouverToday();
  const routeOrCity = (customerRouteOrCity || '').trim().toLowerCase();

  // Look ahead up to 7 days for the next active route delivery day
  for (let offset = 1; offset <= 7; offset++) {
    const candidateDateStr = getOffsetDateString(todayStr, offset);
    const weekday = getVancouverWeekday(candidateDateStr);
    const routesForDay = (ROUTE_DELIVERY_SCHEDULE as any)[weekday] || [];
    if (routesForDay.some((r: string) => r.trim().toLowerCase() === routeOrCity)) {
      return candidateDateStr;
    }
  }

  // Fallback to tomorrow if route not found
  return getOffsetDateString(todayStr, 1);
}
