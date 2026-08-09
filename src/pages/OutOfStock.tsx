import React, { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Product, ProductAvailabilityStatus } from '../types';
import { localDb } from '../services/db';
import { ProductAvailabilityModal } from '../components/products/ProductAvailabilityModal';
import { 
  AlertTriangle, 
  Search, 
  Eye, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  Calendar, 
  Package,
  User,
  ArrowRight
} from 'lucide-react';

export const OutOfStock: React.FC = () => {
  const { user, hasRole } = useAuth();
  const navigate = useNavigate();

  const isAdmin = hasRole('admin');

  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityModalProduct, setAvailabilityModalProduct] = useState<Product | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Fetch Out of Stock products
  const outOfStockProducts = useMemo(() => {
    let list = localDb.getOutOfStockProducts();
    if (searchTerm.trim()) {
      const qStr = searchTerm.toLowerCase().trim();
      list = list.filter(p =>
        p.sku.toLowerCase().includes(qStr) ||
        p.product_name.toLowerCase().includes(qStr) ||
        (p.category && p.category.name.toLowerCase().includes(qStr)) ||
        (p.brand && p.brand.name.toLowerCase().includes(qStr)) ||
        (p.availability_notes && p.availability_notes.toLowerCase().includes(qStr))
      );
    }
    return list;
  }, [searchTerm, feedback]);

  const handleRestoreAvailability = (
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
        setFeedback({ 
          type: 'success', 
          message: `Product ${updated.sku} availability restored to Available.` 
        });
      }
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error restoring availability.' });
    }

    setAvailabilityModalProduct(null);
    setTimeout(() => setFeedback(null), 4000);
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Header */}
      <div className="bg-red-500 text-white p-6 rounded-xl shadow-sm border border-red-600 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-white backdrop-blur-xs">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Out of Stock Product Alerts</h1>
            <p className="text-xs text-red-100 mt-0.5">
              Live operational inventory unavailability view for Sales and Support handling
            </p>
          </div>
        </div>

        <div className="bg-white/10 px-4 py-2 rounded-lg backdrop-blur-xs border border-white/20 font-mono text-xs font-bold flex items-center space-x-2">
          <span>Currently Out of Stock:</span>
          <span className="text-base bg-white text-red-700 px-2.5 py-0.5 rounded-md">{outOfStockProducts.length} Items</span>
        </div>
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

      {/* Search & Action Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search unavailable SKU, Name, Reason..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>

        <Link
          to="/products"
          className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center"
        >
          <span>View Full Products Catalog</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </div>

      {/* Out of Stock Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {outOfStockProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                <tr>
                  <th className="px-5 py-3">SKU</th>
                  <th className="px-5 py-3">Product Name</th>
                  <th className="px-5 py-3">Category</th>
                  <th className="px-5 py-3">Unavailability Reason</th>
                  <th className="px-5 py-3">Expected Available Date</th>
                  <th className="px-5 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {outOfStockProducts.map((product) => (
                  <tr key={product.id} className="hover:bg-red-50/30 transition-colors">
                    
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
                      {product.category?.name || 'General'}
                    </td>

                    {/* Reason */}
                    <td className="px-5 py-3.5 font-medium text-red-900 max-w-sm">
                      {product.availability_notes || <span className="text-slate-400 italic">No notes logged</span>}
                    </td>

                    {/* Expected Date */}
                    <td className="px-5 py-3.5 font-mono font-semibold text-slate-700">
                      {product.expected_available_date ? (
                        <span className="inline-flex items-center space-x-1 text-slate-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          <span>{new Date(product.expected_available_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">Unknown</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-5 py-3.5 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        
                        <Link
                          to={`/products/${product.id}`}
                          title="View Product Profile & History"
                          className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg transition-colors"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>

                        {isAdmin && (
                          <button
                            onClick={() => setAvailabilityModalProduct(product)}
                            className="inline-flex items-center px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded transition-colors shadow-xs space-x-1"
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>Restore Available</span>
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
            <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No Out of Stock Alerts</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              All catalog products are currently marked Available.
            </p>
            <Link
              to="/products"
              className="inline-flex items-center px-3.5 py-2 bg-slate-900 text-white text-xs font-medium rounded-lg hover:bg-slate-800"
            >
              View Products Catalog
            </Link>
          </div>
        )}
      </div>

      {/* Availability Modal */}
      <ProductAvailabilityModal
        isOpen={!!availabilityModalProduct}
        onClose={() => setAvailabilityModalProduct(null)}
        onSubmit={handleRestoreAvailability}
        product={availabilityModalProduct}
        targetStatus="available"
      />

    </div>
  );
};
