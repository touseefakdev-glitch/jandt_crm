import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { localDb } from '../../services/db';
import { 
  Users, 
  UserCheck, 
  UserX, 
  HelpCircle, 
  AlertCircle, 
  CheckCircle2, 
  ShoppingBag, 
  FileText, 
  Truck, 
  CheckSquare, 
  Package, 
  AlertTriangle, 
  Clock, 
  Bell, 
  Plus, 
  ArrowRight,
  ShieldCheck,
  Building2,
  Bookmark
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const users = useMemo(() => localDb.getUsers(), []);
  const queries = useMemo(() => localDb.getQueries(), []);
  const orders = useMemo(() => localDb.getOrders(), []);
  const products = useMemo(() => localDb.getProducts(), []);
  const outOfStockProducts = useMemo(() => localDb.getOutOfStockProducts(), []);
  const handovers = useMemo(() => localDb.getHandovers(), []);
  const systemSettings = useMemo(() => localDb.getSystemSettings(), []);

  // Calculate real database numbers
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.is_active).length;
  const inactiveUsers = users.filter(u => !u.is_active).length;

  const openQueries = queries.filter(q => q.status !== 'closed' && q.status !== 'resolved').length;
  const urgentQueries = queries.filter(q => q.priority === 'urgent' && q.status !== 'closed' && q.status !== 'resolved').length;
  const resolvedTodayQueries = queries.filter(q => q.status === 'resolved').length;

  const pendingOrders = orders.filter(o => o.current_status !== 'completed' && o.current_status !== 'cancelled').length;
  const awaitingInvoiceOrders = orders.filter(o => o.current_status === 'sales_order_done').length;
  const awaitingDispatchOrders = orders.filter(o => o.current_status === 'invoiced').length;
  const completedTodayOrders = orders.filter(o => o.current_status === 'completed').length;

  const totalActiveProducts = products.filter(p => p.availability_status === 'available').length;
  const outOfStockCount = outOfStockProducts.length;

  const latestHandover = handovers[0] || null;

  return (
    <div className="space-y-6">
      
      {/* Quick Action Buttons Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-500">Admin Quick Actions</h3>
        <div className="flex flex-wrap gap-2.5">
          <Link
            to="/admin/users"
            className="inline-flex items-center px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors space-x-1.5"
          >
            <Plus className="w-4 h-4 text-sky-400" />
            <span>Manage & Add Users</span>
          </Link>

          <Link
            to="/admin/teams"
            className="inline-flex items-center px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-xs transition-colors space-x-1.5"
          >
            <Users className="w-4 h-4 text-purple-200" />
            <span>Manage Operational Teams</span>
          </Link>

          <Link
            to="/admin/query-categories"
            className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors space-x-1.5 border border-slate-300"
          >
            <Bookmark className="w-4 h-4 text-slate-600" />
            <span>Query & Product Taxonomies</span>
          </Link>

          <Link
            to="/admin/settings"
            className="inline-flex items-center px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs rounded-xl transition-colors space-x-1.5 border border-slate-300"
          >
            <ShieldCheck className="w-4 h-4 text-slate-600" />
            <span>System Configuration</span>
          </Link>

          <Link
            to="/admin/audit-logs"
            className="inline-flex items-center px-3.5 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors space-x-1.5"
          >
            <FileText className="w-4 h-4 text-sky-100" />
            <span>View Immutable Audit Logs</span>
          </Link>
        </div>
      </div>

      {/* Real Database KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        
        {/* Card 1: Users */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">User Roster & Accounts</h3>
            </div>
            <Link to="/admin/users" className="text-xs font-bold text-sky-600 hover:underline flex items-center">
              <span>View Roster</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

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
        </div>

        {/* Card 2: Support Queries */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <HelpCircle className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Support Queries & Tickets</h3>
            </div>
            <Link to="/queries" className="text-xs font-bold text-sky-600 hover:underline flex items-center">
              <span>View Workspace</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

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
              <span className="text-xl font-extrabold">{resolvedTodayQueries}</span>
            </div>
          </div>
        </div>

        {/* Card 3: Orders Fulfillment */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Order Fulfillment Workflow</h3>
            </div>
            <Link to="/orders" className="text-xs font-bold text-sky-600 hover:underline flex items-center">
              <span>View Orders</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

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
              <span className="text-lg font-extrabold">{completedTodayOrders}</span>
            </div>
          </div>
        </div>

        {/* Card 4: Products Catalog & Availability */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Package className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Product Catalog & Availability</h3>
            </div>
            <Link to="/products" className="text-xs font-bold text-sky-600 hover:underline flex items-center">
              <span>View Catalog</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

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
        </div>

        {/* Card 5: Operational Shifts & Handover */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Shift Operations & Handover</h3>
            </div>
            <Link to="/shift-handover" className="text-xs font-bold text-sky-600 hover:underline flex items-center">
              <span>Shift Center</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Active Operational Team:</span>
              <span className="font-bold text-slate-900">Team 1 (3 PM – 11 AM)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-semibold">Latest Handover Status:</span>
              <span className="font-bold text-emerald-700 capitalize">
                {latestHandover ? latestHandover.status : 'No Handover'}
              </span>
            </div>
          </div>
        </div>

        {/* Card 6: System Configuration Metadata */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">System Configuration</h3>
            </div>
            <Link to="/admin/settings" className="text-xs font-bold text-sky-600 hover:underline flex items-center">
              <span>Manage Settings</span>
              <ArrowRight className="w-3 h-3 ml-0.5" />
            </Link>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1.5 text-slate-600">
            <div><span className="font-semibold text-slate-800">Timezone:</span> <span className="font-mono text-slate-900">{systemSettings.timezone}</span></div>
            <div><span className="font-semibold text-slate-800">Currency:</span> <span className="font-mono font-bold text-slate-900">{systemSettings.currency_symbol} (USD)</span></div>
            <div><span className="font-semibold text-slate-800">Date Format:</span> <span className="font-mono text-slate-900">{systemSettings.date_format}</span></div>
          </div>
        </div>

      </div>

    </div>
  );
};
