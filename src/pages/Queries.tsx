import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../services/db';
import { CustomerQuery, QueryFormInput, BackOrderItem, BackOrderStatus } from '../types';
import { QUERY_ISSUE_CATEGORIES, QUERY_STATUS_CONFIG, QUERY_PRIORITY_CONFIG, BACK_ORDER_STATUS_CONFIG } from '../utils/queryConstants';
import { formatDateShort } from '../utils/dateUtils';
import { formatDateTime } from '../utils/format';
import { QueryFormModal } from '../components/queries/QueryFormModal';
import { MobileQueryCard } from '../components/queries/MobileQueryCard';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Table,
  TableToolbar,
  Tabs,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useToast,
} from '../components/ui';
import {
  HelpCircle,
  Plus,
  Search,
  Inbox,
  User,
  Users,
  X,
  PackageCheck,
  Package,
  CalendarPlus,
  Clock,
  CheckCircle2,
  AlertCircle,
  Truck,
  RotateCcw,
  Tag,
  ReceiptText,
  ShieldAlert,
  PackageSearch,
  PackageX,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';

const ITEMS_PER_PAGE = 15;

type ViewTab = 'queries' | 'back_orders';

export const Queries: React.FC = () => {
  const { user, dbVersion } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeViewTab, setActiveViewTab] = useState<ViewTab>('queries');

  const [customerSearchTerm, setCustomerSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [issueTypeFilter, setIssueTypeFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [backOrderStatusFilter, setBackOrderStatusFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = useMemo(() => localDb.getCategories(), [dbVersion]);
  const agents = useMemo(() => localDb.getUsers(), [dbVersion]);

  // Load queries and back orders from localDb
  const allQueries = useMemo(() => localDb.getQueries({}, user?.id), [dbVersion]);
  const allBackOrders = useMemo(() => localDb.getBackOrders(), [dbVersion]);

  // Derived KPI Counts
  const stats = useMemo(() => {
    const openCount = allQueries.filter((q) => ['new', 'open', 'assigned'].includes(q.status)).length;
    const inProgressCount = allQueries.filter((q) => q.status === 'in_progress').length;
    const waitingCount = allQueries.filter((q) => q.status === 'waiting_customer').length;
    const backOrdersCount = allBackOrders.filter((b) => b.status === 'PENDING' || b.status === 'SCHEDULED').length;
    const resolvedCount = allQueries.filter((q) => q.status === 'resolved' || q.status === 'closed').length;

    return { openCount, inProgressCount, waitingCount, backOrdersCount, resolvedCount };
  }, [allQueries, allBackOrders]);

  // Filtered Queries
  const filteredQueries = useMemo(() => {
    let result = allQueries;

    if (statusFilter !== 'all') {
      if (statusFilter === 'open') {
        result = result.filter((q) => ['new', 'open', 'assigned'].includes(q.status));
      } else {
        result = result.filter((q) => q.status === statusFilter);
      }
    }

    if (issueTypeFilter !== 'all') {
      result = result.filter((q) => q.issue_type === issueTypeFilter);
    }

    if (priorityFilter !== 'all') {
      result = result.filter((q) => q.priority === priorityFilter);
    }

    if (customerSearchTerm.trim()) {
      const q = customerSearchTerm.toLowerCase().trim();
      result = result.filter(
        (query) =>
          query.query_number.toLowerCase().includes(q) ||
          (query.customer && query.customer.company_name.toLowerCase().includes(q)) ||
          (query.customer && query.customer.customer_code.toLowerCase().includes(q)) ||
          (query.customer && query.customer.phone && query.customer.phone.toLowerCase().includes(q)) ||
          (query.customer && query.customer.city && query.customer.city.toLowerCase().includes(q)) ||
          (query.customer && query.customer.route && query.customer.route.toLowerCase().includes(q))
      );
    }

    if (productSearchTerm.trim()) {
      const q = productSearchTerm.toLowerCase().trim();
      result = result.filter(
        (query) =>
          query.subject.toLowerCase().includes(q) ||
          query.description.toLowerCase().includes(q) ||
          (query.product && query.product.product_name.toLowerCase().includes(q)) ||
          (query.product && query.product.sku.toLowerCase().includes(q)) ||
          (query.expected_item && query.expected_item.toLowerCase().includes(q)) ||
          (query.received_item && query.received_item.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allQueries, statusFilter, issueTypeFilter, priorityFilter, customerSearchTerm, productSearchTerm]);

  // Filtered Back Orders
  const filteredBackOrders = useMemo(() => {
    let result = allBackOrders;

    if (backOrderStatusFilter !== 'all') {
      result = result.filter((b) => b.status === backOrderStatusFilter);
    }

    if (customerSearchTerm.trim()) {
      const q = customerSearchTerm.toLowerCase().trim();
      result = result.filter(
        (b) =>
          (b.customer && b.customer.company_name.toLowerCase().includes(q)) ||
          (b.customer && b.customer.city && b.customer.city.toLowerCase().includes(q)) ||
          (b.customer && b.customer.route && b.customer.route.toLowerCase().includes(q))
      );
    }

    if (productSearchTerm.trim()) {
      const q = productSearchTerm.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.product_name_snapshot.toLowerCase().includes(q) ||
          (b.sku_snapshot && b.sku_snapshot.toLowerCase().includes(q)) ||
          b.reason.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allBackOrders, backOrderStatusFilter, customerSearchTerm, productSearchTerm]);

  const totalPages = Math.ceil(
    (activeViewTab === 'queries' ? filteredQueries.length : filteredBackOrders.length) / ITEMS_PER_PAGE
  ) || 1;

  const pagedQueries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQueries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQueries, currentPage]);

  const pagedBackOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBackOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBackOrders, currentPage]);

  if (!user) return null;

  const handleClearFilters = () => {
    setCustomerSearchTerm('');
    setProductSearchTerm('');
    setStatusFilter('all');
    setIssueTypeFilter('all');
    setPriorityFilter('all');
    setBackOrderStatusFilter('all');
    setCurrentPage(1);
  };

  const handleCreateQuery = (data: QueryFormInput) => {
    setIsSubmitting(true);
    try {
      const created = localDb.createQuery(data, user.id);
      setIsCreateModalOpen(false);
      toast({
        type: 'success',
        title: 'Customer issue logged',
        message: `Issue ${created.query_number} saved successfully.`,
      });
      navigate(`/queries/${created.id}`);
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Creation failed',
        message: err.message || 'Unable to log customer issue.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateBackOrderStatus = (id: string, newStatus: BackOrderStatus) => {
    try {
      localDb.updateBackOrderStatus(id, newStatus);
      toast({
        type: 'success',
        title: 'Back Order updated',
        message: `Status changed to ${newStatus}.`,
      });
    } catch {
      toast({ type: 'error', title: 'Update failed', message: 'Could not update Back Order status.' });
    }
  };

  const getIssueCategoryBadge = (issueType?: string | null) => {
    const cat = QUERY_ISSUE_CATEGORIES.find((c) => c.key === issueType) || QUERY_ISSUE_CATEGORIES[7];
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${cat.badgeClass}`}>
        {cat.shortLabel}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<HelpCircle className="w-5 h-5 text-brand-400" />}
        title="Customer Issue & Resolution Center"
        description="Log, track, resolve customer operational issues, price mismatches, quality returns, and pending back orders"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            New Customer Issue
          </Button>
        }
      />

      {/* KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        <div
          onClick={() => {
            setActiveViewTab('queries');
            setStatusFilter('open');
          }}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard title="Open Issues" value={stats.openCount} icon={<Inbox className="w-4 h-4" />} accent="brand" description="Needs attention" />
        </div>

        <div
          onClick={() => {
            setActiveViewTab('queries');
            setStatusFilter('in_progress');
          }}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard title="In Progress" value={stats.inProgressCount} icon={<Clock className="w-4 h-4" />} accent="amber" description="Active work" />
        </div>

        <div
          onClick={() => {
            setActiveViewTab('queries');
            setStatusFilter('waiting_customer');
          }}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard title="Waiting Info" value={stats.waitingCount} icon={<HelpCircle className="w-4 h-4" />} accent="violet" description="Pending response" />
        </div>

        <div
          onClick={() => setActiveViewTab('back_orders')}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard title="Pending Back Orders" value={stats.backOrdersCount} icon={<CalendarPlus className="w-4 h-4" />} accent="teal" description="Next delivery queue" />
        </div>

        <div
          onClick={() => {
            setActiveViewTab('queries');
            setStatusFilter('resolved');
          }}
          className="cursor-pointer transition-transform hover:scale-[1.01]"
        >
          <StatCard title="Resolved / Closed" value={stats.resolvedCount} icon={<CheckCircle2 className="w-4 h-4" />} accent="green" description="Completed" />
        </div>
      </div>

      {/* Main View Tabs */}
      <TableToolbar>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-3">
          <Tabs
            size="md"
            tabs={[
              { value: 'queries', label: `Customer Issues (${filteredQueries.length})` },
              { value: 'back_orders', label: `Pending Back Orders (${filteredBackOrders.length})` },
            ]}
            active={activeViewTab}
            onChange={(v) => {
              setActiveViewTab(v as ViewTab);
              setCurrentPage(1);
            }}
          />

          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            Log Issue
          </Button>
        </div>

        {/* Dual Fast Search & Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <Input
            type="text"
            value={customerSearchTerm}
            onChange={(e) => {
              setCustomerSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search customer, phone, city, route..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
            className="pl-9"
          />

          <Input
            type="text"
            value={productSearchTerm}
            onChange={(e) => {
              setProductSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search product or SKU..."
            icon={<Package className="w-4 h-4 text-slate-400" />}
            className="pl-9"
          />

          {activeViewTab === 'queries' ? (
            <>
              <Select
                value={issueTypeFilter}
                onChange={(e) => {
                  setIssueTypeFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Issue Categories</option>
                {QUERY_ISSUE_CATEGORIES.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.name}
                  </option>
                ))}
              </Select>

              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="all">All Statuses</option>
                <option value="open">Open Issues</option>
                <option value="in_progress">In Progress</option>
                <option value="waiting_customer">Waiting</option>
                <option value="resolved">Resolved</option>
                <option value="closed">Closed</option>
              </Select>
            </>
          ) : (
            <Select
              value={backOrderStatusFilter}
              onChange={(e) => {
                setBackOrderStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
            >
              <option value="all">All Back Order Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="SCHEDULED">Scheduled</option>
              <option value="SENT">Sent</option>
              <option value="COMPLETED">Completed</option>
            </Select>
          )}
        </div>
      </TableToolbar>

      {/* Content View: Customer Queries vs Back Orders */}
      {activeViewTab === 'queries' ? (
        <>
          {/* Desktop Table View */}
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <THead>
                <Tr>
                  <Th>Customer</Th>
                  <Th>Issue Category</Th>
                  <Th>Product / Order</Th>
                  <Th>Action Required</Th>
                  <Th>Priority</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th align="right">Action</Th>
                </Tr>
              </THead>
              <TBody>
                {pagedQueries.length > 0 ? (
                  pagedQueries.map((q) => {
                    const statusConf = QUERY_STATUS_CONFIG[q.status] || QUERY_STATUS_CONFIG.open;
                    const priorityConf = QUERY_PRIORITY_CONFIG[q.priority] || QUERY_PRIORITY_CONFIG.medium;
                    return (
                      <Tr key={q.id} className="hover:bg-slate-50 transition-colors">
                        {/* Customer */}
                        <Td>
                          <div>
                            <Link to={`/customers/${q.customer_id}`} className="font-extrabold text-slate-900 hover:text-brand-600 block truncate max-w-[200px]">
                              {q.customer?.company_name || 'Customer'}
                            </Link>
                            <span className="text-xs text-slate-500 block truncate">
                              {q.customer?.city ? `${q.customer.city} (${q.customer.route || 'Route'})` : q.customer?.phone || '—'}
                            </span>
                          </div>
                        </Td>

                        {/* Issue Category */}
                        <Td>{getIssueCategoryBadge(q.issue_type)}</Td>

                        {/* Product / Order */}
                        <Td>
                          <div className="text-xs max-w-[220px]">
                            {q.product ? (
                              <span className="font-bold text-slate-900 block truncate">{q.product.product_name}</span>
                            ) : q.expected_item ? (
                              <span className="font-bold text-slate-900 block truncate">{q.expected_item}</span>
                            ) : (
                              <span className="font-bold text-slate-900 block truncate">{q.subject}</span>
                            )}
                            {q.order && (
                              <span className="font-mono text-brand-700 font-semibold block text-[11px]">Order #{q.order.order_number}</span>
                            )}
                          </div>
                        </Td>

                        {/* Action Required */}
                        <Td>
                          <span className="text-xs font-bold text-slate-800 capitalize">
                            {(q.action_required || 'investigate').replace(/_/g, ' ')}
                          </span>
                        </Td>

                        {/* Priority */}
                        <Td>
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border ${priorityConf.badgeClass}`}>
                            {priorityConf.label}
                          </span>
                        </Td>

                        {/* Status */}
                        <Td>
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border ${statusConf.badgeClass}`}>
                            {statusConf.label}
                          </span>
                        </Td>

                        {/* Created */}
                        <Td>
                          <span className="text-xs text-slate-500 font-medium block whitespace-nowrap">
                            {formatDateShort(q.created_at)}
                          </span>
                        </Td>

                        {/* Action */}
                        <Td align="right">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/queries/${q.id}`)} icon={<ArrowRight className="w-3 h-3" />}>
                            View
                          </Button>
                        </Td>
                      </Tr>
                    );
                  })
                ) : (
                  <Tr>
                    <Td colSpan={8}>
                      <EmptyState
                        icon={<Inbox className="w-10 h-10 text-slate-400" />}
                        title="Everything is clear"
                        description="No customer issues match the selected search filters."
                      />
                    </Td>
                  </Tr>
                )}
              </TBody>
            </Table>
          </Card>

          {/* Mobile Card List View */}
          <div className="md:hidden space-y-3">
            {pagedQueries.length > 0 ? (
              pagedQueries.map((q) => (
                <MobileQueryCard key={q.id} query={q} onSelect={() => navigate(`/queries/${q.id}`)} />
              ))
            ) : (
              <EmptyState
                icon={<Inbox className="w-10 h-10 text-slate-400" />}
                title="Everything is clear"
                description="No customer issues match the selected search filters."
              />
            )}
          </div>
        </>
      ) : (
        /* Back Orders View Tab */
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <Tr>
                <Th>Customer</Th>
                <Th>Back Order Item</Th>
                <Th>Qty</Th>
                <Th>Reason / Issue</Th>
                <Th>Next Scheduled Delivery</Th>
                <Th>Status</Th>
                <Th align="right">Update Status</Th>
              </Tr>
            </THead>
            <TBody>
              {pagedBackOrders.length > 0 ? (
                pagedBackOrders.map((b) => {
                  const statusConf = BACK_ORDER_STATUS_CONFIG[b.status] || BACK_ORDER_STATUS_CONFIG.PENDING;
                  return (
                    <Tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <Td>
                        <div>
                          <span className="font-extrabold text-slate-900 block">{b.customer?.company_name || 'Customer'}</span>
                          <span className="text-xs text-slate-500 block font-bold">
                            {b.customer?.city} {b.customer?.route ? `(${b.customer.route})` : ''}
                          </span>
                        </div>
                      </Td>
                      <Td>
                        <div className="text-xs">
                          <span className="font-extrabold text-slate-900 block">{b.product_name_snapshot}</span>
                          {b.sku_snapshot && <span className="font-mono text-slate-500 text-[11px]">{b.sku_snapshot}</span>}
                        </div>
                      </Td>
                      <Td>
                        <span className="font-mono font-bold text-slate-900">{b.quantity}</span>
                      </Td>
                      <Td>
                        <span className="text-xs text-slate-700 max-w-[200px] truncate block">{b.reason}</span>
                      </Td>
                      <Td>
                        <span className="inline-flex items-center gap-1 text-xs font-bold text-teal-800 bg-teal-50 px-2.5 py-1 rounded-full border border-teal-200">
                          <Truck className="w-3.5 h-3.5 text-teal-600" />
                          {formatDateShort(b.next_delivery_date)}
                        </span>
                      </Td>
                      <Td>
                        <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold border ${statusConf.badgeClass}`}>
                          {statusConf.label}
                        </span>
                      </Td>
                      <Td align="right">
                        <Select
                          value={b.status}
                          onChange={(e) => handleUpdateBackOrderStatus(b.id, e.target.value as BackOrderStatus)}
                          className="w-36 text-xs"
                        >
                          <option value="PENDING">Pending</option>
                          <option value="SCHEDULED">Scheduled</option>
                          <option value="SENT">Sent</option>
                          <option value="COMPLETED">Completed</option>
                        </Select>
                      </Td>
                    </Tr>
                  );
                })
              ) : (
                <Tr>
                  <Td colSpan={7}>
                    <EmptyState
                      icon={<CalendarPlus className="w-10 h-10 text-slate-400" />}
                      title="No pending back orders"
                      description="There are currently no items queued for next delivery."
                    />
                  </Td>
                </Tr>
              )}
            </TBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={activeViewTab === 'queries' ? filteredQueries.length : filteredBackOrders.length}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={(p) => setCurrentPage(p)}
        />
      )}

      {/* Create Customer Issue Modal */}
      {isCreateModalOpen && (
        <QueryFormModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSubmit={handleCreateQuery}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
};
