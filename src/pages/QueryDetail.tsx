import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { CustomerQuery, QueryStatus, QueryPriority, QueryActivity, QueryInternalNote, QueryAttachment, Order } from '../types';
import { localDb } from '../services/db';
import { QueryFormModal } from '../components/queries/QueryFormModal';
import { QueryStatusModal } from '../components/queries/QueryStatusModal';
import { QueryAssignModal } from '../components/queries/QueryAssignModal';
import { 
  ArrowLeft, 
  HelpCircle, 
  Building2, 
  UserCheck, 
  Clock, 
  ShieldCheck, 
  Edit, 
  RotateCcw, 
  Lock, 
  CheckCircle2, 
  AlertTriangle, 
  MessageSquare, 
  FileText, 
  Activity,
  Send,
  User,
  Calendar,
  AlertCircle,
  ShoppingBag,
  Eye,
  ArrowRight,
  Package,
  Paperclip,
  Upload,
  Download,
  File
} from 'lucide-react';

export const QueryDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [query, setQuery] = useState<CustomerQuery | null>(null);
  const [activities, setActivities] = useState<QueryActivity[]>([]);
  const [internalNotes, setInternalNotes] = useState<QueryInternalNote[]>([]);
  const [attachments, setAttachments] = useState<QueryAttachment[]>([]);
  const [newNoteText, setNewNoteText] = useState('');
  const [uploadFileName, setUploadFileName] = useState('');

  const [activeTab, setActiveTab] = useState<'details' | 'notes' | 'attachments' | 'history'>('details');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<QueryStatus | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

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

  const customerOrders = useMemo(() => {
    if (!query?.customer_id) return [];
    return localDb.getOrders({ customer_id: query.customer_id });
  }, [query?.customer_id]);

  if (!query) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200 my-8">
        <HelpCircle className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800 mb-1">Support Ticket Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The requested query ID does not exist or has been removed.</p>
        <Link
          to="/queries"
          className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Queries Directory
        </Link>
      </div>
    );
  }

  const handleAddInternalNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNoteText.trim() || !user) return;

    localDb.addQueryInternalNote(query.id, newNoteText.trim(), user.id);
    setNewNoteText('');
    loadQueryData(query.id);
    setFeedback({ type: 'success', message: 'Internal Note added successfully.' });
    setTimeout(() => setFeedback(null), 3000);
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
    setFeedback({ type: 'success', message: 'Query attachment uploaded successfully.' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAssignSubmit = (queryId: string, assignedToUserId: string | null) => {
    if (!user) return;
    localDb.assignQuery(queryId, assignedToUserId, user.id);
    setIsAssignModalOpen(false);
    loadQueryData(queryId);
    setFeedback({ type: 'success', message: 'Agent assignment updated.' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleStatusSubmit = (targetStatus: QueryStatus, extraData?: { resolution?: string; reopen_reason?: string; closure_reason?: string }) => {
    if (!user) return;
    try {
      localDb.changeQueryStatus(query.id, targetStatus, user.id, extraData);
      setStatusTarget(null);
      loadQueryData(query.id);
      setFeedback({ type: 'success', message: `Status updated to ${targetStatus.replace('_', ' ').toUpperCase()}.` });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating status.' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  const getPriorityBadgeStyle = (priority: QueryPriority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'low': return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const getStatusBadgeStyle = (status: QueryStatus) => {
    switch (status) {
      case 'new':
      case 'open': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'assigned': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'in_progress': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'waiting_customer': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'resolved': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'closed': return 'bg-slate-100 text-slate-700 border-slate-200';
      case 'reopened': return 'bg-rose-100 text-rose-800 border-rose-200';
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar Back Link */}
      <div>
        <Link
          to="/queries"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Queries Directory
        </Link>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-sm animate-in fade-in duration-200 ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Main Ticket Banner Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-mono text-sm font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-md border border-sky-200">
              {query.query_number}
            </span>
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase border ${getStatusBadgeStyle(query.status)}`}>
              {query.status.replace('_', ' ')}
            </span>
            <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase border ${getPriorityBadgeStyle(query.priority)}`}>
              {query.priority} Priority
            </span>
            {query.category && (
              <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded border border-slate-200 font-medium">
                {query.category.name}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {query.subject}
          </h1>

          <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
            <span>Created {new Date(query.created_at).toLocaleString()}</span>
            {query.created_by_profile && (
              <>
                <span>•</span>
                <span>By {query.created_by_profile.full_name}</span>
              </>
            )}
          </p>
        </div>

        {/* Workflow Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Edit Ticket Details */}
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="inline-flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs rounded-lg transition-colors border border-slate-300"
          >
            <Edit className="w-3.5 h-3.5 mr-1" />
            <span>Edit Ticket</span>
          </button>

          {/* Assign Agent */}
          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="inline-flex items-center px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs rounded-lg transition-colors border border-slate-300"
          >
            <UserCheck className="w-3.5 h-3.5 mr-1.5" />
            <span>{query.assigned_to_profile ? 'Reassign Agent' : 'Assign Agent'}</span>
          </button>

          {/* Workflow Status Transitions */}
          {(query.status === 'new' || query.status === 'open' || query.status === 'assigned') && (
            <button
              onClick={() => handleStatusSubmit('in_progress')}
              className="inline-flex items-center px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              <span>Start Progress</span>
            </button>
          )}

          {query.status === 'in_progress' && (
            <>
              <button
                onClick={() => handleStatusSubmit('waiting_customer')}
                className="inline-flex items-center px-3 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
              >
                <span>Wait for Customer</span>
              </button>
              <button
                onClick={() => setStatusTarget('resolved')}
                className="inline-flex items-center px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                <span>Mark Resolved</span>
              </button>
            </>
          )}

          {query.status === 'waiting_customer' && (
            <button
              onClick={() => handleStatusSubmit('in_progress')}
              className="inline-flex items-center px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              <span>Resume In Progress</span>
            </button>
          )}

          {query.status === 'resolved' && (
            <button
              onClick={() => setStatusTarget('closed')}
              className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 mr-1.5" />
              <span>Close Ticket</span>
            </button>
          )}

          {(query.status === 'closed' || query.status === 'resolved') && (
            <button
              onClick={() => setStatusTarget('reopened')}
              className="inline-flex items-center px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              <RotateCcw className="w-3.5 h-3.5 mr-1.5" />
              <span>Reopen Ticket</span>
            </button>
          )}

          {query.status === 'reopened' && (
            <button
              onClick={() => handleStatusSubmit('in_progress')}
              className="inline-flex items-center px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs"
            >
              <span>Resume In Progress</span>
            </button>
          )}

        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('details')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'details'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Ticket Details & Customer
        </button>

        {!isSalesAgent && (
          <button
            onClick={() => setActiveTab('notes')}
            className={`pb-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
              activeTab === 'notes'
                ? 'border-sky-600 text-sky-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Internal Notes</span>
            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-normal">
              {internalNotes.length}
            </span>
          </button>
        )}

        <button
          onClick={() => setActiveTab('attachments')}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'attachments'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Paperclip className="w-4 h-4" />
          <span>Attachments</span>
          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-normal">
            {attachments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'history'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Audit Trail History</span>
          <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-normal">
            {activities.length}
          </span>
        </button>
      </div>

      {/* Tab 1: Ticket Details & Customer */}
      {activeTab === 'details' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Description & Resolution */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Description Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <FileText className="w-4 h-4 text-sky-600" />
                <span>Issue Description</span>
              </h3>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                {query.description}
              </div>
            </div>

            {/* Resolution Banner (If Resolved or Closed) */}
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
                  Resolved on <span className="font-semibold">{new Date(query.resolved_at!).toLocaleString()}</span> by{' '}
                  <span className="font-semibold">{query.resolved_by_profile?.full_name || 'Support Agent'}</span>.
                </div>
              </div>
            )}

            {/* Reopen Reason Banner (If Reopened) */}
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
                  Reopened on <span className="font-semibold">{new Date(query.reopened_at!).toLocaleString()}</span> by{' '}
                  <span className="font-semibold">{query.reopened_by_profile?.full_name || 'Agent'}</span>.
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Customer Card, Related Order, Related Product, & Assignment */}
          <div className="space-y-6">
            
            {/* Customer Info Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>Customer Account</span>
              </h3>

              {query.customer ? (
                <div className="space-y-3">
                  <div>
                    <Link
                      to={`/customers/${query.customer.id}`}
                      className="text-base font-bold text-slate-900 hover:text-sky-600 block transition-colors"
                    >
                      {query.customer.company_name}
                    </Link>
                    <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 inline-block mt-1">
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
            </div>

            {/* Related Customer Order Card */}
            {query.order && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3 text-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <ShoppingBag className="w-4 h-4 text-emerald-600" />
                  <span>Related Customer Order</span>
                </h3>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-700 text-sm">{query.order.order_number}</span>
                    <span className="text-[10px] bg-sky-100 text-sky-800 font-bold uppercase px-2 py-0.5 rounded">
                      {query.order.current_status.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="text-slate-700 font-semibold">
                    Grand Total: <span className="font-mono font-bold text-slate-900">${query.order.grand_total.toFixed(2)}</span>
                  </div>

                  <Link
                    to={`/orders/${query.order.id}`}
                    className="w-full inline-flex items-center justify-center px-2.5 py-1.5 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 rounded border border-slate-300 mt-1"
                  >
                    View Order Fulfillment Workflow
                  </Link>
                </div>
              </div>
            )}

            {/* Related Product Card */}
            {query.product && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3 text-xs">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span>Related Catalog Product</span>
                </h3>

                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-sky-700">{query.product.sku}</span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      query.product.availability_status === 'available' ? 'bg-emerald-100 text-emerald-800' :
                      query.product.availability_status === 'out_of_stock' ? 'bg-red-100 text-red-800' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {query.product.availability_status.replace('_', ' ')}
                    </span>
                  </div>

                  <Link
                    to={`/products/${query.product.id}`}
                    className="font-bold text-slate-900 hover:text-sky-600 block text-sm"
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
              </div>
            )}

            {/* Assignment & Audit Metadata */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-purple-600" />
                <span>Assignment & Audit</span>
              </h3>

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
                <div><span className="font-semibold text-slate-700">Created:</span> {new Date(query.created_at).toLocaleString()}</div>
                <div><span className="font-semibold text-slate-700">Last Modified:</span> {new Date(query.updated_at).toLocaleString()}</div>
                {query.closed_at && (
                  <div><span className="font-semibold text-slate-700">Closed:</span> {new Date(query.closed_at).toLocaleString()}</div>
                )}
              </div>
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Internal Notes (Protected from Sales) */}
      {activeTab === 'notes' && !isSalesAgent && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <MessageSquare className="w-4 h-4 text-sky-600" />
              <span>Confidential Internal Agent Notes</span>
            </h3>
            <span className="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded font-mono">
              Visible Only to Support & Admins
            </span>
          </div>

          {/* Add Internal Note Form */}
          <form onSubmit={handleAddInternalNote} className="space-y-3">
            <textarea
              rows={3}
              value={newNoteText}
              onChange={(e) => setNewNoteText(e.target.value)}
              placeholder="Post confidential internal note regarding customer contact, internal updates, or troubleshooting steps..."
              className="w-full p-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                disabled={!newNoteText.trim()}
                className="inline-flex items-center px-4 py-2 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800 disabled:opacity-40 transition-colors space-x-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Post Internal Note</span>
              </button>
            </div>
          </form>

          {/* Internal Notes Timeline */}
          <div className="space-y-4 pt-4 border-t border-slate-200">
            {internalNotes.length > 0 ? (
              internalNotes.map((note) => (
                <div key={note.id} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <div className="flex items-center space-x-2 font-semibold text-slate-900">
                      <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] text-slate-700">
                        {note.author_profile?.full_name.charAt(0) || 'A'}
                      </div>
                      <span>{note.author_profile?.full_name || 'System Agent'}</span>
                      <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded capitalize font-normal">
                        {note.author_profile?.role.replace('_', ' ') || 'Agent'}
                      </span>
                    </div>
                    <span>{new Date(note.created_at).toLocaleString()}</span>
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
        </div>
      )}

      {/* Tab 3: Attachments */}
      {activeTab === 'attachments' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <Paperclip className="w-4 h-4 text-sky-600" />
              <span>Query Document Attachments</span>
            </h3>
            <span className="text-xs text-slate-500 font-mono">
              {attachments.length} File(s)
            </span>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleAddAttachment} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <label className="block text-xs font-bold uppercase text-slate-700">Upload Attachment / Document</label>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                placeholder="Enter file document name (e.g. Invoice_Copy.pdf, Customer_Screenshot.png)..."
                className="flex-1 p-2.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
              <button
                type="submit"
                disabled={!uploadFileName.trim()}
                className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-white font-bold text-xs rounded-lg transition-colors space-x-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Upload Document</span>
              </button>
            </div>
          </form>

          {/* Attachments List */}
          <div className="space-y-3">
            {attachments.length > 0 ? (
              attachments.map(att => (
                <div key={att.id} className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 bg-sky-50 text-sky-600 rounded-lg flex items-center justify-center border border-sky-100 font-bold">
                      <File className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">{att.file_name}</div>
                      <div className="text-[11px] text-slate-500">
                        Uploaded by {att.uploaded_by_profile ? att.uploaded_by_profile.full_name : 'Agent'} on {new Date(att.uploaded_at).toLocaleString()}
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
        </div>
      )}

      {/* Tab 4: Audit Trail Activity History */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <span>Immutable Ticket Activity Audit Log</span>
          </h3>

          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {activities.map((act) => (
              <div key={act.id} className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-sky-500 border-2 border-white ring-4 ring-sky-50"></div>
                <div className="text-xs font-semibold text-slate-500 flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(act.created_at).toLocaleString()}</span>
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
        </div>
      )}

      {/* Modals */}
      <QueryFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={(data) => {
          localDb.updateQuery(query.id, data, user?.id || '');
          setIsEditModalOpen(false);
          loadQueryData(query.id);
        }}
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
