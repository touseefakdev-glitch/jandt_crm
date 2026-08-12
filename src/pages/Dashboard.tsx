import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../services/db';
import { notificationService } from '../services/notificationService';
import { fetchDashboardStats, DashboardStats } from '../services/queryService';
import { useServerQuery } from '../hooks/useServerQuery';
import { getNotificationPriorityBadge, getQueryPriorityBadge, getQueryStatusBadge, getRoleBadge } from '../utils/badges';
import { MyWorkQueues } from '../components/work/MyWorkQueues';
import { Avatar, Badge, Card, CardBody, CardHeader, EmptyState, StatCard, Table, TBody, Td, Th, THead, Tr } from '../components/ui';
import {
  Bell,
  Package,
  HelpCircle,
  AlertTriangle,
  Clock,
  Calendar,
  Users,
  Activity,
  ArrowRight,
  CheckCircle2,
  CheckCheck,
  Store,
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

  if (!user) return null;

  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const roleBadge = getRoleBadge(user.role);

  const openQueriesCount = stats?.openQueries ?? 0;
  const urgentQueriesCount = stats?.urgentQueries ?? 0;
  const myOpenQueriesCount = stats?.myOpenQueries ?? 0;
  const activeProductsCount = stats?.activeProducts ?? 0;
  const activeCustomersCount = stats?.activeCustomers ?? 0;
  const outOfStockCount = stats?.outOfStock ?? 0;
  const discontinuedCount = stats?.discontinued ?? 0;
  const unreadCount = stats?.unreadNotifications ?? 0;
  const urgentCount = stats?.urgentNotifications ?? 0;

  // Small list views keep reading from the local cache — they only render a
  // handful of rows, so the cost is bounded.
  const queriesRequiringAttention = useMemo(
    () => localDb.getQueries().filter((q) => q.status !== 'closed' && q.status !== 'resolved').slice(0, 5),
    [dbVersion, refreshKey]
  );

  // Recent customers (last 5 added)
  const recentCustomers = useMemo(
    () =>
      [...localDb.getCustomers()]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5),
    [dbVersion, refreshKey]
  );

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-[#102A43] rounded-[12px] p-6 sm:p-7 text-white shadow-card relative overflow-hidden border border-[#243B53]">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" aria-hidden="true" />
        <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#9FB3C8] mb-1 font-medium">
              <Calendar className="w-4 h-4 text-teal-400" />
              <span>{todayFormatted}</span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">
              Welcome back, <span className="text-teal-400">{user.full_name}</span>
            </h1>
            <p className="text-xs text-[#9FB3C8] mt-1 font-medium">Internal Operations Control Center — J&T Supplies CRM</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge badge={roleBadge} />
            {userTeam && (
              <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-[#243B53] text-[#D9E2EC] border border-[#334E68]">
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

      {/* My Work — Permission-derived action queues */}
      <Card>
        <CardHeader
          title="My Work — Action Queues"
          actions={
            <Link to="/my-work" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
              Open My Work Center <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
        />
        <CardBody className="pt-4">
          <MyWorkQueues compact />
        </CardBody>
      </Card>

      {/* Handover Action Banner */}
      {pendingIncomingHandover && (
        <div className="bg-teal-500 text-white rounded-[12px] shadow-card border border-teal-600 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
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
          title="Active Customers"
          value={activeCustomersCount}
          description="Registered business accounts"
          icon={<Store className="w-5 h-5" />}
          accent="emerald"
          to="/customers"
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
          value={outOfStockCount}
          description={`${activeProductsCount} products active in catalog`}
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
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200 text-center">
              <div className="text-2xl font-extrabold text-emerald-700">{activeProductsCount}</div>
              <div className="text-[11px] font-bold text-emerald-600 mt-1 uppercase tracking-wide">Active Products</div>
            </div>
            <div className="p-4 bg-red-50 rounded-xl border border-red-200 text-center">
              <div className="text-2xl font-extrabold text-red-700">{outOfStockCount}</div>
              <div className="text-[11px] font-bold text-red-600 mt-1 uppercase tracking-wide">Out of Stock</div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center">
              <div className="text-2xl font-extrabold text-slate-800">{discontinuedCount}</div>
              <div className="text-[11px] font-bold text-slate-500 mt-1 uppercase tracking-wide">Discontinued</div>
            </div>
            <div className="p-4 bg-teal-50 rounded-xl border border-teal-200 text-center">
              <div className="text-2xl font-extrabold text-teal-700">{activeCustomersCount}</div>
              <div className="text-[11px] font-bold text-teal-600 mt-1 uppercase tracking-wide">Active Customers</div>
            </div>
          </div>
        </CardBody>
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
          <Table minWidth={1160}>
            <THead>
              <Tr hover={false}>
                <Th width={110}>Ticket #</Th>
                <Th width={220}>Customer</Th>
                <Th width={320}>Subject Line</Th>
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
                  <Td width={320} truncate maxWidth={320} className="font-medium text-slate-800">{q.subject}</Td>
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

      {/* Recent Customers + System Status */}
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
                    className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-300 hover:bg-brand-50/30 transition-all group"
                  >
                    <Avatar name={c.company_name} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold text-slate-900 truncate group-hover:text-brand-700">{c.company_name}</div>
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

        {/* System Module Status */}
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
                'Product Catalog',
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
