import React from 'react';
import { BackOrderItem } from '../../types';
import { BACK_ORDER_STATUS_CONFIG } from '../../utils/queryConstants';
import { formatDate } from '../../utils/format';
import { Calendar, Package, ChevronRight } from 'lucide-react';
import { Button } from '../ui/Button';

interface MobileBackOrderCardProps {
  item: BackOrderItem;
  onUpdateStatus: (item: BackOrderItem) => void;
}

export const MobileBackOrderCard: React.FC<MobileBackOrderCardProps> = ({ item, onUpdateStatus }) => {
  const statusConf = BACK_ORDER_STATUS_CONFIG[item.status] || BACK_ORDER_STATUS_CONFIG.PENDING;

  return (
    <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2.5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-extrabold text-slate-900 truncate">
          {item.customer?.company_name || 'Customer'}
        </span>
        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border shrink-0 ${statusConf.badgeClass}`}>
          {statusConf.label}
        </span>
      </div>

      <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 space-y-1">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
          <Package className="w-3.5 h-3.5 text-brand-600 shrink-0" />
          <span className="truncate">{item.product_name_snapshot}</span>
          <span className="font-mono text-[11px] text-brand-700 bg-brand-50 px-1.5 py-0.2 rounded border border-brand-200 ml-auto shrink-0">
            Qty: {item.quantity}
          </span>
        </div>
        {item.reason && (
          <p className="text-xs text-slate-600 leading-snug line-clamp-2">
            Reason: {item.reason}
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-1 text-xs">
        <div className="flex items-center gap-1 text-slate-600 font-mono">
          <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
          <span>Next Deliv: {formatDate(item.next_delivery_date)}</span>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => onUpdateStatus(item)}
          icon={<ChevronRight className="w-3.5 h-3.5" />}
          className="min-h-[36px]"
        >
          Update Status
        </Button>
      </div>
    </div>
  );
};
