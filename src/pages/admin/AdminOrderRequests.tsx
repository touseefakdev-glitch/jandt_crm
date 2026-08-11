import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { OrderRequestConfig, OrderRequestReminder, OrderRequestReminderStatus } from '../../types';
import { localDb } from '../../services/db';
import { permissions } from '../../services/permissions';
import { dailyOrderRequestService, OrderRequestRunResult } from '../../services/dailyOrderRequestService';
import { formatDeliveryDateLabel, isSendTimeNow, getTomorrowInTimezone } from '../../services/dailyOrderRequestCore';
import {
  ShieldAlert,
  Zap,
  RotateCcw,
  MessageSquareText,
  PlayCircle,
  Clock,
  Globe,
  SendHorizonal,
} from 'lucide-react';
import { Badge, Button, Card, Input, Select, Table, TableToolbar, TBody, Td, Th, THead, Tr, Textarea, useToast } from '../../components/ui';

const COMMON_TIMEZONES = [
  'America/Vancouver',
  'America/Edmonton',
  'America/Regina',
  'America/Winnipeg',
  'America/Toronto',
  'America/Halifax',
  'America/St_Johns',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'America/Phoenix',
  'America/Anchorage',
  'America/Vancouver',
];

export const AdminOrderRequests: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const canManage = permissions.canManageOrderRequestAutomation(user).allowed;

  const [config, setConfig] = useState<OrderRequestConfig | null>(null);
  const [reminders, setReminders] = useState<OrderRequestReminder[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [isRunning, setIsRunning] = useState(false);
  const [retryingId, setRetryingId] = useState<string | null>(null);
  const [lastRun, setLastRun] = useState<OrderRequestRunResult | null>(null);
  const [previewText, setPreviewText] = useState('');

  const loadConfig = () => setConfig(localDb.getOrderRequestConfig());
  const loadReminders = () => setReminders(localDb.getOrderRequestReminders());

  useEffect(() => {
    if (!canManage) return;
    loadConfig();
    loadReminders();
  }, [canManage]);

  const tomorrow = useMemo(() => getTomorrowInTimezone(config?.timezone || 'America/Vancouver'), [config?.timezone]);

  const filteredReminders = useMemo(() => {
    let list = reminders;
    if (statusFilter !== 'all') list = list.filter(r => r.status === statusFilter);
    if (dateFilter) list = list.filter(r => r.delivery_date === dateFilter);
    return list;
  }, [reminders, statusFilter, dateFilter]);

  useEffect(() => {
    if (config) {
      setPreviewText(
        config.template
          .replace(/\{\{customer_name\}\}/g, 'Example Customer Ltd')
          .replace(/\{\{route\}\}/g, 'Kelowna')
          .replace(/\{\{delivery_date\}\}/g, formatDeliveryDateLabel(tomorrow.dateKey))
      );
    }
  }, [config, tomorrow]);

  if (!canManage) {
    return (
      <Card className="p-8 text-center border-amber-200 bg-amber-50">
        <ShieldAlert className="w-12 h-12 text-amber-600 mx-auto mb-3" />
        <h2 className="text-lg font-bold text-slate-900">Access Restricted</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto mt-1">
          Only System Administrators can configure the automated daily order request.
        </p>
      </Card>
    );
  }

  const handleSaveConfig = () => {
    if (!config || !user) return;
    try {
      localDb.updateOrderRequestConfig(config, user.id);
      toast({ type: 'success', title: 'Configuration Saved', message: 'Daily order request automation settings updated.' });
      loadConfig();
    } catch (err: any) {
      toast({ type: 'error', title: 'Save Failed', message: err.message });
    }
  };

  const handleRunNow = async () => {
    if (!user) return;
    setIsRunning(true);
    setLastRun(null);
    try {
      const result = await dailyOrderRequestService.runDailyOrderRequest(user.id);
      setLastRun(result);
      loadReminders();
      toast({
        type: result.failed > 0 ? 'error' : 'success',
        title: 'Daily Order Request Run Complete',
        message: `Sent ${result.sent}, skipped ${result.skipped}, failed ${result.failed}`,
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'Run Failed', message: err.message });
    } finally {
      setIsRunning(false);
    }
  };

  const handleRetry = async (reminder: OrderRequestReminder) => {
    if (!user) return;
    setRetryingId(reminder.id);
    try {
      const result = await dailyOrderRequestService.retryOrderRequestReminder(reminder, user.id);
      loadReminders();
      toast({
        type: result.success ? 'success' : 'error',
        title: result.success ? 'Reminder Re-sent' : 'Retry Failed',
        message: result.success ? `Order request re-sent to ${reminder.customer_name}.` : (result.error || 'Retry failed.'),
      });
    } catch (err: any) {
      toast({ type: 'error', title: 'Retry Error', message: err.message });
    } finally {
      setRetryingId(null);
    }
  };

  const sentCount = reminders.filter(r => r.status === 'sent').length;
  const failedCount = reminders.filter(r => r.status === 'failed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Automated Daily Order Request</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Automatically asks active customers on tomorrow's delivery routes for their orders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button size="sm" variant="secondary" onClick={() => { loadConfig(); loadReminders(); }}>
            Refresh
          </Button>
          <Button size="sm" variant="primary" onClick={handleRunNow} disabled={isRunning} icon={<Zap className="w-4 h-4" />}>
            {isRunning ? 'Running...' : 'Run Now'}
          </Button>
        </div>
      </div>

      {/* Automation Status Strip */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide">
            <Clock className="w-4 h-4 text-brand-600" /> Status
          </div>
          <div className="mt-2">
            <Badge badge={config?.enabled ? {
              subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
              solid: 'bg-emerald-600 text-white',
              dot: 'bg-emerald-500',
              label: 'Enabled',
            } : {
              subtle: 'bg-slate-100 text-slate-600 ring-slate-200',
              solid: 'bg-slate-500 text-white',
              dot: 'bg-slate-400',
              label: 'Disabled',
            }} />
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide">
            <SendHorizonal className="w-4 h-4 text-brand-600" /> Next Run
          </div>
          <p className="mt-2 text-sm font-bold text-slate-900">
            {config?.send_time || '09:00'} {config?.timezone || 'America/Vancouver'}
          </p>
          <p className="text-[10px] text-slate-500">{config?.enabled ? 'Scheduled via Vercel Cron (every 30 min, timezone-aware)' : 'Automation disabled'}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide">
            <MessageSquareText className="w-4 h-4 text-brand-600" /> Sent
          </div>
          <p className="mt-2 text-2xl font-bold text-emerald-600">{sentCount}</p>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-600 uppercase tracking-wide">
            <RotateCcw className="w-4 h-4 text-brand-600" /> Failed
          </div>
          <p className="mt-2 text-2xl font-bold text-rose-600">{failedCount}</p>
        </Card>
      </div>

      {/* Last Run Summary */}
      {lastRun && (
        <Card className="p-4 border-emerald-200 bg-emerald-50/50">
          <h3 className="text-sm font-bold text-slate-900">Last Run — {lastRun.deliveryDateLabel}</h3>
          <p className="text-xs text-slate-600 mt-1">
            Routes: <span className="font-semibold">{lastRun.routes.length > 0 ? lastRun.routes.join(', ') : 'None'}</span>
            {' '}· Eligible customers: <span className="font-semibold">{lastRun.eligibleCustomers}</span>
            {' '}· Sent: <span className="font-semibold text-emerald-700">{lastRun.sent}</span>
            {' '}· Skipped (already sent): <span className="font-semibold">{lastRun.skipped}</span>
            {' '}· Failed: <span className="font-semibold text-rose-700">{lastRun.failed}</span>
          </p>
        </Card>
      )}

      {/* Configuration Card */}
      {config && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Automation Configuration</h3>
            <span className="text-[10px] font-mono text-slate-400">send time check: {isSendTimeNow(config.send_time, config.timezone) ? 'MATCHING NOW' : 'idle'}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Input
                label="Send Time (24h, business timezone)"
                type="time"
                value={config.send_time}
                onChange={(e) => setConfig({ ...config, send_time: e.target.value })}
              />
            </div>
            <Select
              label="Business Timezone"
              value={config.timezone}
              onChange={(e) => setConfig({ ...config, timezone: e.target.value })}
            >
              {COMMON_TIMEZONES.map(tz => <option key={tz} value={tz}>{tz}</option>)}
            </Select>
            <div className="flex items-end pb-1">
              <Button variant={config.enabled ? 'outline' : 'secondary'} size="sm" onClick={() => setConfig({ ...config, enabled: !config.enabled })} icon={<Globe className="w-4 h-4" />}>
                {config.enabled ? 'Disable Automation' : 'Enable Automation'}
              </Button>
            </div>
          </div>

          <Textarea
            label="Order Request Template"
            value={config.template}
            onChange={(e) => setConfig({ ...config, template: e.target.value })}
            className="min-h-[150px] font-mono text-xs"
            hint="Placeholders: {{customer_name}}, {{route}}, {{delivery_date}}"
          />

          <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1.5">Preview</p>
              <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans">{previewText}</pre>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-[10px] uppercase font-bold text-slate-500 mb-1.5">Tomorrow's Routes</p>
              <div className="flex flex-wrap gap-1.5">
                {(localDb.getRouteSchedules().length > 0
                  ? localDb.getRouteSchedules().filter(s => s.active && s.day_of_week === tomorrow.dayName.toLowerCase())
                  : [])
                  .map(s => (
                    <span key={s.id} className="text-[10px] px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-200 font-semibold">
                      {s.city_or_route}
                    </span>
                  ))}
                {localDb.getRouteSchedules().filter(s => s.active && s.day_of_week === tomorrow.dayName.toLowerCase()).length === 0 && (
                  <span className="text-xs text-slate-400">No active routes configured for {tomorrow.dayName}.</span>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button size="sm" variant="primary" onClick={handleSaveConfig} icon={<PlayCircle className="w-4 h-4" />}>
              Save Configuration
            </Button>
          </div>
        </Card>
      )}

      {/* Reminders Table */}
      <Card flush>
        <TableToolbar>
        <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <h3 className="text-sm font-bold text-slate-900">Order Request History</h3>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs">
              <option value="all">All Statuses</option>
              <option value="sent">Sent</option>
              <option value="failed">Failed</option>
            </Select>
            <Input type="date" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} className="text-xs" />
          </div>
        </div>
        </TableToolbar>

        {filteredReminders.length > 0 ? (
          <Table minWidth={1220}>
            <THead>
              <Tr hover={false}>
                <Th width={200}>Customer</Th>
                <Th width={180}>Route</Th>
                <Th width={130}>Delivery Date</Th>
                <Th width={120}>Status</Th>
                <Th width={160}>Sent At</Th>
                <Th width={260}>Reason / Message ID</Th>
                <Th width={120} align="right">Action</Th>
              </Tr>
            </THead>
            <TBody>
              {filteredReminders.map((r) => (
                <Tr key={r.id}>
                  <Td width={200} truncate maxWidth={200}>
                    <span className="font-semibold text-slate-900 text-xs truncate">{r.customer_name}</span>
                  </Td>
                  <Td width={180} truncate maxWidth={180}>
                    <span className="text-xs text-slate-600 truncate">{r.route}</span>
                  </Td>
                  <Td width={130}>
                    <span className="text-xs font-mono text-slate-700">{r.delivery_date}</span>
                  </Td>
                  <Td width={120}>
                    <Badge badge={r.status === 'sent' ? {
                      subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
                      solid: 'bg-emerald-600 text-white',
                      dot: 'bg-emerald-500',
                      label: 'Sent',
                    } : {
                      subtle: 'bg-rose-50 text-rose-700 ring-rose-200',
                      solid: 'bg-rose-600 text-white',
                      dot: 'bg-rose-500',
                      label: 'Failed',
                    }} />
                  </Td>
                  <Td width={160} truncate maxWidth={160}>
                    <span className="text-xs text-slate-600 truncate">{r.sent_at ? new Date(r.sent_at).toLocaleString() : '—'}</span>
                  </Td>
                  <Td width={260} truncate maxWidth={260}>
                    {r.status === 'failed' ? (
                      <span className="text-[10px] text-rose-600 font-mono break-all">{r.error_reason || 'unknown error'}</span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-mono break-all">{r.message_id || '—'}</span>
                    )}
                  </Td>
                  <Td width={120} align="right">
                    {r.status === 'failed' && (
                      <Button size="sm" variant="outline" disabled={retryingId === r.id} onClick={() => handleRetry(r)} icon={<RotateCcw className="w-3.5 h-3.5" />}>
                        {retryingId === r.id ? 'Retrying...' : 'Retry'}
                      </Button>
                    )}
                  </Td>
                </Tr>
              ))}
            </TBody>
          </Table>
        ) : (
          <div className="p-12 text-center text-slate-500 text-xs">
            <MessageSquareText className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700">No order request records found.</p>
            <p className="mt-1">Run the automation to generate reminders for tomorrow's delivery routes.</p>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AdminOrderRequests;
