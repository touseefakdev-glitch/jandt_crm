import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { cn } from '../../utils/cn';
import { Button } from './Button';

export interface ErrorStateProps {
  title?: string;
  message?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ title = 'Unable to load data', message, onRetry, className }) => (
  <div className={cn('p-10 text-center bg-white rounded-card border border-[#D9E2EC] shadow-card', className)}>
    <div className="w-12 h-12 bg-red-50 text-red-600 rounded-[10px] flex items-center justify-center mx-auto mb-3 ring-1 ring-red-100">
      <AlertTriangle className="w-6 h-6" />
    </div>
    <h3 className="text-sm font-bold text-[#172B4D]">{title}</h3>
    {message && <p className="text-xs text-[#52606D] max-w-sm mx-auto mt-1 leading-relaxed font-medium">{message}</p>}
    {onRetry && (
      <div className="mt-4 flex items-center justify-center gap-2">
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      </div>
    )}
  </div>
);
