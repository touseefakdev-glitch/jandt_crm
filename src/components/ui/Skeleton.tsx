import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-[6px] bg-[#E9EFF5]', className)} />
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number }> = ({ rows = 5, cols = 5 }) => (
  <div className="bg-white rounded-[12px] border border-[#D9E2EC] shadow-card overflow-hidden">
    <div className="px-5 py-4 border-b border-[#D9E2EC] flex items-center justify-between">
      <Skeleton className="h-5 w-48" />
      <Skeleton className="h-8 w-28" />
    </div>
    <div className="divide-y divide-[#E9EFF5]">
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="px-4 py-3.5 flex items-center gap-6">
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} className={cn('h-3.5', c === 0 ? 'w-24' : c === cols - 1 ? 'w-20' : 'w-32')} />
          ))}
        </div>
      ))}
    </div>
  </div>
);

export const SkeletonKpiGrid: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-[12px] border border-[#D9E2EC] shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-8 rounded-[8px]" />
        </div>
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    ))}
  </div>
);
