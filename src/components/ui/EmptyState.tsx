import React from 'react';
import { cn } from '../../utils/cn';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon, title, description, action, className }) => (
  <div className={cn('p-12 text-center', className)}>
    {icon && (
      <div className="w-14 h-14 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center mx-auto mb-4">{icon}</div>
    )}
    <h3 className="text-base font-bold text-slate-800">{title}</h3>
    {description && <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1.5 leading-relaxed">{description}</p>}
    {action && <div className="mt-5 flex items-center justify-center gap-2">{action}</div>}
  </div>
);
