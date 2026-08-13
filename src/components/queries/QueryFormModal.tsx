import React, { useState, useEffect, useMemo } from 'react';
import { CustomerQuery, QueryFormInput, QueryPriority, CustomerFormInput } from '../../types';
import { localDb } from '../../services/db';
import { QUERY_ISSUE_CATEGORIES, RESOLUTION_ACTIONS, QueryIssueType } from '../../utils/queryConstants';
import { calculateNextDeliveryDateForCustomer, formatDateShort } from '../../utils/dateUtils';
import { CustomerFormModal } from '../customers/CustomerFormModal';
import { Badge, Button, Input, Modal, Select, Textarea } from '../ui';
import { formatCurrency } from '../../utils/format';
import {
  HelpCircle,
  Search,
  UserPlus,
  AlertTriangle,
  Info,
  PackageX,
  ReceiptText,
  Tag,
  ShieldAlert,
  PackageSearch,
  RotateCcw,
  CalendarPlus,
  Save,
  CheckCircle2,
  Phone,
  MessageCircle,
  MapPin,
  Truck,
  DollarSign,
  Package,
} from 'lucide-react';

interface QueryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: QueryFormInput) => void;
  queryToEdit?: CustomerQuery | null;
  preselectedCustomerId?: string;
  isSubmitting?: boolean;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  wrong_item: <PackageX className="w-5 h-5" />,
  invoice_change: <ReceiptText className="w-5 h-5" />,
  price_issue: <Tag className="w-5 h-5" />,
  quality_issue: <ShieldAlert className="w-5 h-5" />,
  item_not_received: <PackageSearch className="w-5 h-5" />,
  item_returned: <RotateCcw className="w-5 h-5" />,
  back_order: <CalendarPlus className="w-5 h-5" />,
  other: <HelpCircle className="w-5 h-5" />,
};

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
  const [issueType, setIssueType] = useState<QueryIssueType>('wrong_item');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [orderId, setOrderId] = useState('');
  const [productId, setProductId] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [actionRequired, setActionRequired] = useState('replace_item');
  const [createBackOrder, setCreateBackOrder] = useState(false);

  // Issue-specific fields
  const [expectedPrice, setExpectedPrice] = useState<number | ''>('');
  const [chargedPrice, setChargedPrice] = useState<number | ''>('');
  const [expectedItem, setExpectedItem] = useState('');
  const [receivedItem, setReceivedItem] = useState('');
  const [quantityAffected, setQuantityAffected] = useState<number | ''>(1);
  const [invoiceNumberRef, setInvoiceNumberRef] = useState('');

  const [priority, setPriority] = useState<QueryPriority>('medium');
  const [assignedTo, setAssignedTo] = useState('');
  const [internalNotes, setInternalNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewNumber, setPreviewNumber] = useState('');
  const [isNewCustomerModalOpen, setIsNewCustomerModalOpen] = useState(false);

  const users = useMemo(() => localDb.getUsers(), []);
  const allCustomers = useMemo(() => localDb.getCustomers('', 'all'), [isNewCustomerModalOpen]);
  const catalogProducts = useMemo(() => localDb.getProducts({ activeOnly: true }), [isOpen]);
  const allOrders = useMemo(() => localDb.getOrders(), [isOpen]);

  const isEditMode = !!queryToEdit;

  useEffect(() => {
    if (queryToEdit) {
      setSelectedCustomerId(queryToEdit.customer_id);
      setIssueType((queryToEdit.issue_type as QueryIssueType) || 'wrong_item');
      setSubject(queryToEdit.subject);
      setDescription(queryToEdit.description);
      setOrderId(queryToEdit.order_id || '');
      setProductId(queryToEdit.product_id || '');
      setActionRequired(queryToEdit.action_required || 'replace_item');
      setExpectedPrice(queryToEdit.expected_price ?? '');
      setChargedPrice(queryToEdit.charged_price ?? '');
      setExpectedItem(queryToEdit.expected_item || '');
      setReceivedItem(queryToEdit.received_item || '');
      setQuantityAffected(queryToEdit.quantity_affected ?? 1);
      setInvoiceNumberRef(queryToEdit.invoice_number_ref || '');
      setCreateBackOrder(!!queryToEdit.back_order_id);
      setPriority(queryToEdit.priority);
      setAssignedTo(queryToEdit.assigned_to || '');
      setInternalNotes('');
      setPreviewNumber(queryToEdit.query_number);
    } else {
      setSelectedCustomerId(preselectedCustomerId || (allCustomers[0]?.id || ''));
      setCustomerSearch('');
      setIssueType('wrong_item');
      setSubject('');
      setDescription('');
      setOrderId('');
      setProductId('');
      setProductSearch('');
      setActionRequired('replace_item');
      setExpectedPrice('');
      setChargedPrice('');
      setExpectedItem('');
      setReceivedItem('');
      setQuantityAffected(1);
      setInvoiceNumberRef('');
      setCreateBackOrder(false);
      setPriority('medium');
      setAssignedTo('');
      setInternalNotes('');
      setPreviewNumber(localDb.generateQueryNumber());
    }
    setErrors({});
  }, [queryToEdit, isOpen, preselectedCustomerId, allCustomers]);

  // Auto-set title & back order when category changes
  const handleCategorySelect = (key: QueryIssueType) => {
    setIssueType(key);
    const cat = QUERY_ISSUE_CATEGORIES.find((c) => c.key === key);
    if (cat && !subject) {
      setSubject(cat.name);
    }
    if (key === 'item_not_received' || key === 'back_order') {
      setActionRequired('send_next_delivery');
      setCreateBackOrder(true);
    } else if (key === 'wrong_item') {
      setActionRequired('replace_item');
    } else if (key === 'price_issue') {
      setActionRequired('correct_price');
    } else if (key === 'quality_issue') {
      setActionRequired('replace_item');
    } else if (key === 'item_returned') {
      setActionRequired('return_item');
    } else if (key === 'invoice_change') {
      setActionRequired('correct_invoice');
    }
  };

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return allCustomers;
    const query = customerSearch.toLowerCase().trim();
    return allCustomers.filter(
      (c) =>
        c.company_name.toLowerCase().includes(query) ||
        c.customer_code.toLowerCase().includes(query) ||
        (c.contact_person && c.contact_person.toLowerCase().includes(query)) ||
        (c.phone && c.phone.toLowerCase().includes(query)) ||
        (c.whatsapp_number && c.whatsapp_number.toLowerCase().includes(query)) ||
        (c.city && c.city.toLowerCase().includes(query)) ||
        (c.route && c.route.toLowerCase().includes(query))
    );
  }, [allCustomers, customerSearch]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return catalogProducts;
    const query = productSearch.toLowerCase().trim();
    return catalogProducts.filter(
      (p) =>
        p.product_name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.category && p.category.name.toLowerCase().includes(query))
    );
  }, [catalogProducts, productSearch]);

  const selectedCustomer = useMemo(() => {
    return allCustomers.find((c) => c.id === selectedCustomerId) || null;
  }, [allCustomers, selectedCustomerId]);

  const selectedProduct = useMemo(() => {
    return catalogProducts.find((p) => p.id === productId) || null;
  }, [catalogProducts, productId]);

  const customerOrders = useMemo(() => {
    if (!selectedCustomerId) return allOrders;
    return allOrders.filter((o) => o.customer_id === selectedCustomerId);
  }, [allOrders, selectedCustomerId]);

  const existingOpenQueries = useMemo(() => {
    if (!selectedCustomerId) return [];
    return localDb
      .getQueries({ customer_id: selectedCustomerId })
      .filter((q) => ['new', 'open', 'assigned', 'in_progress', 'waiting_customer', 'reopened'].includes(q.status));
  }, [selectedCustomerId, isOpen]);

  const existingBackOrders = useMemo(() => {
    if (!selectedCustomerId) return [];
    return localDb.getBackOrders({ customer_id: selectedCustomerId, status: 'PENDING' });
  }, [selectedCustomerId, isOpen]);

  const calculatedPriceDiff = useMemo(() => {
    const exp = typeof expectedPrice === 'number' ? expectedPrice : 0;
    const chg = typeof chargedPrice === 'number' ? chargedPrice : 0;
    return chg - exp;
  }, [expectedPrice, chargedPrice]);

  const nextDeliveryDate = useMemo(() => {
    if (!selectedCustomer) return '';
    return calculateNextDeliveryDateForCustomer(selectedCustomer.route || selectedCustomer.city);
  }, [selectedCustomer]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!selectedCustomerId) {
      errs.customer_id = 'Please select a customer for this issue.';
    }
    if (!subject.trim()) {
      errs.subject = 'Issue subject line is required.';
    }
    if (!description.trim()) {
      errs.description = 'Problem description is required.';
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
      issue_type: issueType,
      action_required: actionRequired,
      expected_price: typeof expectedPrice === 'number' ? expectedPrice : undefined,
      charged_price: typeof chargedPrice === 'number' ? chargedPrice : undefined,
      price_difference: calculatedPriceDiff !== 0 ? calculatedPriceDiff : undefined,
      expected_item: expectedItem.trim() || undefined,
      received_item: receivedItem.trim() || undefined,
      quantity_affected: typeof quantityAffected === 'number' ? quantityAffected : undefined,
      invoice_number_ref: invoiceNumberRef.trim() || undefined,
      create_back_order: createBackOrder || actionRequired === 'send_next_delivery',
      priority,
      order_id: orderId || undefined,
      product_id: productId || undefined,
      assigned_to: assignedTo || undefined,
      internal_notes: internalNotes.trim() || undefined,
    });
  };

  const handleCreateNewCustomer = async (customerData: CustomerFormInput) => {
    try {
      const created = await localDb.createCustomer(customerData, 'a1111111-1111-1111-1111-111111111111');
      setSelectedCustomerId(created.id);
      setIsNewCustomerModalOpen(false);
    } catch (err) {
      console.error('[QueryFormModal] Create customer error:', err);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="lg"
        title={isEditMode ? `Edit Customer Issue (${queryToEdit?.query_number})` : 'Log New Customer Issue'}
        subtitle={!isEditMode ? `Issue ID: ${previewNumber}` : undefined}
        icon={<HelpCircle className="w-5 h-5 text-brand-500" />}
        className="max-h-[92vh]"
      >
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* STEP 1: Customer Selection & Live Information Panel */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                WHO IS THE CUSTOMER? <span className="text-rose-500">*</span>
              </span>
              <button
                type="button"
                onClick={() => setIsNewCustomerModalOpen(true)}
                className="inline-flex items-center text-xs font-bold text-brand-600 hover:text-brand-700 hover:underline"
              >
                <UserPlus className="w-3.5 h-3.5 mr-1" />
                <span>Quick Add Customer</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input
                type="text"
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                placeholder="Search customer, phone, city..."
                icon={<Search className="w-4 h-4 text-slate-400" />}
                className="pl-9"
                error={errors.customer_id}
              />
              <Select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                error={errors.customer_id}
              >
                <option value="">-- Select Customer Account --</option>
                {filteredCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.customer_code}) {c.city ? `— ${c.city}` : ''}
                  </option>
                ))}
              </Select>
            </div>

            {/* Customer Info Panel */}
            {selectedCustomer && (
              <div className="p-3 bg-white rounded-lg border border-slate-200 text-xs space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-slate-900 text-sm">{selectedCustomer.company_name}</span>
                    <span className="font-mono text-brand-700 font-bold bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
                      {selectedCustomer.customer_code}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-slate-600">
                    {selectedCustomer.phone && (
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        {selectedCustomer.phone}
                      </span>
                    )}
                    {selectedCustomer.city && (
                      <span className="flex items-center gap-1 font-bold text-slate-800">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        {selectedCustomer.city} {selectedCustomer.route ? `(${selectedCustomer.route})` : ''}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                  <span className="text-slate-500">
                    Next Delivery: <span className="font-bold text-teal-700">{formatDateShort(nextDeliveryDate)}</span>
                  </span>
                  <div className="flex items-center gap-3 font-semibold">
                    <span>Open Queries: <strong className="text-brand-700">{existingOpenQueries.length}</strong></span>
                    <span>Pending Back Orders: <strong className="text-amber-700">{existingBackOrders.length}</strong></span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* STEP 2: Issue Category Selection */}
          <div className="space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
              WHAT IS THE PROBLEM / ISSUE TYPE?
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {QUERY_ISSUE_CATEGORIES.map((cat) => {
                const isSelected = issueType === cat.key;
                return (
                  <button
                    key={cat.key}
                    type="button"
                    onClick={() => handleCategorySelect(cat.key)}
                    className={`p-3 rounded-xl border text-left transition-all flex flex-col justify-between min-h-[90px] ${
                      isSelected
                        ? 'bg-brand-50/80 border-brand-500 ring-2 ring-brand-400/30 text-brand-900 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className={isSelected ? 'text-brand-600' : 'text-slate-500'}>
                        {CATEGORY_ICONS[cat.key]}
                      </span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-brand-600" />}
                    </div>
                    <div>
                      <span className="font-extrabold text-xs block leading-tight mt-2">{cat.shortLabel}</span>
                      <span className="text-[10px] text-slate-500 block truncate">{cat.name}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* STEP 3: Item & Order Connection */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] flex items-center justify-center font-bold">3</span>
              WHICH ITEM OR ORDER IS INVOLVED? (OPTIONAL)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Product Item</label>
                <Select value={productId} onChange={(e) => setProductId(e.target.value)}>
                  <option value="">-- Select Catalog Product --</option>
                  {catalogProducts.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.sku} — {p.product_name} ({formatCurrency(p.unit_price)})
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Related Order</label>
                <Select value={orderId} onChange={(e) => setOrderId(e.target.value)}>
                  <option value="">-- Select Customer Order --</option>
                  {customerOrders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.order_number} — {formatCurrency(o.grand_total)} [{o.current_status.replace(/_/g, ' ')}]
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            {selectedProduct && (
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-brand-600" />
                  <span className="font-bold text-slate-900">{selectedProduct.product_name}</span>
                  <span className="font-mono text-slate-500 font-bold">({selectedProduct.sku})</span>
                </div>
                <span className="font-mono font-bold text-brand-700">{formatCurrency(selectedProduct.unit_price)}</span>
              </div>
            )}
          </div>

          {/* STEP 4: Dynamic Problem Form */}
          <div className="space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] flex items-center justify-center font-bold">4</span>
              DESCRIBE THE PROBLEM & DETAILS
            </span>

            <Input
              label="Issue Title / Summary"
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Received wrong size gloves on Thursday delivery"
              error={errors.subject}
              required
            />

            {/* Dynamic fields based on Issue Category */}
            {issueType === 'price_issue' && (
              <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-3">
                <span className="text-xs font-bold text-blue-900 block">Price Discrepancy Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Expected Price ($)"
                    type="number"
                    step="0.01"
                    value={expectedPrice}
                    onChange={(e) => setExpectedPrice(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="20.00"
                  />
                  <Input
                    label="Billed Price ($)"
                    type="number"
                    step="0.01"
                    value={chargedPrice}
                    onChange={(e) => setChargedPrice(e.target.value ? parseFloat(e.target.value) : '')}
                    placeholder="25.00"
                  />
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Difference</label>
                    <div className="h-10 px-3 rounded-lg bg-white border border-slate-300 font-mono font-bold flex items-center text-rose-600">
                      {formatCurrency(calculatedPriceDiff)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {issueType === 'wrong_item' && (
              <div className="p-3.5 bg-amber-50/60 rounded-xl border border-amber-200 space-y-3">
                <span className="text-xs font-bold text-amber-900 block">Item Mismatch Details</span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="Expected Item"
                    type="text"
                    value={expectedItem}
                    onChange={(e) => setExpectedItem(e.target.value)}
                    placeholder="Large Nitrile Gloves"
                  />
                  <Input
                    label="Received Item"
                    type="text"
                    value={receivedItem}
                    onChange={(e) => setReceivedItem(e.target.value)}
                    placeholder="Medium Latex Gloves"
                  />
                  <Input
                    label="Quantity"
                    type="number"
                    value={quantityAffected}
                    onChange={(e) => setQuantityAffected(e.target.value ? parseInt(e.target.value) : 1)}
                  />
                </div>
              </div>
            )}

            {(issueType === 'item_not_received' || issueType === 'back_order') && (
              <div className="p-3.5 bg-teal-50/60 rounded-xl border border-teal-200 space-y-3">
                <span className="text-xs font-bold text-teal-900 block">Missing Item & Delivery Schedule</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Input
                    label="Missing Quantity"
                    type="number"
                    value={quantityAffected}
                    onChange={(e) => setQuantityAffected(e.target.value ? parseInt(e.target.value) : 1)}
                  />
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Next Scheduled Delivery</label>
                    <div className="h-10 px-3 rounded-lg bg-white border border-slate-300 font-bold flex items-center text-teal-800">
                      <Truck className="w-4 h-4 mr-1.5 text-teal-600" />
                      {formatDateShort(nextDeliveryDate)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Textarea
              label="Problem Description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide clear details of what happened..."
              error={errors.description}
              required
            />
          </div>

          {/* STEP 5: Resolution Action & Priority */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-4">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-brand-600 text-white text-[11px] flex items-center justify-center font-bold">5</span>
              WHAT DO WE NEED TO DO? (RESOLUTION ACTION)
            </span>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Action Required</label>
                <Select value={actionRequired} onChange={(e) => setActionRequired(e.target.value)}>
                  {RESOLUTION_ACTIONS.map((a) => (
                    <option key={a.value} value={a.value}>
                      {a.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Issue Priority</label>
                <Select value={priority} onChange={(e) => setPriority(e.target.value as QueryPriority)}>
                  <option value="low">Low Priority</option>
                  <option value="medium">Normal Priority</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent Priority</option>
                </Select>
              </div>
            </div>

            {/* Back Order Checkbox */}
            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="cb_back_order"
                checked={createBackOrder}
                onChange={(e) => setCreateBackOrder(e.target.checked)}
                className="w-4 h-4 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
              />
              <label htmlFor="cb_back_order" className="text-xs font-bold text-slate-800 cursor-pointer">
                Add item to Customer's Pending Back Order List for Next Delivery ({formatDateShort(nextDeliveryDate)})
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Assign to Agent (Optional)</label>
                <Select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)}>
                  <option value="">-- Unassigned (Support Queue) --</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role.replace(/_/g, ' ')})
                    </option>
                  ))}
                </Select>
              </div>
              <Input
                label="Internal Agent Note (Optional)"
                type="text"
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                placeholder="Private note for team..."
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" loading={isSubmitting} icon={<Save className="w-4 h-4" />}>
              {isEditMode ? 'Update Customer Issue' : 'Save Customer Issue'}
            </Button>
          </div>
        </form>
      </Modal>

      {isNewCustomerModalOpen && (
        <CustomerFormModal
          isOpen={isNewCustomerModalOpen}
          onClose={() => setIsNewCustomerModalOpen(false)}
          onSubmit={handleCreateNewCustomer}
        />
      )}
    </>
  );
};
