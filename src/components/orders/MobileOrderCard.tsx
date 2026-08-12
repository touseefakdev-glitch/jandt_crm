import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DailyOrderOperation,
  DailyOrderOperationStatus,
} from '../../types';
import {
  ORDER_WORKFLOW_STEPS,
  DailyOpStepKey,
  getExceptionKind,
  getPendingStep,
  isOperationCompleted,
  isOperationError,
  isStepDone,
} from '../../utils/orderWorkflow';
import { timeAgo } from '../../utils/format';
import { cn } from '../../utils/cn';
import { Avatar } from '../ui/Avatar';
import { useClickOutside } from '../../hooks/useClickOutside';
import {
  AlertTriangle,
  Check,
  CheckCircle2,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  FileText,
  MoreVertical,
  ReceiptText,
  Scale,
  Send,
  Truck,
  RotateCcw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface MobileOrderCardProps {
  op: DailyOrderOperation;
  canUpdate: boolean;
  canRevert: boolean;
  canUpdateOrderMatch: boolean;
  onOpenDetails: (op: DailyOrderOperation) => void;
  onToggleStep: (op: DailyOrderOperation, step: DailyOpStepKey, stepName: string) => void;
  onOpenOrderMatch: (op: DailyOrderOperation) => void;
  onReportError: (op: DailyOrderOperation) => void;
  onOpenSOModal?: (op: DailyOrderOperation) => void;
  onOpenInvoiceModal?: (op: DailyOrderOperation) => void;
}

const stepIcons: Record<DailyOpStepKey, React.ReactNode> = {
  order_received: <ClipboardList className="w-3 h-3" />,
  sales_order_generated: <FileText className="w-3 h-3" />,
  invoiced: <ReceiptText className="w-3 h-3" />,
  dispatched: <Truck className="w-3 h-3" />,
  pod_sent: <Send className="w-3 h-3" />,
};

export const MobileOrderCard: React.FC<MobileOrderCardProps> = ({
  op,
  canUpdate,
  canRevert,
  canUpdateOrderMatch,
  onOpenDetails,
  onToggleStep,
  onOpenOrderMatch,
  onReportError,
  onOpenSOModal,
  onOpenInvoiceModal,
}) => {
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDiffNote, setShowDiffNote] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useClickOutside(menuRef, () => setIsMenuOpen(false));

  const pendingStep = getPendingStep(op);
  const isCompleted = isOperationCompleted(op);
  const isError = isOperationError(op);
  const exceptionKind = getExceptionKind(op);

  const customerName = op.customer?.company_name || 'Customer';
  const customerCity = op.customer?.city || '—';
  const updatedByName = op.updated_by_profile?.full_name || 'System';

  // Area badge
  const isKelowna = op.route.toLowerCase().includes('kelowna');

  // Next action label and trigger
  const handleQuickNextAction = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canUpdate || !pendingStep) return;

    if (pendingStep.key === 'sales_order_generated' && onOpenSOModal && !op.sales_order_generated) {
      onOpenSOModal(op);
      return;
    }
    if (pendingStep.key === 'invoiced' && onOpenInvoiceModal && !op.invoiced) {
      onOpenInvoiceModal(op);
      return;
    }
    onToggleStep(op, pendingStep.key, pendingStep.label);
  };

  return (
    <div
      onClick={() => onOpenDetails(op)}
      className="crm-card p-4 transition-all active:scale-[0.99] hover:border-teal-400 cursor-pointer relative"
    >
      {/* Top Bar: Customer Code / Order ID & Area Badge & 3-dot Menu */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200 shrink-0">
            {op.customer?.customer_code || 'ORD'}
          </span>
          <span
            className={cn(
              'text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border truncate',
              isKelowna
                ? 'bg-teal-50 text-teal-800 border-teal-200'
                : 'bg-purple-50 text-purple-800 border-purple-200'
            )}
          >
            {isKelowna ? 'Kelowna' : 'Outside Kelowna'}
          </span>
        </div>

        {/* 3-Dot Quick Actions Dropdown */}
        <div className="relative shrink-0" ref={menuRef} onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setIsMenuOpen((v) => !v)}
            aria-label="Order quick menu"
            className="p-2 -mr-1 text-[#52606D] hover:text-[#132A4A] hover:bg-[#E9EFF5] rounded-lg transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {isMenuOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-white rounded-xl shadow-popover border border-[#DCE4EF] z-50 overflow-hidden animate-scale-in text-xs">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  onOpenDetails(op);
                }}
                className="w-full px-3 py-2.5 text-left font-semibold text-[#132A4A] hover:bg-[#F4F7FB] flex items-center gap-2"
              >
                <ClipboardList className="w-3.5 h-3.5 text-teal-600" />
                View Full Details
              </button>

              {canUpdateOrderMatch && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onOpenOrderMatch(op);
                  }}
                  className="w-full px-3 py-2.5 text-left font-semibold text-[#132A4A] hover:bg-[#F4F7FB] flex items-center gap-2"
                >
                  <Scale className="w-3.5 h-3.5 text-indigo-600" />
                  Set Order Match
                </button>
              )}

              {canUpdate && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onReportError(op);
                  }}
                  className="w-full px-3 py-2.5 text-left font-semibold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Report Issue / Query
                </button>
              )}

              {op.customer_id && (
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    navigate(`/customers/${op.customer_id}`);
                  }}
                  className="w-full px-3 py-2.5 text-left font-semibold text-[#52606D] hover:bg-[#F4F7FB] flex items-center gap-2 border-t border-[#E9EFF5]"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Customer Profile
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Customer Name & Route */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-extrabold text-[#132A4A] leading-snug truncate">{customerName}</h3>
          <p className="text-xs text-[#52606D] flex items-center gap-1.5 mt-0.5 truncate">
            <span>{customerCity}</span>
            <span>•</span>
            <span className="font-semibold text-navy-800">{op.route}</span>
          </p>
        </div>
        <Avatar name={customerName} size="sm" className="shrink-0" />
      </div>

      {/* Compact Status Checklist Rail */}
      <div className="bg-[#F4F7FB] rounded-lg p-2.5 border border-[#DCE4EF] mb-3">
        <div className="flex items-center justify-between gap-1 text-[10px] font-bold">
          {ORDER_WORKFLOW_STEPS.map((s) => {
            const done = isStepDone(op, s.key);
            const pending = pendingStep?.key === s.key;
            return (
              <div
                key={s.key}
                className={cn(
                  'flex items-center gap-1 px-1.5 py-0.5 rounded transition-all',
                  done
                    ? 'text-emerald-700 font-extrabold'
                    : pending
                      ? 'bg-teal-50 text-teal-700 ring-1 ring-teal-200'
                      : 'text-[#7B8CA4] opacity-60'
                )}
                title={`${s.label}: ${done ? 'Done' : 'Pending'}`}
              >
                {done ? (
                  <Check className="w-3 h-3 text-emerald-600 shrink-0" strokeWidth={3} />
                ) : (
                  <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', pending ? 'bg-teal-500 animate-pulse' : 'bg-[#C4D0E0]')} />
                )}
                <span>{s.shortLabel}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* NEXT ACTION Prominent Banner */}
      <div className="mb-3">
        {isCompleted ? (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              Completed — All 5 stages finished
            </span>
          </div>
        ) : isError ? (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
            <span className="flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              Operational Error Flagged
            </span>
            {op.error_query && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  navigate(`/queries/${op.error_query!.id}`);
                }}
                className="text-[11px] underline font-extrabold text-rose-700 hover:text-rose-900"
              >
                {op.error_query.query_number}
              </button>
            )}
          </div>
        ) : pendingStep ? (
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-gradient-to-r from-teal-500/15 via-teal-500/5 to-transparent border border-teal-300/80 text-[#132A4A] text-xs">
            <div className="min-w-0 pr-2">
              <span className="text-[9px] font-extrabold uppercase tracking-widest text-teal-700 block">NEXT ACTION</span>
              <span className="font-extrabold text-xs text-[#132A4A] block truncate">{pendingStep.label}</span>
            </div>
            {canUpdate && (
              <button
                onClick={handleQuickNextAction}
                className="px-3 py-1.5 rounded-btn bg-teal-500 hover:bg-teal-600 text-white font-bold text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1 min-h-[36px]"
              >
                Execute
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : null}
      </div>

      {/* Order Match & Exception status */}
      <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#E9EFF5] text-xs">
        <div className="flex items-center gap-2 min-w-0">
          {op.order_match ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canUpdateOrderMatch) onOpenOrderMatch(op);
                else if (op.difference_note) setShowDiffNote((v) => !v);
              }}
              className={cn(
                'inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full border transition-all shrink-0',
                op.order_match === 'DIFFERENT'
                  ? 'bg-amber-50 text-amber-800 border-amber-300'
                  : 'bg-emerald-50 text-emerald-800 border-emerald-200'
              )}
            >
              <Scale className="w-3 h-3" />
              {op.order_match === 'DIFFERENT' ? '⚠ Different' : '✓ Same'}
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (canUpdateOrderMatch) onOpenOrderMatch(op);
              }}
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-dashed border-[#C4D0E0] text-[#7B8CA4] hover:text-teal-700"
            >
              Set Match
            </button>
          )}

          {op.sales_order_number && <span className="font-mono text-[10px] text-[#52606D] truncate">SO: {op.sales_order_number}</span>}
          {op.invoice_number && <span className="font-mono text-[10px] text-[#52606D] truncate">Inv: {op.invoice_number}</span>}
        </div>

        <span className="text-[10px] text-[#7B8CA4] shrink-0 font-medium">{timeAgo(op.updated_at)}</span>
      </div>

      {/* Difference Note expandable */}
      {showDiffNote && op.difference_note && (
        <div className="mt-2 p-2 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 leading-snug">
          <span className="font-bold block">Difference Note:</span>
          {op.difference_note}
        </div>
      )}
    </div>
  );
};
