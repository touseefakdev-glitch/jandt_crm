import { CustomerQuery, OperationalArea, UserProfile, UserRole } from '../types';
import { DailyOpStepKey } from '../utils/orderWorkflow';

/**
 * Phase 2 capability model.
 *
 * Granular, role-and-area derived capabilities drive every piece of the
 * operations UI (navigation, My Work queues, dashboards, action visibility).
 * This is the single frontend source of truth for WHAT a user may do. The
 * backend/RLS remains the real enforcement layer — the UI is defense-in-depth
 * only.
 *
 * No usernames are hard-coded anywhere; all decisions flow from
 * role + operational_area + workflow state.
 */
export type Capability =
  | 'orders:view'
  | 'orders:receive'
  | 'orders:createSalesOrder'
  | 'orders:invoice'
  | 'orders:dispatch'
  | 'orders:sendPod'
  | 'orders:updateOrderMatch'
  | 'orders:create'
  | 'orders:cancel'
  | 'queries:view'
  | 'queries:manage'
  | 'queries:verify'
  | 'customers:view'
  | 'customers:manage'
  | 'products:view'
  | 'products:manage'
  | 'notifications:view'
  | 'handovers:view'
  | 'reports:view'
  | 'admin';

const ROLE_CAPABILITIES: Record<UserRole, Capability[]> = {
  admin: [
    'orders:view',
    'orders:receive',
    'orders:createSalesOrder',
    'orders:invoice',
    'orders:dispatch',
    'orders:sendPod',
    'orders:updateOrderMatch',
    'orders:create',
    'orders:cancel',
    'queries:view',
    'queries:manage',
    'queries:verify',
    'customers:view',
    'customers:manage',
    'products:view',
    'products:manage',
    'notifications:view',
    'handovers:view',
    'reports:view',
    'admin',
  ],
  sales_agent: [
    'orders:view',
    'orders:receive',
    'orders:createSalesOrder',
    'orders:invoice',
    'orders:updateOrderMatch',
    'orders:create',
    'orders:cancel',
    'customers:view',
    'customers:manage',
    'products:view',
    'notifications:view',
    'handovers:view',
  ],
  support_agent: [
    'orders:view',
    'orders:dispatch',
    'orders:sendPod',
    'queries:view',
    'queries:manage',
    'queries:verify',
    'customers:view',
    'customers:manage',
    'products:view',
    'notifications:view',
    'handovers:view',
  ],
};

/** Daily operations workflow step → capability it maps to. */
export const STEP_CAPABILITY: Record<DailyOpStepKey, Capability> = {
  order_received: 'orders:receive',
  sales_order_generated: 'orders:createSalesOrder',
  invoiced: 'orders:invoice',
  dispatched: 'orders:dispatch',
  pod_sent: 'orders:sendPod',
};

export function can(user: UserProfile | null, capability: Capability): boolean {
  if (!user) return false;
  return ROLE_CAPABILITIES[user.role].includes(capability);
}

export function getCapabilities(user: UserProfile | null): Capability[] {
  if (!user) return [];
  return [...ROLE_CAPABILITIES[user.role]];
}

export function canUpdateDailyOpStep(user: UserProfile | null, step: DailyOpStepKey): boolean {
  return can(user, STEP_CAPABILITY[step]);
}

export function canUpdateAnyDailyOpStep(user: UserProfile | null): boolean {
  if (!user) return false;
  return (['orders:receive', 'orders:createSalesOrder', 'orders:invoice', 'orders:dispatch', 'orders:sendPod'] as Capability[]).some(
    (cap) => can(user, cap)
  );
}

/** Can this user operate on orders in the given operational area? */
export function canHandleArea(user: UserProfile | null, area: 'KELOWNA' | 'OUTSIDE_KELOWNA'): boolean {
  if (!user) return false;
  if (user.role === 'admin') return true;
  if (!user.operational_area || user.operational_area === 'BOTH') return true;
  return user.operational_area === area;
}

/** Area view scope the user should default to when listing orders. */
export function getEffectiveArea(user: UserProfile | null): 'ALL' | 'KELOWNA' | 'OUTSIDE_KELOWNA' {
  if (!user) return 'ALL';
  if (user.role === 'admin') return 'ALL';
  if (!user.operational_area || user.operational_area === 'BOTH') return 'ALL';
  return user.operational_area;
}

