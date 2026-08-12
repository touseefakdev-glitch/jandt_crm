import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../services/db';
import { notificationService } from '../services/notificationService';
import { fetchDashboardStats, DashboardStats } from '../services/queryService';
import { useServerQuery } from '../hooks/useServerQuery';
import { getNotificationPriorityBadge, getQueryPriorityBadge, getQueryStatusBadge, getRoleBadge } from '../utils/badges';
import { isOperationCompleted, hasOrderException, isStepDone, ORDER_WORKFLOW_STEPS, getPendingStep } from '../utils/orderWorkflow';
import { Avatar, Badge, Card, CardBody, CardHeader, EmptyState, StatCard, Table, TBody, Td, Th, THead, Tr } from '../components/ui';
import { cn } from '../utils/cn';
import {
  Bell,
  HelpCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  Activity,
  ArrowRight,
  CheckCircle2,
  Store,
  Inbox,
  ClipboardList,
  FileText,
  ReceiptText,
  Truck,
  Send,
  TrendingUp,
} from 'lucide-react';

const EMPTY_STATS: DashboardStats = {
  totalCustomers: 0,
  activeCustomers: 0,
  totalProducts: 0,
  activeProducts: 0,
  outOfStock: 0,
  discontinued: 0,
  totalQueries: 0,
  openQueries: 0,
  urgentQueries: 0,
  myOpenQueries: 0,
  unreadNotifications: 0,
  urgentNotifications: 0,
};

const todayStr = () => new Date().toISOString().split('T')[0];

