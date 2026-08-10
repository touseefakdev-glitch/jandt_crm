import React, { useState } from 'react';
import { Modal, Textarea, Button } from '../ui';
import { RotateCcw, AlertCircle } from 'lucide-react';

interface UndoStepModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
  stepName: string;
  customerName: string;
}

export const UndoStepModal: React.FC<UndoStepModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  stepName,
  customerName,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A reason is required to revert a completed workflow step.');
      return;
    }
    setError('');
    onConfirm(reason.trim());
    setReason('');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setReason('');
        setError('');
        onClose();
      }}
      title={`Undo "${stepName}"?`}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-slate-900">{customerName}</span>
            <span>
              This action will revert the operational status back from <span className="font-semibold">{stepName}</span>. Any subsequent completed steps will also be reset.
            </span>
          </div>
        </div>

        <Textarea
          label="Reason for Reverting *"
          value={reason}
          onChange={(e) => {
            setReason(e.target.value);
            if (error) setError('');
          }}
          placeholder="Please explain why this workflow step is being reverted (e.g. entered wrong SO number, customer requested postponement)..."
          rows={3}
          error={error}
          autoFocus
        />

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" icon={<RotateCcw className="w-4 h-4" />}>
            Confirm & Revert Step
          </Button>
        </div>
      </form>
    </Modal>
  );
};
