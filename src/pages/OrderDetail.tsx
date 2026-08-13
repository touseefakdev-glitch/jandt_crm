import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus, OrderDocumentType } from '../types';
import { localDb } from '../services/db';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import { OrderStatusModal } from '../components/orders/OrderStatusModal';
import { OrderDocumentModal } from '../components/orders/OrderDocumentModal';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, PageHeader, Table, Tabs, TBody, Td, Th, THead, Tr, useToast } from '../components/ui';
import { getOrderStatusBadge, getQueryStatusBadge } from '../utils/badges';
import { formatCurrency, formatDateTime } from '../utils/format';
import {
  ArrowLeft,
  ShoppingBag,
  Building2,
  Calendar,
  CheckCircle2,
  Edit,
  Ban,
  FileText,
  Upload,
  Activity,
  ShieldAlert,
  DollarSign,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react';

export const OrderDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'workflow' | 'items' | 'documents' | 'history'>('workflow');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<OrderStatus | null>(null);
  const [isCancelMode, setIsCancelMode] = useState(false);
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);

  const isSalesAgent = hasRole('sales_agent');
  const isAdmin = hasRole('admin');

  useEffect(() => {
    if (id) {
      loadOrderData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const loadOrderData = (orderId: string) => {
    const o = localDb.getOrderById(orderId);
    setOrder(o);
  };

  const relatedQueries = useMemo(() => {
    if (!order) return [];
    return localDb.getQueries({ customer_id: order.customer_id }).filter((q) => q.order_id === order.id);
  }, [order]);

  if (!order) {
    return (
      <div className="max-w-xl mx-auto mt-16">
        <Card className="p-10">
          <EmptyState
            icon={<ShoppingBag className="w-8 h-8" />}
            title="Customer Order Not Found"
            description="The requested order ID does not exist or has been removed."
            action={
              <Link to="/orders" className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800">
                <ArrowLeft className="w-3.5 h-3.5" />
                Return to Orders List
              </Link>
            }
          />
        </Card>
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
  const orderActive = order.current_status !== 'completed' && order.current_status !== 'cancelled';

  const openStatusModal = (status: OrderStatus, cancelMode: boolean) => {
    setStatusTarget(status);
    setIsCancelMode(cancelMode);
    setIsStatusModalOpen(true);
  };

  const handleStatusSubmit = async (
    targetStatus: OrderStatus,
    extraData?: { notes?: string; cancellation_reason?: string; is_admin_override?: boolean }
  ) => {
    if (!user) return;
    try {
      await localDb.advanceOrderStatus(order.id, targetStatus, user.id, extraData);
      setIsStatusModalOpen(false);
      loadOrderData(order.id);
      toast({
        type: 'success',
        title: 'Status advanced',
        message: targetStatus === 'cancelled'
          ? `Order ${order.order_number} cancelled.`
          : `Order status advanced to ${targetStatus.replace(/_/g, ' ').toUpperCase()}.`,
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'Transition error', message: err.message || 'Workflow transition error.' });
    }
  };

  const handleDocumentSubmit = (docType: OrderDocumentType, fileName: string, filePath: string) => {
    if (!user) return;
    localDb.addOrderDocument(order.id, docType, fileName, filePath, user.id);
    setIsDocModalOpen(false);
    loadOrderData(order.id);
    toast({ type: 'success', title: 'Document attached', message: `Document ${fileName} attached.` });
  };

  const hasSalesOrderDoc = order.documents?.some((d) => d.document_type === 'sales_order');
  const hasInvoiceDoc = order.documents?.some((d) => d.document_type === 'invoice');
  const hasDispatchDoc = order.documents?.some((d) => d.document_type === 'dispatch_document');
  const hasSignedInvoiceDoc = order.documents?.some((d) => d.document_type === 'signed_invoice');

  const documentChecks = [
    { label: 'Sales Order', done: !!hasSalesOrderDoc },
    { label: 'Invoice Document', done: !!hasInvoiceDoc },
    { label: 'Dispatch Note', done: !!hasDispatchDoc },
    { label: 'Signed Invoice', done: !!hasSignedInvoiceDoc },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/orders"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Orders Directory
        </Link>
      </div>

      <PageHeader
        icon={<ShoppingBag className="w-5 h-5 text-brand-400" />}
        title={`Order for ${order.customer?.company_name || 'Customer Account'}`}
        description={
          <>
            {order.order_number} · Order Date {formatDateTime(order.order_date)} · Sales Agent: {order.sales_agent_profile?.full_name || 'Unassigned'}
          </>
        }
        badges={<Badge badge={getOrderStatusBadge(order.current_status)} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            {nextTargetStatus && orderActive && (
              <Button size="sm" iconRight={<ArrowRight className="w-3.5 h-3.5" />} onClick={() => openStatusModal(nextTargetStatus, false)}>
                Adv. to {getOrderStatusBadge(nextTargetStatus).label}
              </Button>
            )}
            {orderActive && (
              <Button variant="outline" size="sm" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => setIsEditModalOpen(true)}>
                Edit Order
              </Button>
            )}
            {orderActive && (
              <Button variant="outline" size="sm" className="text-red-700 border-red-200 hover:bg-red-50 hover:text-red-800" icon={<Ban className="w-3.5 h-3.5" />} onClick={() => openStatusModal('cancelled', true)}>
                Cancel Order
              </Button>
            )}
          </div>
        }
      />

      <Tabs
        size="md"
        tabs={[
          { value: 'workflow' as const, label: 'Workflow Checklist' },
          { value: 'items' as const, label: 'Order Items', count: order.items?.length || 0 },
          { value: 'documents' as const, label: 'Documents & Files', count: order.documents?.length || 0 },
          { value: 'history' as const, label: 'Order Audit Trail', count: order.history?.length || 0 },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'workflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader
                icon={<CheckSquare className="w-4 h-4 text-brand-600" />}
                title="Sequential Order Workflow"
                actions={<Badge badge={getOrderStatusBadge(order.current_status)} />}
              />
              <CardBody>
                <div className="space-y-3">
                  {workflowSteps.map((step, idx) => {
                    const ts = order[step.timestampKey] as string | null;
                    const isDone = !!ts || order.current_status === 'completed';
                    const isCurrent = order.current_status === step.status;

                    return (
                      <div
                        key={step.status}
                        className={`p-3.5 rounded-xl border transition-all flex items-start justify-between ${
                          isDone
                            ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                            : isCurrent
                            ? 'bg-brand-50 border-brand-300 ring-2 ring-brand-100 text-brand-950'
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
                            <div className="font-bold text-sm flex items-center gap-2">
                              <span>{idx + 1}. {step.label}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-brand-600 text-white px-2 py-0.5 rounded uppercase font-extrabold">
                                  Active Stage
                                </span>
                              )}
                            </div>
                            {ts ? (
                              <div className="text-xs text-slate-600 mt-1">
                                Completed {formatDateTime(ts)}
                              </div>
                            ) : (
                              <div className="text-xs text-slate-400 italic mt-0.5">
                                Pending workflow completion
                              </div>
                            )}
                          </div>
                        </div>

                        {nextTargetStatus === step.status && orderActive && (
                          <button
                            onClick={() => openStatusModal(step.status, false)}
                            className="px-3 py-1.5 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-lg transition-colors shadow-sm"
                          >
                            {step.actionText}
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>

                {orderActive && (
                  <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2 mt-4">
                    <div className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      <span>NEXT REQUIRED ACTION</span>
                    </div>
                    <p className="text-xs text-amber-950 font-medium">
                      {getNextActionInstruction(order.current_status)}
                    </p>
                    {nextTargetStatus && (
                      <div className="pt-2">
                        <Button
                          size="sm"
                          variant="secondary"
                          iconRight={<ArrowRight className="w-3.5 h-3.5" />}
                          onClick={() => openStatusModal(nextTargetStatus, false)}
                        >
                          Execute Next Step ({getOrderStatusBadge(nextTargetStatus).label})
                        </Button>
                      </div>
                    )}
                  </div>
                )}

                {order.current_status === 'cancelled' && (
                  <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-1 mt-4">
                    <div className="text-xs font-bold text-red-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Ban className="w-4 h-4 text-red-600" />
                      <span>ORDER CANCELLED</span>
                    </div>
                    <p className="text-xs text-red-800 font-semibold">
                      Reason: {order.cancellation_reason || 'No specific reason logged.'}
                    </p>
                    <p className="text-[11px] text-red-600">
                      Cancelled on {formatDateTime(order.cancelled_at!)} by {order.cancelled_by_profile?.full_name || 'Agent'}.
                    </p>
                  </div>
                )}
              </CardBody>
            </Card>

            {order.notes && (
              <Card>
                <CardHeader icon={<FileText className="w-4 h-4 text-amber-600" />} title="Order Notes & Special Instructions" />
                <CardBody>
                  <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                    {order.notes}
                  </div>
                </CardBody>
              </Card>
            )}
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader icon={<Building2 className="w-4 h-4 text-brand-600" />} title="Customer Account" />
              <CardBody>
                {order.customer ? (
                  <div className="space-y-3">
                    <div>
                      <Link
                        to={`/customers/${order.customer.id}`}
                        className="text-base font-bold text-slate-900 hover:text-brand-600 block transition-colors"
                      >
                        {order.customer.company_name}
                      </Link>
                      <span className="font-mono text-xs font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded border border-brand-100 inline-block mt-1">
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
              </CardBody>
            </Card>

            <Card>
              <CardHeader icon={<DollarSign className="w-4 h-4 text-emerald-600" />} title="Financial Totals Summary" />
              <CardBody>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-mono font-semibold text-slate-900">{formatCurrency(order.subtotal)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>Total Discount:</span>
                    <span className="font-mono font-semibold text-red-600">-{formatCurrency(order.total_discount)}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-100 text-slate-600">
                    <span>Total Tax:</span>
                    <span className="font-mono font-semibold text-slate-900">+{formatCurrency(order.total_tax)}</span>
                  </div>
                  <div className="flex justify-between py-2 pt-3 font-bold text-sm text-slate-900 border-t border-slate-200">
                    <span>Grand Total:</span>
                    <span className="font-mono text-brand-700">{formatCurrency(order.grand_total)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader icon={<FileText className="w-4 h-4 text-amber-600" />} title="Related Customer Support Queries" />
              <CardBody>
                {relatedQueries.length > 0 ? (
                  <div className="space-y-2 text-xs">
                    {relatedQueries.map((q) => (
                      <Link
                        key={q.id}
                        to={`/queries/${q.id}`}
                        className="p-3 bg-slate-50 hover:bg-brand-50 rounded-lg border border-slate-200 block transition-colors space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-bold text-brand-700">{q.query_number}</span>
                          <Badge badge={getQueryStatusBadge(q.status)} />
                        </div>
                        <p className="font-bold text-slate-900 truncate">{q.subject}</p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No customer support queries are linked to this order.</p>
                )}
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'items' && (
        <Card className="p-6 space-y-4">
          <div className="p-3 bg-violet-50 rounded-xl border border-violet-200 text-violet-950 text-xs flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-violet-600 shrink-0" />
            <span className="font-semibold">
              CRITICAL BUSINESS RULE: J&T Supplies CRM does NOT track or manage physical inventory. Quantities ordered below reflect customer demand, not physical stock deductions.
            </span>
          </div>

          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-brand-600" />
              Purchased Line Items ({order.items?.length || 0})
            </h3>
            {orderActive && (
              <Button size="sm" variant="secondary" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => setIsEditModalOpen(true)}>
                Edit Items
              </Button>
            )}
          </div>

          <Table minWidth={1060}>
            <THead>
              <Tr hover={false}>
                <Th width={300}>Product Snapshot</Th>
                <Th width={150}>SKU</Th>
                <Th width={90}>Quantity</Th>
                <Th width={120} align="right">Unit Price</Th>
                <Th width={120} align="right">Discount</Th>
                <Th width={110} align="right">Tax</Th>
                <Th width={120} align="right">Line Total</Th>
              </Tr>
            </THead>
            <TBody>
              {order.items?.map((item) => (
                <Tr key={item.id} className="hover:bg-slate-50/80">
                  <Td width={300} className="font-bold text-slate-900">
                    <div className="truncate" title={item.product_name_snapshot}>{item.product_name_snapshot}</div>
                    {item.notes && <div className="text-[11px] font-normal text-slate-500 truncate" title={item.notes}>{item.notes}</div>}
                  </Td>
                  <Td width={150} truncate className="font-mono text-slate-600 uppercase">{item.sku_snapshot}</Td>
                  <Td width={90} className="font-mono font-semibold">{item.quantity}</Td>
                  <Td width={120} align="right" className="font-mono">{formatCurrency(item.unit_price)}</Td>
                  <Td width={120} align="right" className="font-mono text-red-600">-{formatCurrency(item.discount)}</Td>
                  <Td width={110} align="right" className="font-mono">+{formatCurrency(item.tax)}</Td>
                  <Td width={120} align="right" className="font-mono font-bold text-slate-900">{formatCurrency(item.line_total)}</Td>
                </Tr>
              ))}
            </TBody>
          </Table>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex justify-end">
            <div className="w-64 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600"><span>Subtotal:</span><span>{formatCurrency(order.subtotal)}</span></div>
              <div className="flex justify-between text-red-600"><span>Discount:</span><span>-{formatCurrency(order.total_discount)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Tax:</span><span>+{formatCurrency(order.total_tax)}</span></div>
              <div className="flex justify-between font-extrabold text-sm text-brand-700 pt-2 border-t border-slate-200 font-sans">
                <span>Grand Total:</span><span>{formatCurrency(order.grand_total)}</span>
              </div>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'documents' && (
        <Card className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-600" />
              Required Order Documents Checklist
            </h3>
            <Button size="sm" icon={<Upload className="w-3.5 h-3.5" />} onClick={() => setIsDocModalOpen(true)}>
              Attach Document
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {documentChecks.map((dc) => (
              <div
                key={dc.label}
                className={`p-4 rounded-xl border flex items-center space-x-3 ${
                  dc.done ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-slate-50 border-slate-200 text-slate-500'
                }`}
              >
                {dc.done ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <Square className="w-5 h-5 text-slate-300 shrink-0" />}
                <div>
                  <div className="font-bold text-xs">{dc.label}</div>
                  <div className="text-[11px]">{dc.done ? 'Attached' : 'Pending'}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2">
            <h4 className="text-xs font-bold text-slate-800 mb-3">Attached Document Metadata List</h4>
            {order.documents && order.documents.length > 0 ? (
              <Table minWidth={850}>
                <THead>
                  <Tr hover={false}>
                    <Th width={170}>Document Type</Th>
                    <Th width={280}>File Name</Th>
                    <Th width={180}>Uploaded By</Th>
                    <Th width={170}>Uploaded Date</Th>
                  </Tr>
                </THead>
                <TBody>
                  {order.documents.map((doc) => (
                    <Tr key={doc.id} className="hover:bg-slate-50/80">
                      <Td width={170} className="font-semibold capitalize text-brand-700">{doc.document_type.replace('_', ' ')}</Td>
                      <Td width={280} truncate className="font-mono font-bold text-slate-900">{doc.file_name}</Td>
                      <Td width={180} truncate>{doc.uploaded_by_profile?.full_name || 'Agent'}</Td>
                      <Td width={170} className="text-slate-500">{formatDateTime(doc.uploaded_at)}</Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-6 border border-slate-200 rounded-xl bg-slate-50/50">
                No documents uploaded for this order yet.
              </p>
            )}
          </div>
        </Card>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader icon={<Activity className="w-4 h-4 text-brand-600" />} title="Immutable Order Audit Trail Timeline" />
          <CardBody>
            {order.history && order.history.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                {order.history.map((h) => (
                  <div key={h.id} className="relative">
                    <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-brand-500 border-2 border-white ring-4 ring-brand-50"></div>
                    <div className="text-xs font-semibold text-slate-500 flex items-center space-x-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(h.created_at)}</span>
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
            ) : (
              <EmptyState icon={<Activity className="w-7 h-7" />} title="No audit activity yet" description="Order workflow history will appear here as the order is processed." />
            )}
          </CardBody>
        </Card>
      )}

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
