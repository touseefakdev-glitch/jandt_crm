import React, { useId } from 'react';
import { cn } from '../../utils/cn';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: React.ReactNode;
  error?: string | null;
  hint?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp || autoId;
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={id} className="crm-input-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={id}
          className={cn('crm-input min-h-[96px] resize-y', error && 'border-red-500 focus:border-red-500 focus:ring-red-500/20', className)}
          {...props}
        />
        {error && <p className="mt-1.5 text-xs font-medium text-red-600">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-xs text-slate-400">{hint}</p>}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
