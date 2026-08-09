import React from 'react';
import { Modal } from './Modal';
import { Button } from './Button';

export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'success' | 'primary';
  icon?: React.ReactNode;
  loading?: boolean;
}

const iconBgMap = {
  danger: 'bg-red-50 text-red-600',
  success: 'bg-emerald-50 text-emerald-600',
  primary: 'bg-brand-50 text-brand-600',
} as const;

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  icon,
  loading,
}) => (
  <Modal isOpen={isOpen} onClose={onClose} size="sm">
    <div className="space-y-4">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${iconBgMap[variant]}`}>{icon}</div>
        <div>
          <h3 className="text-base font-bold text-slate-900 leading-snug">{title}</h3>
          <div className="text-sm text-slate-600 mt-1 leading-relaxed">{message}</div>
        </div>
      </div>
      <div className="flex justify-end gap-2.5 pt-1">
        <Button variant="outline" onClick={onClose}>
          {cancelLabel}
        </Button>
        <Button variant={variant === 'primary' ? 'primary' : variant === 'success' ? 'success' : 'danger'} onClick={onConfirm} loading={loading}>
          {confirmLabel}
        </Button>
      </div>
    </div>
  </Modal>
);
