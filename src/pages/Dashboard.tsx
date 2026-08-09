import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../services/db';
import { notificationService } from '../services/notificationService';
import { CRMNotification, ShiftHandover } from '../types';
import { 
  HelpCircle, 
  ShoppingBag, 
  AlertTriangle, 
  Bell, 
  Clock, 
  Calendar, 
  ShieldCheck, 
  Users,
  Activity,
  ArrowRight,
  Eye,
  CheckCircle2,
  FileText,
  Truck,
  CheckSquare,
  Package,
  AlertCircle,
  CheckCheck
} from 'lucide-react';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  // Subscribe to real-time notification events
  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => {
      setRefreshKey(prev => prev + 1);
    });
    return () => unsubscribe();
  }, []);

  const allQueries = useMemo(() => localDb.getQueries(), []);
  const allOrders = useMemo(() => localDb.getOrders(), []);
  const outOfStockProducts = useMemo(() => localDb.getOutOfStockProducts(), []);

  const userNotifications = useMemo(() => {
    if (!user) return [];
    return localDb.getNotifications(user.id);
  }, [user, refreshKey]);

  const unreadCount = useMemo(() => {
    if (!user) return 0;
    return localDb.getUnreadNotificationsCount(user.id);
  }, [user, refreshKey]);

  const urgentCount = useMemo(() => {
    if (!user) return 0;
    return localDb.getUrgentNotificationsCount(user.id);
  }, [user, refreshKey]);

  const userTeam = useMemo(() => {
    if (!user) return null;
    const teams = localDb.getTeams();
    return teams.find(t => t.id === user.team_id) || teams[0];
  }, [user]);

  const latestHandover = useMemo(() => {
    if (!userTeam) return null;
    const list = localDb.getHandovers();
    return list.find(h => h.incoming_team_id === userTeam.id || h.outgoing_team_id === userTeam.id) || list[0] || null;
  }, [userTeam, refreshKey]);

  const pendingIncomingHandover = useMemo(() => {
    if (!userTeam) return null;
    return localDb.getHandovers({ status: 'submitted' }).find(h => h.incoming_team_id === userTeam.id) || null;
  }, [userTeam, refreshKey]);

  if (!user) return null;

  const todayFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
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
        return 'System Administrator';
      case 'sales_agent':
        return 'Sales Agent';
      case 'support_agent':
        return 'Support Agent';
      default:
        return role;
    }
  };

  // Real Database Query Metrics
  const openQueriesCount = allQueries.filter(q => q.status === 'new' || q.status === 'open' || q.status === 'assigned' || q.status === 'in_progress' || q.status === 'reopened').length;
  const urgentQueriesCount = allQueries.filter(q => q.priority === 'urgent' && q.status !== 'closed' && q.status !== 'resolved').length;
  const myOpenQueriesCount = user ? allQueries.filter(q => q.assigned_to === user.id && q.status !== 'closed' && q.status !== 'resolved').length : 0;

  // Real Database Order Metrics
  const pendingOrdersCount = allOrders.filter(o => o.current_status !== 'completed' && o.current_status !== 'cancelled').length;

  // Orders Requiring Attention (Waiting at active workflow stages)
  const ordersRequiringAttention = allOrders
    .filter(o => o.current_status !== 'completed' && o.current_status !== 'cancelled')
    .slice(0, 5);

  // Queries Requiring Support Attention
  const queriesRequiringAttention = allQueries
    .filter(q => q.status !== 'closed' && q.status !== 'resolved')
    .slice(0, 5);

  const kpiCards = [
    {
      id: 'unread_notifications',
      title: 'Unread Notifications',
      value: unreadCount.toString(),
      description: `${urgentCount} High/Urgent priority alert${urgentCount === 1 ? '' : 's'}`,
      icon: Bell,
      color: unreadCount > 0 ? 'bg-sky-600 text-white' : 'bg-slate-700 text-white',
    },
    {
      id: 'pending_orders',
      title: 'Pending Orders',
      value: pendingOrdersCount.toString(),
      description: 'Active orders progressing through workflow',
      icon: ShoppingBag,
      color: 'bg-emerald-600 text-white',
    },
    {
      id: 'open_queries',
      title: 'Open Support Queries',
      value: openQueriesCount.toString(),
      description: `${myOpenQueriesCount} assigned to you (${urgentQueriesCount} urgent)`,
      icon: HelpCircle,
      color: 'bg-amber-500 text-white',
    },
    {
      id: 'out_of_stock',
      title: 'Out of Stock Items',
      value: outOfStockProducts.length.toString(),
      description: 'Catalog products currently marked unavailable',
      icon: AlertTriangle,
      color: 'bg-red-500 text-white',
    },
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Welcome Banner */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          <div>
            <div className="flex items-center space-x-2 text-sm text-slate-500 mb-1">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>{todayFormatted}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Welcome back, <span className="text-sky-600">{user.full_name}</span>!
            </h1>
            <p className="text-sm text-slate-600 mt-1">
              Here is your operational overview for J&T Supplies CRM.
            </p>
          </div>

          {/* User Status Pills */}
          <div className="flex flex-wrap items-center gap-2">
            
            {/* Role Badge */}
            <div className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 ${getRoleBadgeStyle(user.role)}`}>
              <ShieldCheck className="w-4 h-4" />
              <span>{formatRoleName(user.role)}</span>
            </div>

            {/* Team & Shift Badge */}
            {userTeam && (
              <div className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-medium flex items-center space-x-2">
                <Users className="w-4 h-4 text-slate-500" />
                <span className="font-semibold text-slate-900">{userTeam.name}</span>
                <span className="text-slate-400">•</span>
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-mono text-slate-600">{userTeam.shift_info}</span>
              </div>
            )}

          </div>
        </div>
      </div>

      {/* Handover Action Alert Banner if Handover Awaiting Receipt */}
      {pendingIncomingHandover && (
        <div className="bg-sky-600 text-white rounded-xl p-5 shadow-sm border border-sky-700 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-xs font-extrabold uppercase tracking-wider text-sky-200">
                ⚠️ Shift Handover Action Required
              </div>
              <p className="text-sm font-bold mt-0.5">
                {pendingIncomingHandover.outgoing_team ? pendingIncomingHandover.outgoing_team.name : 'Outgoing Team'} has submitted a shift handover with {pendingIncomingHandover.items ? pendingIncomingHandover.items.length : 0} item(s).
              </p>
            </div>
          </div>

          <Link
            to="/shift-handover"
            className="px-5 py-2.5 bg-white text-sky-900 hover:bg-sky-50 font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center space-x-1"
          >
            <span>Review & Acknowledge Handover</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      )}

      {/* Shift & Team Operations Overview Card */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">Shift & Team Operations Status</h3>
          </div>
          <Link
            to="/shift-handover"
            className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center"
          >
            <span>Open Shift Handover Center</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Active Operational Team</span>
            <div className="text-lg font-bold text-slate-900">{userTeam ? userTeam.name : 'Team 1'}</div>
            <span className="text-xs text-slate-500 font-mono">{userTeam ? userTeam.shift_info : '3 PM – 11 AM'}</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Shift Status</span>
            <div className="text-lg font-bold text-emerald-600 flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Active</span>
            </div>
            <span className="text-xs text-slate-500">Flexible Overnight Schedule</span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Latest Handover Status</span>
            <div className="text-lg font-bold text-slate-900">
              {latestHandover ? (
                latestHandover.status === 'acknowledged' ? (
                  <span className="text-emerald-700 flex items-center"><CheckCheck className="w-4 h-4 mr-1" /> Acknowledged</span>
                ) : (
                  <span className="text-sky-700 flex items-center"><Clock className="w-4 h-4 mr-1" /> Submitted</span>
                )
              ) : (
                'No Handover'
              )}
            </div>
            <span className="text-xs text-slate-500">
              {latestHandover && latestHandover.submitted_at
                ? `Submitted: ${new Date(latestHandover.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
                : 'Operational handoffs active'}
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block mb-1">Pending Handover Items</span>
            <div className="text-lg font-bold text-slate-900">
              {latestHandover && latestHandover.items ? latestHandover.items.filter(i => !i.is_completed).length : 0} Items
            </div>
            <span className="text-xs text-slate-500">Flagged tasks requiring follow-up</span>
          </div>
        </div>
      </div>

      {/* Database-backed KPI Overview Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-slate-900 font-sans">Operational Key Metrics</h2>
          <span className="text-xs text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-md font-mono font-semibold flex items-center space-x-1">
            <Bell className="w-3.5 h-3.5 text-sky-600 mr-1" />
            <span>Centralized Notifications Engine Active</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {kpiCards.map((card) => {
            const Icon = card.icon;
            return (
              <div 
                key={card.id} 
                className="bg-white rounded-xl p-5 shadow-sm border border-slate-200 hover:border-slate-300 transition-all"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-semibold text-slate-700">{card.title}</span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${card.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-slate-900 mb-1">{card.value}</div>
                <p className="text-xs text-slate-500 leading-snug">{card.description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Notifications & Alerts Widget */}
      {userNotifications.length > 0 && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bell className="w-5 h-5 text-sky-600" />
              <h3 className="text-base font-bold text-slate-900">Recent Operational Alerts & Notifications</h3>
            </div>
            <Link
              to="/notifications"
              className="text-xs font-bold text-sky-600 hover:text-sky-700 hover:underline flex items-center"
            >
              <span>View Notifications Center ({unreadCount} Unread)</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {userNotifications.slice(0, 3).map(n => (
              <Link
                key={n.id}
                to={n.link_path || '/notifications'}
                className={`p-3.5 rounded-xl border transition-all block group ${
                  !n.is_read ? 'bg-sky-50/50 border-sky-200 hover:border-sky-400' : 'bg-slate-50/50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                    n.priority === 'urgent' ? 'bg-red-100 text-red-800' :
                    n.priority === 'high' ? 'bg-amber-100 text-amber-800' : 'bg-sky-100 text-sky-800'
                  }`}>
                    {n.priority}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>

                <div className="font-bold text-xs text-slate-900 group-hover:text-sky-600 truncate">
                  {n.title}
                </div>

                <p className="text-[11px] text-slate-600 leading-snug line-clamp-2 mt-0.5">
                  {n.message}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Orders Requiring Attention Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingBag className="w-5 h-5 text-sky-600" />
            <h3 className="text-base font-bold text-slate-900">Orders Requiring Workflow Attention</h3>
          </div>
          <Link
            to="/orders"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center"
          >
            <span>View All Orders</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Order Number</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Current Status</th>
                <th className="px-5 py-3">Next Action Required</th>
                <th className="px-5 py-3 font-mono">Grand Total</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {ordersRequiringAttention.map((order) => (
                <tr key={order.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-3 font-mono font-bold text-sky-700">
                    <Link to={`/orders/${order.id}`} className="hover:underline">
                      {order.order_number}
                    </Link>
                  </td>
                  <td className="px-5 py-3 font-semibold text-slate-900">
                    {order.customer ? order.customer.company_name : 'Unknown'}
                  </td>
                  <td className="px-5 py-3">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-sky-100 text-sky-800 border border-sky-200">
                      {order.current_status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-5 py-3 font-medium text-slate-800">
                    {order.current_status === 'order_received' && 'Complete Sales Order'}
                    {order.current_status === 'sales_order_done' && 'Issue Commercial Invoice'}
                    {order.current_status === 'invoiced' && 'Dispatch Freight Shipment'}
                    {order.current_status === 'dispatched' && 'Obtain Signed Invoice'}
                    {order.current_status === 'signed_invoice_sent' && 'Finalize Order'}
                  </td>
                  <td className="px-5 py-3 font-mono font-bold text-slate-900">
                    ${order.grand_total.toFixed(2)}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <Link
                      to={`/orders/${order.id}`}
                      className="inline-flex items-center px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] rounded transition-colors"
                    >
                      <span>Process</span>
                      <ArrowRight className="w-3 h-3 ml-1" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Support Queries Requiring Attention Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5 text-amber-500" />
            <h3 className="text-base font-bold text-slate-900">Active Support Tickets Requiring Attention</h3>
          </div>
          <Link
            to="/queries"
            className="text-xs font-semibold text-sky-600 hover:text-sky-700 hover:underline flex items-center"
          >
            <span>View Support Workspace ({openQueriesCount} Open)</span>
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3">Ticket #</th>
                <th className="px-5 py-3">Customer</th>
                <th className="px-5 py-3">Subject Line</th>
                <th className="px-5 py-3">Priority</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3">Assigned Agent</th>
                <th className="px-5 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {queriesRequiringAttention.length > 0 ? (
                queriesRequiringAttention.map((q) => (
                  <tr key={q.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold text-sky-700">
                      <Link to={`/queries/${q.id}`} className="hover:underline">
                        {q.query_number}
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-semibold text-slate-900">
                      {q.customer ? q.customer.company_name : 'Unknown Customer'}
                    </td>
                    <td className="px-5 py-3 max-w-xs truncate font-medium text-slate-800" title={q.subject}>
                      {q.subject}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                        q.priority === 'urgent' ? 'bg-red-100 text-red-800 border-red-200' :
                        q.priority === 'high' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        q.priority === 'medium' ? 'bg-sky-100 text-sky-800 border-sky-200' : 'bg-slate-100 text-slate-700 border-slate-200'
                      }`}>
                        {q.priority}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-200">
                        {q.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-medium text-slate-800">
                      {q.assigned_to_profile ? q.assigned_to_profile.full_name : <span className="text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">Unassigned</span>}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <Link
                        to={`/queries/${q.id}`}
                        className="inline-flex items-center px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-[11px] rounded transition-colors"
                      >
                        <span>Manage</span>
                        <ArrowRight className="w-3 h-3 ml-1" />
                      </Link>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="p-6 text-center text-xs text-slate-400 italic">
                    No active support tickets requiring attention.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Operational Context Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Out of Stock Availability Alerts Widget */}
        {outOfStockProducts.length > 0 && (
          <div className="bg-red-50 rounded-xl border border-red-200 p-6 shadow-sm flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center space-x-2 text-red-950 font-bold">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <h3 className="text-base font-bold">Product Availability Alerts</h3>
                </div>
                <Link to="/out-of-stock" className="text-xs font-bold text-red-700 hover:underline">View All ({outOfStockProducts.length})</Link>
              </div>
              <div className="space-y-2 text-xs">
                {outOfStockProducts.slice(0, 2).map(p => (
                  <Link key={p.id} to={`/products/${p.id}`} className="p-3 bg-white rounded-lg border border-red-200 flex items-center justify-between block hover:border-red-400">
                    <div>
                      <span className="font-mono font-bold text-sky-700 mr-2">{p.sku}</span>
                      <span className="font-bold text-slate-900">{p.product_name}</span>
                    </div>
                    <span className="text-[10px] bg-red-100 text-red-800 px-2 py-0.5 rounded font-bold uppercase">Unavailable</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* System Module Status Card */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
          <div>
            <div className="flex items-center space-x-2 text-slate-900 font-bold mb-3">
              <Activity className="w-5 h-5 text-purple-600" />
              <h3 className="text-base font-bold">System Module Status</h3>
            </div>
            <div className="p-4 bg-slate-50 rounded-lg border border-slate-100 text-xs text-slate-600 space-y-2">
              <div className="flex items-center justify-between">
                <span>Customer Management (Step 2):</span>
                <span className="text-emerald-600 font-bold flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Support Ticket System (Step 3):</span>
                <span className="text-emerald-600 font-bold flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Order Management (Step 4):</span>
                <span className="text-emerald-600 font-bold flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Product Availability (Step 5):</span>
                <span className="text-emerald-600 font-bold flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Notifications & Alerts (Step 6):</span>
                <span className="text-emerald-600 font-bold flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Shift Handover & Operations (Step 7):</span>
                <span className="text-emerald-600 font-bold flex items-center"><CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active</span>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
