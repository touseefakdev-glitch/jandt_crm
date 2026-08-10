import React from 'react';
import { cn } from '../../utils/cn';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement> & { wrapperClassName?: string }> = ({
  className,
  wrapperClassName,
  children,
  ...props
}) => (
  <div className={cn('overflow-x-auto border-t border-[#D9E2EC]', wrapperClassName)}>
    <table className={cn('w-full text-left text-sm text-[#172B4D]', className)} {...props}>
      {children}
    </table>
  </div>
);

export const THead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn('bg-[#F5F7FA] border-b border-[#D9E2EC]', className)} {...props} />
);

export const TBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={cn('divide-y divide-[#E9EFF5]', className)} {...props} />
);

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement> & { hover?: boolean }> = ({ className, hover = true, ...props }) => (
  <tr className={cn(hover && 'hover:bg-[#F5F7FA] transition-colors', className)} {...props} />
);

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={cn('px-4 py-3 text-left text-[11px] font-bold uppercase tracking-wider text-[#52606D] whitespace-nowrap select-none', className)} {...props} />
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn('px-4 py-3 text-sm text-[#172B4D] align-middle whitespace-nowrap', className)} {...props} />
);
