import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../services/db';
import { notificationService } from '../services/notificationService';
import { CRMNotification } from '../types';
import { Badge, Button, Card, EmptyState, Input, PageHeader, Pagination, Select, TableToolbar, Tabs } from '../components/ui';
import { getNotificationPriorityBadge } from '../utils/badges';
import { formatDateTime } from '../utils/format';
import {
  Bell,
  Search,
  CheckCheck,
  Check,
  RotateCcw,
  X,
  ArrowRight,
  HelpCircle,
  ShoppingBag,
  Package,
  ShieldAlert,
  Clock,
} from 'lucide-react';

const ITEMS_PER_PAGE = 10;

type NotificationsTab = 'all' | 'unread' | 'read';

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [refreshKey, setRefreshKey] = useState(0);

  const [activeTab, setActiveTab] = useState<NotificationsTab>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setRefreshKey((prev) => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  const filteredNotifications = useMemo(() => {
    if (!user) return [];
    return localDb
      .getNotifications(user.id, {
        unreadOnly: activeTab === 'unread',
        priority: priorityFilter !== 'all' ? priorityFilter : undefined,
        entityType: categoryFilter !== 'all' ? categoryFilter : undefined,
        searchTerm,
      })
      .filter((n) => activeTab !== 'read' || n.is_read);
  }, [user, activeTab, priorityFilter, categoryFilter, searchTerm, refreshKey]);

  const totalUnread = useMemo(() => {
    if (!user) return 0;
    return localDb.getUnreadNotificationsCount(user.id);
  }, [user, refreshKey]);

  const totalAll = useMemo(() => {
    if (!user) return 0;
    return localDb.getNotifications(user.id).length;
  }, [user, refreshKey]);

  const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE) || 1;
  const paginatedNotifications = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredNotifications.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredNotifications, currentPage]);

  if (!user) return null;

  const handleClearFilters = () => {
    setActiveTab('all');
    setPriorityFilter('all');
    setCategoryFilter('all');
    setSearchTerm('');
    setCurrentPage(1);
  };

  const hasActiveFilters =
    activeTab !== 'all' || priorityFilter !== 'all' || categoryFilter !== 'all' || searchTerm.trim() !== '';

  const handleMarkAsRead = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    localDb.markNotificationAsRead(id);
    setRefreshKey((prev) => prev + 1);
  };

  const handleMarkAsUnread = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    localDb.markNotificationAsUnread(id);
    setRefreshKey((prev) => prev + 1);
  };

  const handleMarkAllAsRead = () => {
    localDb.markAllNotificationsAsRead(user.id);
    setRefreshKey((prev) => prev + 1);
  };

  const handleNavigateTarget = (linkPath?: string | null, id?: string) => {
    if (id) {
      localDb.markNotificationAsRead(id);
      setRefreshKey((prev) => prev + 1);
    }
    if (linkPath) {
      navigate(linkPath);
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
      <PageHeader
        icon={<Bell className="w-5 h-5 text-brand-400" />}
        title="Notifications & System Alerts"
        description="Centralized notification center for targeted operational alerts and business updates"
        actions={
          totalUnread > 0 ? (
            <Button icon={<CheckCheck className="w-4 h-4" />} onClick={handleMarkAllAsRead}>
              Mark All as Read ({totalUnread})
            </Button>
          ) : undefined
        }
      />

      <TableToolbar>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 mb-3">
          <Tabs
            size="md"
            tabs={[
              { value: 'all' as const, label: 'All Notifications', count: totalAll },
              { value: 'unread' as const, label: 'Unread Only', count: totalUnread },
              { value: 'read' as const, label: 'Read Archive' },
            ]}
            active={activeTab}
            onChange={(value) => {
              setActiveTab(value);
              setCurrentPage(1);
            }}
          />

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700 hover:underline"
            >
              <X className="w-3.5 h-3.5" />
              Clear All Filters
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search notification title or message content..."
            icon={<Search className="w-4 h-4 text-slate-400" />}
            className="pl-9"
          />

          <Select
            value={priorityFilter}
            onChange={(e) => {
              setPriorityFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Priorities</option>
            <option value="urgent">Urgent Priority</option>
            <option value="high">High Priority</option>
            <option value="normal">Normal Priority</option>
            <option value="low">Low Priority</option>
          </Select>

          <Select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setCurrentPage(1);
            }}
          >
            <option value="all">All Notification Categories</option>
            <option value="query">Support Queries</option>
            <option value="order">Customer Orders</option>
            <option value="product">Product Availability</option>
            <option value="system">System & Administration</option>
          </Select>
        </div>
      </TableToolbar>

      <Card flush className="divide-y divide-slate-200">
        {paginatedNotifications.length > 0 ? (
          paginatedNotifications.map((notification) => (
            <div
              key={notification.id}
              onClick={() => handleNavigateTarget(notification.link_path, notification.id)}
              className={`p-5 transition-colors cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                !notification.is_read ? 'bg-sky-50/40 font-medium hover:bg-sky-50/80' : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start gap-3.5 flex-1">
                <div className="mt-1">{getEntityIcon(notification.entity_type)}</div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge badge={getNotificationPriorityBadge(notification.priority || 'normal')} />
                    <h3 className={`text-sm ${!notification.is_read ? 'font-bold text-slate-900' : 'font-semibold text-slate-800'}`}>
                      {notification.title}
                    </h3>
                    {!notification.is_read && <span className="w-2 h-2 rounded-full bg-sky-600 animate-pulse"></span>}
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">{notification.message}</p>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400 font-mono pt-1">
                    <span className="inline-flex items-center gap-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{formatDateTime(notification.created_at)}</span>
                    </span>

                    {notification.actor_profile && (
                      <span>
                        • Triggered by:{' '}
                        <span className="font-semibold text-slate-700">{notification.actor_profile.full_name}</span>
                      </span>
                    )}

                    {notification.is_read && notification.read_at && (
                      <span>• Read: {new Date(notification.read_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                {notification.link_path && (
                  <Button
                    size="sm"
                    variant="outline"
                    icon={<ArrowRight className="w-3.5 h-3.5" />}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigateTarget(notification.link_path, notification.id);
                    }}
                  >
                    Open Record
                  </Button>
                )}

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
          <EmptyState
            icon={<Bell className="w-7 h-7" />}
            title="No Notifications Found"
            description={
              hasActiveFilters
                ? 'No system notifications matched your active filter rules or search query.'
                : 'You have no system notifications in your history.'
            }
            action={
              hasActiveFilters ? (
                <Button variant="ghost" size="sm" onClick={handleClearFilters}>
                  Clear Search & Filters
                </Button>
              ) : undefined
            }
          />
        )}

        {filteredNotifications.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredNotifications.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="notifications"
          />
        )}
      </Card>
    </div>
  );
};
