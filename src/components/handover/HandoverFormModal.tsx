import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { Team, HandoverEntityType, HandoverFormInput } from '../../types';
import { Button, ConfirmDialog, Input, Modal, Select, Textarea } from '../ui';
import { HelpCircle, ShoppingBag, Package, ChevronDown, ChevronUp, FileText, Send } from 'lucide-react';

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

type Section = 'queries' | 'orders' | 'products';

const priorityOptions = [
  { value: 'urgent', label: 'Urgent' },
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

export const HandoverFormModal: React.FC<HandoverFormModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();

  const teams = useMemo(() => localDb.getTeams(), []);

  const outgoingTeam = useMemo(() => {
    if (!user) return null;
    return teams.find((t) => t.id === user.team_id) || teams[0];
  }, [user, teams]);

  const defaultIncomingTeamId = useMemo(() => {
    if (!outgoingTeam) return teams[0]?.id || '';
    const other = teams.find((t) => t.id !== outgoingTeam.id);
    return other ? other.id : teams[0]?.id || '';
  }, [outgoingTeam, teams]);

  const [incomingTeamId, setIncomingTeamId] = useState(defaultIncomingTeamId);
  const [summary, setSummary] = useState('');
  const [importantNotes, setImportantNotes] = useState('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pendingWork = useMemo(() => {
    if (!outgoingTeam) return { queries: [], orders: [], products: [] };
    return localDb.getPendingWorkForHandover(outgoingTeam.id);
  }, [outgoingTeam]);

  const [itemsMap, setItemsMap] = useState<Record<string, SelectedItemState>>(() => {
    const initialMap: Record<string, SelectedItemState> = {};

    pendingWork.queries.forEach((q) => {
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

    pendingWork.orders.forEach((o) => {
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

    pendingWork.products.forEach((p) => {
      initialMap[`product-${p.id}`] = {
        selected: false,
        entity_type: 'product',
        entity_id: p.id,
        display_code: p.sku,
        title: p.product_name,
        subtitle: `Reason: ${p.availability_notes || 'Out of Stock'}${p.expected_available_date ? ` (Expected: ${p.expected_available_date})` : ''}`,
        priority: 'urgent',
        note: `Product ${p.sku} is currently Out of Stock.`,
        action_required: `Verify supplier availability and notify waiting customers.`,
      };
    });

    return initialMap;
  });

  const [openSection, setOpenSection] = useState<Section>('queries');

  if (!isOpen || !user || !outgoingTeam) return null;

  const handleToggleItemSelect = (key: string) => {
    setItemsMap((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        selected: !prev[key].selected,
      },
    }));
  };

  const handleUpdateItemField = (key: string, field: 'priority' | 'note' | 'action_required', val: string) => {
    setItemsMap((prev) => ({
      ...prev,
      [key]: {
        ...prev[key],
        [field]: val,
      },
    }));
  };

  const selectedItemsList = Object.values(itemsMap).filter((i) => i.selected);

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
        items: selectedItemsList.map((item) => ({
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

  const renderAccordionSection = (section: Section, label: string, icon: React.ReactNode) => {
    const count = pendingWork[section].length;
    const isOpenSection = openSection === section;
    const accentMap: Record<Section, string> = {
      queries: 'text-sky-600',
      orders: 'text-emerald-600',
      products: 'text-purple-600',
    };
    const panelMap: Record<Section, string> = {
      queries: 'bg-sky-50/60 border-sky-100',
      orders: 'bg-emerald-50/60 border-emerald-100',
      products: 'bg-red-50/60 border-red-100',
    };
    const checkboxMap: Record<Section, string> = {
      queries: 'text-sky-600 focus:ring-sky-500',
      orders: 'text-emerald-600 focus:ring-emerald-500',
      products: 'text-red-600 focus:ring-red-500',
    };

    return (
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenSection(isOpenSection ? ('' as unknown as Section) : section)}
          className="w-full p-3.5 bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs font-bold text-slate-900 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className={accentMap[section]}>{icon}</span>
            <span>{label} ({count})</span>
          </div>
          {isOpenSection ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>

        {isOpenSection && (
          <div className="p-4 bg-white space-y-3">
            {count > 0 ? (
              pendingWork[section].map((record) => {
                const id = record.id;
                const key = `${section}-${id}`;
                const item = itemsMap[key];
                if (!item) return null;

                const displayCode = item.display_code;
                const title = item.title;
                const badge =
                  section === 'orders' ? (
                    <span className="font-semibold text-slate-700 uppercase text-[10px] bg-slate-100 px-1.5 py-0.5 rounded">
                      {(record as { current_status: string }).current_status.replace(/_/g, ' ')}
                    </span>
                  ) : section === 'products' ? (
                    <span className="text-[10px] bg-red-100 text-red-800 font-bold uppercase px-1.5 py-0.5 rounded">
                      Out of Stock
                    </span>
                  ) : null;

                return (
                  <div key={id} className="pt-3 first:pt-0">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={item.selected}
                        onChange={() => handleToggleItemSelect(key)}
                        className={`mt-0.5 rounded ${checkboxMap[section]} w-4 h-4`}
                      />
                      <div className="flex-1 text-xs">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-brand-700">{displayCode}</span>
                          <span className="font-bold text-slate-900">{title}</span>
                          {badge}
                        </div>
                      </div>
                    </label>

                    {item.selected && (
                      <div className={`ml-7 mt-3 p-3 rounded-lg border space-y-2 text-xs ${panelMap[section]}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                              Item Priority
                            </label>
                            <Select
                              value={item.priority}
                              onChange={(e) => handleUpdateItemField(key, 'priority', e.target.value)}
                              className="text-xs"
                            >
                              {priorityOptions.map((o) => (
                                <option key={o.value} value={o.value}>{o.label}</option>
                              ))}
                            </Select>
                          </div>
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                              Action Required by Incoming Agent
                            </label>
                            <Input
                              type="text"
                              value={item.action_required}
                              onChange={(e) => handleUpdateItemField(key, 'action_required', e.target.value)}
                              className="text-xs"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-slate-500 mb-0.5">
                            Handover Note
                          </label>
                          <Input
                            type="text"
                            value={item.note}
                            onChange={(e) => handleUpdateItemField(key, 'note', e.target.value)}
                            className="text-xs"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 italic">No records available at this time.</p>
            )}
          </div>
        )}
      </div>
    );
  };

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
        title="Create Shift Handover"
        subtitle="Record shift operations, pending tasks, and urgent operational notices for incoming team"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Outgoing Team (Your Team)
              </label>
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs font-bold text-slate-900 flex items-center justify-between">
                <span>{outgoingTeam.name}</span>
                <span className="font-mono text-[11px] text-slate-500 font-normal">{outgoingTeam.shift_info}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-slate-500 mb-1">
                Receiving Incoming Team <span className="text-red-500">*</span>
              </label>
              <Select
                value={incomingTeamId}
                onChange={(e) => setIncomingTeamId(e.target.value)}
                required
                className="font-semibold"
              >
                {teams
                  .filter((t) => t.id !== outgoingTeam.id)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.shift_info})
                    </option>
                  ))}
              </Select>
            </div>
          </div>

          <div className="space-y-4">
            <Textarea
              label={<>Shift Operational Summary <span className="text-red-500">*</span></>}
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              rows={3}
              required
              placeholder="Provide a clear general summary of operational work completed and high-level shift activities..."
            />

            <Textarea
              label="Important Free-Text Operational Notes (Optional)"
              value={importantNotes}
              onChange={(e) => setImportantNotes(e.target.value)}
              rows={2}
              placeholder="Specific customer instructions, carrier delays, supplier updates, or team messages..."
            />
          </div>

          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Select Pending Operational Records for Handover</h3>
              <p className="text-xs text-slate-500">
                Check important records from existing CRM modules to hand over to incoming agents (
                {selectedItemsList.length} Selected)
              </p>
            </div>

            {renderAccordionSection('queries', 'Unresolved Support Queries', <HelpCircle className="w-4 h-4" />)}
            {renderAccordionSection('orders', 'Pending Customer Orders', <ShoppingBag className="w-4 h-4" />)}
            {renderAccordionSection('products', 'Out-of-Stock Products', <Package className="w-4 h-4" />)}
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={!summary.trim()} icon={<Send className="w-4 h-4" />}>
              Submit Shift Handover ({selectedItemsList.length} Items)
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={showConfirmSubmit}
        onClose={() => setShowConfirmSubmit(false)}
        onConfirm={handleConfirmSubmit}
        title="Submit Shift Handover?"
        message={`Once submitted, this handover and its ${selectedItemsList.length} flagged item(s) will be immediately available to the incoming team.`}
        confirmLabel={isSubmitting ? 'Submitting...' : 'Submit Handover'}
        variant="primary"
        loading={isSubmitting}
        icon={<Send className="w-6 h-6" />}
      />
    </>
  );
};
