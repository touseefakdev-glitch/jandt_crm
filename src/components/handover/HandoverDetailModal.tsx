import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { ShiftHandover } from '../../types';
import { Badge, Button, Input, Modal } from '../ui';
import { getHandoverStatusBadge } from '../../utils/badges';
import { formatDateTime } from '../../utils/format';
import { CheckCheck, Check, Clock, User, FileText, ArrowRight, AlertTriangle } from 'lucide-react';

const handoverItemPriorityBadges: Record<'low' | 'medium' | 'high' | 'urgent', { subtle: string; solid: string; dot: string; label: string }> = {
  urgent: { subtle: 'bg-red-50 text-red-700 ring-red-200', solid: 'bg-red-600 text-white', dot: 'bg-red-500', label: 'Urgent' },
  high: { subtle: 'bg-amber-50 text-amber-700 ring-amber-200', solid: 'bg-amber-500 text-white', dot: 'bg-amber-500', label: 'High' },
  medium: { subtle: 'bg-sky-50 text-sky-700 ring-sky-200', solid: 'bg-sky-600 text-white', dot: 'bg-sky-500', label: 'Medium' },
  low: { subtle: 'bg-slate-100 text-slate-600 ring-slate-200', solid: 'bg-slate-500 text-white', dot: 'bg-slate-400', label: 'Low' },
};

interface HandoverDetailModalProps {
  handover: ShiftHandover | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const HandoverDetailModal: React.FC<HandoverDetailModalProps> = ({ handover, isOpen, onClose, onUpdate }) => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [completingItemId, setCompletingItemId] = useState<string | null>(null);
  const [completionNote, setCompletionNote] = useState('');
  const [isActioning, setIsActioning] = useState(false);

  if (!isOpen || !handover || !user) return null;

  const isIncomingTeamMember = user.team_id === handover.incoming_team_id || user.role === 'admin';
  const canAcknowledge = handover.status === 'submitted' && isIncomingTeamMember;

  const handleAcknowledge = () => {
    setIsActioning(true);
    try {
      localDb.acknowledgeHandover(handover.id, user.id);
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActioning(false);
    }
  };

  const handleConfirmItemComplete = () => {
    if (!completingItemId) return;
    setIsActioning(true);
    try {
      localDb.completeHandoverItem(completingItemId, user.id, completionNote);
      setCompletingItemId(null);
      setCompletionNote('');
      onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setIsActioning(false);
    }
  };

  const handleNavigateEntity = (path: string) => {
    onClose();
    navigate(path);
  };

