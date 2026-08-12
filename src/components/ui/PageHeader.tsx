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
  <div className={cn('flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-card border border-[#DCE4EF] shadow-card relative overflow-hidden', className)}>
    <div className="absolute -right-12 -top-12 w-40 h-40 bg-gradient-to-br from-teal-500/8 to-transparent rounded-full pointer-events-none" aria-hidden="true" />
    <div className="flex items-center gap-3.5 min-w-0 relative">
      {icon && (
        <div className={cn('w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 text-white shadow-xs', iconBg || 'bg-navy-900')}>
          {icon}
        </div>
      )}
      <div className="min-w-0">
        <h1 className="crm-page-title">{title}</h1>
        {description && <p className="text-xs text-[#52606D] mt-0.5 font-medium">{description}</p>}
        {badges && <div className="flex flex-wrap items-center gap-1.5 mt-2">{badges}</div>}
      </div>
    </div>
    {actions && <div className="flex items-center gap-2.5 shrink-0 flex-wrap relative">{actions}</div>}
  </div>
);
