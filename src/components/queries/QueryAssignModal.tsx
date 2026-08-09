import React, { useState, useEffect, useMemo } from 'react';
import { CustomerQuery } from '../../types';
import { localDb } from '../../services/db';
import { X, UserCheck, ShieldCheck } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(query.id, selectedAgentId || null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <UserCheck className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">Assign Support Ticket</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
            <span className="font-mono text-sky-600 font-bold">{query.query_number}</span> — {query.subject}
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Select Support Agent
            </label>
            <div className="relative">
              <ShieldCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <select
                value={selectedAgentId}
                onChange={(e) => setSelectedAgentId(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">Unassigned (Queue)</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role.replace('_', ' ')}) — {u.team?.name || 'No Team'}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Update Assignment
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
