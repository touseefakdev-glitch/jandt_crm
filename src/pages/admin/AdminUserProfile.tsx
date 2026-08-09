import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { localDb } from '../../services/db';
import { ArrowLeft, FileText, HelpCircle, ShoppingBag, CheckCircle2, UserRound } from 'lucide-react';
import { PageHeader } from '../../components/ui/PageHeader';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { StatCard } from '../../components/ui/StatCard';
import { EmptyState } from '../../components/ui/EmptyState';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getRoleBadge } from '../../utils/badges';
import { formatDateTime } from '../../utils/format';

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
      <div className="mt-8">
        <EmptyState
          icon={<UserRound className="w-6 h-6" />}
          title="User Account Not Found"
          description="The requested user ID does not exist or has been removed."
          action={
            <Link to="/admin/users">
              <Button variant="secondary" size="sm" icon={<ArrowLeft className="w-4 h-4" />}>
                Return to User Roster
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  const openQueriesCount = userQueries.filter(q => q.status !== 'closed' && q.status !== 'resolved').length;
  const resolvedQueriesCount = userQueries.filter(q => q.status === 'resolved' || q.status === 'closed').length;
  const pendingOrdersCount = userOrders.filter(o => o.current_status !== 'completed' && o.current_status !== 'cancelled').length;
  const completedOrdersCount = userOrders.filter(o => o.current_status === 'completed').length;

  return (
    <div className="space-y-6">
      <div>
        <Link to="/admin/users" className="inline-flex items-center text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to User Roster
        </Link>
      </div>

      <PageHeader
        title={targetUser.full_name}
        description={<span className="font-mono">{targetUser.email}</span>}
        icon={
          <div className="w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center text-lg font-extrabold">
            {targetUser.full_name.charAt(0)}
          </div>
        }
        iconBg="bg-slate-900"
        badges={
          <>
            <Badge badge={getRoleBadge(targetUser.role)} />
            {targetUser.is_active ? (
              <Badge
                badge={{
                  subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                  solid: 'bg-emerald-600 text-white',
                  dot: 'bg-emerald-500',
                  label: 'Active',
                }}
              />
            ) : (
              <Badge
                badge={{
                  subtle: 'bg-red-50 text-red-700 ring-red-200',
                  solid: 'bg-red-600 text-white',
                  dot: 'bg-red-500',
                  label: 'Inactive',
                }}
              />
            )}
            {targetUser.team && (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 text-[11px] font-semibold">
                Team: {targetUser.team.name} ({targetUser.team.shift_info})
              </span>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Open Support Queries"
          value={openQueriesCount}
          description="Assigned and awaiting resolution"
          icon={<HelpCircle className="w-4 h-4" />}
          accent="amber"
        />
        <StatCard
          title="Resolved Queries"
          value={resolvedQueriesCount}
          description="Closed or resolved tickets"
          icon={<CheckCircle2 className="w-4 h-4" />}
          accent="emerald"
        />
        <StatCard
          title="Pending Orders"
          value={pendingOrdersCount}
          description="In fulfillment workflow"
          icon={<ShoppingBag className="w-4 h-4" />}
          accent="brand"
        />
        <StatCard
          title="Completed Orders"
          value={completedOrdersCount}
          description="Fully fulfilled orders"
          icon={<FileText className="w-4 h-4" />}
          accent="violet"
        />
      </div>

      <Card>
        <CardHeader
          title="User Action Audit Trail History"
          subtitle="Immutable record of actions performed by this user"
          icon={<FileText className="w-4 h-4" />}
        />
        <CardBody>
          <div className="space-y-3">
            {userAuditLogs.length > 0 ? (
              userAuditLogs.map(log => (
                <div key={log.id} className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="font-bold text-slate-900">{log.summary}</div>
                    <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                      Action: {log.action} • Entity: {log.entity_type} {log.entity_number ? `(${log.entity_number})` : ''}
                    </div>
                  </div>
                  <div className="font-mono text-slate-400 text-[11px] whitespace-nowrap">{formatDateTime(log.timestamp)}</div>
                </div>
              ))
            ) : (
              <p className="text-xs text-slate-500 italic text-center py-6">No audit logs recorded for this user yet.</p>
            )}
          </div>
        </CardBody>
      </Card>
    </div>
  );
};
