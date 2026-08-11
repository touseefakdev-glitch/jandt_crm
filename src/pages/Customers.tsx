import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Customer, CustomerFormInput, CustomerStatus } from '../types';
import { localDb } from '../services/db';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { Badge, Button, ConfirmDialog, EmptyState, Input, PageHeader, Pagination, Table, Tabs, TBody, Td, Th, THead, Tr, useToast } from '../components/ui';
import { getCustomerStatusBadge } from '../utils/badges';
import { formatDate } from '../utils/format';
import { Users, Plus, Eye, Edit, Power, Building2, XCircle, Upload } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const Customers: React.FC = () => {
  const { user, hasRole, dbVersion } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [deactivateTarget, setDeactivateTarget] = useState<Customer | null>(null);

  const isAdmin = hasRole('admin');

  const allCustomers = useMemo(() => {
    return localDb.getCustomers(searchTerm, statusFilter);
  }, [searchTerm, statusFilter, dbVersion]);

  const totalCustomers = useMemo(() => localDb.getCustomers().length, [dbVersion]);

  const totalPages = Math.ceil(allCustomers.length / ITEMS_PER_PAGE) || 1;
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return allCustomers.slice(start, start + ITEMS_PER_PAGE);
  }, [allCustomers, currentPage]);

  const handleOpenCreateModal = () => {
    setCustomerToEdit(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (customer: Customer) => {
    setCustomerToEdit(customer);
    setIsModalOpen(true);
  };

  const handleFormSubmit = (data: CustomerFormInput) => {
    if (!user) return;
    if (customerToEdit) {
      const updated = localDb.updateCustomer(customerToEdit.id, data, user.id);
      if (updated) {
        toast({ type: 'success', title: 'Customer updated', message: `Customer "${updated.company_name}" updated successfully.` });
      }
    } else {
      const created = localDb.createCustomer(data, user.id);
      toast({ type: 'success', title: 'Customer created', message: `Customer "${created.company_name}" (${created.customer_code}) created successfully.` });
    }
    setIsModalOpen(false);
  };

  const handleConfirmToggleStatus = () => {
    if (!deactivateTarget || !user || !isAdmin) return;
    const newStatus: CustomerStatus = deactivateTarget.status === 'active' ? 'inactive' : 'active';
    const updated = localDb.toggleCustomerStatus(deactivateTarget.id, newStatus, user.id);
    if (updated) {
      toast({
        type: 'success',
        title: 'Customer status changed',
        message: `Customer "${updated.company_name}" has been ${newStatus === 'active' ? 'activated' : 'deactivated'}.`,
      });
    }
    setDeactivateTarget(null);
  };

  return (
    <div className="space-y-6">
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

      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
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

      <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
        {paginatedCustomers.length > 0 ? (
          <Table>
            <THead>
              <Tr hover={false}>
                <Th>Code</Th>
                <Th>Company Name</Th>
                <Th>Phone</Th>
                <Th>WhatsApp</Th>
                <Th>Group JID</Th>
                <Th>City</Th>
                <Th>Country</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {paginatedCustomers.map((cust) => (
                <Tr key={cust.id}>
                  <Td className="font-mono text-xs font-bold text-brand-700">
                    <Link to={`/customers/${cust.id}`} className="hover:underline">{cust.customer_code}</Link>
                  </Td>
                  <Td className="font-semibold text-slate-900">
                    <Link to={`/customers/${cust.id}`} className="hover:text-brand-600 transition-colors">{cust.company_name}</Link>
                  </Td>
                  <Td className="text-xs text-slate-600 font-mono">{cust.phone || <span className="text-slate-400 italic">—</span>}</Td>
                  <Td className="text-xs text-emerald-600 font-mono">{cust.whatsapp_number || <span className="text-slate-400 italic">—</span>}</Td>
                  <Td className="text-xs font-mono text-purple-700 font-bold max-w-[140px] truncate" title={cust.whatsapp_group_jid || undefined}>
                    {cust.whatsapp_group_jid ? cust.whatsapp_group_jid : <span className="text-slate-400 italic font-normal">—</span>}
                  </Td>
                  <Td className="text-xs text-slate-700 font-medium">{cust.city || <span className="text-slate-400 italic">—</span>}</Td>
                  <Td className="text-xs text-slate-600">{cust.country || 'Canada'}</Td>
                  <Td>
                    <Badge badge={getCustomerStatusBadge(cust.status)} />
                  </Td>
                  <Td className="text-xs text-slate-500">{formatDate(cust.created_at)}</Td>
                  <Td className="text-right">
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

        {allCustomers.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={allCustomers.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="customers"
          />
        )}
      </div>

      <CustomerFormModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onSubmit={handleFormSubmit} customerToEdit={customerToEdit} />

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
