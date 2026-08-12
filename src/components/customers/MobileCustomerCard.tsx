import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Customer } from '../../types';
import { getCustomerStatusBadge } from '../../utils/badges';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import { Phone, MapPin, ChevronRight, Building2 } from 'lucide-react';

interface MobileCustomerCardProps {
  customer: Customer;
  onEdit?: (customer: Customer) => void;
}

export const MobileCustomerCard: React.FC<MobileCustomerCardProps> = ({ customer, onEdit }) => {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/customers/${customer.id}`)}
      className="crm-card p-4 transition-all active:scale-[0.99] hover:border-teal-400 cursor-pointer relative"
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <Avatar name={customer.company_name} size="md" className="shrink-0" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#132A4A] leading-snug truncate">{customer.company_name}</h3>
            <span className="font-mono text-[10px] text-teal-700 font-bold block">{customer.customer_code}</span>
          </div>
        </div>
        <Badge badge={getCustomerStatusBadge(customer.status)} />
      </div>

      <div className="space-y-1 my-3 text-xs text-[#52606D]">
        {customer.city && (
          <p className="flex items-center gap-1.5 truncate">
            <MapPin className="w-3.5 h-3.5 text-[#7B8CA4] shrink-0" />
            <span>{customer.city}</span>
            {customer.route && <span className="font-semibold text-navy-800">• {customer.route}</span>}
          </p>
        )}

        {customer.phone && (
          <p className="flex items-center gap-1.5 truncate">
            <Phone className="w-3.5 h-3.5 text-[#7B8CA4] shrink-0" />
            <a
              href={`tel:${customer.phone}`}
              onClick={(e) => e.stopPropagation()}
              className="text-teal-700 hover:underline font-mono font-medium"
            >
              {customer.phone}
            </a>
          </p>
        )}
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-[#E9EFF5] text-xs">
        <span className="text-[10px] text-[#7B8CA4] font-medium uppercase tracking-wider">
          {customer.contact_person ? `Contact: ${customer.contact_person}` : 'No contact specified'}
        </span>
        <span className="text-xs font-bold text-teal-600 flex items-center gap-0.5 shrink-0">
          View Profile <ChevronRight className="w-4 h-4" />
        </span>
      </div>
    </div>
  );
};
