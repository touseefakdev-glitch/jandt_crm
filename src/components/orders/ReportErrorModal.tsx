import React, { useState } from 'react';
import { Modal, Textarea, Select, Button } from '../ui';
import { AlertTriangle, Send } from 'lucide-react';

interface ReportErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (description: string, priority: 'normal' | 'high' | 'urgent') => void;
  customerName: string;
}

export const ReportErrorModal: React.FC<ReportErrorModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  customerName,
}) => {
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'normal' | 'high' | 'urgent'>('high');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Error description is required.');
      return;
    }
    setError('');
    onSubmit(description.trim(), priority);
    setDescription('');
    setPriority('high');
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        setDescription('');
        setError('');
        onClose();
      }}
      title="Report Operational Error"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block text-slate-900">{customerName}</span>
            <span>Submitting this error will automatically create a ticket in the Customer Query system.</span>
          </div>
        </div>

        <Textarea
          label="What went wrong? *"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (error) setError('');
          }}
          placeholder="Describe the operational issue (e.g. wrong item requested, delivery address inaccessible, pricing discrepancy)..."
          rows={4}
          error={error}
          autoFocus
        />

        <Select
          label="Priority *"
          value={priority}
          onChange={(e) => setPriority(e.target.value as any)}
        >
          <option value="normal">Normal Priority</option>
          <option value="high">High Priority</option>
          <option value="urgent">Urgent Priority</option>
        </Select>

        <div className="flex justify-end gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="danger" icon={<Send className="w-4 h-4" />}>
            Create Customer Query
          </Button>
        </div>
      </form>
    </Modal>
  );
};
