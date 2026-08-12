import React from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  UsersRound,
  ShieldAlert,
  Tag,
  Package,
  Bookmark,
  Clock,
  Settings,
  FileText,
  Upload,
  History,
  MapPin,
} from 'lucide-react';
import { PageHeader } from '../ui/PageHeader';
import { Badge } from '../ui/Badge';
import { cn } from '../../utils/cn';

export const AdminLayout: React.FC = () => {
  const location = useLocation();

  const adminNavTabs = [
    { label: 'Dashboard', path: '/admin', exact: true, icon: LayoutDashboard },
    { label: 'Users', path: '/admin/users', icon: Users },
    { label: 'Teams', path: '/admin/teams', icon: UsersRound },
    { label: 'Roles & Permissions', path: '/admin/roles', icon: ShieldAlert },
    { label: 'Route Schedules', path: '/admin/routes', icon: MapPin },
    { label: 'Data Import', path: '/admin/import', exact: true, icon: Upload },
    { label: 'Import History', path: '/admin/import/history', icon: History },
    { label: 'Query Categories', path: '/admin/query-categories', icon: Tag },
    { label: 'Product Categories', path: '/admin/product-categories', icon: Package },
    { label: 'Product Brands', path: '/admin/product-brands', icon: Bookmark },
    { label: 'Shift Config', path: '/admin/shifts', icon: Clock },
    { label: 'System Settings', path: '/admin/settings', icon: Settings },
    { label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText },
  ];

  const isTabActive = (path: string, exact?: boolean) => {
    if (exact) {
      return location.pathname === '/admin' || location.pathname === '/admin/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Admin Control Center"
        description="Centralized user management, role permissions, operational teams, shift schedules, taxonomies, and immutable audit logs"
        icon={
          <div className="w-10 h-10 bg-sky-500/20 border border-sky-400/30 rounded-xl flex items-center justify-center text-sky-400">
            <ShieldCheck className="w-6 h-6" />
          </div>
        }
        iconBg="bg-slate-900"
        badges={
          <Badge
            badge={{
              subtle: 'bg-purple-50 text-purple-700 ring-purple-200',
              solid: 'bg-purple-600 text-white',
              dot: 'bg-purple-500',
              label: 'System Admin Access',
            }}
          />
        }
      />

      <div className="bg-white rounded-card p-2 border border-[#DCE4EF] shadow-xs">
        <div className="flex flex-wrap items-center gap-1">
          {adminNavTabs.map((tab) => {
            const Icon = tab.icon;
            const active = isTabActive(tab.path, tab.exact);
            return (
              <NavLink
                key={tab.path}
                to={tab.path}
                className={cn(
                  'px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5',
                  active ? 'bg-gradient-navy-panel text-white shadow-xs' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <Icon className={cn('w-3.5 h-3.5', active ? 'text-teal-400' : 'text-slate-400')} />
                <span>{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      <div>
        <Outlet />
      </div>
    </div>
  );
};
