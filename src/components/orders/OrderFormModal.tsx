import React, { useState, useEffect, useMemo } from 'react';
import { Order, OrderFormInput, OrderItemInput, CustomerFormInput } from '../../types';
import { localDb } from '../../services/db';
import { CustomerFormModal } from '../customers/CustomerFormModal';
import { Button, Input, Modal, Select, Textarea } from '../ui';
import { formatCurrency } from '../../utils/format';
import {
  ShoppingBag,
  Plus,
  Trash2,
  AlertCircle,
  AlertTriangle,
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
  const agents = useMemo(() => localDb.getUsers().filter((u) => u.role === 'sales_agent' || u.role === 'admin'), []);
  const catalogProducts = useMemo(() => localDb.getProducts({ activeOnly: true }), [isOpen]);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customers;
    const q = customerSearch.toLowerCase();
    return customers.filter((c) =>
      c.company_name.toLowerCase().includes(q) ||
      c.customer_code.toLowerCase().includes(q) ||
      (c.phone && c.phone.toLowerCase().includes(q)) ||
      (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customers, customerSearch]);

  const unavailableItemWarnings = useMemo(() => {
    const warnings: { sku: string; productName: string; notes?: string; expectedDate?: string }[] = [];
    items.forEach((item) => {
      if (item.sku_snapshot.trim()) {
        const prod = catalogProducts.find((p) => p.sku.toLowerCase() === item.sku_snapshot.trim().toLowerCase());
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

  useEffect(() => {
    if (orderToEdit) {
      setSelectedCustomerId(orderToEdit.customer_id);
      setCustomerReference(orderToEdit.customer_reference || '');
      setSelectedSalesAgentId(orderToEdit.sales_agent_id || '');
      setOrderDate(orderToEdit.order_date.split('T')[0]);
      setExpectedDeliveryDate(orderToEdit.expected_delivery_date || '');
      setNotes(orderToEdit.notes || '');

      if (orderToEdit.items && orderToEdit.items.length > 0) {
        setItems(orderToEdit.items.map((i) => ({
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

  const totals = localDb.calculateOrderTotals(items);

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { product_name_snapshot: '', sku_snapshot: '', quantity: 1, unit_price: 0, discount: 0, tax: 0, notes: '' }
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length === 1) {
      setError('An order must contain at least one line item.');
      return;
    }
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof OrderItemInput, value: any) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  const handleSelectCatalogProduct = (index: number, productId: string) => {
    const prod = catalogProducts.find((p) => p.id === productId);
    if (!prod) return;

    setItems((prev) => {
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
      items: items.map((i) => ({
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
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        size="xl"
        title={orderToEdit ? `Edit Order ${orderToEdit.order_number}` : 'Create New Customer Order'}
        icon={<ShoppingBag className="w-5 h-5 text-brand-400" />}
        className="max-h-[92vh]"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-700 uppercase">
                  Customer Account <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="text-xs text-brand-600 hover:underline font-semibold flex items-center"
                >
                  <Plus className="w-3 h-3 mr-0.5" />
                  New Customer
                </button>
              </div>
              <Select
                required
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
                className="pl-3"
              >
                <option value="">-- Select Customer Account --</option>
                {filteredCustomers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.customer_code}) {c.city ? `— ${c.city}` : ''}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Customer Reference / PO #
              </label>
              <Input
                type="text"
                value={customerReference}
                onChange={(e) => setCustomerReference(e.target.value)}
                placeholder="e.g. PO-88902 or Ref-2026"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Assigned Sales Agent <span className="text-red-500">*</span>
              </label>
              <Select
                required
                value={selectedSalesAgentId}
                onChange={(e) => setSelectedSalesAgentId(e.target.value)}
                className="pl-3"
              >
                <option value="">-- Select Sales Agent --</option>
                {agents.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.full_name} ({u.role.replace('_', ' ')})
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Order Date <span className="text-red-500">*</span>
              </label>
              <Input type="date" required value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Expected Delivery Date
              </label>
              <Input type="date" value={expectedDeliveryDate} onChange={(e) => setExpectedDeliveryDate(e.target.value)} />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
                Order Products & Line Items ({items.length})
              </h3>
              <Button type="button" size="sm" variant="secondary" icon={<Plus className="w-3.5 h-3.5" />} onClick={handleAddItem}>
                Add Item Line
              </Button>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-3 py-2 min-w-[16rem]">Catalog Product / Name</th>
                    <th className="px-3 py-2 min-w-[8rem]">SKU Code</th>
                    <th className="px-3 py-2 w-20">Qty</th>
                    <th className="px-3 py-2 min-w-[7rem]">Unit Price</th>
                    <th className="px-3 py-2 min-w-[7rem]">Discount</th>
                    <th className="px-3 py-2 min-w-[7rem]">Tax</th>
                    <th className="px-3 py-2 min-w-[7rem]">Line Total</th>
                    <th className="px-2 py-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {items.map((item, idx) => {
                    const lineTot = (Number(item.quantity || 1) * Number(item.unit_price || 0)) - Number(item.discount || 0) + Number(item.tax || 0);
                    return (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="p-2 space-y-1">
                          <Select
                            onChange={(e) => {
                              if (e.target.value) handleSelectCatalogProduct(idx, e.target.value);
                            }}
                            className="!py-1 text-[11px] bg-slate-50"
                            value=""
                          >
                            <option value="">-- Quick Pick Catalog Item --</option>
                            {catalogProducts.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.sku} — {p.product_name} ({formatCurrency(p.unit_price)}) {p.availability_status === 'out_of_stock' ? '[OUT OF STOCK]' : ''}
                              </option>
                            ))}
                          </Select>
                          <Input
                            type="text"
                            required
                            placeholder="e.g. ProClean Heavy-Duty Degreaser 5Gal"
                            value={item.product_name_snapshot}
                            onChange={(e) => handleItemChange(idx, 'product_name_snapshot', e.target.value)}
                            className="!py-1.5 text-xs font-bold text-slate-900"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="text"
                            required
                            placeholder="IND-CLEAN-500"
                            value={item.sku_snapshot}
                            onChange={(e) => handleItemChange(idx, 'sku_snapshot', e.target.value)}
                            className="!py-1.5 text-xs font-mono uppercase font-bold text-brand-700"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            min={1}
                            required
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                            className="!py-1.5 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            required
                            value={item.unit_price}
                            onChange={(e) => handleItemChange(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                            className="!py-1.5 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={item.discount || 0}
                            onChange={(e) => handleItemChange(idx, 'discount', parseFloat(e.target.value) || 0)}
                            className="!py-1.5 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            step="0.01"
                            min={0}
                            value={item.tax || 0}
                            onChange={(e) => handleItemChange(idx, 'tax', parseFloat(e.target.value) || 0)}
                            className="!py-1.5 text-xs font-mono"
                          />
                        </td>
                        <td className="p-2 font-mono font-bold text-slate-900 text-xs">
                          {formatCurrency(lineTot)}
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

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="w-full sm:w-1/2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1.5">
                Order Notes & Special Instructions
              </label>
              <Textarea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Special delivery terms, carrier instructions, or payment agreements..."
                className="min-h-[76px] bg-white"
              />
            </div>

            <div className="w-full sm:w-64 bg-white p-3.5 rounded-lg border border-slate-200 space-y-1.5 text-xs font-mono">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-900">{formatCurrency(totals.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Discount:</span>
                <span className="font-semibold text-red-600">-{formatCurrency(totals.total_discount)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total Tax:</span>
                <span className="font-semibold text-slate-900">+{formatCurrency(totals.total_tax)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-200 font-bold text-sm text-slate-900 font-sans">
                <span>Grand Total:</span>
                <span className="font-mono text-brand-700">{formatCurrency(totals.grand_total)}</span>
              </div>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" icon={<ShoppingBag className="w-4 h-4" />}>
              {orderToEdit ? 'Save Order Changes' : 'Create Order'}
            </Button>
          </div>
        </form>
      </Modal>

      <CustomerFormModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSubmit={async (newCustomerData) => {
          try {
            const created = await localDb.createCustomer(newCustomerData, selectedSalesAgentId || 'a1111111-1111-1111-1111-111111111111');
            setSelectedCustomerId(created.id);
            setIsCustomerModalOpen(false);
          } catch (err) {
            console.error('[OrderFormModal] Create customer failed:', err);
          }
        }}
      />
    </>
  );
};
