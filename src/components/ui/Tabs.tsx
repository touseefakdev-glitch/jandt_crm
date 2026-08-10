import React from 'react';
import { cn } from '../../utils/cn';

export interface TabsProps<T extends string> {
  tabs: { value: T; label: React.ReactNode; count?: number }[];
  active: T;
  onChange: (value: T) => void;
  className?: string;
  size?: 'sm' | 'md';
}

export function Tabs<T extends string>({ tabs, active, onChange, className, size = 'md' }: TabsProps<T>) {
  return (
    <div className={cn('inline-flex items-center gap-1 bg-[#E9EFF5] p-1 rounded-[8px] border border-[#D9E2EC]', className)}>
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            type="button"
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-[6px] font-bold transition-all whitespace-nowrap select-none',
              size === 'md' ? 'px-3.5 py-1.5 text-xs' : 'px-3 py-1 text-xs',
              isActive ? 'bg-white text-teal-700 shadow-xs ring-1 ring-[#D9E2EC]' : 'text-[#52606D] hover:text-[#172B4D]'
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 rounded-full text-[10px] font-bold',
                  isActive ? 'bg-teal-50 text-teal-800' : 'bg-[#D9E2EC] text-[#52606D]'
                )}
              >
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
