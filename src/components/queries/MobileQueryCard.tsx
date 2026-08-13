import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CustomerQuery } from '../../types';
import { QUERY_ISSUE_CATEGORIES, QUERY_STATUS_CONFIG, QUERY_PRIORITY_CONFIG } from '../../utils/queryConstants';
import { formatDateShort } from '../../utils/dateUtils';
import { ChevronRight, User, ShoppingBag, Package } from 'lucide-react';

interface MobileQueryCardProps {
  query: CustomerQuery;
  onSelect?: () => void;
}

export const MobileQueryCard: React.FC<MobileQueryCardProps> = ({ query, onSelect }) => {
  const navigate = useNavigate();

  const categoryMeta = QUERY_ISSUE_CATEGORIES.find((c) => c.key === query.issue_type) || QUERY_ISSUE_CATEGORIES[5];
  const statusConf = QUERY_STATUS_CONFIG[query.status] || QUERY_STATUS_CONFIG.open;
  const priorityConf = QUERY_PRIORITY_CONFIG[query.priority] || QUERY_PRIORITY_CONFIG.medium;

  const handleClick = () => {
    if (onSelect) {
      onSelect();
    } else {
      navigate(`/queries/${query.id}`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs transition-all active:scale-[0.99] hover:border-brand-400 cursor-pointer space-y-2.5"
    >
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-xs font-extrabold text-brand-700 bg-brand-50 px-2 py-0.5 rounded border border-brand-200">
          {query.query_number}
        </span>
        <div className="flex items-center gap-1.5">
          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${priorityConf.badgeClass}`}>
            {priorityConf.label}
          </span>
          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border ${statusConf.badgeClass}`}>
            {statusConf.label}
          </span>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-extrabold text-slate-900 leading-snug line-clamp-2">{query.subject}</h3>
        {query.customer && (
          <p className="text-xs font-semibold text-slate-600 mt-0.5 truncate">
            {query.customer.company_name} <span className="font-mono text-[11px] text-slate-500 font-bold">({query.customer.customer_code})</span>
          </p>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-1.5">
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${categoryMeta.badgeClass}`}>
          {categoryMeta.shortLabel}
        </span>
        {query.order && (
          <span className="text-[10px] bg-emerald-50 text-emerald-800 font-mono font-semibold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-0.5">
            <ShoppingBag className="w-2.5 h-2.5" /> Order #{query.order.order_number}
          </span>
        )}
        {query.product && (
          <span className="text-[10px] bg-purple-50 text-purple-800 font-mono font-semibold px-2 py-0.5 rounded border border-purple-200 flex items-center gap-0.5">
            <Package className="w-2.5 h-2.5" /> {query.product.sku}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <span className="text-[11px] text-slate-500 flex items-center gap-1">
          <User className="w-3 h-3 text-slate-400" />
          {query.assigned_to_profile?.full_name || 'Unassigned'}
        </span>
        <span className="text-xs font-bold text-brand-600 flex items-center gap-0.5">
          View <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};
