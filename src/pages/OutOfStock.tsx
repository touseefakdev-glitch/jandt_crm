import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Product, ProductAvailabilityStatus } from '../types';
import { localDb } from '../services/db';
import { fetchOutOfStockPage, fetchProductTabCounts, ProductTabCounts } from '../services/queryService';
import { useDebouncedValue } from '../hooks/useDebouncedValue';
import { useServerListQuery } from '../hooks/useServerListQuery';
import { useServerQuery } from '../hooks/useServerQuery';
import { ProductAvailabilityModal } from '../components/products/ProductAvailabilityModal';
import { MobileOutOfStockCard } from '../components/products/MobileOutOfStockCard';
import { Badge, Button, Card, EmptyState, Input, Pagination, Table, TableToolbar, TBody, Td, Th, THead, Tr, useToast } from '../components/ui';
import { getProductAvailabilityBadge } from '../utils/badges';
import { formatDate } from '../utils/format';
import { AlertTriangle, Search, RotateCcw, Calendar, Package, CheckCircle2, ArrowRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const OutOfStock: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { toast } = useToast();

  const isAdmin = hasRole('admin');

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [availabilityModalProduct, setAvailabilityModalProduct] = useState<Product | null>(null);

  const debouncedSearch = useDebouncedValue(searchTerm, 300);

  const { data: tabCounts } = useServerQuery<ProductTabCounts>({
    key: JSON.stringify({ nc: 'out-of-stock-counts' }),
    fetcher: fetchProductTabCounts,
    localFallback: () => {
      const all = localDb.getProducts();
      return {
        all: all.length,
        outOfStock: all.filter((p) => p.availability_status === 'out_of_stock').length,
        discontinued: all.filter((p) => p.availability_status === 'discontinued').length,
      };
    },
  });

  const {
    data: outOfStockProducts,
    total: outOfStockTotal,
    loading: productsLoading,
  } = useServerListQuery<Product>({
    key: JSON.stringify({ search: debouncedSearch, page: currentPage }),
    fetcher: () => fetchOutOfStockPage({ searchTerm: debouncedSearch, page: currentPage }),
    localFallback: () => {
      let list = localDb.getOutOfStockProducts();
      if (debouncedSearch.trim()) {
        const qStr = debouncedSearch.toLowerCase().trim();
        list = list.filter((p) =>
          p.sku.toLowerCase().includes(qStr) ||
          p.product_name.toLowerCase().includes(qStr) ||
          (p.category && p.category.name.toLowerCase().includes(qStr)) ||
          (p.brand && p.brand.name.toLowerCase().includes(qStr)) ||
          (p.availability_notes && p.availability_notes.toLowerCase().includes(qStr))
        );
      }
      const start = (currentPage - 1) * ITEMS_PER_PAGE;
      return { data: list.slice(start, start + ITEMS_PER_PAGE), total: list.length };
    },
  });

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
          <span className="text-base bg-white text-red-700 px-2.5 py-0.5 rounded-md">{tabCounts?.outOfStock ?? outOfStockTotal} Items</span>
        </div>
      </div>

      <TableToolbar>
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative flex-1 max-w-xl">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search unavailable SKU, Name, Reason..."
              icon={<Search className="w-4 h-4 text-slate-400" />}
              className="pl-9"
            />
            {productsLoading && (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-slate-400 animate-pulse">
                Loading…
              </span>
            )}
          </div>

          <Link
            to="/products"
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline inline-flex items-center shrink-0"
          >
            <span>View Full Products Catalog</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>
      </TableToolbar>

      <Card flush className="p-3 md:p-0">
        {outOfStockProducts.length > 0 ? (
          <>
            {/* Mobile View Cards */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {outOfStockProducts.map((product) => (
                <MobileOutOfStockCard
                  key={product.id}
                  product={product}
                  isAdmin={isAdmin}
                  onRestore={(p) => setAvailabilityModalProduct(p)}
                />
              ))}
            </div>

            {/* Desktop View Table */}
            <div className="hidden md:block">
              <Table minWidth={1330}>
                <THead>
                  <Tr hover={false}>
                    <Th width={140}>SKU</Th>
                    <Th width={280}>Product Name</Th>
                    <Th width={160}>Category</Th>
                    <Th width={150}>Availability Status</Th>
                    <Th width={260}>Unavailability Reason</Th>
                    <Th width={170}>Expected Available Date</Th>
                    <Th width={170} align="right">Actions</Th>
                  </Tr>
                </THead>
                <TBody>
                  {outOfStockProducts.map((product) => (
                    <Tr key={product.id}>
                      <Td width={140} className="font-mono font-bold text-brand-700">
                        <Link to={`/products/${product.id}`} className="hover:underline">{product.sku}</Link>
                      </Td>
                      <Td width={280} truncate className="font-bold text-slate-900">
                        <Link to={`/products/${product.id}`} className="hover:text-brand-600">{product.product_name}</Link>
                      </Td>
                      <Td width={160} truncate className="text-slate-600">{product.category?.name || 'General'}</Td>
                      <Td width={150}><Badge badge={getProductAvailabilityBadge(product.availability_status)} /></Td>
                      <Td width={260} truncate maxWidth={260} className="font-medium text-red-900">
                        {product.availability_notes || <span className="text-slate-400 italic">No notes logged</span>}
                      </Td>
                      <Td width={170} className="font-mono font-semibold text-slate-700">
                        {product.expected_available_date ? (
                          <span className="inline-flex items-center gap-1 text-slate-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
                            <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            <span>{formatDate(product.expected_available_date)}</span>
                          </span>
                        ) : (
                          <span className="text-slate-400 italic">Unknown</span>
                        )}
                      </Td>
                      <Td width={170} align="right">
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
            </div>
          </>
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

        {outOfStockTotal > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(outOfStockTotal / ITEMS_PER_PAGE) || 1}
            totalItems={outOfStockTotal}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="products"
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
