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
    <div className={cn('inline-flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200', className)}>
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            onClick={() => onChange(tab.value)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md font-semibold transition-all whitespace-nowrap',
              size === 'md' ? 'px-3.5 py-2 text-xs' : 'px-3 py-1.5 text-xs',
              isActive ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span
                className={cn(
                  'inline-flex items-center justify-center min-w-[1.25rem] h-4 px-1 rounded-full text-[10px] font-bold',
                  isActive ? 'bg-brand-100 text-brand-800' : 'bg-slate-200 text-slate-600'
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
