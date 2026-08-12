import React from 'react';
import { AlertTriangle, Check, Circle } from 'lucide-react';
import { cn } from '../../utils/cn';

export type WorkflowStepState = 'done' | 'current' | 'pending' | 'error' | 'muted';

export interface WorkflowStepperStep {
  key: string;
  label: string;
  /** Visual accent for completed/current states. Should be a bg-* class. */
  color: string;
  state: WorkflowStepState;
}

export interface WorkflowStepperProps {
  steps: WorkflowStepperStep[];
  className?: string;
  /** Compact variant used inside density-critical layouts. */
  dense?: boolean;
}

const dotStyles: Record<WorkflowStepState, string> = {
  done: 'border-transparent',
  current: 'border-teal-600 ring-4 ring-teal-500/20',
  pending: 'border-[#C4D0E0] bg-white',
  error: 'border-rose-500 bg-rose-500',
  muted: 'border-[#C4D0E0] bg-white opacity-50',
};

const labelStyles: Record<WorkflowStepState, string> = {
  done: 'text-[#132A4A]',
  current: 'text-teal-700',
  pending: 'text-[#7B8CA4]',
  error: 'text-rose-700',
  muted: 'text-[#7B8CA4] opacity-60',
};

/**
 * Horizontal workflow stepper — a premium 3D progress rail.
 * Completed stages fill, the current stage glows, pending stages stay muted.
 */
export const WorkflowStepper: React.FC<WorkflowStepperProps> = ({ steps, className, dense }) => {
  if (steps.length === 0) return null;

  return (
    <ol className={cn('flex items-center w-full', className)} aria-label="Workflow progress">
      {steps.map((step, idx) => {
        const isLast = idx === steps.length - 1;
        const isDone = step.state === 'done';
        const isError = step.state === 'error';
        return (
          <li key={step.key} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center min-w-0">
              <span
                className={cn(
                  'rounded-full flex items-center justify-center shadow-xs border-2 transition-all',
                  dense ? 'w-7 h-7' : 'w-8 h-8',
                  isDone ? step.color : dotStyles[step.state]
                )}
              >
                {isDone ? (
                  <Check className={cn('text-white', dense ? 'w-3.5 h-3.5' : 'w-4 h-4')} strokeWidth={3} />
                ) : isError ? (
                  <AlertTriangle className={cn('text-white', dense ? 'w-3 h-3' : 'w-3.5 h-3.5')} />
                ) : (
                  <Circle className={cn('w-2.5 h-2.5 fill-current', step.state === 'current' ? step.color : 'text-[#C4D0E0]')} />
                )}
              </span>
              <span
                className={cn(
                  'mt-1.5 font-bold uppercase tracking-wide text-center truncate max-w-full px-1',
                  dense ? 'text-[9px]' : 'text-2xs',
                  labelStyles[step.state]
                )}
              >
                {step.label}
              </span>
            </div>
            {!isLast && (
              <div
                className={cn(
                  'mx-1.5 rounded-full shrink-0',
                  dense ? 'h-0.5' : 'h-[3px]',
                  step.state === 'done' ? step.color : 'bg-[#DCE4EF]'
                )}
                style={{ flex: 1 }}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
};