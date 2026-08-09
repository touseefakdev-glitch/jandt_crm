import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Clock, ArrowLeft, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const ComingSoon: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  // Map path to friendly module title
  const getModuleTitle = (path: string) => {
    switch (path) {
      case '/customers':
        return 'Customers Management';
      case '/queries':
        return 'Customer Support & Queries';
      case '/orders':
        return 'Orders & Workflow';
      case '/inventory':
        return 'Inventory & Out-of-Stock Alerts';
      case '/notifications':
        return 'Notifications & Alerts';
      case '/shift-handover':
        return 'Shift Handover & Logs';
      case '/admin':
        return 'Admin System Settings & User Management';
      default:
        return 'Module';
    }
  };

  const title = getModuleTitle(location.pathname);

  return (
    <div className="bg-white rounded-xl p-8 sm:p-12 shadow-sm border border-slate-200 text-center max-w-2xl mx-auto my-8">
      <div className="w-16 h-16 bg-sky-50 text-sky-600 rounded-full flex items-center justify-center mx-auto mb-5 border border-sky-100 shadow-xs">
        <Clock className="w-8 h-8" />
      </div>

      <div className="inline-flex items-center space-x-1.5 px-3 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-semibold uppercase tracking-wider mb-3">
        <Layers className="w-3.5 h-3.5 text-slate-500" />
        <span>Step 1 Foundation</span>
      </div>

      <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
        {title}
      </h2>

      <p className="text-slate-600 text-sm mb-6 max-w-md mx-auto leading-relaxed">
        This module will be built in subsequent development steps. The database structure and role authorization rules (<span className="font-semibold text-slate-800 capitalize">{user?.role.replace('_', ' ')}</span>) are already prepared for this feature.
      </p>

      <div className="pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-center gap-3">
        <Link
          to="/dashboard"
          className="inline-flex items-center justify-center px-4 py-2 bg-slate-900 text-white font-medium text-sm rounded-lg hover:bg-slate-800 transition-colors shadow-sm w-full sm:w-auto"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
};
