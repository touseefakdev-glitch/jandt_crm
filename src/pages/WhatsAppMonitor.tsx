import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { whatsappMonitoringService } from '../services/whatsappMonitoringService';
import { localDb } from '../services/db';
import { whatsappIngestionService } from '../services/whatsappIngestionService';
import { permissions } from '../services/permissions';
import { useAuth } from '../context/AuthContext';
import { WhatsAppMonitoringStats, ProcessingErrorRecord } from '../types';
import { Card, CardHeader, CardBody, StatCard, Badge, Button, Pill } from '../components/ui';
import {
  MessageSquare,
  ArrowDownToLine,
  ArrowUpFromLine,
  ShoppingBag,
  CheckCircle2,
  HelpCircle,
  UserCog,
  XCircle,
  Send,
  AlertTriangle,
  BellOff,
  RefreshCw,
  Activity
} from 'lucide-react';
import { getMessageClassificationBadge, BadgeStyle } from '../utils/badges';

const dangerBadge: BadgeStyle = { subtle: 'bg-red-50 text-red-700 ring-red-200', solid: 'bg-red-500 text-white', dot: 'bg-red-500', label: 'Error' };

const classificationOrder: Array<{ key: keyof WhatsAppMonitoringStats['byClassification']; label: string }> = [
  { key: 'ORDER', label: 'Orders' },
  { key: 'ORDER_CORRECTION', label: 'Corrections' },
  { key: 'ORDER_CONFIRMATION', label: 'Confirmations' },
  { key: 'NON_ORDER', label: 'Non-Order' },
  { key: 'QUESTION', label: 'Questions' },
  { key: 'COMPLAINT', label: 'Complaints' },
  { key: 'GREETING', label: 'Greetings' },
  { key: 'UNKNOWN', label: 'Unknown' },
];

