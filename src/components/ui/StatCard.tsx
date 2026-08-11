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

const accentStyles: Record<string, { icon: string; indicator: string; glow: string }> = {
  teal: { icon: 'bg-teal-50 text-teal-600', indicator: 'bg-teal-500', glow: 'from-teal-500/20' },
  green: { icon: 'bg-green-50 text-green-600', indicator: 'bg-green-500', glow: 'from-green-500/20' },
  amber: { icon: 'bg-amber-50 text-amber-600', indicator: 'bg-amber-500', glow: 'from-amber-500/20' },
  red: { icon: 'bg-red-50 text-red-600', indicator: 'bg-red-500', glow: 'from-red-500/20' },
  navy: { icon: 'bg-navy-50 text-navy-900', indicator: 'bg-navy-900', glow: 'from-navy-500/20' },
  brand: { icon: 'bg-teal-50 text-teal-600', indicator: 'bg-teal-500', glow: 'from-teal-500/20' },
  emerald: { icon: 'bg-green-50 text-green-600', indicator: 'bg-green-500', glow: 'from-green-500/20' },
  slate: { icon: 'bg-[#E9EFF5] text-[#52606D]', indicator: 'bg-[#829AB1]', glow: 'from-[#829AB1]/20' },
  violet: { icon: 'bg-purple-50 text-purple-700', indicator: 'bg-purple-600', glow: 'from-purple-500/20' },
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, accent = 'teal', to }) => {
  const styles = accentStyles[accent] || accentStyles.teal;
  const inner = (
    <div className="group relative bg-white rounded-card border border-[#D9E2EC] shadow-card p-4 transition-all duration-150 hover:shadow-card-hover overflow-hidden">
      {/* Subtle gradient glow accent */}
      <div className={cn('absolute -top-8 -right-8 w-24 h-24 bg-gradient-to-br to-transparent rounded-full opacity-60', styles.glow)} aria-hidden="true" />
      {/* Subtle indicator bar on top */}
      <div className={cn('absolute top-0 left-0 right-0 h-[3px]', styles.indicator)} />

      <div className="relative flex items-center justify-between gap-3 mb-2 pt-1">
        <span className="text-2xs font-bold uppercase tracking-wider text-[#52606D]">{title}</span>
        <span className={cn('w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ring-1 ring-inset ring-[#D9E2EC]/60', styles.icon)}>{icon}</span>
      </div>

      <div className="relative text-2xl font-extrabold text-[#172B4D] tracking-tight leading-none tabular-nums">{value}</div>
      {description && <div className="relative text-xs text-[#52606D] mt-2 leading-snug font-medium">{description}</div>}
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
