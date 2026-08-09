import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { UserProfile } from '../../types';
import { localDb } from '../../services/db';
import { AlertTriangle, UserX, X, HelpCircle, ShoppingBag, ArrowRight } from 'lucide-react';

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
  if (!isOpen || !user) return null;

  const activeWork = useMemo(() => {
    return localDb.getUserActiveWork(user.id);
  }, [user.id]);

  const hasActiveWork = activeWork.openQueries.length > 0 || activeWork.pendingOrders.length > 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="bg-red-600 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2 font-bold text-base">
            <UserX className="w-5 h-5" />
            <span>Deactivate User Account?</span>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="font-bold text-slate-900 text-sm">{user.full_name}</div>
            <div className="text-slate-500 font-mono mt-0.5">{user.email}</div>
            <div className="text-slate-600 mt-1 capitalize font-semibold">
              Role: {user.role.replace(/_/g, ' ')} • Status: {user.is_active ? 'Active' : 'Inactive'}
            </div>
          </div>

          <p className="text-slate-600 leading-relaxed">
            This user will no longer be able to log in or access the CRM. <span className="font-bold text-slate-900">All historical records (queries, orders, audit logs) will remain intact.</span>
          </p>

          {/* Active Work Warning Banner */}
          {hasActiveWork && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-amber-950 space-y-2">
              <div className="flex items-center space-x-2 font-bold text-amber-900 text-xs uppercase">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Active Work Assigned Warning</span>
              </div>

              <p className="text-xs leading-snug">
                This user currently has assigned active work:
              </p>

              <div className="pl-2 space-y-1 font-semibold text-xs">
                {activeWork.openQueries.length > 0 && (
                  <div className="flex items-center space-x-1.5 text-amber-900">
                    <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                    <span>{activeWork.openQueries.length} Open Support Query/Queries</span>
                  </div>
                )}

                {activeWork.pendingOrders.length > 0 && (
                  <div className="flex items-center space-x-1.5 text-amber-900">
                    <ShoppingBag className="w-3.5 h-3.5 text-amber-600" />
                    <span>{activeWork.pendingOrders.length} Pending Sales Order(s)</span>
                  </div>
                )}
              </div>

              <p className="text-[11px] text-amber-800 pt-1">
                Would you like to review and reassign their active work before deactivating?
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            {hasActiveWork ? (
              <Link
                to="/queries"
                onClick={onClose}
                className="text-sky-600 hover:underline font-bold text-xs flex items-center"
              >
                <span>Review Active Work</span>
                <ArrowRight className="w-3 h-3 ml-1" />
              </Link>
            ) : <div />}

            <div className="flex items-center space-x-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={() => {
                  onConfirmDeactivate(user.id);
                  onClose();
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors"
              >
                Confirm Deactivate
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
