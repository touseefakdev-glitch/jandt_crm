import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../services/db';
import { CustomerQuery, QueryFormInput, BackOrderItem, BackOrderStatus } from '../types';
import { QUERY_ISSUE_CATEGORIES, QUERY_STATUS_CONFIG, BACK_ORDER_STATUS_CONFIG } from '../utils/queryConstants';
import { formatDateShort } from '../utils/dateUtils';
import { QueryFormModal } from '../components/queries/QueryFormModal';
import { MobileQueryCard } from '../components/queries/MobileQueryCard';
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Pagination,
  Select,
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
  CalendarPlus,
  Truck,
  ArrowRight,
  Package,
} from 'lucide-react';

const ITEMS_PER_PAGE = 15;

type ViewTab = 'all' | 'open' | 'in_progress' | 'resolved' | 'closed' | 'back_orders';

export const Queries: React.FC = () => {
  const { user, dbVersion } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ViewTab>('all');
  const [customerSearch, setCustomerSearch] = useState('');
  const [issueSearch, setIssueSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const allQueries = useMemo(() => localDb.getQueries({}, user?.id), [dbVersion]);
  const allBackOrders = useMemo(() => localDb.getBackOrders(), [dbVersion]);

  // Filter Queries
  const filteredQueries = useMemo(() => {
    let result = allQueries;

    if (activeTab !== 'all' && activeTab !== 'back_orders') {
      if (activeTab === 'open') {
        result = result.filter((q) => ['new', 'open', 'assigned'].includes(q.status));
      } else if (activeTab === 'in_progress') {
        result = result.filter((q) => q.status === 'in_progress' || q.status === 'waiting_customer');
      } else if (activeTab === 'resolved') {
        result = result.filter((q) => q.status === 'resolved');
      } else if (activeTab === 'closed') {
        result = result.filter((q) => q.status === 'closed');
      }
    }

    if (categoryFilter !== 'all') {
      result = result.filter((q) => q.issue_type === categoryFilter || q.category_id === categoryFilter);
    }

    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase().trim();
      result = result.filter(
        (query) =>
          (query.customer && query.customer.company_name.toLowerCase().includes(q)) ||
          (query.customer && query.customer.customer_code.toLowerCase().includes(q))
      );
    }

    if (issueSearch.trim()) {
      const q = issueSearch.toLowerCase().trim();
      result = result.filter(
        (query) =>
          query.query_number.toLowerCase().includes(q) ||
          query.subject.toLowerCase().includes(q) ||
          query.description.toLowerCase().includes(q) ||
          (query.reference_label && query.reference_label.toLowerCase().includes(q)) ||
          (query.product && query.product.product_name.toLowerCase().includes(q)) ||
          (query.product && query.product.sku.toLowerCase().includes(q)) ||
          (query.order && query.order.order_number.toLowerCase().includes(q))
      );
    }

    return result;
  }, [allQueries, activeTab, categoryFilter, customerSearch, issueSearch]);

  // Filter Back Orders
  const filteredBackOrders = useMemo(() => {
    let result = allBackOrders;

    if (customerSearch.trim()) {
      const q = customerSearch.toLowerCase().trim();
      result = result.filter((b) => b.customer && b.customer.company_name.toLowerCase().includes(q));
    }

    if (issueSearch.trim()) {
      const q = issueSearch.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.product_name_snapshot.toLowerCase().includes(q) ||
          (b.sku_snapshot && b.sku_snapshot.toLowerCase().includes(q)) ||
          b.reason.toLowerCase().includes(q)
      );
    }

    return result;
  }, [allBackOrders, customerSearch, issueSearch]);

  const currentListLength = activeTab === 'back_orders' ? filteredBackOrders.length : filteredQueries.length;
  const totalPages = Math.ceil(currentListLength / ITEMS_PER_PAGE) || 1;

  const pagedQueries = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredQueries.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredQueries, currentPage]);

  const pagedBackOrders = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredBackOrders.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredBackOrders, currentPage]);

  if (!user) return null;

  const handleCreateQuery = (data: QueryFormInput) => {
    setIsSubmitting(true);
    try {
      const created = localDb.createQuery(data, user.id);
      setIsCreateModalOpen(false);
      toast({
        type: 'success',
        title: 'Query Created',
        message: `${created.query_number} has been created and set to OPEN.`,
      });
      navigate(`/queries/${created.id}`);
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Could not create query.',
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
        title: 'Back Order Updated',
        message: `Status updated to ${newStatus}.`,
      });
    } catch {
      toast({ type: 'error', title: 'Update Failed', message: 'Could not update Back Order status.' });
    }
  };

  const getCategoryBadge = (issueType?: string | null) => {
    const cat = QUERY_ISSUE_CATEGORIES.find((c) => c.key === issueType) || QUERY_ISSUE_CATEGORIES[5];
    return (
      <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${cat.badgeClass}`}>
        {cat.name}
      </span>
    );
  };

  const getReferenceLabel = (q: CustomerQuery) => {
    if (q.reference_label) return q.reference_label;
    if (q.product) return `${q.product.product_name} (${q.product.sku})`;
    if (q.order) return `Order #${q.order.order_number}`;
    if (q.invoice_number_ref) return `Invoice ${q.invoice_number_ref}`;
    return '—';
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<HelpCircle className="w-5 h-5 text-brand-500" />}
        title="Queries"
        description="Log and track customer problems, returns, price issues, quality complaints, and back orders"
        actions={
          <Button onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-4 h-4" />}>
            + NEW QUERY
          </Button>
        }
      />

      <TableToolbar>
        {/* Simple Tab Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-3">
          <Tabs
            size="md"
            tabs={[
              { value: 'all', label: 'All Queries' },
              { value: 'open', label: 'Open' },
              { value: 'in_progress', label: 'In Progress' },
              { value: 'resolved', label: 'Resolved' },
              { value: 'closed', label: 'Closed' },
              { value: 'back_orders', label: `Back Orders (${allBackOrders.length})` },
            ]}
            active={activeTab}
            onChange={(v) => {
              setActiveTab(v as ViewTab);
              setCurrentPage(1);
            }}
          />

          <Button size="sm" onClick={() => setIsCreateModalOpen(true)} icon={<Plus className="w-3.5 h-3.5" />}>
            + New Query
          </Button>
        </div>

        {/* Fast Searches */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            type="text"
            value={customerSearch}
            onChange={(e) => {
              setCustomerSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search customer..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
            className="pl-9 text-sm"
          />

          <Input
            type="text"
            value={issueSearch}
            onChange={(e) => {
              setIssueSearch(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search issue or reference..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
            className="pl-9 text-sm"
          />

          {activeTab !== 'back_orders' && (
            <Select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="text-sm font-semibold"
            >
              <option value="all">All Categories</option>
              {QUERY_ISSUE_CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.name}
                </option>
              ))}
            </Select>
          )}
        </div>
      </TableToolbar>

      {/* Main Table View */}
      {activeTab !== 'back_orders' ? (
        <>
          {/* Desktop Table View */}
          <Card className="hidden md:block overflow-hidden">
            <Table>
              <THead>
                <Tr>
                  <Th>Query</Th>
                  <Th>Customer</Th>
                  <Th>Category</Th>
                  <Th>Reference</Th>
                  <Th>Issue</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                  <Th align="right"></Th>
                </Tr>
              </THead>
              <TBody>
                {pagedQueries.length > 0 ? (
                  pagedQueries.map((q) => {
                    const statusConf = QUERY_STATUS_CONFIG[q.status] || QUERY_STATUS_CONFIG.open;
                    return (
                      <Tr key={q.id} className="hover:bg-slate-50 transition-colors">
                        {/* Query Number */}
                        <Td>
                          <Link to={`/queries/${q.id}`} className="font-mono font-extrabold text-brand-700 hover:underline">
                            {q.query_number}
                          </Link>
                        </Td>

                        {/* Customer */}
                        <Td>
                          <Link to={`/customers/${q.customer_id}`} className="font-bold text-slate-900 hover:text-brand-600 truncate block max-w-[180px]">
                            {q.customer?.company_name || 'Customer'}
                          </Link>
                        </Td>

                        {/* Category */}
                        <Td>{getCategoryBadge(q.issue_type)}</Td>

                        {/* Reference */}
                        <Td>
                          <span className="text-xs font-semibold text-slate-700 truncate block max-w-[200px]">
                            {getReferenceLabel(q)}
                          </span>
                        </Td>

                        {/* Issue Explanation */}
                        <Td>
                          <span className="text-xs text-slate-800 line-clamp-2 max-w-[280px]" title={q.description}>
                            {q.description}
                          </span>
                        </Td>

                        {/* Status */}
                        <Td>
                          <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-extrabold border ${statusConf.badgeClass}`}>
                            {statusConf.label}
                          </span>
                        </Td>

                        {/* Created */}
                        <Td>
                          <span className="text-xs text-slate-500 font-medium whitespace-nowrap">
                            {formatDateShort(q.created_at)}
                          </span>
                        </Td>

                        {/* Action */}
                        <Td align="right">
                          <Button size="sm" variant="outline" onClick={() => navigate(`/queries/${q.id}`)} icon={<ArrowRight className="w-3.5 h-3.5" />}>
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
                        title="No queries found"
                        description="No customer issues match the current search filters."
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
                title="No queries found"
                description="No customer issues match the current search filters."
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
                <Th>Item</Th>
                <Th>Qty</Th>
                <Th>Reason</Th>
                <Th>Next Delivery</Th>
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
                        <span className="font-extrabold text-slate-900 block">{b.customer?.company_name || 'Customer'}</span>
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
                      title="No back orders"
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
          totalItems={currentListLength}
          pageSize={ITEMS_PER_PAGE}
          onPageChange={(p) => setCurrentPage(p)}
        />
      )}

      {/* Create Query Modal */}
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
