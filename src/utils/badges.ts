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
  subtle: string;
  solid: string;
  dot: string;
  label: string;
}

export const formatLabel = (value: string | null | undefined): string =>
  (value ?? '').replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

/* ---------------------------------- Roles --------------------------------- */

export const roleBadges: Record<UserRole, BadgeStyle> = {
  admin: {
    subtle: 'bg-navy-50 text-navy-900 ring-[#D9E2EC]',
    solid: 'bg-navy-900 text-white',
    dot: 'bg-navy-500',
    label: 'System Admin',
  },
  sales_agent: {
    subtle: 'bg-teal-50 text-teal-800 ring-teal-200',
    solid: 'bg-teal-500 text-white',
    dot: 'bg-teal-500',
    label: 'Sales Agent',
  },
  support_agent: {
    subtle: 'bg-amber-50 text-amber-800 ring-amber-200',
    solid: 'bg-amber-500 text-white',
    dot: 'bg-amber-500',
    label: 'Support Agent',
  },
};

export const getRoleBadge = (role: UserRole): BadgeStyle => roleBadges[role];

/* --------------------------------- Orders --------------------------------- */

export const orderStatusBadges: Record<OrderStatus, BadgeStyle> = {
  order_received: { subtle: 'bg-teal-50 text-teal-800 ring-teal-200', solid: 'bg-teal-500 text-white', dot: 'bg-teal-500', label: 'Order Received' },
  sales_order_done: { subtle: 'bg-navy-50 text-navy-800 ring-navy-200', solid: 'bg-navy-900 text-white', dot: 'bg-navy-500', label: 'Sales Order Done' },
  invoiced: { subtle: 'bg-purple-50 text-purple-800 ring-purple-200', solid: 'bg-purple-600 text-white', dot: 'bg-purple-500', label: 'Invoiced' },
  dispatched: { subtle: 'bg-amber-50 text-amber-800 ring-amber-200', solid: 'bg-amber-500 text-white', dot: 'bg-amber-500', label: 'Dispatched' },
  signed_invoice_sent: { subtle: 'bg-teal-50 text-teal-800 ring-teal-200', solid: 'bg-teal-600 text-white', dot: 'bg-teal-500', label: 'Signed Invoice Sent' },
  completed: { subtle: 'bg-green-50 text-green-700 ring-green-200', solid: 'bg-green-500 text-white', dot: 'bg-green-500', label: 'Completed' },
  cancelled: { subtle: 'bg-red-50 text-red-700 ring-red-200', solid: 'bg-red-500 text-white', dot: 'bg-red-500', label: 'Cancelled' },
};

export const getOrderStatusBadge = (status: OrderStatus): BadgeStyle => orderStatusBadges[status];

/* --------------------------- Query status / prio -------------------------- */

export const queryStatusBadges: Record<QueryStatus, BadgeStyle> = {
  new: { subtle: 'bg-teal-50 text-teal-800 ring-teal-200', solid: 'bg-teal-500 text-white', dot: 'bg-teal-500', label: 'New' },
  assigned: { subtle: 'bg-navy-50 text-navy-800 ring-navy-200', solid: 'bg-navy-900 text-white', dot: 'bg-navy-500', label: 'Assigned' },
  in_progress: { subtle: 'bg-sky-50 text-sky-800 ring-sky-200', solid: 'bg-sky-600 text-white', dot: 'bg-sky-500', label: 'In Progress' },
  waiting_customer: { subtle: 'bg-amber-50 text-amber-800 ring-amber-200', solid: 'bg-amber-500 text-white', dot: 'bg-amber-500', label: 'Waiting for Customer' },
  resolved: { subtle: 'bg-green-50 text-green-700 ring-green-200', solid: 'bg-green-500 text-white', dot: 'bg-green-500', label: 'Resolved' },
  closed: { subtle: 'bg-[#E9EFF5] text-[#52606D] ring-[#D9E2EC]', solid: 'bg-[#829AB1] text-white', dot: 'bg-[#829AB1]', label: 'Closed' },
  reopened: { subtle: 'bg-amber-50 text-amber-800 ring-amber-200', solid: 'bg-amber-500 text-white', dot: 'bg-amber-500', label: 'Reopened' },
  open: { subtle: 'bg-teal-50 text-teal-800 ring-teal-200', solid: 'bg-teal-500 text-white', dot: 'bg-teal-500', label: 'Open' },
};

export const getQueryStatusBadge = (status: QueryStatus): BadgeStyle => queryStatusBadges[status];

