import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Customer, CustomerFormInput, CustomerStatus } from '../types';
import { localDb } from '../services/db';
import { CustomerFormModal } from '../components/customers/CustomerFormModal';
import { 
  Users, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  Power, 
  Building2, 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle, 
  AlertCircle,
  XCircle,
  FileText
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const Customers: React.FC = () => {
  const { user, hasRole, dbVersion } = useAuth();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [currentPage, setCurrentPage] = useState(1);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);

  const [deactivateTarget, setDeactivateTarget] = useState<Customer | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isAdmin = hasRole('admin');

  // Fetch customers list
  const allCustomers = useMemo(() => {
    return localDb.getCustomers(searchTerm, statusFilter);
  }, [searchTerm, statusFilter, feedback, dbVersion]);

  // Pagination calculation
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
        setFeedback({ type: 'success', message: `Customer "${updated.company_name}" updated successfully.` });
      }
    } else {
      const created = localDb.createCustomer(data, user.id);
      setFeedback({ type: 'success', message: `Customer "${created.company_name}" (${created.customer_code}) created successfully.` });
    }

    setIsModalOpen(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleConfirmToggleStatus = () => {
    if (!deactivateTarget || !user || !isAdmin) return;

    const newStatus: CustomerStatus = deactivateTarget.status === 'active' ? 'inactive' : 'active';
    const updated = localDb.toggleCustomerStatus(deactivateTarget.id, newStatus, user.id);

    if (updated) {
      const statusText = newStatus === 'active' ? 'activated' : 'deactivated';
      setFeedback({ type: 'success', message: `Customer "${updated.company_name}" has been ${statusText}.` });
    }

    setDeactivateTarget(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xs">
            <Users className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Customer Directory</h1>
            <p className="text-xs text-slate-500">Centralized business customer records and account management</p>
          </div>
        </div>

        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-sm rounded-lg transition-colors shadow-sm space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-sm animate-in fade-in duration-200 ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Search & Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by Customer Code, Company, Contact Person, Phone, Email, City..."
            className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
          />
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center space-x-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
          {(['all', 'active', 'inactive'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setStatusFilter(tab);
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors capitalize ${
                statusFilter === tab
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'all' ? `All (${localDb.getCustomers().length})` : tab}
            </button>
          ))}
        </div>

      </div>

      {/* Customer Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {paginatedCustomers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">Code</th>
                  <th className="px-5 py-3">Company Name</th>
                  <th className="px-5 py-3">Contact Person</th>
                  <th className="px-5 py-3">Phone</th>
                  <th className="px-5 py-3">Email</th>
                  <th className="px-5 py-3">City</th>
                  <th className="px-5 py-3">Status</th>
                  <th className="px-5 py-3">Created</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedCustomers.map((cust) => (
                  <tr key={cust.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-mono text-xs font-bold text-sky-700">
                      <Link to={`/customers/${cust.id}`} className="hover:underline flex items-center space-x-1">
                        <span>{cust.customer_code}</span>
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 font-semibold text-slate-900">
                      <Link to={`/customers/${cust.id}`} className="hover:text-sky-600 transition-colors">
                        {cust.company_name}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5 text-slate-700">
                      {cust.contact_person || <span className="text-slate-400 italic">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600 font-mono">
                      {cust.phone || <span className="text-slate-400 italic">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {cust.email || <span className="text-slate-400 italic">—</span>}
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-600">
                      {cust.city || <span className="text-slate-400 italic">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                        cust.status === 'active'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border border-slate-200'
                      }`}>
                        {cust.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-xs text-slate-500">
                      {new Date(cust.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {/* View Profile */}
                        <button
                          onClick={() => navigate(`/customers/${cust.id}`)}
                          title="View Detailed Customer Profile"
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Customer */}
                        <button
                          onClick={() => handleOpenEditModal(cust)}
                          title="Edit Customer"
                          className="p-1.5 text-slate-600 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        {/* Deactivate/Activate (Admin Only) */}
                        {isAdmin && (
                          <button
                            onClick={() => setDeactivateTarget(cust)}
                            title={cust.status === 'active' ? 'Deactivate Account' : 'Activate Account'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              cust.status === 'active'
                                ? 'text-slate-400 hover:text-red-600 hover:bg-red-50'
                                : 'text-emerald-600 hover:bg-emerald-50'
                            }`}
                          >
                            <Power className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No Customers Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'No customer records matched your search query or status filter.'
                : 'Get started by creating your first business customer profile.'}
            </p>
            {searchTerm || statusFilter !== 'all' ? (
              <button
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
                className="text-xs font-semibold text-sky-600 hover:underline"
              >
                Clear Search & Filters
              </button>
            ) : (
              <button
                onClick={handleOpenCreateModal}
                className="inline-flex items-center px-3 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Customer
              </button>
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {allCustomers.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, allCustomers.length)}</span> to{' '}
              <span className="font-semibold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, allCustomers.length)}</span> of{' '}
              <span className="font-semibold text-slate-900">{allCustomers.length}</span> customers
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

      {/* Customer Form Modal */}
      <CustomerFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        customerToEdit={customerToEdit}
      />

      {/* Deactivate/Activate Confirmation Modal */}
      {deactivateTarget && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center space-x-3 text-red-600">
              <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                <XCircle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">
                {deactivateTarget.status === 'active' ? 'Deactivate Customer?' : 'Activate Customer?'}
              </h3>
            </div>
            <p className="text-sm text-slate-600">
              Are you sure you want to {deactivateTarget.status === 'active' ? 'deactivate' : 'activate'}{' '}
              <span className="font-semibold text-slate-900">{deactivateTarget.company_name}</span> ({deactivateTarget.customer_code})?
            </p>
            <div className="pt-2 flex justify-end space-x-3">
              <button
                onClick={() => setDeactivateTarget(null)}
                className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmToggleStatus}
                className={`px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors ${
                  deactivateTarget.status === 'active' ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                Confirm {deactivateTarget.status === 'active' ? 'Deactivation' : 'Activation'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
