import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { AuditLog } from '../../types';
import { FileText, Search, Filter, ShieldCheck, ChevronLeft, ChevronRight, User, Calendar } from 'lucide-react';

const ITEMS_PER_PAGE = 10;

export const AdminAuditLogs: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState('all');
  const [actionFilter, setActionFilter] = useState('all');
  const [entityFilter, setEntityFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);

  const users = useMemo(() => localDb.getUsers(), []);

  const auditLogs = useMemo(() => {
    return localDb.getAuditLogs({
      user_id: userFilter,
      action: actionFilter,
      entity_type: entityFilter,
      searchTerm,
    });
  }, [userFilter, actionFilter, entityFilter, searchTerm]);

  const totalPages = Math.ceil(auditLogs.length / ITEMS_PER_PAGE) || 1;
  const paginatedLogs = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return auditLogs.slice(start, start + ITEMS_PER_PAGE);
  }, [auditLogs, currentPage]);

  if (!user) return null;

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Immutable System Audit Logs</h2>
          <p className="text-xs text-slate-500">Track and audit critical system actions across user creation, role changes, query status, order fulfillment, and product availability</p>
        </div>

        <div className="flex items-center space-x-2 text-xs font-semibold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Immutable Audit Integrity</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            placeholder="Search by summary, entity ID, or user name..."
            className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500"
          />
        </div>

        <div>
          <select
            value={userFilter}
            onChange={(e) => { setUserFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="all">All Performing Users</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>{u.full_name}</option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="all">All Action Types</option>
            <option value="user_created">user_created</option>
            <option value="user_deactivated">user_deactivated</option>
            <option value="role_changed">role_changed</option>
            <option value="team_changed">team_changed</option>
            <option value="query_created">query_created</option>
            <option value="query_assigned">query_assigned</option>
            <option value="query_status_changed">query_status_changed</option>
            <option value="order_created">order_created</option>
            <option value="order_status_changed">order_status_changed</option>
            <option value="product_availability_changed">product_availability_changed</option>
            <option value="shift_handover_submitted">shift_handover_submitted</option>
            <option value="settings_updated">settings_updated</option>
          </select>
        </div>

        <div>
          <select
            value={entityFilter}
            onChange={(e) => { setEntityFilter(e.target.value); setCurrentPage(1); }}
            className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
          >
            <option value="all">All Entity Types</option>
            <option value="user">User Account</option>
            <option value="team">Operational Team</option>
            <option value="customer">Customer Account</option>
            <option value="query">Support Query</option>
            <option value="order">Customer Order</option>
            <option value="product">Catalog Product</option>
            <option value="shift_handover">Shift Handover</option>
            <option value="system_settings">System Settings</option>
          </select>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-200">
              <tr>
                <th className="px-5 py-3.5 font-mono">Timestamp</th>
                <th className="px-5 py-3.5">Performing User</th>
                <th className="px-5 py-3.5">Action Event</th>
                <th className="px-5 py-3.5">Target Entity</th>
                <th className="px-5 py-3.5">Audit Summary & Value Delta</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-xs">
              {paginatedLogs.length > 0 ? (
                paginatedLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    
                    {/* Timestamp */}
                    <td className="px-5 py-3.5 font-mono text-slate-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </td>

                    {/* User */}
                    <td className="px-5 py-3.5 font-medium">
                      {log.user_profile ? (
                        <div className="flex items-center space-x-1.5">
                          <div className="w-5 h-5 rounded-full bg-slate-200 font-bold text-[10px] flex items-center justify-center text-slate-700">
                            {log.user_profile.full_name.charAt(0)}
                          </div>
                          <span className="font-bold text-slate-900">{log.user_profile.full_name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">System Auto</span>
                      )}
                    </td>

                    {/* Action */}
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                        {log.action}
                      </span>
                    </td>

                    {/* Entity */}
                    <td className="px-5 py-3.5">
                      <div className="font-bold text-slate-900 capitalize">{log.entity_type}</div>
                      {log.entity_number && (
                        <div className="font-mono text-[10px] text-sky-700 font-semibold">{log.entity_number}</div>
                      )}
                    </td>

                    {/* Summary & Delta */}
                    <td className="px-5 py-3.5 max-w-md">
                      <div className="font-semibold text-slate-900">{log.summary}</div>
                      {(log.previous_value || log.new_value) && (
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center space-x-2">
                          {log.previous_value && <span>Prev: <code className="bg-slate-100 px-1 py-0.2 rounded text-red-700">{log.previous_value}</code></span>}
                          {log.previous_value && log.new_value && <span>➔</span>}
                          {log.new_value && <span>New: <code className="bg-slate-100 px-1 py-0.2 rounded text-emerald-700">{log.new_value}</code></span>}
                        </div>
                      )}
                    </td>

                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-xs text-slate-400 italic">
                    No system audit logs match your search filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Pagination */}
        {auditLogs.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-600">
            <div>
              Showing <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, auditLogs.length)}</span> to{' '}
              <span className="font-semibold text-slate-900">{Math.min(currentPage * ITEMS_PER_PAGE, auditLogs.length)}</span> of{' '}
              <span className="font-semibold text-slate-900">{auditLogs.length}</span> audit logs
            </div>

            <div className="flex items-center space-x-2">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="font-semibold text-slate-800 px-1">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                className="p-1 rounded border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 text-slate-700"
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
