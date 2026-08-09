import React, { useState, useEffect } from 'react';
import { Product, ProductAvailabilityStatus } from '../../types';
import { Badge, Button, Input, Modal, Textarea } from '../ui';
import { getProductAvailabilityBadge } from '../../utils/badges';
import { formatCurrency } from '../../utils/format';
import { AlertTriangle, CheckCircle2, Ban, Calendar } from 'lucide-react';

interface ProductAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (
    targetStatus: ProductAvailabilityStatus,
    reason: string,
    expectedDate: string | null
  ) => void;
  product: Product | null;
  targetStatus: ProductAvailabilityStatus | null;
}

export const ProductAvailabilityModal: React.FC<ProductAvailabilityModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  product,
  targetStatus,
}) => {
  const [reason, setReason] = useState('');
  const [expectedDate, setExpectedDate] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (product) {
      setReason(product.availability_notes || '');
      setExpectedDate(product.expected_available_date || '');
    } else {
      setReason('');
      setExpectedDate('');
    }
    setError('');
  }, [isOpen, product, targetStatus]);

  if (!isOpen || !product || !targetStatus) return null;

  const isMarkingOutOfStock = targetStatus === 'out_of_stock';
  const isRestoringAvailable = targetStatus === 'available';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isMarkingOutOfStock && !reason.trim()) {
      setError('A reason or availability note is required when marking a product Out of Stock.');
      return;
    }

    onSubmit(targetStatus, reason.trim(), expectedDate || null);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      icon={
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${
            isMarkingOutOfStock
              ? 'bg-red-50 text-red-600'
              : isRestoringAvailable
                ? 'bg-emerald-50 text-emerald-600'
                : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isMarkingOutOfStock ? (
            <AlertTriangle className="w-5 h-5" />
          ) : isRestoringAvailable ? (
            <CheckCircle2 className="w-5 h-5" />
          ) : (
            <Ban className="w-5 h-5" />
          )}
        </div>
      }
      title={
        isMarkingOutOfStock
          ? 'Mark Product Out of Stock'
          : isRestoringAvailable
            ? 'Restore Product Availability'
            : 'Update Availability Status'
      }
      subtitle={product.sku}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
          <div className="flex justify-between">
            <span className="font-mono text-brand-700 font-bold">{product.sku}</span>
            <span className="font-mono font-bold text-slate-900">{formatCurrency(product.unit_price)}</span>
          </div>
          <div className="font-bold text-slate-900 text-sm">{product.product_name}</div>
          <div className="flex items-center justify-between pt-0.5">
            <span className="text-slate-500">Current Status</span>
            <Badge badge={getProductAvailabilityBadge(product.availability_status)} />
          </div>
        </div>

        {isMarkingOutOfStock && (
          <>
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
              Marking <span className="font-bold">{product.sku}</span> as Out of Stock will log an
              availability alert and notify Sales and Support Agents.
            </div>

            <Textarea
              label={<>Reason for Unavailability <span className="text-red-500">*</span></>}
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              error={error}
              placeholder="Explain why the item is unavailable (e.g. Raw material resin shortage, supplier delay, factory overhaul)..."
            />

            <Input
              label="Expected Availability Date (Optional)"
              type="date"
              value={expectedDate}
              onChange={(e) => setExpectedDate(e.target.value)}
              className="font-mono"
              icon={<Calendar className="w-4 h-4" />}
            />
            <p className="text-[11px] text-slate-500 -mt-2">
              Informational date only. Does NOT automatically change status on this date.
            </p>
          </>
        )}

        {isRestoringAvailable && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs space-y-2">
            <p className="font-bold text-sm">Confirm Restoration to Available Status?</p>
            <p>
              Product <span className="font-bold">{product.sku}</span> will be marked as{' '}
              <span className="font-bold text-emerald-700">Available</span>.
            </p>
            <p className="text-slate-600">
              This action will record the change in availability history and notify all active Sales
              Agents and Support Agents.
            </p>
          </div>
        )}

        {error && !isMarkingOutOfStock && (
          <p className="text-xs font-medium text-red-600">{error}</p>
        )}

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            variant={isMarkingOutOfStock ? 'danger' : isRestoringAvailable ? 'success' : 'primary'}
          >
            {isMarkingOutOfStock
              ? 'Mark Out of Stock'
              : isRestoringAvailable
                ? 'Confirm Restoration'
                : 'Update Availability'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
