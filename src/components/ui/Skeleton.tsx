import React from 'react';
import { cn } from '../../utils/cn';

export const Skeleton: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('animate-pulse rounded-[6px] bg-[#E9EFF5]', className)} />
);

export const SkeletonTable: React.FC<{ rows?: number; cols?: number; className?: string }> = ({ rows = 5, cols = 5, className }) => (
  <div className={cn('bg-white rounded-card border border-[#D9E2EC] shadow-card overflow-hidden', className)}>
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

export const SkeletonCard: React.FC<{ className?: string }> = ({ className }) => (
  <div className={cn('bg-white p-5 rounded-card border border-[#D9E2EC] shadow-card space-y-3', className)}>
    <div className="flex items-center justify-between">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-8 rounded-lg" />
    </div>
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
  </div>
);

export const SkeletonKpiGrid: React.FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="bg-white p-4 rounded-card border border-[#D9E2EC] shadow-card space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-8 w-8 rounded-lg" />
        </div>
        <Skeleton className="h-7 w-16" />
        <Skeleton className="h-3 w-32" />
      </div>
    ))}
  </div>
);

export const SkeletonList: React.FC<{ items?: number; className?: string }> = ({ items = 5, className }) => (
  <div className={cn('bg-white rounded-card border border-[#D9E2EC] shadow-card divide-y divide-[#E9EFF5]', className)}>
    {Array.from({ length: items }).map((_, i) => (
      <div key={i} className="px-5 py-4 flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-3.5 w-1/3" />
          <Skeleton className="h-3 w-1/4" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>
    ))}
  </div>
);

export const PageSkeleton: React.FC = () => (
  <div className="space-y-5 lg:space-y-6">
    <div className="bg-white p-5 rounded-card border border-[#D9E2EC] shadow-card flex items-center gap-4">
      <Skeleton className="h-10 w-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-3.5 w-96 max-w-full" />
      </div>
      <Skeleton className="h-9 w-36" />
    </div>
    <SkeletonKpiGrid count={4} />
    <SkeletonTable rows={6} cols={6} />
  </div>
);
