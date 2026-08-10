import React, { useState } from 'react';
import { Modal, Input, Button } from '../ui';
import { FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (invoiceNumber: string) => void;
  customerName: string;
  soNumber?: string | null;
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customerName,
  soNumber,
}) => {
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!invoiceNumber.trim()) {
      setError('Invoice Number is required.');
      return;
    }
    setError('');
    onSubmit(invoiceNumber.trim());
    setInvoiceNumber('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setInvoiceNumber('');
        setError('');
        onClose();
      }}
      title="Enter Invoice Number"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-xs text-slate-700 flex items-start gap-2">
          <FileSpreadsheet className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block">{customerName}</span>
            {soNumber && <span className="text-[11px] text-purple-700 block font-mono">Linked SO #: {soNumber}</span>}
            <span>Please enter the official Invoice Reference Number to mark this customer as Invoiced.</span>
          </div>
        </div>

        <Input
          label="Invoice Number *"
          type="text"
          value={invoiceNumber}
          onChange={(e) => {
            setInvoiceNumber(e.target.value);
            if (error) setError('');
          }}
          placeholder="e.g. INV-884920"
          error={error}
          autoFocus
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={<CheckCircle2 className="w-4 h-4" />}>
            Save Invoice
          </Button>
        </div>
      </form>
    </Modal>
  );
};
