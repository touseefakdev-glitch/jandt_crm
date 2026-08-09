import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-lg bg-slate-200/70', className)} />
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => (
  <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
    <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-8 w-28" />
    </div>
    <div className="divide-y divide-slate-100">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-5 py-3.5 flex items-center gap-6">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-3.5', c === 0 ? 'w-24' : c === cols - 1 ? 'w-20' : 'w-32')} />
          ))}
        </div>
      ))}
    </div>
  </div>
);
