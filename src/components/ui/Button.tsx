import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
  /** Compact square button for icon-only actions. */
  iconOnly?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-gradient-teal-primary text-white hover:brightness-110 focus-visible:ring-teal-500/40 shadow-xs active:brightness-95 disabled:hover:brightness-100',
  secondary: 'bg-navy-900 text-white hover:bg-navy-800 focus-visible:ring-navy-500/40 shadow-xs active:bg-navy-950 disabled:hover:bg-navy-900',
  outline: 'bg-white text-[#132A4A] border border-[#DCE4EF] hover:bg-[#F4F7FB] hover:border-[#BCCCDC] focus-visible:ring-teal-500/30 shadow-xs',
  ghost: 'bg-transparent text-[#52606D] hover:bg-[#E9EFF5] hover:text-[#132A4A] focus-visible:ring-teal-500/30',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500/40 shadow-xs active:bg-red-700 disabled:hover:bg-red-500',
  success: 'bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500/40 shadow-xs active:bg-green-700 disabled:hover:bg-green-500',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: cn('px-3 text-xs font-bold gap-1.5 rounded-btn', 'h-8'),
  md: cn('px-4 text-sm font-semibold gap-2 rounded-btn', 'h-9'),
  lg: cn('px-5 text-sm font-bold gap-2 rounded-btn', 'h-10'),
};

const iconOnlyStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'w-8 px-0',
  md: 'w-9 px-0',
  lg: 'w-10 px-0',
};

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      icon,
      iconRight,
      loading,
      fullWidth,
      iconOnly,
      className,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none whitespace-nowrap',
        'hover:-translate-y-px active:translate-y-0',
        variantStyles[variant],
        sizeStyles[size],
        iconOnly && iconOnlyStyles[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {loading ? (
        <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
        </svg>
      ) : (
        icon
      )}
      {children}
      {!loading && iconRight}
    </button>
  )
);

Button.displayName = 'Button';
