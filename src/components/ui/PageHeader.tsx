import React from 'react';
import { cn } from '../../utils/cn';

export interface PageHeaderProps {
  icon?: React.ReactNode;
  iconBg?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ icon, iconBg, title, description, badges, actions, className }) => (
  <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-card', className)}>
    <div className="flex items-center gap-3.5 min-w-0">
      {icon && (
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center shrink-0 shadow-sm', iconBg || 'bg-slate-900')}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight leading-tight">{title}</h1>
        {description && <p className="text-xs text-slate-500 mt-1">{description}</p>}
        {badges && <div className="flex flex-wrap items-center gap-1.5 mt-2">{badges}</div>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap">{actions}</div>}
  </div>
);
