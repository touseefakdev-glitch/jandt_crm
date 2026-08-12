import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  itemLabel?: string;
  className?: string;
}

export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  pageSize,
  onPageChange,
  itemLabel = 'items',
  className,
}) => {
  const from = totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const to = Math.min(currentPage * pageSize, totalItems);

  const pageNumbers: number[] = [];
  const maxShown = 5;
  let start = Math.max(1, currentPage - Math.floor(maxShown / 2));
  const end = Math.min(totalPages, start + maxShown - 1);
  start = Math.max(1, end - maxShown + 1);
  for (let p = start; p <= end; p++) pageNumbers.push(p);

  return (
    <div className={cn('px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600', className)}>
      <div>
        Showing <span className="font-semibold text-slate-900">{from}</span> to <span className="font-semibold text-slate-900">{to}</span> of{' '}
        <span className="font-semibold text-slate-900">{totalItems}</span> {itemLabel}
      </div>
      <div className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage === 1}
          onClick={() => onPageChange(currentPage - 1)}
          className="px-2"
          icon={<ChevronLeft className="w-4 h-4" />}
          aria-label="Previous page"
        />
        {pageNumbers.map((p) => (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={cn(
              'min-w-[2rem] h-8 px-2 rounded-lg text-xs font-semibold transition-all',
              p === currentPage ? 'bg-gradient-teal-primary text-white shadow-glow-teal' : 'text-slate-600 hover:bg-white hover:border hover:border-slate-300'
            )}
          >
            {p}
          </button>
        ))}
        <Button
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => onPageChange(currentPage + 1)}
          className="px-2"
          icon={<ChevronRight className="w-4 h-4" />}
          aria-label="Next page"
        />
      </div>
    </div>
  );
};
