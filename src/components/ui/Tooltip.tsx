import React from 'react';
import { cn } from '../../utils/cn';

export interface TooltipProps {
  content: React.ReactNode;
  side?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
  className?: string;
}

/**
 * Lightweight hover/focus tooltip used for truncated content and
 * icon-only controls. Pure CSS — no state, no provider required.
 */
export const Tooltip: React.FC<TooltipProps> = ({ content, side = 'top', children, className }) => (
  <span className={cn('group/tooltip relative inline-flex', className)}>
    {children}
    <span
      role="tooltip"
      className={cn(
        'pointer-events-none absolute z-[60] hidden group-hover/tooltip:block group-focus-visible/tooltip:block',
        'bg-[#102A43] text-white text-2xs font-medium px-2.5 py-1.5 rounded-md shadow-overlay max-w-[280px] break-words leading-snug',
        side === 'top' && 'bottom-full left-1/2 -translate-x-1/2 mb-1.5',
        side === 'bottom' && 'top-full left-1/2 -translate-x-1/2 mt-1.5',
        side === 'left' && 'right-full top-1/2 -translate-y-1/2 mr-1.5',
        side === 'right' && 'left-full top-1/2 -translate-y-1/2 ml-1.5'
      )}
    >
      {content}
    </span>
  </span>
);
