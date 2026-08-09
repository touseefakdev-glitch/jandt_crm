import React, { useState, useEffect } from 'react';
import { Product, ProductAvailabilityStatus } from '../../types';
import { X, AlertTriangle, CheckCircle2, Ban, Calendar, AlertCircle } from 'lucide-react';

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

    onSubmit(
      targetStatus,
      reason.trim(),
      expectedDate || null
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className={`px-6 py-4 text-white flex items-center justify-between ${
          isMarkingOutOfStock ? 'bg-red-600' :
          isRestoringAvailable ? 'bg-emerald-600' : 'bg-slate-900'
        }`}>
          <div className="flex items-center space-x-2.5">
            {isMarkingOutOfStock ? (
              <AlertTriangle className="w-5 h-5" />
            ) : isRestoringAvailable ? (
              <CheckCircle2 className="w-5 h-5" />
            ) : (
              <Ban className="w-5 h-5 text-sky-400" />
            )}
            <h3 className="font-bold text-base">
              {isMarkingOutOfStock ? 'Mark Product Out of Stock' :
               isRestoringAvailable ? 'Restore Product Availability' : 'Update Availability Status'}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span>SKU: <span className="font-mono text-sky-700 font-bold">{product.sku}</span></span>
              <span>Price: <span className="font-mono font-bold text-slate-900">${product.unit_price.toFixed(2)}</span></span>
            </div>
            <div className="font-bold text-slate-900 text-sm">
              {product.product_name}
            </div>
            <div className="text-slate-500">
              Current Status: <span className="font-bold uppercase text-slate-900">{product.availability_status.replace('_', ' ')}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form Content for Out of Stock */}
          {isMarkingOutOfStock && (
            <div className="space-y-3">
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-lg text-xs">
                Marking <span className="font-bold">{product.sku}</span> as Out of Stock will log an availability alert and notify Sales and Support Agents.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Reason for Unavailability <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why the item is unavailable (e.g. Raw material resin shortage, supplier delay, factory overhaul)..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 flex items-center space-x-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>Expected Availability Date (Optional)</span>
                </label>
                <input
                  type="date"
                  value={expectedDate}
                  onChange={(e) => setExpectedDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Informational date only. Does NOT automatically change status on this date.
                </p>
              </div>
            </div>
          )}

          {/* Form Content for Restore Available */}
          {isRestoringAvailable && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-lg text-xs space-y-2">
              <p className="font-bold text-sm">Confirm Restoration to Available Status?</p>
              <p>
                Product <span className="font-bold">{product.sku}</span> will be marked as <span className="font-bold text-emerald-700">Available</span>.
              </p>
              <p className="text-slate-600">
                This action will record the change in availability history and notify all active Sales Agents and Support Agents.
              </p>
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
                isMarkingOutOfStock ? 'bg-red-600 hover:bg-red-700' :
                isRestoringAvailable ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {isMarkingOutOfStock ? 'Mark Out of Stock' :
               isRestoringAvailable ? 'Confirm Restoration' : 'Update Availability'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
