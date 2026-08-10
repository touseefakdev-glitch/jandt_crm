import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: React.ReactNode;
  error?: string | null;
  icon?: React.ReactNode;
  hint?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, hint, className, id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp || autoId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="crm-input-label">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#829AB1]">{icon}</span>}
          <input
            ref={ref}
            id={id}
            className={cn('crm-input', icon ? 'pl-9' : undefined, error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20', className)}
            {...props}
          />
        </div>
        {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
