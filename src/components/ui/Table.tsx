import React from 'react';
import { cn } from '../../utils/cn';

/* ============================================================
   Enterprise Table System — the single base table used across
   the entire CRM. Guarantees:
     • vertical-align middle on every cell
     • consistent padding
     • controlled column widths (no random content-based sizing)
     • safe truncation for long text (no visual collision)
     • optional sticky header for large datasets
     • horizontal scroll confined to the table wrapper
   ============================================================ */

export interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
  wrapperClassName?: string;
  stickyHeader?: boolean;
  minWidth?: number;
}

export const Table: React.FC<TableProps> = ({ className, wrapperClassName, stickyHeader, minWidth, children, ...props }) => (
  <div className={cn('crm-table-scroll', wrapperClassName)}>
    <table
      style={minWidth ? { minWidth } : undefined}
      className={cn(
        'w-full text-left text-sm text-[#172B4D] border-separate border-spacing-0',
        stickyHeader && 'sticky-table-head',
        className
      )}
      {...props}
    >
      {children}
    </table>
  </div>
);

export const THead: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <thead className={cn('bg-[#F5F7FA]', className)} {...props} />
);

export const TBody: React.FC<React.HTMLAttributes<HTMLTableSectionElement>> = ({ className, ...props }) => (
  <tbody className={className} {...props} />
);

export const Tr: React.FC<React.HTMLAttributes<HTMLTableRowElement> & { hover?: boolean }> = ({ className, hover = true, ...props }) => (
  <tr className={cn(hover && 'hover:bg-[#F5F7FA] transition-colors', className)} {...props} />
);

export interface ThProps extends React.ThHTMLAttributes<HTMLTableCellElement> {
  /** Fixed column width in px. Prevents content-based column drift. */
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export const Th: React.FC<ThProps> = ({ className, width, align, style, ...props }) => (
  <th
    className={cn('crm-table-th', align === 'right' && 'text-right', align === 'center' && 'text-center', className)}
    style={{ width, minWidth: width, ...style }}
    {...props}
  />
);

export interface TdProps extends React.TdHTMLAttributes<HTMLTableCellElement> {
  /** Fixed column width in px. */
  width?: number;
  /** Truncate long content with ellipsis instead of overflowing. */
  truncate?: boolean;
  /** Maximum width for truncated content. Falls back to `width`. */
  maxWidth?: number;
  align?: 'left' | 'center' | 'right';
}

const extractText = (node: React.ReactNode): string => {
  if (typeof node === 'string' || typeof node === 'number') return String(node);
  if (Array.isArray(node)) return node.map(extractText).join(' ');
  if (React.isValidElement(node)) {
    const props = (node as React.ReactElement<{ children?: React.ReactNode }>).props;
    return extractText(props.children);
  }
  return '';
};

export const Td: React.FC<TdProps> = ({ className, width, truncate, maxWidth, align, style, children, title, ...props }) => {
  const effectiveMax = truncate ? maxWidth ?? width ?? 240 : undefined;
  const autoTitle = truncate && title === undefined ? extractText(children) : title;

  return (
    <td
      className={cn('crm-table-td', truncate && 'overflow-hidden', align === 'right' && 'text-right', align === 'center' && 'text-center', className)}
      style={{ width, minWidth: width, maxWidth: effectiveMax, ...style }}
      {...props}
    >
      {truncate ? (
        <div className="truncate" style={{ maxWidth: effectiveMax }} title={autoTitle}>
          {children}
        </div>
      ) : (
        children
      )}
    </td>
  );
};
