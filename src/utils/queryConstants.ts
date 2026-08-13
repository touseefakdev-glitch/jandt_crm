// Centralized Query Module & Customer Issue Constants
import { QueryPriority, QueryStatus } from '../types';

export type QueryIssueType =
  | 'wrong_item'
  | 'invoice_change'
  | 'price_issue'
  | 'quality_issue'
  | 'item_not_received'
  | 'item_returned'
  | 'back_order'
  | 'other';

export interface QueryCategoryMetadata {
  key: QueryIssueType;
  name: string;
  shortLabel: string;
  description: string;
  iconName: string;
  badgeClass: string;
  accentColor: string;
}

export const QUERY_ISSUE_CATEGORIES: QueryCategoryMetadata[] = [
  {
    key: 'wrong_item',
    name: 'Wrong Item Received',
    shortLabel: 'Wrong Item',
    description: 'Customer received a different item than ordered',
    iconName: 'PackageX',
    badgeClass: 'bg-amber-50 text-amber-800 border-amber-200',
    accentColor: '#D97706',
  },
  {
    key: 'invoice_change',
    name: 'Item Return / Invoice Change',
    shortLabel: 'Invoice Change',
    description: 'Customer requested an item return or invoice adjustment',
    iconName: 'ReceiptText',
    badgeClass: 'bg-purple-50 text-purple-800 border-purple-200',
    accentColor: '#7C3AED',
  },
  {
    key: 'price_issue',
    name: 'Price Issue',
    shortLabel: 'Price Issue',
    description: 'Discrepancy between quoted/expected price and billed price',
    iconName: 'Tag',
    badgeClass: 'bg-blue-50 text-blue-800 border-blue-200',
    accentColor: '#2563EB',
  },
  {
    key: 'quality_issue',
    name: 'Quality Issue',
    shortLabel: 'Quality Issue',
    description: 'Damaged, defective, or unacceptable product quality',
    iconName: 'ShieldAlert',
    badgeClass: 'bg-rose-50 text-rose-800 border-rose-200',
    accentColor: '#E11D48',
  },
  {
    key: 'item_not_received',
    name: 'Item Not Received',
    shortLabel: 'Not Received',
    description: 'Item missing from delivery or order package',
    iconName: 'PackageSearch',
    badgeClass: 'bg-orange-50 text-orange-800 border-orange-200',
    accentColor: '#EA580C',
  },
  {
    key: 'item_returned',
    name: 'Item Returned',
    shortLabel: 'Item Returned',
    description: 'Customer returned item to delivery agent or warehouse',
    iconName: 'RotateCcw',
    badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    accentColor: '#4F46E5',
  },
  {
    key: 'back_order',
    name: 'Back Order / Send Next Delivery',
    shortLabel: 'Back Order',
    description: 'Item queued to be fulfilled on customer’s next scheduled delivery',
    iconName: 'CalendarPlus',
    badgeClass: 'bg-teal-50 text-teal-800 border-teal-200',
    accentColor: '#0D9488',
  },
  {
    key: 'other',
    name: 'Other Customer Issue',
    shortLabel: 'Other Issue',
    description: 'General inquiry or special operational issue',
    iconName: 'HelpCircle',
    badgeClass: 'bg-slate-50 text-slate-800 border-slate-200',
    accentColor: '#475569',
  },
];

export const RESOLUTION_ACTIONS = [
  { value: 'replace_item', label: 'Replace Item' },
  { value: 'return_item', label: 'Return Item' },
  { value: 'credit_customer', label: 'Credit Customer' },
  { value: 'correct_invoice', label: 'Correct Invoice' },
  { value: 'correct_price', label: 'Correct Price' },
  { value: 'send_next_delivery', label: 'Send on Next Delivery (Back Order)' },
  { value: 'investigate', label: 'Investigate Issue' },
  { value: 'contact_customer', label: 'Contact Customer' },
  { value: 'other', label: 'Other Action' },
] as const;

export const QUERY_STATUS_CONFIG: Record<QueryStatus, { label: string; badgeClass: string; description: string }> = {
  open: { label: 'Open', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', description: 'Nobody has started working on it' },
  new: { label: 'Open', badgeClass: 'bg-blue-50 text-blue-700 border-blue-200', description: 'Nobody has started working on it' },
  assigned: { label: 'In Progress', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', description: 'Assigned to agent' },
  in_progress: { label: 'In Progress', badgeClass: 'bg-amber-50 text-amber-700 border-amber-200', description: 'Someone is actively working on it' },
  waiting_customer: { label: 'Waiting', badgeClass: 'bg-purple-50 text-purple-700 border-purple-200', description: 'Waiting for customer or internal info' },
  resolved: { label: 'Resolved', badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200', description: 'Solution has been completed' },
  closed: { label: 'Closed', badgeClass: 'bg-slate-100 text-slate-700 border-slate-300', description: 'Fully finished' },
  reopened: { label: 'Reopened', badgeClass: 'bg-rose-50 text-rose-700 border-rose-200', description: 'Reopened for additional review' },
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
  SENT: { label: 'Sent / Dispatched', badgeClass: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
  COMPLETED: { label: 'Completed', badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
};
