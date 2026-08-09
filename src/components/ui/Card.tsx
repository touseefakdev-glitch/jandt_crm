import React from 'react';
import { cn } from '../../utils/cn';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('bg-white rounded-xl border border-slate-200 shadow-card', className)} {...props} />
);

export const CardHeader: React.FC<
  React.HTMLAttributes<HTMLDivElement> & { title?: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode; icon?: React.ReactNode }
> = ({ title, subtitle, actions, icon, className, children, ...props }) => (
  <div className={cn('px-5 py-4 border-b border-slate-200 flex items-center justify-between gap-4', className)} {...props}>
    <div className="flex items-center gap-2.5 min-w-0">
      {icon && <span className="text-brand-600 shrink-0">{icon}</span>}
      <div className="min-w-0">
        {title && <h3 className="text-sm font-bold text-slate-900 tracking-tight">{title}</h3>}
        {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    {children}
  </div>
);

export const CardBody: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => (
  <div className={cn('p-5', className)} {...props} />
);
