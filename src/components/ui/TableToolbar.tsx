import React from 'react';
import { cn } from '../../utils/cn';

export interface TableToolbarProps {
  /** Search + filter controls. */
  children: React.ReactNode;
  /** Extra actions rendered on the right (export, clear filters...). */
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Standardized filter/search bar wrapper used above data tables.
 * Keeps toolbar height, padding and border consistent across pages.
 */
export const TableToolbar: React.FC<TableToolbarProps> = ({ children, actions, className }) => (
  <div className={cn('crm-toolbar', className)}>
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      {children && <div className="flex-1 min-w-0">{children}</div>}
      {actions && <div className="flex items-center gap-2 shrink-0 flex-wrap">{actions}</div>}
    </div>
  </div>
);
