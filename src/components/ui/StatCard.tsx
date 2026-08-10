import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon: React.ReactNode;
  accent?: 'teal' | 'green' | 'amber' | 'red' | 'navy' | 'brand' | 'emerald' | 'slate' | 'violet';
  to?: string;
}

const accentStyles: Record<string, { icon: string; indicator: string }> = {
  teal: { icon: 'bg-teal-50 text-teal-600', indicator: 'bg-teal-500' },
  green: { icon: 'bg-green-50 text-green-600', indicator: 'bg-green-500' },
  amber: { icon: 'bg-amber-50 text-amber-600', indicator: 'bg-amber-500' },
  red: { icon: 'bg-red-50 text-red-600', indicator: 'bg-red-500' },
  navy: { icon: 'bg-navy-50 text-navy-900', indicator: 'bg-navy-900' },
  brand: { icon: 'bg-teal-50 text-teal-600', indicator: 'bg-teal-500' },
  emerald: { icon: 'bg-green-50 text-green-600', indicator: 'bg-green-500' },
  slate: { icon: 'bg-[#E9EFF5] text-[#52606D]', indicator: 'bg-[#829AB1]' },
  violet: { icon: 'bg-purple-50 text-purple-700', indicator: 'bg-purple-600' },
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, accent = 'teal', to }) => {
  const styles = accentStyles[accent] || accentStyles.teal;
  const inner = (
    <div className="group bg-white rounded-[12px] border border-[#D9E2EC] shadow-card p-4 transition-all duration-150 hover:shadow-card-hover relative overflow-hidden">
      {/* Subtle indicator bar on top */}
      <div className={cn('absolute top-0 left-0 right-0 h-1', styles.indicator)} />
      
      <div className="flex items-center justify-between gap-3 mb-2 pt-1">
        <span className="text-xs font-bold uppercase tracking-wider text-[#52606D]">{title}</span>
        <span className={cn('w-8 h-8 rounded-[8px] flex items-center justify-center shrink-0 text-sm', styles.icon)}>{icon}</span>
      </div>
      
      <div className="text-2xl font-extrabold text-[#172B4D] tracking-tight leading-none">{value}</div>
      {description && <div className="text-xs text-[#52606D] mt-2 leading-snug font-medium">{description}</div>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block transition-transform active:scale-[0.99]">
        {inner}
      </Link>
    );
  }
  return inner;
};
