import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Product, ProductAvailabilityStatus, ProductFormInput } from '../types';
import { localDb } from '../services/db';
import { ProductFormModal } from '../components/products/ProductFormModal';
import { ProductAvailabilityModal } from '../components/products/ProductAvailabilityModal';
import { Badge, Button, Card, EmptyState, Input, PageHeader, Pagination, Select, Table, Tabs, TBody, Td, Th, THead, Tr, useToast } from '../components/ui';
import { getProductAvailabilityBadge } from '../utils/badges';
import { formatCurrency, formatDate } from '../utils/format';
import { Package, Search, Plus, Edit, RotateCcw, X, AlertTriangle, ArrowRight } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

type ProductsTab = 'all' | 'out_of_stock' | 'discontinued';

export const Products: React.FC = () => {
  const { user, hasRole, dbVersion } = useAuth();
  const { toast } = useToast();

  const isAdmin = hasRole('admin');

  const [activeTab, setActiveTab] = useState<ProductsTab>('all');

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [brandFilter, setBrandFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('active');
  const [currentPage, setCurrentPage] = useState(1);

  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);

  const [availabilityModalProduct, setAvailabilityModalProduct] = useState<Product | null>(null);
  const [availabilityTargetStatus, setAvailabilityTargetStatus] = useState<ProductAvailabilityStatus | null>(null);

  const categories = useMemo(() => localDb.getProductCategories(), [dbVersion]);
  const brands = useMemo(() => localDb.getProductBrands(), [dbVersion]);

  const allProductsCount = useMemo(() => localDb.getProducts().length, [dbVersion]);
  const outOfStockCount = useMemo(() => localDb.getOutOfStockProducts().length, [dbVersion]);
  const discontinuedCount = useMemo(() => localDb.getProducts({ availability_status: 'discontinued' }).length, [dbVersion]);

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
  }, [searchTerm, statusFilter, categoryFilter, brandFilter, activeFilter, activeTab, dbVersion]);

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
          toast({ type: 'success', title: 'Product updated', message: `Product ${updated.sku} updated successfully.` });
        }
      } else {
        const created = localDb.createProduct(data, user.id);
        toast({ type: 'success', title: 'Product created', message: `Product ${created.sku} created successfully.` });
      }
      setIsFormModalOpen(false);
    } catch (err: any) {
      toast({ type: 'error', title: 'Save failed', message: err.message || 'Error saving product.' });
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
        toast({ type: 'success', title: 'Availability updated', message: msg });
      }
    } catch (err: any) {
      toast({ type: 'error', title: 'Update failed', message: err.message || 'Error updating availability.' });
    }

    setAvailabilityModalProduct(null);
    setAvailabilityTargetStatus(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<Package className="w-5 h-5 text-brand-400" />}
        title="Product Catalog & Availability"
        description="Track item availability status and resupply schedules across product line"
        actions={
          isAdmin ? (
            <Button
              onClick={() => {
                setProductToEdit(null);
                setIsFormModalOpen(true);
              }}
              icon={<Plus className="w-4 h-4" />}
            >
              New Catalog Product
            </Button>
          ) : undefined
        }
      />

      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <Tabs
            size="md"
            tabs={[
              { value: 'all' as const, label: 'All Catalog Products', count: allProductsCount },
              { value: 'out_of_stock' as const, label: (<span className="flex items-center gap-1.5"><AlertTriangle className="w-3.5 h-3.5" /> Out of Stock</span>), count: outOfStockCount },
              { value: 'discontinued' as const, label: 'Discontinued', count: discontinuedCount },
            ]}
            active={activeTab}
            onChange={(value) => {
              setActiveTab(value);
              setCurrentPage(1);
            }}
          />

          {hasActiveFilters && (
            <button onClick={handleClearFilters} className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline">
              <X className="w-3.5 h-3.5" />
              Clear All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              placeholder="Search SKU, Product Name, Brand, Category..."
              icon={<Search className="w-4 h-4 text-slate-400" />}
              className="pl-9"
            />
          </div>
          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Select
            value={brandFilter}
            onChange={(e) => {
              setBrandFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Availability Statuses</option>
            <option value="available">Available</option>
            <option value="out_of_stock">Out of Stock</option>
            <option value="discontinued">Discontinued</option>
          </Select>
          <Select
            value={activeFilter}
            onChange={(e) => {
              setActiveFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="active">Active Products</option>
            <option value="inactive">Inactive Products</option>
            <option value="all">All Catalog Statuses</option>
          </Select>
        </div>
      </Card>

      <Card className="overflow-hidden">
        {paginatedProducts.length > 0 ? (
          <Table>
            <THead>
              <Tr hover={false}>
                <Th>SKU</Th>
                <Th>Product Name</Th>
                <Th>Category</Th>
                <Th>Brand</Th>
                <Th className="font-mono">Unit Price</Th>
                <Th>Availability Status</Th>
                <Th>Expected Date</Th>
                <Th className="text-right">Actions</Th>
              </Tr>
            </THead>
            <TBody>
              {paginatedProducts.map((product) => (
                <Tr key={product.id}>
                  <Td className="font-mono font-bold text-brand-700">
                    <Link to={`/products/${product.id}`} className="hover:underline">{product.sku}</Link>
                  </Td>
                  <Td className="font-bold text-slate-900 max-w-xs">
                    <Link to={`/products/${product.id}`} className="hover:text-brand-600">{product.product_name}</Link>
                  </Td>
                  <Td className="text-slate-600">{product.category?.name || 'Unassigned'}</Td>
                  <Td className="text-slate-600">{product.brand?.name || 'Unassigned'}</Td>
                  <Td className="font-mono font-extrabold text-slate-900">{formatCurrency(product.unit_price)}</Td>
                  <Td><Badge badge={getProductAvailabilityBadge(product.availability_status)} /></Td>
                  <Td className="font-mono text-slate-500">
                    {product.expected_available_date ? (
                      formatDate(product.expected_available_date)
                    ) : (
                      <span className="text-slate-400 italic">—</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/products/${product.id}`}
                        title="View Product Profile & History"
                        className="p-1.5 text-slate-600 hover:text-brand-600 hover:bg-brand-50 rounded-lg transition-colors"
                      >
                        <ArrowRight className="w-4 h-4" />
                      </Link>
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
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState
            icon={<Package className="w-7 h-7" />}
            title="No Catalog Products Found"
            description={
              hasActiveFilters
                ? 'No catalog products matched your search term or active category/availability filters.'
                : 'There are currently no catalog products registered in the database.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear Search & Filters
                </Button>
              ) : (
                isAdmin ? (
                  <Button
                    size="sm"
                    icon={<Plus className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setProductToEdit(null);
                      setIsFormModalOpen(true);
                    }}
                  >
                    Create First Product
                  </Button>
                ) : undefined
              )
            }
          />
        )}

        {filteredProducts.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredProducts.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="products"
          />
        )}
      </Card>

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
