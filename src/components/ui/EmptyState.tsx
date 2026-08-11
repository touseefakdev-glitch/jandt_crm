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
  <div className={cn('p-12 text-center bg-white rounded-card border border-[#D9E2EC]', className)}>
    {icon && (
      <div className="w-12 h-12 bg-[#E9EFF5] text-[#52606D] rounded-[10px] flex items-center justify-center mx-auto mb-3 ring-1 ring-inset ring-[#D9E2EC]">
        {icon}
      </div>
    )}
    <h3 className="text-sm font-bold text-[#172B4D]">{title}</h3>
    {description && <p className="text-xs text-[#52606D] max-w-sm mx-auto mt-1 leading-relaxed font-medium">{description}</p>}
    {action && <div className="mt-4 flex items-center justify-center gap-2">{action}</div>}
  </div>
);
