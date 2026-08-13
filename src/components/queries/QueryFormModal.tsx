import React, { useState, useEffect, useMemo } from 'react';
import { CustomerQuery, QueryFormInput, QueryPriority } from '../../types';
import { localDb } from '../../services/db';
import { QUERY_ISSUE_CATEGORIES, QueryIssueType } from '../../utils/queryConstants';
import { Modal, Button, Input, Select, Textarea } from '../ui';
import { HelpCircle, Search, Save, CheckCircle2, MapPin, Package, FileText, ShoppingBag, X } from 'lucide-react';

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
  // 1. Customer Field
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerSearch, setCustomerSearch] = useState('');

  // 2. Category Field
  const [category, setCategory] = useState<QueryIssueType>('wrong_item');

  // 3. Reference Field (Optional)
  const [referenceType, setReferenceType] = useState<'product' | 'invoice' | 'order' | ''>('');
  const [referenceSearch, setReferenceSearch] = useState('');
  const [selectedReferenceId, setSelectedReferenceId] = useState('');
  const [selectedReferenceLabel, setSelectedReferenceLabel] = useState('');

  // 4. Explain The Issue Field
  const [description, setDescription] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [previewNumber, setPreviewNumber] = useState('');

  const allCustomers = useMemo(() => localDb.getCustomers('', 'all'), [isOpen]);
  const catalogProducts = useMemo(() => localDb.getProducts({ activeOnly: true }), [isOpen]);
  const allOrders = useMemo(() => localDb.getOrders(), [isOpen]);

  const isEditMode = !!queryToEdit;

  useEffect(() => {
    if (queryToEdit) {
      setSelectedCustomerId(queryToEdit.customer_id);
      setCategory((queryToEdit.issue_type as QueryIssueType) || 'wrong_item');
      setDescription(queryToEdit.description);
      setReferenceType((queryToEdit.reference_type as any) || (queryToEdit.product_id ? 'product' : queryToEdit.order_id ? 'order' : ''));
      setSelectedReferenceId(queryToEdit.reference_id || queryToEdit.product_id || queryToEdit.order_id || '');
      setSelectedReferenceLabel(queryToEdit.reference_label || (queryToEdit.product?.product_name || queryToEdit.order?.order_number || ''));
      setPreviewNumber(queryToEdit.query_number);
    } else {
      setSelectedCustomerId(preselectedCustomerId || (allCustomers[0]?.id || ''));
      setCustomerSearch('');
      setCategory('wrong_item');
      setReferenceType('');
      setReferenceSearch('');
      setSelectedReferenceId('');
      setSelectedReferenceLabel('');
      setDescription('');
      setPreviewNumber(localDb.generateQueryNumber());
    }
    setErrors({});
  }, [queryToEdit, isOpen, preselectedCustomerId, allCustomers]);

  // Customer Filter
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return allCustomers.slice(0, 10);
    const q = customerSearch.toLowerCase().trim();
    return allCustomers.filter((c) => c.company_name.toLowerCase().includes(q)).slice(0, 10);
  }, [allCustomers, customerSearch]);

  const selectedCustomer = useMemo(() => {
    return allCustomers.find((c) => c.id === selectedCustomerId) || null;
  }, [allCustomers, selectedCustomerId]);

  // Reference Search Filter
  const filteredReferenceOptions = useMemo(() => {
    if (!referenceType) return [];
    const q = referenceSearch.toLowerCase().trim();

    if (referenceType === 'product') {
      return catalogProducts
        .filter((p) => !q || p.product_name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
        .slice(0, 8)
        .map((p) => ({ id: p.id, label: `${p.product_name} (${p.sku})` }));
    } else if (referenceType === 'order') {
      const orders = selectedCustomerId ? allOrders.filter((o) => o.customer_id === selectedCustomerId) : allOrders;
      return orders
        .filter((o) => !q || o.order_number.toLowerCase().includes(q))
        .slice(0, 8)
        .map((o) => ({ id: o.id, label: `Order #${o.order_number}` }));
    } else if (referenceType === 'invoice') {
      const orders = selectedCustomerId ? allOrders.filter((o) => o.customer_id === selectedCustomerId) : allOrders;
      return orders
        .filter((o) => !q || o.order_number.toLowerCase().includes(q))
        .slice(0, 8)
        .map((o) => ({ id: o.id, label: `Invoice INV-${o.order_number}` }));
    }
    return [];
  }, [referenceType, referenceSearch, catalogProducts, allOrders, selectedCustomerId]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errs: Record<string, string> = {};

    if (!selectedCustomerId) {
      errs.customer_id = 'Please select a customer.';
    }
    if (!category) {
      errs.category = 'Please select a category.';
    }
    if (!description.trim()) {
      errs.description = 'Please explain the issue.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const catObj = QUERY_ISSUE_CATEGORIES.find((c) => c.key === category) || QUERY_ISSUE_CATEGORIES[0];
    const computedSubject = `${catObj.name}${selectedReferenceLabel ? ` — ${selectedReferenceLabel}` : ''}`;

    onSubmit({
      customer_id: selectedCustomerId,
      category: category,
      issue_type: category,
      subject: computedSubject,
      description: description.trim(),
      reference_type: referenceType,
      reference_id: selectedReferenceId || undefined,
      reference_label: selectedReferenceLabel || undefined,
      product_id: referenceType === 'product' ? selectedReferenceId : undefined,
      order_id: referenceType === 'order' || referenceType === 'invoice' ? selectedReferenceId : undefined,
      invoice_number_ref: referenceType === 'invoice' ? selectedReferenceLabel : undefined,
      priority: 'medium',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title={isEditMode ? `EDIT CUSTOMER QUERY (${queryToEdit?.query_number})` : 'NEW CUSTOMER QUERY'}
      subtitle={!isEditMode ? `Query ID: ${previewNumber}` : undefined}
      icon={<HelpCircle className="w-5 h-5 text-brand-500" />}
      className="max-w-xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 1. CUSTOMER FIELD */}
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Customer <span className="text-rose-500">*</span>
          </label>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Input
              type="text"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
              placeholder="Search customer..."
              icon={<Search className="w-4 h-4 text-slate-400" />}
              className="pl-9 text-sm"
              error={errors.customer_id}
            />

            <Select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              error={errors.customer_id}
              className="text-sm font-semibold"
            >
              <option value="">-- Select Customer --</option>
              {filteredCustomers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.company_name}
                </option>
              ))}
            </Select>
          </div>

          {/* Small confirmation badge */}
          {selectedCustomer && (
            <div className="p-2.5 bg-brand-50/80 rounded-lg border border-brand-200 text-xs flex items-center justify-between text-brand-900 mt-1">
              <div className="flex items-center gap-1.5 font-bold">
                <CheckCircle2 className="w-4 h-4 text-brand-600 shrink-0" />
                <span>{selectedCustomer.company_name}</span>
                {selectedCustomer.city && (
                  <span className="text-brand-700 font-medium">({selectedCustomer.city})</span>
                )}
              </div>
              <span className="font-mono text-[11px] text-brand-700 font-bold bg-white px-2 py-0.5 rounded border border-brand-200">
                {selectedCustomer.customer_code}
              </span>
            </div>
          )}
        </div>

        {/* 2. CATEGORY FIELD */}
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Category <span className="text-rose-500">*</span>
          </label>
          <Select
            value={category}
            onChange={(e) => setCategory(e.target.value as QueryIssueType)}
            className="text-sm font-bold text-slate-900"
          >
            {QUERY_ISSUE_CATEGORIES.map((cat) => (
              <option key={cat.key} value={cat.key}>
                {cat.name}
              </option>
            ))}
          </Select>
        </div>

        {/* 3. REFERENCE FIELD (OPTIONAL) */}
        <div className="space-y-1.5 p-3 rounded-xl bg-slate-50 border border-slate-200">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-700">
            Reference <span className="text-slate-400 font-normal lowercase">(optional)</span>
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Select
              value={referenceType}
              onChange={(e) => {
                const val = e.target.value as any;
                setReferenceType(val);
                setReferenceSearch('');
                setSelectedReferenceId('');
                setSelectedReferenceLabel('');
              }}
              className="text-xs font-semibold"
            >
              <option value="">None / General Issue</option>
              <option value="product">Product Reference</option>
              <option value="invoice">Invoice Reference</option>
              <option value="order">Order Reference</option>
            </Select>

            {referenceType && (
              <Input
                type="text"
                value={referenceSearch}
                onChange={(e) => setReferenceSearch(e.target.value)}
                placeholder={`Search ${referenceType}...`}
                icon={<Search className="w-4 h-4 text-slate-400" />}
                className="pl-9 text-xs"
              />
            )}
          </div>

          {referenceType && filteredReferenceOptions.length > 0 && (
            <div className="space-y-1 pt-1 max-h-32 overflow-y-auto">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Select Reference Match:</span>
              <div className="grid grid-cols-1 gap-1">
                {filteredReferenceOptions.map((opt) => {
                  const isSelected = selectedReferenceId === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => {
                        setSelectedReferenceId(opt.id);
                        setSelectedReferenceLabel(opt.label);
                      }}
                      className={`text-left text-xs p-2 rounded border transition-colors flex items-center justify-between ${
                        isSelected
                          ? 'bg-brand-50 border-brand-500 font-bold text-brand-900'
                          : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-800'
                      }`}
                    >
                      <span className="truncate">{opt.label}</span>
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-brand-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {selectedReferenceLabel && (
            <div className="p-2 bg-white rounded border border-slate-300 text-xs font-bold text-slate-800 flex items-center justify-between">
              <span className="truncate">Linked: {selectedReferenceLabel}</span>
              <button
                type="button"
                onClick={() => {
                  setSelectedReferenceId('');
                  setSelectedReferenceLabel('');
                }}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* 4. EXPLAIN THE ISSUE FIELD */}
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Explain the issue <span className="text-rose-500">*</span>
          </label>
          <Textarea
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Briefly explain what happened..."
            error={errors.description}
            required
            className="text-sm"
          />
        </div>

        {/* SUBMIT BUTTON */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting} size="md">
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting} size="md" icon={<Save className="w-4 h-4" />}>
            {isEditMode ? 'UPDATE QUERY' : 'CREATE QUERY'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
