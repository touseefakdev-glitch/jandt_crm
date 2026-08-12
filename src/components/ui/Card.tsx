import React from 'react';
import { cn } from '../../utils/cn';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Layer 2 elevation (deeper shadow) for emphasized content. */
  elevated?: boolean;
  /** Hover lift for interactive cards. */
  hoverable?: boolean;
  /** Remove padding so tables can span edge-to-edge. */
  flush?: boolean;
}

export const Card: React.FC<CardProps> = ({ className, elevated, hoverable, flush, ...props }) => (
  <div
    className={cn(
      elevated ? 'crm-card-elevated' : 'crm-card',
      hoverable && 'crm-card-hover',
      flush && 'overflow-hidden',
      className
    )}
    {...props}
  />
);

export const CardHeader: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { title?: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; icon?: React.ReactNode }
> = ({ title, subtitle, actions, icon, className, children, ...props }) => (
  <div className={cn('px-5 py-3.5 border-b border-[#DCE4EF] flex items-center justify-between gap-4 bg-gradient-to-b from-[#FBFCFE] to-white', className)} {...props}>
    <div className="flex items-center gap-2.5 min-w-0">
      {icon && <span className="text-teal-600 shrink-0">{icon}</span>}
      <div className="min-w-0">
        {title && <h3 className="crm-card-title">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-xs text-[#52606D]">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    {children}
  </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('p-5', className)} {...props} />
);