export const WhatsAppMonitor: React.FC = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState<WhatsAppMonitoringStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [retryNote, setRetryNote] = useState<string | null>(null);

  const canRetry = useMemo(() => {
    const res = permissions.canManageWhatsAppOrderProcessing(user || null);
    return res.allowed;
  }, [user]);

  const refresh = async () => {
    setRefreshing(true);
    setStats(whatsappMonitoringService.getWhatsAppMonitoringStats());
    setRefreshing(false);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleRetry = (error: ProcessingErrorRecord) => {
    const target = error.message_id || error.external_message_id;
    if (!target) return;
    const res = whatsappIngestionService.retryFailedMessage(target, user?.id || 'system_ai');
    setRetryNote(res.note);
    refresh();
  };

  if (!stats) {
    return (
      <div className="flex items-center justify-center py-20 text-slate-500">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading monitoring data...
      </div>
    );
  }

  const kpiCards = [
    { title: 'Messages Today', value: stats.messagesToday, description: `${stats.inboundToday} inbound · ${stats.outboundToday} outbound`, icon: <MessageSquare className="w-4 h-4" />, accent: 'navy' as const },
    { title: 'Orders Detected', value: stats.ordersDetected, description: 'Drafts parsed into order references', icon: <ShoppingBag className="w-4 h-4" />, accent: 'teal' as const },
    { title: 'Orders Confirmed', value: stats.ordersConfirmed, description: 'Confirmed + forwarded', icon: <CheckCircle2 className="w-4 h-4" />, accent: 'green' as const },
    { title: 'Needs Clarification', value: stats.needsClarification, description: 'Awaiting customer input', icon: <HelpCircle className="w-4 h-4" />, accent: 'amber' as const },
    { title: 'Human Reviews', value: stats.humanReviews, description: 'Escalated to a person', icon: <UserCog className="w-4 h-4" />, accent: 'violet' as const },
    { title: 'Failed Messages', value: stats.failedMessages, description: 'Stuck in error state', icon: <XCircle className="w-4 h-4" />, accent: 'red' as const },
    { title: 'Failed Sends', value: stats.failedSends, description: 'Outbound dispatch failures', icon: <Send className="w-4 h-4" />, accent: 'red' as const },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">WhatsApp Ordering Monitor</h1>
          <p className="text-sm text-slate-500 mt-1">
            Production KPIs for the WhatsApp ordering pipeline · {stats.dateKey}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {stats.openProcessingErrors > 0 && (
            <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset bg-red-50 text-red-700 ring-red-200">
              <AlertTriangle className="w-3 h-3" /> {stats.openProcessingErrors} open error(s)
            </span>
          )}
          <Button variant="secondary" size="sm" onClick={refresh} disabled={refreshing}>
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {retryNote && (
        <div className="bg-teal-50 border border-teal-200 text-teal-800 text-sm rounded-lg px-4 py-3">{retryNote}</div>
      )}

      {/* Core KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-4">
        {kpiCards.map((k) => (
          <StatCard key={k.title} title={k.title} value={k.value} description={k.description} icon={k.icon} accent={k.accent} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Open processing errors */}
        <Card className="lg:col-span-2">
          <CardHeader
            title="Open Processing Errors"
            subtitle="Failures never silently disappear — review or retry them here."
            icon={<AlertTriangle className="w-4 h-4 text-red-600" />}
          />
          <CardBody className="p-0">
            {stats.openErrors.length === 0 ? (
              <div className="flex items-center gap-2 p-6 text-sm text-emerald-700">
                <CheckCircle2 className="w-4 h-4" /> No open processing errors. The pipeline is healthy.
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-[#D9E2EC]">
                    <th className="px-4 py-2.5">Stage</th>
                    <th className="px-4 py-2.5">Message</th>
                    <th className="px-4 py-2.5">Error</th>
                    <th className="px-4 py-2.5">Attempts</th>
                    <th className="px-4 py-2.5">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.openErrors.map((e) => (
                    <tr key={e.id} className="border-b border-[#F0F4F8]">
                      <td className="px-4 py-3"><span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider ring-1 ring-inset bg-red-50 text-red-700 ring-red-200">{e.stage}</span></td>
                      <td className="px-4 py-3 text-slate-700 max-w-[220px] truncate">{e.raw_message_text || '—'}</td>
                      <td className="px-4 py-3 text-slate-500 max-w-[260px] truncate" title={e.error_message}>{e.error_message}</td>
                      <td className="px-4 py-3">{e.attempt_count}</td>
                      <td className="px-4 py-3">
                        {canRetry && (e.message_id || e.external_message_id) ? (
                          <Button variant="secondary" size="sm" onClick={() => handleRetry(e)}>
                            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Retry
                          </Button>
                        ) : (
                          <Link to="/whatsapp-conversations" className="text-teal-600 text-xs font-semibold hover:underline">Review</Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        {/* Classification breakdown */}
        <Card>
          <CardHeader
            title="Message Classification"
            subtitle="Today's inbound volume by type"
            icon={<Activity className="w-4 h-4 text-teal-600" />}
          />
          <CardBody className="space-y-3">
            {classificationOrder.map((c) => {
              const count = stats.byClassification[c.key] || 0;
              const total = stats.inboundToday || 1;
              const pct = Math.round((count / total) * 100);
              return (
                <div key={c.key} className="flex items-center gap-3">
                  <Badge badge={getMessageClassificationBadge(c.key)} className="w-36 justify-center" />
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-xs font-bold text-slate-700 w-8 text-right">{count}</span>
                </div>
              );
            })}
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Failed reminders */}
        <Card>
          <CardHeader
            title="Failed Reminders"
            subtitle="Automated daily order-request reminders that failed to send"
            icon={<BellOff className="w-4 h-4 text-amber-600" />}
          />
          <CardBody className="p-0">
            {stats.failedRemindersList.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No failed reminders.</div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wider text-slate-500 border-b border-[#D9E2EC]">
                    <th className="px-4 py-2.5">Customer</th>
                    <th className="px-4 py-2.5">Delivery Date</th>
                    <th className="px-4 py-2.5">Reason</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.failedRemindersList.slice(0, 10).map((r) => (
                    <tr key={r.id} className="border-b border-[#F0F4F8]">
                      <td className="px-4 py-3">{r.customer?.company_name || 'Unknown'}</td>
                      <td className="px-4 py-3">{r.delivery_date}</td>
                      <td className="px-4 py-3 text-slate-500">{r.error_reason || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardBody>
        </Card>

        {/* Recent intake activity */}
        <Card>
          <CardHeader
            title="Recent Order Intake Activity"
            subtitle="Latest pipeline events (audit trail)"
            icon={<Activity className="w-4 h-4 text-teal-600" />}
          />
          <CardBody className="p-0">
            {stats.recentActivity.length === 0 ? (
              <div className="p-6 text-sm text-slate-500">No intake activity yet.</div>
            ) : (
              <ul className="divide-y divide-[#F0F4F8]">
                {stats.recentActivity.map((e) => (
                  <li key={e.id} className="px-4 py-2.5 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-slate-700 truncate">{e.description}</span>
                      <Pill>{e.event_type}</Pill>
                    </div>
                    <div className="text-xs text-slate-400 mt-0.5">
                      {new Date(e.created_at).toLocaleTimeString()}
                      {e.conversation_id && (
                        <Link className="ml-2 text-teal-600 hover:underline" to={`/whatsapp-conversations?conversation=${encodeURIComponent(e.conversation_id)}`}>
                          open conversation
                        </Link>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default WhatsAppMonitor;
