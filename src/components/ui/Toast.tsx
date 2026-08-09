import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export type ToastType = 'success' | 'error' | 'info';

export interface ToastInput {
  type?: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

interface ToastItem extends ToastInput {
  id: number;
}

interface ToastContextValue {
  toast: (input: ToastInput) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = (): ToastContextValue => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
};

const iconMap = {
  success: { Icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200' },
  error: { Icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', ring: 'ring-red-200' },
  info: { Icon: Info, color: 'text-brand-600', bg: 'bg-brand-50', ring: 'ring-brand-200' },
};

let toastCounter = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (input: ToastInput) => {
      const id = ++toastCounter;
      setToasts((prev) => [...prev.slice(-4), { type: 'success', ...input, id }]);
      window.setTimeout(() => dismiss(id), input.duration ?? 4500);
    },
    [dismiss]
  );

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      {createPortal(
        <div className="fixed top-4 right-4 z-[80] flex flex-col gap-2.5 w-[min(24rem,calc(100vw-2rem))]" role="region" aria-label="Notifications">
          {toasts.map((t) => {
            const meta = iconMap[t.type === 'error' ? 'error' : t.type === 'info' ? 'info' : 'success'];
            const Icon = meta.Icon;
            return (
              <div
                key={t.id}
                className={cn('flex items-start gap-3 p-4 rounded-xl bg-white ring-1 shadow-popover animate-slide-in-right', meta.ring)}
              >
                <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center shrink-0', meta.bg, meta.color)}>
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <div className="flex-1 min-w-0">
                  {t.title && <p className="text-xs font-bold text-slate-900 leading-snug">{t.title}</p>}
                  <p className={cn('text-xs text-slate-600 leading-snug', t.title && 'mt-0.5')}>{t.message}</p>
                </div>
                <button onClick={() => dismiss(t.id)} aria-label="Dismiss notification" className="text-slate-300 hover:text-slate-500 transition-colors shrink-0">
                  <X className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>,
        document.body
      )}
    </ToastContext.Provider>
  );
};
