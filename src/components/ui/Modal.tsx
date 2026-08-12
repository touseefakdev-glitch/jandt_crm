import React, { useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  icon?: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  children: React.ReactNode;
  footer?: React.ReactNode;
  closeOnBackdrop?: boolean;
  closeOnEsc?: boolean;
  className?: string;
}

const sizeClasses: Record<NonNullable<ModalProps['size']>, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
};

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  icon,
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
      if (e.key === 'Tab') {
        const focusables = panelRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables || focusables.length === 0) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
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
    <div className="fixed inset-0 z-[70] flex items-stretch sm:items-center justify-center sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/45 backdrop-blur-[3px] animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'relative w-full bg-white shadow-overlay border border-[#DCE4EF] animate-scale-in sm:my-auto overflow-hidden',
          'rounded-none sm:rounded-panel',
          'max-h-full sm:max-h-[calc(100vh-3rem)]',
          'flex flex-col',
          sizeClasses[size],
          className
        )}
      >
        {(title || icon) && (
          <div className="flex items-start justify-between gap-4 px-5 sm:px-6 pt-4 pb-3.5 border-b border-[#DCE4EF] shrink-0 bg-gradient-to-b from-[#FBFCFE] to-white">
            <div className="flex items-start gap-3 min-w-0">
              {icon && <div className="w-9 h-9 rounded-lg bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 shadow-xs">{icon}</div>}
              <div className="min-w-0">
                <h2 className="text-base font-bold text-[#132A4A] tracking-tight leading-snug">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-[#52606D]">{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 -mr-1.5 text-[#829AB1] hover:text-[#172B4D] hover:bg-[#E9EFF5] rounded-md transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="flex-1 min-h-0 px-5 sm:px-6 py-5 overflow-y-auto">{children}</div>
        {footer && <div className="px-5 sm:px-6 py-3.5 border-t border-[#DCE4EF] bg-[#F4F7FB] rounded-b-none sm:rounded-b-panel flex items-center justify-end gap-2.5 shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

export const ModalFooter: React.FC<{ onCancel: () => void; onConfirm: () => void; confirmLabel?: string; cancelLabel?: string; confirmVariant?: 'primary' | 'danger' | 'success'; loading?: boolean }> = ({
  onCancel,
  onConfirm,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  confirmVariant = 'primary',
  loading,
}) => (
  <>
    <Button variant="outline" onClick={onCancel}>
      {cancelLabel}
    </Button>
    <Button variant={confirmVariant} onClick={onConfirm} loading={loading}>
      {confirmLabel}
    </Button>
  </>
);
