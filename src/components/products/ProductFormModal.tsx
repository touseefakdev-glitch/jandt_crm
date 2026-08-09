import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductFormInput, ProductAvailabilityStatus } from '../../types';
import { localDb } from '../../services/db';
import { Badge, Button, Input, Modal, Select, Textarea } from '../ui';
import { getProductAvailabilityBadge } from '../../utils/badges';
import { Package, DollarSign, Save } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormInput) => void;
  productToEdit?: Product | null;
}

interface FormErrors {
  sku?: string;
  productName?: string;
  unitPrice?: string;
}

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  productToEdit,
}) => {
  const [sku, setSku] = useState('');
  const [productName, setProductName] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [brandId, setBrandId] = useState('');
  const [unitPrice, setUnitPrice] = useState<number>(0);
  const [availabilityStatus, setAvailabilityStatus] = useState<ProductAvailabilityStatus>('available');
  const [availabilityNotes, setAvailabilityNotes] = useState('');
  const [expectedAvailableDate, setExpectedAvailableDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [errors, setErrors] = useState<FormErrors>({});

  const categories = useMemo(() => localDb.getProductCategories(), []);
  const brands = useMemo(() => localDb.getProductBrands(), []);

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setProductName(productToEdit.product_name);
      setDescription(productToEdit.description || '');
      setCategoryId(productToEdit.category_id || '');
      setBrandId(productToEdit.brand_id || '');
      setUnitPrice(productToEdit.unit_price);
      setAvailabilityStatus(productToEdit.availability_status);
      setAvailabilityNotes(productToEdit.availability_notes || '');
      setExpectedAvailableDate(productToEdit.expected_available_date || '');
      setIsActive(productToEdit.is_active);
    } else {
      setSku('');
      setProductName('');
      setDescription('');
      setCategoryId(categories[0]?.id || '');
      setBrandId(brands[0]?.id || '');
      setUnitPrice(0);
      setAvailabilityStatus('available');
      setAvailabilityNotes('');
      setExpectedAvailableDate('');
      setIsActive(true);
    }
    setErrors({});
  }, [productToEdit, isOpen, categories, brands]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: FormErrors = {};

    if (!sku.trim()) nextErrors.sku = 'Product SKU is required.';
    if (!productName.trim()) nextErrors.productName = 'Product Name is required.';
    if (unitPrice < 0) nextErrors.unitPrice = 'Unit Price cannot be negative.';

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onSubmit({
      sku: sku.trim().toUpperCase(),
      product_name: productName.trim(),
      description: description.trim() || undefined,
      category_id: categoryId || undefined,
      brand_id: brandId || undefined,
      unit_price: Number(unitPrice),
      availability_status: availabilityStatus,
      availability_notes: availabilityNotes.trim() || undefined,
      expected_available_date: expectedAvailableDate || undefined,
      is_active: isActive,
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="lg"
      icon={
        <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
          <Package className="w-5 h-5" />
        </div>
      }
      title={productToEdit ? `Edit Product: ${productToEdit.sku}` : 'Create New Product Catalog Entry'}
      subtitle={
        productToEdit ? 'Update product details and catalog availability.' : 'Register a new item in the product catalog.'
      }
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Input
            label={<>SKU / Product Code <span className="text-red-500">*</span></>}
            value={sku}
            onChange={(e) => setSku(e.target.value)}
            placeholder="e.g. IND-CLEAN-500"
            error={errors.sku}
            className="font-mono font-bold uppercase"
          />

          <div className="sm:col-span-2">
            <Input
              label={<>Product Name <span className="text-red-500">*</span></>}
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              placeholder="e.g. ProClean Heavy-Duty Degreaser 5Gal"
              error={errors.productName}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Select
            label="Category"
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select Category</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </Select>

          <Select
            label="Brand"
            value={brandId}
            onChange={(e) => setBrandId(e.target.value)}
          >
            <option value="">Select Brand</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>

          <Input
            label={<>Unit Price ($) <span className="text-red-500">*</span></>}
            type="number"
            step="0.01"
            min="0"
            value={unitPrice}
            onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
            error={errors.unitPrice}
            icon={<DollarSign className="w-4 h-4" />}
            className="font-mono"
          />
        </div>

        <Textarea
          label="Description & Specifications"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Product technical details, application guidance, packaging specs..."
        />

        <div className="pt-3 border-t border-slate-200 space-y-3">
          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Product Availability Status
          </h4>

          <div className="flex items-center gap-3">
            <Select
              label="Status"
              value={availabilityStatus}
              onChange={(e) => setAvailabilityStatus(e.target.value as ProductAvailabilityStatus)}
              className="font-semibold"
            >
              <option value="available">Available</option>
              <option value="out_of_stock">Out of Stock</option>
              <option value="discontinued">Discontinued</option>
            </Select>
            <div className="pt-5">
              <Badge badge={getProductAvailabilityBadge(availabilityStatus)} />
            </div>
          </div>

          {availabilityStatus === 'out_of_stock' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Input
                label="Expected Available Date (If Known)"
                type="date"
                value={expectedAvailableDate}
                onChange={(e) => setExpectedAvailableDate(e.target.value)}
                className="font-mono"
              />
              <div className="sm:col-span-2">
                <Input
                  label={<>Availability Reason / Supplier Note <span className="text-red-500">*</span></>}
                  value={availabilityNotes}
                  onChange={(e) => setAvailabilityNotes(e.target.value)}
                  placeholder="e.g. Chemical resin shortage from primary supplier..."
                />
              </div>
            </div>
          )}
        </div>

        <label className="flex items-start gap-2 pt-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="mt-0.5 rounded border-slate-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-xs font-semibold text-slate-800">
            Active in Product Catalog (Active items appear in order & query lookup lists)
          </span>
        </label>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" icon={<Save className="w-4 h-4" />}>
            {productToEdit ? 'Save Changes' : 'Create Product'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
