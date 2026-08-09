import React, { useState, useEffect } from 'react';
import { Order, OrderDocumentType } from '../../types';
import { Button, Input, Modal, Select } from '../ui';
import { FileText, Upload } from 'lucide-react';

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

  useEffect(() => {
    setFileName('');
    setError('');
  }, [isOpen]);

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title="Attach Order Document"
      subtitle={`${order.order_number} — ${order.customer?.company_name || 'Customer'}`}
      icon={<FileText className="w-5 h-5 text-brand-400" />}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-2.5 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
            {error}
          </div>
        )}

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            Document Type <span className="text-red-500">*</span>
          </label>
          <Select value={docType} onChange={(e) => setDocType(e.target.value as OrderDocumentType)}>
            <option value="sales_order">Sales Order Document</option>
            <option value="invoice">Commercial Invoice</option>
            <option value="dispatch_document">Dispatch / Shipping Note</option>
            <option value="signed_invoice">Signed Invoice Receipt</option>
            <option value="other">Other Supporting Document</option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">
            File Name / Reference <span className="text-red-500">*</span>
          </label>
          <Input
            type="text"
            required
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
            placeholder="e.g. Signed_Invoice_ORD-000001.pdf"
            icon={<Upload className="w-4 h-4 text-slate-400" />}
            className="pl-9"
          />
          <p className="text-[11px] text-slate-500 mt-1">
            Simulates secure file attachment to order repository.
          </p>
        </div>

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={<Upload className="w-4 h-4" />}>
            Upload Document
          </Button>
        </div>
      </form>
    </Modal>
  );
};
