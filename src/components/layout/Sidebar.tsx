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
  MapPin,
  UsersRound,
  Upload,
  FileText,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { UserRole } from '../../types';

interface SidebarNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  allowedRoles: UserRole[];
  badge?: string;
  section: 'operations' | 'administration';
}

const NAV_ITEMS: SidebarNavItem[] = [
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, allowedRoles: ['admin', 'sales_agent', 'support_agent'], section: 'operations' },
  { id: 'orders', label: 'Daily Operations', path: '/orders', icon: ShoppingBag, allowedRoles: ['admin', 'sales_agent', 'support_agent'], section: 'operations' },
  { id: 'customers', label: 'Customers', path: '/customers', icon: Users, allowedRoles: ['admin', 'sales_agent', 'support_agent'], section: 'operations' },
  { id: 'products', label: 'Products Catalog', path: '/products', icon: Package, allowedRoles: ['admin', 'sales_agent', 'support_agent'], section: 'operations' },
  { id: 'queries', label: 'Support Queries', path: '/queries', icon: HelpCircle, allowedRoles: ['admin', 'support_agent'], section: 'operations' },
  { id: 'out-of-stock', label: 'Out of Stock', path: '/out-of-stock', icon: AlertTriangle, allowedRoles: ['admin', 'sales_agent', 'support_agent'], section: 'operations' },
  { id: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell, allowedRoles: ['admin', 'sales_agent', 'support_agent'], section: 'operations' },
  { id: 'shift-handover', label: 'Shift Handover', path: '/shift-handover', icon: ArrowLeftRight, allowedRoles: ['admin', 'sales_agent', 'support_agent'], section: 'operations' },

  // Administration Section
  { id: 'routes', label: 'Route Schedule', path: '/admin/routes', icon: MapPin, allowedRoles: ['admin'], section: 'administration' },
  { id: 'users', label: 'Users', path: '/admin/users', icon: Users, allowedRoles: ['admin'], section: 'administration' },
  { id: 'teams', label: 'Teams', path: '/admin/teams', icon: UsersRound, allowedRoles: ['admin'], section: 'administration' },
  { id: 'imports', label: 'Data Imports', path: '/admin/import', icon: Upload, allowedRoles: ['admin'], section: 'administration' },
  { id: 'audit-logs', label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText, allowedRoles: ['admin'], section: 'administration' },
  { id: 'settings', label: 'Settings', path: '/admin/settings', icon: Settings, allowedRoles: ['admin'], section: 'administration' },
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
  const opsItems = visibleNavItems.filter((item) => item.section === 'operations');
  const adminItems = visibleNavItems.filter((item) => item.section === 'administration');

  const renderNavItem = (item: SidebarNavItem) => {
    const Icon = item.icon;
    return (
      <NavLink
        key={item.id}
        to={item.path}
        onClick={onMobileClose}
        title={collapsed ? item.label : undefined}
        className={({ isActive }) =>
          cn(
            'flex items-center text-xs font-semibold transition-all relative group select-none',
            collapsed ? 'justify-center px-0 py-2.5 mx-auto w-10 rounded-btn' : 'px-3 py-2 rounded-btn mx-2',
            isActive
              ? 'bg-gradient-to-r from-teal-500/20 to-teal-500/5 text-white font-bold shadow-inset-top'
              : 'text-[#9FB3C8] hover:bg-white/5 hover:text-white'
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* Active Left Indicator Bar */}
            {isActive && !collapsed && (
              <span className="absolute left-0 top-1 bottom-1 w-1 bg-gradient-to-b from-teal-400 to-teal-600 rounded-r-full" />
            )}
            <Icon
              className={cn(
                'w-4 h-4 shrink-0 transition-colors',
                isActive ? 'text-teal-400 drop-shadow-[0_1px_2px_rgba(0,166,166,0.5)]' : 'text-[#829AB1] group-hover:text-white'
              )}
            />
            {!collapsed && (
              <>
                <span className="ml-3 flex-1 truncate">{item.label}</span>
                {item.badge && (
                  <span className={cn('text-2xs px-1.5 py-0.5 rounded-full font-bold uppercase', isActive ? 'bg-teal-500 text-white' : 'bg-[#243B53] text-[#9FB3C8]')}>
                    {item.badge}
                  </span>
                )}
              </>
            )}
          </>
        )}
      </NavLink>
    );
  };

  const renderSectionLabel = (label: string) => (
    <div className="px-5 mb-2 text-2xs font-extrabold uppercase tracking-widest text-[#627D98]">{label}</div>
  );

  const renderContent = () => (
    <div className={cn('flex flex-col h-full bg-gradient-navy-panel text-white', collapsed ? 'w-[72px]' : 'w-60')}>
      {/* Sidebar Brand Header */}
      <div
        className={cn(
          'h-16 flex items-center border-b border-[#1E3A5F]/70 px-4 shrink-0 bg-[#0C2340]/40',
          collapsed ? 'justify-center' : 'justify-start space-x-3'
        )}
      >
        <div className="w-9 h-9 rounded-btn bg-gradient-teal-primary text-white flex items-center justify-center font-bold shadow-glow-teal shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <span className="font-extrabold text-sm tracking-tight text-white block leading-tight truncate">J&T SUPPLIES</span>
            <span className="text-2xs font-bold text-[#829AB1] uppercase tracking-wider block">CRM Portal</span>
          </div>
        )}
      </div>

      <div className="flex-1 py-4 overflow-y-auto space-y-6">
        {/* Operations Section */}
        <div>
          {!collapsed && renderSectionLabel('Operations')}
          <div className="space-y-1">{opsItems.map(renderNavItem)}</div>
        </div>

        {/* Administration Section (Admin only) */}
        {adminItems.length > 0 && (
          <div>
            {!collapsed && renderSectionLabel('Administration')}
            <div className="space-y-1">{adminItems.map(renderNavItem)}</div>
          </div>
        )}
      </div>

      {/* Active Shift Footer */}
      <div
        className={cn(
          'border-t border-[#1E3A5F]/70 bg-[#0C2340]/50 text-xs text-[#9FB3C8] shrink-0',
          collapsed ? 'p-3 text-center' : 'p-4'
        )}
      >
        <div className={cn('flex items-center justify-between mb-1', collapsed && 'justify-center')}>
          {!collapsed && <span className="font-bold text-xs text-white">Active Shift Session</span>}
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
        </div>
        {!collapsed &&
          (user.team ? (
            <div>
              <p className="text-white font-semibold text-xs truncate">{user.team.name}</p>
              <p className="text-2xs text-[#829AB1] font-mono mt-0.5 truncate">{user.team.shift_info}</p>
            </div>
          ) : (
            <p className="text-[#627D98] italic text-[11px]">No team assigned</p>
          ))}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-[#091A2B]/60 backdrop-blur-[2px] animate-fade-in" onClick={onMobileClose} aria-hidden="true" />
          <aside className="absolute inset-y-0 left-0 w-60 bg-[#102A43] text-white shadow-overlay">
            <div className="h-full">{renderContent()}</div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden md:flex flex-col bg-gradient-navy-panel text-white shrink-0 transition-[width] duration-150 ease-in-out border-r border-[#1E3A5F]/70 shadow-card z-30',
          collapsed ? 'w-[72px]' : 'w-60'
        )}
      >
        {renderContent()}
      </aside>
    </>
  );
};
