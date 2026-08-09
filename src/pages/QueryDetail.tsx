import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CustomerQuery, QueryStatus, QueryActivity, QueryInternalNote, QueryAttachment } from '../types';
import { localDb } from '../services/db';
import { QueryFormModal } from '../components/queries/QueryFormModal';
import { QueryStatusModal } from '../components/queries/QueryStatusModal';
import { QueryAssignModal } from '../components/queries/QueryAssignModal';
import { Avatar, Badge, Button, Card, CardBody, CardHeader, EmptyState, Input, PageHeader, Tabs, Textarea, useToast } from '../components/ui';
import { getOrderStatusBadge, getProductAvailabilityBadge, getQueryPriorityBadge, getQueryStatusBadge } from '../utils/badges';
import { formatCurrency, formatDateTime } from '../utils/format';
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
  Paperclip,
  Upload,
  Download,
  File,
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
  const [uploadFileName, setUploadFileName] = useState('');

  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'attachments' | 'history'>('details');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<QueryStatus | null>(null);

  const isSalesAgent = hasRole('sales_agent');

  useEffect(() => {
    if (id) {
      loadQueryData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
            icon={<HelpCircle className="w-8 h-8" />}
            title="Support Ticket Not Found"
            description="The requested query ID does not exist or has been removed."
            action={
              <Link to="/queries" className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800">
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Queries Directory
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
    toast({ type: 'success', title: 'Note posted', message: 'Internal note added successfully.' });
  };

  const handleAddAttachment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFileName.trim() || !user) return;

    localDb.addQueryAttachment(
      query.id,
      uploadFileName.trim(),
      `/uploads/${uploadFileName.toLowerCase().replace(/\s+/g, '_')}`,
      1024 * 350,
      'application/pdf',
      user.id
    );
    setUploadFileName('');
    loadQueryData(query.id);
    toast({ type: 'success', title: 'File uploaded', message: 'Query attachment uploaded successfully.' });
  };

  const handleAssignSubmit = (queryId: string, assignedToUserId: string | null) => {
    if (!user) return;
    localDb.assignQuery(queryId, assignedToUserId, user.id);
    setIsAssignModalOpen(false);
    loadQueryData(queryId);
    toast({ type: 'success', title: 'Assignment updated', message: 'Agent assignment updated.' });
  };

  const handleStatusSubmit = (targetStatus: QueryStatus, extraData?: { resolution?: string; reopen_reason?: string; closure_reason?: string }) => {
    if (!user) return;
    try {
      localDb.changeQueryStatus(query.id, targetStatus, user.id, extraData);
      setStatusTarget(null);
      loadQueryData(query.id);
      toast({ type: 'success', title: 'Status updated', message: `Status updated to ${targetStatus.replace('_', ' ').toUpperCase()}.` });
    } catch (err: any) {
      toast({ type: 'error', title: 'Update failed', message: err.message || 'Error updating status.' });
    }
  };

  const handleEditSubmit = (data: any) => {
    localDb.updateQuery(query.id, data, user?.id || '');
    setIsEditModalOpen(false);
    loadQueryData(query.id);
    toast({ type: 'success', title: 'Ticket updated', message: 'Support ticket details saved.' });
  };

  const tabs = [
    { value: 'details' as const, label: 'Ticket Details & Customer', count: undefined },
    ...(!isSalesAgent
      ? [{ value: 'notes' as const, label: 'Internal Notes', count: internalNotes.length }]
      : []),
    { value: 'attachments' as const, label: 'Attachments', count: attachments.length },
    { value: 'history' as const, label: 'Audit Trail', count: activities.length },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/queries"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Queries Directory
        </Link>
      </div>

      <PageHeader
        icon={<HelpCircle className="w-5 h-5 text-brand-400" />}
        title={query.subject}
        description={
          <>
            {query.query_number} · Created {formatDateTime(query.created_at)}
            {query.created_by_profile ? ` by ${query.created_by_profile.full_name}` : ''}
          </>
        }
        badges={
          <>
            <Badge badge={getQueryStatusBadge(query.status)} />
            <Badge badge={getQueryPriorityBadge(query.priority)} />
            {query.category && (
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200 font-medium">
                {query.category.name}
              </span>
            )}
          </>
        }
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => setIsEditModalOpen(true)}>
              Edit Ticket
            </Button>
            <Button variant="outline" size="sm" icon={<UserCheck className="w-3.5 h-3.5" />} onClick={() => setIsAssignModalOpen(true)}>
              {query.assigned_to_profile ? 'Reassign Agent' : 'Assign Agent'}
            </Button>

            {(query.status === 'new' || query.status === 'open' || query.status === 'assigned') && (
              <Button variant="secondary" size="sm" onClick={() => handleStatusSubmit('in_progress')}>
                Start Progress
              </Button>
            )}

            {query.status === 'in_progress' && (
              <>
                <Button variant="outline" size="sm" onClick={() => handleStatusSubmit('waiting_customer')}>
                  Wait for Customer
                </Button>
                <Button variant="success" size="sm" icon={<CheckCircle2 className="w-3.5 h-3.5" />} onClick={() => setStatusTarget('resolved')}>
                  Mark Resolved
                </Button>
              </>
            )}

            {query.status === 'waiting_customer' && (
              <Button variant="secondary" size="sm" onClick={() => handleStatusSubmit('in_progress')}>
                Resume In Progress
              </Button>
            )}

            {query.status === 'resolved' && (
              <Button variant="secondary" size="sm" icon={<Lock className="w-3.5 h-3.5" />} onClick={() => setStatusTarget('closed')}>
                Close Ticket
              </Button>
            )}

            {(query.status === 'closed' || query.status === 'resolved') && (
              <Button size="sm" icon={<RotateCcw className="w-3.5 h-3.5" />} onClick={() => setStatusTarget('reopened')}>
                Reopen Ticket
              </Button>
            )}

            {query.status === 'reopened' && (
              <Button variant="secondary" size="sm" onClick={() => handleStatusSubmit('in_progress')}>
                Resume In Progress
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
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader icon={<FileText className="w-4 h-4 text-brand-600" />} title="Issue Description" />
              <CardBody>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {query.description}
                </div>
              </CardBody>
            </Card>

            {query.resolution && (
              <div className="bg-emerald-50 rounded-xl p-6 shadow-sm border border-emerald-200 space-y-2">
                <div className="flex items-center space-x-2 text-emerald-900 font-bold text-sm uppercase tracking-wider">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <span>Resolution Record</span>
                </div>
                <div className="p-4 bg-white rounded-lg border border-emerald-100 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {query.resolution}
                </div>
                <div className="text-xs text-emerald-700 pt-1">
                  Resolved on <span className="font-semibold">{formatDateTime(query.resolved_at!)}</span> by{' '}
                  <span className="font-semibold">{query.resolved_by_profile?.full_name || 'Support Agent'}</span>.
                </div>
              </div>
            )}

            {query.reopen_reason && (
              <div className="bg-amber-50 rounded-xl p-6 shadow-sm border border-amber-200 space-y-2">
                <div className="flex items-center space-x-2 text-amber-900 font-bold text-sm uppercase tracking-wider">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                  <span>Reopen Reason</span>
                </div>
                <div className="p-4 bg-white rounded-lg border border-amber-100 text-sm text-slate-800 leading-relaxed">
                  {query.reopen_reason}
                </div>
                <div className="text-xs text-amber-700 pt-1">
                  Reopened on <span className="font-semibold">{formatDateTime(query.reopened_at!)}</span> by{' '}
                  <span className="font-semibold">{query.reopened_by_profile?.full_name || 'Agent'}</span>.
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader icon={<Building2 className="w-4 h-4 text-brand-600" />} title="Customer Account" />
              <CardBody>
                {query.customer ? (
                  <div className="space-y-3">
                    <div>
                      <Link
                        to={`/customers/${query.customer.id}`}
                        className="text-base font-bold text-slate-900 hover:text-brand-600 block transition-colors"
                      >
                        {query.customer.company_name}
                      </Link>
                      <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 inline-block mt-1">
                        {query.customer.customer_code}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1.5 text-slate-600">
                      <div><span className="font-semibold text-slate-800">Contact:</span> {query.customer.contact_person || 'N/A'}</div>
                      <div><span className="font-semibold text-slate-800">Phone:</span> {query.customer.phone || 'N/A'}</div>
                      <div><span className="font-semibold text-slate-800">Email:</span> {query.customer.email || 'N/A'}</div>
                      <div><span className="font-semibold text-slate-800">Location:</span> {query.customer.city || 'N/A'}, {query.customer.country || 'USA'}</div>
                    </div>

                    <Link
                      to={`/customers/${query.customer.id}`}
                      className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                    >
                      View Full Customer Profile
                    </Link>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">No customer linked to this query.</p>
                )}
              </CardBody>
            </Card>

            {query.order && (
              <Card>
                <CardHeader icon={<ShoppingBag className="w-4 h-4 text-emerald-600" />} title="Related Customer Order" />
                <CardBody>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-brand-700 text-sm">{query.order.order_number}</span>
                      <Badge badge={getOrderStatusBadge(query.order.current_status)} />
                    </div>
                    <div className="text-slate-700 font-semibold">
                      Grand Total: <span className="font-mono font-bold text-slate-900">{formatCurrency(query.order.grand_total)}</span>
                    </div>
                    <Link
                      to={`/orders/${query.order.id}`}
                      className="w-full inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-300 mt-1"
                    >
                      View Order Fulfillment Workflow
                    </Link>
                  </div>
                </CardBody>
              </Card>
            )}

            {query.product && (
              <Card>
                <CardHeader icon={<Package className="w-4 h-4 text-purple-600" />} title="Related Catalog Product" />
                <CardBody>
                  <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-brand-700">{query.product.sku}</span>
                      <Badge badge={getProductAvailabilityBadge(query.product.availability_status)} />
                    </div>
                    <Link
                      to={`/products/${query.product.id}`}
                      className="font-bold text-slate-900 hover:text-brand-600 block text-sm"
                    >
                      {query.product.product_name}
                    </Link>
                    {query.product.availability_status === 'out_of_stock' && query.product.availability_notes && (
                      <div className="p-2 bg-red-50 text-red-800 rounded border border-red-200 text-[11px]">
                        Reason: {query.product.availability_notes}
                        {query.product.expected_available_date && (
                          <div className="font-mono mt-0.5">Expected: {new Date(query.product.expected_available_date).toLocaleDateString()}</div>
                        )}
                      </div>
                    )}
                    <Link
                      to={`/products/${query.product.id}`}
                      className="w-full inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-300 mt-1"
                    >
                      View Product Details & Availability
                    </Link>
                  </div>
                </CardBody>
              </Card>
            )}

            <Card>
              <CardHeader icon={<ShieldCheck className="w-4 h-4 text-purple-600" />} title="Assignment & Audit" />
              <CardBody className="space-y-3 text-xs">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-semibold uppercase block">Assigned Agent</span>
                  <span className="font-bold text-slate-900 text-sm mt-0.5 block">
                    {query.assigned_to_profile?.full_name || 'Unassigned Queue'}
                  </span>
                  {query.assigned_to_profile && (
                    <span className="text-slate-500 block mt-0.5">
                      Team: {query.assigned_to_profile.team?.name || 'Operations'} ({query.assigned_to_profile.role.replace('_', ' ')})
                    </span>
                  )}
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 space-y-1">
                  <div><span className="font-semibold text-slate-700">Created:</span> {formatDateTime(query.created_at)}</div>
                  <div><span className="font-semibold text-slate-700">Last Modified:</span> {formatDateTime(query.updated_at)}</div>
                  {query.closed_at && (
                    <div><span className="font-semibold text-slate-700">Closed:</span> {formatDateTime(query.closed_at)}</div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'notes' && !isSalesAgent && (
        <Card>
          <CardHeader icon={<MessageSquare className="w-4 h-4 text-brand-600" />} title="Confidential Internal Agent Notes" />
          <CardBody className="space-y-6">
            <form onSubmit={handleAddInternalNote} className="space-y-3">
              <Textarea
                rows={3}
                value={newNoteText}
                onChange={(e) => setNewNoteText(e.target.value)}
                placeholder="Post confidential internal note regarding customer contact, internal updates, or troubleshooting steps..."
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={!newNoteText.trim()} size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                  Post Internal Note
                </Button>
              </div>
            </form>

            <div className="space-y-4 pt-4 border-t border-slate-200">
              {internalNotes.length > 0 ? (
                internalNotes.map((note) => (
                  <div key={note.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between text-xs text-slate-500">
                      <div className="flex items-center space-x-2 font-semibold text-slate-900">
                        <Avatar name={note.author_profile?.full_name || 'System Agent'} size="sm" />
                        <span>{note.author_profile?.full_name || 'System Agent'}</span>
                        <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded capitalize font-normal">
                          {note.author_profile?.role.replace('_', ' ') || 'Agent'}
                        </span>
                      </div>
                      <span>{formatDateTime(note.created_at)}</span>
                    </div>
                    <p className="text-sm text-slate-800 leading-relaxed whitespace-pre-line pl-8">
                      {note.note}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-xs text-slate-500 italic text-center py-6">
                  No internal notes posted for this ticket yet.
                </p>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'attachments' && (
        <Card>
          <CardHeader icon={<Paperclip className="w-4 h-4 text-brand-600" />} title="Query Document Attachments" />
          <CardBody className="space-y-6">
            <form onSubmit={handleAddAttachment} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label className="block text-xs font-bold uppercase text-slate-700">Upload Attachment / Document</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <Input
                  type="text"
                  value={uploadFileName}
                  onChange={(e) => setUploadFileName(e.target.value)}
                  placeholder="Enter file document name (e.g. Invoice_Copy.pdf, Customer_Screenshot.png)..."
                  className="flex-1"
                />
                <Button type="submit" disabled={!uploadFileName.trim()} icon={<Upload className="w-4 h-4" />}>
                  Upload Document
                </Button>
              </div>
            </form>

            <div className="space-y-3">
              {attachments.length > 0 ? (
                attachments.map((att) => (
                  <div key={att.id} className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-3">
                      <div className="w-9 h-9 bg-brand-50 text-brand-600 rounded-lg flex items-center justify-center border border-brand-100 font-bold">
                        <File className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{att.file_name}</div>
                        <div className="text-[11px] text-slate-500">
                          Uploaded by {att.uploaded_by_profile ? att.uploaded_by_profile.full_name : 'Agent'} on {formatDateTime(att.uploaded_at)}
                        </div>
                      </div>
                    </div>
                    <a
                      href="#"
                      onClick={(e) => { e.preventDefault(); alert(`Downloading file attachment ${att.file_name}`); }}
                      className="inline-flex items-center px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-lg transition-colors space-x-1 border border-slate-200"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download</span>
                    </a>
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-xs text-slate-400 italic bg-slate-50 rounded-xl border border-slate-200">
                  No file attachments uploaded for this ticket yet.
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader icon={<Activity className="w-4 h-4 text-brand-600" />} title="Immutable Ticket Activity Audit Log" />
          <CardBody>
            {activities.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                {activities.map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-brand-500 border-2 border-white ring-4 ring-brand-50"></div>
                    <div className="text-xs font-semibold text-slate-500 flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(act.created_at)}</span>
                    </div>
                    <p className="text-sm font-bold text-slate-900 mt-1">
                      {act.description}
                    </p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      Performed by: <span className="font-semibold text-slate-800">{act.performed_by_profile?.full_name || 'System'}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Activity className="w-7 h-7" />} title="No audit activity yet" description="Activity for this ticket will appear here as it is worked on." />
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
    </div>
  );
};
