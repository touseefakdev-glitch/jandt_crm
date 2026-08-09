import React from 'react';
import { cn } from '../../utils/cn';
import { initials } from '../../utils/format';

export const Avatar: React.FC<{ name: string | null | undefined; size?: 'xs' | 'sm' | 'md' | 'lg'; className?: string }> = ({
  name,
  size = 'sm',
  className,
}) => (
  <span
    className={cn(
      'inline-flex items-center justify-center rounded-full bg-slate-100 text-slate-600 font-semibold ring-1 ring-slate-200 shrink-0',
      size === 'xs' && 'w-6 h-6 text-[10px]',
      size === 'sm' && 'w-8 h-8 text-xs',
      size === 'md' && 'w-10 h-10 text-sm',
      size === 'lg' && 'w-12 h-12 text-base',
      className
    )}
  >
    {initials(name)}
  </span>
);
