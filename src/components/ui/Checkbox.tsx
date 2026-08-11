import React, { forwardRef, useEffect, useRef, useId } from 'react';
import { Check, Minus } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'> {
  indeterminate?: boolean;
  size?: 'sm' | 'md' | 'lg';
  label?: React.ReactNode;
  error?: boolean;
}

const sizeStyles = {
  sm: 'w-4 h-4 rounded-[4px]',
  md: 'w-[18px] h-[18px] rounded-[5px]',
  lg: 'w-5 h-5 rounded-[5px]',
};

const iconStyles = {
  sm: 'w-3 h-3',
  md: 'w-3.5 h-3.5',
  lg: 'w-4 h-4',
};

/**
 * Reusable CRM checkbox with consistent visual states:
 * default, hover, focused, checked, indeterminate, disabled, error.
 * Vertically centered inside table rows by default.
 */
export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ indeterminate, size = 'md', label, error, className, id: idProp, ...props }, ref) => {
    const autoId = useId();
    const id = idProp || autoId;
    const innerRef = useRef<HTMLInputElement | null>(null);

    useEffect(() => {
      if (innerRef.current) innerRef.current.indeterminate = !!indeterminate;
    }, [indeterminate]);

    const setRefs = (el: HTMLInputElement | null) => {
      innerRef.current = el;
      if (typeof ref === 'function') ref(el);
      else if (ref) ref.current = el;
    };

    return (
      <label htmlFor={id} className={cn('inline-flex items-center gap-2 align-middle cursor-pointer', props.disabled && 'cursor-not-allowed', className)}>
        <span className="relative inline-flex shrink-0">
          <input
            ref={setRefs}
            id={id}
            type="checkbox"
            className="peer sr-only"
            aria-invalid={error || undefined}
            {...props}
          />
          <span
            className={cn(
              sizeStyles[size],
              'flex items-center justify-center border-2 bg-white transition-all duration-150',
              'border-[#D9E2EC] peer-hover:border-teal-500',
              'peer-focus-visible:ring-2 peer-focus-visible:ring-teal-500/30 peer-focus-visible:border-teal-500',
              'peer-checked:bg-teal-500 peer-checked:border-teal-500',
              'peer-disabled:bg-[#E9EFF5] peer-disabled:border-[#D9E2EC] peer-disabled:opacity-60',
              (indeterminate || props.checked) && 'bg-teal-500 border-teal-500',
              error && !props.checked && !indeterminate && 'border-red-500 bg-red-50'
            )}
          >
            {indeterminate ? (
              <Minus className={cn(iconStyles[size], 'text-white')} />
            ) : (
              <Check className={cn(iconStyles[size], 'text-white opacity-0 peer-checked:opacity-100 transition-opacity')} />
            )}
          </span>
        </span>
        {label && <span className="text-sm text-[#172B4D] select-none">{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
