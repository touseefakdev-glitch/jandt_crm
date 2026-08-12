import React, { useState } from 'react';
import { Modal, Button, Textarea } from '../ui';
import { Scale, CheckCircle2, AlertCircle } from 'lucide-react';

interface OrderMatchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (match: 'SAME' | 'DIFFERENT', differenceNote: string | null, invoiceUpdated: boolean) => void;
  customerName: string;
  currentMatch?: 'SAME' | 'DIFFERENT' | null;
  differenceNote?: string | null;
  invoiceUpdated?: boolean;
}

export const OrderMatchModal: React.FC<OrderMatchModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customerName,
  currentMatch,
  differenceNote,
  invoiceUpdated,
}) => {
  const [match, setMatch] = useState<'SAME' | 'DIFFERENT'>(currentMatch || 'SAME');
  const [note, setNote] = useState(differenceNote || '');
  const [invoiceUpdatedFlag, setInvoiceUpdatedFlag] = useState(!!invoiceUpdated);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (match === 'DIFFERENT' && !note.trim()) {
      setError('A difference note is required when the order does not match the invoice.');
      return;
    }
    setError('');
    onSubmit(match, match === 'DIFFERENT' ? note.trim() : null, invoiceUpdatedFlag);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setError('');
        onClose();
      }}
      title="Order vs Invoice Match"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-brand-50 border border-brand-200 rounded-lg text-xs text-slate-700 flex items-start gap-2">
          <Scale className="w-4 h-4 text-brand-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold text-slate-900 block">{customerName}</span>
            <span>
              Confirm whether the order received matches the sales order / invoice that was generated for this customer.
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => {
              setMatch('SAME');
              setError('');
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              match === 'SAME'
                ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500/30'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <CheckCircle2 className={`w-5 h-5 mb-1 ${match === 'SAME' ? 'text-emerald-600' : 'text-slate-400'}`} />
            <span className="block text-xs font-extrabold uppercase tracking-wide">Same</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Order matches the invoice.</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMatch('DIFFERENT');
              setError('');
            }}
            className={`p-3 rounded-xl border text-left transition-all ${
              match === 'DIFFERENT'
                ? 'border-amber-500 bg-amber-50 text-amber-900 ring-1 ring-amber-500/30'
                : 'border-slate-200 bg-white hover:border-slate-300'
            }`}
          >
            <AlertCircle className={`w-5 h-5 mb-1 ${match === 'DIFFERENT' ? 'text-amber-600' : 'text-slate-400'}`} />
            <span className="block text-xs font-extrabold uppercase tracking-wide">Different</span>
            <span className="text-[10px] text-slate-500 block mt-0.5">Order differs from the invoice.</span>
          </button>
        </div>

        {match === 'DIFFERENT' && (
          <div className="space-y-3">
            <Textarea
              label="Difference Note *"
              value={note}
              onChange={(e) => {
                setNote(e.target.value);
                if (error) setError('');
              }}
              placeholder="Describe exactly how the order differs from the invoice (e.g. qty, items, pricing, address)..."
              rows={3}
              error={error}
              autoFocus
            />
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={invoiceUpdatedFlag}
                onChange={(e) => setInvoiceUpdatedFlag(e.target.checked)}
                className="w-4 h-4 accent-brand-600"
              />
              Invoice has been updated to match the actual order
            </label>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" icon={<CheckCircle2 className="w-4 h-4" />}>
            Save Order Match
          </Button>
        </div>
      </form>
    </Modal>
  );
};
