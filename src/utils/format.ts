import { SystemSettings } from '../types';

let currencySymbol = '$';

export const setCurrencySymbol = (symbol: string) => {
  currencySymbol = symbol || '$';
};

export const initCurrencySymbol = (settings?: SystemSettings | null) => {
  if (settings?.currency_symbol) {
    currencySymbol = settings.currency_symbol;
  }
};

export const formatCurrency = (value: number): string =>
  `${currencySymbol}${(value || 0).toFixed(2)}`;

export const formatDate = (value: string | null | undefined, opts?: Intl.DateTimeFormatOptions): string => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-US', opts || { month: 'short', day: 'numeric', year: 'numeric' });
};

export const formatDateTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  const d = new Date(value);
  return `${d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} · ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
};

export const formatTime = (value: string | null | undefined): string => {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const formatNumber = (value: number): string => (value || 0).toLocaleString('en-US');

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
