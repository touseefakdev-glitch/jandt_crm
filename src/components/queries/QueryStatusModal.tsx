import React, { useState, useEffect } from 'react';
import { CustomerQuery, QueryStatus } from '../../types';
import { AlertCircle, CheckCircle2, RotateCcw, Lock, AlertTriangle } from 'lucide-react';
import { Badge, Button, Modal, Textarea } from '../ui';
import { getQueryStatusBadge } from '../../utils/badges';

interface QueryStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (targetStatus: QueryStatus, extraData?: { resolution?: string; reopen_reason?: string }) => void;
  query: CustomerQuery | null;
  targetStatus: QueryStatus | null;
}

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

const STATUS_STYLES: Record<QueryStatus, { icon: React.ReactNode; button: 'primary' | 'success' }> = {
  resolved: { icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />, button: 'success' },
  closed: { icon: <Lock className="w-5 h-5 text-slate-600" />, button: 'primary' },
  reopened: { icon: <RotateCcw className="w-5 h-5 text-amber-600" />, button: 'primary' },
  in_progress: { icon: <AlertTriangle className="w-5 h-5 text-sky-600" />, button: 'primary' },
  waiting_customer: { icon: <AlertTriangle className="w-5 h-5 text-sky-600" />, button: 'primary' },
  open: { icon: <AlertTriangle className="w-5 h-5 text-sky-600" />, button: 'primary' },
  new: { icon: <AlertTriangle className="w-5 h-5 text-sky-600" />, button: 'primary' },
  assigned: { icon: <AlertTriangle className="w-5 h-5 text-sky-600" />, button: 'primary' },
};

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

  const style = STATUS_STYLES[targetStatus];

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
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Change Status to ${getStatusLabel(targetStatus)}`}
      subtitle={`${query.query_number} — ${query.subject}`}
      icon={style.icon}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs text-slate-700">
          <div className="flex items-center justify-between mb-1.5">
            <div className="font-semibold text-slate-900">
              Ticket: <span className="font-mono text-brand-700">{query.query_number}</span>
            </div>
            <Badge badge={getQueryStatusBadge(query.status)} />
          </div>
          <div>{query.subject}</div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {targetStatus === 'resolved' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Resolution Summary <span className="text-red-500">*</span>
            </label>
            <Textarea
              rows={4}
              required
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="Describe how the issue was resolved (e.g., Replacement item dispatched, Invoice re-sent via email, Refund issued)..."
              className="min-h-[110px]"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              A resolution description is mandatory before a support ticket can be marked as Resolved.
            </p>
          </div>
        )}

        {targetStatus === 'reopened' && (
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Reason for Reopening <span className="text-red-500">*</span>
            </label>
            <Textarea
              rows={4}
              required
              value={reopenReason}
              onChange={(e) => setReopenReason(e.target.value)}
              placeholder="Explain why this ticket is being reopened (e.g. Customer reported issue recurring, Attachment missing)..."
              className="min-h-[110px]"
            />
            <p className="text-[11px] text-slate-500 mt-1">
              The reopen reason will be permanently recorded in the ticket audit history.
            </p>
          </div>
        )}

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

        <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant={style.button}>
            Confirm Status Change
          </Button>
        </div>
      </form>
    </Modal>
  );
};
