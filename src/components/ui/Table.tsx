import React from 'react';
import { cn } from '../../utils/cn';

export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement> & { wrapperClassName?: string }> = ({
  className,
  wrapperClassName,
  children,
  ...props
}) => (
  <div className={cn('overflow-x-auto', wrapperClassName)}>
    <table className={cn('w-full text-left text-sm text-slate-700', className)} {...props}>
      {children}
    </table>
  </div>
);

export const THead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn('text-[11px] uppercase font-semibold text-slate-500 bg-slate-50 border-b border-slate-200', className)} {...props} />
);

export const TBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={cn('divide-y divide-slate-200', className)} {...props} />
);

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement> & { hover?: boolean }> = ({ className, hover = true, ...props }) => (
  <tr className={cn(hover && 'hover:bg-slate-50/80 transition-colors', className)} {...props} />
);

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <th className={cn('px-5 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-slate-500 whitespace-nowrap', className)} {...props} />
);

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, ...props }) => (
  <td className={cn('px-5 py-3.5 text-sm text-slate-700 align-middle whitespace-nowrap', className)} {...props} />
);
