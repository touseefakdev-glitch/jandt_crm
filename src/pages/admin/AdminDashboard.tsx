import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { localDb } from '../../services/db';
import {
  Users,
  Plus,
  HelpCircle,
  ShoppingBag,
  Package,
  Clock,
  ShieldCheck,
  Bookmark,
  FileText,
  ArrowRight,
} from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { getHandoverStatusBadge } from '../../utils/badges';

export const AdminDashboard: React.FC = () => {
  const users = useMemo(() => localDb.getUsers(), []);
  const queries = useMemo(() => localDb.getQueries(), []);
  const orders = useMemo(() => localDb.getOrders(), []);
  const products = useMemo(() => localDb.getProducts(), []);
  const outOfStockProducts = useMemo(() => localDb.getOutOfStockProducts(), []);
  const handovers = useMemo(() => localDb.getHandovers(), []);
  const teams = useMemo(() => localDb.getTeams(), []);
  const systemSettings = useMemo(() => localDb.getSystemSettings(), []);

  // Calculate real database numbers
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const inactiveUsers = users.filter(u => !u.is_active).length;

  const openQueries = queries.filter(q => q.status !== 'closed' && q.status !== 'resolved').length;
  const urgentQueries = queries.filter(q => q.priority === 'urgent' && q.status !== 'closed' && q.status !== 'resolved').length;
  const resolvedQueries = queries.filter(q => q.status === 'resolved').length;

  const pendingOrders = orders.filter(o => o.current_status !== 'completed' && o.current_status !== 'cancelled').length;
  const awaitingInvoiceOrders = orders.filter(o => o.current_status === 'sales_order_done').length;
  const awaitingDispatchOrders = orders.filter(o => o.current_status === 'invoiced').length;
  const completedOrders = orders.filter(o => o.current_status === 'completed').length;

  const totalActiveProducts = products.filter(p => p.availability_status === 'available').length;
  const outOfStockCount = outOfStockProducts.length;

  const latestHandover = handovers[0] || null;
  const activeTeam = teams.find(t => t.is_active);

  const metricCard = (title: string, icon: React.ReactNode, linkLabel: string, to: string, children: React.ReactNode) => (
    <Card>
      <CardHeader
        title={title}
        icon={icon}
        actions={
          <Link to={to} className="text-xs font-bold text-brand-600 hover:underline inline-flex items-center gap-0.5">
            <span>{linkLabel}</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        }
      />
      <CardBody>{children}</CardBody>
    </Card>
  );

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Admin Quick Actions"
          subtitle="Jump to frequently used administration workflows"
          icon={<ShieldCheck className="w-4 h-4" />}
        />
        <CardBody className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/users"
            className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors space-x-1.5"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Manage & Add Users</span>
          </Link>

          <Link
            to="/admin/teams"
            className="inline-flex items-center px-3.5 py-2 bg-violet-700 hover:bg-violet-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors space-x-1.5"
          >
            <Users className="w-4 h-4 text-violet-200" />
            <span>Manage Operational Teams</span>
          </Link>

          <Link
            to="/admin/query-categories"
            className="inline-flex items-center px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl transition-colors space-x-1.5 border border-slate-300"
          >
            <Bookmark className="w-4 h-4 text-slate-600" />
            <span>Query & Product Taxonomies</span>
          </Link>

          <Link
            to="/admin/settings"
            className="inline-flex items-center px-3.5 py-2 bg-white hover:bg-slate-100 text-slate-800 font-semibold text-xs rounded-xl transition-colors space-x-1.5 border border-slate-300"
          >
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <span>System Configuration</span>
          </Link>

          <Link
            to="/admin/audit-logs"
            className="inline-flex items-center px-3.5 py-2 bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors space-x-1.5"
          >
            <FileText className="w-4 h-4 text-white" />
            <span>View Immutable Audit Logs</span>
          </Link>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {metricCard(
          'User Roster & Accounts',
          <Users className="w-4 h-4" />,
          'View Roster',
          '/admin/users',
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Total</span>
              <span className="text-xl font-extrabold text-slate-900">{totalUsers}</span>
            </div>
            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-emerald-900">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block">Active</span>
              <span className="text-xl font-extrabold">{activeUsers}</span>
            </div>
            <div className="p-2.5 bg-red-50/60 rounded-xl border border-red-100 text-red-900">
              <span className="text-[10px] font-bold uppercase text-red-700 block">Inactive</span>
              <span className="text-xl font-extrabold">{inactiveUsers}</span>
            </div>
          </div>
        )}

        {metricCard(
          'Support Queries & Tickets',
          <HelpCircle className="w-4 h-4" />,
          'View Workspace',
          '/queries',
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400 block">Open Queue</span>
              <span className="text-xl font-extrabold text-slate-900">{openQueries}</span>
            </div>
            <div className="p-2.5 bg-red-50/60 rounded-xl border border-red-100 text-red-900">
              <span className="text-[10px] font-bold uppercase text-red-700 block">Urgent</span>
              <span className="text-xl font-extrabold">{urgentQueries}</span>
            </div>
            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 text-emerald-900">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block">Resolved</span>
              <span className="text-xl font-extrabold">{resolvedQueries}</span>
            </div>
          </div>
        )}

        {metricCard(
          'Order Fulfillment Workflow',
          <ShoppingBag className="w-4 h-4" />,
          'View Orders',
          '/orders',
          <div className="grid grid-cols-4 gap-1.5 text-center text-xs">
            <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[9px] font-bold uppercase text-slate-400 block truncate">Pending</span>
              <span className="text-lg font-extrabold text-slate-900">{pendingOrders}</span>
            </div>
            <div className="p-2 bg-amber-50 rounded-lg border border-amber-100 text-amber-900">
              <span className="text-[9px] font-bold uppercase text-amber-700 block truncate">Invoice</span>
              <span className="text-lg font-extrabold">{awaitingInvoiceOrders}</span>
            </div>
            <div className="p-2 bg-sky-50 rounded-lg border border-sky-100 text-sky-900">
              <span className="text-[9px] font-bold uppercase text-sky-700 block truncate">Dispatch</span>
              <span className="text-lg font-extrabold">{awaitingDispatchOrders}</span>
            </div>
            <div className="p-2 bg-emerald-50 rounded-lg border border-emerald-100 text-emerald-900">
              <span className="text-[9px] font-bold uppercase text-emerald-700 block truncate">Done</span>
              <span className="text-lg font-extrabold">{completedOrders}</span>
            </div>
          </div>
        )}

        {metricCard(
          'Product Catalog & Availability',
          <Package className="w-4 h-4" />,
          'View Catalog',
          '/products',
          <div className="grid grid-cols-2 gap-3 text-center">
            <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-emerald-900">
              <span className="text-[10px] font-bold uppercase text-emerald-700 block">Available Items</span>
              <span className="text-2xl font-extrabold">{totalActiveProducts}</span>
            </div>
            <div className="p-3 bg-red-50/60 rounded-xl border border-red-100 text-red-900">
              <span className="text-[10px] font-bold uppercase text-red-700 block">Out of Stock</span>
              <span className="text-2xl font-extrabold">{outOfStockCount}</span>
            </div>
          </div>
        )}

        {metricCard(
          'Shift Operations & Handover',
          <Clock className="w-4 h-4" />,
          'Shift Center',
          '/shift-handover',
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-semibold">Active Operational Team:</span>
              <span className="font-bold text-slate-900 text-right">{activeTeam ? `${activeTeam.name} (${activeTeam.shift_info})` : 'No Active Team'}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-500 font-semibold">Latest Handover Status:</span>
              {latestHandover ? (
                <Badge badge={getHandoverStatusBadge(latestHandover.status)} />
              ) : (
                <span className="font-bold text-slate-400">No Handover</span>
              )}
            </div>
          </div>
        )}

        {metricCard(
          'System Configuration',
          <ShieldCheck className="w-4 h-4" />,
          'Manage Settings',
          '/admin/settings',
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">Timezone:</span> <span className="font-mono text-slate-900">{systemSettings.timezone}</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Currency:</span>{' '}
              <span className="font-mono font-bold text-slate-900">{systemSettings.currency_symbol} (USD)</span>
            </div>
            <div>
              <span className="font-semibold text-slate-800">Date Format:</span> <span className="font-mono text-slate-900">{systemSettings.date_format}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
