import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: React.ReactNode;
  error?: string | null;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, className, id: idProp, children, ...props }, ref) => {
    const autoId = useId();
    const id = idProp || autoId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="crm-input-label">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn('crm-input appearance-none bg-no-repeat pr-9 cursor-pointer', error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20', className)}
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%2394a3b8' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e\")",
            backgroundPosition: 'right 0.6rem center',
            backgroundSize: '1.1em 1.1em',
          }}
          {...props}
        >
          {children}
        </select>
        {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
