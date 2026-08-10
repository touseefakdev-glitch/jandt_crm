import React, { useState } from 'react';
import { Modal, Input, Button } from '../ui';
import { FileText, CheckCircle2 } from 'lucide-react';

interface SOModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (soNumber: string) => void;
  customerName: string;
}

export const SOModal: React.FC<SOModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customerName,
}) => {
  const [soNumber, setSoNumber] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!soNumber.trim()) {
      setError('Sales Order Number is required.');
      return;
    }
    setError('');
    onSubmit(soNumber.trim());
    setSoNumber('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setSoNumber('');
        setError('');
        onClose();
      }}
      title="Enter Sales Order Number"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-slate-700 flex items-start gap-2">
          <FileText className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block">{customerName}</span>
            <span>Please enter the official Sales Order Reference Number generated for this customer order.</span>
          </div>
        </div>

        <Input
          label="Sales Order Number *"
          type="text"
          value={soNumber}
          onChange={(e) => {
            setSoNumber(e.target.value);
            if (error) setError('');
          }}
          placeholder="e.g. SO-104928"
          error={error}
          autoFocus
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={<CheckCircle2 className="w-4 h-4" />}>
            Save Sales Order
          </Button>
        </div>
      </form>
    </Modal>
  );
};
