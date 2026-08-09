import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Product, ProductAvailabilityStatus, ProductFormInput } from '../types';
import { localDb } from '../services/db';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ProductAvailabilityModal } from '../components/products/ProductAvailabilityModal';
import { 
  Package, 
  Search, 
  Plus, 
  Eye, 
  Edit, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  X,
  ChevronLeft, 
  ChevronRight,
  AlertTriangle,
  Tag,
  Award,
  DollarSign
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const Products: React.FC = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const isAdmin = hasRole('admin');

  // Tab State
  const [activeTab, setActiveTab] = useState<'all' | 'out_of_stock' | 'discontinued'>('all');

  // Search & Filter State
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('active'); // active, inactive, all
  const [currentPage, setCurrentPage] = useState(1);

  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [availabilityModalProduct, setAvailabilityModalProduct] = useState<Product | null>(null);
  const [availabilityTargetStatus, setAvailabilityTargetStatus] = useState<ProductAvailabilityStatus | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const categories = useMemo(() => localDb.getProductCategories(), []);
  const brands = useMemo(() => localDb.getProductBrands(), []);

  // Fetch filtered products
  const filteredProducts = useMemo(() => {
    let statusToUse = statusFilter;
    if (activeTab === 'out_of_stock') statusToUse = 'out_of_stock';
    if (activeTab === 'discontinued') statusToUse = 'discontinued';

    return localDb.getProducts({
      searchTerm,
      availability_status: statusToUse,
      category_id: categoryFilter !== 'all' ? categoryFilter : undefined,
      brand_id: brandFilter !== 'all' ? brandFilter : undefined,
      activeOnly: activeFilter === 'active',
    });
  }, [searchTerm, statusFilter, categoryFilter, brandFilter, activeFilter, activeTab, feedback]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const handleClearFilters = () => {
    setSearchTerm('');
    setCategoryFilter('all');
    setBrandFilter('all');
    setStatusFilter('all');
    setActiveFilter('active');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || categoryFilter !== 'all' || brandFilter !== 'all' || statusFilter !== 'all' || activeFilter !== 'active';

  const handleFormSubmit = (data: ProductFormInput) => {
    if (!user) return;
    try {
      if (productToEdit) {
        const updated = localDb.updateProduct(productToEdit.id, data, user.id);
        if (updated) {
          setFeedback({ type: 'success', message: `Product ${updated.sku} updated successfully.` });
        }
      } else {
        const created = localDb.createProduct(data, user.id);
        setFeedback({ type: 'success', message: `Product ${created.sku} created successfully.` });
      }

      setIsFormModalOpen(false);
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error saving product.' });
    }
  };

  const handleAvailabilitySubmit = (
    targetStatus: ProductAvailabilityStatus,
    reason: string,
    expectedDate: string | null
  ) => {
    if (!availabilityModalProduct || !user) return;
    try {
      const updated = localDb.changeProductAvailability(
        availabilityModalProduct.id,
        targetStatus,
        reason,
        expectedDate,
        user.id
      );

      if (updated) {
        const msg = targetStatus === 'out_of_stock'
          ? `Product ${updated.sku} marked Out of Stock. Agents notified.`
          : `Product ${updated.sku} availability restored to Available.`;
        setFeedback({ type: 'success', message: msg });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating availability.' });
    }

    setAvailabilityModalProduct(null);
    setAvailabilityTargetStatus(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  const getAvailabilityBadge = (status: ProductAvailabilityStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-emerald-100 text-emerald-800 border border-emerald-200">
            🟢 Available
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-red-100 text-red-800 border border-red-200">
            🔴 Out of Stock
          </span>
        );
      case 'discontinued':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">
            ⚫ Discontinued
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xs">
            <Package className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Product Catalog & Availability</h1>
            <p className="text-xs text-slate-500">Track item availability status and resupply schedules across product line</p>
          </div>
        </div>

        {isAdmin && (
          <button
            onClick={() => {
              setProductToEdit(null);
              setIsFormModalOpen(true);
            }}
            className="inline-flex items-center justify-center px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-medium text-xs rounded-lg transition-colors shadow-sm space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>New Catalog Product</span>
          </button>
        )}
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center space-x-3 text-xs animate-in fade-in duration-200 ${
          feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* View Tabs & Filters Card */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        
        {/* View Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setActiveTab('all');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'all'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Catalog Products ({localDb.getProducts().length})
            </button>
            <button
              onClick={() => {
                setActiveTab('out_of_stock');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'out_of_stock'
                  ? 'bg-red-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>Out of Stock ({localDb.getOutOfStockProducts().length})</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('discontinued');
                setCurrentPage(1);
              }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'discontinued'
                  ? 'bg-slate-700 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Discontinued ({localDb.getProducts({ availability_status: 'discontinued' }).length})
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>

        {/* Search Input & Dropdown Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search SKU, Product Name, Brand, Category..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Brand Filter */}
          <div>
            <select
              value={brandFilter}
              onChange={(e) => {
                setBrandFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">All Brands</option>
              {brands.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>

          {/* Active Filter */}
          <div>
            <select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="active">Active Products</option>
              <option value="inactive">Inactive Products</option>
              <option value="all">All Catalog Statuses</option>
            </select>
          </div>

        </div>

      </div>

      {/* Products Data Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {paginatedProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Brand</th>
                  <th className="px-5 py-3 font-mono">Unit Price</th>
                  <th className="px-5 py-3">Availability Status</th>
                  <th className="px-5 py-3">Expected Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {paginatedProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* SKU */}
                    <td className="px-5 py-3.5 font-mono font-bold text-sky-700">
                      <Link to={`/products/${product.id}`} className="hover:underline">
                        {product.sku}
                      </Link>
                    </td>

                    {/* Product Name */}
                    <td className="px-5 py-3.5 font-bold text-slate-900 max-w-xs">
                      <Link to={`/products/${product.id}`} className="hover:text-sky-600">
                        {product.product_name}
                      </Link>
                    </td>

                    {/* Category */}
                    <td className="px-5 py-3.5 text-slate-600">
                      {product.category?.name || 'Unassigned'}
                    </td>

                    {/* Brand */}
                    <td className="px-5 py-3.5 text-slate-600">
                      {product.brand?.name || 'Unassigned'}
                    </td>

                    {/* Unit Price */}
                    <td className="px-5 py-3.5 font-mono font-extrabold text-slate-900">
                      ${product.unit_price.toFixed(2)}
                    </td>

                    {/* Availability Status */}
                    <td className="px-5 py-3.5">
                      {getAvailabilityBadge(product.availability_status)}
                    </td>

                    {/* Expected Date */}
                    <td className="px-5 py-3.5 font-mono text-slate-500">
                      {product.expected_available_date ? (
                        new Date(product.expected_available_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      ) : (
                        <span className="text-slate-400 italic">—</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        
                        {/* View Details */}
                        <button
                          onClick={() => navigate(`/products/${product.id}`)}
                          title="View Product Profile & History"
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {/* Edit Product (Admin only) */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setProductToEdit(product);
                              setIsFormModalOpen(true);
                            }}
                            title="Edit Product Details"
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {/* Change Availability (Admin only) */}
                        {isAdmin && (
                          <button
                            onClick={() => {
                              setAvailabilityModalProduct(product);
                              setAvailabilityTargetStatus(
                                product.availability_status === 'out_of_stock' ? 'available' : 'out_of_stock'
                              );
                            }}
                            title={product.availability_status === 'out_of_stock' ? 'Restore Availability' : 'Mark Out of Stock'}
                            className={`p-1.5 rounded-lg transition-colors ${
                              product.availability_status === 'out_of_stock'
                                ? 'text-emerald-600 hover:bg-emerald-50'
                                : 'text-red-600 hover:bg-red-50'
                            }`}
                          >
                            <RotateCcw className="w-4 h-4" />
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
              <Package className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No Catalog Products Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {hasActiveFilters
                ? 'No catalog products matched your search term or active category/availability filters.'
                : 'There are currently no catalog products registered in the database.'}
            </p>
            {hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-sky-600 hover:underline"
              >
                Clear Search & Filters
              </button>
            ) : (
              isAdmin && (
                <button
                  onClick={() => {
                    setProductToEdit(null);
                    setIsFormModalOpen(true);
                  }}
                  className="inline-flex items-center px-3.5 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Create First Product
                </button>
              )
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {filteredProducts.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredProducts.length)}</span> to{' '}
              <span className="font-semibold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}</span> of{' '}
              <span className="font-semibold text-slate-900">{filteredProducts.length}</span> products
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

      {/* Modals */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSubmit={handleFormSubmit}
        productToEdit={productToEdit}
      />

      <ProductAvailabilityModal
        isOpen={!!availabilityModalProduct}
        onClose={() => {
          setAvailabilityModalProduct(null);
          setAvailabilityTargetStatus(null);
        }}
        onSubmit={handleAvailabilitySubmit}
        product={availabilityModalProduct}
        targetStatus={availabilityTargetStatus}
      />

    </div>
  );
};
