import React, { useState, useEffect, useMemo } from 'react';
import { CustomerQuery, QueryFormInput, QueryPriority, Customer, CustomerFormInput, Order } from '../../types';
import { localDb } from '../../services/db';
import { CustomerFormModal } from '../customers/CustomerFormModal';
import { 
  X, 
  HelpCircle, 
  Search, 
  UserPlus, 
  Building2, 
  CheckCircle2, 
  AlertCircle,
  ShieldCheck,
  Tag,
  AlertTriangle,
  Package,
  ShoppingBag,
  Info
} from 'lucide-react';

interface QueryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QueryFormInput) => void;
  queryToEdit?: CustomerQuery | null;
  preselectedCustomerId?: string;
  isSubmitting?: boolean;
}

export const QueryFormModal: React.FC<QueryFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  queryToEdit,
  preselectedCustomerId,
  isSubmitting = false,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [orderId, setOrderId] = useState('');
  const [productId, setProductId] = useState('');
  const [priority, setPriority] = useState<QueryPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewNumber, setPreviewNumber] = useState('');

  // Embedded New Customer Modal State
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  const categories = useMemo(() => localDb.getCategories(), []);
  const users = useMemo(() => localDb.getUsers(), []);
  const allCustomers = useMemo(() => localDb.getCustomers('', 'all'), [isNewCustomerModalOpen]);
  const catalogProducts = useMemo(() => localDb.getProducts({ activeOnly: true }), [isOpen]);
  const allOrders = useMemo(() => localDb.getOrders(), [isOpen]);

  const isEditMode = !!queryToEdit;

  useEffect(() => {
    if (queryToEdit) {
      setSelectedCustomerId(queryToEdit.customer_id);
      setSubject(queryToEdit.subject);
      setDescription(queryToEdit.description);
      setCategoryId(queryToEdit.category_id || '');
      setOrderId(queryToEdit.order_id || '');
      setProductId(queryToEdit.product_id || '');
      setPriority(queryToEdit.priority);
      setAssignedTo(queryToEdit.assigned_to || '');
      setInternalNotes('');
      setPreviewNumber(queryToEdit.query_number);
    } else {
      setSelectedCustomerId(preselectedCustomerId || (allCustomers[0]?.id || ''));
      setCustomerSearch('');
      setSubject('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setOrderId('');
      setProductId('');
      setPriority('medium');
      setAssignedTo('');
      setInternalNotes('');
      setPreviewNumber(localDb.generateQueryNumber());
    }
    setErrors({});
  }, [queryToEdit, isOpen, preselectedCustomerId, allCustomers, categories]);

  // Filter customers for dropdown search
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return allCustomers;
    const query = customerSearch.toLowerCase().trim();
    return allCustomers.filter(c =>
      c.company_name.toLowerCase().includes(query) ||
      c.customer_code.toLowerCase().includes(query) ||
      (c.contact_person && c.contact_person.toLowerCase().includes(query)) ||
      (c.phone && c.phone.toLowerCase().includes(query)) ||
      (c.email && c.email.toLowerCase().includes(query))
    );
  }, [allCustomers, customerSearch]);

  const selectedCustomer = useMemo(() => {
    return allCustomers.find(c => c.id === selectedCustomerId) || null;
  }, [allCustomers, selectedCustomerId]);

  // Existing open queries for selected customer (Duplicate query warning)
  const existingOpenQueries = useMemo(() => {
    if (!selectedCustomerId) return [];
    return localDb.getQueries({ customer_id: selectedCustomerId })
      .filter(q => ['new', 'open', 'assigned', 'in_progress', 'waiting_customer', 'reopened'].includes(q.status));
  }, [selectedCustomerId, isOpen]);

  // Customer specific orders for dropdown
  const customerOrders = useMemo(() => {
    if (!selectedCustomerId) return allOrders;
    return allOrders.filter(o => o.customer_id === selectedCustomerId);
  }, [allOrders, selectedCustomerId]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!selectedCustomerId) {
      errs.customer_id = 'Please select a customer for this query.';
    }
    if (!subject.trim()) {
      errs.subject = 'Subject line is required.';
    } else if (subject.trim().length < 5) {
      errs.subject = 'Subject line must be at least 5 characters.';
    }
    if (!description.trim()) {
      errs.description = 'Issue description is required.';
    } else if (description.trim().length < 10) {
      errs.description = 'Please provide a detailed description (at least 10 characters).';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    onSubmit({
      customer_id: selectedCustomerId,
      subject: subject.trim(),
      description: description.trim(),
      category_id: categoryId || undefined,
      order_id: orderId || undefined,
      product_id: productId || undefined,
      priority,
      assigned_to: assignedTo || undefined,
      internal_notes: internalNotes.trim() || undefined,
    });
  };

  const handleCreateNewCustomer = (customerData: CustomerFormInput) => {
    const created = localDb.createCustomer(customerData, 'a1111111-1111-1111-1111-111111111111');
    setSelectedCustomerId(created.id);
    setIsNewCustomerModalOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <HelpCircle className="w-5 h-5 text-sky-400" />
            <div>
              <h2 className="text-base font-bold">
                {isEditMode ? `Edit Support Ticket (${queryToEdit.query_number})` : 'Create Support Ticket'}
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                {!isEditMode && `Auto Ticket Number: ${previewNumber}`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          
          {/* 1. Customer Selection Card */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Target Customer Account <span className="text-red-500">*</span>
              </label>
              
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="inline-flex items-center text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                <span>Quick Add New Customer</span>
              </button>
            </div>

            {/* Customer Search & Select Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  placeholder="Filter customers by name or code..."
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                />
              </div>

              <div>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white ${
                    errors.customer_id ? 'border-red-500' : 'border-slate-300'
                  }`}
                >
                  <option value="">-- Select Customer Account --</option>
                  {filteredCustomers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.company_name} ({c.customer_code}) {c.city ? `— ${c.city}` : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {errors.customer_id && (
              <p className="text-xs text-red-600 font-medium">{errors.customer_id}</p>
            )}

            {/* Selected Customer Preview Card */}
            {selectedCustomer && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between text-slate-600">
                <div>
                  <span className="font-bold text-slate-900">{selectedCustomer.company_name}</span>
                  <span className="font-mono text-sky-600 ml-2 font-semibold">({selectedCustomer.customer_code})</span>
                  {selectedCustomer.contact_person && (
                    <span className="ml-2">Contact: {selectedCustomer.contact_person}</span>
                  )}
                </div>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded uppercase font-semibold">
                  {selectedCustomer.status}
                </span>
              </div>
            )}

            {/* Existing Open Queries Warning Banner */}
            {existingOpenQueries.length > 0 && !isEditMode && (
              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-950 space-y-1">
                <div className="flex items-center space-x-1 font-bold text-amber-900">
                  <Info className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>Existing Open Queries Alert: Customer has {existingOpenQueries.length} open ticket(s)</span>
                </div>
                <div className="pl-5 space-y-0.5 text-[11px]">
                  {existingOpenQueries.map(q => (
                    <div key={q.id} className="flex items-center space-x-2">
                      <span className="font-mono font-bold text-sky-700">{q.query_number}</span>
                      <span className="truncate max-w-xs">{q.subject}</span>
                      <span className="text-[10px] font-bold uppercase px-1 py-0.2 rounded bg-amber-100 text-amber-800">{q.status.replace(/_/g, ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* 2. Ticket Header Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Issue Category</span>
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">Select Category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name}</option>
                ))}
              </select>
            </div>

            {/* Related Customer Order */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                <span>Related Order (Optional)</span>
              </label>
              <select
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">-- None / General Inquiry --</option>
                {customerOrders.map(o => (
                  <option key={o.id} value={o.id}>
                    {o.order_number} — ${o.grand_total.toFixed(2)} [{o.current_status.replace(/_/g, ' ')}]
                  </option>
                ))}
              </select>
            </div>

            {/* Related Catalog Product */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <Package className="w-3.5 h-3.5 text-slate-400" />
                <span>Related Product (Optional)</span>
              </label>
              <select
                value={productId}
                onChange={(e) => setProductId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">-- None / General Issue --</option>
                {catalogProducts.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.sku} — {p.product_name} {p.availability_status === 'out_of_stock' ? '[OUT OF STOCK]' : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <AlertTriangle className="w-3.5 h-3.5 text-slate-400" />
                <span>Priority Level</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as QueryPriority)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-semibold"
              >
                <option value="low">Low Priority</option>
                <option value="medium">Normal / Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="urgent">Urgent Priority</option>
              </select>
            </div>

            {/* Assign Agent */}
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1 flex items-center space-x-1">
                <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                <span>Assign Support Agent</span>
              </label>
              <select
                value={assignedTo}
                onChange={(e) => setAssignedTo(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">-- Unassigned Queue --</option>
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role.replace('_', ' ')})
                  </option>
                ))}
              </select>
            </div>

          </div>

          {/* 3. Ticket Subject */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Subject Line <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Delivery delay for order ORD-000001 or Product Availability Inquiry"
              className={`w-full px-3 py-2 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 ${
                errors.subject ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.subject && (
              <p className="text-xs text-red-600 font-medium mt-1">{errors.subject}</p>
            )}
          </div>

          {/* 4. Issue Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Detailed Issue Description <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Record complete details of customer contact, issue symptoms, tracking numbers, or stock inquiries..."
              className={`w-full p-3 text-xs border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none ${
                errors.description ? 'border-red-500' : 'border-slate-300'
              }`}
            />
            {errors.description && (
              <p className="text-xs text-red-600 font-medium mt-1">{errors.description}</p>
            )}
          </div>

          {/* 5. Initial Internal Agent Note (Optional) */}
          {!isEditMode && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Initial Confidential Internal Agent Note (Optional)
              </label>
              <textarea
                rows={2}
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Internal troubleshooting notes (visible only to Support Agents & Admins)..."
                className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none bg-slate-50/50"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Internal notes are protected and hidden from Sales Agent roles.
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs flex items-center space-x-1.5 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{isEditMode ? 'Save Ticket Changes' : 'Create Ticket'}</span>
            </button>
          </div>

        </form>

      </div>

      {/* Embedded Customer Form Modal */}
      <CustomerFormModal
        isOpen={isNewCustomerModalOpen}
        onClose={() => setIsNewCustomerModalOpen(false)}
        onSubmit={handleCreateNewCustomer}
      />
    </div>
  );
};
