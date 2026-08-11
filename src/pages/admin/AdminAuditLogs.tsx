import React, { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { FileText, Search, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Card } from '../../components/ui/Card';
import { Table, THead, TBody, Tr, Th, Td } from '../../components/ui/Table';
import { TableToolbar } from '../../components/ui/TableToolbar';
import { Pagination } from '../../components/ui/Pagination';
import { EmptyState } from '../../components/ui/EmptyState';
import { Avatar } from '../../components/ui/Avatar';

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

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1);
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Immutable System Audit Logs"
        description="Track and audit critical system actions across user creation, role changes, query status, order fulfillment, and product availability"
        icon={<FileText className="w-5 h-5 text-white" />}
        iconBg="bg-slate-900"
        badges={
          <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-xl border border-emerald-200">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Immutable Audit Integrity
          </span>
        }
      />

      <TableToolbar>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Input
          value={searchTerm}
          onChange={(e) => handleSearchChange(e.target.value)}
          placeholder="Search by summary, entity ID, or user name..."
          icon={<Search className="w-4 h-4" />}
        />

        <Select value={userFilter} onChange={(e) => { setUserFilter(e.target.value); setCurrentPage(1); }}>
          <option value="all">All Performing Users</option>
          {users.map(u => (
            <option key={u.id} value={u.id}>{u.full_name}</option>
          ))}
        </Select>

        <Select value={actionFilter} onChange={(e) => { setActionFilter(e.target.value); setCurrentPage(1); }}>
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
        </Select>

        <Select value={entityFilter} onChange={(e) => { setEntityFilter(e.target.value); setCurrentPage(1); }}>
          <option value="all">All Entity Types</option>
          <option value="user">User Account</option>
          <option value="team">Operational Team</option>
          <option value="customer">Customer Account</option>
          <option value="query">Support Query</option>
          <option value="order">Customer Order</option>
          <option value="product">Catalog Product</option>
          <option value="shift_handover">Shift Handover</option>
          <option value="system_settings">System Settings</option>
        </Select>
        </div>
      </TableToolbar>

      <Card flush>
        <Table minWidth={1030}>
          <THead>
            <Tr hover={false}>
              <Th width={160} className="font-mono">Timestamp</Th>
              <Th width={200}>Performing User</Th>
              <Th width={160}>Action Event</Th>
              <Th width={160}>Target Entity</Th>
              <Th width={300}>Audit Summary & Value Delta</Th>
            </Tr>
          </THead>
          <TBody>
            {paginatedLogs.length > 0 ? (
              paginatedLogs.map((log) => (
                <Tr key={log.id}>
                  <Td width={160} className="font-mono text-slate-500 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </Td>

                  <Td width={200} truncate maxWidth={200}>
                    {log.user_profile ? (
                      <span className="inline-flex items-center gap-1.5">
                        <Avatar name={log.user_profile.full_name} size="xs" />
                        <span className="font-bold text-slate-900 truncate">{log.user_profile.full_name}</span>
                      </span>
                    ) : (
                      <span className="text-slate-400 italic">System Auto</span>
                    )}
                  </Td>

                  <Td width={160}>
                    <span className="font-mono text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                      {log.action}
                    </span>
                  </Td>

                  <Td width={160} truncate maxWidth={160}>
                    <div className="font-bold text-slate-900 capitalize">{log.entity_type}</div>
                    {log.entity_number && (
                      <div className="font-mono text-[10px] text-sky-700 font-semibold truncate">{log.entity_number}</div>
                    )}
                  </Td>

                  <Td width={300} truncate maxWidth={300}>
                    <div className="font-semibold text-slate-900 truncate">{log.summary}</div>
                    {(log.previous_value || log.new_value) && (
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5 flex items-center gap-2">
                        {log.previous_value && (
                          <span>
                            Prev: <code className="bg-slate-100 px-1 py-0.5 rounded text-red-700">{log.previous_value}</code>
                          </span>
                        )}
                        {log.previous_value && log.new_value && <span>➔</span>}
                        {log.new_value && (
                          <span>
                            New: <code className="bg-slate-100 px-1 py-0.5 rounded text-emerald-700">{log.new_value}</code>
                          </span>
                        )}
                      </div>
                    )}
                  </Td>
                </Tr>
              ))
            ) : (
              <Tr hover={false}>
                <Td colSpan={5} className="p-0">
                  <EmptyState
                    icon={<FileText className="w-6 h-6" />}
                    title="No audit logs found"
                    description="No system audit logs match your search filter criteria."
                  />
                </Td>
              </Tr>
            )}
          </TBody>
        </Table>

        {auditLogs.length > 0 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={auditLogs.length}
            pageSize={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
            itemLabel="audit logs"
          />
        )}
      </Card>
    </div>
  );
};
