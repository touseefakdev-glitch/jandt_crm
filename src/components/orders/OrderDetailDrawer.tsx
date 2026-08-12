import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Circle,
  ClipboardList,
  ExternalLink,
  MapPin,
  RotateCcw,
  Scale,
  Send,
  FileText,
  Truck,
} from 'lucide-react';
import { DailyOrderOperation, DailyOrderOperationHistory } from '../../types';
import { localDb } from '../../services/db';
import { formatDate, formatTime, timeAgo, initials } from '../../utils/format';
import {
  ORDER_WORKFLOW_STEPS,
  DailyOpStepKey,
  getExceptionKind,
  getPendingStep,
} from '../../utils/orderWorkflow';
import { Drawer, Button } from '../ui';

interface OrderDetailDrawerProps {
  op: DailyOrderOperation | null;
  onClose: () => void;
  canUpdate: boolean;
  canRevert: boolean;
  canUpdateOrderMatch: boolean;
  onToggleStep: (op: DailyOrderOperation, step: DailyOpStepKey, stepName: string) => void;
  onOpenOrderMatch: (op: DailyOrderOperation) => void;
  onReportError: (op: DailyOrderOperation) => void;
  onViewQuery: (queryId: string) => void;
}

const stepIcons: Record<DailyOpStepKey, React.ReactNode> = {
  order_received: <ClipboardList className="w-3.5 h-3.5" />,
  sales_order_generated: <FileText className="w-3.5 h-3.5" />,
  invoiced: <FileText className="w-3.5 h-3.5" />,
  dispatched: <Truck className="w-3.5 h-3.5" />,
  pod_sent: <Send className="w-3.5 h-3.5" />,
};

const stepColors: Record<DailyOpStepKey, { done: string; active: string }> = {
  order_received: { done: 'bg-sky-600 text-white', active: 'text-sky-600' },
  sales_order_generated: { done: 'bg-indigo-600 text-white', active: 'text-indigo-600' },
  invoiced: { done: 'bg-purple-600 text-white', active: 'text-purple-600' },
  dispatched: { done: 'bg-emerald-600 text-white', active: 'text-emerald-600' },
  pod_sent: { done: 'bg-cyan-600 text-white', active: 'text-cyan-600' },
};

