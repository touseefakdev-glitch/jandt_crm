import React, { useState, useEffect, useMemo } from 'react';
import { Product, ProductFormInput, ProductAvailabilityStatus } from '../../types';
import { localDb } from '../../services/db';
import { X, Package, DollarSign, Tag, Award, AlertCircle } from 'lucide-react';

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormInput) => void;
  productToEdit?: Product | null;
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
  const [error, setError] = useState('');

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
    setError('');
  }, [productToEdit, isOpen, categories, brands]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!sku.trim()) {
      setError('Product SKU is required.');
      return;
    }
    if (!productName.trim()) {
      setError('Product Name is required.');
      return;
    }
    if (unitPrice < 0) {
      setError('Unit Price cannot be negative.');
      return;
    }

    try {
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
    } catch (err: any) {
      setError(err.message || 'Failed to save product.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <Package className="w-5 h-5 text-sky-400" />
            <h3 className="font-bold text-base">
              {productToEdit ? `Edit Product: ${productToEdit.sku}` : 'Create New Product Catalog Entry'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-start space-x-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Grid Row 1: SKU & Product Name */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                SKU / Product Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="e.g. IND-CLEAN-500"
                className="w-full px-3 py-2 text-xs font-mono font-bold uppercase border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                Product Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. ProClean Heavy-Duty Degreaser 5Gal"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Grid Row 2: Category, Brand, Unit Price */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 flex items-center space-x-1">
                <Tag className="w-3.5 h-3.5 text-slate-400" />
                <span>Category</span>
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 flex items-center space-x-1">
                <Award className="w-3.5 h-3.5 text-slate-400" />
                <span>Brand</span>
              </label>
              <select
                value={brandId}
                onChange={(e) => setBrandId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
              >
                <option value="">Select Brand</option>
                {brands.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase mb-1 flex items-center space-x-1">
                <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                <span>Unit Price ($) <span className="text-red-500">*</span></span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={unitPrice}
                onChange={(e) => setUnitPrice(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
              Description & Specifications
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Product technical details, application guidance, packaging specs..."
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
            />
          </div>

          {/* Availability Status Section */}
          <div className="pt-2 border-t border-slate-200 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Product Availability Status
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Status
                </label>
                <select
                  value={availabilityStatus}
                  onChange={(e) => setAvailabilityStatus(e.target.value as ProductAvailabilityStatus)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-semibold"
                >
                  <option value="available">🟢 Available</option>
                  <option value="out_of_stock">🔴 Out of Stock</option>
                  <option value="discontinued">⚫ Discontinued</option>
                </select>
              </div>

              {availabilityStatus === 'out_of_stock' && (
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                    Expected Available Date (If Known)
                  </label>
                  <input
                    type="date"
                    value={expectedAvailableDate}
                    onChange={(e) => setExpectedAvailableDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white font-mono"
                  />
                </div>
              )}
            </div>

            {availabilityStatus === 'out_of_stock' && (
              <div>
                <label className="block text-[11px] font-semibold text-slate-600 uppercase mb-1">
                  Availability Reason / Supplier Note <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required={availabilityStatus === 'out_of_stock'}
                  value={availabilityNotes}
                  onChange={(e) => setAvailabilityNotes(e.target.value)}
                  placeholder="e.g. Chemical resin shortage from primary supplier..."
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            )}
          </div>

          {/* Active Status Checkbox */}
          <div className="pt-2 flex items-center space-x-2">
            <input
              type="checkbox"
              id="productActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="productActive" className="text-xs font-semibold text-slate-800 cursor-pointer">
              Active in Product Catalog (Active items appear in order & query lookup lists)
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              {productToEdit ? 'Save Changes' : 'Create Product'}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
