import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Product, ProductAvailabilityStatus, ProductAvailabilityHistory } from '../types';
import { localDb } from '../services/db';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ProductAvailabilityModal } from '../components/products/ProductAvailabilityModal';
import { Badge, Button, Card, CardBody, CardHeader, EmptyState, PageHeader, Table, Tabs, TBody, Td, Th, THead, Tr, useToast } from '../components/ui';
import { getOrderStatusBadge, getProductAvailabilityBadge } from '../utils/badges';
import { formatCurrency, formatDate, formatDateTime } from '../utils/format';
import {
  ArrowLeft,
  Package,
  Calendar,
  Activity,
  Edit,
  CheckCircle2,
  AlertTriangle,
  ShoppingBag,
  ShieldCheck,
  ArrowRight,
  History,
} from 'lucide-react';

export const ProductDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user, hasRole } = useAuth();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [history, setHistory] = useState<ProductAvailabilityHistory[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'orders'>('overview');

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [availabilityModalProduct, setAvailabilityModalProduct] = useState<Product | null>(null);
  const [availabilityTargetStatus, setAvailabilityTargetStatus] = useState<ProductAvailabilityStatus | null>(null);

  const isAdmin = hasRole('admin');

  useEffect(() => {
    if (id) {
      loadProductData(id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    return allOrders.filter((o) =>
      o.items?.some(
        (item) => item.product_id === product.id || item.sku_snapshot.toLowerCase() === product.sku.toLowerCase()
      )
    );
  }, [product]);

  if (!product) {
    return (
      <EmptyState
        icon={<Package className="w-7 h-7" />}
        title="Catalog Product Not Found"
        description="The requested product ID does not exist or has been removed."
        action={
          <Link to="/products">
            <Button variant="outline" icon={<ArrowLeft className="w-4 h-4" />}>
              Return to Products Catalog
            </Button>
          </Link>
        }
      />
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
      toast({
        type: 'success',
        title: 'Availability updated',
        message:
          targetStatus === 'out_of_stock'
            ? `Product ${product.sku} marked Out of Stock. Agents notified.`
            : `Product ${product.sku} availability restored to Available.`,
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'Update failed', message: err.message || 'Error updating availability.' });
    }
  };

  const isOutOfStock = product.availability_status === 'out_of_stock';

  return (
    <div className="space-y-6">
      <div>
        <Link
          to="/products"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors mb-3"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Product Catalog
        </Link>
      </div>

      <PageHeader
        icon={<Package className="w-5 h-5 text-brand-400" />}
        title={product.product_name}
        description={
          <>
            <span className="font-mono font-bold text-slate-900">{product.sku}</span>
            <span className="mx-1.5 text-slate-300">•</span>
            <span>Category: {product.category?.name || 'Unassigned'}</span>
            <span className="mx-1.5 text-slate-300">•</span>
            <span>Brand: {product.brand?.name || 'Unassigned'}</span>
            <span className="mx-1.5 text-slate-300">•</span>
            <span className="font-mono font-bold text-slate-900">{formatCurrency(product.unit_price)}</span>
          </>
        }
        badges={
          <>
            <Badge badge={getProductAvailabilityBadge(product.availability_status)} />
            <Badge
              badge={{
                subtle: product.is_active
                  ? 'bg-slate-100 text-slate-700 ring-slate-200'
                  : 'bg-amber-50 text-amber-700 ring-amber-200',
                solid: product.is_active ? 'bg-slate-500 text-white' : 'bg-amber-500 text-white',
                dot: product.is_active ? 'bg-slate-400' : 'bg-amber-500',
                label: product.is_active ? 'Active Item' : 'Inactive Item',
              }}
            />
          </>
        }
        actions={
          isAdmin ? (
            <div className="flex flex-wrap items-center gap-2">
              {isOutOfStock ? (
                <Button
                  variant="success"
                  icon={<CheckCircle2 className="w-4 h-4" />}
                  onClick={() => {
                    setAvailabilityModalProduct(product);
                    setAvailabilityTargetStatus('available');
                  }}
                >
                  Restore Availability
                </Button>
              ) : (
                <Button
                  variant="danger"
                  icon={<AlertTriangle className="w-4 h-4" />}
                  onClick={() => {
                    setAvailabilityModalProduct(product);
                    setAvailabilityTargetStatus('out_of_stock');
                  }}
                >
                  Mark Out of Stock
                </Button>
              )}
              <Button variant="outline" icon={<Edit className="w-3.5 h-3.5" />} onClick={() => setIsEditModalOpen(true)}>
                Edit Details
              </Button>
            </div>
          ) : undefined
        }
      />

      {isOutOfStock && (
        <Card className="border-red-200 bg-red-50">
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-red-900 font-bold text-sm uppercase tracking-wider">
                <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                <span>OUT OF STOCK ALERT</span>
              </div>
              {product.expected_available_date && (
                <div className="flex items-center gap-1.5 text-xs font-mono font-bold text-red-800 bg-red-100 px-3 py-1 rounded-md border border-red-200">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Expected Available: {formatDate(product.expected_available_date)}</span>
                </div>
              )}
            </div>

            <div className="p-4 bg-white rounded-lg border border-red-200 text-xs text-red-950 font-medium space-y-1">
              <div className="font-bold text-red-900">Unavailability Reason / Supplier Note:</div>
              <p className="whitespace-pre-line leading-relaxed">
                {product.availability_notes || 'No specific supplier reason logged.'}
              </p>
            </div>

            <p className="text-[11px] text-red-700">
              Note: Expected availability is informational. Product status will remain Out of Stock until explicitly
              restored by an authorized user.
            </p>
          </CardBody>
        </Card>
      )}

      <Tabs
        size="md"
        tabs={[
          { value: 'overview' as const, label: 'Product Overview' },
          { value: 'history' as const, label: (<span className="flex items-center gap-1.5"><History className="w-3.5 h-3.5" /> Availability History ({history.length})</span>) },
          { value: 'orders' as const, label: (<span className="flex items-center gap-1.5"><ShoppingBag className="w-3.5 h-3.5" /> Related Orders ({relatedOrders.length})</span>) },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader icon={<Package className="w-4 h-4 text-brand-600" />} title="Technical Specifications & Description" />
              <CardBody className="space-y-4">
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
                    <span className="font-mono font-extrabold text-brand-700 mt-0.5 block">{formatCurrency(product.unit_price)}</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader icon={<Calendar className="w-4 h-4 text-purple-600" />} title="Product System Audit" />
              <CardBody>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 text-xs space-y-1">
                  <div>
                    <span className="font-semibold text-slate-700">Created:</span> {formatDateTime(product.created_at)}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Created By:</span>{' '}
                    {product.created_by_profile?.full_name || 'Admin'}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Last Updated:</span> {formatDateTime(product.updated_at)}
                  </div>
                  {product.updated_by_profile && (
                    <div>
                      <span className="font-semibold text-slate-700">Updated By:</span> {product.updated_by_profile.full_name}
                    </div>
                  )}
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <Card>
          <CardHeader icon={<Activity className="w-4 h-4 text-brand-600" />} title="Immutable Availability Audit Trail" />
          <CardBody>
            {history.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-slate-200 space-y-6">
                {history.map((h) => (
                  <div key={h.id} className="relative">
                    <div
                      className={`absolute -left-[31px] top-0.5 w-4 h-4 rounded-full border-2 border-white ring-4 ${
                        h.new_status === 'out_of_stock' ? 'bg-red-500 ring-red-50' : 'bg-emerald-500 ring-emerald-50'
                      }`}
                    ></div>
                    <div className="text-xs font-semibold text-slate-500 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>{formatDateTime(h.changed_at)}</span>
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
                        Expected Availability Date: {formatDate(h.expected_available_date)}
                      </p>
                    )}
                    <p className="text-xs text-slate-500 mt-1">
                      Reported by:{' '}
                      <span className="font-semibold text-slate-800">{h.changed_by_profile?.full_name || 'System Admin'}</span>
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Activity className="w-7 h-7" />}
                title="No Availability History"
                description="No availability status changes logged for this product."
              />
            )}
          </CardBody>
        </Card>
      )}

      {activeTab === 'orders' && (
        <Card>
          <CardHeader
            icon={<ShoppingBag className="w-4 h-4 text-brand-600" />}
            title={`Orders Containing Product ${product.sku} (${relatedOrders.length})`}
          />
          <CardBody className="space-y-4">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-950 text-xs flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-purple-600 shrink-0" />
              <span className="font-semibold">
                INFORMATIONAL ONLY: The orders listed below represent customer demand history for SKU {product.sku}.
                J&amp;T Supplies CRM does NOT track inventory balances or decrement physical stock ledger.
              </span>
            </div>

            {relatedOrders.length > 0 ? (
              <Table>
                <THead>
                  <Tr hover={false}>
                    <Th>Order Number</Th>
                    <Th>Customer</Th>
                    <Th>Sales Agent</Th>
                    <Th>Current Status</Th>
                    <Th className="font-mono">Grand Total</Th>
                    <Th className="text-right">Action</Th>
                  </Tr>
                </THead>
                <TBody>
                  {relatedOrders.map((o) => (
                    <Tr key={o.id}>
                      <Td className="font-mono font-bold text-brand-700">
                        <Link to={`/orders/${o.id}`} className="hover:underline">{o.order_number}</Link>
                      </Td>
                      <Td className="font-semibold text-slate-900">{o.customer ? o.customer.company_name : 'Unknown'}</Td>
                      <Td className="font-medium text-slate-800">{o.sales_agent_profile?.full_name || 'Unassigned'}</Td>
                      <Td><Badge badge={getOrderStatusBadge(o.current_status)} /></Td>
                      <Td className="font-mono font-bold text-slate-900">{formatCurrency(o.grand_total)}</Td>
                      <Td className="text-right">
                        <Link
                          to={`/orders/${o.id}`}
                          className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg inline-block"
                        >
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            ) : (
              <EmptyState
                icon={<ShoppingBag className="w-7 h-7" />}
                title="No Related Orders"
                description="No customer orders contain this product yet."
              />
            )}
          </CardBody>
        </Card>
      )}

      <ProductFormModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSubmit={(data) => {
          if (!user) return;
          localDb.updateProduct(product.id, data, user.id);
          setIsEditModalOpen(false);
          loadProductData(product.id);
          toast({ type: 'success', title: 'Product updated', message: `Product ${product.sku} updated successfully.` });
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
