import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Customer, CustomerFormInput } from '../types';
import { localDb } from '../services/db';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { QueryFormModal } from '../components/queries/QueryFormModal';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import { Avatar, Badge, Pill, Button, Card, CardBody, CardHeader, ConfirmDialog, EmptyState, Table, TBody, Td, Th, THead, Tr, useToast } from '../components/ui';
import { getCustomerStatusBadge, getOrderStatusBadge, getQueryPriorityBadge, getQueryStatusBadge, getProductAvailabilityBadge } from '../utils/badges';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import {
  ArrowLeft,
  Building2,
  User,
  Edit,
  Power,
  HelpCircle,
  ShoppingBag,
  Activity,
  Calendar,
  Plus,
  Eye,
  Package,
} from 'lucide-react';

import { fetchCustomerById, canUseServerQueries } from '../services/queryService';

type TabKey = 'overview' | 'queries' | 'orders' | 'history' | 'activity';

export const CustomerDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isCreateQueryModalOpen, setIsCreateQueryModalOpen] = useState(false);
  const [isCreateOrderModalOpen, setIsCreateOrderModalOpen] = useState(false);
  const [confirmStatusOpen, setConfirmStatusOpen] = useState(false);

  const isAdmin = hasRole('admin');

  useEffect(() => {
    let active = true;
    if (id) {
      setLoading(true);
      const localMatch = localDb.getCustomerById(id);
      if (localMatch) {
        setCustomer(localMatch);
        setLoading(false);
      }

      if (canUseServerQueries()) {
        fetchCustomerById(id)
          .then((fetched) => {
            if (active && fetched) {
              setCustomer(fetched);
            }
          })
          .catch((err) => {
            console.error('[CustomerDetail] Supabase customer fetch error:', err);
          })
          .finally(() => {
            if (active) setLoading(false);
          });
      } else {
        setLoading(false);
      }
    }
    return () => {
      active = false;
    };
  }, [id]);

  const customerQueries = useMemo(() => {
    if (!id) return [];
    return localDb.getQueries({ customer_id: id });
  }, [id, isCreateQueryModalOpen, customer]);

  const customerDailyOps = useMemo(() => {
    if (!id) return [];
    return localDb.getCustomerDailyOperations(id);
  }, [id, customer]);

  const productHistory = useMemo(() => {
    if (!customer) return [];
    let hist = localDb.getCustomerProductHistory(customer.id);
    if (hist.length === 0 && customer.company_name) {
      hist = localDb.getCustomerProductHistoryByCustomerName(customer.company_name);
    }
    return hist;
  }, [customer]);

  if (loading && !customer) {
    return (
      <Card className="p-12 my-8">
        <div className="flex flex-col items-center justify-center space-y-3 py-6">
          <Building2 className="w-8 h-8 text-brand-500 animate-bounce" />
          <p className="text-sm font-semibold text-slate-600">Loading customer record...</p>
        </div>
      </Card>
    );
  }

  if (!customer) {
    return (
      <Card className="p-12 my-8">
        <EmptyState
          icon={<Building2 className="w-8 h-8" />}
          title="Customer Record Not Found"
          description="The requested customer ID does not exist or has been removed."
          action={
            <Button variant="outline" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
              <Link to="/customers">Return to Customer List</Link>
            </Button>
          }
        />
      </Card>
    );
  }

  const handleUpdateCustomer = async (data: CustomerFormInput) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const updated = await localDb.updateCustomer(customer.id, data, user.id);
      if (updated) {
        setCustomer(updated);
        toast({ type: 'success', title: 'Customer updated', message: `Customer "${updated.company_name}" saved to database.` });
      }
      setIsEditModalOpen(false);
    } catch (err: any) {
      console.error('[CustomerDetail] Customer update error:', err);
      toast({
        type: 'error',
        title: 'Customer could not be updated',
        message: err.message || 'A database error occurred while updating the customer.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async () => {
    if (!user || !isAdmin) return;
    const newStatus = customer.status === 'active' ? 'inactive' : 'active';
    try {
      const updated = await localDb.toggleCustomerStatus(customer.id, newStatus, user.id);
      if (updated) {
        setCustomer(updated);
        toast({
          type: 'success',
          title: 'Customer status changed',
          message: `Customer "${updated.company_name}" has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
        });
      }
    } catch (err: any) {
      console.error('[CustomerDetail] Status toggle error:', err);
      toast({
        type: 'error',
        title: 'Status change failed',
        message: err.message || 'Could not update status in database.',
      });
    } finally {
      setConfirmStatusOpen(false);
    }
  };

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'overview', label: 'Overview', icon: <User className="w-4 h-4" /> },
    { key: 'queries', label: 'Support Queries', icon: <HelpCircle className="w-4 h-4" />, count: customerQueries.length },
    { key: 'orders', label: 'Daily Route Operations', icon: <ShoppingBag className="w-4 h-4" />, count: customerDailyOps.length },
    { key: 'history', label: 'Historical Purchasing Catalog', icon: <Package className="w-4 h-4" />, count: productHistory.length },
    { key: 'activity', label: 'Activity Timeline', icon: <Activity className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      <div>
        <Link to="/customers" className="inline-flex items-center gap-1 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-3">
          <ArrowLeft className="w-4 h-4" />
          Back to Customer Directory
        </Link>
      </div>

      {/* Profile Header */}
      <Card className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-4">
          <Avatar name={customer.company_name} size="lg" className="bg-slate-900 text-white ring-slate-800 text-xl rounded-xl" />
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2.5 py-0.5 rounded-md border border-brand-100">{customer.customer_code}</span>
              <Badge badge={getCustomerStatusBadge(customer.status)} />
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight mt-1.5">{customer.company_name}</h1>
            <p className="text-xs text-slate-500 flex items-center gap-2 mt-1">
              <span>Added {formatDate(customer.created_at, { month: 'long', day: 'numeric', year: 'numeric' })}</span>
              {customer.created_by_profile && (
                <>
                  <span className="text-slate-300">•</span>
                  <span>Created by {customer.created_by_profile.full_name}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" onClick={() => setIsCreateOrderModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            New Order
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setIsCreateQueryModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            New Query
          </Button>
          <Button size="sm" variant="outline" onClick={() => setIsEditModalOpen(true)} icon={<Edit className="w-3.5 h-3.5" />}>
            Edit Profile
          </Button>
          {isAdmin && (
            <Button
              size="sm"
              variant={customer.status === 'active' ? 'danger' : 'success'}
              onClick={() => setConfirmStatusOpen(true)}
              icon={<Power className="w-3.5 h-3.5" />}
            >
              {customer.status === 'active' ? 'Deactivate' : 'Activate'}
            </Button>
          )}
        </div>
      </Card>

      {/* Tabs */}
      <div className="border-b border-slate-200 flex items-center gap-6 text-sm font-semibold overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 border-b-2 transition-colors flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === tab.key ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
            {typeof tab.count === 'number' && (
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${activeTab === tab.key ? 'bg-brand-100 text-brand-800' : 'bg-slate-100 text-slate-600'}`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader title="Contact & Location Details" />
              <CardBody className="pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                  <div className="p-3.5 bg-[#F5F7FA] rounded-[8px] border border-[#D9E2EC]">
                    <span className="text-[10px] text-[#52606D] font-extrabold block uppercase tracking-wider">Telephone</span>
                    <span className="font-bold text-[#172B4D] font-mono mt-0.5 block">{customer.phone || <span className="text-[#829AB1] italic">Not specified</span>}</span>
                  </div>
                  <div className="p-3.5 bg-[#F5F7FA] rounded-[8px] border border-[#D9E2EC]">
                    <span className="text-[10px] text-teal-800 font-extrabold block uppercase tracking-wider">WhatsApp Number</span>
                    <span className="font-bold text-teal-600 font-mono mt-0.5 block">{customer.whatsapp_number || <span className="text-[#829AB1] italic">Not specified</span>}</span>
                  </div>
                  <div className="p-3.5 bg-[#F5F7FA] rounded-[8px] border border-[#D9E2EC]">
                    <span className="text-[10px] text-[#52606D] font-extrabold block uppercase tracking-wider">City (Auto-acquired) & Route</span>
                    <span className="font-extrabold text-navy-900 mt-0.5 block">{customer.city || 'N/A'} {customer.route ? `• ${customer.route}` : ''}</span>
                  </div>
                  <div className="p-3.5 bg-[#F5F7FA] rounded-[8px] border border-[#D9E2EC]">
                    <span className="text-[10px] text-[#52606D] font-extrabold block uppercase tracking-wider">Country</span>
                    <span className="font-bold text-[#172B4D] mt-0.5 block">{customer.country || 'Canada'}</span>
                  </div>
                </div>
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Internal Account Notes" />
              <CardBody>
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                  {customer.notes || <span className="text-slate-400 italic">No operational notes recorded for this customer profile.</span>}
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader title="System Audit Info" />
              <CardBody className="pt-4">
                <div className="space-y-3 text-xs">
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-semibold block uppercase">Customer System ID</span>
                    <span className="font-mono text-slate-900 mt-0.5 block break-all">{customer.id}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-semibold block uppercase">Created Timestamp</span>
                    <span className="font-mono text-slate-900 mt-0.5 block">{formatDateTime(customer.created_at)}</span>
                    <span className="text-slate-500 mt-0.5 block">
                      By: <span className="font-semibold text-slate-800">{customer.created_by_profile?.full_name || 'System Admin'}</span>
                    </span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                    <span className="text-slate-500 font-semibold block uppercase">Last Modified</span>
                    <span className="font-mono text-slate-900 mt-0.5 block">{formatDateTime(customer.updated_at)}</span>
                    {customer.updated_by_profile && (
                      <span className="text-slate-500 mt-0.5 block">
                        By: <span className="font-semibold text-slate-800">{customer.updated_by_profile.full_name}</span>
                      </span>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'queries' && (
        <Card flush>
          <CardHeader
            title={`Customer Support Tickets (${customerQueries.length})`}
            actions={
              <Button size="sm" onClick={() => setIsCreateQueryModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                Create Support Query
              </Button>
            }
          />
          {customerQueries.length > 0 ? (
            <Table minWidth={1200}>
              <THead>
                <Tr hover={false}>
                  <Th width={140}>Number</Th>
                  <Th width={280}>Subject</Th>
                  <Th width={140}>Category</Th>
                  <Th width={130}>Priority</Th>
                  <Th width={130}>Status</Th>
                  <Th width={180}>Assigned Agent</Th>
                  <Th width={150} align="right">Action</Th>
                </Tr>
              </THead>
              <TBody>
                {customerQueries.map((q) => (
                  <Tr key={q.id}>
                    <Td width={140} className="font-mono text-xs font-bold text-brand-700">
                      <Link to={`/queries/${q.id}`} className="hover:underline">{q.query_number}</Link>
                    </Td>
                    <Td width={280} truncate className="font-medium text-slate-900">
                      <Link to={`/queries/${q.id}`} className="hover:text-brand-600">{q.subject}</Link>
                    </Td>
                    <Td width={140} truncate className="text-xs text-slate-600">{q.category?.name || 'General'}</Td>
                    <Td width={130}><Badge badge={getQueryPriorityBadge(q.priority)} /></Td>
                    <Td width={130}><Badge badge={getQueryStatusBadge(q.status)} /></Td>
                    <Td width={180} truncate className="text-xs">{q.assigned_to_profile?.full_name || <span className="text-slate-400 italic">Unassigned</span>}</Td>
                    <Td width={150} align="right">
                      <Link to={`/queries/${q.id}`} className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg inline-block transition-colors">
                        <Eye className="w-4 h-4" />
                      </Link>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState
              icon={<HelpCircle className="w-7 h-7" />}
              title="No Support Tickets Registered"
              description={`No customer query records exist for ${customer.company_name}.`}
              action={
                <Button size="sm" onClick={() => setIsCreateQueryModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
                  Create First Query
                </Button>
              }
            />
          )}
        </Card>
      )}

      {activeTab === 'orders' && (
        <Card flush>
          <CardHeader
            title={`Customer Daily Route Operations History (${customerDailyOps.length})`}
          />
          {customerDailyOps.length > 0 ? (
            <Table minWidth={1250}>
              <THead>
                <Tr hover={false}>
                  <Th width={140}>Operation Date</Th>
                  <Th width={170}>Route</Th>
                  <Th width={120} align="center">Order Received</Th>
                  <Th width={130}>SO #</Th>
                  <Th width={130}>Invoice #</Th>
                  <Th width={120} align="center">Dispatched</Th>
                  <Th width={110} align="center">POD Sent</Th>
                  <Th width={120} align="center">Order Match</Th>
                  <Th width={150}>Operational Status</Th>
                </Tr>
              </THead>
              <TBody>
                {customerDailyOps.map((op) => (
                  <Tr key={op.id}>
                    <Td width={140} className="font-mono font-bold text-slate-900 text-xs">
                      {formatDate(op.operation_date)}
                    </Td>
                    <Td width={170} truncate className="font-bold text-brand-700 text-xs">{op.route}</Td>
                    <Td width={120} align="center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${op.order_received ? 'bg-sky-100 text-sky-800' : 'bg-slate-100 text-slate-400'}`}>
                        {op.order_received ? '✓ Yes' : 'No'}
                      </span>
                    </Td>
                    <Td width={130} className="font-mono text-xs font-bold text-indigo-700">
                      {op.sales_order_number || '—'}
                    </Td>
                    <Td width={130} className="font-mono text-xs font-bold text-purple-700">
                      {op.invoice_number || '—'}
                    </Td>
                    <Td width={120} align="center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${op.dispatched ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-400'}`}>
                        {op.dispatched ? '✓ Yes' : 'No'}
                      </span>
                    </Td>
                    <Td width={110} align="center">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${op.pod_sent ? 'bg-cyan-100 text-cyan-800' : 'bg-slate-100 text-slate-400'}`}>
                        {op.pod_sent ? '✓ Yes' : 'No'}
                      </span>
                    </Td>
                    <Td width={120} align="center">
                      {op.order_match ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                          op.order_match === 'DIFFERENT'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`} title={op.difference_note || undefined}>
                          {op.order_match}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-300 font-semibold">—</span>
                      )}
                    </Td>
                    <Td width={150}>
                      <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase ${
                        op.status === 'completed' ? 'bg-emerald-100 text-emerald-800' :
                        op.status === 'error' ? 'bg-rose-100 text-rose-800' :
                        'bg-sky-50 text-sky-800'
                      }`}>
                        {op.status.replace(/_/g, ' ')}
                      </span>
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState
              icon={<ShoppingBag className="w-7 h-7" />}
              title="No Route Operations Logged"
              description={`No daily route operation records exist for ${customer.company_name}.`}
            />
          )}
        </Card>
      )}

      {activeTab === 'history' && (
        <Card flush>
          <CardHeader
            title="Historical Purchasing Catalog"
            subtitle="Extracted business ordering history — Pricing & packaging agreed for this customer. Separated from live inventory availability."
          />
          {productHistory.length > 0 ? (
            <Table minWidth={1180}>
              <THead className="bg-slate-50">
                <Tr>
                  <Th width={150}>Item Code</Th>
                  <Th width={300}>Product Description</Th>
                  <Th width={140}>Packaging Unit</Th>
                  <Th width={120} align="right">Customer Price</Th>
                  <Th width={140}>Inner Pack Details</Th>
                  <Th width={130} align="right">Unit Price</Th>
                  <Th width={150}>Catalog Stock Status</Th>
                </Tr>
              </THead>
              <TBody>
                {productHistory.map((item, idx) => (
                  <Tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                    <Td width={150} className="font-mono text-xs font-bold text-brand-700">{item.source_item_code}</Td>
                    <Td width={300} truncate className="font-semibold text-slate-900">{item.source_item_name}</Td>
                    <Td width={140}>
                      <Pill className="text-xs font-mono font-semibold">
                        {item.packaging_unit}
                      </Pill>
                    </Td>
                    <Td width={120} align="right" className="font-mono font-bold text-slate-900 text-sm">
                      ${item.customer_price.toFixed(2)}
                    </Td>
                    <Td width={140} truncate className="text-slate-600 text-xs font-mono">
                      {item.inner_qty ? `${item.inner_qty.toLocaleString()} ${item.inner_unit || ''}` : 'N/A'}
                    </Td>
                    <Td width={130} align="right" truncate className="font-mono text-xs text-slate-700">
                      {item.unit_price ? `$${item.unit_price.toFixed(4)} / ${item.inner_unit || 'pc'}` : 'N/A'}
                    </Td>
                    <Td width={150}>
                      {item.product ? (
                        <Badge badge={getProductAvailabilityBadge(item.product.availability_status)} />
                      ) : (
                        <Pill className="text-[10px]">Catalog Reference</Pill>
                      )}
                    </Td>
                  </Tr>
                ))}
              </TBody>
            </Table>
          ) : (
            <EmptyState
              icon={<Package className="w-8 h-8" />}
              title="No Historical Products Found"
              description={`No previous purchasing history has been linked to ${customer.company_name}.`}
            />
          )}
        </Card>
      )}

      {activeTab === 'activity' && (
        <Card>
          <CardHeader title="Customer Record Audit Timeline" />
          <CardBody>
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
              <div className="relative">
                <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 border-2 border-white ring-4 ring-emerald-50" />
                <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" />
                  <span>{formatDateTime(customer.created_at)}</span>
                </div>
                <p className="text-sm font-bold text-slate-900 mt-1">Customer Profile Created</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  Initial customer record was registered by <span className="font-semibold text-slate-800">{customer.created_by_profile?.full_name || 'System Admin'}</span> with code{' '}
                  <span className="font-mono font-bold text-brand-600">{customer.customer_code}</span>.
                </p>
              </div>

              {customer.updated_at !== customer.created_at && (
                <div className="relative">
                  <div className="absolute -left-[31px] top-0.5 w-4 h-4 rounded-full bg-brand-500 border-2 border-white ring-4 ring-brand-50" />
                  <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatDateTime(customer.updated_at)}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-1">Customer Profile Updated</p>
                  <p className="text-xs text-slate-600 mt-0.5">
                    Record information was updated by <span className="font-semibold text-slate-800">{customer.updated_by_profile?.full_name || 'System User'}</span>.
                  </p>
                </div>
              )}
            </div>
          </CardBody>
        </Card>
      )}

      <CustomerFormModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} onSubmit={handleUpdateCustomer} customerToEdit={customer} isSubmitting={isSubmitting} />

      <QueryFormModal
        isOpen={isCreateQueryModalOpen}
        onClose={() => setIsCreateQueryModalOpen(false)}
        onSubmit={(data) => {
          if (!user) return;
          localDb.createQuery(data, user.id);
          setIsCreateQueryModalOpen(false);
          toast({ type: 'success', title: 'Support query created', message: 'The customer support query has been created.' });
        }}
        preselectedCustomerId={customer.id}
      />

      <OrderFormModal
        isOpen={isCreateOrderModalOpen}
        onClose={() => setIsCreateOrderModalOpen(false)}
        onSubmit={(data) => {
          if (!user) return;
          localDb.createOrder(data, user.id);
          setIsCreateOrderModalOpen(false);
          toast({ type: 'success', title: 'Order created', message: 'The customer order has been created.' });
        }}
        preselectedCustomerId={customer.id}
      />

      <ConfirmDialog
        isOpen={confirmStatusOpen}
        onClose={() => setConfirmStatusOpen(false)}
        onConfirm={handleToggleStatus}
        title={customer.status === 'active' ? 'Deactivate Customer?' : 'Activate Customer?'}
        message={
          <>
            Are you sure you want to {customer.status === 'active' ? 'deactivate' : 'activate'} <span className="font-semibold">{customer.company_name}</span> ({customer.customer_code})?
          </>
        }
        confirmLabel={customer.status === 'active' ? 'Confirm Deactivation' : 'Confirm Activation'}
        variant={customer.status === 'active' ? 'danger' : 'success'}
        icon={<Power className="w-5 h-5" />}
      />
    </div>
  );
};
