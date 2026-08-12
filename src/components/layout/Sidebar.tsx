import React, { useMemo } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { cn } from '../../utils/cn';
import { can, getEffectiveArea } from '../../services/access';
import { Capability } from '../../services/access';
import { localDb } from '../../services/db';
import { isOperationCompleted, isOperationError } from '../../utils/orderWorkflow';
import {
  LayoutDashboard,
  ListTodo,
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

type NavSection = 'work' | 'operations' | 'queries' | 'administration';

interface SidebarNavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
  capability?: Capability;
  badgeKey?: 'orders-pending' | 'queries-open';
  section: NavSection;
}

const NAV_ITEMS: SidebarNavItem[] = [
  { id: 'my-work', label: 'My Work', path: '/my-work', icon: ListTodo, section: 'work' },
  { id: 'dashboard', label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, section: 'work' },

  { id: 'orders', label: 'Daily Operations', path: '/orders', icon: ShoppingBag, badgeKey: 'orders-pending', section: 'operations' },
  { id: 'customers', label: 'Customers', path: '/customers', icon: Users, section: 'operations' },
  { id: 'products', label: 'Products Catalog', path: '/products', icon: Package, section: 'operations' },
  { id: 'out-of-stock', label: 'Out of Stock', path: '/out-of-stock', icon: AlertTriangle, section: 'operations' },
  { id: 'notifications', label: 'Notifications', path: '/notifications', icon: Bell, section: 'operations' },
  { id: 'shift-handover', label: 'Shift Handover', path: '/shift-handover', icon: ArrowLeftRight, section: 'operations' },

  { id: 'queries', label: 'Support Queries', path: '/queries', icon: HelpCircle, capability: 'queries:view', badgeKey: 'queries-open', section: 'queries' },

  { id: 'routes', label: 'Route Schedule', path: '/admin/routes', icon: MapPin, capability: 'admin', section: 'administration' },
  { id: 'users', label: 'Users', path: '/admin/users', icon: Users, capability: 'admin', section: 'administration' },
  { id: 'teams', label: 'Teams', path: '/admin/teams', icon: UsersRound, capability: 'admin', section: 'administration' },
  { id: 'imports', label: 'Data Imports', path: '/admin/import', icon: Upload, capability: 'admin', section: 'administration' },
  { id: 'audit-logs', label: 'Audit Logs', path: '/admin/audit-logs', icon: FileText, capability: 'admin', section: 'administration' },
  { id: 'settings', label: 'Settings', path: '/admin/settings', icon: Settings, capability: 'admin', section: 'administration' },
];

const SECTION_LABELS: Record<NavSection, string> = {
  work: 'Work',
  operations: 'Operations',
  queries: 'Queries',
  administration: 'Administration',
};

const OPEN_QUERY_STATUSES = ['new', 'open', 'assigned', 'in_progress', 'reopened', 'waiting_customer'];