export const Dashboard: React.FC = () => {
  const { user, dbVersion } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => setRefreshKey((prev) => prev + 1));
    return () => unsubscribe();
  }, []);

  const { data: stats } = useServerQuery<DashboardStats>({
    key: JSON.stringify({ nc: 'dashboard-stats', userId: user?.id }),
    fetcher: () => (user ? fetchDashboardStats(user.id) : Promise.resolve(EMPTY_STATS)),
    localFallback: () => {
      const allQueries = localDb.getQueries();
      const allCustomers = localDb.getCustomers();
      const allProducts = localDb.getProducts();
      const activeProducts = allProducts.filter((p) => p.is_active).length;
      const activeCustomers = allCustomers.filter((c) => c.status === 'active').length;
      return {
        totalCustomers: allCustomers.length,
        activeCustomers,
        totalProducts: allProducts.length,
        activeProducts,
        outOfStock: allProducts.filter((p) => p.availability_status === 'out_of_stock').length,
        discontinued: allProducts.filter((p) => p.availability_status === 'discontinued').length,
        totalQueries: allQueries.length,
        openQueries: allQueries.filter((q) => ['new', 'open', 'assigned', 'in_progress', 'reopened'].includes(q.status)).length,
        urgentQueries: allQueries.filter((q) => q.priority === 'urgent' && q.status !== 'closed' && q.status !== 'resolved').length,
        myOpenQueries: user ? allQueries.filter((q) => q.assigned_to === user.id && q.status !== 'closed' && q.status !== 'resolved').length : 0,
        unreadNotifications: user ? localDb.getUnreadNotificationsCount(user.id) : 0,
        urgentNotifications: user ? localDb.getUrgentNotificationsCount(user.id) : 0,
      };
    },
  });

  const userNotifications = useMemo(() => {
    if (!user) return [];
    return localDb.getNotifications(user.id);
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

  /* ── Daily operations metrics (read-only derivation of existing data) ── */
  const todayOps = useMemo(() => {
    try {
      return localDb.getDailyOrderOperations({ date: todayStr() }).operations;
    } catch {
      return [];
    }
  }, [dbVersion, refreshKey]);

  const orderMetrics = useMemo(() => {
    const total = todayOps.length;
    const received = todayOps.filter((o) => o.order_received).length;
    const salesOrders = todayOps.filter((o) => o.sales_order_generated).length;
    const invoiced = todayOps.filter((o) => o.invoiced).length;
    const dispatched = todayOps.filter((o) => o.dispatched).length;
    const podSent = todayOps.filter((o) => o.pod_sent).length;
    const completed = todayOps.filter(isOperationCompleted).length;
    const pending = total - completed;
    const exceptions = todayOps.filter(hasOrderException).length;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, received, salesOrders, invoiced, dispatched, podSent, completed, pending, exceptions, progress };
  }, [todayOps]);

  const recentActivity = useMemo(
    () => [...todayOps].sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()).slice(0, 6),
    [todayOps]
  );

  if (!user) return null;

  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const roleBadge = getRoleBadge(user.role);

  const openQueriesCount = stats?.openQueries ?? 0;
  const urgentQueriesCount = stats?.urgentQueries ?? 0;
  const activeProductsCount = stats?.activeProducts ?? 0;
  const activeCustomersCount = stats?.activeCustomers ?? 0;
  const outOfStockCount = stats?.outOfStock ?? 0;
  const discontinuedCount = stats?.discontinued ?? 0;
  const unreadCount = stats?.unreadNotifications ?? 0;
  const urgentCount = stats?.urgentNotifications ?? 0;

  const queriesRequiringAttention = useMemo(
    () => localDb.getQueries().filter((q) => q.status !== 'closed' && q.status !== 'resolved').slice(0, 5),
    [dbVersion, refreshKey]
  );

  const recentCustomers = useMemo(
    () =>
      [...localDb.getCustomers()]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [dbVersion, refreshKey]
  );

  const workflowSteps = ORDER_WORKFLOW_STEPS.map((s) => {
    const count = orderMetrics.total > 0 ? todayOps.filter((o) => isStepDone(o, s.key)).length : 0;
    const pct = orderMetrics.total > 0 ? Math.round((count / orderMetrics.total) * 100) : 0;
    return { key: s.key, label: s.shortLabel ?? s.label, count, pct };
  });

  const stepIcons: Record<string, React.ReactNode> = {
    order_received: <ClipboardList className="w-3.5 h-3.5" />,
    sales_order_generated: <FileText className="w-3.5 h-3.5" />,
    invoiced: <ReceiptText className="w-3.5 h-3.5" />,
    dispatched: <Truck className="w-3.5 h-3.5" />,
    pod_sent: <Send className="w-3.5 h-3.5" />,
  };

  const stepAccents: Record<string, string> = {
    order_received: 'bg-sky-500',
    sales_order_generated: 'bg-indigo-500',
    invoiced: 'bg-purple-500',
    dispatched: 'bg-emerald-500',
    pod_sent: 'bg-cyan-500',
  };

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="crm-card-dark p-6 sm:p-7 relative overflow-hidden">
        <div className="absolute -right-16 -top-16 w-72 h-72 bg-teal-500/10 rounded-full blur-3xl" aria-hidden="true" />
        <div className="absolute -left-24 -bottom-24 w-64 h-64 bg-teal-400/5 rounded-full blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#9FB3C8] mb-1 font-medium">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>{todayFormatted}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Welcome back, <span className="text-teal-400">{user.full_name}</span>
            </h1>
            <p className="text-xs text-[#9FB3C8] mt-1 font-medium">Internal Operations Control Center — {orderMetrics.total} orders on today's schedule</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge badge={roleBadge} />
            {userTeam && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-[#D9E2EC]">
                <Users className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-bold">{userTeam.name}</span>
                <span className="text-[#627D98]">•</span>
                <Clock className="w-3.5 h-3.5 text-teal-400" />
                <span className="font-mono">{userTeam.shift_info}</span>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Handover Action Banner */}
      {pendingIncomingHandover && (
        <div className="bg-gradient-teal-primary text-white rounded-card shadow-glow-teal p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-[8px] flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-teal-100">Shift Handover Action Required</div>
              <p className="text-xs font-bold mt-0.5">
                {pendingIncomingHandover.outgoing_team?.name || 'Outgoing Team'} submitted a handover with {pendingIncomingHandover.items?.length || 0} item(s).
              </p>
            </div>
          </div>
          <Link
            to="/shift-handover"
            className="inline-flex items-center gap-2 px-4 py-2 bg-navy-900 text-white hover:bg-navy-950 font-bold text-xs rounded-[8px] shadow-xs transition-colors shrink-0"
          >
            Review & Acknowledge <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Operational KPI Row */}
      <div className="grid grid-cols-2 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          title="Orders Today"
          value={orderMetrics.total}
          icon={<Inbox className="w-5 h-5" />}
          accent="brand"
          description={`${orderMetrics.pending} pending · ${orderMetrics.completed} completed`}
          to="/orders"
        />
        <StatCard
          title="Pending Orders"
          value={orderMetrics.pending}
          icon={<Clock className="w-5 h-5" />}
          accent="amber"
          description={`${orderMetrics.exceptions} flagged exceptions`}
          to="/orders"
        />
        <StatCard
          title="Support Queries"
          value={openQueriesCount}
          icon={<HelpCircle className="w-5 h-5" />}
          accent="violet"
          description={`${stats?.myOpenQueries ?? 0} assigned to you (${urgentQueriesCount} urgent)`}
          to="/queries"
        />
        <StatCard
          title="Dispatched"
          value={orderMetrics.dispatched}
          icon={<Truck className="w-5 h-5" />}
          accent="emerald"
          description={`${orderMetrics.podSent} POD sent · ${orderMetrics.podSent > 0 ? '' : ''}${orderMetrics.dispatched - orderMetrics.podSent} POD pending`}
          to="/orders"
        />
      </div>

      {/* Order Activity + Quick Status */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Order Activity */}
        <Card className="xl:col-span-2">
          <CardHeader
            title="Order Activity"
            subtitle="Latest workflow movements on today's schedule"
            actions={
              <Link to="/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                Open Operations <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
            icon={<Activity className="w-4 h-4" />}
          />
          <CardBody className="pt-2">
            {recentActivity.length > 0 ? (
              <div className="divide-y divide-[#E9EFF5]">
                {recentActivity.map((op) => {
                  const pending = getPendingStep(op);
                  return (
                    <Link
                      key={op.id}
                      to="/orders"
                      className="flex items-center gap-3 py-3 px-1 -mx-1.5 rounded-lg transition-colors hover:bg-[#F8FAFD] group"
                    >
                      <Avatar name={op.customer?.company_name || 'Customer'} size="sm" className="shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-bold text-[#132A4A] truncate group-hover:text-teal-700 transition-colors">
                          {op.customer?.company_name || 'Customer'}
                        </div>
                        <div className="text-[10px] text-[#7B8CA4] font-mono truncate">
                          {op.route} · {op.customer?.city || '—'}
                        </div>
                      </div>
                      <div className="shrink-0 text-right">
                        {isOperationCompleted(op) ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                            <CheckCircle2 className="w-3 h-3" /> Completed
                          </span>
                        ) : pending ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-full px-2 py-0.5 whitespace-nowrap">
                            Next: {pending.shortLabel}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-slate-400 rounded-full px-2 py-0.5 whitespace-nowrap">Not started</span>
                        )}
                      </div>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <EmptyState icon={<Inbox className="w-6 h-6" />} title="No orders scheduled today" description="Today's route schedule has no orders yet." />
            )}
          </CardBody>
        </Card>

        {/* Quick Status — workflow funnel */}
        <Card>
          <CardHeader
            title="Workflow Quick Status"
            subtitle={`${orderMetrics.progress}% of today's orders completed`}
            icon={<TrendingUp className="w-4 h-4" />}
          />
          <CardBody className="pt-4">
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs font-bold text-[#132A4A] mb-1.5">
                <span>Overall Progress</span>
                <span className="font-mono text-teal-600 tabular-nums">{orderMetrics.progress}%</span>
              </div>
              <div className="h-2 rounded-full bg-[#E9EFF5] overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-teal-400 to-teal-600 transition-all duration-500"
                  style={{ width: `${orderMetrics.progress}%` }}
                />
              </div>
            </div>
            <div className="space-y-3">
              {workflowSteps.map((s) => (
                <div key={s.key} className="flex items-center gap-3">
                  <span className={cn('w-7 h-7 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs', stepAccents[s.key])}>
                    {stepIcons[s.key]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-bold text-[#132A4A] truncate">{s.label}</span>
                      <span className="font-mono text-[#7B8CA4] tabular-nums">{s.count}/{orderMetrics.total}</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-[#E9EFF5] overflow-hidden">
                      <div className={cn('h-full rounded-full transition-all duration-500', stepAccents[s.key])} style={{ width: `${s.pct}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      </div>

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
          <Table minWidth={1100}>
            <THead>
              <Tr hover={false}>
                <Th width={110}>Ticket #</Th>
                <Th width={220}>Customer</Th>
                <Th width={300}>Subject Line</Th>
                <Th width={110}>Priority</Th>
                <Th width={130}>Status</Th>
                <Th width={170}>Assigned Agent</Th>
                <Th width={100} align="right">Action</Th>
              </Tr>
            </THead>
            <TBody>
              {queriesRequiringAttention.map((q) => (
                <Tr key={q.id}>
                  <Td width={110} className="font-mono font-bold text-brand-700">
                    <Link to={`/queries/${q.id}`} className="hover:underline">{q.query_number}</Link>
                  </Td>
                  <Td width={220} truncate className="font-semibold text-slate-900">{q.customer?.company_name || 'Unknown Customer'}</Td>
                  <Td width={300} truncate maxWidth={300} className="font-medium text-slate-800">{q.subject}</Td>
                  <Td width={110}>
                    <Badge badge={getQueryPriorityBadge(q.priority)} />
                  </Td>
                  <Td width={130}>
                    <Badge badge={getQueryStatusBadge(q.status)} />
                  </Td>
                  <Td width={170} truncate maxWidth={170}>
                    {q.assigned_to_profile ? (
                      <span className="inline-flex items-center gap-2 font-medium text-slate-800">
                        <Avatar name={q.assigned_to_profile.full_name} size="xs" />
                        <span className="truncate">{q.assigned_to_profile.full_name}</span>
                      </span>
                    ) : (
                      <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px] whitespace-nowrap">Unassigned</span>
                    )}
                  </Td>
                  <Td width={100} align="right">
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

      {/* Secondary metrics row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          title="Active Customers"
          value={activeCustomersCount}
          description="Registered business accounts"
          icon={<Store className="w-5 h-5" />}
          accent="navy"
          to="/customers"
        />
        <StatCard
          title="Out of Stock Items"
          value={outOfStockCount}
          description={`${activeProductsCount} products active in catalog`}
          icon={<AlertTriangle className="w-5 h-5" />}
          accent="red"
          to="/out-of-stock"
        />
        <StatCard
          title="Unread Notifications"
          value={unreadCount}
          description={`${urgentCount} High/Urgent priority alerts`}
          icon={<Bell className="w-5 h-5" />}
          accent="amber"
          to="/notifications"
        />
      </div>

      {/* Recent Customers + Product Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Customers */}
        <Card>
          <CardHeader
            title="Recently Added Customers"
            actions={
              <Link to="/customers" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <CardBody className="pt-2">
            {recentCustomers.length > 0 ? (
              <div className="space-y-2">
                {recentCustomers.map((c) => (
                  <Link
                    key={c.id}
                    to={`/customers/${c.id}`}
                    className="flex items-center gap-3 p-3 rounded-xl border border-[#E9EFF5] hover:border-teal-300 hover:bg-teal-50/30 transition-all group"
                  >
                    <Avatar name={c.company_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate group-hover:text-teal-700">{c.company_name}</div>
                      <div className="text-[10px] font-mono text-slate-400">{c.customer_code}</div>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${c.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                      {c.status}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Users className="w-6 h-6" />} title="No customers yet" description="Customers will appear here once added." />
            )}
          </CardBody>
        </Card>

        {/* Product Catalog Summary */}
        <Card>
          <CardHeader
            title="Product Catalog Overview"
            actions={
              <Link to="/products" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                View Full Catalog ({activeProductsCount} Active) <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <CardBody>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
                <div className="text-2xl font-extrabold text-emerald-700 tabular-nums">{activeProductsCount}</div>
                <div className="text-[11px] font-bold text-emerald-600 mt-1 uppercase tracking-wide">Active Products</div>
              </div>
              <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
                <div className="text-2xl font-extrabold text-red-700 tabular-nums">{outOfStockCount}</div>
                <div className="text-[11px] font-bold text-red-600 mt-1 uppercase tracking-wide">Out of Stock</div>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
                <div className="text-2xl font-extrabold text-slate-800 tabular-nums">{discontinuedCount}</div>
                <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Discontinued</div>
              </div>
              <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 text-center">
                <div className="text-2xl font-extrabold text-teal-700 tabular-nums">{activeCustomersCount}</div>
                <div className="text-[11px] font-bold text-teal-600 mt-1 uppercase tracking-wide">Active Customers</div>
              </div>
            </div>
          </CardBody>
        </Card>
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
    </div>
  );
};

export default Dashboard;