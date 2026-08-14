import React from 'react';
import { Link } from 'react-router-dom';
import { Product, ProductAvailabilityStatus } from '../../types';
import { getProductAvailabilityBadge } from '../../utils/badges';
import { formatDate } from '../../utils/format';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { AlertTriangle, ArrowRight, Calendar, RotateCcw } from 'lucide-react';

interface MobileOutOfStockCardProps {
  product: Product;
  isAdmin: boolean;
  onRestore: (product: Product) => void;
}

export const MobileOutOfStockCard: React.FC<MobileOutOfStockCardProps> = ({
  product,
  isAdmin,
  onRestore,
}) => {
  return (
    <div className="p-4 rounded-xl bg-white border border-red-200 shadow-xs space-y-3">
      {/* Top Header: SKU & Badge */}
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded border border-red-200 shrink-0">
          {product.sku}
        </span>
        <Badge badge={getProductAvailabilityBadge(product.availability_status)} />
      </div>

      {/* Product Name */}
      <div>
        <Link to={`/products/${product.id}`} className="font-extrabold text-sm text-slate-900 hover:text-brand-600 leading-snug line-clamp-2 block">
          {product.product_name}
        </Link>
        <p className="text-xs text-slate-500 mt-0.5">Category: {product.category?.name || 'General'}</p>
      </div>

      {/* Unavailability Notes */}
      <div className="p-2.5 bg-red-50/60 rounded-lg border border-red-100 text-xs text-red-900 leading-relaxed font-medium">
        <span className="font-bold flex items-center gap-1 mb-0.5">
          <AlertTriangle className="w-3.5 h-3.5 text-red-600 shrink-0" />
          Reason:
        </span>
        {product.availability_notes || <span className="italic text-slate-400">No notes logged</span>}
      </div>

      {/* Expected Date & Action */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1 font-mono text-slate-700">
          <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          {product.expected_available_date ? (
            <span className="font-bold text-amber-900">{formatDate(product.expected_available_date)}</span>
          ) : (
            <span className="text-slate-400 italic">Unknown Date</span>
          )}
        </div>

        <div className="flex items-center gap-1.5">
          <Link to={`/products/${product.id}`}>
            <Button size="sm" variant="ghost" icon={<ArrowRight className="w-4 h-4" />} className="min-h-[38px]" title="View History" />
          </Link>

          {isAdmin && (
            <Button
              size="sm"
              variant="success"
              icon={<RotateCcw className="w-3.5 h-3.5" />}
              onClick={() => onRestore(product)}
              className="min-h-[38px]"
            >
              Restore
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
