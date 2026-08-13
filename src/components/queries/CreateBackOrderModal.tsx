import React, { useState, useMemo } from 'react';
import { CustomerQuery, Product } from '../../types';
import { localDb } from '../../services/db';
import { calculateNextDeliveryDateForCustomer, formatDateShort } from '../../utils/dateUtils';
import { Modal, Button, Input, Select, Textarea } from '../ui';
import { CalendarPlus, Save, Package, Truck, Search } from 'lucide-react';

interface CreateBackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  query: CustomerQuery;
  onSuccess: () => void;
}

export const CreateBackOrderModal: React.FC<CreateBackOrderModalProps> = ({
  isOpen,
  onClose,
  query,
  onSuccess,
}) => {
  const [productId, setProductId] = useState(query.product_id || '');
  const [productSearch, setProductSearch] = useState('');
  const [productNameCustom, setProductNameCustom] = useState(query.reference_label || query.subject || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState(query.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const catalogProducts = useMemo(() => localDb.getProducts({ activeOnly: true }), [isOpen]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return catalogProducts.slice(0, 10);
    const q = productSearch.toLowerCase().trim();
    return catalogProducts.filter((p) => p.product_name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)).slice(0, 10);
  }, [catalogProducts, productSearch]);

  const selectedProduct = useMemo(() => {
    return catalogProducts.find((p) => p.id === productId) || null;
  }, [catalogProducts, productId]);

  const nextDeliveryDate = useMemo(() => {
    if (!query.customer) return '';
    return calculateNextDeliveryDateForCustomer(query.customer.route || query.customer.city);
  }, [query.customer]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const prodName = selectedProduct ? selectedProduct.product_name : (productNameCustom || query.subject);
      const sku = selectedProduct ? selectedProduct.sku : null;

      const bo = localDb.createBackOrder({
        query_id: query.id,
        customer_id: query.customer_id,
        product_id: productId || null,
        product_name_snapshot: prodName,
        sku_snapshot: sku,
        quantity: quantity || 1,
        reason: reason.trim() || query.subject,
        original_order_id: query.order_id || null,
        original_order_number: query.order?.order_number || null,
        original_delivery_date: query.order?.expected_delivery_date || null,
        next_delivery_date: nextDeliveryDate,
      });

      // Update query with back_order_id link
      localDb.updateQuery(query.id, { create_back_order: true } as any, 'system');

      onSuccess();
      onClose();
    } catch (err) {
      console.error('[CreateBackOrderModal] Error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      title="CREATE BACK ORDER"
      subtitle={`Queue item for next scheduled delivery (${query.customer?.company_name})`}
      icon={<CalendarPlus className="w-5 h-5 text-teal-600" />}
      className="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Customer Readonly Confirmation */}
        <div className="p-3 bg-teal-50/70 rounded-xl border border-teal-200 text-xs space-y-1">
          <div className="flex items-center justify-between font-bold text-teal-900">
            <span>{query.customer?.company_name}</span>
            <span className="font-mono text-teal-700 bg-white px-2 py-0.5 rounded border border-teal-200">
              {query.customer?.customer_code}
            </span>
          </div>
          <div className="flex items-center gap-1 text-teal-800 font-semibold pt-1">
            <Truck className="w-3.5 h-3.5 text-teal-600" />
            <span>Next Scheduled Delivery: <strong>{formatDateShort(nextDeliveryDate)}</strong></span>
          </div>
        </div>

        {/* Item Selection */}
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Item to Send <span className="text-rose-500">*</span>
          </label>
          
          <div className="grid grid-cols-1 gap-2">
            <Input
              type="text"
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              placeholder="Search catalog product..."
              icon={<Search className="w-4 h-4 text-slate-400" />}
              className="pl-9 text-xs"
            />
            <Select
              value={productId}
              onChange={(e) => {
                setProductId(e.target.value);
                const p = catalogProducts.find(prod => prod.id === e.target.value);
                if (p) setProductNameCustom(p.product_name);
              }}
              className="text-xs font-semibold"
            >
              <option value="">-- Select Catalog Product --</option>
              {filteredProducts.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.product_name} ({p.sku})
                </option>
              ))}
            </Select>

            {!productId && (
              <Input
                label="Or Custom Item Name"
                type="text"
                value={productNameCustom}
                onChange={(e) => setProductNameCustom(e.target.value)}
                placeholder="Item name description..."
                className="text-xs"
              />
            )}
          </div>
        </div>

        {/* Quantity */}
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Quantity"
            type="number"
            min={1}
            value={quantity}
            onChange={(e) => setQuantity(e.target.value ? parseInt(e.target.value) : 1)}
            required
            className="text-sm font-bold"
          />

          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800 mb-1">
              Status
            </label>
            <div className="h-10 px-3 rounded-lg bg-slate-100 border border-slate-300 font-bold text-xs flex items-center text-amber-800">
              PENDING
            </div>
          </div>
        </div>

        {/* Reason / Notes */}
        <div className="space-y-1.5">
          <label className="block text-xs font-extrabold uppercase tracking-wider text-slate-800">
            Back Order Reason / Note
          </label>
          <Textarea
            rows={2}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason for back order..."
            className="text-xs"
          />
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
          <Button variant="outline" type="button" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" loading={isSubmitting} icon={<Save className="w-4 h-4" />}>
            Create Back Order
          </Button>
        </div>
      </form>
    </Modal>
  );
};
