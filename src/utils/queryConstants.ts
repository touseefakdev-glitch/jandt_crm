// Simplified Customer Issue & Resolution Center Constants
import { QueryPriority, QueryStatus } from '../types';

export type QueryIssueType =
  | 'wrong_item'
  | 'return_request'
  | 'price_issue'
  | 'quality_issue'
  | 'item_not_received'
  | 'other';

export interface QueryCategoryMetadata {
  key: QueryIssueType;
  name: string;
  shortLabel: string;
  badgeClass: string;
}

export const QUERY_ISSUE_CATEGORIES: QueryCategoryMetadata[] = [
  {
    key: 'wrong_item',
    name: 'Wrong Item Received',
    shortLabel: 'Wrong Item',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  {
    key: 'return_request',
    name: 'Return Request',
    shortLabel: 'Return Request',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
  },
  {
    key: 'price_issue',
    name: 'Price Issue',
    shortLabel: 'Price Issue',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
  },
  {
    key: 'quality_issue',
    name: 'Quality Issue',
    shortLabel: 'Quality Issue',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
  },
  {
    key: 'item_not_received',
    name: 'Item Not Received',
    shortLabel: 'Not Received',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  {
    key: 'other',
    name: 'Other',
    shortLabel: 'Other',
    badgeClass: 'bg-slate-100 text-slate-800 border-slate-200',
  },
];

export const QUERY_STATUS_CONFIG: Record<QueryStatus, { label: string; badgeClass: string }> = {
  open: { label: 'OPEN', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  new: { label: 'OPEN', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  assigned: { label: 'IN PROGRESS', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  in_progress: { label: 'IN PROGRESS', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  waiting_customer: { label: 'WAITING', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200' },
  resolved: { label: 'RESOLVED', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  closed: { label: 'CLOSED', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300' },
  reopened: { label: 'REOPENED', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const QUERY_PRIORITY_CONFIG: Record<QueryPriority, { label: string; badgeClass: string }> = {
  low: { label: 'Low', badgeClass: 'bg-slate-100 text-slate-700 border-slate-200' },
  medium: { label: 'Normal', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200' },
  high: { label: 'High', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200' },
  urgent: { label: 'Urgent', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export type BackOrderStatus = 'PENDING' | 'SCHEDULED' | 'SENT' | 'COMPLETED';

export const BACK_ORDER_STATUS_CONFIG: Record<BackOrderStatus, { label: string; badgeClass: string }> = {
  PENDING: { label: 'Pending', badgeClass: 'bg-amber-50 text-amber-800 border-amber-200' },
  SCHEDULED: { label: 'Scheduled', badgeClass: 'bg-blue-50 text-blue-800 border-blue-200' },
  SENT: { label: 'Sent', badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  COMPLETED: { label: 'Completed', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};
