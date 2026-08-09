import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { ShiftHandover, ShiftHandoverItem } from '../../types';
import { 
  X, 
  CheckCheck, 
  Check, 
  Clock, 
  User, 
  HelpCircle, 
  ShoppingBag, 
  Package, 
  FileText, 
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  MessageSquare
} from 'lucide-react';

interface HandoverDetailModalProps {
  handover: ShiftHandover | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
}

export const HandoverDetailModal: React.FC<HandoverDetailModalProps> = ({
  handover,
  isOpen,
  onClose,
  onUpdate,
}) => {
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

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">🔴 URGENT</span>;
      case 'high':
        return <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">🟠 HIGH</span>;
      case 'medium':
        return <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">🔵 MEDIUM</span>;
      default:
        return <span className="text-[10px] font-medium uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">⚪ LOW</span>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'acknowledged':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
            <CheckCheck className="w-3.5 h-3.5 mr-1" />
            Acknowledged
          </span>
        );
      case 'submitted':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-sky-100 text-sky-800 border border-sky-200 animate-pulse">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Submitted — Awaiting Receipt
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-sky-600 rounded-xl flex items-center justify-center font-bold text-white shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-3">
                <h2 className="text-lg font-extrabold tracking-tight">Shift Handover Record</h2>
                {getStatusBadge(handover.status)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Submitted on {new Date(handover.created_at).toLocaleString()}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Outgoing & Incoming Team Metadata Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Outgoing Team</span>
              <div className="font-bold text-sm text-slate-900">
                {handover.outgoing_team ? handover.outgoing_team.name : 'Outgoing Team'}
              </div>
              <div className="text-xs text-slate-500 mt-0.5 flex items-center space-x-1">
                <User className="w-3.5 h-3.5 text-slate-400" />
                <span>Submitted by: <span className="font-semibold text-slate-700">{handover.submitted_by_profile ? handover.submitted_by_profile.full_name : 'Agent'}</span></span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Incoming Team</span>
              <div className="font-bold text-sm text-slate-900">
                {handover.incoming_team ? handover.incoming_team.name : 'Incoming Team'}
              </div>
              {handover.acknowledged_by_profile ? (
                <div className="text-xs text-emerald-700 font-semibold mt-0.5 flex items-center space-x-1">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Acknowledged by: {handover.acknowledged_by_profile.full_name} ({new Date(handover.acknowledged_at!).toLocaleTimeString()})</span>
                </div>
              ) : (
                <div className="text-xs text-amber-600 font-medium mt-0.5 italic">
                  Awaiting acknowledgement by incoming team
                </div>
              )}
            </div>
          </div>

          {/* Handover Summary */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">Shift Operational Summary</h3>
            <div className="p-4 bg-white rounded-xl border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans">
              {handover.summary}
            </div>
          </div>

          {/* Important Notes */}
          {handover.important_notes && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-amber-800 flex items-center">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mr-1" />
                Important Free-Text Operational Notes
              </h3>
              <div className="p-4 bg-amber-50/70 rounded-xl border border-amber-200 text-xs text-amber-950 leading-relaxed">
                {handover.important_notes}
              </div>
            </div>
          )}

          {/* Handover Flagged Items */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Flagged Handover Items ({handover.items ? handover.items.length : 0})
              </h3>
              <span className="text-[11px] text-slate-500 italic">
                Completing a handover item does NOT alter the underlying CRM record
              </span>
            </div>

            <div className="space-y-3">
              {handover.items && handover.items.length > 0 ? (
                handover.items.map(item => (
                  <div
                    key={item.id}
                    className={`p-4 rounded-xl border transition-all ${
                      item.is_completed ? 'bg-slate-50 border-slate-200 opacity-80' : 'bg-white border-slate-200 shadow-xs'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                      <div className="flex items-center space-x-2">
                        {getPriorityBadge(item.priority)}
                        <span className="text-xs font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {item.entity_type.replace(/_/g, ' ')}
                        </span>
                        {item.is_completed && (
                          <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center">
                            <Check className="w-3 h-3 mr-1" /> Item Completed
                          </span>
                        )}
                      </div>

                      {/* Action Links */}
                      <div className="flex items-center space-x-2">
                        {item.entity_type === 'query' && item.query_snapshot && (
                          <button
                            onClick={() => handleNavigateEntity(`/queries/${item.query_snapshot!.id}`)}
                            className="text-xs font-bold text-sky-700 hover:underline inline-flex items-center space-x-1"
                          >
                            <span>Open Query {item.query_snapshot.query_number}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {item.entity_type === 'order' && item.order_snapshot && (
                          <button
                            onClick={() => handleNavigateEntity(`/orders/${item.order_snapshot!.id}`)}
                            className="text-xs font-bold text-sky-700 hover:underline inline-flex items-center space-x-1"
                          >
                            <span>Open Order {item.order_snapshot.order_number}</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}

                        {item.entity_type === 'product' && item.product_snapshot && (
                          <button
                            onClick={() => handleNavigateEntity(`/products/${item.product_snapshot!.id}`)}
                            className="text-xs font-bold text-sky-700 hover:underline inline-flex items-center space-x-1"
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

                      {/* Completion Metadata */}
                      {item.is_completed ? (
                        <div className="pt-2 text-[11px] text-emerald-800 font-medium flex items-center space-x-1">
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Completed by {item.completed_by_profile ? item.completed_by_profile.full_name : 'Incoming Agent'} ({new Date(item.completed_at!).toLocaleString()}): "{item.completion_note}"</span>
                        </div>
                      ) : (
                        <div className="pt-2 text-right">
                          <button
                            onClick={() => setCompletingItemId(item.id)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors inline-flex items-center space-x-1 shadow-xs"
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>Mark Handover Item Complete</span>
                          </button>
                        </div>
                      )}
                    </div>

                  </div>
                ))
              ) : (
                <div className="p-6 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                  No specific flagged items associated with this handover.
                </div>
              )}
            </div>
          </div>

          {/* Bottom Acknowledgement Call to Action */}
          {canAcknowledge && (
            <div className="p-5 bg-sky-50 rounded-xl border border-sky-200 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-sky-600 text-white rounded-lg flex items-center justify-center">
                  <CheckCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Incoming Team Acknowledgement</h4>
                  <p className="text-xs text-slate-600">Acknowledge receipt of this handover to confirm operational awareness</p>
                </div>
              </div>

              <button
                onClick={handleAcknowledge}
                disabled={isActioning}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0"
              >
                {isActioning ? 'Acknowledging...' : 'Acknowledge Handover'}
              </button>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Close Window
          </button>
        </div>

        {/* Item Completion Dialog */}
        {completingItemId && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
              <div className="flex items-center space-x-2 text-emerald-600 font-bold text-base">
                <Check className="w-5 h-5" />
                <h3>Mark Handover Item Complete</h3>
              </div>
              
              <p className="text-xs text-slate-600 leading-relaxed">
                Confirm that the follow-up action for this handover item has been dealt with by your incoming shift.
              </p>

              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 font-medium">
                Note: Completing this handover item does NOT alter or close the underlying CRM record.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Completion Note (Optional)</label>
                <input
                  type="text"
                  value={completionNote}
                  onChange={(e) => setCompletionNote(e.target.value)}
                  placeholder="e.g. Spoke with customer, freight manifest verified..."
                  className="w-full p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setCompletingItemId(null)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isActioning}
                  onClick={handleConfirmItemComplete}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
                >
                  {isActioning ? 'Saving...' : 'Confirm Completion'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
