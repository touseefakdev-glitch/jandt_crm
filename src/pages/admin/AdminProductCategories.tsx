import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { ProductCategory } from '../../types';
import { Package, Plus, Edit, X } from 'lucide-react';

export const AdminProductCategories: React.FC = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ProductCategory | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const categories = useMemo(() => localDb.getProductCategories(), [refreshKey]);
  const products = useMemo(() => localDb.getProducts(), [refreshKey]);

  if (!user) return null;

  const handleOpenModal = (cat?: ProductCategory) => {
    if (cat) {
      setEditingCategory(cat);
      setName(cat.name);
      setDescription(cat.description || '');
      setIsActive(cat.is_active);
    } else {
      setEditingCategory(null);
      setName('');
      setDescription('');
      setIsActive(true);
    }
    setIsModalOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      localDb.updateProductCategory(editingCategory.id, { name: name.trim(), description: description.trim(), is_active: isActive }, user.id);
    } else {
      localDb.addProductCategory({ name: name.trim(), description: description.trim(), is_active: isActive }, user.id);
    }

    setIsModalOpen(false);
    setRefreshKey(prev => prev + 1);
  };

  const handleToggleStatus = (cat: ProductCategory) => {
    localDb.updateProductCategory(cat.id, { is_active: !cat.is_active }, user.id);
    setRefreshKey(prev => prev + 1);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Product Catalog Categories</h2>
          <p className="text-xs text-slate-500">Manage categories for packaging, industrial tape, equipment, and cleaning products</p>
        </div>

        <button
          onClick={() => handleOpenModal()}
          className="inline-flex items-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors space-x-1.5 shrink-0"
        >
          <Plus className="w-4 h-4 text-sky-400" />
          <span>Add Product Category</span>
        </button>
      </div>

      {/* Categories Data Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5">Category Name</th>
                <th className="px-5 py-3.5">Description</th>
                <th className="px-5 py-3.5">Catalog Products</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {categories.map((cat) => {
                const productCount = products.filter(p => p.category_id === cat.id).length;
                return (
                  <tr key={cat.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center space-x-2">
                      <Package className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>{cat.name}</span>
                    </td>
                    <td className="px-5 py-3.5 text-slate-600 max-w-xs">
                      {cat.description || <span className="italic text-slate-400">No description</span>}
                    </td>
                    <td className="px-5 py-3.5 font-bold text-slate-900 font-mono">
                      {productCount} product(s)
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        cat.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {cat.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right space-x-2">
                      <button
                        onClick={() => handleOpenModal(cat)}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold rounded text-[11px] border border-slate-300"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggleStatus(cat)}
                        className={`px-2.5 py-1 font-semibold rounded text-[11px] ${
                          cat.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                        }`}
                      >
                        {cat.is_active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Category Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full border border-slate-200 shadow-2xl space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-900 text-base">
                {editingCategory ? 'Edit Product Category' : 'Add Product Category'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-900">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Category Name *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Stretch Film, Safety Supplies"
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
                  required
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Category description..."
                  className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 resize-none"
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="prodCatActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 text-sky-600 rounded"
                />
                <label htmlFor="prodCatActive" className="font-semibold text-slate-800">Category Active</label>
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-lg shadow-xs"
                >
                  Save Product Category
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
