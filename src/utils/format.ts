import { SystemSettings } from '../types';
import { BUSINESS_TIMEZONE, DEFAULT_CURRENCY, DEFAULT_LOCALE } from '../config/businessConfig';

let currencySymbol = '$';

export const setCurrencySymbol = (symbol: string) => {
  currencySymbol = symbol || '$';
};

export const initCurrencySymbol = (settings?: SystemSettings | null) => {
  if (settings?.currency_symbol) {
    currencySymbol = settings.currency_symbol;
  }
};

/**
 * Formats a monetary value using Canadian Dollar (CAD) currency styling (e.g. $25.00, $1,250.00).
 */
export const formatCurrency = (value: number): string => {
  const num = value || 0;
  try {
    return new Intl.NumberFormat(DEFAULT_LOCALE, {
      style: 'currency',
      currency: DEFAULT_CURRENCY,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(num);
  } catch {
    return `${currencySymbol}${num.toFixed(2)}`;
  }
};

/**
 * Formats a date value in America/Vancouver timezone with Canadian locale formatting.
 */
export const formatDate = (value: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string => {
  if (!value) return '—';
  const d = typeof value === 'string' && value.length === 10 ? new Date(`${value}T12:00:00`) : new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(DEFAULT_LOCALE, {
    timeZone: BUSINESS_TIMEZONE,
    ...(opts || { month: 'short', day: 'numeric', year: 'numeric' }),
  });
};

/**
 * Formats a timestamp in America/Vancouver timezone (e.g., "Aug 19, 2026 · 09:30 AM").
 */
export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  const datePart = d.toLocaleDateString(DEFAULT_LOCALE, {
    timeZone: BUSINESS_TIMEZONE,
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
  const timePart = d.toLocaleTimeString(DEFAULT_LOCALE, {
    timeZone: BUSINESS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
  return `${datePart} · ${timePart}`;
};

/**
 * Formats a time string in America/Vancouver timezone (e.g., "09:30 AM").
 */
export const formatTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString(DEFAULT_LOCALE, {
    timeZone: BUSINESS_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const formatNumber = (value: number): string => (value || 0).toLocaleString(DEFAULT_LOCALE);

/** Human-friendly relative time, e.g. "just now", "4 min ago", "2 hours ago". */
export const timeAgo = (value: string | null | undefined): string => {
  if (!value) return '';
  const then = new Date(value).getTime();
  if (isNaN(then)) return '';
  const mins = Math.max(0, Math.floor((Date.now() - then) / 60000));
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
};

export const initials = (name: string | null | undefined): string => {
  if (!name) return '?';
  return name
    .split(' ')
    .map((n) => n.charAt(0))
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase();
};
