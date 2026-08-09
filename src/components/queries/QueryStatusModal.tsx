import React, { useState, useEffect } from 'react';
import { CustomerQuery, QueryStatus } from '../../types';
import { X, CheckCircle2, RotateCcw, AlertTriangle, AlertCircle, Lock } from 'lucide-react';

interface QueryStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (targetStatus: QueryStatus, extraData?: { resolution?: string; reopen_reason?: string }) => void;
  query: CustomerQuery | null;
  targetStatus: QueryStatus | null;
}

export const QueryStatusModal: React.FC<QueryStatusModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  query,
  targetStatus,
}) => {
  const [resolution, setResolution] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setResolution('');
    setReopenReason('');
    setError('');
  }, [isOpen, targetStatus]);

  if (!isOpen || !query || !targetStatus) return null;

  const getStatusLabel = (status: QueryStatus) => {
    switch (status) {
      case 'open': return 'Open';
      case 'in_progress': return 'In Progress';
      case 'waiting_customer': return 'Waiting for Customer';
      case 'resolved': return 'Resolved';
      case 'closed': return 'Closed';
      case 'reopened': return 'Reopened';
      default: return status;
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (targetStatus === 'resolved' && !resolution.trim()) {
      setError('Resolution summary is required before resolving a ticket.');
      return;
    }

    if (targetStatus === 'reopened' && !reopenReason.trim()) {
      setError('Reopen reason is required before reopening a closed or resolved ticket.');
      return;
    }

    onSubmit(targetStatus, {
      resolution: resolution.trim() || undefined,
      reopen_reason: reopenReason.trim() || undefined,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className={`px-6 py-4 text-white flex items-center justify-between ${
          targetStatus === 'resolved' ? 'bg-emerald-600' :
          targetStatus === 'closed' ? 'bg-slate-900' :
          targetStatus === 'reopened' ? 'bg-amber-600' : 'bg-sky-600'
        }`}>
          <div className="flex items-center space-x-2.5">
            {targetStatus === 'resolved' && <CheckCircle2 className="w-5 h-5" />}
            {targetStatus === 'closed' && <Lock className="w-5 h-5" />}
            {targetStatus === 'reopened' && <RotateCcw className="w-5 h-5" />}
            {targetStatus !== 'resolved' && targetStatus !== 'closed' && targetStatus !== 'reopened' && <AlertTriangle className="w-5 h-5" />}
            
            <h3 className="font-bold text-base">
              Change Status to {getStatusLabel(targetStatus)}
            </h3>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">

          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
            <div className="font-semibold text-slate-900 mb-1">
              Ticket: <span className="font-mono text-sky-600">{query.query_number}</span> — {query.subject}
            </div>
            <div>
              Current Status: <span className="font-semibold capitalize">{getStatusLabel(query.status)}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Resolved Form Input */}
          {targetStatus === 'resolved' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Resolution Summary <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                placeholder="Describe how the issue was resolved (e.g., Replacement item dispatched, Invoice re-sent via email, Refund issued)..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                A resolution description is mandatory before a support ticket can be marked as Resolved.
              </p>
            </div>
          )}

          {/* Reopened Form Input */}
          {targetStatus === 'reopened' && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Reason for Reopening <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                required
                value={reopenReason}
                onChange={(e) => setReopenReason(e.target.value)}
                placeholder="Explain why this ticket is being reopened (e.g. Customer reported issue recurring, Attachment missing)..."
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                The reopen reason will be permanently recorded in the ticket audit history.
              </p>
            </div>
          )}

          {/* Closed Confirmation Notice */}
          {targetStatus === 'closed' && (
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 space-y-2">
              <p className="font-semibold text-slate-900">Confirm Closing Ticket?</p>
              <p>This will mark <span className="font-bold text-slate-900">{query.query_number}</span> as Permanently Closed.</p>
              {query.resolution && (
                <div className="p-2.5 bg-white rounded border border-slate-200 font-mono text-[11px] text-slate-700">
                  <span className="font-bold text-slate-900 block font-sans">Recorded Resolution:</span>
                  {query.resolution}
                </div>
              )}
            </div>
          )}

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
              className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
                targetStatus === 'resolved' ? 'bg-emerald-600 hover:bg-emerald-700' :
                targetStatus === 'closed' ? 'bg-slate-900 hover:bg-slate-800' :
                targetStatus === 'reopened' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-sky-600 hover:bg-sky-700'
              }`}
            >
              Confirm Status Change
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
