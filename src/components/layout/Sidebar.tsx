import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
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
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, allowedRoles: ['admin', 'sales_agent', 'support_agent'] },
  { id: 'customers', label: 'Customers', path: '/customers', icon: Users, allowedRoles: ['admin', 'sales_agent', 'support_agent'] },
  { id: 'queries', label: 'Queries', path: '/queries', icon: HelpCircle, allowedRoles: ['admin', 'support_agent'] },
  { id: 'orders', label: 'Orders', path: '/orders', icon: ShoppingBag, allowedRoles: ['admin', 'sales_agent', 'support_agent'] },
  { id: 'products', label: 'Products Catalog', path: '/products', icon: Package, allowedRoles: ['admin', 'sales_agent', 'support_agent'] },
  { id: 'out-of-stock', label: 'Out of Stock', path: '/out-of-stock', icon: AlertTriangle, allowedRoles: ['admin', 'sales_agent', 'support_agent'] },
  { id: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell, allowedRoles: ['admin', 'sales_agent', 'support_agent'] },
  { id: 'shift-handover', label: 'Shift Handover', path: '/shift-handover', icon: ArrowLeftRight, allowedRoles: ['admin', 'sales_agent', 'support_agent'] },
  { id: 'admin', label: 'Admin', path: '/admin', icon: ShieldAlert, allowedRoles: ['admin'], badge: 'Admin' },
];

export interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, mobileOpen, onMobileClose }) => {
  const { user, hasRole } = useAuth();

  if (!user) return null;

  const visibleNavItems = NAV_ITEMS.filter((item) => hasRole(item.allowedRoles));

  const renderContent = () => (
    <div className={cn('flex flex-col h-full', collapsed ? 'w-[76px]' : 'w-64')}>
      <div className="flex-1 px-3 py-4 overflow-y-auto space-y-1">
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.id}
              to={item.path}
              onClick={onMobileClose}
              title={collapsed ? item.label : undefined}
              className={({ isActive }) =>
                cn(
                  'flex items-center rounded-lg text-sm font-medium transition-all group',
                  collapsed ? 'justify-center px-0 py-2.5 mx-auto w-11' : 'px-3 py-2.5',
                  isActive
                    ? 'bg-brand-600 text-white shadow-sm font-semibold'
                    : 'text-slate-300 hover:bg-white/5 hover:text-white'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className={cn('w-[18px] h-[18px] shrink-0 transition-colors', isActive ? 'text-white' : 'text-slate-400 group-hover:text-white')} />
                  {!collapsed && (
                    <>
                      <span className="ml-3 flex-1 truncate">{item.label}</span>
                      {item.badge && (
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded font-semibold', isActive ? 'bg-white/20 text-white' : 'bg-purple-500/15 text-purple-300 border border-purple-500/30')}>
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </>
              )}
            </NavLink>
          );
        })}
      </div>

      <div className={cn('border-t border-white/10 bg-black/10 text-xs text-slate-400', collapsed ? 'px-2 py-4' : 'p-4')}>
        <div className={cn('flex items-center justify-between mb-1', collapsed && 'justify-center')}>
          {!collapsed && <span className="font-semibold text-slate-200">Active Shift Session</span>}
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        {!collapsed &&
          (user.team ? (
            <div>
              <p className="text-slate-300 font-medium">{user.team.name}</p>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{user.team.shift_info}</p>
            </div>
          ) : (
            <p className="text-slate-500 italic">No team assigned</p>
          ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-slate-950/50 backdrop-blur-[2px] animate-fade-in" onClick={onMobileClose} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-64 bg-slate-900 text-slate-300 shadow-overlay">
            <div className="h-full bg-slate-900">{renderContent()}</div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn('hidden md:flex flex-col bg-slate-900 text-slate-300 shrink-0 transition-[width] duration-200 ease-in-out', collapsed ? 'w-[76px]' : 'w-64')}>
        {renderContent()}
      </aside>
    </>
  );
};
