import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface StatCardProps {
  title: string;
  value: React.ReactNode;
  description?: React.ReactNode;
  icon: React.ReactNode;
  accent?: 'teal' | 'green' | 'amber' | 'red' | 'navy' | 'brand' | 'emerald' | 'slate' | 'violet';
  to?: string;
  /** Optional trend indicator — positive/negative/flat value in %. */
  trend?: { value: number; label?: string; goodWhenUp?: boolean };
}

const accentStyles: Record<string, { icon: string; indicator: string; glow: string }> = {
  teal: { icon: 'bg-teal-50 text-teal-600', indicator: 'bg-gradient-to-r from-teal-400 to-teal-600', glow: 'from-teal-500/15' },
  green: { icon: 'bg-green-50 text-green-600', indicator: 'bg-gradient-to-r from-green-400 to-green-600', glow: 'from-green-500/15' },
  amber: { icon: 'bg-amber-50 text-amber-600', indicator: 'bg-gradient-to-r from-amber-400 to-amber-600', glow: 'from-amber-500/15' },
  red: { icon: 'bg-red-50 text-red-600', indicator: 'bg-gradient-to-r from-red-400 to-red-600', glow: 'from-red-500/15' },
  navy: { icon: 'bg-navy-50 text-navy-900', indicator: 'bg-gradient-to-r from-navy-800 to-navy-950', glow: 'from-navy-500/15' },
  brand: { icon: 'bg-teal-50 text-teal-600', indicator: 'bg-gradient-to-r from-teal-400 to-teal-600', glow: 'from-teal-500/15' },
  emerald: { icon: 'bg-green-50 text-green-600', indicator: 'bg-gradient-to-r from-green-400 to-green-600', glow: 'from-green-500/15' },
  slate: { icon: 'bg-[#E9EFF5] text-[#52606D]', indicator: 'bg-gradient-to-r from-[#9FB3C8] to-[#627D98]', glow: 'from-[#829AB1]/15' },
  violet: { icon: 'bg-purple-50 text-purple-700', indicator: 'bg-gradient-to-r from-purple-500 to-purple-700', glow: 'from-purple-500/15' },
};

const TrendIcon: React.FC<{ trend: NonNullable<StatCardProps['trend']>; good: boolean }> = ({ trend, good }) => {
  if (trend.value > 0) return <TrendingUp className={cn('w-3.5 h-3.5', good ? 'text-emerald-600' : 'text-red-600')} />;
  if (trend.value < 0) return <TrendingDown className={cn('w-3.5 h-3.5', good ? 'text-emerald-600' : 'text-red-600')} />;
  return <Minus className="w-3.5 h-3.5 text-slate-400" />;
};

export const StatCard: React.FC<StatCardProps> = ({ title, value, description, icon, accent = 'teal', to, trend }) => {
  const styles = accentStyles[accent] || accentStyles.teal;
  const good = trend ? (trend.goodWhenUp ?? true) ? trend.value >= 0 : trend.value <= 0 : true;

  const inner = (
    <div className="group relative bg-white rounded-card border border-[#DCE4EF] shadow-card p-4 transition-all duration-150 hover:-translate-y-0.5 hover:shadow-lift overflow-hidden">
      {/* Subtle gradient glow accent */}
      <div className={cn('absolute -top-10 -right-10 w-28 h-28 bg-gradient-to-br to-transparent rounded-full opacity-50 group-hover:opacity-80 transition-opacity', styles.glow)} aria-hidden="true" />
      {/* Subtle indicator bar on top */}
      <div className={cn('absolute top-0 left-0 right-0 h-[3px]', styles.indicator)} />

      <div className="relative flex items-center justify-between gap-3 mb-2 pt-1">
        <span className="text-2xs font-bold uppercase tracking-wider text-[#52606D]">{title}</span>
        <span className={cn('w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0 ring-1 ring-inset ring-[#DCE4EF]/60 shadow-xs', styles.icon)}>{icon}</span>
      </div>

      <div className="relative flex items-baseline gap-2">
        <span className="text-[1.75rem] font-extrabold text-[#132A4A] tracking-tight leading-none tabular-nums">{value}</span>
        {trend && (
          <span className={cn('inline-flex items-center gap-0.5 text-[11px] font-bold rounded-full px-1.5 py-0.5', good ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600')}>
            <TrendIcon trend={trend} good={good} />
            {Math.abs(trend.value)}%
          </span>
        )}
      </div>
      {description && <div className="relative text-xs text-[#52606D] mt-2 leading-snug font-medium">{description}</div>}
      {trend?.label && !description && <div className="relative text-[11px] text-[#7B8CA4] mt-2 font-medium">{trend.label}</div>}
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
