import React, { useState, useEffect, useMemo } from 'react';
import { CustomerQuery } from '../../types';
import { localDb } from '../../services/db';
import { Avatar, Modal, ModalFooter, Select } from '../ui';
import { UserCheck } from 'lucide-react';

interface QueryAssignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (queryId: string, assignedToUserId: string | null) => void;
  query: CustomerQuery | null;
}

export const QueryAssignModal: React.FC<QueryAssignModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  query,
}) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('');
  const users = useMemo(() => localDb.getUsers(), []);

  useEffect(() => {
    if (query) {
      setSelectedAgentId(query.assigned_to || '');
    }
  }, [query, isOpen]);

  if (!isOpen || !query) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title="Assign Support Ticket"
      subtitle={`${query?.query_number} — ${query?.subject}`}
      icon={<UserCheck className="w-5 h-5 text-brand-400" />}
      footer={
        <ModalFooter
          onCancel={onClose}
          onConfirm={() => onSubmit(query.id, selectedAgentId || null)}
          confirmLabel="Update Assignment"
        />
      }
    >
      <div className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
          <span className="font-mono text-brand-700 font-bold">{query?.query_number}</span> — {query?.subject}
        </div>

        <div>
          <label className="block text-sm font-semibold text-slate-700 mb-1.5">Select Support Agent</label>
          <Select value={selectedAgentId} onChange={(e) => setSelectedAgentId(e.target.value)}>
            <option value="">Unassigned (Queue)</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.role.replace('_', ' ')}) — {u.team?.name || 'No Team'}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">Quick assign:</div>
          <div className="flex flex-wrap gap-2">
            {users.slice(0, 5).map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => setSelectedAgentId(u.id)}
                className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-lg border transition-colors ${
                  selectedAgentId === u.id
                    ? 'bg-brand-600 text-white border-brand-600'
                    : 'bg-white text-slate-700 border-slate-300 hover:border-brand-400 hover:text-brand-700'
                }`}
              >
                <Avatar name={u.full_name} size="xs" />
                {u.full_name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>
    </Modal>
  );
};
