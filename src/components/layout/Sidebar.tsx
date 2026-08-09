import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  HelpCircle, 
  ShoppingBag, 
  Package, 
  AlertTriangle,
  Bell, 
  ArrowLeftRight, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  badge?: string;
}

const NAV_ITEMS: SidebarNavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    path: '/dashboard',
    icon: LayoutDashboard,
    allowedRoles: ['admin', 'sales_agent', 'support_agent'],
  },
  {
    id: 'customers',
    label: 'Customers',
    path: '/customers',
    icon: Users,
    allowedRoles: ['admin', 'sales_agent', 'support_agent'],
  },
  {
    id: 'queries',
    label: 'Queries',
    path: '/queries',
    icon: HelpCircle,
    allowedRoles: ['admin', 'support_agent'],
  },
  {
    id: 'orders',
    label: 'Orders',
    path: '/orders',
    icon: ShoppingBag,
    allowedRoles: ['admin', 'sales_agent', 'support_agent'],
  },
  {
    id: 'products',
    label: 'Products Catalog',
    path: '/products',
    icon: Package,
    allowedRoles: ['admin', 'sales_agent', 'support_agent'],
  },
  {
    id: 'out-of-stock',
    label: 'Out of Stock Alerts',
    path: '/out-of-stock',
    icon: AlertTriangle,
    allowedRoles: ['admin', 'sales_agent', 'support_agent'],
  },
  {
    id: 'notifications',
    label: 'Notifications',
    path: '/notifications',
    icon: Bell,
    allowedRoles: ['admin', 'sales_agent', 'support_agent'],
  },
  {
    id: 'shift-handover',
    label: 'Shift Handover',
    path: '/shift-handover',
    icon: ArrowLeftRight,
    allowedRoles: ['admin', 'sales_agent', 'support_agent'],
  },
  {
    id: 'admin',
    label: 'Admin',
    path: '/admin',
    icon: ShieldAlert,
    allowedRoles: ['admin'],
    badge: 'Admin Only',
  },
];

export const Sidebar: React.FC = () => {
  const { user, hasRole } = useAuth();

  if (!user) return null;

  // Filter items accessible by the current user's role
  const visibleNavItems = NAV_ITEMS.filter(item => hasRole(item.allowedRoles));

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col flex-shrink-0 min-h-[calc(100vh-57px)] border-r border-slate-800">
      
      {/* Navigation Header */}
      <div className="px-4 py-3 border-b border-slate-800/80">
        <p className="text-[11px] font-semibold tracking-wider text-slate-400 uppercase">
          Navigation Menu
        </p>
      </div>

      {/* Navigation Items List */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {visibleNavItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all group ${
                  isActive
                    ? 'bg-sky-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <div className="flex items-center space-x-3">
                    <Icon className={`w-4 h-4 transition-colors ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-sky-400'}`} />
                    <span>{item.label}</span>
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {item.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        isActive ? 'bg-sky-700 text-sky-100' : 'bg-purple-950 text-purple-300 border border-purple-800/50'
                      }`}>
                        {item.badge}
                      </span>
                    )}
                    <ChevronRight className={`w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                      isActive ? 'opacity-100 text-white' : 'text-slate-500'
                    }`} />
                  </div>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer - Active Shift Info */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/50 text-xs text-slate-400">
        <div className="flex items-center justify-between mb-1">
          <span className="font-semibold text-slate-200">Active Shift Session</span>
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        </div>
        {user.team ? (
          <div>
            <p className="text-slate-300 font-medium">{user.team.name}</p>
            <p className="text-[11px] text-slate-500 font-mono mt-0.5">{user.team.shift_info}</p>
          </div>
        ) : (
          <p className="text-slate-500 italic">No team assigned</p>
        )}
      </div>

    </aside>
  );
};
