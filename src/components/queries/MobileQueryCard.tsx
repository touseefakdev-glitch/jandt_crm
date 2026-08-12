import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { CustomerQuery } from '../../types';
import { getQueryPriorityBadge, getQueryStatusBadge } from '../../utils/badges';
import { formatDateTime } from '../../utils/format';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { HelpCircle, ChevronRight, ShoppingBag, Package, User } from 'lucide-react';

interface MobileQueryCardProps {
  query: CustomerQuery;
}

export const MobileQueryCard: React.FC<MobileQueryCardProps> = ({ query }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/queries/${query.id}`)}
      className="crm-card p-4 transition-all active:scale-[0.99] hover:border-teal-400 cursor-pointer relative"
    >
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="font-mono text-xs font-bold text-teal-700 bg-teal-50 px-2 py-0.5 rounded-md border border-teal-200">
          {query.query_number}
        </span>
        <div className="flex items-center gap-1.5">
          <Badge badge={getQueryPriorityBadge(query.priority)} />
          <Badge badge={getQueryStatusBadge(query.status)} />
        </div>
      </div>

      <div className="mb-2">
        <h3 className="text-sm font-bold text-[#132A4A] leading-snug line-clamp-2">{query.subject}</h3>
        {query.customer && (
          <p className="text-xs font-semibold text-[#52606D] mt-1 truncate">
            {query.customer.company_name} <span className="font-mono text-[10px] text-[#7B8CA4]">({query.customer.customer_code})</span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-3">
        {query.category && (
          <span className="text-[10px] bg-slate-100 text-slate-600 font-medium px-1.5 py-0.5 rounded border border-slate-200 truncate">
            {query.category.name}
          </span>
        )}
        {query.order && (
          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono font-semibold px-1.5 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5 truncate">
            <ShoppingBag className="w-2.5 h-2.5" /> {query.order.order_number}
          </span>
        )}
        {query.product && (
          <span className="text-[10px] bg-purple-50 text-purple-800 font-mono font-semibold px-1.5 py-0.5 rounded border border-purple-200 flex items-center gap-0.5 truncate">
            <Package className="w-2.5 h-2.5" /> {query.product.sku}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#E9EFF5] text-xs">
        <span className="text-[11px] text-[#52606D] flex items-center gap-1 truncate">
          <User className="w-3 h-3 text-[#7B8CA4]" />
          {query.assigned_to_profile?.full_name || 'Unassigned'}
        </span>
        <span className="text-xs font-bold text-teal-600 flex items-center gap-0.5 shrink-0">
          View <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};
