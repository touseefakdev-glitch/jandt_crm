import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../services/db';
import { notificationService } from '../services/notificationService';
import { formatCurrency } from '../utils/format';
import { getNotificationPriorityBadge, getOrderStatusBadge, getQueryPriorityBadge, getQueryStatusBadge, getRoleBadge } from '../utils/badges';
import { Avatar, Badge, Card, CardBody, CardHeader, EmptyState, StatCard, Table, TBody, Td, Th, THead, Tr } from '../components/ui';
import {
  Bell,
  ShoppingBag,
  HelpCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  Activity,
  ArrowRight,
  CheckCircle2,
  CheckCheck,
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user, dbVersion } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => setRefreshKey((prev) => prev + 1));
    return () => unsubscribe();
  }, []);

  const allQueries = useMemo(() => localDb.getQueries(), [dbVersion]);
  const allOrders = useMemo(() => localDb.getOrders(), [dbVersion]);
  const outOfStockProducts = useMemo(() => localDb.getOutOfStockProducts(), [dbVersion]);

  const userNotifications = useMemo(() => {
    if (!user) return [];
    return localDb.getNotifications(user.id);
  }, [user, refreshKey, dbVersion]);

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return localDb.getUnreadNotificationsCount(user.id);
  }, [user, refreshKey, dbVersion]);

  const urgentCount = useMemo(() => {
    if (!user) return 0;
    return localDb.getUrgentNotificationsCount(user.id);
  }, [user, refreshKey, dbVersion]);

  const userTeam = useMemo(() => {
    if (!user) return null;
    const teams = localDb.getTeams();
    return teams.find((t) => t.id === user.team_id) || teams[0];
  }, [user]);

  const latestHandover = useMemo(() => {
    if (!userTeam) return null;
    const list = localDb.getHandovers();
    return list.find((h) => h.incoming_team_id === userTeam.id || h.outgoing_team_id === userTeam.id) || list[0] || null;
  }, [userTeam, refreshKey]);

  const pendingIncomingHandover = useMemo(() => {
    if (!userTeam) return null;
    return localDb.getHandovers({ status: 'submitted' }).find((h) => h.incoming_team_id === userTeam.id) || null;
  }, [userTeam, refreshKey]);

  if (!user) return null;

  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const roleBadge = getRoleBadge(user.role);

  const openQueriesCount = allQueries.filter((q) => ['new', 'open', 'assigned', 'in_progress', 'reopened'].includes(q.status)).length;
  const urgentQueriesCount = allQueries.filter((q) => q.priority === 'urgent' && q.status !== 'closed' && q.status !== 'resolved').length;
  const myOpenQueriesCount = allQueries.filter((q) => q.assigned_to === user.id && q.status !== 'closed' && q.status !== 'resolved').length;

  const pendingOrdersCount = allOrders.filter((o) => o.current_status !== 'completed' && o.current_status !== 'cancelled').length;

  const ordersRequiringAttention = allOrders.filter((o) => o.current_status !== 'completed' && o.current_status !== 'cancelled').slice(0, 5);
  const queriesRequiringAttention = allQueries.filter((q) => q.status !== 'closed' && q.status !== 'resolved').slice(0, 5);

  const nextOrderAction = (status: string) => {
    switch (status) {
      case 'order_received': return 'Complete Sales Order';
      case 'sales_order_done': return 'Issue Commercial Invoice';
      case 'invoiced': return 'Dispatch Freight Shipment';
      case 'dispatched': return 'Obtain Signed Invoice';
      case 'signed_invoice_sent': return 'Finalize Order';
      default: return '—';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-900 to-brand-900 rounded-2xl p-6 sm:p-8 text-white shadow-card relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-brand-600/20 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute right-24 bottom-0 w-32 h-32 bg-brand-500/10 rounded-full blur-2xl" aria-hidden="true" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-300 mb-2">
              <Calendar className="w-4 h-4 text-brand-300" />
              <span>{todayFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="text-brand-300">{user.full_name}</span>
            </h1>
            <p className="text-sm text-slate-300 mt-1.5">Here is your operational overview for J&T Supplies CRM.</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge badge={roleBadge} />
            {userTeam && (
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium bg-white/10 ring-1 ring-white/20 text-slate-100">
                <Users className="w-3.5 h-3.5 text-brand-300" />
                <span className="font-semibold">{userTeam.name}</span>
                <span className="text-slate-400">•</span>
                <Clock className="w-3.5 h-3.5 text-brand-300" />
                <span className="font-mono">{userTeam.shift_info}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Handover Action Banner */}
      {pendingIncomingHandover && (
        <div className="bg-brand-600 text-white rounded-xl shadow-card border border-brand-700 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 bg-white/15 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] font-extrabold uppercase tracking-wider text-brand-200">Shift Handover Action Required</div>
              <p className="text-sm font-semibold mt-0.5">
                {pendingIncomingHandover.outgoing_team?.name || 'Outgoing Team'} submitted a handover with {pendingIncomingHandover.items?.length || 0} item(s).
              </p>
            </div>
          </div>
          <Link
            to="/shift-handover"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-white text-brand-900 hover:bg-brand-50 font-semibold text-sm rounded-lg shadow-sm transition-colors shrink-0"
          >
            Review & Acknowledge <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Shift & Team Operations */}
      <Card>
        <CardHeader
          title="Shift & Team Operations Status"
          actions={
            <Link to="/shift-handover" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              Open Shift Handover Center <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <CardBody>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Active Operational Team</span>
              <div className="text-lg font-bold text-slate-900">{userTeam ? userTeam.name : 'Team 1'}</div>
              <span className="text-xs text-slate-500 font-mono">{userTeam ? userTeam.shift_info : '3 PM – 11 AM'}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Shift Status</span>
              <div className="text-lg font-bold text-emerald-600 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" /> Active
              </div>
              <span className="text-xs text-slate-500">Flexible Overnight Schedule</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Latest Handover Status</span>
              <div className="text-lg font-bold text-slate-900">
                {latestHandover ? (
                  latestHandover.status === 'acknowledged' ? (
                    <span className="text-emerald-700 flex items-center gap-1.5"><CheckCheck className="w-4 h-4" /> Acknowledged</span>
                  ) : (
                    <span className="text-brand-700 flex items-center gap-1.5"><Clock className="w-4 h-4" /> Submitted</span>
                  )
                ) : (
                  'No Handover'
                )}
              </div>
              <span className="text-xs text-slate-500">
                {latestHandover?.submitted_at ? `Submitted: ${new Date(latestHandover.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Operational handoffs active'}
              </span>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">Pending Handover Items</span>
              <div className="text-lg font-bold text-slate-900">{latestHandover?.items ? latestHandover.items.filter((i) => !i.is_completed).length : 0} Items</div>
              <span className="text-xs text-slate-500">Flagged tasks requiring follow-up</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard
          title="Unread Notifications"
          value={unreadCount}
          description={`${urgentCount} High/Urgent priority alert${urgentCount === 1 ? '' : 's'}`}
          icon={<Bell className="w-5 h-5" />}
          accent="brand"
          to="/notifications"
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrdersCount}
          description="Active orders progressing through workflow"
          icon={<ShoppingBag className="w-5 h-5" />}
          accent="emerald"
          to="/orders"
        />
        <StatCard
          title="Open Support Queries"
          value={openQueriesCount}
          description={`${myOpenQueriesCount} assigned to you (${urgentQueriesCount} urgent)`}
          icon={<HelpCircle className="w-5 h-5" />}
          accent="amber"
          to="/queries"
        />
        <StatCard
          title="Out of Stock Items"
          value={outOfStockProducts.length}
          description="Catalog products currently marked unavailable"
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="red"
          to="/out-of-stock"
        />
      </div>

      {/* Recent Notifications */}
      {userNotifications.length > 0 && (
        <Card>
          <CardHeader
            title="Recent Operational Alerts & Notifications"
            actions={
              <Link to="/notifications" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                View Notifications Center ({unreadCount} Unread) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <CardBody className="pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {userNotifications.slice(0, 3).map((n) => (
                <Link
                  key={n.id}
                  to={n.link_path || '/notifications'}
                  className={`p-4 rounded-xl border transition-all block group ${!n.is_read ? 'bg-brand-50/40 border-brand-200 hover:border-brand-400' : 'bg-slate-50/40 border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Badge badge={getNotificationPriorityBadge(n.priority || 'normal')} />
                    <span className="text-[10px] font-mono text-slate-400">{new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                  <div className="font-bold text-xs text-slate-900 group-hover:text-brand-600 truncate">{n.title}</div>
                  <p className="text-[11px] text-slate-600 leading-snug line-clamp-2 mt-1">{n.message}</p>
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Orders Requiring Attention */}
      <Card>
        <CardHeader
          title="Orders Requiring Workflow Attention"
          actions={
            <Link to="/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              View All Orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        {ordersRequiringAttention.length > 0 ? (
          <Table>
            <THead>
              <Tr hover={false}>
                <Th>Order Number</Th>
                <Th>Customer</Th>
                <Th>Current Status</Th>
                <Th>Next Action Required</Th>
                <Th className="font-mono">Grand Total</Th>
                <Th className="text-right">Action</Th>
              </Tr>
            </THead>
            <TBody>
              {ordersRequiringAttention.map((order) => (
                <Tr key={order.id}>
                  <Td className="font-mono font-bold text-brand-700">
                    <Link to={`/orders/${order.id}`} className="hover:underline">{order.order_number}</Link>
                  </Td>
                  <Td className="font-semibold text-slate-900">{order.customer?.company_name || 'Unknown'}</Td>
                  <Td>
                    <Badge badge={getOrderStatusBadge(order.current_status)} />
                  </Td>
                  <Td className="font-medium text-slate-800">{nextOrderAction(order.current_status)}</Td>
                  <Td className="font-mono font-bold text-slate-900">{formatCurrency(order.grand_total)}</Td>
                  <Td className="text-right">
                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
                    >
                      Process <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState icon={<ShoppingBag className="w-7 h-7" />} title="All orders are up to date" description="No active orders currently require workflow attention." />
        )}
      </Card>

      {/* Support Tickets Requiring Attention */}
      <Card>
        <CardHeader
          title="Active Support Tickets Requiring Attention"
          actions={
            <Link to="/queries" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              View Support Workspace ({openQueriesCount} Open) <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        {queriesRequiringAttention.length > 0 ? (
          <Table>
            <THead>
              <Tr hover={false}>
                <Th>Ticket #</Th>
                <Th>Customer</Th>
                <Th>Subject Line</Th>
                <Th>Priority</Th>
                <Th>Status</Th>
                <Th>Assigned Agent</Th>
                <Th className="text-right">Action</Th>
              </Tr>
            </THead>
            <TBody>
              {queriesRequiringAttention.map((q) => (
                <Tr key={q.id}>
                  <Td className="font-mono font-bold text-brand-700">
                    <Link to={`/queries/${q.id}`} className="hover:underline">{q.query_number}</Link>
                  </Td>
                  <Td className="font-semibold text-slate-900">{q.customer?.company_name || 'Unknown Customer'}</Td>
                  <Td className="max-w-xs truncate font-medium text-slate-800" title={q.subject}>{q.subject}</Td>
                  <Td>
                    <Badge badge={getQueryPriorityBadge(q.priority)} />
                  </Td>
                  <Td>
                    <Badge badge={getQueryStatusBadge(q.status)} />
                  </Td>
                  <Td>
                    {q.assigned_to_profile ? (
                      <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                        <Avatar name={q.assigned_to_profile.full_name} size="xs" />
                        {q.assigned_to_profile.full_name}
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">Unassigned</span>
                    )}
                  </Td>
                  <Td className="text-right">
                    <Link
                      to={`/queries/${q.id}`}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs rounded-lg transition-colors"
                    >
                      Manage <ArrowRight className="w-3 h-3" />
                    </Link>
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <EmptyState icon={<HelpCircle className="w-7 h-7" />} title="No active tickets" description="No active support tickets currently require attention." />
        )}
      </Card>

      {/* Bottom Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {outOfStockProducts.length > 0 && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-6 shadow-card flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-red-950 font-bold">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="text-base font-bold">Product Availability Alerts</h3>
                </div>
                <Link to="/out-of-stock" className="text-xs font-bold text-red-700 hover:underline">View All ({outOfStockProducts.length})</Link>
              </div>
              <div className="space-y-2 text-xs">
                {outOfStockProducts.slice(0, 2).map((p) => (
                  <Link key={p.id} to={`/products/${p.id}`} className="p-3 bg-white rounded-lg border border-red-200 flex items-center justify-between block hover:border-red-400">
                    <div>
                      <span className="font-mono font-bold text-brand-700 mr-2">{p.sku}</span>
                      <span className="font-bold text-slate-900">{p.product_name}</span>
                    </div>
                    <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold uppercase">Unavailable</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="bg-white rounded-xl p-6 shadow-card border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 text-slate-900 font-bold mb-3">
              <Activity className="w-5 h-5 text-violet-600" />
              <h3 className="text-base font-bold">System Module Status</h3>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-2.5">
              {[
                'Customer Management',
                'Support Ticket System',
                'Order Management',
                'Product Availability',
                'Notifications & Alerts',
                'Shift Handover & Operations',
              ].map((module) => (
                <div key={module} className="flex items-center justify-between">
                  <span>{module}:</span>
                  <span className="text-emerald-600 font-bold flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" /> Active</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
