import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderFormInput, OrderItemInput, Customer, Product } from '../../types';
import { localDb } from '../../services/db';
import { CustomerFormModal } from '../customers/CustomerFormModal';
import { 
  X, 
  ShoppingBag, 
  Plus, 
  Trash2, 
  Building2, 
  UserCheck, 
  Calendar, 
  DollarSign, 
  AlertCircle,
  Search,
  AlertTriangle,
  Package
} from 'lucide-react';

interface OrderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: OrderFormInput) => void;
  orderToEdit?: Order | null;
  preselectedCustomerId?: string;
}

export const OrderFormModal: React.FC<OrderFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  orderToEdit,
  preselectedCustomerId,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [customerReference, setCustomerReference] = useState('');
  const [selectedSalesAgentId, setSelectedSalesAgentId] = useState('');
  const [orderDate, setOrderDate] = useState('');
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState('');
  const [notes, setNotes] = useState('');

  const [items, setItems] = useState<OrderItemInput[]>([
    { product_name_snapshot: '', sku_snapshot: '', quantity: 1, unit_price: 0, discount: 0, tax: 0, notes: '' }
  ]);

  const [error, setError] = useState('');
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerSearch, setCustomerSearch] = useState('');

  const customers = useMemo(() => localDb.getCustomers('', 'active'), [isOpen, isCustomerModalOpen]);
  const agents = useMemo(() => localDb.getUsers().filter(u => u.role === 'sales_agent' || u.role === 'admin'), []);
  const catalogProducts = useMemo(() => localDb.getProducts({ activeOnly: true }), [isOpen]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter(c => 
      c.company_name.toLowerCase().includes(q) ||
      c.customer_code.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  useEffect(() => {
    if (orderToEdit) {
      setSelectedCustomerId(orderToEdit.customer_id);
      setCustomerReference(orderToEdit.customer_reference || '');
      setSelectedSalesAgentId(orderToEdit.sales_agent_id || '');
      setOrderDate(orderToEdit.order_date.split('T')[0]);
      setExpectedDeliveryDate(orderToEdit.expected_delivery_date || '');
      setNotes(orderToEdit.notes || '');

      if (orderToEdit.items && orderToEdit.items.length > 0) {
        setItems(orderToEdit.items.map(i => ({
          product_id: i.product_id || undefined,
          product_name_snapshot: i.product_name_snapshot,
          sku_snapshot: i.sku_snapshot,
          quantity: i.quantity,
          unit_price: i.unit_price,
          discount: i.discount,
          tax: i.tax,
          notes: i.notes || '',
        })));
      }
    } else {
      setSelectedCustomerId(preselectedCustomerId || (customers.length > 0 ? customers[0].id : ''));
      setCustomerReference('');
      setSelectedSalesAgentId(agents.length > 0 ? agents[0].id : '');
      setOrderDate(new Date().toISOString().split('T')[0]);
      setExpectedDeliveryDate('');
      setNotes('');
      setItems([
        { product_name_snapshot: '', sku_snapshot: '', quantity: 1, unit_price: 0, discount: 0, tax: 0, notes: '' }
      ]);
    }
    setError('');
  }, [isOpen, orderToEdit, preselectedCustomerId]);

  if (!isOpen) return null;

  // Real-time calculation of order totals
  const totals = localDb.calculateOrderTotals(items);

  // Identify unavailable products among current line items
  const unavailableItemWarnings = useMemo(() => {
    const warnings: { sku: string; productName: string; notes?: string; expectedDate?: string }[] = [];
    items.forEach(item => {
      if (item.sku_snapshot.trim()) {
        const prod = catalogProducts.find(p => p.sku.toLowerCase() === item.sku_snapshot.trim().toLowerCase());
        if (prod && prod.availability_status === 'out_of_stock') {
          warnings.push({
            sku: prod.sku,
            productName: prod.product_name,
            notes: prod.availability_notes || undefined,
            expectedDate: prod.expected_available_date || undefined,
          });
        }
      }
    });
    return warnings;
  }, [items, catalogProducts]);

  const handleAddItem = () => {
    setItems(prev => [
      ...prev,
      { product_name_snapshot: '', sku_snapshot: '', quantity: 1, unit_price: 0, discount: 0, tax: 0, notes: '' }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      setError('An order must contain at least one line item.');
      return;
    }
    setItems(prev => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof OrderItemInput, value: any) => {
    setItems(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSelectCatalogProduct = (index: number, productId: string) => {
    const prod = catalogProducts.find(p => p.id === productId);
    if (!prod) return;

    setItems(prev => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        product_id: prod.id,
        product_name_snapshot: prod.product_name,
        sku_snapshot: prod.sku,
        unit_price: prod.unit_price,
      };
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least one line item.');
      return;
    }

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.product_name_snapshot.trim()) {
        setError(`Item #${i + 1} requires a product name.`);
        return;
      }
      if (!item.sku_snapshot.trim()) {
        setError(`Item #${i + 1} requires a SKU code.`);
        return;
      }
      if (item.quantity <= 0) {
        setError(`Item #${i + 1} quantity must be greater than zero.`);
        return;
      }
      if (item.unit_price < 0) {
        setError(`Item #${i + 1} unit price cannot be negative.`);
        return;
      }
    }

    onSubmit({
      customer_id: selectedCustomerId,
      customer_reference: customerReference.trim() || undefined,
      sales_agent_id: selectedSalesAgentId || undefined,
      order_date: orderDate,
      expected_delivery_date: expectedDeliveryDate || undefined,
      notes: notes.trim() || undefined,
      items: items.map(i => ({
        ...i,
        product_name_snapshot: i.product_name_snapshot.trim(),
        sku_snapshot: i.sku_snapshot.trim().toUpperCase(),
        quantity: Number(i.quantity),
        unit_price: Number(i.unit_price),
        discount: Number(i.discount || 0),
        tax: Number(i.tax || 0),
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <ShoppingBag className="w-5 h-5 text-sky-400" />
            <h2 className="text-base font-bold">
              {orderToEdit ? `Edit Order ${orderToEdit.order_number}` : 'Create New Customer Order'}
            </h2>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* OUT OF STOCK WARNING BANNER */}
          {unavailableItemWarnings.length > 0 && (
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl space-y-2 text-xs">
              <div className="flex items-center space-x-2 text-amber-900 font-bold uppercase tracking-wider">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>⚠️ Product Availability Warning</span>
              </div>
              <p className="text-amber-950 font-medium">
                The following selected order products are currently marked <span className="font-bold text-red-700 uppercase">Out of Stock</span>. Orders can still be created for unavailable products:
              </p>
              <div className="space-y-1 pt-1">
                {unavailableItemWarnings.map((w, idx) => (
                  <div key={idx} className="p-2.5 bg-white rounded-lg border border-amber-200 text-slate-800 flex justify-between items-center">
                    <div>
                      <span className="font-mono font-bold text-red-700 mr-2">{w.sku}</span>
                      <span className="font-bold">{w.productName}</span>
                      {w.notes && <span className="text-slate-500 block text-[11px] mt-0.5">Reason: {w.notes}</span>}
                    </div>
                    {w.expectedDate && (
                      <span className="font-mono text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                        Expected: {new Date(w.expectedDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Section 1: Customer & Sales Agent Information */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            
            {/* Customer Search & Selector */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Customer Account <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-xs text-sky-600 hover:underline font-semibold flex items-center"
                >
                  <Plus className="w-3 h-3 mr-0.5" />
                  New Customer
                </button>
              </div>

              <div className="relative">
                <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  required
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
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

            {/* Customer Reference */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Customer Reference / PO #
              </label>
              <input
                type="text"
                value={customerReference}
                onChange={(e) => setCustomerReference(e.target.value)}
                placeholder="e.g. PO-88902 or Ref-2026"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

            {/* Sales Agent Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Assigned Sales Agent <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <select
                  required
                  value={selectedSalesAgentId}
                  onChange={(e) => setSelectedSalesAgentId(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
                >
                  <option value="">-- Select Sales Agent --</option>
                  {agents.map(u => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.role.replace('_', ' ')})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Order Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Order Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={orderDate}
                onChange={(e) => setOrderDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

            {/* Expected Delivery Date */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Expected Delivery Date
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              />
            </div>

          </div>

          {/* Section 2: Order Items Line Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Order Products & Line Items ({items.length})
              </h3>
              <button
                type="button"
                onClick={handleAddItem}
                className="inline-flex items-center px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Add Item Line
              </button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 w-64">Catalog Product / Name</th>
                    <th className="px-3 py-2 w-32">SKU Code</th>
                    <th className="px-3 py-2 w-20">Qty</th>
                    <th className="px-3 py-2 w-28">Unit Price ($)</th>
                    <th className="px-3 py-2 w-24">Discount ($)</th>
                    <th className="px-3 py-2 w-24">Tax ($)</th>
                    <th className="px-3 py-2 w-28">Line Total</th>
                    <th className="px-2 py-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((item, idx) => {
                    const lineTot = (Number(item.quantity || 1) * Number(item.unit_price || 0)) - Number(item.discount || 0) + Number(item.tax || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 space-y-1">
                          {/* Quick Catalog Selector */}
                          <select
                            onChange={(e) => {
                              if (e.target.value) handleSelectCatalogProduct(idx, e.target.value);
                            }}
                            className="w-full px-2 py-1 text-[11px] border border-slate-200 rounded bg-slate-50 text-slate-700"
                          >
                            <option value="">-- Quick Pick Catalog Item --</option>
                            {catalogProducts.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.sku} — {p.product_name} (${p.unit_price.toFixed(2)}) {p.availability_status === 'out_of_stock' ? '[OUT OF STOCK]' : ''}
                              </option>
                            ))}
                          </select>

                          <input
                            type="text"
                            required
                            placeholder="e.g. ProClean Heavy-Duty Degreaser 5Gal"
                            value={item.product_name_snapshot}
                            onChange={(e) => handleItemChange(idx, 'product_name_snapshot', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 text-xs font-bold text-slate-900"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="text"
                            required
                            placeholder="IND-CLEAN-500"
                            value={item.sku_snapshot}
                            onChange={(e) => handleItemChange(idx, 'sku_snapshot', e.target.value)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 text-xs font-mono uppercase font-bold text-sky-700"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            min={1}
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            required
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={item.discount || 0}
                            onChange={(e) => handleItemChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <input
                            type="number"
                            step="0.01"
                            min={0}
                            value={item.tax || 0}
                            onChange={(e) => handleItemChange(idx, 'tax', parseFloat(e.target.value) || 0)}
                            className="w-full px-2 py-1.5 border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2 font-mono font-bold text-slate-900 text-xs">
                          ${lineTot.toFixed(2)}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 3: Financial Calculations Summary */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            
            {/* Notes Input */}
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Order Notes & Special Instructions
              </label>
              <textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special delivery terms, carrier instructions, or payment agreements..."
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none bg-white"
              />
            </div>

            {/* Calculations Panel */}
            <div className="w-full sm:w-64 bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">${totals.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Discount:</span>
                <span className="font-semibold text-red-600">-${totals.total_discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Tax:</span>
                <span className="font-semibold text-slate-900">+${totals.total_tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900 font-sans">
                <span>Grand Total:</span>
                <span className="font-mono text-sky-700">${totals.grand_total.toFixed(2)}</span>
              </div>
            </div>

          </div>

          {/* Form Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              {orderToEdit ? 'Save Order Changes' : 'Create Order'}
            </button>
          </div>

        </form>

      </div>

      {/* Customer Quick Creation Modal */}
      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={(newCustomerData) => {
          const created = localDb.createCustomer(newCustomerData, selectedSalesAgentId || 'a1111111-1111-1111-1111-111111111111');
          setSelectedCustomerId(created.id);
          setIsCustomerModalOpen(false);
        }}
      />
    </div>
  );
};
