import React from 'react';
import { Link } from 'react-router-dom';
import { Product, ProductAvailabilityStatus } from '../../types';
import { getProductAvailabilityBadge } from '../../utils/badges';
import { formatCurrency, formatDate } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { ArrowRight, Edit, RotateCcw, Tag, Layers } from 'lucide-react';

interface MobileProductCardProps {
  product: Product;
  isAdmin: boolean;
  onEdit?: (product: Product) => void;
  onChangeAvailability?: (product: Product, targetStatus: ProductAvailabilityStatus) => void;
}

export const MobileProductCard: React.FC<MobileProductCardProps> = ({
  product,
  isAdmin,
  onEdit,
  onChangeAvailability,
}) => {
  const isOutOfStock = product.availability_status === 'out_of_stock';

  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
      {/* Top Header: SKU & Status */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200 shrink-0">
          {product.sku}
        </span>
        <Badge badge={getProductAvailabilityBadge(product.availability_status)} />
      </div>

      {/* Product Name & Details */}
      <div>
        <Link to={`/products/${product.id}`} className="font-bold text-sm text-slate-900 hover:text-brand-600 leading-snug line-clamp-2 block">
          {product.product_name}
        </Link>

        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <Layers className="w-3 h-3 text-slate-400" />
            {product.category?.name || 'Unassigned Category'}
          </span>
          <span className="flex items-center gap-1">
            <Tag className="w-3 h-3 text-slate-400" />
            {product.brand?.name || 'Unassigned Brand'}
          </span>
        </div>
      </div>

      {/* Price & Expected Date */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div>
          <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Unit Price</span>
          <span className="font-mono font-extrabold text-sm text-slate-900">{formatCurrency(product.unit_price)}</span>
        </div>

        {product.expected_available_date && (
          <div className="text-right">
            <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider block">Expected Date</span>
            <span className="font-mono text-xs text-amber-700 font-semibold">{formatDate(product.expected_available_date)}</span>
          </div>
        )}
      </div>

      {/* Touch Actions */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
        <Link to={`/products/${product.id}`} className="flex-1">
          <Button size="sm" variant="outline" fullWidth icon={<ArrowRight className="w-3.5 h-3.5" />} className="min-h-[40px]">
            View Details
          </Button>
        </Link>

        {isAdmin && onEdit && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(product)}
            icon={<Edit className="w-3.5 h-3.5" />}
            className="min-h-[40px] px-3"
            title="Edit details"
          />
        )}

        {isAdmin && onChangeAvailability && (
          <Button
            size="sm"
            variant={isOutOfStock ? 'success' : 'danger'}
            onClick={() => onChangeAvailability(product, isOutOfStock ? 'available' : 'out_of_stock')}
            icon={<RotateCcw className="w-3.5 h-3.5" />}
            className="min-h-[40px] px-3"
            title={isOutOfStock ? 'Restore Available' : 'Mark Out of Stock'}
          />
        )}
      </div>
    </div>
  );
};
