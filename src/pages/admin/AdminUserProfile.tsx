import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { localDb } from '../../services/db';
import { 
  User, 
  ArrowLeft, 
  ShieldCheck, 
  Building2, 
  Mail, 
  Calendar, 
  HelpCircle, 
  ShoppingBag, 
  FileText, 
  CheckCircle2, 
  Clock 
} from 'lucide-react';

export const AdminUserProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();

  const targetUser = useMemo(() => {
    if (!id) return null;
    return localDb.getUserById(id);
  }, [id]);

  const userQueries = useMemo(() => {
    if (!id) return [];
    return localDb.getQueries({ assigned_to: id });
  }, [id]);

  const userOrders = useMemo(() => {
    if (!id) return [];
    return localDb.getOrders({ sales_agent_id: id });
  }, [id]);

  const userAuditLogs = useMemo(() => {
    if (!id) return [];
    return localDb.getAuditLogs({ user_id: id });
  }, [id]);

  if (!targetUser) {
    return (
      <div className="bg-white rounded-xl p-12 text-center border border-slate-200 my-8">
        <User className="w-12 h-12 text-slate-400 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800 mb-1">User Account Not Found</h2>
        <p className="text-sm text-slate-500 mb-6">The requested user ID does not exist.</p>
        <Link
          to="/admin/users"
          className="inline-flex items-center px-4 py-2 bg-slate-900 text-white text-sm font-medium rounded-lg hover:bg-slate-800"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to User Roster
        </Link>
      </div>
    );
  }

  const openQueriesCount = userQueries.filter(q => q.status !== 'closed' && q.status !== 'resolved').length;
  const resolvedQueriesCount = userQueries.filter(q => q.status === 'resolved' || q.status === 'closed').length;
  const pendingOrdersCount = userOrders.filter(o => o.current_status !== 'completed' && o.current_status !== 'cancelled').length;
  const completedOrdersCount = userOrders.filter(o => o.current_status === 'completed').length;

  return (
    <div className="space-y-6">
      
      {/* Top Bar Back Link */}
      <div>
        <Link
          to="/admin/users"
          className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to User Roster
        </Link>
      </div>

      {/* Profile Header Banner */}
      <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <div className="w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center text-xl font-extrabold shadow-sm">
            {targetUser.full_name.charAt(0)}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">{targetUser.full_name}</h1>
              <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                targetUser.is_active ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {targetUser.is_active ? 'Active' : 'Inactive'}
              </span>
            </div>
            <p className="text-xs font-mono text-slate-500 mt-0.5">{targetUser.email}</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg border border-purple-200 bg-purple-50 text-purple-800 text-xs font-bold uppercase tracking-wider">
            Role: {targetUser.role.replace(/_/g, ' ')}
          </span>
          {targetUser.team && (
            <span className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-xs font-semibold">
              Team: {targetUser.team.name} ({targetUser.team.shift_info})
            </span>
          )}
        </div>
      </div>

      {/* Database Activity Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-extrabold uppercase text-amber-700 block">Open Support Queries</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{openQueriesCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-extrabold uppercase text-emerald-700 block">Resolved Queries</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{resolvedQueriesCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-extrabold uppercase text-sky-700 block">Pending Orders</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{pendingOrdersCount}</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-center">
          <span className="text-[10px] font-extrabold uppercase text-purple-700 block">Completed Orders</span>
          <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{completedOrdersCount}</span>
        </div>
      </div>

      {/* User Audit Log History */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-2">
          <FileText className="w-4 h-4 text-sky-600" />
          <span>User Action Audit Trail History</span>
        </h3>

        <div className="space-y-3">
          {userAuditLogs.length > 0 ? (
            userAuditLogs.map(log => (
              <div key={log.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                <div>
                  <div className="font-bold text-slate-900">{log.summary}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Action: {log.action} • Entity: {log.entity_type} {log.entity_number ? `(${log.entity_number})` : ''}
                  </div>
                </div>
                <div className="font-mono text-slate-400 text-[11px]">
                  {new Date(log.timestamp).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500 italic text-center py-6">
              No audit logs recorded for this user yet.
            </p>
          )}
        </div>
      </div>

    </div>
  );
};