export const OrderDetailDrawer: React.FC<OrderDetailDrawerProps> = ({
  op,
  onClose,
  canUpdate,
  canRevert,
  canUpdateOrderMatch,
  onToggleStep,
  onOpenOrderMatch,
  onReportError,
  onViewQuery,
}) => {
  const [history, setHistory] = useState<DailyOrderOperationHistory[]>([]);

  useEffect(() => {
    if (op) {
      setHistory(localDb.getDailyOrderOperationHistory(op.id));
    } else {
      setHistory([]);
    }
  }, [op]);

  if (!op) return null;

  const exceptionKind = getExceptionKind(op);
  const pendingStep = getPendingStep(op);
  const updatedBy = op.updated_by_profile?.full_name || '—';

  return (
    <Drawer
      isOpen={!!op}
      onClose={onClose}
      placement="right"
      size="lg"
      icon={<MapPin className="w-4 h-4" />}
      title={op.customer?.company_name || 'Customer'}
      subtitle={`${op.route} Route${op.customer?.city ? ` · ${op.customer.city}` : ''}`}
    >
      <div className="space-y-5">
        {/* Overview */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Delivery Date</span>
            <span className="text-xs font-bold text-slate-900 mt-0.5 block">{formatDate(op.operation_date)}</span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Operational Area</span>
            <span className={`text-xs font-bold mt-0.5 block ${op.operational_area === 'KELOWNA' ? 'text-teal-700' : 'text-purple-700'}`}>
              {op.operational_area === 'KELOWNA' ? 'Kelowna' : 'Outside Kelowna'}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 col-span-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">Customer</span>
            <span className="text-xs font-semibold text-slate-800 mt-0.5 block">
              {op.customer?.company_name}
              {op.customer?.customer_code && <span className="text-slate-400 font-mono ml-2">{op.customer.customer_code}</span>}
            </span>
            <span className="text-[11px] text-slate-500 block mt-0.5">{op.customer?.city || '—'}</span>
          </div>
        </div>

        {/* Workflow Checklist */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Workflow</h3>
            {pendingStep && !exceptionKind && (
              <span className="text-[10px] font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full border border-brand-100">
                Pending: {pendingStep.label}
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {ORDER_WORKFLOW_STEPS.map((step, idx) => {
              const done = Boolean(op[step.key]);
              const isPending = !done && pendingStep?.key === step.key;
              const actor = op[`${step.key}_by_profile` as keyof DailyOrderOperation] as DailyOrderOperation['order_received_by_profile'];
              const timestamp = op[`${step.key}_at` as keyof DailyOrderOperation] as string | null;
              const refNumber = step.key === 'sales_order_generated' ? op.sales_order_number : step.key === 'invoiced' ? op.invoice_number : null;
              const colors = stepColors[step.key];

              return (
                <React.Fragment key={step.key}>
                  <button
                    type="button"
                    onClick={() => canUpdate && onToggleStep(op, step.key, step.label)}
                    disabled={!canUpdate}
                    title={canUpdate ? `Toggle ${step.label}${done && !canRevert ? ' (revert requires permission)' : ''}` : 'No permission to update workflow'}
                    className={`w-full flex items-start gap-3 p-2.5 rounded-lg border text-left transition-all ${
                      done
                        ? 'bg-slate-50 border-slate-200'
                        : isPending
                        ? 'bg-white border-brand-300 ring-1 ring-brand-200 shadow-xs'
                        : 'bg-white border-slate-200 opacity-80'
                    } ${canUpdate ? 'hover:border-brand-400' : 'cursor-default'}`}
                  >
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? colors.done : 'bg-slate-100 text-slate-400'}`}>
                      {done ? <CheckCircle2 className="w-3.5 h-3.5" /> : isPending ? stepIcons[step.key] : <Circle className="w-3 h-3" />}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="flex items-center justify-between gap-2">
                        <span className={`text-xs font-bold ${done ? 'text-slate-600' : isPending ? colors.active : 'text-slate-400'}`}>
                          {step.label}
                        </span>
                        {done && canRevert && (
                          <span className="text-[9px] font-bold text-slate-400 inline-flex items-center gap-1">
                            <RotateCcw className="w-3 h-3" /> Undo
                          </span>
                        )}
                      </span>
                      <span className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        {refNumber && <span className="font-mono font-bold text-brand-700">{refNumber}</span>}
                        {timestamp && (
                          <span className="font-mono">
                            {formatDate(timestamp, { month: 'short', day: 'numeric' })} · {formatTime(timestamp)}
                          </span>
                        )}
                        {actor && <span>by {actor.full_name}</span>}
                        {!timestamp && !actor && <span>{isPending ? 'Waiting for this step' : 'Not started'}</span>}
                      </span>
                    </span>
                  </button>
                  {idx < ORDER_WORKFLOW_STEPS.length - 1 && (
                    <div className="ml-5 w-px h-2 bg-slate-200" aria-hidden="true" />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Order Match */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">Order Match</h3>
          <div className="p-3 rounded-lg border bg-white">
            {op.order_match ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md border ${
                    op.order_match === 'DIFFERENT'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : 'bg-emerald-50 text-emerald-800 border-emerald-200'
                  }`}>
                    <Scale className="w-3 h-3" />
                    {op.order_match === 'DIFFERENT' ? '⚠ Different Order' : 'Same'}
                  </span>
                  {op.invoice_updated && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Invoice Updated
                    </span>
                  )}
                </div>
                {op.difference_note && (
                  <p className="text-xs text-slate-700 bg-amber-50/60 border border-amber-200 rounded-md p-2.5">
                    <span className="font-bold text-amber-800 block text-[10px] uppercase tracking-wide">Difference Note</span>
                    {op.difference_note}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onOpenOrderMatch(op)}
                  disabled={!canUpdateOrderMatch}
                  className="text-[11px] font-bold text-brand-700 hover:text-brand-900 disabled:text-slate-300"
                >
                  {canUpdateOrderMatch ? 'Update Match' : 'View Match'}
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-slate-500">Not yet matched</span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => onOpenOrderMatch(op)}
                  disabled={!canUpdateOrderMatch}
                >
                  Set Match
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Exceptions */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">Exceptions</h3>
          <div className="p-3 rounded-lg border bg-white">
            {exceptionKind === 'error' ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-md border bg-rose-50 text-rose-800 border-rose-300">
                    <AlertTriangle className="w-3 h-3" /> Error
                  </span>
                  {op.error_query && (
                    <button
                      type="button"
                      onClick={() => onViewQuery(op.error_query!.id)}
                      className="text-[11px] font-bold text-rose-700 inline-flex items-center gap-1"
                      title="Open linked query"
                    >
                      <ExternalLink className="w-3 h-3" /> {op.error_query.query_number}
                    </button>
                  )}
                </div>
                {op.exception_note && (
                  <p className="text-xs text-slate-700 bg-rose-50/60 border border-rose-200 rounded-md p-2.5">{op.exception_note}</p>
                )}
              </div>
            ) : exceptionKind === 'different' ? (
              <p className="text-xs text-slate-700">
                <span className="font-bold text-amber-800">Different order</span> — the order does not match the invoice.
                {op.invoice_updated && <span className="font-bold text-emerald-700"> Invoice has been updated.</span>}
              </p>
            ) : exceptionKind === 'invoice_updated' ? (
              <p className="text-xs text-slate-700">
                <span className="font-bold text-emerald-700">Invoice Updated</span> — the invoice was adjusted to match the delivered order.
              </p>
            ) : (
              <p className="text-xs text-slate-400">No exceptions flagged.</p>
            )}
            {canUpdate && exceptionKind !== 'error' && (
              <button
                type="button"
                onClick={() => onReportError(op)}
                className="mt-2.5 text-[11px] font-bold text-rose-600 hover:text-rose-800 inline-flex items-center gap-1"
              >
                <AlertTriangle className="w-3 h-3" /> Report Error
              </button>
            )}
          </div>
        </div>

        {/* Last Updated */}
        <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex items-center justify-between gap-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">Last Updated</span>
          <span className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-brand-100 text-brand-700 text-[9px] font-black">
              {initials(updatedBy)}
            </span>
            Updated {timeAgo(op.updated_at) || '—'} by {updatedBy}
          </span>
        </div>

        {/* Activity Timeline */}
        <div>
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-2">
            Activity Timeline {history.length > 0 && <span className="text-slate-400">({history.length})</span>}
          </h3>
          {history.length > 0 ? (
            <div className="relative pl-4">
              <div className="absolute left-[5px] top-1 bottom-1 w-px bg-slate-200" aria-hidden="true" />
              <div className="space-y-3">
                {history.map((h) => (
                  <div key={h.id} className="relative">
                    <span className="absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-brand-400 ring-2 ring-brand-100" aria-hidden="true" />
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-xs font-semibold text-slate-800 leading-snug">{h.action}</p>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {formatDate(h.timestamp, { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-[10px] text-slate-400">
                      {h.reference_number && <span className="font-mono font-bold text-brand-700">Ref: {h.reference_number}</span>}
                      {h.user_profile && <span>by {h.user_profile.full_name}</span>}
                    </div>
                    {h.reason && (
                      <p className="mt-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                        {h.reason}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-400 py-2">No workflow activity logged yet.</p>
          )}
        </div>
      </div>
    </Drawer>
  );
};
