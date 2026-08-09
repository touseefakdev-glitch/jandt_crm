import React, { useState } from 'react';
import { Order, OrderDocumentType } from '../../types';
import { X, FileText, Upload } from 'lucide-react';

interface OrderDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (documentType: OrderDocumentType, fileName: string, filePath: string) => void;
  order: Order | null;
}

export const OrderDocumentModal: React.FC<OrderDocumentModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  order,
}) => {
  const [docType, setDocType] = useState<OrderDocumentType>('sales_order');
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !order) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fileName.trim()) {
      setError('Please provide a file name.');
      return;
    }

    const path = `/documents/${order.order_number}/${fileName.trim()}`;
    onSubmit(docType, fileName.trim(), path);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <FileText className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">Attach Order Document</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
            Order Number: <span className="font-mono text-sky-600 font-bold">{order.order_number}</span> — {order.customer?.company_name || 'Customer'}
          </div>

          {error && (
            <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value as OrderDocumentType)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="sales_order">Sales Order Document</option>
              <option value="invoice">Commercial Invoice</option>
              <option value="dispatch_document">Dispatch / Shipping Note</option>
              <option value="signed_invoice">Signed Invoice Receipt</option>
              <option value="other">Other Supporting Document</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              File Name / Reference <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <Upload className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                required
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                placeholder="e.g. Signed_Invoice_ORD-000001.pdf"
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Simulates secure file attachment to order repository.
            </p>
          </div>

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
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Upload Document
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
