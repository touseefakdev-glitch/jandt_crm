import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { localDb } from '../services/db';
import { MyWorkQueues } from '../components/work/MyWorkQueues';
import { getEffectiveArea, getWorkQueues } from '../services/access';
import { getRoleBadge } from '../utils/badges';
import { Badge, Card, CardBody, CardHeader, EmptyState } from '../components/ui';
import { ClipboardList, HelpCircle, ListTodo, Users, MapPin, ArrowRight } from 'lucide-react';

export const MyWork: React.FC = () => {
  const { user, dbVersion } = useAuth();

  const queueCount = useMemo(() => getWorkQueues(user).length, [user]);

  const areaLabel = useMemo(() => {
    const area = getEffectiveArea(user);
    if (area === 'KELOWNA') return 'Kelowna';
    if (area === 'OUTSIDE_KELOWNA') return 'Outside Kelowna';
    return 'All Areas';
  }, [user]);

  const recentActivities = useMemo(() => {
    if (!user) return [];
    const ops = localDb.getDailyOrderOperations({
      date: new Date().toISOString().split('T')[0],
      sortBy: 'updated_at',
    }).operations;
    return [...ops]
      .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
      .slice(0, 6);
  }, [dbVersion, user]);

  const todayFormatted = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });

  if (!user) return null;

  return (
    <div className="space-y-6">
      <PageHeaderBlock
        title="My Work"
        description={`${todayFormatted} — your action queues, computed from your role and operational area.`}
        roleLabel={getRoleBadge(user.role).label}
        areaLabel={areaLabel}
      />

      {queueCount === 0 ? (
        <Card>
          <CardBody>
            <EmptyState
              icon={<ListTodo className="w-7 h-7" />}
              title="No active work queues"
              description="Your role currently has no operational action queues assigned. Contact an administrator if you expected to see work items here."
            />
          </CardBody>
        </Card>
      ) : (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
              <ClipboardList className="w-4 h-4" />
              Your Action Queues ({queueCount})
            </div>
            <div className="flex items-center gap-2">
              <Link to="/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                Open Daily Operations <ArrowRight className="w-3.5 h-3.5" />
              </Link>
              {user.role !== 'sales_agent' && (
                <Link to="/queries" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                  Open Query Center <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>
          </div>
          <MyWorkQueues />
        </>
      )}

      {recentActivities.length > 0 && (
        <Card>
          <CardHeader
            title="Recently Updated Orders Today"
            actions={
              <Link to="/orders" className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 hover:underline">
                View All <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            }
          />
          <CardBody className="pt-4">
            <div className="space-y-2">
              {recentActivities.map((op) => (
                <Link
                  key={op.id}
                  to="/orders"
                  className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:border-brand-300 hover:bg-brand-50/30 transition-all group"
                >
                  <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-slate-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-bold text-slate-900 truncate group-hover:text-brand-700">
                      {op.customer?.company_name || 'Unknown customer'} — {op.route}
                    </div>
                    <div className="text-[10px] font-mono text-slate-400 mt-0.5">
                      Status: {op.status.replace(/_/g, ' ').toUpperCase()} · Updated{' '}
                      {new Date(op.updated_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-brand-500" />
                </Link>
              ))}
            </div>
          </CardBody>
        </Card>
      )}

      <div className="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-navy-900 text-white flex items-center justify-center shrink-0">
          <HelpCircle className="w-4 h-4" />
        </div>
        <div className="text-xs text-slate-600 leading-relaxed">
          <span className="font-bold text-slate-900">How queues are computed:</span> every card above is derived from your system role and
          operational area ({areaLabel}), not from a personal profile. You only ever see actions you are permitted to perform. Open an
          Operations item to progress a customer order, or a Query card to pick up support work.
        </div>
      </div>
    </div>
  );
};

const PageHeaderBlock: React.FC<{ title: string; description: string; roleLabel: string; areaLabel: string }> = ({
  title,
  description,
  roleLabel,
  areaLabel,
}) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-card border border-[#D9E2EC] shadow-card">
    <div className="flex items-center gap-3.5 min-w-0">
      <div className="w-10 h-10 rounded-[10px] flex items-center justify-center shrink-0 text-white shadow-xs bg-teal-500">
        <ListTodo className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <h1 className="crm-page-title">{title}</h1>
        <p className="text-xs text-[#52606D] mt-0.5 font-medium">{description}</p>
        <div className="flex flex-wrap items-center gap-1.5 mt-2">
          <Badge badge={{ subtle: 'bg-teal-50 text-teal-800 ring-teal-200', solid: 'bg-teal-500 text-white', dot: 'bg-teal-500', label: roleLabel }} />
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#E9EFF5] text-[#52606D] border border-[#D9E2EC]">
            <MapPin className="w-3 h-3" /> {areaLabel}
          </span>
        </div>
      </div>
    </div>
  </div>
);