  const completingItem = completingItemId
    ? handover.items?.find((i) => i.id === completingItemId) || null
    : null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        icon={
          <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
            <FileText className="w-5 h-5" />
          </div>
        }
        title="Shift Handover Record"
        subtitle={`Submitted on ${formatDateTime(handover.created_at)}`}
        footer={
          <Button variant="outline" onClick={onClose}>
            Close Window
          </Button>
        }
      >
        <div className="space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <Badge badge={getHandoverStatusBadge(handover.status)} />
            <span className="text-xs text-slate-400">Submitted by {handover.submitted_by_profile?.full_name || 'Agent'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Outgoing Team
              </span>
              <div className="font-bold text-sm text-slate-900">
                {handover.outgoing_team ? handover.outgoing_team.name : 'Outgoing Team'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>
                  Submitted by:{' '}
                  <span className="font-semibold text-slate-700">
                    {handover.submitted_by_profile ? handover.submitted_by_profile.full_name : 'Agent'}
                  </span>
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">
                Incoming Team
              </span>
              <div className="font-bold text-sm text-slate-900">
                {handover.incoming_team ? handover.incoming_team.name : 'Incoming Team'}
              </div>
              {handover.acknowledged_by_profile ? (
                <div className="text-xs text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>
                    Acknowledged by: {handover.acknowledged_by_profile.full_name} (
                    {handover.acknowledged_at ? new Date(handover.acknowledged_at).toLocaleTimeString() : ''})
                  </span>
                </div>
              ) : (
                <div className="text-xs text-amber-600 font-medium mt-0.5 italic">
                  Awaiting acknowledgement by incoming team
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Shift Operational Summary</h3>
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed">
              {handover.summary}
            </div>
          </div>

          {handover.important_notes && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                Important Free-Text Operational Notes
              </h3>
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-950 leading-relaxed">
                {handover.important_notes}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Flagged Handover Items ({handover.items ? handover.items.length : 0})
              </h3>
              <span className="text-[11px] text-slate-500 italic">
                Completing a handover item does NOT alter the underlying CRM record
              </span>
            </div>

            {handover.items && handover.items.length > 0 ? (
              <div className="space-y-3">
                {handover.items.map((item) => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      item.is_completed ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge badge={handoverItemPriorityBadges[item.priority]} />
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.entity_type.replace(/_/g, ' ')}
                        </span>
                        {item.is_completed && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded inline-flex items-center gap-1">
                            <Check className="w-3 h-3" /> Item Completed
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {item.entity_type === 'query' && item.query_snapshot && (
                          <button
                            onClick={() => handleNavigateEntity(`/queries/${item.query_snapshot!.id}`)}
                            className="text-xs font-bold text-brand-700 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Open Query {item.query_snapshot.query_number}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {item.entity_type === 'order' && item.order_snapshot && (
                          <button
                            onClick={() => handleNavigateEntity(`/orders/${item.order_snapshot!.id}`)}
                            className="text-xs font-bold text-brand-700 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Open Order {item.order_snapshot.order_number}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {item.entity_type === 'product' && item.product_snapshot && (
                          <button
                            onClick={() => handleNavigateEntity(`/products/${item.product_snapshot!.id}`)}
                            className="text-xs font-bold text-brand-700 hover:underline inline-flex items-center gap-1"
                          >
                            <span>Open Product {item.product_snapshot.sku}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="space-y-1 text-xs text-slate-700">
                      <p className="font-semibold text-slate-900">{item.note}</p>
                      {item.action_required && (
                        <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                          <span className="font-bold text-slate-800">Action Required:</span> {item.action_required}
                        </p>
                      )}

                      {item.is_completed ? (
                        <div className="pt-2 text-[11px] text-emerald-800 font-medium flex items-center gap-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>
                            Completed by {item.completed_by_profile ? item.completed_by_profile.full_name : 'Incoming Agent'}{' '}
                            ({item.completed_at ? formatDateTime(item.completed_at) : ''}): "{item.completion_note}"
                          </span>
                        </div>
                      ) : (
                        <div className="pt-2 text-right">
                          <Button
                            size="sm"
                            variant="success"
                            icon={<Check className="w-3.5 h-3.5" />}
                            onClick={() => setCompletingItemId(item.id)}
                          >
                            Mark Handover Item Complete
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                No specific flagged items associated with this handover.
              </div>
            )}
          </div>

          {canAcknowledge && (
            <div className="p-5 bg-sky-50 rounded-xl border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 bg-sky-600 text-white rounded-lg flex items-center justify-center">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Incoming Team Acknowledgement</h4>
                  <p className="text-xs text-slate-600">
                    Acknowledge receipt of this handover to confirm operational awareness
                  </p>
                </div>
              </div>

              <Button icon={<CheckCheck className="w-4 h-4" />} loading={isActioning} onClick={handleAcknowledge}>
                {isActioning ? 'Acknowledging...' : 'Acknowledge Handover'}
              </Button>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!completingItemId}
        onClose={() => setCompletingItemId(null)}
        size="sm"
        icon={
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <Check className="w-5 h-5" />
          </div>
        }
        title="Mark Handover Item Complete"
        subtitle={completingItem ? completingItem.note : undefined}
      >
        <div className="space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed">
            Confirm that the follow-up action for this handover item has been dealt with by your incoming shift.
          </p>

          <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 font-medium">
            Note: Completing this handover item does NOT alter or close the underlying CRM record.
          </div>

          <Input
            label="Completion Note (Optional)"
            type="text"
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            placeholder="e.g. Spoke with customer, freight manifest verified..."
          />

          <div className="flex items-center justify-end gap-2.5 pt-2">
            <Button type="button" variant="outline" onClick={() => setCompletingItemId(null)}>
              Cancel
            </Button>
            <Button variant="success" loading={isActioning} onClick={handleConfirmItemComplete}>
              {isActioning ? 'Saving...' : 'Confirm Completion'}
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};
