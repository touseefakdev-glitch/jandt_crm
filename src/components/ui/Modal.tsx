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
    <div className="fixed inset-0 z-[70] flex items-start sm:items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-[2px] animate-fade-in"
        onClick={closeOnBackdrop ? onClose : undefined}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : undefined}
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-overlay border border-slate-200 animate-scale-in my-auto',
          sizeClasses[size],
          className
        )}
      >
        {(title || icon) && (
          <div className="flex items-start justify-between gap-4 px-6 pt-5 pb-4 border-b border-slate-200">
            <div className="flex items-start gap-3 min-w-0">
              {icon && <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0">{icon}</div>}
              <div className="min-w-0">
                <h2 className="text-base font-bold text-slate-900 tracking-tight leading-snug">{title}</h2>
                {subtitle && <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>}
              </div>
            </div>
            <button
              onClick={onClose}
              aria-label="Close dialog"
              className="p-1.5 -mr-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="px-6 py-5 max-h-[calc(100vh-10rem)] overflow-y-auto">{children}</div>
        {footer && <div className="px-6 py-4 border-t border-slate-200 bg-slate-50/70 rounded-b-2xl flex items-center justify-end gap-2.5">{footer}</div>}
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
