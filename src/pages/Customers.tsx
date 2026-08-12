import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Customer, CustomerFormInput, CustomerStatus } from '../types';
import { localDb } from '../services/db';
import { fetchCustomersPage } from '../services/queryService';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useServerListQuery } from '../hooks/useServerListQuery';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { MobileCustomerCard } from '../components/customers/MobileCustomerCard';
import { DatabaseErrorBanner } from '../components/common/DatabaseErrorBanner';
import { Badge, Button, Card, ConfirmDialog, EmptyState, Input, PageHeader, Pagination, Table, TableToolbar, Tabs, TBody, Td, Th, THead, Tr, useToast } from '../components/ui';
import { getCustomerStatusBadge } from '../utils/badges';
import { formatDate } from '../utils/format';
import { Users, Plus, Eye, Edit, Power, Building2, XCircle, Upload } from 'lucide-react';

export const Customers: React.FC = () => {
  const { user, hasRole, dbVersion } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isAdmin = hasRole('admin');

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [deactivateTarget, setDeactivateTarget] = useState<Customer | null>(null);

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const fetchParams = useMemo(
    () => ({
      searchTerm: debouncedSearch,
      status: statusFilter,
      page: currentPage,
    }),
    [debouncedSearch, statusFilter, currentPage]
  );

  const queryKey = useMemo(() => JSON.stringify({ ...fetchParams, dbVersion }), [fetchParams, dbVersion]);

  const {
    data: paginatedCustomers,
    total: totalCustomers,
    loading: customersLoading,
    refresh: refreshCustomers,
  } = useServerListQuery<Customer>({
    key: queryKey,
    fetcher: (signal) =>
      fetchCustomersPage({ ...fetchParams, signal }),
    localFallback: () => {
      const list = localDb.getCustomers(debouncedSearch, statusFilter);
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return { data: list.slice(start, start + ITEMS_PER_PAGE), total: list.length };
    },
  });

  const totalPages = Math.ceil(totalCustomers / ITEMS_PER_PAGE) || 1;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenCreateModal = () => {
    setCustomerToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (data: CustomerFormInput) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      if (customerToEdit) {
        const updated = await localDb.updateCustomer(customerToEdit.id, data, user.id);
        if (updated) {
          toast({ type: 'success', title: 'Customer updated', message: `Customer "${updated.company_name}" saved to database.` });
        }
      } else {
        const created = await localDb.createCustomer(data, user.id);
        toast({ type: 'success', title: 'Customer created', message: `Customer "${created.company_name}" (${created.customer_code}) created successfully.` });
      }
      setIsModalOpen(false);
      await refreshCustomers();
    } catch (err: any) {
      console.error('[Customers] Customer save error:', err);
      toast({
        type: 'error',
        title: 'Customer could not be saved',
        message: err.message || 'A database error occurred while updating the customer.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmToggleStatus = async () => {
    if (!deactivateTarget || !user || !isAdmin) return;
    const newStatus: CustomerStatus = deactivateTarget.status === 'active' ? 'inactive' : 'active';
    try {
      const updated = await localDb.toggleCustomerStatus(deactivateTarget.id, newStatus, user.id);
      if (updated) {
        toast({
          type: 'success',
          title: 'Customer status changed',
          message: `Customer "${updated.company_name}" has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
        });
        await refreshCustomers();
      }
    } catch (err: any) {
      console.error('[Customers] Toggle status error:', err);
      toast({
        type: 'error',
        title: 'Status change failed',
        message: err.message || 'Could not update customer status in database.',
      });
    } finally {
      setDeactivateTarget(null);
    }
  };

  return (
    <div className="space-y-6">
      <DatabaseErrorBanner onRetrySuccess={refreshCustomers} />

      <PageHeader
        icon={<Users className="w-5 h-5 text-brand-400" />}
        title="Customer Directory"
        description="Centralized business customer records and account management"
        actions={
          <div className="flex items-center gap-3">
            {isAdmin && (
              <Button
                variant="outline"
                onClick={() => navigate('/admin/import?type=customers')}
                icon={<Upload className="w-4 h-4" />}
              >
                Import CSV
              </Button>
            )}
            <Button onClick={handleOpenCreateModal} icon={<Plus className="w-4 h-4" />}>
              New Customer
            </Button>
          </div>
        }
      />

      <TableToolbar>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search by Customer Code, Company, Contact Person, Phone, Email, City..."
              icon={<Users className="w-4 h-4 text-slate-400" />}
              className="pl-9"
            />
            {customersLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 animate-pulse">
                Loading…
              </span>
            )}
          </div>
          <Tabs
            tabs={[
              { value: 'all' as const, label: `All (${totalCustomers})` },
              { value: 'active' as const, label: 'Active' },
              { value: 'inactive' as const, label: 'Inactive' },
            ]}
            active={statusFilter}
            onChange={(value) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          />
        </div>
      </TableToolbar>

      <Card flush className="p-3 md:p-0">
        {paginatedCustomers.length > 0 ? (
          <>
            {/* Mobile View Cards */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {paginatedCustomers.map((cust) => (
                <MobileCustomerCard key={cust.id} customer={cust} onEdit={handleOpenEditModal} />
              ))}
            </div>

            {/* Desktop View Table */}
            <div className="hidden md:block">
              <Table minWidth={1320}>
                <THead>
                  <Tr hover={false}>
                    <Th width={96}>Code</Th>
                    <Th width={240}>Company Name</Th>
                    <Th width={150}>Phone</Th>
                    <Th width={160}>WhatsApp</Th>
                    <Th width={160}>City</Th>
                    <Th width={120}>Country</Th>
                    <Th width={110}>Status</Th>
                    <Th width={120}>Created</Th>
                    <Th width={130} align="right">Actions</Th>
                  </Tr>
                </THead>
                <TBody>
                  {paginatedCustomers.map((cust) => (
                    <Tr key={cust.id}>
                      <Td width={96} className="font-mono text-xs font-bold text-brand-700">
                        <Link to={`/customers/${cust.id}`} className="hover:underline">{cust.customer_code}</Link>
                      </Td>
                      <Td width={240} truncate className="font-semibold text-slate-900">
                        <Link to={`/customers/${cust.id}`} className="hover:text-brand-600 transition-colors">{cust.company_name}</Link>
                      </Td>
                      <Td width={150} truncate className="text-xs text-slate-600 font-mono">{cust.phone || <span className="text-slate-400 italic">—</span>}</Td>
                      <Td width={160} truncate className="text-xs text-emerald-600 font-mono">{cust.whatsapp_number || <span className="text-slate-400 italic">—</span>}</Td>
                      <Td width={160} truncate className="text-xs text-slate-700 font-medium">{cust.city || <span className="text-slate-400 italic">—</span>}</Td>
                      <Td width={120} truncate className="text-xs text-slate-600">{cust.country || 'Canada'}</Td>
                      <Td width={110}>
                        <Badge badge={getCustomerStatusBadge(cust.status)} />
                      </Td>
                      <Td width={120} className="text-xs text-slate-500">{formatDate(cust.created_at)}</Td>
                      <Td width={130} align="right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => navigate(`/customers/${cust.id}`)}
                            title="View Detailed Customer Profile"
                            className="p-2 text-slate-500 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleOpenEditModal(cust)}
                            title="Edit Customer"
                            className="p-2 text-slate-500 hover:text-violet-600 hover:bg-violet-50 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          {isAdmin && (
                            <button
                              onClick={() => setDeactivateTarget(cust)}
                              title={cust.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                              className={`p-2 rounded-lg transition-colors ${cust.status === 'active' ? 'text-slate-400 hover:text-red-600 hover:bg-red-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            >
                              <Power className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>
          </>
        ) : (
          <EmptyState
            icon={<Building2 className="w-7 h-7" />}
            title="No Customers Found"
            description={
              searchTerm || statusFilter !== 'all'
                ? 'No customer records matched your search query or status filter.'
                : 'Get started by creating your first business customer profile.'
            }
            action={
              searchTerm || statusFilter !== 'all' ? (
                <Button variant="ghost" size="sm" onClick={() => { setSearchTerm(''); setStatusFilter('all'); }}>
                  Clear Search & Filters
                </Button>
              ) : (
                <Button size="sm" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleOpenCreateModal}>
                  Add Customer
                </Button>
              )
            }
          />
        )}

        {totalCustomers > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={totalCustomers}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="customers"
          />
        )}
      </Card>

      <CustomerFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} customerToEdit={customerToEdit} isSubmitting={isSubmitting} />

      <ConfirmDialog
        isOpen={!!deactivateTarget}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleConfirmToggleStatus}
        title={deactivateTarget?.status === 'active' ? 'Deactivate Customer?' : 'Activate Customer?'}
        message={
          <>
            Are you sure you want to {deactivateTarget?.status === 'active' ? 'deactivate' : 'activate'}{' '}
            <span className="font-semibold">{deactivateTarget?.company_name}</span> ({deactivateTarget?.customer_code})?
          </>
        }
        confirmLabel={deactivateTarget?.status === 'active' ? 'Confirm Deactivation' : 'Confirm Activation'}
        variant={deactivateTarget?.status === 'active' ? 'danger' : 'success'}
        icon={<Power className="w-5 h-5" />}
      />
    </div>
  );
};
