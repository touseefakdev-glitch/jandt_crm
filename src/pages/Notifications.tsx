import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../services/db';
import { notificationService } from '../services/notificationService';
import { CRMNotification, NotificationPriority } from '../types';
import { 
  Bell, 
  Search, 
  CheckCheck, 
  Check, 
  RotateCcw, 
  X, 
  ChevronLeft, 
  ChevronRight,
  ArrowRight,
  HelpCircle,
  ShoppingBag,
  Package,
  ShieldAlert,
  Calendar,
  AlertTriangle,
  Clock,
  Filter
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);

  // Filter states
  const [activeTab, setActiveTab] = useState<'all' | 'unread' | 'read'>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Real-time notification subscription
  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setRefreshKey(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  if (!user) return null;

  // Fetch filtered notifications
  const filteredNotifications = useMemo(() => {
    return localDb.getNotifications(user.id, {
      unreadOnly: activeTab === 'unread',
      priority: priorityFilter !== 'all' ? priorityFilter : undefined,
      entityType: categoryFilter !== 'all' ? categoryFilter : undefined,
      searchTerm,
    }).filter(n => activeTab !== 'read' || n.is_read);
  }, [user.id, activeTab, priorityFilter, categoryFilter, searchTerm, refreshKey]);

  const totalUnread = useMemo(() => {
    return localDb.getUnreadNotificationsCount(user.id);
  }, [user.id, refreshKey]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotifications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotifications, currentPage]);

  const handleClearFilters = () => {
    setActiveTab('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters = activeTab !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchTerm.trim() !== '';

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    localDb.markNotificationAsRead(id);
    setRefreshKey(prev => prev + 1);
  };

  const handleMarkAsUnread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    localDb.markNotificationAsUnread(id);
    setRefreshKey(prev => prev + 1);
  };

  const handleMarkAllAsRead = () => {
    localDb.markAllNotificationsAsRead(user.id);
    setRefreshKey(prev => prev + 1);
  };

  const handleNavigateTarget = (linkPath?: string | null, id?: string) => {
    if (id) {
      localDb.markNotificationAsRead(id);
      setRefreshKey(prev => prev + 1);
    }
    if (linkPath) {
      navigate(linkPath);
    }
  };

  const getPriorityBadge = (priority: NotificationPriority) => {
    switch (priority) {
      case 'urgent':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-red-100 text-red-800 border border-red-200">
            🔴 URGENT
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-100 text-amber-800 border border-amber-200">
            🟠 HIGH
          </span>
        );
      case 'normal':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold uppercase bg-sky-100 text-sky-800 border border-sky-200">
            🔵 NORMAL
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium uppercase bg-slate-100 text-slate-700 border border-slate-200">
            ⚪ LOW
          </span>
        );
    }
  };

  const getEntityIcon = (entityType?: string | null) => {
    switch (entityType) {
      case 'query':
        return <HelpCircle className="w-4 h-4 text-sky-600 shrink-0" />;
      case 'order':
        return <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />;
      case 'product':
        return <Package className="w-4 h-4 text-purple-600 shrink-0" />;
      default:
        return <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Page Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xs">
            <Bell className="w-5 h-5 text-sky-400" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Notifications & System Alerts</h1>
            <p className="text-xs text-slate-500">Centralized notification center for targeted operational alerts and business updates</p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {totalUnread > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="inline-flex items-center px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-lg transition-colors shadow-xs space-x-1.5"
            >
              <CheckCheck className="w-4 h-4" />
              <span>Mark All as Read ({totalUnread})</span>
            </button>
          )}
        </div>
      </div>

      {/* View Tabs & Filter Controls */}
      <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm space-y-4">
        
        {/* Tabs Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => { setActiveTab('all'); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'all' ? 'bg-slate-900 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              All Notifications ({localDb.getNotifications(user.id).length})
            </button>
            <button
              onClick={() => { setActiveTab('unread'); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors flex items-center space-x-1.5 ${
                activeTab === 'unread' ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <span>Unread Only</span>
              {totalUnread > 0 && (
                <span className="bg-white text-sky-800 px-1.5 py-0.2 text-[10px] rounded-full font-extrabold">{totalUnread}</span>
              )}
            </button>
            <button
              onClick={() => { setActiveTab('read'); setCurrentPage(1); }}
              className={`px-4 py-2 text-xs font-bold rounded-lg transition-colors ${
                activeTab === 'read' ? 'bg-slate-700 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Read Archive
            </button>
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              <span>Clear All Filters</span>
            </button>
          )}
        </div>

        {/* Search & Select Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              placeholder="Search notification title or message content..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
            />
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={priorityFilter}
              onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">All Priorities</option>
              <option value="urgent">🔴 Urgent Priority</option>
              <option value="high">🟠 High Priority</option>
              <option value="normal">🔵 Normal Priority</option>
              <option value="low">⚪ Low Priority</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            >
              <option value="all">All Notification Categories</option>
              <option value="query">🎫 Support Queries</option>
              <option value="order">📦 Customer Orders</option>
              <option value="product">🏷️ Product Availability</option>
              <option value="system">⚙️ System & Administration</option>
            </select>
          </div>

        </div>

      </div>

      {/* Notifications Data List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden divide-y divide-slate-200">
        {paginatedNotifications.length > 0 ? (
          paginatedNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNavigateTarget(notification.link_path, notification.id)}
              className={`p-5 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                !notification.is_read ? 'bg-sky-50/40 font-medium hover:bg-sky-50/80' : 'hover:bg-slate-50'
              }`}
            >
              
              {/* Notification Details Left */}
              <div className="flex items-start space-x-3.5 flex-1">
                <div className="mt-1">
                  {getEntityIcon(notification.entity_type)}
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    {getPriorityBadge(notification.priority || 'normal')}
                    <h3 className={`text-sm ${!notification.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>
                    )}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                    {notification.message}
                  </p>

                  <div className="flex items-center space-x-3 text-[11px] text-slate-400 font-mono pt-1">
                    <span className="flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(notification.created_at).toLocaleString()}</span>
                    </span>

                    {notification.actor_profile && (
                      <span>• Triggered by: <span className="font-semibold text-slate-700">{notification.actor_profile.full_name}</span></span>
                    )}

                    {notification.is_read && notification.read_at && (
                      <span>• Read: {new Date(notification.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Controls Right */}
              <div className="flex items-center space-x-2 shrink-0 self-end md:self-center">
                
                {/* Direct Link Action */}
                {notification.link_path && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateTarget(notification.link_path, notification.id);
                    }}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-lg border border-sky-200 transition-colors space-x-1"
                  >
                    <span>Open Record</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                )}

                {/* Read / Unread Toggle Button */}
                {!notification.is_read ? (
                  <button
                    onClick={(e) => handleMarkAsRead(notification.id, e)}
                    title="Mark as Read"
                    className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-200"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    onClick={(e) => handleMarkAsUnread(notification.id, e)}
                    title="Mark as Unread"
                    className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors border border-transparent hover:border-amber-200"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>
                )}

              </div>

            </div>
          ))
        ) : (
          /* Empty State */
          <div className="p-12 text-center">
            <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
              <Bell className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 mb-1">No Notifications Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mb-4">
              {hasActiveFilters
                ? 'No system notifications matched your active filter rules or search query.'
                : 'You have no system notifications in your history.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="text-xs font-semibold text-sky-600 hover:underline"
              >
                Clear Search & Filters
              </button>
            )}
          </div>
        )}

        {/* Pagination Footer */}
        {filteredNotifications.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, filteredNotifications.length)}</span> to{' '}
              <span className="font-semibold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, filteredNotifications.length)}</span> of{' '}
              <span className="font-semibold text-slate-900">{filteredNotifications.length}</span> notifications
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-800 px-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:hover:bg-white text-slate-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

      </div>

    </div>
  );
};
