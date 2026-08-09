import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon: React.ReactNode;
  accent?: 'brand' | 'emerald' | 'amber' | 'red' | 'slate' | 'violet';
  to?: string;
}

const accentStyles: Record<NonNullable<StatCardProps['accent']>, { icon: string; hover: string }> = {
  brand: { icon: 'bg-brand-50 text-brand-600', hover: 'group-hover:ring-brand-200' },
  emerald: { icon: 'bg-emerald-50 text-emerald-600', hover: 'group-hover:ring-emerald-200' },
  amber: { icon: 'bg-amber-50 text-amber-600', hover: 'group-hover:ring-amber-200' },
  red: { icon: 'bg-red-50 text-red-600', hover: 'group-hover:ring-red-200' },
  slate: { icon: 'bg-slate-100 text-slate-600', hover: 'group-hover:ring-slate-200' },
  violet: { icon: 'bg-violet-50 text-violet-600', hover: 'group-hover:ring-violet-200' },
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, accent = 'brand', to }) => {
  const styles = accentStyles[accent];
  const inner = (
    <div className={cn('group bg-white rounded-xl border border-slate-200 shadow-card p-5 transition-all duration-200 hover:shadow-card-hover hover:border-slate-300 hover:ring-2 hover:ring-offset-0', styles.hover)}>
      <div className="flex items-center justify-between gap-3 mb-3">
        <span className="text-xs font-semibold text-slate-600">{title}</span>
        <span className={cn('w-9 h-9 rounded-lg flex items-center justify-center shrink-0', styles.icon)}>{icon}</span>
      </div>
      <div className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">{value}</div>
      {description && <p className="text-xs text-slate-500 mt-2 leading-snug">{description}</p>}
    </div>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {inner}
      </Link>
    );
  }
  return inner;
};
