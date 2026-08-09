import {
  CustomerStatus,
  HandoverStatus,
  NotificationPriority,
  OrderStatus,
  ProductAvailabilityStatus,
  QueryPriority,
  QueryStatus,
  UserRole,
} from '../types';

export interface BadgeStyle {
  /** Tailwind classes for a solid (subtle) badge */
  subtle: string;
  /** Tailwind classes for a filled badge */
  solid: string;
  /** Small status dot color class */
  dot: string;
  /** Human friendly label */
  label: string;
}

export const formatLabel = (value: string | null | undefined): string =>
  (value ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ---------------------------------- Roles --------------------------------- */

export const roleBadges: Record<UserRole, BadgeStyle> = {
  admin: {
    subtle: 'bg-purple-50 text-purple-700 ring-purple-200',
    solid: 'bg-purple-600 text-white',
    dot: 'bg-purple-500',
    label: 'System Admin',
  },
  sales_agent: {
    subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    solid: 'bg-emerald-600 text-white',
    dot: 'bg-emerald-500',
    label: 'Sales Agent',
  },
  support_agent: {
    subtle: 'bg-amber-50 text-amber-700 ring-amber-200',
    solid: 'bg-amber-500 text-white',
    dot: 'bg-amber-500',
    label: 'Support Agent',
  },
};

export const getRoleBadge = (role: UserRole): BadgeStyle => roleBadges[role];

/* --------------------------------- Orders --------------------------------- */

export const orderStatusBadges: Record<OrderStatus, BadgeStyle> = {
  order_received: { subtle: 'bg-blue-50 text-blue-700 ring-blue-200', solid: 'bg-blue-600 text-white', dot: 'bg-blue-500', label: 'Order Received' },
  sales_order_done: { subtle: 'bg-violet-50 text-violet-700 ring-violet-200', solid: 'bg-violet-600 text-white', dot: 'bg-violet-500', label: 'Sales Order Done' },
  invoiced: { subtle: 'bg-sky-50 text-sky-700 ring-sky-200', solid: 'bg-sky-600 text-white', dot: 'bg-sky-500', label: 'Invoiced' },
  dispatched: { subtle: 'bg-amber-50 text-amber-700 ring-amber-200', solid: 'bg-amber-500 text-white', dot: 'bg-amber-500', label: 'Dispatched' },
  signed_invoice_sent: { subtle: 'bg-indigo-50 text-indigo-700 ring-indigo-200', solid: 'bg-indigo-600 text-white', dot: 'bg-indigo-500', label: 'Signed Invoice Sent' },
  completed: { subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200', solid: 'bg-emerald-600 text-white', dot: 'bg-emerald-500', label: 'Completed' },
  cancelled: { subtle: 'bg-red-50 text-red-700 ring-red-200', solid: 'bg-red-600 text-white', dot: 'bg-red-500', label: 'Cancelled' },
};

export const getOrderStatusBadge = (status: OrderStatus): BadgeStyle => orderStatusBadges[status];

/* --------------------------- Query status / prio -------------------------- */

export const queryStatusBadges: Record<QueryStatus, BadgeStyle> = {
  new: { subtle: 'bg-blue-50 text-blue-700 ring-blue-200', solid: 'bg-blue-600 text-white', dot: 'bg-blue-500', label: 'New' },
  assigned: { subtle: 'bg-violet-50 text-violet-700 ring-violet-200', solid: 'bg-violet-600 text-white', dot: 'bg-violet-500', label: 'Assigned' },
  in_progress: { subtle: 'bg-sky-50 text-sky-700 ring-sky-200', solid: 'bg-sky-600 text-white', dot: 'bg-sky-500', label: 'In Progress' },
  waiting_customer: { subtle: 'bg-amber-50 text-amber-700 ring-amber-200', solid: 'bg-amber-500 text-white', dot: 'bg-amber-500', label: 'Waiting for Customer' },
  resolved: { subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200', solid: 'bg-emerald-600 text-white', dot: 'bg-emerald-500', label: 'Resolved' },
  closed: { subtle: 'bg-slate-100 text-slate-600 ring-slate-200', solid: 'bg-slate-500 text-white', dot: 'bg-slate-400', label: 'Closed' },
  reopened: { subtle: 'bg-orange-50 text-orange-700 ring-orange-200', solid: 'bg-orange-500 text-white', dot: 'bg-orange-500', label: 'Reopened' },
  open: { subtle: 'bg-blue-50 text-blue-700 ring-blue-200', solid: 'bg-blue-600 text-white', dot: 'bg-blue-500', label: 'Open' },
};

export const getQueryStatusBadge = (status: QueryStatus): BadgeStyle => queryStatusBadges[status];

export const queryPriorityBadges: Record<QueryPriority, BadgeStyle> = {
  low: { subtle: 'bg-slate-100 text-slate-600 ring-slate-200', solid: 'bg-slate-500 text-white', dot: 'bg-slate-400', label: 'Low' },
  medium: { subtle: 'bg-sky-50 text-sky-700 ring-sky-200', solid: 'bg-sky-600 text-white', dot: 'bg-sky-500', label: 'Medium' },
  high: { subtle: 'bg-amber-50 text-amber-700 ring-amber-200', solid: 'bg-amber-500 text-white', dot: 'bg-amber-500', label: 'High' },
  urgent: { subtle: 'bg-red-50 text-red-700 ring-red-200', solid: 'bg-red-600 text-white', dot: 'bg-red-500', label: 'Urgent' },
};

export const getQueryPriorityBadge = (priority: QueryPriority): BadgeStyle => queryPriorityBadges[priority];

/* ------------------------ Notification priorities -------------------------- */

export const notificationPriorityBadges: Record<NotificationPriority, BadgeStyle> = {
  low: { subtle: 'bg-slate-100 text-slate-600 ring-slate-200', solid: 'bg-slate-500 text-white', dot: 'bg-slate-400', label: 'Low' },
  normal: { subtle: 'bg-sky-50 text-sky-700 ring-sky-200', solid: 'bg-sky-600 text-white', dot: 'bg-sky-500', label: 'Normal' },
  high: { subtle: 'bg-amber-50 text-amber-700 ring-amber-200', solid: 'bg-amber-500 text-white', dot: 'bg-amber-500', label: 'High' },
  urgent: { subtle: 'bg-red-50 text-red-700 ring-red-200', solid: 'bg-red-600 text-white', dot: 'bg-red-500', label: 'Urgent' },
};

export const getNotificationPriorityBadge = (priority: NotificationPriority): BadgeStyle =>
  notificationPriorityBadges[priority];

/* ---------------------------- Product availability ------------------------- */

export const productAvailabilityBadges: Record<ProductAvailabilityStatus, BadgeStyle> = {
  available: { subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200', solid: 'bg-emerald-600 text-white', dot: 'bg-emerald-500', label: 'Available' },
  out_of_stock: { subtle: 'bg-red-50 text-red-700 ring-red-200', solid: 'bg-red-600 text-white', dot: 'bg-red-500', label: 'Out of Stock' },
  discontinued: { subtle: 'bg-slate-100 text-slate-600 ring-slate-200', solid: 'bg-slate-500 text-white', dot: 'bg-slate-400', label: 'Discontinued' },
};

export const getProductAvailabilityBadge = (status: ProductAvailabilityStatus): BadgeStyle =>
  productAvailabilityBadges[status];

/* ----------------------------- Customer status ----------------------------- */

export const customerStatusBadges: Record<CustomerStatus, BadgeStyle> = {
  active: { subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200', solid: 'bg-emerald-600 text-white', dot: 'bg-emerald-500', label: 'Active' },
  inactive: { subtle: 'bg-slate-100 text-slate-600 ring-slate-200', solid: 'bg-slate-500 text-white', dot: 'bg-slate-400', label: 'Inactive' },
};

export const getCustomerStatusBadge = (status: CustomerStatus): BadgeStyle =>
  customerStatusBadges[status];

/* ---------------------------- Handover statuses ---------------------------- */

export const handoverStatusBadges: Record<HandoverStatus, BadgeStyle> = {
  draft: { subtle: 'bg-slate-100 text-slate-600 ring-slate-200', solid: 'bg-slate-500 text-white', dot: 'bg-slate-400', label: 'Draft' },
  submitted: { subtle: 'bg-sky-50 text-sky-700 ring-sky-200', solid: 'bg-sky-600 text-white', dot: 'bg-sky-500', label: 'Submitted' },
  acknowledged: { subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200', solid: 'bg-emerald-600 text-white', dot: 'bg-emerald-500', label: 'Acknowledged' },
};

export const getHandoverStatusBadge = (status: HandoverStatus): BadgeStyle =>
  handoverStatusBadges[status];

/* ------------------------------- Shift status ------------------------------ */

export const shiftStatusBadges: Record<'upcoming' | 'active' | 'completed', BadgeStyle> = {
  upcoming: { subtle: 'bg-slate-100 text-slate-600 ring-slate-200', solid: 'bg-slate-500 text-white', dot: 'bg-slate-400', label: 'Upcoming' },
  active: { subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200', solid: 'bg-emerald-600 text-white', dot: 'bg-emerald-500', label: 'Active' },
  completed: { subtle: 'bg-blue-50 text-blue-700 ring-blue-200', solid: 'bg-blue-600 text-white', dot: 'bg-blue-500', label: 'Completed' },
};

export const getShiftStatusBadge = (status: 'upcoming' | 'active' | 'completed'): BadgeStyle =>
  shiftStatusBadges[status];
