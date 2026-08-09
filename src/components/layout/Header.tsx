import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { notificationService } from '../../services/notificationService';
import { forceResyncFromSupabase } from '../../services/supabaseSync';
import { CRMNotification, NotificationPriority } from '../../types';
import { 
  LogOut, 
  User, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Layers, 
  Bell, 
  Check,
  CheckCheck,
  ArrowRight,
  AlertTriangle,
  Info,
  RefreshCw
} from 'lucide-react';

export const Header: React.FC = () => {
  const { user, logout, dbVersion } = useAuth();
  const navigate = useNavigate();
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncClick = async () => {
    setIsSyncing(true);
    try {
      await forceResyncFromSupabase();
    } finally {
      setIsSyncing(false);
    }
  };

  // Subscribe to real-time notification events
  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setRefreshKey(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  const notifications = useMemo(() => {
    if (!user) return [];
    return localDb.getNotifications(user.id);
  }, [user, isNotifOpen, refreshKey]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.is_read).length;
  }, [notifications]);

  if (!user) return null;

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const getRoleBadgeStyle = (role: string) => {
    switch (role) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'sales_agent':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'support_agent':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const formatRoleName = (role: string) => {
    switch (role) {
      case 'admin':
        return 'System Admin';
      case 'sales_agent':
        return 'Sales Agent';
      case 'support_agent':
        return 'Support Agent';
      default:
        return role;
    }
  };

  const handleNotificationClick = (id: string, linkPath?: string | null) => {
    localDb.markNotificationAsRead(id);
    setRefreshKey(prev => prev + 1);
    setIsNotifOpen(false);
    if (linkPath) {
      navigate(linkPath);
    }
  };

  const handleMarkAllRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (user) {
      localDb.markAllNotificationsAsRead(user.id);
      setRefreshKey(prev => prev + 1);
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-red-100 text-red-800 border border-red-200">🔴 URGENT</span>;
      case 'high':
        return <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">🟠 HIGH</span>;
      case 'normal':
        return <span className="text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">🔵 NORMAL</span>;
      case 'low':
        return <span className="text-[10px] font-medium uppercase px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">⚪ LOW</span>;
    }
  };

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      <div className="px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        
        {/* Left Side: Brand Logo & Title */}
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 bg-slate-900 rounded-lg flex items-center justify-center text-white font-bold text-lg shadow-sm">
            <Layers className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-900 tracking-tight leading-tight">
              J&T Supplies <span className="text-sky-600 font-semibold text-xs tracking-wider uppercase ml-1 bg-sky-50 px-2 py-0.5 rounded border border-sky-100">CRM</span>
            </h1>
            <p className="text-xs text-slate-500 hidden sm:block">Internal Operations Management Platform</p>
          </div>
        </div>

        {/* Right Side: User Profile, Team Badge, Notifications, Date, Sign Out */}
        <div className="flex items-center space-x-3 sm:space-x-5">
          
          {/* Current Date */}
          <div className="hidden md:flex items-center text-xs text-slate-600 space-x-1 bg-slate-50 px-2.5 py-1 rounded-md border border-slate-200">
            <Calendar className="w-3.5 h-3.5 text-slate-500" />
            <span>{todayFormatted}</span>
          </div>

          {/* Sync Supabase Live Button */}
          <button
            onClick={handleSyncClick}
            disabled={isSyncing}
            title="Force refresh and sync all data from live Supabase database"
            className="hidden sm:flex items-center space-x-1.5 text-xs text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1 rounded-md border border-emerald-200 transition-colors disabled:opacity-50 font-medium"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-emerald-600' : 'text-emerald-600'}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Supabase'}</span>
          </button>

          {/* User Team & Shift Info */}
          {user.team && (
            <div className="hidden lg:flex items-center text-xs space-x-1.5 bg-slate-50 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-medium text-slate-900">{user.team.name}</span>
              <span className="text-slate-400">|</span>
              <span className="text-slate-600 font-mono text-[11px]">{user.team.shift_info}</span>
            </div>
          )}

          {/* Notification Bell Center */}
          <div className="relative">
            <button
              onClick={() => setIsNotifOpen(!isNotifOpen)}
              title="System Alerts & Notifications"
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors relative"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {isNotifOpen && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                
                {/* Popover Header */}
                <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs font-bold">
                  <div className="flex items-center space-x-2">
                    <Bell className="w-4 h-4 text-sky-400" />
                    <span>Notifications & Alerts ({unreadCount} Unread)</span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllRead}
                      className="text-[11px] text-sky-300 hover:text-white underline font-normal flex items-center space-x-1"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      <span>Mark all read</span>
                    </button>
                  )}
                </div>

                {/* Popover Body List */}
                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {notifications.length > 0 ? (
                    notifications.slice(0, 8).map(n => (
                      <div
                        key={n.id}
                        onClick={() => handleNotificationClick(n.id, n.link_path)}
                        className={`p-3 text-xs cursor-pointer transition-colors hover:bg-slate-50 ${
                          !n.is_read ? 'bg-sky-50/60 font-medium' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center space-x-1.5">
                            {getPriorityBadge(n.priority || 'normal')}
                            <span className="font-bold text-slate-900 truncate max-w-[170px]">{n.title}</span>
                          </div>
                          <span className="text-[10px] text-slate-400 font-mono">
                            {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-slate-600 leading-snug text-[11px] line-clamp-2">{n.message}</p>
                      </div>
                    ))
                  ) : (
                    <div className="p-6 text-center text-xs text-slate-500 italic">
                      No system notifications at this time.
                    </div>
                  )}
                </div>

                {/* Popover Footer Link */}
                <div className="p-2 bg-slate-50 border-t border-slate-200 text-center">
                  <Link
                    to="/notifications"
                    onClick={() => setIsNotifOpen(false)}
                    className="inline-flex items-center justify-center space-x-1.5 text-xs font-bold text-sky-700 hover:text-sky-800 hover:underline py-1 w-full"
                  >
                    <span>View All Notifications Page</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

              </div>
            )}
          </div>

          {/* User Info & Role Badge */}
          <div className="flex items-center space-x-3 pl-2 border-l border-slate-200">
            <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 flex items-center justify-center text-slate-700 font-semibold text-xs">
              {user.full_name ? user.full_name.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </div>
            
            <div className="hidden sm:block text-left">
              <div className="flex items-center space-x-2">
                <span className="text-xs font-semibold text-slate-900 leading-none">{user.full_name}</span>
              </div>
              <div className="mt-1 flex items-center space-x-1">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${getRoleBadgeStyle(user.role)}`}>
                  <ShieldCheck className="w-3 h-3 mr-0.5" />
                  {formatRoleName(user.role)}
                </span>
              </div>
            </div>
          </div>

          {/* Sign Out Button */}
          <button
            onClick={logout}
            title="Sign Out of CRM"
            className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors border border-transparent hover:border-red-200"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>

        </div>
      </div>
    </header>
  );
};