export const queryPriorityBadges: Record<QueryPriority, BadgeStyle> = {
  low: { subtle: 'bg-[#E9EFF5] text-[#52606D] ring-[#D9E2EC]', solid: 'bg-[#829AB1] text-white', dot: 'bg-[#829AB1]', label: 'Low' },
  medium: { subtle: 'bg-teal-50 text-teal-800 ring-teal-200', solid: 'bg-teal-500 text-white', dot: 'bg-teal-500', label: 'Medium' },
  high: { subtle: 'bg-amber-50 text-amber-800 ring-amber-200', solid: 'bg-amber-500 text-white', dot: 'bg-amber-500', label: 'High' },
  urgent: { subtle: 'bg-red-50 text-red-700 ring-red-200', solid: 'bg-red-500 text-white', dot: 'bg-red-500', label: 'Urgent' },
};

export const getQueryPriorityBadge = (priority: QueryPriority): BadgeStyle => queryPriorityBadges[priority];

/* ------------------------ Notification priorities -------------------------- */

export const notificationPriorityBadges: Record<NotificationPriority, BadgeStyle> = {
  low: { subtle: 'bg-[#E9EFF5] text-[#52606D] ring-[#D9E2EC]', solid: 'bg-[#829AB1] text-white', dot: 'bg-[#829AB1]', label: 'Low' },
  normal: { subtle: 'bg-teal-50 text-teal-800 ring-teal-200', solid: 'bg-teal-500 text-white', dot: 'bg-teal-500', label: 'Normal' },
  high: { subtle: 'bg-amber-50 text-amber-800 ring-amber-200', solid: 'bg-amber-500 text-white', dot: 'bg-amber-500', label: 'High' },
  urgent: { subtle: 'bg-red-50 text-red-700 ring-red-200', solid: 'bg-red-500 text-white', dot: 'bg-red-500', label: 'Urgent' },
};

export const getNotificationPriorityBadge = (priority: NotificationPriority): BadgeStyle =>
  notificationPriorityBadges[priority];

/* ---------------------------- Product availability ------------------------- */

export const productAvailabilityBadges: Record<ProductAvailabilityStatus, BadgeStyle> = {
  available: { subtle: 'bg-green-50 text-green-700 ring-green-200', solid: 'bg-green-500 text-white', dot: 'bg-green-500', label: 'Available' },
  out_of_stock: { subtle: 'bg-red-50 text-red-700 ring-red-200', solid: 'bg-red-500 text-white', dot: 'bg-red-500', label: 'Out of Stock' },
  discontinued: { subtle: 'bg-[#E9EFF5] text-[#52606D] ring-[#D9E2EC]', solid: 'bg-[#829AB1] text-white', dot: 'bg-[#829AB1]', label: 'Discontinued' },
};

export const getProductAvailabilityBadge = (status: ProductAvailabilityStatus): BadgeStyle =>
  productAvailabilityBadges[status];

/* ----------------------------- Customer status ----------------------------- */

export const customerStatusBadges: Record<CustomerStatus, BadgeStyle> = {
  active: { subtle: 'bg-green-50 text-green-700 ring-green-200', solid: 'bg-green-500 text-white', dot: 'bg-green-500', label: 'Active' },
  inactive: { subtle: 'bg-[#E9EFF5] text-[#52606D] ring-[#D9E2EC]', solid: 'bg-[#829AB1] text-white', dot: 'bg-[#829AB1]', label: 'Inactive' },
};

export const getCustomerStatusBadge = (status: CustomerStatus): BadgeStyle =>
  customerStatusBadges[status];

/* ---------------------------- Handover statuses ---------------------------- */

export const handoverStatusBadges: Record<HandoverStatus, BadgeStyle> = {
  draft: { subtle: 'bg-[#E9EFF5] text-[#52606D] ring-[#D9E2EC]', solid: 'bg-[#829AB1] text-white', dot: 'bg-[#829AB1]', label: 'Draft' },
  submitted: { subtle: 'bg-teal-50 text-teal-800 ring-teal-200', solid: 'bg-teal-500 text-white', dot: 'bg-teal-500', label: 'Submitted' },
  acknowledged: { subtle: 'bg-green-50 text-green-700 ring-green-200', solid: 'bg-green-500 text-white', dot: 'bg-green-500', label: 'Acknowledged' },
};

export const getHandoverStatusBadge = (status: HandoverStatus): BadgeStyle =>
  handoverStatusBadges[status];

/* ------------------------------- Shift status ------------------------------ */

export const shiftStatusBadges: Record<'upcoming' | 'active' | 'completed', BadgeStyle> = {
  upcoming: { subtle: 'bg-[#E9EFF5] text-[#52606D] ring-[#D9E2EC]', solid: 'bg-[#829AB1] text-white', dot: 'bg-[#829AB1]', label: 'Upcoming' },
  active: { subtle: 'bg-green-50 text-green-700 ring-green-200', solid: 'bg-green-500 text-white', dot: 'bg-green-500', label: 'Active' },
  completed: { subtle: 'bg-teal-50 text-teal-800 ring-teal-200', solid: 'bg-teal-500 text-white', dot: 'bg-teal-500', label: 'Completed' },
};

export const getShiftStatusBadge = (status: 'upcoming' | 'active' | 'completed'): BadgeStyle =>
  shiftStatusBadges[status];
