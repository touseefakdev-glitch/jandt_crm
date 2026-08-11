import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  placement?: 'right' | 'left' | 'bottom';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  className?: string;
}

const widthClasses: Record<NonNullable<DrawerProps['placement']>, Record<NonNullable<DrawerProps['size']>, string>> = {
  right: {
    sm: 'w-full sm:w-[400px]',
    md: 'w-full sm:w-[480px]',
    lg: 'w-full sm:w-[640px]',
    xl: 'w-full sm:w-[800px]',
  },
  left: {
    sm: 'w-full sm:w-[400px]',
    md: 'w-full sm:w-[480px]',
    lg: 'w-full sm:w-[640px]',
    xl: 'w-full sm:w-[800px]',
  },
  bottom: {
    sm: 'max-w-2xl',
    md: 'max-w-3xl',
    lg: 'max-w-5xl',
    xl: 'max-w-7xl',
  },
};

/**
 * Reusable Drawer panel. On mobile, side drawers take the full width;
 * bottom drawers rise from the bottom of the viewport.
 */
export const Drawer: React.FC<DrawerProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
  placement = 'right',
  size = 'md',
  children,
  footer,
  closeOnBackdrop = true,
  closeOnEsc = true,
  className,
}) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocused = useRef<HTMLElement | null>(null);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEsc) {
        e.stopPropagation();
        onClose();
      }
    },
    [closeOnEsc, onClose]
  );

  useEffect(() => {
    if (!isOpen) return;
    previouslyFocused.current = document.activeElement as HTMLElement;
    const timer = setTimeout(() => panelRef.current?.querySelector<HTMLElement>('button, [href], input, select, textarea')?.focus(), 50);
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused.current?.focus();
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[75]" role="presentation">
      <div
        className="fixed inset-0 bg-[#091A2B]/50 backdrop-blur-[2px] animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'fixed flex flex-col bg-white shadow-overlay border-[#D9E2EC]',
          placement === 'right' && 'inset-y-0 right-0 h-full border-l animate-drawer-in-right',
          placement === 'left' && 'inset-y-0 left-0 h-full border-r animate-drawer-in-left',
          placement === 'bottom' && 'inset-x-0 bottom-0 max-h-[85vh] border-t rounded-t-card animate-drawer-in-bottom',
          widthClasses[placement][size],
          className
        )}
      >
        {(title || icon) && (
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-[#D9E2EC] shrink-0">
            <div className="flex items-start gap-3 min-w-0">
              {icon && <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0">{icon}</div>}
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#172B4D] tracking-tight leading-snug">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-[#52606D]">{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close panel"
              className="p-1.5 -mr-1.5 text-[#829AB1] hover:text-[#172B4D] hover:bg-[#E9EFF5] rounded-md transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">{children}</div>
        {footer && <div className="px-5 py-3.5 border-t border-[#D9E2EC] bg-[#F5F7FA] flex items-center justify-end gap-2.5 shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};
