import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { notificationService } from '../../services/notificationService';
import { forceResyncFromSupabase, checkSupabaseConnection, getSupabaseConnectionState, getLastConnectionError, getSupabaseConfig, subscribeToConnectionState, SupabaseConnectionState } from '../../services/supabaseSync';
import { CRMNotification, NotificationPriority } from '../../types';
import { cn } from '../../utils/cn';
import { getNotificationPriorityBadge, getRoleBadge } from '../../utils/badges';
import { formatTime } from '../../utils/format';
import { Avatar } from '../ui/Avatar';
import { Badge } from '../ui/Badge';
import {
  LogOut,
  Clock,
  Calendar,
  Bell,
  CheckCheck,
  ArrowRight,
  AlertTriangle,
  RefreshCw,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ShieldCheck,
} from 'lucide-react';
import { useClickOutside } from '../../hooks/useClickOutside';

export interface HeaderProps {
  onOpenMobileNav: () => void;
  sidebarCollapsed: boolean;
  onToggleSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileNav, sidebarCollapsed, onToggleSidebar }) => {
  const { user, logout, dbVersion } = useAuth();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [connState, setConnState] = useState<SupabaseConnectionState>(() => getSupabaseConnectionState());
  const [connError, setConnError] = useState<string | null>(() => getLastConnectionError());
  const [connHost, setConnHost] = useState<string | null>(() => getSupabaseConfig().host);
  const [connKeyPrefix, setConnKeyPrefix] = useState<string>(() => getSupabaseConfig().keyPrefix);

  const notifRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  useClickOutside(notifRef, () => setIsNotifOpen(false));
  useClickOutside(userMenuRef, () => setIsUserMenuOpen(false));

  useEffect(() => {
    const unsubscribe = subscribeToConnectionState((state) => {
      setConnState(state);
      setConnError(getLastConnectionError());
      setConnHost(getSupabaseConfig().host);
      setConnKeyPrefix(getSupabaseConfig().keyPrefix);
    });
    checkSupabaseConnection().then((state) => {
      setConnState(state);
      setConnError(getLastConnectionError());
    });
    return unsubscribe;
  }, []);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      await forceResyncFromSupabase();
    } finally {
      const state = await checkSupabaseConnection();
      setConnState(state);
      setConnError(getLastConnectionError());
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setRefreshKey((prev) => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  const notifications = useMemo(() => {
    if (!user) return [];
    return localDb.getNotifications(user.id);
  }, [user, isNotifOpen, refreshKey, dbVersion]);

  const unreadCount = useMemo(() => notifications.filter((n) => !n.is_read).length, [notifications]);

  if (!user) return null;

  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' });
  const roleBadge = getRoleBadge(user.role);

  const handleNotificationClick = (id: string, linkPath?: string | null) => {
    localDb.markNotificationAsRead(id);
    setRefreshKey((prev) => prev + 1);
    setIsNotifOpen(false);
    if (linkPath) navigate(linkPath);
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user) {
      localDb.markAllNotificationsAsRead(user.id);
      setRefreshKey((prev) => prev + 1);
    }
  };

  const renderConnPill = () => {
    if (connState === 'online') {
      return (
        <span title={`Connected to ${connHost} — showing live data`} className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          Supabase Live
        </span>
      );
    }
    if (connState === 'not_configured') {
      return (
        <span title={connError || 'No Supabase credentials for this build.'} className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Local Mode
        </span>
      );
    }
    if (connState === 'offline') {
      return (
        <span
          title={`Host: ${connHost || 'none'} — ${connError || 'cannot reach Supabase'}`}
          className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
          Local Storage Mode
        </span>
      );
    }
    return (
      <span className="hidden lg:inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 bg-slate-50 px-2.5 py-1.5 rounded-lg border border-slate-200">
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
        Checking...
      </span>
    );
  };

  return (
    <header className="bg-white border-b border-[#D9E2EC] sticky top-0 z-40 shadow-xs">
      <div className="h-14 px-3 sm:px-5 lg:px-6 flex items-center justify-between gap-3">
        {/* Left: menu + brand */}
        <div className="flex items-center gap-2 min-w-0">
          <button onClick={onOpenMobileNav} aria-label="Open navigation" className="md:hidden p-2 -ml-1 text-[#52606D] hover:text-[#172B4D] hover:bg-[#E9EFF5] rounded-[8px] transition-colors">
            <Menu className="w-5 h-5" />
          </button>
          <button
            onClick={onToggleSidebar}
            aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="hidden md:inline-flex p-2 text-[#829AB1] hover:text-[#172B4D] hover:bg-[#E9EFF5] rounded-[8px] transition-colors"
          >
            {sidebarCollapsed ? <PanelLeftOpen className="w-[18px] h-[18px]" /> : <PanelLeftClose className="w-[18px] h-[18px]" />}
          </button>
          <Link to="/dashboard" className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-teal-500 rounded-[8px] flex items-center justify-center shadow-xs shrink-0">
              <span className="text-white font-extrabold text-sm tracking-tight">JT</span>
            </div>
            <div className="min-w-0 hidden sm:block">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-extrabold text-[#172B4D] tracking-tight leading-tight truncate">J&T Supplies</h1>
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold tracking-wider uppercase bg-teal-50 text-teal-800 border border-teal-200">
                  CRM
                </span>
              </div>
              <p className="text-[11px] text-[#52606D] truncate leading-tight font-medium">Internal Operations Platform</p>
            </div>
          </Link>
        </div>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {renderConnPill()}

          <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            title="Force refresh and sync all data from live Supabase database"
            className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-bold text-teal-800 bg-teal-50 hover:bg-teal-100 px-2.5 py-1.5 rounded-[8px] border border-teal-200 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isSyncing && 'animate-spin')} />
            {isSyncing ? 'Syncing...' : 'Sync'}
          </button>

          {user.team && (
            <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-medium text-[#52606D] bg-[#F5F7FA] border border-[#D9E2EC] px-2.5 py-1.5 rounded-[8px]">
              <Clock className="w-3.5 h-3.5 text-[#829AB1]" />
              <span className="font-bold text-[#172B4D]">{user.team.name}</span>
              <span className="text-[#D9E2EC]">|</span>
              <span className="font-mono text-[#52606D]">{user.team.shift_info}</span>
            </span>
          )}

          <span className="hidden 2xl:inline-flex items-center gap-1.5 text-[11px] font-medium text-[#52606D] bg-[#F5F7FA] border border-[#D9E2EC] px-2.5 py-1.5 rounded-[8px]">
            <Calendar className="w-3.5 h-3.5 text-[#829AB1]" />
            {todayFormatted}
          </span>

          {/* Notifications */}
          <div className="relative" ref={notifRef}>
            <button
              onClick={() => {
                setIsNotifOpen((v) => !v);
                setIsUserMenuOpen(false);
              }}
              title="System Alerts & Notifications"
              className="relative p-2 text-[#52606D] hover:text-[#172B4D] hover:bg-[#E9EFF5] rounded-[8px] transition-colors"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-[12px] shadow-popover border border-[#D9E2EC] z-50 overflow-hidden animate-scale-in">
                <div className="px-4 py-3 bg-[#102A43] text-white flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Bell className="w-4 h-4 text-teal-400" />
                    <span>Notifications ({unreadCount} unread)</span>
                  </div>
                  {unreadCount > 0 && (
                    <button onClick={handleMarkAllRead} className="text-[11px] text-brand-300 hover:text-white underline font-normal flex items-center gap-1">
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 8).map((n) => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n.id, n.link_path)}
                        className={cn('p-3 text-xs cursor-pointer transition-colors hover:bg-slate-50', !n.is_read && 'bg-brand-50/40 font-medium')}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <Badge badge={getNotificationPriorityBadge(n.priority || 'normal')} />
                            <span className="font-bold text-slate-900 truncate">{n.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">{formatTime(n.created_at)}</span>
                        </div>
                        <p className="text-slate-600 leading-snug text-[11px] line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-8 text-center text-xs text-slate-400 italic">No system notifications at this time.</div>
                  )}
                </div>
                <div className="p-2 bg-slate-50 border-t border-slate-200 text-center">
                  <Link to="/notifications" onClick={() => setIsNotifOpen(false)} className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-brand-700 hover:text-brand-800 hover:underline py-1 w-full">
                    View All Notifications
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => {
                setIsUserMenuOpen((v) => !v);
                setIsNotifOpen(false);
              }}
              className="flex items-center gap-2 pl-2.5 border-l border-slate-200 hover:bg-slate-50 -mr-1 rounded-lg py-1.5 pr-2 transition-colors"
            >
              <Avatar name={user.full_name} size="sm" />
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold text-slate-900 leading-tight max-w-[120px] truncate">{user.full_name}</div>
                <div className="flex items-center gap-1 text-[10px] text-slate-500 leading-tight">
                  <span className={cn('w-1.5 h-1.5 rounded-full', roleBadge.dot)} />
                  <span className="font-medium">{roleBadge.label}</span>
                </div>
              </div>
              <ChevronDown className={cn('w-3.5 h-3.5 text-slate-400 hidden sm:block transition-transform', isUserMenuOpen && 'rotate-180')} />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-popover border border-slate-200 z-50 overflow-hidden animate-scale-in">
                <div className="px-4 py-3.5 border-b border-slate-100 flex items-center gap-3">
                  <Avatar name={user.full_name} size="md" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-slate-900 truncate">{user.full_name}</p>
                    <p className="text-xs text-slate-500 font-mono truncate">{user.email}</p>
                  </div>
                </div>
                <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    Role
                  </span>
                  <Badge badge={roleBadge} />
                </div>
                {user.team && (
                  <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-medium text-slate-500 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" />
                      Team / Shift
                    </span>
                    <span className="text-xs font-semibold text-slate-800">{user.team.name}</span>
                  </div>
                )}
                <button onClick={logout} className="w-full px-4 py-3 text-left text-xs font-semibold text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors">
                  <LogOut className="w-4 h-4" />
                  Sign Out of CRM
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
