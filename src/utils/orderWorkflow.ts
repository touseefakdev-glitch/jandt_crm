// Shared workflow semantics for the Route-Based Daily Order Operations module.
// Single source of truth for the 5-stage pipeline, "completed"/"pending"
// definitions, exception classification, and quick-filter matching so the
// Orders page and the detail drawer stay consistent.

import { DailyOrderOperation } from '../types';

export type DailyOpStepKey =
  | 'order_received'
  | 'sales_order_generated'
  | 'invoiced'
  | 'dispatched'
  | 'order_match'
  | 'pod_sent';

export interface WorkflowStepDef {
  key: DailyOpStepKey;
  label: string;
  shortLabel: string;
}

export const ORDER_WORKFLOW_STEPS: WorkflowStepDef[] = [
  { key: 'order_received', label: 'Order Received', shortLabel: 'Received' },
  { key: 'sales_order_generated', label: 'Sales Order', shortLabel: 'SO' },
  { key: 'invoiced', label: 'Invoiced', shortLabel: 'Invoice' },
  { key: 'dispatched', label: 'Dispatched', shortLabel: 'Dispatch' },
  { key: 'order_match', label: 'SO/Invoice Match', shortLabel: 'Match' },
  { key: 'pod_sent', label: 'POD Sent', shortLabel: 'POD' },
];

export function isStepDone(op: DailyOrderOperation, step: DailyOpStepKey): boolean {
  if (step === 'order_match') {
    return Boolean(op.order_match === 'SAME' || (op.order_match === 'DIFFERENT' && op.invoice_updated));
  }
  return Boolean(op[step]);
}

export function isOperationError(op: DailyOrderOperation): boolean {
  return Boolean(op.error_flag) || op.exception_status === 'ERROR';
}

/** Completed = all workflow stages reached (incl. Order Match and POD Sent). */
export function isOperationCompleted(op: DailyOrderOperation): boolean {
  return ORDER_WORKFLOW_STEPS.every(s => isStepDone(op, s.key));
}

/** First stage that has not been completed yet, or null when fully completed. */
export function getPendingStep(op: DailyOrderOperation): WorkflowStepDef | null {
  for (const step of ORDER_WORKFLOW_STEPS) {
    if (!isStepDone(op, step.key)) return step;
  }
  return null;
}

export function isOrderDifferent(op: DailyOrderOperation): boolean {
  return op.order_match === 'DIFFERENT';
}

/** Anything that needs attention: errors, order differences, or updated invoices. */
export function hasOrderException(op: DailyOrderOperation): boolean {
  return isOperationError(op) || isOrderDifferent(op) || Boolean(op.invoice_updated);
}

export type OrderExceptionKind = 'none' | 'error' | 'different' | 'invoice_updated';

export function getExceptionKind(op: DailyOrderOperation): OrderExceptionKind {
  if (isOperationError(op)) return 'error';
  if (isOrderDifferent(op)) return 'different';
  if (op.invoice_updated) return 'invoice_updated';
  return 'none';
}

export type OrdersQuickFilter = 'all' | 'pending' | 'completed' | 'exceptions' | 'different' | 'pod_pending';

export function matchesQuickFilter(op: DailyOrderOperation, quick: OrdersQuickFilter): boolean {
  switch (quick) {
    case 'all':
      return true;
    case 'pending':
      return !isOperationCompleted(op) && !isOperationError(op);
    case 'completed':
      return isOperationCompleted(op);
    case 'exceptions':
      return hasOrderException(op);
    case 'different':
      return isOrderDifferent(op);
    case 'pod_pending':
      return Boolean(op.dispatched) && !op.pod_sent;
    default:
      return true;
  }
}
