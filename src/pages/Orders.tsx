import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Order, OrderStatus, OrderFormInput } from '../types';
import { localDb } from '../services/db';
import { OrderFormModal } from '../components/orders/OrderFormModal';
import { OrderStatusModal } from '../components/orders/OrderStatusModal';
import { 
  ShoppingBag, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  RotateCcw, 
  CheckCircle, 
  AlertCircle, 
  X,
  ChevronLeft, 
  ChevronRight,
  User,
  Clock,
  Ban,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const Orders: React.FC = () => {
  const { user, dbVersion } = useAuth();
  const navigate = useNavigate();

  // Tab: 'all' vs 'my' vs 'team'
  const [activeViewTab, setActiveViewTab] = useState<'all' | 'my' | 'team'>('all');

  // Search & Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [agentFilter, setAgentFilter] = useState<string>('all');
  const [customerFilter, setCustomerFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);

  const [statusModalOrder, setStatusModalOrder] = useState<Order | null>(null);
  const [statusModalTarget, setStatusModalTarget] = useState<OrderStatus | null>(null);
  const [isCancelMode, setIsCancelMode] = useState(false);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const customers = useMemo(() => localDb.getCustomers(), [dbVersion]);
  const agents = useMemo(() => localDb.getUsers().filter(u => u.role === 'sales_agent' || u.role === 'admin'), [dbVersion]);

  // Fetch filtered orders
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
    feedback,
    dbVersion,
  ]);

  // Pagination calculation
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
        setFeedback({ type: 'success', message: `Order ${updated.order_number} updated successfully.` });
      }
    } else {
      const created = localDb.createOrder(data, user.id);
      setFeedback({ type: 'success', message: `Order ${created.order_number} created successfully.` });
    }

    setIsFormModalOpen(false);
    setTimeout(() => setFeedback(null), 4000);
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
        setFeedback({ type: 'success', message: msg });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Workflow transition error.' });
    }
    setStatusModalOrder(null);
    setStatusModalTarget(null);
    setIsCancelMode(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  // Helper badge styles
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

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xs">
            <ShoppingBag className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Order Management</h1>
            <p className="text-xs text-slate-500">Track orders from reception to signed invoice completion</p>
          </div>
        </div>

        <button
          onClick={() => {
            setOrderToEdit(null);
            setIsFormModalOpen(true);
          }}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors shadow-sm space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer Order</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-xs animate-in fade-in duration-200 ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* View Tabs & Filters Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        
        {/* View Tabs: All Orders vs My Orders */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setActiveViewTab('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeViewTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Orders ({localDb.getOrders().length})
            </button>
            <button
              onClick={() => {
                setActiveViewTab('my');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeViewTab === 'my'
                  ? 'bg-sky-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Assigned Orders ({localDb.getOrders({ myOrdersOnly: true }, user?.id).length})</span>
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>

        {/* Search Input & Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search ORD-#, Customer, Agent, SKU..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">All Workflow Statuses</option>
              <option value="order_received">Order Received</option>
              <option value="sales_order_done">Sales Order Done</option>
              <option value="invoiced">Invoiced</option>
              <option value="dispatched">Dispatched</option>
              <option value="signed_invoice_sent">Signed Invoice Sent</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Sales Agent Filter */}
          <div>
            <select
              value={agentFilter}
              onChange={(e) => {
                setAgentFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">All Sales Agents</option>
              {agents.map(a => (
                <option key={a.id} value={a.id}>{a.full_name}</option>
              ))}
            </select>
          </div>

          {/* Customer Filter */}
          <div>
            <select
              value={customerFilter}
              onChange={(e) => {
                setCustomerFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">All Customers</option>
              {customers.map(c => (
                <option key={c.id} value={c.id}>{c.company_name}</option>
              ))}
            </select>
          </div>

        </div>

      </div>

      {/* Orders Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {paginatedOrders.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Order Number</th>
                  <th className="px-5 py-3">Customer</th>
                  <th className="px-5 py-3">Sales Agent</th>
                  <th className="px-5 py-3">Order Date</th>
                  <th className="px-5 py-3">Delivery Date</th>
                  <th className="px-5 py-3">Current Status</th>
                  <th className="px-5 py-3 font-mono">Grand Total</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedOrders.map((order) => {
                  const nextSt = getNextStatus(order.current_status);
                  return (
                    <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                      
                      {/* Order Number */}
                      <td className="px-5 py-3.5 font-mono font-bold text-sky-700">
                        <Link to={`/orders/${order.id}`} className="hover:underline">
                          {order.order_number}
                        </Link>
                      </td>

                      {/* Customer */}
                      <td className="px-5 py-3.5 font-semibold text-slate-900">
                        {order.customer ? (
                          <Link to={`/customers/${order.customer.id}`} className="hover:text-sky-600">
                            {order.customer.company_name}
                          </Link>
                        ) : (
                          <span className="text-slate-400 italic">Unknown</span>
                        )}
                      </td>

                      {/* Sales Agent */}
                      <td className="px-5 py-3.5">
                        {order.sales_agent_profile ? (
                          <span className="font-medium text-slate-800">{order.sales_agent_profile.full_name}</span>
                        ) : (
                          <span className="text-slate-400 italic">Unassigned</span>
                        )}
                      </td>

                      {/* Order Date */}
                      <td className="px-5 py-3.5 font-mono text-slate-500">
                        {new Date(order.order_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>

                      {/* Delivery Date */}
                      <td className="px-5 py-3.5 font-mono text-slate-500">
                        {order.expected_delivery_date ? (
                          new Date(order.expected_delivery_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        ) : (
                          <span className="text-slate-400 italic">Not set</span>
                        )}
                      </td>

                      {/* Status Badge */}
                      <td className="px-5 py-3.5">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider border ${getStatusBadgeStyle(order.current_status)}`}>
                          {formatStatusLabel(order.current_status)}
                        </span>
                      </td>

                      {/* Grand Total */}
                      <td className="px-5 py-3.5 font-mono font-extrabold text-slate-900">
                        ${order.grand_total.toFixed(2)}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-3.5 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          
                          {/* View Details */}
                          <button
                            onClick={() => navigate(`/orders/${order.id}`)}
                            title="View Workflow & Order Details"
                            className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Quick Workflow Advance Button */}
                          {nextSt && order.current_status !== 'completed' && order.current_status !== 'cancelled' && (
                            <button
                              onClick={() => {
                                setStatusModalOrder(order);
                                setStatusModalTarget(nextSt);
                                setIsCancelMode(false);
                              }}
                              title={`Advance to ${formatStatusLabel(nextSt)}`}
                              className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Quick Cancel Button */}
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
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <ShoppingBag className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No Customer Orders Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {hasActiveFilters
                ? 'No customer orders matched your search term or active status filters.'
                : 'There are currently no customer orders registered in the CRM database.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-sky-600 hover:underline"
              >
                Clear Search & Filters
              </button>
            ) : (
              <button
                onClick={() => {
                  setOrderToEdit(null);
                  setIsFormModalOpen(true);
                }}
                className="inline-flex items-center px-3.5 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create First Order
              </button>
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {filteredOrders.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredOrders.length)}</span> to{' '}
              <span className="font-semibold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredOrders.length)}</span> of{' '}
              <span className="font-semibold text-slate-900">{filteredOrders.length}</span> orders
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-800 px-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

      {/* Modals */}
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
