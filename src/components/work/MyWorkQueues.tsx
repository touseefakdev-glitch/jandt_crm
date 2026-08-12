import React, { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { localDb } from '../../services/db';
import { notificationService } from '../../services/notificationService';
import { canVerifyQuery, getEffectiveArea, getWorkQueues, WorkQueue, WorkQueueTone } from '../../services/access';
import { isOrderDifferent } from '../../utils/orderWorkflow';
import { cn } from '../../utils/cn';
import {
  ArrowRight,
  ClipboardList,
  FileText,
  ReceiptText,
  Truck,
  Send,
  GitCompareArrows,
  HelpCircle,
  ShieldCheck,
  Inbox,
} from 'lucide-react';

const OPEN_QUERY_STATUSES = ['new', 'open', 'assigned', 'in_progress', 'reopened', 'waiting_customer'];

const TONE_STYLES: Record<WorkQueueTone, { icon: string; count: string; border: string }> = {
  sky: { icon: 'bg-sky-500', count: 'text-sky-700', border: 'hover:border-sky-300' },
  indigo: { icon: 'bg-indigo-500', count: 'text-indigo-700', border: 'hover:border-indigo-300' },
  purple: { icon: 'bg-purple-500', count: 'text-purple-700', border: 'hover:border-purple-300' },
  emerald: { icon: 'bg-emerald-500', count: 'text-emerald-700', border: 'hover:border-emerald-300' },
  cyan: { icon: 'bg-cyan-500', count: 'text-cyan-700', border: 'hover:border-cyan-300' },
  amber: { icon: 'bg-amber-500', count: 'text-amber-700', border: 'hover:border-amber-300' },
  red: { icon: 'bg-red-500', count: 'text-red-700', border: 'hover:border-red-300' },
};

const QUEUE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'orders-to-receive': ClipboardList,
  'sales-orders-to-generate': FileText,
  'invoices-to-raise': ReceiptText,
  'orders-to-dispatch': Truck,
  'pod-to-send': Send,
  'order-match-review': GitCompareArrows,
  'my-open-queries': HelpCircle,
  'queries-to-verify': ShieldCheck,
  'open-queries': Inbox,
};

interface MyWorkQueuesProps {
  compact?: boolean;
}

/**
 * Permission-derived action queues ("MY WORK"). Every card shown is computed
 * from the current user's role + operational area, and its count comes from
 * the live local store so the numbers stay in sync with other open views.
 */
export const MyWorkQueues: React.FC<MyWorkQueuesProps> = ({ compact }) => {
  const { user, dbVersion } = useAuth();
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const unsubscribe = notificationService.subscribe(() => setRefreshKey((prev) => prev + 1));
    return () => unsubscribe();
  }, []);

  const queues = useMemo(() => getWorkQueues(user), [user]);

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  const orderData = useMemo(() => {
    if (!user || !queues.some((q) => q.scope === 'area')) return null;
    const area = getEffectiveArea(user);
    const operationalArea = area === 'ALL' ? undefined : (area as 'KELOWNA' | 'OUTSIDE_KELOWNA');
    const { operations } = localDb.getDailyOrderOperations({
      date: todayStr,
      operationalArea,
      sortBy: 'status',
    });
    return operations;
  }, [user, queues, todayStr, dbVersion, refreshKey]);

  const queries = useMemo(() => {
    if (!user || !queues.some((q) => q.scope !== 'area')) return null;
    return localDb.getQueries();
  }, [user, queues, dbVersion, refreshKey]);

  const counts = useMemo(() => {
    const out: Record<string, number> = {};
    for (const queue of queues) {
      if (queue.scope === 'area') {
        const ops = orderData ?? [];
        switch (queue.id) {
          case 'orders-to-receive':
            out[queue.id] = ops.filter((o) => o.status === 'not_started').length;
            break;
          case 'sales-orders-to-generate':
            out[queue.id] = ops.filter((o) => o.status === 'order_received').length;
            break;
          case 'invoices-to-raise':
            out[queue.id] = ops.filter((o) => o.status === 'sales_order_generated').length;
            break;
          case 'orders-to-dispatch':
            out[queue.id] = ops.filter((o) => o.status === 'invoiced').length;
            break;
          case 'pod-to-send':
            out[queue.id] = ops.filter((o) => o.status === 'dispatched').length;
            break;
          case 'order-match-review':
            out[queue.id] = ops.filter(isOrderDifferent).length;
            break;
          default:
            out[queue.id] = 0;
        }
      } else {
        const allQueries = queries ?? [];
        if (queue.id === 'my-open-queries' && user) {
          out[queue.id] = allQueries.filter((q) => q.assigned_to === user.id && OPEN_QUERY_STATUSES.includes(q.status)).length;
        } else if (queue.id === 'queries-to-verify') {
          out[queue.id] = allQueries.filter((q) => q.status === 'resolved' && canVerifyQuery(user, q)).length;
        } else if (queue.id === 'open-queries') {
          out[queue.id] = allQueries.filter((q) => OPEN_QUERY_STATUSES.includes(q.status)).length;
        } else {
          out[queue.id] = 0;
        }
      }
    }
    return out;
  }, [queues, orderData, queries, user]);

  if (!user || queues.length === 0) return null;

  const renderQueueCard = (queue: WorkQueue) => {
    const Icon = QUEUE_ICONS[queue.id] ?? ClipboardList;
    const tone = TONE_STYLES[queue.tone];
    const count = counts[queue.id] ?? 0;
    return (
      <Link
        key={queue.id}
        to={queue.path}
        className={cn(
          'group flex items-start gap-3 p-4 rounded-xl border border-slate-200 bg-white transition-all hover:shadow-sm',
          tone.border
        )}
      >
        <div className={cn('w-9 h-9 rounded-[10px] flex items-center justify-center shrink-0', tone.icon)}>
          <Icon className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-slate-900 truncate">{queue.title}</span>
            <span className={cn('text-2xl font-extrabold leading-none shrink-0', tone.count)}>{count}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 leading-snug line-clamp-2">{queue.description}</p>
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 mt-1.5 group-hover:text-slate-600">
            Open Queue <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      </Link>
    );
  };

  if (compact) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {queues.slice(0, 6).map(renderQueueCard)}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {queues.map(renderQueueCard)}
    </div>
  );
};
