import React from 'react';
import { cn } from '../../utils/cn';
import { BadgeStyle } from '../../utils/badges';

export interface BadgeProps {
  badge: BadgeStyle;
  variant?: 'subtle' | 'solid';
  dot?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ badge, variant = 'subtle', dot, className }) => (
  <span
    className={cn(
      'inline-flex items-center gap-1.5 rounded-pill px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset shadow-xs whitespace-nowrap',
      variant === 'subtle' ? badge.subtle : badge.solid,
      className
    )}
  >
    {dot && <span className={cn('w-1.5 h-1.5 rounded-full', badge.dot)} />}
    {badge.label}
  </span>
);

export const Pill: React.FC<{ className?: string; children: React.ReactNode }> = ({ className, children }) => (
  <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium bg-slate-100 text-slate-700', className)}>
    {children}
  </span>
);
