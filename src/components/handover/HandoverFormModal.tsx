import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { Team, HandoverEntityType, HandoverFormInput } from '../../types';
import { 
  X, 
  Send, 
  HelpCircle, 
  ShoppingBag, 
  Package, 
  AlertCircle, 
  Check,
  ChevronDown,
  ChevronUp,
  FileText,
  Clock
} from 'lucide-react';

interface HandoverFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface SelectedItemState {
  selected: boolean;
  entity_type: HandoverEntityType;
  entity_id: string;
  display_code: string;
  title: string;
  subtitle: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  note: string;
  action_required: string;
}

export const HandoverFormModal: React.FC<HandoverFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();

  const teams = useMemo(() => localDb.getTeams(), []);

  const outgoingTeam = useMemo(() => {
    if (!user) return null;
    return teams.find(t => t.id === user.team_id) || teams[0];
  }, [user, teams]);

  const defaultIncomingTeamId = useMemo(() => {
    if (!outgoingTeam) return teams[0]?.id || '';
    const other = teams.find(t => t.id !== outgoingTeam.id);
    return other ? other.id : teams[0]?.id || '';
  }, [outgoingTeam, teams]);

  const [incomingTeamId, setIncomingTeamId] = useState(defaultIncomingTeamId);
  const [summary, setSummary] = useState('');
  const [importantNotes, setImportantNotes] = useState('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatic Pending Work data
  const pendingWork = useMemo(() => {
    if (!outgoingTeam) return { queries: [], orders: [], products: [] };
    return localDb.getPendingWorkForHandover(outgoingTeam.id);
  }, [outgoingTeam]);

  // Items selection state
  const [itemsMap, setItemsMap] = useState<Record<string, SelectedItemState>>(() => {
    const initialMap: Record<string, SelectedItemState> = {};

    pendingWork.queries.forEach(q => {
      initialMap[`query-${q.id}`] = {
        selected: false,
        entity_type: 'query',
        entity_id: q.id,
        display_code: q.query_number,
        title: `${q.customer ? q.customer.company_name : 'Customer'} - ${q.subject}`,
        subtitle: `Priority: ${q.priority.toUpperCase()} | Status: ${q.status.replace(/_/g, ' ')}`,
        priority: q.priority === 'urgent' ? 'urgent' : q.priority === 'high' ? 'high' : 'medium',
        note: `Support ticket ${q.query_number} requires team follow-up.`,
        action_required: `Contact customer and progress issue resolution.`,
      };
    });

    pendingWork.orders.forEach(o => {
      initialMap[`order-${o.id}`] = {
        selected: false,
        entity_type: 'order',
        entity_id: o.id,
        display_code: o.order_number,
        title: `${o.customer ? o.customer.company_name : 'Customer'} - Total: $${o.grand_total.toFixed(2)}`,
        subtitle: `Status: ${o.current_status.replace(/_/g, ' ')}`,
        priority: 'high',
        note: `Order ${o.order_number} is pending at status stage ${o.current_status}.`,
        action_required: `Process next workflow stage.`,
      };
    });

    pendingWork.products.forEach(p => {
      initialMap[`product-${p.id}`] = {
        selected: false,
        entity_type: 'product',
        entity_id: p.id,
        display_code: p.sku,
        title: `${p.product_name}`,
        subtitle: `Reason: ${p.availability_notes || 'Out of Stock'}${p.expected_available_date ? ` (Expected: ${p.expected_available_date})` : ''}`,
        priority: 'urgent',
        note: `Product ${p.sku} is currently Out of Stock.`,
        action_required: `Verify supplier availability and notify waiting customers.`,
      };
    });

    return initialMap;
  });

  // Accordion section toggles
  const [openSection, setOpenSection] = useState<'queries' | 'orders' | 'products'>('queries');

  if (!isOpen || !user || !outgoingTeam) return null;

  const handleToggleItemSelect = (key: string) => {
    setItemsMap(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        selected: !prev[key].selected,
      },
    }));
  };

  const handleUpdateItemField = (key: string, field: 'priority' | 'note' | 'action_required', val: string) => {
    setItemsMap(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: val,
      },
    }));
  };

  const selectedItemsList = Object.values(itemsMap).filter(i => i.selected);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    setShowConfirmSubmit(true);
  };

  const handleConfirmSubmit = () => {
    setIsSubmitting(true);
    try {
      const payload: HandoverFormInput = {
        incoming_team_id: incomingTeamId,
        summary: summary.trim(),
        important_notes: importantNotes.trim(),
        items: selectedItemsList.map(item => ({
          entity_type: item.entity_type,
          entity_id: item.entity_id,
          priority: item.priority,
          note: item.note,
          action_required: item.action_required,
        })),
      };

      localDb.createHandover(payload, user.id);
      onSuccess();
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
      setShowConfirmSubmit(false);
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
              <h2 className="text-lg font-extrabold tracking-tight">Create Shift Handover</h2>
              <p className="text-xs text-slate-400">Record shift operations, pending tasks, and urgent operational notices for incoming team</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          
          {/* Teams Header Bar */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Outgoing Team (Your Team)</label>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>{outgoingTeam.name}</span>
                <span className="font-mono text-[11px] text-slate-500 font-normal">{outgoingTeam.shift_info}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">Receiving Incoming Team *</label>
              <select
                value={incomingTeamId}
                onChange={(e) => setIncomingTeamId(e.target.value)}
                className="w-full p-2.5 text-xs font-semibold border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                required
              >
                {teams.filter(t => t.id !== outgoingTeam.id).map(t => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.shift_info})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Shift Operational Summary & Notes */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Shift Operational Summary *
              </label>
              <textarea
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                rows={3}
                required
                placeholder="Provide a clear general summary of operational work completed and high-level shift activities..."
                className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1">
                Important Free-Text Operational Notes (Optional)
              </label>
              <textarea
                value={importantNotes}
                onChange={(e) => setImportantNotes(e.target.value)}
                rows={2}
                placeholder="Specific customer instructions, carrier delays, supplier updates, or team messages..."
                className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Automatic Pending Work Selector Accordion */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Select Pending Operational Records for Handover</h3>
                <p className="text-xs text-slate-500">Check important records from existing CRM modules to hand over to incoming agents ({selectedItemsList.length} Selected)</p>
              </div>
            </div>

            {/* Queries Section Accordion */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'queries' ? '' as any : 'queries')}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-900 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <HelpCircle className="w-4 h-4 text-sky-600" />
                  <span>Unresolved Support Queries ({pendingWork.queries.length})</span>
                </div>
                {openSection === 'queries' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {openSection === 'queries' && (
                <div className="p-4 bg-white divide-y divide-slate-100 space-y-3">
                  {pendingWork.queries.length > 0 ? (
                    pendingWork.queries.map(q => {
                      const key = `query-${q.id}`;
                      const item = itemsMap[key];
                      if (!item) return null;
                      return (
                        <div key={q.id} className="pt-3 first:pt-0">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => handleToggleItemSelect(key)}
                              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                            />
                            <div className="flex-1 text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-sky-700">{q.query_number}</span>
                                <span className="font-bold text-slate-900">{q.customer ? q.customer.company_name : 'Customer'}</span>
                                <span className="text-slate-400">•</span>
                                <span className="text-slate-600 truncate">{q.subject}</span>
                              </div>
                            </div>
                          </label>

                          {/* Expanded Handover Fields */}
                          {item.selected && (
                            <div className="ml-7 mt-3 p-3 bg-sky-50/60 rounded-lg border border-sky-100 space-y-2 text-xs">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Item Priority</label>
                                  <select
                                    value={item.priority}
                                    onChange={(e) => handleUpdateItemField(key, 'priority', e.target.value)}
                                    className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                                  >
                                    <option value="urgent">🔴 Urgent</option>
                                    <option value="high">🟠 High</option>
                                    <option value="medium">🔵 Medium</option>
                                    <option value="low">⚪ Low</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Action Required by Incoming Agent</label>
                                  <input
                                    type="text"
                                    value={item.action_required}
                                    onChange={(e) => handleUpdateItemField(key, 'action_required', e.target.value)}
                                    className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Handover Note</label>
                                <input
                                  type="text"
                                  value={item.note}
                                  onChange={(e) => handleUpdateItemField(key, 'note', e.target.value)}
                                  className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic">No unresolved support queries at this time.</p>
                  )}
                </div>
              )}
            </div>

            {/* Orders Section Accordion */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'orders' ? '' as any : 'orders')}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-900 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Pending Customer Orders ({pendingWork.orders.length})</span>
                </div>
                {openSection === 'orders' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {openSection === 'orders' && (
                <div className="p-4 bg-white divide-y divide-slate-100 space-y-3">
                  {pendingWork.orders.length > 0 ? (
                    pendingWork.orders.map(o => {
                      const key = `order-${o.id}`;
                      const item = itemsMap[key];
                      if (!item) return null;
                      return (
                        <div key={o.id} className="pt-3 first:pt-0">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => handleToggleItemSelect(key)}
                              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                            />
                            <div className="flex-1 text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-sky-700">{o.order_number}</span>
                                <span className="font-bold text-slate-900">{o.customer ? o.customer.company_name : 'Customer'}</span>
                                <span className="text-slate-400">•</span>
                                <span className="font-semibold text-slate-700 uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                                  {o.current_status.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </div>
                          </label>

                          {item.selected && (
                            <div className="ml-7 mt-3 p-3 bg-emerald-50/60 rounded-lg border border-emerald-100 space-y-2 text-xs">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Item Priority</label>
                                  <select
                                    value={item.priority}
                                    onChange={(e) => handleUpdateItemField(key, 'priority', e.target.value)}
                                    className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                                  >
                                    <option value="urgent">🔴 Urgent</option>
                                    <option value="high">🟠 High</option>
                                    <option value="medium">🔵 Medium</option>
                                    <option value="low">⚪ Low</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Action Required by Incoming Agent</label>
                                  <input
                                    type="text"
                                    value={item.action_required}
                                    onChange={(e) => handleUpdateItemField(key, 'action_required', e.target.value)}
                                    className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Handover Note</label>
                                <input
                                  type="text"
                                  value={item.note}
                                  onChange={(e) => handleUpdateItemField(key, 'note', e.target.value)}
                                  className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic">No pending orders at this time.</p>
                  )}
                </div>
              )}
            </div>

            {/* Product Availability Accordion */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenSection(openSection === 'products' ? '' as any : 'products')}
                className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-900 transition-colors"
              >
                <div className="flex items-center space-x-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span>Out-of-Stock Products ({pendingWork.products.length})</span>
                </div>
                {openSection === 'products' ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
              </button>

              {openSection === 'products' && (
                <div className="p-4 bg-white divide-y divide-slate-100 space-y-3">
                  {pendingWork.products.length > 0 ? (
                    pendingWork.products.map(p => {
                      const key = `product-${p.id}`;
                      const item = itemsMap[key];
                      if (!item) return null;
                      return (
                        <div key={p.id} className="pt-3 first:pt-0">
                          <label className="flex items-start space-x-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={item.selected}
                              onChange={() => handleToggleItemSelect(key)}
                              className="mt-0.5 rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                            />
                            <div className="flex-1 text-xs">
                              <div className="flex items-center space-x-2">
                                <span className="font-mono font-bold text-sky-700">{p.sku}</span>
                                <span className="font-bold text-slate-900">{p.product_name}</span>
                                <span className="text-[10px] bg-red-100 text-red-800 font-bold uppercase px-1.5 py-0.5 rounded">Out of Stock</span>
                              </div>
                            </div>
                          </label>

                          {item.selected && (
                            <div className="ml-7 mt-3 p-3 bg-red-50/60 rounded-lg border border-red-100 space-y-2 text-xs">
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                <div>
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Item Priority</label>
                                  <select
                                    value={item.priority}
                                    onChange={(e) => handleUpdateItemField(key, 'priority', e.target.value)}
                                    className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                                  >
                                    <option value="urgent">🔴 Urgent</option>
                                    <option value="high">🟠 High</option>
                                    <option value="medium">🔵 Medium</option>
                                    <option value="low">⚪ Low</option>
                                  </select>
                                </div>
                                <div className="sm:col-span-2">
                                  <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Action Required by Incoming Agent</label>
                                  <input
                                    type="text"
                                    value={item.action_required}
                                    onChange={(e) => handleUpdateItemField(key, 'action_required', e.target.value)}
                                    className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                                  />
                                </div>
                              </div>
                              <div>
                                <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">Handover Note</label>
                                <input
                                  type="text"
                                  value={item.note}
                                  onChange={(e) => handleUpdateItemField(key, 'note', e.target.value)}
                                  className="w-full p-1.5 text-xs border border-slate-300 rounded bg-white"
                                />
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 italic">No products currently Out of Stock.</p>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Form Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!summary.trim()}
              className="inline-flex items-center px-5 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-xs transition-colors space-x-1.5"
            >
              <Send className="w-4 h-4" />
              <span>Submit Shift Handover ({selectedItemsList.length} Items)</span>
            </button>
          </div>

        </form>

        {/* Confirmation Modal Overlay */}
        {showConfirmSubmit && (
          <div className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl text-center space-y-4 animate-in zoom-in-95 duration-150">
              <div className="w-12 h-12 bg-sky-100 text-sky-600 rounded-full flex items-center justify-center mx-auto">
                <Send className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Submit Shift Handover?</h3>
                <p className="text-xs text-slate-600 mt-1">
                  Once submitted, this handover and its {selectedItemsList.length} flagged item(s) will be immediately available to the incoming team.
                </p>
              </div>
              <div className="flex items-center justify-center space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowConfirmSubmit(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleConfirmSubmit}
                  className="px-5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Handover'}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
