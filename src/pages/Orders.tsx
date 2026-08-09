import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus, OrderFormInput } from '../types';
import { localDb } from '../services/db';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import { OrderStatusModal } from '../components/orders/OrderStatusModal';
import { Badge, Button, Card, EmptyState, Input, PageHeader, Pagination, Select, Table, Tabs, TBody, Td, Th, THead, Tr, useToast } from '../components/ui';
import { getOrderStatusBadge } from '../utils/badges';
import { formatCurrency, formatDate } from '../utils/format';
import { ShoppingBag, Search, Plus, RotateCcw, Ban, X, User, ArrowRight, Users } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

type ViewTab = 'all' | 'my' | 'team';

export const Orders: React.FC = () => {
  const { user, dbVersion } = useAuth();
  const { toast } = useToast();

  const [activeViewTab, setActiveViewTab] = useState<ViewTab>('all');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);
  const [statusModalTarget, setStatusModalTarget] = useState<OrderStatus | null>(null);
  const [isCancelMode, setIsCancelMode] = useState(false);

  const customers = useMemo(() => localDb.getCustomers(), [dbVersion]);
  const agents = useMemo(() => localDb.getUsers().filter((u) => u.role === 'sales_agent' || u.role === 'admin'), [dbVersion]);
  const teams = useMemo(() => localDb.getTeams(), [dbVersion]);

  const userTeam = useMemo(() => (user ? teams.find((t) => t.id === user.team_id) || null : null), [user, teams]);

  const allOrdersCount = useMemo(() => localDb.getOrders().length, [dbVersion]);

  const filteredOrders = useMemo(() => {
    return localDb.getOrders(
      {
        searchTerm,
        status: statusFilter,
        sales_agent_id: agentFilter,
        customer_id: customerFilter !== 'all' ? customerFilter : undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        myOrdersOnly: activeViewTab === 'my',
        teamOrdersOnly: activeViewTab === 'team',
      },
      user?.id
    );
  }, [
    searchTerm,
    statusFilter,
    agentFilter,
    customerFilter,
    startDate,
    endDate,
    activeViewTab,
    user?.id,
    dbVersion,
  ]);

  const totalPages = Math.ceil(filteredOrders.length / ITEMS_PER_PAGE) || 1;
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredOrders, currentPage]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setAgentFilter('all');
    setCustomerFilter('all');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'all' || agentFilter !== 'all' || customerFilter !== 'all' || startDate || endDate;

  const handleFormSubmit = (data: OrderFormInput) => {
    if (!user) return;
    if (orderToEdit) {
      const updated = localDb.updateOrder(orderToEdit.id, data, user.id);
      if (updated) {
        toast({ type: 'success', title: 'Order updated', message: `Order ${updated.order_number} updated successfully.` });
      }
    } else {
      const created = localDb.createOrder(data, user.id);
      toast({ type: 'success', title: 'Order created', message: `Order ${created.order_number} created successfully.` });
    }

    setIsFormModalOpen(false);
  };

  const handleStatusSubmit = (
    targetStatus: OrderStatus,
    extraData?: { notes?: string; cancellation_reason?: string; is_admin_override?: boolean }
  ) => {
    if (!statusModalOrder || !user) return;
    try {
      const updated = localDb.advanceOrderStatus(statusModalOrder.id, targetStatus, user.id, extraData);
      if (updated) {
        const msg = targetStatus === 'cancelled'
          ? `Order ${updated.order_number} has been cancelled.`
          : `Order ${updated.order_number} status advanced to ${targetStatus.replace(/_/g, ' ').toUpperCase()}.`;
        toast({ type: 'success', title: 'Status advanced', message: msg });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Transition error', message: err.message || 'Workflow transition error.' });
    }
    setStatusModalOrder(null);
    setStatusModalTarget(null);
    setIsCancelMode(false);
  };

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

  const tabDefs = [
    { value: 'all' as const, label: (<span className="flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> All Orders</span>), count: allOrdersCount },
    { value: 'my' as const, label: (<span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> My Orders</span>), count: localDb.getOrders({ myOrdersOnly: true }, user?.id).length },
    ...(userTeam
      ? [{ value: 'team' as const, label: (<span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" /> {userTeam.name}</span>), count: localDb.getOrders({ teamOrdersOnly: true }, user?.id).length }]
      : []),
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<ShoppingBag className="w-5 h-5 text-brand-400" />}
        title="Order Management"
        description="Track orders from reception to signed invoice completion"
        actions={
          <Button
            onClick={() => {
              setOrderToEdit(null);
              setIsFormModalOpen(true);
            }}
            icon={<Plus className="w-4 h-4" />}
          >
            New Customer Order
          </Button>
        }
      />

      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <Tabs
            size="md"
            tabs={tabDefs}
            active={activeViewTab}
            onChange={(value) => {
              setActiveViewTab(value);
              setCurrentPage(1);
            }}
          />

          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline">
              <X className="w-3.5 h-3.5" />
              Clear All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search ORD-#, Customer, Agent, SKU..."
              icon={<Search className="w-4 h-4 text-slate-400" />}
              className="pl-9"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Workflow Statuses</option>
            <option value="order_received">Order Received</option>
            <option value="sales_order_done">Sales Order Done</option>
            <option value="invoiced">Invoiced</option>
            <option value="dispatched">Dispatched</option>
            <option value="signed_invoice_sent">Signed Invoice Sent</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </Select>
          <Select
            value={agentFilter}
            onChange={(e) => {
              setAgentFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Sales Agents</option>
            {agents.map((a) => (
              <option key={a.id} value={a.id}>{a.full_name}</option>
            ))}
          </Select>
          <Select
            value={customerFilter}
            onChange={(e) => {
              setCustomerFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Customers</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>{c.company_name}</option>
            ))}
          </Select>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setCurrentPage(1);
            }}
            label="From Date"
          />
          <Input
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setCurrentPage(1);
            }}
            label="To Date"
          />
        </div>
      </Card>

      <Card className="overflow-hidden">
        {paginatedOrders.length > 0 ? (
          <Table>
            <THead>
              <Tr hover={false}>
                <Th>Order Number</Th>
                <Th>Customer</Th>
                <Th>Sales Agent</Th>
                <Th>Order Date</Th>
                <Th>Delivery Date</Th>
                <Th>Current Status</Th>
                <Th className="font-mono">Grand Total</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {paginatedOrders.map((order) => {
                const nextSt = getNextStatus(order.current_status);
                return (
                  <Tr key={order.id}>
                    <Td className="font-mono font-bold text-brand-700">
                      <Link to={`/orders/${order.id}`} className="hover:underline">{order.order_number}</Link>
                    </Td>
                    <Td className="font-semibold text-slate-900">
                      {order.customer ? (
                        <Link to={`/customers/${order.customer.id}`} className="hover:text-brand-600">{order.customer.company_name}</Link>
                      ) : (
                        <span className="text-slate-400 italic">Unknown</span>
                      )}
                    </Td>
                    <Td>
                      {order.sales_agent_profile ? (
                        <span className="font-medium text-slate-800">{order.sales_agent_profile.full_name}</span>
                      ) : (
                        <span className="text-slate-400 italic">Unassigned</span>
                      )}
                    </Td>
                    <Td className="font-mono text-slate-500">{formatDate(order.order_date)}</Td>
                    <Td className="font-mono text-slate-500">
                      {order.expected_delivery_date ? (
                        formatDate(order.expected_delivery_date)
                      ) : (
                        <span className="text-slate-400 italic">Not set</span>
                      )}
                    </Td>
                    <Td><Badge badge={getOrderStatusBadge(order.current_status)} /></Td>
                    <Td className="font-mono font-extrabold text-slate-900">{formatCurrency(order.grand_total)}</Td>
                    <Td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Link
                          to={`/orders/${order.id}`}
                          title="View Workflow & Order Details"
                          className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                        {nextSt && order.current_status !== 'completed' && order.current_status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setStatusModalOrder(order);
                              setStatusModalTarget(nextSt);
                              setIsCancelMode(false);
                            }}
                            title={`Advance to ${getOrderStatusBadge(nextSt).label}`}
                            className="p-1.5 text-slate-600 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        {order.current_status !== 'completed' && order.current_status !== 'cancelled' && (
                          <button
                            onClick={() => {
                              setStatusModalOrder(order);
                              setStatusModalTarget('cancelled');
                              setIsCancelMode(true);
                            }}
                            title="Cancel Order"
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          >
                            <Ban className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </Td>
                  </Tr>
                );
              })}
            </TBody>
          </Table>
        ) : (
          <EmptyState
            icon={<ShoppingBag className="w-7 h-7" />}
            title="No Customer Orders Found"
            description={
              hasActiveFilters
                ? 'No customer orders matched your search term or active status filters.'
                : 'There are currently no customer orders registered in the CRM database.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear Search & Filters
                </Button>
              ) : (
                <Button
                  size="sm"
                  icon={<Plus className="w-3.5 h-3.5" />}
                  onClick={() => {
                    setOrderToEdit(null);
                    setIsFormModalOpen(true);
                  }}
                >
                  Create First Order
                </Button>
              )
            }
          />
        )}

        {filteredOrders.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="orders"
          />
        )}
      </Card>

      <OrderFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        orderToEdit={orderToEdit}
      />

      <OrderStatusModal
        isOpen={!!statusModalOrder}
        onClose={() => {
          setStatusModalOrder(null);
          setStatusModalTarget(null);
          setIsCancelMode(false);
        }}
        onSubmit={handleStatusSubmit}
        order={statusModalOrder}
        targetStatus={statusModalTarget}
        isCancelMode={isCancelMode}
      />
    </div>
  );
};