/**
 * Can this user verify a resolved query's resolution?
 * Verification is a second-person check — a user cannot verify their own
 * resolution, which gives a real four-eyes handoff even when both roles are
 * the same system role.
 */
export function canVerifyQuery(user: UserProfile | null, query: CustomerQuery | null | undefined): boolean {
  if (!can(user, 'queries:verify')) return false;
  if (!query) return true;
  if (query.resolved_by && query.resolved_by === user?.id) return false;
  return true;
}

export type WorkQueueTone = 'sky' | 'indigo' | 'purple' | 'emerald' | 'cyan' | 'amber' | 'red';

export interface WorkQueue {
  id: string;
  title: string;
  description: string;
  path: string;
  capability: Capability;
  scope: 'area' | 'self' | 'all';
  tone: WorkQueueTone;
}

/**
 * The "MY WORK" definition for the current user: every action queue this user
 * is permitted to act on, computed purely from capabilities (role + area).
 */
export function getWorkQueues(user: UserProfile | null): WorkQueue[] {
  if (!user) return [];
  const queues: WorkQueue[] = [];

  if (can(user, 'orders:receive')) {
    queues.push({
      id: 'orders-to-receive',
      title: 'Orders To Receive',
      description: 'Customers awaiting order confirmation for today',
      path: '/orders?status=not_started',
      capability: 'orders:receive',
      scope: 'area',
      tone: 'sky',
    });
  }

  if (can(user, 'orders:createSalesOrder')) {
    queues.push({
      id: 'sales-orders-to-generate',
      title: 'Sales Orders To Generate',
      description: 'Received orders that still need a Sales Order',
      path: '/orders?status=order_received',
      capability: 'orders:createSalesOrder',
      scope: 'area',
      tone: 'indigo',
    });
  }

  if (can(user, 'orders:invoice')) {
    queues.push({
      id: 'invoices-to-raise',
      title: 'Invoices To Raise',
      description: 'Sales Orders that still need an Invoice',
      path: '/orders?status=sales_order_generated',
      capability: 'orders:invoice',
      scope: 'area',
      tone: 'purple',
    });
  }

  if (can(user, 'orders:dispatch')) {
    queues.push({
      id: 'orders-to-dispatch',
      title: 'Orders To Dispatch',
      description: 'Invoiced orders ready for dispatch',
      path: '/orders?status=invoiced',
      capability: 'orders:dispatch',
      scope: 'area',
      tone: 'emerald',
    });
  }

  if (can(user, 'orders:sendPod')) {
    queues.push({
      id: 'pod-to-send',
      title: 'POD To Send',
      description: 'Dispatched orders awaiting POD sign-off',
      path: '/orders?status=dispatched',
      capability: 'orders:sendPod',
      scope: 'area',
      tone: 'cyan',
    });
  }

  if (can(user, 'orders:updateOrderMatch')) {
    queues.push({
      id: 'order-match-review',
      title: 'Order Match Review',
      description: 'Orders where actual order differs from expectation',
      path: '/orders?quick=different',
      capability: 'orders:updateOrderMatch',
      scope: 'area',
      tone: 'amber',
    });
  }

  if (can(user, 'queries:manage')) {
    queues.push({
      id: 'my-open-queries',
      title: 'My Open Queries',
      description: 'Support queries currently assigned to you',
      path: '/queries?tab=my',
      capability: 'queries:manage',
      scope: 'self',
      tone: 'sky',
    });
  }

  if (can(user, 'queries:verify')) {
    queues.push({
      id: 'queries-to-verify',
      title: 'Queries Awaiting Verification',
      description: 'Resolved queries needing a second-person check',
      path: '/queries?status=resolved',
      capability: 'queries:verify',
      scope: 'all',
      tone: 'emerald',
    });
  }

  if (can(user, 'queries:manage')) {
    queues.push({
      id: 'open-queries',
      title: 'Open Queries',
      description: 'All unassigned or active support queries',
      path: '/queries?status=open',
      capability: 'queries:manage',
      scope: 'all',
      tone: 'amber',
    });
  }

  return queues;
}