export interface SidebarProps {
  collapsed: boolean;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, mobileOpen, onMobileClose }) => {
  const { user, dbVersion } = useAuth();

  const badgeCounts = useMemo(() => {
    if (!user) return {};
    const todayStr = new Date().toISOString().split('T')[0];
    const area = getEffectiveArea(user);
    const operationalArea = area === 'ALL' ? undefined : (area as 'KELOWNA' | 'OUTSIDE_KELOWNA');
    let ordersPending = 0;
    try {
      const { operations } = localDb.getDailyOrderOperations({
        date: todayStr,
        operationalArea,
      });
      ordersPending = operations.filter((o) => !isOperationCompleted(o) && !isOperationError(o)).length;
    } catch {
      ordersPending = 0;
    }
    const queriesOpen = localDb.getQueries().filter((q) => OPEN_QUERY_STATUSES.includes(q.status)).length;
    return { 'orders-pending': ordersPending, 'queries-open': queriesOpen };
  }, [user, dbVersion]);

  if (!user) return null;

  const visibleNavItems = NAV_ITEMS.filter((item) => (item.capability ? can(user, item.capability) : true));
  const itemsBySection = (section: NavSection) => visibleNavItems.filter((item) => item.section === section);

  const renderNavItem = (item: SidebarNavItem) => {
    const Icon = item.icon;
    const badge = item.badgeKey ? (badgeCounts[item.badgeKey] ?? 0) : 0;
    const showBadge = item.badgeKey && badge > 0;
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
              ? 'bg-teal-500/15 text-white font-bold'
              : 'text-[#9FB3C8] hover:bg-white/5 hover:text-white'
          )
        }
      >
        {({ isActive }) => (
          <>
            {/* Active Left Indicator Bar */}
            {isActive && !collapsed && (
              <span className="absolute left-0 top-1 bottom-1 w-1 bg-teal-500 rounded-r-full" />
            )}
            <Icon className={cn('w-4 h-4 shrink-0 transition-colors', isActive ? 'text-teal-400' : 'text-[#829AB1] group-hover:text-white')} />
            {!collapsed && (
              <>
                <span className="ml-3 flex-1 truncate">{item.label}</span>
                {showBadge && (
                  <span className={cn('text-2xs px-1.5 py-0.5 rounded-full font-bold uppercase', isActive ? 'bg-teal-500 text-white' : 'bg-[#243B53] text-[#9FB3C8]')}>
                    {badge > 999 ? '999+' : badge}
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
    <div className="px-5 mb-2 text-2xs font-extrabold uppercase tracking-widest text-[#627D98]">
      {label}
    </div>
  );

  const renderContent = () => (
    <div className={cn('flex flex-col h-full bg-[#102A43] text-white', collapsed ? 'w-[72px]' : 'w-64')}>
      {/* Sidebar Brand Header */}
      <div className={cn('h-16 flex items-center border-b border-[#243B53] px-4', collapsed ? 'justify-center' : 'justify-start space-x-3')}>
        <div className="w-8 h-8 rounded-btn bg-teal-500 text-white flex items-center justify-center font-bold shadow-xs shrink-0">
          <ShieldCheck className="w-5 h-5 text-white" />
        </div>
        {!collapsed && (
          <div>
            <span className="font-extrabold text-sm tracking-tight text-white block leading-tight">J&T SUPPLIES</span>
            <span className="text-2xs font-bold text-[#829AB1] uppercase tracking-wider block">CRM Portal</span>
          </div>
        )}
      </div>

      <div className="flex-1 py-4 overflow-y-auto space-y-6">
        {(Object.keys(SECTION_LABELS) as NavSection[])
          .map((section) => ({ section, items: itemsBySection(section) }))
          .filter((group) => group.items.length > 0)
          .map((group) => (
            <div key={group.section}>
              {!collapsed && renderSectionLabel(SECTION_LABELS[group.section])}
              <div className="space-y-1">{group.items.map(renderNavItem)}</div>
            </div>
          ))}
      </div>

      {/* Active Shift Footer */}
      <div className={cn('border-t border-[#243B53] bg-[#091A2B]/60 text-xs text-[#9FB3C8]', collapsed ? 'p-3 text-center' : 'p-4')}>
        <div className={cn('flex items-center justify-between mb-1', collapsed && 'justify-center')}>
          {!collapsed && <span className="font-bold text-xs text-white">Active Shift Session</span>}
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse shrink-0" />
        </div>
        {!collapsed &&
          (user.team ? (
            <div>
              <p className="text-white font-semibold text-xs">{user.team.name}</p>
              <p className="text-2xs text-[#829AB1] font-mono mt-0.5">{user.team.shift_info}</p>
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
          <aside className="absolute inset-y-0 left-0 w-64 bg-[#102A43] text-white shadow-overlay">
            <div className="h-full">{renderContent()}</div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className={cn('hidden md:flex flex-col bg-[#102A43] text-white shrink-0 transition-[width] duration-150 ease-in-out border-r border-[#243B53] shadow-card z-30', collapsed ? 'w-[72px]' : 'w-64')}>
        {renderContent()}
      </aside>
    </>
  );
};
