import React from 'react';
import { cn } from '../../utils/cn';
import { Table, THead, TBody, Tr, Th, Td } from './Table';
import { SkeletonTable } from './Skeleton';
import { EmptyState } from './EmptyState';

export interface DataTableColumn<T> {
  key: string;
  header: React.ReactNode;
  /** Fixed column width in px — prevents content-based column drift. */
  width?: number;
  align?: 'left' | 'center' | 'right';
  truncate?: boolean;
  maxWidth?: number;
  className?: string;
  render?: (row: T, index: number) => React.ReactNode;
}

export interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: React.ReactNode;
  emptyIcon?: React.ReactNode;
  emptyAction?: React.ReactNode;
  stickyHeader?: boolean;
  minWidth?: number;
  className?: string;
  wrapperClassName?: string;
}

/**
 * Enterprise data table driven by column definitions. Every CRM table
 * can use this for consistent widths, alignment, truncation and states.
 */
export const DataTable = <T,>({
  columns,
  rows,
  rowKey,
  loading,
  emptyTitle = 'No records found',
  emptyDescription,
  emptyIcon,
  emptyAction,
  stickyHeader,
  minWidth,
  className,
  wrapperClassName,
}: DataTableProps<T>): React.ReactElement => {
  if (loading) {
    return <SkeletonTable rows={6} cols={columns.length} className={wrapperClassName} />;
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={emptyIcon}
        title={emptyTitle}
        description={emptyDescription}
        action={emptyAction}
        className={wrapperClassName}
      />
    );
  }

  return (
    <Table stickyHeader={stickyHeader} minWidth={minWidth} wrapperClassName={wrapperClassName} className={className}>
      <THead>
        <Tr hover={false}>
          {columns.map((col) => (
            <Th
              key={col.key}
              width={col.width}
              align={col.align}
              className={cn(col.align === 'right' && 'text-right', col.align === 'center' && 'text-center', col.className)}
            >
              {col.header}
            </Th>
          ))}
        </Tr>
      </THead>
      <TBody>
        {rows.map((row, index) => (
          <Tr key={rowKey(row)}>
            {columns.map((col) => (
              <Td
                key={col.key}
                width={col.width}
                align={col.align}
                truncate={col.truncate}
                maxWidth={col.maxWidth}
                className={cn(col.align === 'right' && 'text-right', col.align === 'center' && 'text-center', col.className)}
              >
                {col.render ? col.render(row, index) : (row as Record<string, unknown>)[col.key] as React.ReactNode}
              </Td>
            ))}
          </Tr>
        ))}
      </TBody>
    </Table>
  );
};
