import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus, OrderDocumentType, OrderStatusHistory, OrderDocument } from '../types';
import { localDb } from '../services/db';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import { OrderStatusModal } from '../components/orders/OrderStatusModal';
import { OrderDocumentModal } from '../components/orders/OrderDocumentModal';
import { 
  ArrowLeft, 
  ShoppingBag, 
  Building2, 
  UserCheck, 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Edit, 
  Ban, 
  FileText, 
  Upload, 
  Activity, 
  ShieldAlert, 
  DollarSign, 
  AlertCircle,
  CheckSquare,
  Square,
  ArrowRight
} from 'lucide-react';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'workflow' | 'items' | 'documents' | 'history'>('workflow');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<OrderStatus | null>(null);
  const [isCancelMode, setIsCancelMode] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isSalesAgent = hasRole('sales_agent');
  const isAdmin = hasRole('admin');

  useEffect(() => {
    if (id) {
      loadOrderData(id);
    }
  }, [id]);

  const loadOrderData = (orderId: string) => {
    const o = localDb.getOrderById(orderId);
    setOrder(o);
  };

  if (!order) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200 my-8">
        <ShoppingBag className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800 mb-1">Customer Order Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The requested order ID does not exist or has been removed.</p>
        <Link
          to="/orders"
          className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Orders List
        </Link>
      </div>
    );
  }

  const workflowSteps: { status: OrderStatus; label: string; actionText: string; timestampKey: keyof Order }[] = [
    { status: 'order_received', label: 'Order Received', actionText: 'Receive Order', timestampKey: 'order_received_at' },
    { status: 'sales_order_done', label: 'Sales Order Done', actionText: 'Complete Sales Order', timestampKey: 'sales_order_done_at' },
    { status: 'invoiced', label: 'Invoiced', actionText: 'Generate & Mark Invoiced', timestampKey: 'invoiced_at' },
    { status: 'dispatched', label: 'Dispatched', actionText: 'Dispatch Order', timestampKey: 'dispatched_at' },
    { status: 'signed_invoice_sent', label: 'Signed Invoice Sent', actionText: 'Mark Signed Invoice Sent', timestampKey: 'signed_invoice_sent_at' },
    { status: 'completed', label: 'Completed', actionText: 'Complete Order Workflow', timestampKey: 'completed_at' },
  ];

  const getNextStatus = (current: OrderStatus): OrderStatus | null => {
    switch (current) {
      case 'order_received': return 'sales_order_done';
      case 'sales_order_done': return 'invoiced';
      case 'invoiced': return 'dispatched';
      case 'dispatched': return 'signed_invoice_sent';
      case 'signed_invoice_sent': return 'completed';
      default: return null;
    }
  };

  const getNextActionInstruction = (current: OrderStatus): string => {
    switch (current) {
      case 'order_received': return 'Complete internal sales order verification & item confirmation.';
      case 'sales_order_done': return 'Generate commercial invoice and issue to customer.';
      case 'dispatched': return 'Confirm signed invoice copy received from carrier/customer.';
      case 'invoiced': return 'Dispatch physical goods pallet and issue shipping notes.';
      case 'signed_invoice_sent': return 'Finalize and complete order workflow audit.';
      case 'completed': return 'Order complete. No further action required.';
      case 'cancelled': return 'Order cancelled. No active workflow pending.';
    }
  };

  const nextTargetStatus = getNextStatus(order.current_status);

  const handleStatusSubmit = (
    targetStatus: OrderStatus,
    extraData?: { notes?: string; cancellation_reason?: string; is_admin_override?: boolean }
  ) => {
    if (!user) return;
    try {
      localDb.advanceOrderStatus(order.id, targetStatus, user.id, extraData);
      setIsStatusModalOpen(false);
      loadOrderData(order.id);
      setFeedback({ 
        type: 'success', 
        message: targetStatus === 'cancelled'
          ? `Order ${order.order_number} cancelled.`
          : `Order status advanced to ${targetStatus.replace(/_/g, ' ').toUpperCase()}.` 
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Workflow transition error.' });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleDocumentSubmit = (docType: OrderDocumentType, fileName: string, filePath: string) => {
    if (!user) return;
    localDb.addOrderDocument(order.id, docType, fileName, filePath, user.id);
    setIsDocModalOpen(false);
    loadOrderData(order.id);
    setFeedback({ type: 'success', message: `Document ${fileName} attached.` });
    setTimeout(() => setFeedback(null), 4000);
  };

  const getStatusBadgeStyle = (status: OrderStatus) => {
    switch (status) {
      case 'order_received': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'sales_order_done': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'invoiced': return 'bg-sky-100 text-sky-800 border-sky-200';
      case 'dispatched': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'signed_invoice_sent': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'completed': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const formatStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'order_received': return 'Order Received';
      case 'sales_order_done': return 'Sales Order Done';
      case 'invoiced': return 'Invoiced';
      case 'dispatched': return 'Dispatched';
      case 'signed_invoice_sent': return 'Signed Invoice Sent';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
    }
  };

  // Required documents status check
  const hasSalesOrderDoc = order.documents?.some(d => d.document_type === 'sales_order');
  const hasInvoiceDoc = order.documents?.some(d => d.document_type === 'invoice');
  const hasDispatchDoc = order.documents?.some(d => d.document_type === 'dispatch_document');
  const hasSignedInvoiceDoc = order.documents?.some(d => d.document_type === 'signed_invoice');

  return (
    <div className="space-y-6">
      
      {/* Top Bar Back Link */}
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Orders Directory
        </Link>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-xs animate-in fade-in duration-200 ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Main Order Banner Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-mono text-sm font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-md border border-sky-200">
              {order.order_number}
            </span>
            <span className={`inline-flex items-center px-3 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusBadgeStyle(order.current_status)}`}>
              {formatStatusLabel(order.current_status)}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Order for {order.customer?.company_name || 'Customer Account'}
          </h1>

          <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
            <span>Order Date: {new Date(order.order_date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</span>
            <span>•</span>
            <span>Sales Agent: {order.sales_agent_profile?.full_name || 'Unassigned'}</span>
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Prominent Next Action Button */}
          {nextTargetStatus && order.current_status !== 'completed' && order.current_status !== 'cancelled' && (
            <button
              onClick={() => {
                setStatusTarget(nextTargetStatus);
                setIsCancelMode(false);
                setIsStatusModalOpen(true);
              }}
              className="inline-flex items-center px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm space-x-2"
            >
              <span>Adv. to {formatStatusLabel(nextTargetStatus)}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {/* Edit Order (Where permitted) */}
          {order.current_status !== 'completed' && order.current_status !== 'cancelled' && (
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs rounded-lg transition-colors border border-slate-300"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit Order
            </button>
          )}

          {/* Cancel Order Button */}
          {order.current_status !== 'completed' && order.current_status !== 'cancelled' && (
            <button
              onClick={() => {
                setStatusTarget('cancelled');
                setIsCancelMode(true);
                setIsStatusModalOpen(true);
              }}
              className="inline-flex items-center px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-medium text-xs rounded-lg transition-colors border border-red-200"
            >
              <Ban className="w-3.5 h-3.5 mr-1.5" />
              Cancel Order
            </button>
          )}

        </div>

      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('workflow')}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'workflow'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Workflow Checklist</span>
        </button>

        <button
          onClick={() => setActiveTab('items')}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'items'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Order Items ({order.items?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('documents')}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'documents'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Documents & Files ({order.documents?.length || 0})</span>
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
          <span>Order Audit Trail ({order.history?.length || 0})</span>
        </button>
      </div>

      {/* Tab 1: Workflow Checklist & Details */}
      {activeTab === 'workflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Visual Workflow Checklist */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* WORKFLOW CHECKLIST CARD */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <CheckSquare className="w-4 h-4 text-sky-600" />
                  <span>Sequential Order Workflow</span>
                </h3>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${getStatusBadgeStyle(order.current_status)}`}>
                  Current: {formatStatusLabel(order.current_status)}
                </span>
              </div>

              {/* 6 Step Interactive Checklist List */}
              <div className="space-y-3 pt-2">
                {workflowSteps.map((step, idx) => {
                  const ts = order[step.timestampKey] as string | null;
                  const isDone = !!ts || (order.current_status === 'completed');
                  const isCurrent = order.current_status === step.status;

                  return (
                    <div
                      key={step.status}
                      className={`p-3.5 rounded-xl border transition-all flex items-start justify-between ${
                        isDone
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : isCurrent
                          ? 'bg-sky-50 border-sky-300 ring-2 ring-sky-100 text-sky-950'
                          : 'bg-slate-50 border-slate-200 text-slate-400'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <div className="mt-0.5">
                          {isDone ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-300 shrink-0" />
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-sm flex items-center space-x-2">
                            <span>{idx + 1}. {step.label}</span>
                            {isCurrent && (
                              <span className="text-[10px] bg-sky-600 text-white px-2 py-0.5 rounded uppercase font-extrabold">
                                Active Stage
                              </span>
                            )}
                          </div>
                          {ts ? (
                            <div className="text-xs text-slate-600 mt-1 flex items-center space-x-2">
                              <span>Completed {new Date(ts).toLocaleString()}</span>
                            </div>
                          ) : (
                            <div className="text-xs text-slate-400 italic mt-0.5">
                              Pending workflow completion
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Quick Action Button on Step if Next */}
                      {nextTargetStatus === step.status && order.current_status !== 'completed' && order.current_status !== 'cancelled' && (
                        <button
                          onClick={() => {
                            setStatusTarget(step.status);
                            setIsCancelMode(false);
                            setIsStatusModalOpen(true);
                          }}
                          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs"
                        >
                          {step.actionText}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* NEXT ACTION INSTRUCTION BOX */}
              {order.current_status !== 'completed' && order.current_status !== 'cancelled' && (
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                  <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center space-x-2">
                    <Clock className="w-4 h-4 text-amber-600" />
                    <span>NEXT REQUIRED ACTION</span>
                  </div>
                  <p className="text-xs text-amber-950 font-medium">
                    {getNextActionInstruction(order.current_status)}
                  </p>
                  {nextTargetStatus && (
                    <div className="pt-2">
                      <button
                        onClick={() => {
                          setStatusTarget(nextTargetStatus);
                          setIsCancelMode(false);
                          setIsStatusModalOpen(true);
                        }}
                        className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors shadow-xs space-x-1.5"
                      >
                        <span>Execute Next Step ({formatStatusLabel(nextTargetStatus)})</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Cancellation Notice if Cancelled */}
              {order.current_status === 'cancelled' && (
                <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-1">
                  <div className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center space-x-1.5">
                    <Ban className="w-4 h-4 text-red-600" />
                    <span>ORDER CANCELLED</span>
                  </div>
                  <p className="text-xs text-red-800 font-semibold">
                    Reason: {order.cancellation_reason || 'No specific reason logged.'}
                  </p>
                  <p className="text-[11px] text-red-600">
                    Cancelled on {new Date(order.cancelled_at!).toLocaleString()} by {order.cancelled_by_profile?.full_name || 'Agent'}.
                  </p>
                </div>
              )}

            </div>

            {/* Notes Section */}
            {order.notes && (
              <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-2">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span>Order Notes & Special Instructions</span>
                </h3>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                  {order.notes}
                </div>
              </div>
            )}

          </div>

          {/* Right Column: Customer Card & Summary */}
          <div className="space-y-6">
            
            {/* Customer Info Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-sky-600" />
                <span>Customer Account</span>
              </h3>

              {order.customer ? (
                <div className="space-y-3">
                  <div>
                    <Link
                      to={`/customers/${order.customer.id}`}
                      className="text-base font-bold text-slate-900 hover:text-sky-600 block transition-colors"
                    >
                      {order.customer.company_name}
                    </Link>
                    <span className="font-mono text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded border border-sky-100 inline-block mt-1">
                      {order.customer.customer_code}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1.5 text-slate-600">
                    <div><span className="font-semibold text-slate-800">Contact:</span> {order.customer.contact_person || 'N/A'}</div>
                    <div><span className="font-semibold text-slate-800">Phone:</span> {order.customer.phone || 'N/A'}</div>
                    <div><span className="font-semibold text-slate-800">Email:</span> {order.customer.email || 'N/A'}</div>
                    <div><span className="font-semibold text-slate-800">Address:</span> {order.customer.address || 'N/A'}, {order.customer.city || 'N/A'}</div>
                  </div>

                  <Link
                    to={`/customers/${order.customer.id}`}
                    className="w-full inline-flex items-center justify-center px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-200"
                  >
                    View Full Customer Profile
                  </Link>
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No customer linked to this order.</p>
              )}
            </div>

            {/* Financial Totals Summary Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                <span>Financial Totals Summary</span>
              </h3>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-mono font-semibold text-slate-900">${order.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Total Discount:</span>
                  <span className="font-mono font-semibold text-red-600">-${order.total_discount.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                  <span>Total Tax:</span>
                  <span className="font-mono font-semibold text-slate-900">+${order.total_tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-2 pt-3 font-bold text-sm text-slate-900 border-t border-slate-200">
                  <span>Grand Total:</span>
                  <span className="font-mono text-sky-700">${order.grand_total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Related Support Queries Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-2">
                <FileText className="w-4 h-4 text-amber-600" />
                <span>Related Customer Support Queries</span>
              </h3>

              {(() => {
                const queries = localDb.getQueries({ customer_id: order.customer_id }).filter(q => q.order_id === order.id);
                return queries.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {queries.map(q => (
                      <Link
                        key={q.id}
                        to={`/queries/${q.id}`}
                        className="p-3 bg-slate-50 hover:bg-sky-50 rounded-lg border border-slate-200 block transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-sky-700">{q.query_number}</span>
                          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-200 text-slate-800">
                            {q.status.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <p className="font-bold text-slate-900 line-clamp-1">{q.subject}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No customer support queries are linked to this order.</p>
                );
              })()}
            </div>

          </div>

        </div>
      )}

      {/* Tab 2: Order Items Line Table */}
      {activeTab === 'items' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          
          {/* NO INVENTORY NOTICE BANNER */}
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-semibold">
              CRITICAL BUSINESS RULE: J&T Supplies CRM does NOT track or manage physical inventory. Quantities ordered below reflect customer demand, not physical stock deductions.
            </span>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <ShoppingBag className="w-4 h-4 text-sky-600" />
              <span>Purchased Line Items ({order.items?.length || 0})</span>
            </h3>
            {order.current_status !== 'completed' && order.current_status !== 'cancelled' && (
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="inline-flex items-center px-3 py-1.5 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800"
              >
                <Edit className="w-3.5 h-3.5 mr-1" />
                Edit Items
              </button>
            )}
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">Product Snapshot</th>
                  <th className="px-4 py-3">SKU</th>
                  <th className="px-4 py-3">Quantity</th>
                  <th className="px-4 py-3">Unit Price</th>
                  <th className="px-4 py-3">Discount</th>
                  <th className="px-4 py-3">Tax</th>
                  <th className="px-4 py-3 text-right">Line Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {order.items?.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3.5 font-bold text-slate-900">
                      {item.product_name_snapshot}
                      {item.notes && <div className="text-[11px] font-normal text-slate-500">{item.notes}</div>}
                    </td>
                    <td className="px-4 py-3.5 font-mono text-slate-600 uppercase">{item.sku_snapshot}</td>
                    <td className="px-4 py-3.5 font-mono font-semibold">{item.quantity}</td>
                    <td className="px-4 py-3.5 font-mono">${item.unit_price.toFixed(2)}</td>
                    <td className="px-4 py-3.5 font-mono text-red-600">-${item.discount.toFixed(2)}</td>
                    <td className="px-4 py-3.5 font-mono">+${item.tax.toFixed(2)}</td>
                    <td className="px-4 py-3.5 font-mono font-bold text-slate-900 text-right">${item.line_total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Calculations Summary */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span>${order.subtotal.toFixed(2)}</span></div>
              <div className="flex justify-between text-red-600"><span>Discount:</span><span>-${order.total_discount.toFixed(2)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Tax:</span><span>+${order.total_tax.toFixed(2)}</span></div>
              <div className="flex justify-between font-extrabold text-sm text-sky-700 pt-2 border-t border-slate-200 font-sans">
                <span>Grand Total:</span><span>${order.grand_total.toFixed(2)}</span>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab 3: Documents Section */}
      {activeTab === 'documents' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
              <FileText className="w-4 h-4 text-sky-600" />
              <span>Required Order Documents Checklist</span>
            </h3>
            <button
              onClick={() => setIsDocModalOpen(true)}
              className="inline-flex items-center px-3 py-1.5 bg-slate-900 text-white font-semibold text-xs rounded-lg hover:bg-slate-800"
            >
              <Upload className="w-3.5 h-3.5 mr-1" />
              Attach Document
            </button>
          </div>

          {/* Required Documents Checklist Indicators */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className={`p-4 rounded-xl border flex items-center space-x-3 ${hasSalesOrderDoc ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              {hasSalesOrderDoc ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
              <div>
                <div className="font-bold text-xs">Sales Order</div>
                <div className="text-[11px]">{hasSalesOrderDoc ? 'Attached' : 'Pending'}</div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex items-center space-x-3 ${hasInvoiceDoc ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              {hasInvoiceDoc ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
              <div>
                <div className="font-bold text-xs">Invoice Document</div>
                <div className="text-[11px]">{hasInvoiceDoc ? 'Attached' : 'Pending'}</div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex items-center space-x-3 ${hasDispatchDoc ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              {hasDispatchDoc ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
              <div>
                <div className="font-bold text-xs">Dispatch Note</div>
                <div className="text-[11px]">{hasDispatchDoc ? 'Attached' : 'Pending'}</div>
              </div>
            </div>

            <div className={`p-4 rounded-xl border flex items-center space-x-3 ${hasSignedInvoiceDoc ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              {hasSignedInvoiceDoc ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
              <div>
                <div className="font-bold text-xs">Signed Invoice</div>
                <div className="text-[11px]">{hasSignedInvoiceDoc ? 'Attached' : 'Pending'}</div>
              </div>
            </div>
          </div>

          {/* Attached Files Table */}
          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-800 mb-3">Attached Document Metadata List</h4>
            {order.documents && order.documents.length > 0 ? (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-3">Document Type</th>
                      <th className="px-4 py-3">File Name</th>
                      <th className="px-4 py-3">Uploaded By</th>
                      <th className="px-4 py-3">Uploaded Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {order.documents.map(doc => (
                      <tr key={doc.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 font-semibold capitalize text-sky-700">{doc.document_type.replace('_', ' ')}</td>
                        <td className="px-4 py-3 font-mono font-bold text-slate-900">{doc.file_name}</td>
                        <td className="px-4 py-3">{doc.uploaded_by_profile?.full_name || 'Agent'}</td>
                        <td className="px-4 py-3 text-slate-500">{new Date(doc.uploaded_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-6 border border-slate-200 rounded-xl bg-slate-50/50">
                No documents uploaded for this order yet.
              </p>
            )}
          </div>

        </div>
      )}

      {/* Tab 4: Immutable Audit Trail */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <span>Immutable Order Audit Trail Timeline</span>
          </h3>

          <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
            {order.history?.map((h) => (
              <div key={h.id} className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-sky-500 border-2 border-white ring-4 ring-sky-50"></div>
                <div className="text-xs font-semibold text-slate-500 flex items-center space-x-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{new Date(h.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1">
                  {h.action}
                </p>
                {h.notes && (
                  <p className="text-xs text-slate-700 bg-slate-50 p-2 rounded border border-slate-100 mt-1 font-mono">
                    {h.notes}
                  </p>
                )}
                <p className="text-xs text-slate-500 mt-0.5">
                  Performed by: <span className="font-semibold text-slate-800">{h.performed_by_profile?.full_name || 'System'}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <OrderFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={(data) => {
          localDb.updateOrder(order.id, data, user?.id || '');
          setIsEditModalOpen(false);
          loadOrderData(order.id);
        }}
        orderToEdit={order}
      />

      <OrderStatusModal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        onSubmit={handleStatusSubmit}
        order={order}
        targetStatus={statusTarget}
        isCancelMode={isCancelMode}
      />

      <OrderDocumentModal
        isOpen={isDocModalOpen}
        onClose={() => setIsDocModalOpen(false)}
        onSubmit={handleDocumentSubmit}
        order={order}
      />

    </div>
  );
};
