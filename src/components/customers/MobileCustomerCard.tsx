import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '../../types';
import { getCustomerStatusBadge } from '../../utils/badges';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Phone, MapPin, ChevronRight, MessageSquare, Edit } from 'lucide-react';
import { Button } from '../ui/Button';

interface MobileCustomerCardProps {
  customer: Customer;
  onEdit?: (customer: Customer) => void;
}

export const MobileCustomerCard: React.FC<MobileCustomerCardProps> = ({ customer, onEdit }) => {
  const navigate = useNavigate();

  const cleanPhone = (p?: string | null) => p ? p.replace(/[^0-9+]/g, '') : '';

  return (
    <div
      onClick={() => navigate(`/customers/${customer.id}`)}
      className="crm-card p-4 transition-all active:scale-[0.99] hover:border-teal-400 cursor-pointer relative space-y-3"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={customer.company_name} size="md" className="shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-extrabold text-[#132A4A] leading-snug truncate">{customer.company_name}</h3>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="font-mono text-[10px] text-teal-700 font-bold bg-teal-50 px-1.5 py-0.2 rounded border border-teal-200">{customer.customer_code}</span>
              {customer.contact_person && (
                <span className="text-[11px] text-[#52606D] truncate">({customer.contact_person})</span>
              )}
            </div>
          </div>
        </div>
        <Badge badge={getCustomerStatusBadge(customer.status)} />
      </div>

      <div className="bg-[#F4F7FB] p-2.5 rounded-lg border border-[#DCE4EF] text-xs space-y-1.5">
        {customer.city && (
          <p className="flex items-center gap-1.5 text-[#132A4A] font-semibold truncate">
            <MapPin className="w-3.5 h-3.5 text-[#7B8CA4] shrink-0" />
            <span>{customer.city}</span>
            {customer.route && <span className="font-bold text-navy-800">• Route: {customer.route}</span>}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-[#E9EFF5]">
          {customer.phone && (
            <a
              href={`tel:${cleanPhone(customer.phone)}`}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white text-teal-700 rounded-btn border border-[#DCE4EF] font-mono text-xs font-bold hover:bg-teal-50 transition-colors min-h-[36px]"
            >
              <Phone className="w-3.5 h-3.5 text-teal-600" />
              <span>📞 {customer.phone}</span>
            </a>
          )}

          {customer.whatsapp_number && (
            <a
              href={`https://wa.me/${cleanPhone(customer.whatsapp_number)}`}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-btn border border-emerald-200 font-mono text-xs font-bold hover:bg-emerald-100 transition-colors min-h-[36px]"
            >
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>💬 WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#E9EFF5]">
        <Button
          size="sm"
          variant="outline"
          onClick={(e) => {
            e.stopPropagation();
            navigate(`/customers/${customer.id}`);
          }}
          icon={<ChevronRight className="w-4 h-4" />}
          className="min-h-[40px] flex-1"
        >
          View Profile
        </Button>

        {onEdit && (
          <Button
            size="sm"
            variant="ghost"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(customer);
            }}
            icon={<Edit className="w-4 h-4" />}
            className="min-h-[40px] ml-2 px-3"
            title="Edit Customer"
          />
        )}
      </div>
    </div>
  );
};
