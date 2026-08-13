import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CustomerQuery, QueryStatus, QueryActivity, QueryInternalNote, QueryAttachment, BackOrderStatus } from '../types';
import { localDb } from '../services/db';
import { QUERY_ISSUE_CATEGORIES, QUERY_STATUS_CONFIG, BACK_ORDER_STATUS_CONFIG } from '../utils/queryConstants';
import { formatDateShort } from '../utils/dateUtils';
import { formatDateTime } from '../utils/format';
import { QueryFormModal } from '../components/queries/QueryFormModal';
import { QueryStatusModal } from '../components/queries/QueryStatusModal';
import { QueryAssignModal } from '../components/queries/QueryAssignModal';
import { CreateBackOrderModal } from '../components/queries/CreateBackOrderModal';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, EmptyState, PageHeader, Select, Tabs, Textarea, useToast } from '../components/ui';
import {
  ArrowLeft,
  HelpCircle,
  Building2,
  UserCheck,
  ShieldCheck,
  Edit,
  RotateCcw,
  Lock,
  CheckCircle2,
  MessageSquare,
  FileText,
  Activity,
  Send,
  Calendar,
  ShoppingBag,
  Package,
  CalendarPlus,
  Truck,
  Plus,
} from 'lucide-react';

export const QueryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();

  const [query, setQuery] = useState<CustomerQuery | null>(null);
  const [activities, setActivities] = useState<QueryActivity[]>([]);
  const [internalNotes, setInternalNotes] = useState<QueryInternalNote[]>([]);
  const [attachments, setAttachments] = useState<QueryAttachment[]>([]);
  const [newNoteText, setNewNoteText] = useState('');

  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'history'>('details');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isBackOrderModalOpen, setIsBackOrderModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<QueryStatus | null>(null);

  const isSalesAgent = hasRole('sales_agent');

  useEffect(() => {
    if (id) {
      loadQueryData(id);
    }
  }, [id]);

  const loadQueryData = (queryId: string) => {
    const q = localDb.getQueryById(queryId);
    setQuery(q);
    if (q) {
      setActivities(localDb.getQueryActivities(q.id));
      setInternalNotes(localDb.getQueryInternalNotes(q.id));
      setAttachments(localDb.getQueryAttachments(q.id));
    }
  };

  if (!query) {
    return (
      <div className="max-w-xl mx-auto mt-16">
        <Card className="p-10">
          <EmptyState
            icon={<HelpCircle className="w-8 h-8 text-slate-400" />}
            title="Query Not Found"
            description="The requested query does not exist or has been removed."
            action={
              <Link to="/queries" className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800">
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Queries List
              </Link>
            }
          />
        </Card>
      </div>
    );
  }

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !user) return;

    localDb.addQueryInternalNote(query.id, newNoteText.trim(), user.id);
    setNewNoteText('');
    loadQueryData(query.id);
    toast({ type: 'success', title: 'Note Posted', message: 'Internal note added successfully.' });
  };

  const handleAssignSubmit = (queryId: string, assignedToUserId: string | null) => {
    if (!user) return;
    localDb.assignQuery(queryId, assignedToUserId, user.id);
    setIsAssignModalOpen(false);
    loadQueryData(queryId);
    toast({ type: 'success', title: 'Assignment Updated', message: 'Agent assignment updated.' });
  };

  const handleStatusSubmit = (targetStatus: QueryStatus, extraData?: { resolution?: string; reopen_reason?: string; closure_reason?: string }) => {
    if (!user) return;
    try {
      localDb.changeQueryStatus(query.id, targetStatus, user.id, extraData);
      setStatusTarget(null);
      loadQueryData(query.id);
      toast({ type: 'success', title: 'Status Updated', message: `Query status updated to ${targetStatus.toUpperCase()}.` });
    } catch (err: any) {
      toast({ type: 'error', title: 'Update Failed', message: err.message || 'Error updating status.' });
    }
  };

  const handleUpdateBackOrderStatus = (boId: string, newStatus: BackOrderStatus) => {
    try {
      localDb.updateBackOrderStatus(boId, newStatus);
      loadQueryData(query.id);
      toast({ type: 'success', title: 'Back Order Updated', message: `Status updated to ${newStatus}.` });
    } catch {
      toast({ type: 'error', title: 'Update Failed', message: 'Could not update Back Order status.' });
    }
  };

  const handleEditSubmit = (data: any) => {
    localDb.updateQuery(query.id, data, user?.id || '');
    setIsEditModalOpen(false);
    loadQueryData(query.id);
    toast({ type: 'success', title: 'Query Updated', message: 'Query details saved.' });
  };

  const categoryMeta = QUERY_ISSUE_CATEGORIES.find((c) => c.key === query.issue_type) || QUERY_ISSUE_CATEGORIES[5];
  const statusConf = QUERY_STATUS_CONFIG[query.status] || QUERY_STATUS_CONFIG.open;

  const getReferenceLabel = () => {
    if (query.reference_label) return query.reference_label;
    if (query.product) return `${query.product.product_name} (${query.product.sku})`;
    if (query.order) return `Order #${query.order.order_number}`;
    if (query.invoice_number_ref) return `Invoice ${query.invoice_number_ref}`;
    return '—';
  };

  const tabs = [
    { value: 'details' as const, label: 'Query Details', count: undefined },
    ...(!isSalesAgent
      ? [{ value: 'notes' as const, label: 'Notes', count: internalNotes.length }]
      : []),
    { value: 'history' as const, label: 'Activity Log', count: activities.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/queries"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Queries
        </Link>
      </div>

      <PageHeader
        icon={<HelpCircle className="w-5 h-5 text-brand-500" />}
        title={query.query_number}
        description={`Created ${formatDateTime(query.created_at)}`}
        badges={
          <>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-extrabold border ${statusConf.badgeClass}`}>
              {statusConf.label}
            </span>
            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-extrabold border ${categoryMeta.badgeClass}`}>
              {categoryMeta.name}
            </span>
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => setIsEditModalOpen(true)}>
              Edit
            </Button>
            
            <Button variant="outline" size="sm" icon={<UserCheck className="w-3.5 h-3.5" />} onClick={() => setIsAssignModalOpen(true)}>
              {query.assigned_to_profile ? 'Reassign' : 'Assign Agent'}
            </Button>

            <Button variant="outline" size="sm" className="border-teal-300 text-teal-800 bg-teal-50 hover:bg-teal-100 font-bold" icon={<CalendarPlus className="w-3.5 h-3.5 text-teal-600" />} onClick={() => setIsBackOrderModalOpen(true)}>
              + Create Back Order
            </Button>

            {(query.status === 'new' || query.status === 'open' || query.status === 'assigned') && (
              <Button variant="secondary" size="sm" onClick={() => handleStatusSubmit('in_progress')}>
                Start Working
              </Button>
            )}

            {query.status === 'in_progress' && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleStatusSubmit('waiting_customer')}>
                  Wait for Info
                </Button>
                <Button variant="success" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={() => setStatusTarget('resolved')}>
                  Resolve Query
                </Button>
              </>
            )}

            {query.status === 'waiting_customer' && (
              <Button variant="secondary" size="sm" onClick={() => handleStatusSubmit('in_progress')}>
                Resume Working
              </Button>
            )}

            {query.status === 'resolved' && (
              <Button variant="secondary" size="sm" icon={<Lock className="w-3.5 h-3.5" />} onClick={() => setStatusTarget('closed')}>
                Close Query
              </Button>
            )}

            {(query.status === 'closed' || query.status === 'resolved') && (
              <Button size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => setStatusTarget('reopened')}>
                Reopen Query
              </Button>
            )}
          </div>
        }
      />

      <Tabs
        size="md"
        tabs={tabs.map((t) => ({ value: t.value, label: t.label, count: t.count }))}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Details Panel */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader icon={<FileText className="w-4 h-4 text-brand-600" />} title="QUERY DETAILS" />
              <CardBody className="space-y-4">
                {/* Customer */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-extrabold uppercase text-slate-500 block mb-0.5">CUSTOMER</span>
                  {query.customer ? (
                    <div className="flex items-center justify-between">
                      <div>
                        <Link to={`/customers/${query.customer.id}`} className="font-extrabold text-slate-900 text-base hover:text-brand-600">
                          {query.customer.company_name}
                        </Link>
                        {query.customer.city && (
                          <span className="text-xs text-slate-500 block font-semibold">{query.customer.city}</span>
                        )}
                      </div>
                      <span className="font-mono text-xs font-bold text-brand-700 bg-white px-2 py-0.5 rounded border border-brand-200">
                        {query.customer.customer_code}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-slate-800">Unspecified Customer</span>
                  )}
                </div>

                {/* Category */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-extrabold uppercase text-slate-500 block mb-1">CATEGORY</span>
                  <span className={`inline-flex px-3 py-1 rounded-full text-xs font-extrabold border ${categoryMeta.badgeClass}`}>
                    {categoryMeta.name}
                  </span>
                </div>

                {/* Reference */}
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-[11px] font-extrabold uppercase text-slate-500 block mb-0.5">REFERENCE</span>
                  <span className="text-sm font-bold text-slate-900 block">{getReferenceLabel()}</span>
                </div>

                {/* Issue Explanation */}
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[11px] font-extrabold uppercase text-slate-500 block">EXPLAIN THE ISSUE</span>
                  <p className="text-sm text-slate-900 font-medium leading-relaxed whitespace-pre-line">
                    {query.description}
                  </p>
                </div>
              </CardBody>
            </Card>

            {/* Back Order Card if exists */}
            {query.back_order && (
              <Card className="border-teal-200 bg-teal-50/30">
                <CardHeader icon={<CalendarPlus className="w-4 h-4 text-teal-600" />} title="CONNECTED BACK ORDER" />
                <CardBody className="space-y-3">
                  <div className="p-4 bg-white rounded-xl border border-teal-200 space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                      <div>
                        <span className="font-extrabold text-slate-900 text-sm block">{query.back_order.product_name_snapshot}</span>
                        {query.back_order.sku_snapshot && (
                          <span className="font-mono text-slate-500 text-[11px]">SKU: {query.back_order.sku_snapshot}</span>
                        )}
                      </div>
                      <div className="text-right">
                        <span className="text-slate-500 block text-[11px]">Quantity</span>
                        <span className="font-mono font-extrabold text-teal-800 text-base">{query.back_order.quantity}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="flex items-center gap-1.5 font-bold text-teal-800 bg-teal-50 px-3 py-1.5 rounded-lg border border-teal-200">
                        <Truck className="w-4 h-4 text-teal-600" />
                        <span>Next Delivery: {formatDateShort(query.back_order.next_delivery_date)}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-slate-600 font-semibold">Status:</span>
                        <Select
                          value={query.back_order.status}
                          onChange={(e) => handleUpdateBackOrderStatus(query.back_order!.id, e.target.value as BackOrderStatus)}
                          className="w-36 text-xs font-bold"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="SENT">Sent</option>
                          <option value="COMPLETED">Completed</option>
                        </Select>
                      </div>
                    </div>
                  </div>
                </CardBody>
              </Card>
            )}

            {/* Resolution Record */}
            {query.resolution && (
              <div className="bg-emerald-50 rounded-xl p-5 border border-emerald-200 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>RESOLUTION RECORD</span>
                </div>
                <p className="p-3 bg-white rounded-lg border border-emerald-100 text-sm text-slate-800 whitespace-pre-line">
                  {query.resolution}
                </p>
                <div className="text-xs text-emerald-700">
                  Resolved on {formatDateTime(query.resolved_at!)} by {query.resolved_by_profile?.full_name || 'Agent'}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader icon={<ShieldCheck className="w-4 h-4 text-slate-600" />} title="STATUS & ASSIGNMENT" />
              <CardBody className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-semibold uppercase block">Assigned Agent</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {query.assigned_to_profile?.full_name || 'Unassigned'}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div><span className="font-semibold text-slate-700">Created:</span> {formatDateTime(query.created_at)}</div>
                  <div><span className="font-semibold text-slate-700">Last Modified:</span> {formatDateTime(query.updated_at)}</div>
                </div>
              </CardBody>
            </Card>

            {query.customer && (
              <Card>
                <CardHeader icon={<Building2 className="w-4 h-4 text-brand-600" />} title="CUSTOMER PROFILE" />
                <CardBody className="space-y-2 text-xs">
                  <div className="font-bold text-slate-900 text-sm">{query.customer.company_name}</div>
                  {query.customer.phone && <div className="text-slate-600">Phone: {query.customer.phone}</div>}
                  {query.customer.city && <div className="text-slate-600">City: {query.customer.city}</div>}
                  <Link
                    to={`/customers/${query.customer.id}`}
                    className="w-full inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200 mt-1"
                  >
                    View Customer Profile
                  </Link>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* NOTES TAB */}
      {activeTab === 'notes' && !isSalesAgent && (
        <Card>
          <CardHeader icon={<MessageSquare className="w-4 h-4 text-brand-600" />} title="INTERNAL NOTES" />
          <CardBody className="space-y-6">
            <form onSubmit={handleAddInternalNote} className="space-y-3">
              <Textarea
                rows={3}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Post internal note regarding this query..."
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={!newNoteText.trim()} size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                  Post Note
                </Button>
              </div>
            </form>

            <div className="space-y-3 pt-3 border-t border-slate-200">
              {internalNotes.length > 0 ? (
                internalNotes.map((note) => (
                  <div key={note.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
                    <div className="flex items-center justify-between text-slate-500 font-semibold">
                      <span>{note.author_profile?.full_name || 'Agent'}</span>
                      <span>{formatDateTime(note.created_at)}</span>
                    </div>
                    <p className="text-slate-800 text-sm whitespace-pre-line">{note.note}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-400 italic text-center py-4">No internal notes posted yet.</p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* ACTIVITY LOG TAB */}
      {activeTab === 'history' && (
        <Card>
          <CardHeader icon={<Activity className="w-4 h-4 text-brand-600" />} title="ACTIVITY AUDIT TRAIL" />
          <CardBody>
            {activities.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-4 text-xs">
                {activities.map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-brand-500 border-2 border-white"></div>
                    <span className="text-slate-400 font-semibold">{formatDateTime(act.created_at)}</span>
                    <p className="font-bold text-slate-900 text-sm mt-0.5">{act.description}</p>
                    <p className="text-slate-500">By {act.performed_by_profile?.full_name || 'System'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Activity className="w-7 h-7" />} title="No activity recorded" description="Query activity will appear here." />
            )}
          </CardBody>
        </Card>
      )}

      <QueryFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={handleEditSubmit}
        queryToEdit={query}
      />

      <QueryAssignModal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        onSubmit={handleAssignSubmit}
        query={query}
      />

      <QueryStatusModal
        isOpen={!!statusTarget}
        onClose={() => setStatusTarget(null)}
        onSubmit={handleStatusSubmit}
        query={query}
        targetStatus={statusTarget}
      />

      <CreateBackOrderModal
        isOpen={isBackOrderModalOpen}
        onClose={() => setIsBackOrderModalOpen(false)}
        query={query}
        onSuccess={() => loadQueryData(query.id)}
      />
    </div>
  );
};
