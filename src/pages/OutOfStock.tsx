import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Product, ProductAvailabilityStatus } from '../types';
import { localDb } from '../services/db';
import { ProductAvailabilityModal } from '../components/products/ProductAvailabilityModal';
import { Badge, Button, Card, EmptyState, Input, Table, TBody, Td, Th, THead, Tr, useToast } from '../components/ui';
import { getProductAvailabilityBadge } from '../utils/badges';
import { formatDate } from '../utils/format';
import { AlertTriangle, Search, RotateCcw, Calendar, Package, CheckCircle2, ArrowRight } from 'lucide-react';

export const OutOfStock: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();

  const isAdmin = hasRole('admin');

  const [searchTerm, setSearchTerm] = useState('');
  const [availabilityModalProduct, setAvailabilityModalProduct] = useState<Product | null>(null);

  const outOfStockProducts = useMemo(() => {
    let list = localDb.getOutOfStockProducts();
    if (searchTerm.trim()) {
      const qStr = searchTerm.toLowerCase().trim();
      list = list.filter((p) =>
        p.sku.toLowerCase().includes(qStr) ||
        p.product_name.toLowerCase().includes(qStr) ||
        (p.category && p.category.name.toLowerCase().includes(qStr)) ||
        (p.brand && p.brand.name.toLowerCase().includes(qStr)) ||
        (p.availability_notes && p.availability_notes.toLowerCase().includes(qStr))
      );
    }
    return list;
  }, [searchTerm]);

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
        toast({
          type: 'success',
          title: 'Availability restored',
          message: `Product ${updated.sku} availability restored to Available.`,
        });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Update failed', message: err.message || 'Error restoring availability.' });
    }

    setAvailabilityModalProduct(null);
  };

  return (
    <div className="space-y-6">
      <div className="bg-red-600 p-6 rounded-xl border border-red-700 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
            <AlertTriangle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">Out of Stock Product Alerts</h1>
            <p className="text-xs text-red-100 mt-0.5">
              Live operational inventory unavailability view for Sales and Support handling
            </p>
          </div>
        </div>

        <div className="bg-white/10 px-4 py-2 rounded-lg border border-white/20 font-mono text-xs font-bold text-white flex items-center gap-2">
          <span>Currently Out of Stock:</span>
          <span className="text-base bg-white text-red-700 px-2.5 py-0.5 rounded-md">{outOfStockProducts.length} Items</span>
        </div>
      </div>

      <Card className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
        <Input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search unavailable SKU, Name, Reason..."
          icon={<Search className="w-4 h-4 text-slate-400" />}
          className="pl-9 w-full sm:w-80"
        />

        <Link
          to="/products"
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center shrink-0"
        >
          <span>View Full Products Catalog</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Link>
      </Card>

      <Card className="overflow-hidden">
        {outOfStockProducts.length > 0 ? (
          <Table>
            <THead>
              <Tr hover={false}>
                <Th>SKU</Th>
                <Th>Product Name</Th>
                <Th>Category</Th>
                <Th>Availability Status</Th>
                <Th>Unavailability Reason</Th>
                <Th>Expected Available Date</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {outOfStockProducts.map((product) => (
                <Tr key={product.id}>
                  <Td className="font-mono font-bold text-brand-700">
                    <Link to={`/products/${product.id}`} className="hover:underline">{product.sku}</Link>
                  </Td>
                  <Td className="font-bold text-slate-900 max-w-xs">
                    <Link to={`/products/${product.id}`} className="hover:text-brand-600">{product.product_name}</Link>
                  </Td>
                  <Td className="text-slate-600">{product.category?.name || 'General'}</Td>
                  <Td><Badge badge={getProductAvailabilityBadge(product.availability_status)} /></Td>
                  <Td className="font-medium text-red-900 max-w-sm">
                    {product.availability_notes || <span className="text-slate-400 italic">No notes logged</span>}
                  </Td>
                  <Td className="font-mono font-semibold text-slate-700">
                    {product.expected_available_date ? (
                      <span className="inline-flex items-center gap-1 text-slate-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                        <Calendar className="w-3.5 h-3.5 text-amber-600" />
                        <span>{formatDate(product.expected_available_date)}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">Unknown</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        to={`/products/${product.id}`}
                        title="View Product Profile & History"
                        className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>

                      {isAdmin && (
                        <Button
                          size="sm"
                          variant="success"
                          icon={<RotateCcw className="w-3.5 h-3.5" />}
                          onClick={() => setAvailabilityModalProduct(product)}
                        >
                          Restore Available
                        </Button>
                      )}
                    </div>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState
            icon={<CheckCircle2 className="w-7 h-7 text-emerald-500" />}
            title="No Out of Stock Alerts"
            description="All catalog products are currently marked Available."
            action={
              <Link to="/products">
                <Button size="sm" icon={<Package className="w-3.5 h-3.5" />}>
                  View Products Catalog
                </Button>
              </Link>
            }
          />
        )}
      </Card>

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
