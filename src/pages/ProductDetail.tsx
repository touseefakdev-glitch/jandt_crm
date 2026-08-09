import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Product, ProductAvailabilityStatus, ProductAvailabilityHistory, Order } from '../types';
import { localDb } from '../services/db';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ProductAvailabilityModal } from '../components/products/ProductAvailabilityModal';
import { 
  ArrowLeft, 
  Package, 
  Tag, 
  Award, 
  DollarSign, 
  Calendar, 
  Activity, 
  Clock, 
  Edit, 
  RotateCcw, 
  CheckCircle2, 
  AlertTriangle, 
  Ban, 
  ShoppingBag, 
  Eye, 
  AlertCircle,
  Building2,
  ShieldCheck
} from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, hasRole } = useAuth();

  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<ProductAvailabilityHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'orders'>('overview');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [availabilityModalProduct, setAvailabilityModalProduct] = useState<Product | null>(null);
  const [availabilityTargetStatus, setAvailabilityTargetStatus] = useState<ProductAvailabilityStatus | null>(null);

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const isAdmin = hasRole('admin');

  useEffect(() => {
    if (id) {
      loadProductData(id);
    }
  }, [id]);

  const loadProductData = (prodId: string) => {
    const p = localDb.getProductById(prodId);
    setProduct(p);
    if (p) {
      setHistory(localDb.getProductAvailabilityHistory(p.id));
    }
  };

  const relatedOrders = useMemo(() => {
    if (!product) return [];
    const allOrders = localDb.getOrders();
    return allOrders.filter(o => 
      o.items?.some(item => item.product_id === product.id || item.sku_snapshot.toLowerCase() === product.sku.toLowerCase())
    );
  }, [product]);

  if (!product) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200 my-8">
        <Package className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800 mb-1">Catalog Product Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The requested product ID does not exist or has been removed.</p>
        <Link
          to="/products"
          className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Products Catalog
        </Link>
      </div>
    );
  }

  const handleAvailabilitySubmit = (
    targetStatus: ProductAvailabilityStatus,
    reason: string,
    expectedDate: string | null
  ) => {
    if (!user) return;
    try {
      localDb.changeProductAvailability(product.id, targetStatus, reason, expectedDate, user.id);
      setAvailabilityModalProduct(null);
      setAvailabilityTargetStatus(null);
      loadProductData(product.id);
      setFeedback({ 
        type: 'success', 
        message: targetStatus === 'out_of_stock'
          ? `Product ${product.sku} marked Out of Stock. Agents notified.`
          : `Product ${product.sku} availability restored to Available.` 
      });
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Error updating availability.' });
    }
    setTimeout(() => setFeedback(null), 4000);
  };

  const getAvailabilityBadge = (status: ProductAvailabilityStatus) => {
    switch (status) {
      case 'available':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
            🟢 Available
          </span>
        );
      case 'out_of_stock':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-red-100 text-red-800 border border-red-200">
            🔴 Out of Stock
          </span>
        );
      case 'discontinued':
        return (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            ⚫ Discontinued
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Bar Back Link */}
      <div>
        <Link
          to="/products"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Product Catalog
        </Link>
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

      {/* Main Product Header Banner */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        <div>
          <div className="flex items-center space-x-2 mb-2">
            <span className="font-mono text-sm font-bold text-sky-700 bg-sky-50 px-3 py-1 rounded-md border border-sky-200">
              {product.sku}
            </span>
            {getAvailabilityBadge(product.availability_status)}
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-semibold uppercase ${
              product.is_active ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-800'
            }`}>
              {product.is_active ? 'Active Item' : 'Inactive Item'}
            </span>
          </div>

          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {product.product_name}
          </h1>

          <p className="text-xs text-slate-500 mt-1 flex items-center space-x-2">
            <span>Category: {product.category?.name || 'Unassigned'}</span>
            <span>•</span>
            <span>Brand: {product.brand?.name || 'Unassigned'}</span>
            <span>•</span>
            <span className="font-mono font-bold text-slate-900">${product.unit_price.toFixed(2)}</span>
          </p>
        </div>

        {/* Action Controls (Admin only) */}
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Toggle Availability Button */}
            {product.availability_status === 'out_of_stock' ? (
              <button
                onClick={() => {
                  setAvailabilityModalProduct(product);
                  setAvailabilityTargetStatus('available');
                }}
                className="inline-flex items-center px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs space-x-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Restore Availability</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setAvailabilityModalProduct(product);
                  setAvailabilityTargetStatus('out_of_stock');
                }}
                className="inline-flex items-center px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg transition-colors shadow-xs space-x-2"
              >
                <AlertTriangle className="w-4 h-4" />
                <span>Mark Out of Stock</span>
              </button>
            )}

            {/* Edit Product */}
            <button
              onClick={() => setIsEditModalOpen(true)}
              className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-medium text-xs rounded-lg transition-colors border border-slate-300"
            >
              <Edit className="w-3.5 h-3.5 mr-1.5" />
              Edit Details
            </button>

          </div>
        )}

      </div>

      {/* OUT OF STOCK ALERT BANNER (If Currently Out of Stock) */}
      {product.availability_status === 'out_of_stock' && (
        <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-200 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2 text-red-900 font-bold text-sm uppercase tracking-wider">
              <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
              <span>OUT OF STOCK ALERT</span>
            </div>
            {product.expected_available_date && (
              <div className="flex items-center space-x-1.5 text-xs font-mono font-bold text-red-800 bg-red-100 px-3 py-1 rounded-md border border-red-200">
                <Calendar className="w-3.5 h-3.5" />
                <span>Expected Available: {new Date(product.expected_available_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
              </div>
            )}
          </div>

          <div className="p-4 bg-white rounded-lg border border-red-200 text-xs text-red-950 font-medium space-y-1">
            <div className="font-bold text-red-900">Unavailability Reason / Supplier Note:</div>
            <p className="whitespace-pre-line leading-relaxed">{product.availability_notes || 'No specific supplier reason logged.'}</p>
          </div>

          <p className="text-[11px] text-red-700">
            Note: Expected availability is informational. Product status will remain Out of Stock until explicitly restored by an authorized user.
          </p>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="border-b border-slate-200 flex items-center space-x-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('overview')}
          className={`pb-3 border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          Product Overview
        </button>

        <button
          onClick={() => setActiveTab('history')}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'history'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>Availability History ({history.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('orders')}
          className={`pb-3 border-b-2 transition-colors flex items-center space-x-1.5 ${
            activeTab === 'orders'
              ? 'border-sky-600 text-sky-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Related Orders ({relatedOrders.length})</span>
        </button>
      </div>

      {/* Tab 1: Product Overview */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left Column: Specs & Description */}
          <div className="lg:col-span-2 space-y-6">
            
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
                <Package className="w-4 h-4 text-sky-600" />
                <span>Technical Specifications & Description</span>
              </h3>

              <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-800 leading-relaxed whitespace-pre-line">
                {product.description || <span className="text-slate-400 italic">No description recorded for this product.</span>}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs pt-2">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-semibold block uppercase">Category</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{product.category?.name || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-semibold block uppercase">Brand</span>
                  <span className="font-bold text-slate-900 mt-0.5 block">{product.brand?.name || 'N/A'}</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <span className="text-slate-500 font-semibold block uppercase">Catalog Unit Price</span>
                  <span className="font-mono font-extrabold text-sky-700 mt-0.5 block">${product.unit_price.toFixed(2)}</span>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: System Audit Metadata */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2 flex items-center space-x-2">
                <Clock className="w-4 h-4 text-purple-600" />
                <span>Product System Audit</span>
              </h3>

              <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                <div><span className="font-semibold text-slate-700">Created:</span> {new Date(product.created_at).toLocaleString()}</div>
                <div><span className="font-semibold text-slate-700">Created By:</span> {product.created_by_profile?.full_name || 'Admin'}</div>
                <div><span className="font-semibold text-slate-700">Last Updated:</span> {new Date(product.updated_at).toLocaleString()}</div>
                {product.updated_by_profile && (
                  <div><span className="font-semibold text-slate-700">Updated By:</span> {product.updated_by_profile.full_name}</div>
                )}
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tab 2: Availability History Audit Log */}
      {activeTab === 'history' && (
        <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm space-y-6">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <Activity className="w-4 h-4 text-sky-600" />
            <span>Immutable Availability Audit Trail</span>
          </h3>

          {history.length > 0 ? (
            <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
              {history.map((h) => (
                <div key={h.id} className="relative">
                  <div className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white ring-4 ${
                    h.new_status === 'out_of_stock' ? 'bg-red-500 ring-red-50' : 'bg-emerald-500 ring-emerald-50'
                  }`}></div>
                  <div className="text-xs font-semibold text-slate-500 flex items-center space-x-2">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{new Date(h.changed_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm font-bold text-slate-900 mt-1">
                    {h.previous_status ? `${h.previous_status.replace('_', ' ').toUpperCase()} → ` : ''}
                    <span className={h.new_status === 'out_of_stock' ? 'text-red-600' : 'text-emerald-600'}>
                      {h.new_status.replace('_', ' ').toUpperCase()}
                    </span>
                  </p>
                  {h.reason && (
                    <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-700 mt-1.5 font-medium leading-relaxed">
                      Reason: {h.reason}
                    </div>
                  )}
                  {h.expected_available_date && (
                    <p className="text-xs font-mono text-slate-600 mt-1">
                      Expected Availability Date: {new Date(h.expected_available_date).toLocaleDateString()}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    Reported by: <span className="font-semibold text-slate-800">{h.changed_by_profile?.full_name || 'System Admin'}</span>
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-6">
              No availability status changes logged for this product.
            </p>
          )}
        </div>
      )}

      {/* Tab 3: Related Customer Orders */}
      {activeTab === 'orders' && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
          
          {/* NO INVENTORY BANNER */}
          <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 text-xs flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
            <span className="font-semibold">
              INFORMATIONAL ONLY: The orders listed below represent customer demand history for SKU {product.sku}. J&T Supplies CRM does NOT track inventory balances or decrement physical stock ledger.
            </span>
          </div>

          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
            <ShoppingBag className="w-4 h-4 text-sky-600" />
            <span>Orders Containing Product {product.sku} ({relatedOrders.length})</span>
          </h3>

          {relatedOrders.length > 0 ? (
            <div className="overflow-x-auto border border-slate-200 rounded-xl">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 uppercase font-semibold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Order Number</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Sales Agent</th>
                    <th className="px-4 py-3">Current Status</th>
                    <th className="px-4 py-3 font-mono">Grand Total</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {relatedOrders.map(o => (
                    <tr key={o.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-sky-700">
                        <Link to={`/orders/${o.id}`} className="hover:underline">{o.order_number}</Link>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">
                        {o.customer ? o.customer.company_name : 'Unknown'}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800">
                        {o.sales_agent_profile?.full_name || 'Unassigned'}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase bg-sky-100 text-sky-800 border border-sky-200">
                          {o.current_status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono font-bold text-slate-900">
                        ${o.grand_total.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link to={`/orders/${o.id}`} className="p-1.5 text-slate-600 hover:text-sky-600 hover:bg-sky-50 rounded-lg inline-block">
                          <Eye className="w-4 h-4" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-6 border border-slate-200 rounded-xl bg-slate-50/50">
              No customer orders contain this product yet.
            </p>
          )}
        </div>
      )}

      {/* Modals */}
      <ProductFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={(data) => {
          localDb.updateProduct(product.id, data, user?.id || '');
          setIsEditModalOpen(false);
          loadProductData(product.id);
        }}
        productToEdit={product}
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
