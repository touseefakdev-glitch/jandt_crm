import React from 'react';
import { cn } from '../../utils/cn';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  loading?: boolean;
  fullWidth?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary: 'bg-teal-500 text-white hover:bg-teal-600 focus-visible:ring-teal-500/40 shadow-xs active:bg-teal-700 disabled:hover:bg-teal-500',
  secondary: 'bg-navy-900 text-white hover:bg-navy-800 focus-visible:ring-navy-500/40 shadow-xs active:bg-navy-950 disabled:hover:bg-navy-900',
  outline: 'bg-white text-[#172B4D] border border-[#D9E2EC] hover:bg-[#F5F7FA] hover:border-[#BCCCDC] focus-visible:ring-teal-500/30',
  ghost: 'bg-transparent text-[#52606D] hover:bg-[#E9EFF5] hover:text-[#172B4D] focus-visible:ring-teal-500/30',
  danger: 'bg-red-500 text-white hover:bg-red-600 focus-visible:ring-red-500/40 shadow-xs active:bg-red-700 disabled:hover:bg-red-500',
  success: 'bg-green-500 text-white hover:bg-green-600 focus-visible:ring-green-500/40 shadow-xs active:bg-green-700 disabled:hover:bg-green-500',
};

const sizeStyles: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-xs font-bold gap-1.5 rounded-[8px]',
  md: 'px-4 py-2 text-sm font-semibold gap-2 rounded-[8px]',
  lg: 'px-5 py-2.5 text-sm font-bold gap-2 rounded-[8px]',
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
        'inline-flex items-center justify-center font-medium transition-all duration-150 outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed select-none',
        variantStyles[variant],
        sizeStyles[size],
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
