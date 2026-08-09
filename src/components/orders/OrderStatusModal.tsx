import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { Badge, Button, Modal, Textarea } from '../ui';
import { getOrderStatusBadge } from '../../utils/badges';
import { AlertCircle, Ban, CheckCircle2, ShieldAlert, ArrowRight } from 'lucide-react';

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    targetStatus: OrderStatus,
    extraData?: { notes?: string; cancellation_reason?: string; is_admin_override?: boolean }
  ) => void;
  order: Order | null;
  targetStatus: OrderStatus | null;
  isCancelMode?: boolean;
}

export const OrderStatusModal: React.FC<OrderStatusModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  order,
  targetStatus,
  isCancelMode = false,
}) => {
  const { user } = useAuth();
  const [cancellationReason, setCancellationReason] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [isAdminOverride, setIsAdminOverride] = useState(false);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  useEffect(() => {
    setCancellationReason('');
    setOverrideReason('');
    setIsAdminOverride(false);
    setError('');
  }, [isOpen, targetStatus, isCancelMode]);

  if (!isOpen || !order) return null;

  const formatStatusLabel = (status: OrderStatus) => getOrderStatusBadge(status).label;

  const getNextActionTitle = (status: OrderStatus) => {
    switch (status) {
      case 'sales_order_done': return 'Complete Sales Order';
      case 'invoiced': return 'Mark Order as Invoiced';
      case 'dispatched': return 'Mark Order as Dispatched';
      case 'signed_invoice_sent': return 'Mark Signed Invoice Sent';
      case 'completed': return 'Complete Order Workflow';
      case 'cancelled': return 'Cancel Customer Order';
      default: return `Advance Status to ${formatStatusLabel(status)}`;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isCancelMode || targetStatus === 'cancelled') {
      if (!cancellationReason.trim()) {
        setError('A cancellation reason is required before an order can be cancelled.');
        return;
      }
      onSubmit('cancelled', { cancellation_reason: cancellationReason.trim() });
      return;
    }

    if (isAdminOverride && !overrideReason.trim()) {
      setError('An admin override reason is required when bypassing workflow stages.');
      return;
    }

    if (!targetStatus) return;

    onSubmit(targetStatus, {
      notes: overrideReason.trim() || undefined,
      is_admin_override: isAdminOverride,
    });
  };

  const isCancellation = isCancelMode || targetStatus === 'cancelled';
  const isCompletion = targetStatus === 'completed' && !isCancellation;

  const headerIcon = isCancellation
    ? <Ban className="w-5 h-5 text-red-600" />
    : isCompletion
      ? <CheckCircle2 className="w-5 h-5 text-emerald-600" />
      : <ArrowRight className="w-5 h-5 text-brand-500" />;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isCancellation ? 'Cancel Order' : targetStatus ? getNextActionTitle(targetStatus) : 'Update Order Workflow'}
      subtitle={`${order.order_number} · ${order.customer?.company_name || 'Unknown Customer'}`}
      icon={headerIcon}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-mono text-brand-700 font-bold">{order.order_number}</span>
              <span className="text-slate-500"> — {order.customer?.company_name || 'N/A'}</span>
            </div>
            <Badge badge={getOrderStatusBadge(order.current_status)} />
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {isCancellation && (
          <div className="space-y-3">
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
              Warning: Order cancellation will stop all processing for <span className="font-bold">{order.order_number}</span>. Cancelled orders cannot be resumed.
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Reason for Cancellation <span className="text-red-500">*</span>
              </label>
              <Textarea
                rows={4}
                required
                value={cancellationReason}
                onChange={(e) => setCancellationReason(e.target.value)}
                placeholder="Explain why this order is being cancelled (e.g. Customer requested cancellation, Items discontinued, Payment failed)..."
                className="min-h-[110px]"
              />
            </div>
          </div>
        )}

        {!isCancellation && (
          <div className="space-y-4 text-xs text-slate-600">
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg">
              <p className="font-bold text-slate-900 mb-1">Confirm Workflow Advancement?</p>
              <p>
                You are about to advance order <span className="font-bold text-slate-900">{order.order_number}</span> from{' '}
                <span className="font-bold text-slate-900">{formatStatusLabel(order.current_status)}</span> to{' '}
                <span className="font-bold text-brand-700">{targetStatus ? formatStatusLabel(targetStatus) : ''}</span>.
              </p>
            </div>

            {isAdmin && (
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="adminOverride"
                    checked={isAdminOverride}
                    onChange={(e) => setIsAdminOverride(e.target.checked)}
                    className="rounded border-slate-300 text-brand-600 focus:ring-brand-500"
                  />
                  <label htmlFor="adminOverride" className="font-semibold text-slate-900 flex items-center space-x-1 cursor-pointer">
                    <ShieldAlert className="w-3.5 h-3.5 text-amber-600" />
                    <span>Admin Override (Bypass Sequential Workflow)</span>
                  </label>
                </div>

                {isAdminOverride && (
                  <div>
                    <label className="block text-[11px] font-semibold text-amber-800 uppercase mb-1">
                      Override Justification Reason <span className="text-red-500">*</span>
                    </label>
                    <Textarea
                      rows={2}
                      required={isAdminOverride}
                      value={overrideReason}
                      onChange={(e) => setOverrideReason(e.target.value)}
                      placeholder="Provide formal audit reason for overriding order workflow..."
                      className="min-h-[60px] bg-amber-50/50"
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant={isCancellation ? 'danger' : isCompletion ? 'success' : 'primary'}>
            {isCancellation ? 'Confirm Cancellation' : 'Confirm Action'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
