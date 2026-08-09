import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../../types';
import { localDb } from '../../services/db';
import { UserX, AlertTriangle, HelpCircle, ShoppingBag, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Avatar } from '../ui/Avatar';

interface UserDeactivateModalProps {
  user: UserProfile | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmDeactivate: (userId: string) => void;
}

export const UserDeactivateModal: React.FC<UserDeactivateModalProps> = ({
  user,
  isOpen,
  onClose,
  onConfirmDeactivate,
}) => {
  const activeWork = useMemo(
    () => (user ? localDb.getUserActiveWork(user.id) : { openQueries: [], pendingOrders: [] }),
    [user]
  );

  if (!isOpen || !user) return null;

  const hasActiveWork = activeWork.openQueries.length > 0 || activeWork.pendingOrders.length > 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="sm"
      title="Deactivate User Account?"
      subtitle="The user will lose all login and system access"
      icon={
        <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center">
          <UserX className="w-5 h-5" />
        </div>
      }
    >
      <div className="space-y-4 text-sm">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center gap-3">
          <Avatar name={user.full_name} size="md" />
          <div className="min-w-0">
            <div className="font-bold text-slate-900">{user.full_name}</div>
            <div className="text-xs text-slate-500 font-mono">{user.email}</div>
            <div className="text-xs text-slate-600 mt-0.5 capitalize font-semibold">
              Role: {user.role.replace(/_/g, ' ')} • Status: {user.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-600 leading-relaxed">
          This user will no longer be able to log in or access the CRM.{' '}
          <span className="font-bold text-slate-900">All historical records (queries, orders, audit logs) will remain intact.</span>
        </p>

        {hasActiveWork && (
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 space-y-2">
            <div className="flex items-center gap-2 font-bold text-amber-900 text-xs uppercase tracking-wider">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              Active Work Assigned Warning
            </div>

            <p className="text-xs leading-snug">This user currently has assigned active work:</p>

            <div className="pl-2 space-y-1 font-semibold text-xs">
              {activeWork.openQueries.length > 0 && (
                <div className="flex items-center gap-1.5 text-amber-900">
                  <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                  <span>{activeWork.openQueries.length} Open Support Query/Queries</span>
                </div>
              )}

              {activeWork.pendingOrders.length > 0 && (
                <div className="flex items-center gap-1.5 text-amber-900">
                  <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                  <span>{activeWork.pendingOrders.length} Pending Sales Order(s)</span>
                </div>
              )}
            </div>

            <p className="text-xs text-amber-800 pt-1">
              Would you like to review and reassign their active work before deactivating?
            </p>
          </div>
        )}

        <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-3">
          {hasActiveWork ? (
            <Link to="/queries" onClick={onClose} className="text-brand-600 hover:underline font-bold text-xs flex items-center">
              <span>Review Active Work</span>
              <ArrowRight className="w-3 h-3 ml-1" />
            </Link>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                onConfirmDeactivate(user.id);
                onClose();
              }}
            >
              Confirm Deactivate
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
