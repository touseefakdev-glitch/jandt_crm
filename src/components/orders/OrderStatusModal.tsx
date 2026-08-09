import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { useAuth } from '../../context/AuthContext';
import { X, CheckCircle2, AlertTriangle, ShieldAlert, AlertCircle, Ban } from 'lucide-react';

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

  const formatStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'order_received': return 'Order Received';
      case 'sales_order_done': return 'Sales Order Done';
      case 'invoiced': return 'Invoiced';
      case 'dispatched': return 'Dispatched';
      case 'signed_invoice_sent': return 'Signed Invoice Sent';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
    }
  };

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

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className={`px-6 py-4 text-white flex items-center justify-between ${
          isCancelMode || targetStatus === 'cancelled' ? 'bg-red-600' :
          targetStatus === 'completed' ? 'bg-emerald-600' : 'bg-slate-900'
        }`}>
          <div className="flex items-center space-x-2.5">
            {isCancelMode || targetStatus === 'cancelled' ? (
              <Ban className="w-5 h-5" />
            ) : targetStatus === 'completed' ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-sky-400" />
            )}
            <h3 className="font-bold text-base">
              {isCancelMode ? 'Cancel Order' : targetStatus ? getNextActionTitle(targetStatus) : 'Update Order Workflow'}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
            <div>
              Order Number: <span className="font-mono text-sky-600 font-bold">{order.order_number}</span>
            </div>
            <div>
              Customer: <span className="font-semibold text-slate-900">{order.customer?.company_name || 'N/A'}</span>
            </div>
            <div>
              Current Status: <span className="font-semibold capitalize text-slate-900">{formatStatusLabel(order.current_status)}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Cancellation Form */}
          {(isCancelMode || targetStatus === 'cancelled') && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
                Warning: Order cancellation will stop all processing for <span className="font-bold">{order.order_number}</span>. Cancelled orders cannot be resumed.
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reason for Cancellation <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={cancellationReason}
                  onChange={(e) => setCancellationReason(e.target.value)}
                  placeholder="Explain why this order is being cancelled (e.g. Customer requested cancellation, Items discontinued, Payment failed)..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            </div>
          )}

          {/* Normal Sequential Progress Confirmation */}
          {!isCancelMode && targetStatus !== 'cancelled' && (
            <div className="space-y-4 text-xs text-slate-600">
              <div className="p-4 bg-sky-50 border border-sky-200 rounded-lg">
                <p className="font-bold text-slate-900 mb-1">Confirm Workflow Advancement?</p>
                <p>
                  You are about to advance order <span className="font-bold text-slate-900">{order.order_number}</span> from{' '}
                  <span className="font-bold text-slate-900">{formatStatusLabel(order.current_status)}</span> to{' '}
                  <span className="font-bold text-sky-700">{targetStatus ? formatStatusLabel(targetStatus) : ''}</span>.
                </p>
              </div>

              {/* Admin Override Mechanism */}
              {isAdmin && (
                <div className="pt-2 border-t border-slate-200 space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="adminOverride"
                      checked={isAdminOverride}
                      onChange={(e) => setIsAdminOverride(e.target.checked)}
                      className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
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
                      <textarea
                        rows={2}
                        required={isAdminOverride}
                        value={overrideReason}
                        onChange={(e) => setOverrideReason(e.target.value)}
                        placeholder="Provide formal audit reason for overriding order workflow..."
                        className="w-full px-2.5 py-1.5 text-xs border border-amber-300 bg-amber-50/50 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${
                isCancelMode || targetStatus === 'cancelled'
                  ? 'bg-red-600 hover:bg-red-700'
                  : targetStatus === 'completed'
                  ? 'bg-emerald-600 hover:bg-emerald-700'
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {isCancelMode || targetStatus === 'cancelled' ? 'Confirm Cancellation' : 'Confirm Action'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
