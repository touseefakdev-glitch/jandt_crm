import React, { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import { useAuth } from '../../context/AuthContext';
import { permissions } from '../../services/permissions';
import { whatsappConnectorService, WhatsAppConnectorStatus, OutboxSummary } from '../../services/whatsappConnectorService';
import { Card, CardHeader, CardBody, Badge, Button, ConfirmDialog } from '../../components/ui';
import {
  Wifi,
  WifiOff,
  RefreshCw,
  QrCode,
  Send,
  AlertTriangle,
  CheckCircle2,
  Clock,
  MessageSquare,
  ShieldAlert,
  Server,
  Cloud,
  Layers,
  Unlink,
  ExternalLink
} from 'lucide-react';

const QRCanvas: React.FC<{ data: string }> = ({ data }) => {
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);

  React.useEffect(() => {
    if (canvasRef.current && data) {
      QRCode.toCanvas(canvasRef.current, data, {
        width: 230,
        margin: 2,
        color: { dark: '#0f172a', light: '#ffffff' }
      }, (err) => {
        if (err) console.error('QR rendering error:', err);
      });
    }
  }, [data]);

  return <canvas ref={canvasRef} className="w-[230px] h-[230px] rounded-lg border border-slate-100" />;
};

export const AdminWhatsAppSettings: React.FC = () => {
  const { user } = useAuth();
  const [status, setStatus] = useState<WhatsAppConnectorStatus | null>(null);
  const [outbox, setOutbox] = useState<OutboxSummary>({ pending: 0, sending: 0, sent: 0, failed: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [unlinkModalOpen, setUnlinkModalOpen] = useState(false);
  const [testModalOpen, setTestModalOpen] = useState(false);
  const [testJid, setTestJid] = useState('');
  const [testMessage, setTestMessage] = useState('Test automated outbound message from JT CRM Cloud Connector.');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const [detectedGroups, setDetectedGroups] = useState<{ jid: string; lastMessage?: string }[]>([]);
  const [copiedJid, setCopiedJid] = useState<string | null>(null);

  const canManage = permissions.canManageWhatsAppOrderProcessing(user || null).allowed;

  const loadData = async () => {
    setLoading(true);
    const connectorStatus = await whatsappConnectorService.getConnectorStatus();
    const outboxSummary = await whatsappConnectorService.getOutboxSummary();
    setStatus(connectorStatus);
    setOutbox(outboxSummary);

    // Fetch detected WhatsApp groups from Supabase
    try {
      const { supabase } = await import('../../services/supabaseSync');
      if (supabase) {
        const { data: groupMsgs } = await supabase
          .from('messages')
          .select('remote_jid, text')
          .like('remote_jid', '%@g.us')
          .order('created_at', { ascending: false })
          .limit(50);

        if (groupMsgs) {
          const map = new Map<string, string>();
          groupMsgs.forEach((m: { remote_jid: string; text: string }) => {
            if (!map.has(m.remote_jid)) {
              map.set(m.remote_jid, m.text);
            }
          });
          const list = Array.from(map.entries()).map(([jid, lastMessage]) => ({ jid, lastMessage }));
          setDetectedGroups(list);
        }
      }
    } catch (e) {}

    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 10000); // 10s auto refresh
    return () => clearInterval(interval);
  }, []);

  const handleReconnect = async () => {
    setActionLoading(true);
    setFeedback(null);
    const success = await whatsappConnectorService.requestReconnect();
    if (success) {
      setFeedback({ type: 'success', msg: 'Reconnection request dispatched to cloud worker.' });
      await loadData();
    } else {
      setFeedback({ type: 'error', msg: 'Failed to trigger reconnection request.' });
    }
    setActionLoading(false);
  };

  const handleUnlink = async () => {
    setActionLoading(true);
    setUnlinkModalOpen(false);
    setFeedback(null);
    const success = await whatsappConnectorService.unlinkSession();
    if (success) {
      setFeedback({ type: 'success', msg: 'WhatsApp session cleared. Please scan the new QR code below to pair.' });
      await loadData();
    } else {
      setFeedback({ type: 'error', msg: 'Failed to clear session.' });
    }
    setActionLoading(false);
  };

  const handleSendTestMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testJid.trim()) return;
    setActionLoading(true);
    setFeedback(null);

    let formattedJid = testJid.trim();
    if (!formattedJid.includes('@')) {
      const cleanDigits = formattedJid.replace(/[^0-9]/g, '');
      formattedJid = `${cleanDigits}@s.whatsapp.net`;
    }

    const res = await whatsappConnectorService.enqueueOutboundMessage(formattedJid, testMessage);
    if (res.success) {
      setFeedback({ type: 'success', msg: `Test message queued in outbox (ID: ${res.id}).` });
      setTestModalOpen(false);
      await loadData();
    } else {
      setFeedback({ type: 'error', msg: `Failed to queue message: ${res.error}` });
    }
    setActionLoading(false);
  };

  if (!canManage) {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <Card className="border-red-200 bg-red-50/50">
          <CardBody className="flex items-center gap-4 py-8 font-sans">
            <ShieldAlert className="w-10 h-10 text-red-600 flex-shrink-0" />
            <div>
              <h3 className="text-lg font-bold text-slate-900">Access Restricted</h3>
              <p className="text-sm text-slate-600 mt-1">
                You must have Administrator privileges to manage WhatsApp Connector infrastructure settings.
              </p>
            </div>
          </CardBody>
        </Card>
      </div>
    );
  }

  const getStatusBadge = (st?: string) => {
    switch (st) {
      case 'CONNECTED':
        return <Badge badge={{ subtle: 'bg-emerald-50 text-emerald-700 ring-emerald-200', solid: 'bg-emerald-600 text-white', dot: 'bg-emerald-500 animate-pulse', label: 'CONNECTED (ONLINE)' }} />;
      case 'CONNECTING':
      case 'RECONNECTING':
        return <Badge badge={{ subtle: 'bg-amber-50 text-amber-700 ring-amber-200', solid: 'bg-amber-500 text-white', dot: 'bg-amber-500 animate-spin', label: 'RECONNECTING' }} />;
      case 'AUTH_REQUIRED':
        return <Badge badge={{ subtle: 'bg-violet-50 text-violet-700 ring-violet-200', solid: 'bg-violet-600 text-white', dot: 'bg-violet-500', label: 'PAIRING REQUIRED' }} />;
      case 'OFFLINE':
      case 'DISCONNECTED':
      case 'ERROR':
      default:
        return <Badge badge={{ subtle: 'bg-rose-50 text-rose-700 ring-rose-200', solid: 'bg-rose-600 text-white', dot: 'bg-rose-500', label: 'OFFLINE' }} />;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">WhatsApp Infrastructure & Status</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
              <Cloud className="w-3.5 h-3.5" /> Cloud Architecture
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            24/7 persistent cloud worker monitoring, heartbeat diagnostics, and QR device pairing
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />} onClick={loadData}>
            Refresh Status
          </Button>
          <Button variant="primary" size="sm" icon={<Send className="w-3.5 h-3.5" />} onClick={() => setTestModalOpen(true)}>
            Test Outbox Dispatch
          </Button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center justify-between text-sm ${feedback.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-red-50 border-red-200 text-red-800'}`}>
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <span className="font-medium">{feedback.msg}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-xs font-bold underline hover:opacity-75">Dismiss</button>
        </div>
      )}

      {/* Offline Alert Banner */}
      {status?.status === 'OFFLINE' && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm">WhatsApp Automation is Currently Offline</h4>
            <p className="text-xs text-rose-700 leading-relaxed">
              The persistent cloud worker missed its 15-second heartbeat ({status.seconds_since_heartbeat}s since last check-in). 
              CRM manual operations, customer records, and orders remain 100% active, but automated WhatsApp order ingestion is paused.
            </p>
          </div>
        </div>
      )}

      {/* Main Status & Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Status Card */}
        <Card className="md:col-span-2">
          <CardBody className="p-5 flex items-center justify-between">
            <div className="space-y-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">Service Connection State</span>
              <div className="flex items-center gap-3">
                {getStatusBadge(status?.status)}
              </div>
              <p className="text-xs text-slate-500">
                Worker Instance: <span className="font-mono font-semibold text-slate-700">{status?.connector_name || 'default_connector'}</span> (v{status?.version || '1.0.0'})
              </p>
            </div>
            <div className="p-3 bg-slate-100 rounded-2xl">
              {status?.status === 'CONNECTED' ? (
                <Wifi className="w-8 h-8 text-emerald-600" />
              ) : (
                <WifiOff className="w-8 h-8 text-rose-500" />
              )}
            </div>
          </CardBody>
        </Card>

        {/* Heartbeat Card */}
        <Card>
          <CardBody className="p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Last Heartbeat</span>
              <Clock className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {status ? `${status.seconds_since_heartbeat}s ago` : '—'}
            </div>
            <p className="text-[11px] text-slate-500">
              {status?.is_offline ? '⚠️ Heartbeat Expired (>45s)' : '✅ Heartbeat Active (15s cycle)'}
            </p>
          </CardBody>
        </Card>

        {/* Daily Messages Card */}
        <Card>
          <CardBody className="p-5 space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Today's Traffic</span>
              <MessageSquare className="w-4 h-4 text-slate-400" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900">
              {status ? `${status.messages_received_today + status.messages_sent_today}` : '0'}
            </div>
            <p className="text-[11px] text-slate-500 font-mono">
              In: {status?.messages_received_today || 0} · Out: {status?.messages_sent_today || 0}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* QR Code Device Pairing Section (When Auth Required) */}
      {status?.status === 'AUTH_REQUIRED' && (
        <Card className="border-2 border-violet-300 bg-gradient-to-br from-violet-50/50 to-white">
          <CardHeader title="WhatsApp Device Pairing Required" icon={<QrCode className="w-5 h-5 text-violet-600" />} />
          <CardBody className="p-6">
            <div className="flex flex-col md:flex-row items-center gap-8">
              <div className="p-4 bg-white rounded-2xl shadow-md border border-slate-200 flex flex-col items-center">
                {status.qr_code_data ? (
                  <QRCanvas data={status.qr_code_data} />
                ) : (
                  <div className="w-56 h-56 flex flex-col items-center justify-center text-slate-400 space-y-2 bg-slate-50 rounded-lg">
                    <RefreshCw className="w-8 h-8 animate-spin text-violet-600" />
                    <span className="text-xs font-medium text-slate-600">Generating QR code...</span>
                  </div>
                )}
                <span className="text-[11px] font-mono text-slate-500 mt-3">Scan with business phone</span>
              </div>

              <div className="space-y-4 max-w-xl">
                <h3 className="text-base font-bold text-slate-900">Follow these steps to pair your WhatsApp account:</h3>
                <ol className="space-y-2.5 text-sm text-slate-700">
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">1</span>
                    <span>Open <strong>WhatsApp</strong> on your dedicated business smartphone.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">2</span>
                    <span>Tap <strong>Settings / Menu (⋮)</strong> ➔ <strong>Linked Devices</strong>.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-xs font-bold flex items-center justify-center flex-shrink-0 mt-0.5">3</span>
                    <span>Tap <strong>Link a Device</strong> and point your camera at the QR code on this screen.</span>
                  </li>
                </ol>

                <div className="p-3 bg-violet-100/70 text-violet-900 rounded-xl text-xs leading-relaxed font-medium">
                  🔒 Authentication keys will be securely saved to persistent Supabase cloud storage. Your computer can be powered off without losing the connection.
                </div>
              </div>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Diagnostics & Outbox Buffer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outbox Queue Metrics */}
        <Card>
          <CardHeader title="Outbound Message Queue (Outbox)" icon={<Layers className="w-4 h-4 text-brand-600" />} />
          <CardBody className="p-5 space-y-4">
            <div className="grid grid-cols-4 gap-3 text-center">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Pending</span>
                <span className="text-xl font-extrabold text-amber-900">{outbox.pending}</span>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider block">Sending</span>
                <span className="text-xl font-extrabold text-blue-900">{outbox.sending}</span>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">Sent</span>
                <span className="text-xl font-extrabold text-emerald-900">{outbox.sent}</span>
              </div>
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                <span className="text-[10px] font-bold text-red-700 uppercase tracking-wider block">Failed</span>
                <span className="text-xl font-extrabold text-red-900">{outbox.failed}</span>
              </div>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Messages generated by CRM agents or automated triggers enter the outbox queue and are dispatched asynchronously by the cloud connector.
            </p>
          </CardBody>
        </Card>

        {/* Administrative Action Controls */}
        <Card>
          <CardHeader title="Admin Infrastructure Actions" icon={<Server className="w-4 h-4 text-violet-600" />} />
          <CardBody className="p-5 space-y-4">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button
                variant="outline"
                className="flex-1 justify-center"
                icon={<RefreshCw className={`w-4 h-4 ${actionLoading ? 'animate-spin' : ''}`} />}
                onClick={handleReconnect}
                disabled={actionLoading}
              >
                Request Reconnect
              </Button>
              <Button
                variant="danger"
                className="flex-1 justify-center"
                icon={<Unlink className="w-4 h-4" />}
                onClick={() => setUnlinkModalOpen(true)}
                disabled={actionLoading}
              >
                Unlink Session
              </Button>
            </div>

            {status?.error_message && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Last Reported Error</span>
                <span className="text-xs font-mono text-slate-700 mt-1 block">{status.error_message}</span>
              </div>
            )}
          </CardBody>
        </Card>
      </div>

      {/* WhatsApp Group JID Directory & Inspector */}
      <Card>
        <CardHeader
          title="Detected WhatsApp Groups & JID Directory"
          icon={<MessageSquare className="w-4 h-4 text-purple-600" />}
          actions={
            <Button size="sm" variant="outline" onClick={loadData} icon={<RefreshCw className="w-3.5 h-3.5" />}>
              Refresh Directory
            </Button>
          }
        />
        <CardBody className="p-5 space-y-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            WhatsApp Group JIDs end with <code className="px-1.5 py-0.5 bg-purple-50 text-purple-700 font-mono rounded">@g.us</code>. 
            Send any message in your WhatsApp group on your phone, then click <strong>Refresh Directory</strong> to view and copy the JID string below.
          </p>

          {detectedGroups.length > 0 ? (
            <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
              {detectedGroups.map((group, idx) => (
                <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                  <div className="space-y-0.5 min-w-0 flex-1">
                    <span className="font-bold text-slate-900 font-mono block truncate">{group.jid}</span>
                    <span className="text-[11px] text-slate-500 truncate block">Last Message: "{group.lastMessage}"</span>
                  </div>
                  <Button
                    size="sm"
                    variant={copiedJid === group.jid ? "success" : "outline"}
                    onClick={() => {
                      navigator.clipboard.writeText(group.jid);
                      setCopiedJid(group.jid);
                      setTimeout(() => setCopiedJid(null), 2000);
                    }}
                  >
                    {copiedJid === group.jid ? "Copied!" : "Copy JID"}
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center space-y-2">
              <span className="text-xs font-medium text-slate-600 block">No WhatsApp groups detected yet.</span>
              <span className="text-[11px] text-slate-400 block">Send a test message in any WhatsApp Group on your phone to display its JID string here automatically!</span>
            </div>
          )}
        </CardBody>
      </Card>

      {/* Cloud Deployment Architecture Guide */}
      <Card>
        <CardHeader title="Production Cloud Deployment Guide" icon={<Cloud className="w-4 h-4 text-teal-600" />} />
        <CardBody className="p-5 space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            The WhatsApp Connector worker is housed inside the CRM repository at <code className="px-1.5 py-0.5 bg-slate-100 rounded text-brand-700 font-mono text-xs">/connector</code>. 
            Deploy it as a 24/7 continuous process to any container platform (Railway, Render, Fly.io, or VPS).
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block font-sans">1. Frontend / API</span>
              <span className="text-slate-600 block">Vercel Serverless</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block font-sans">2. Database & State</span>
              <span className="text-slate-600 block">Supabase PostgreSQL</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
              <span className="font-bold text-slate-900 block font-sans">3. Persistent Worker</span>
              <span className="text-slate-600 block">Railway / Docker Container</span>
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Unlink Confirmation Dialog */}
      <ConfirmDialog
        isOpen={unlinkModalOpen}
        onClose={() => setUnlinkModalOpen(false)}
        onConfirm={handleUnlink}
        title="Unlink WhatsApp Session?"
        message="This will clear your saved WhatsApp authentication state from Supabase. You will need to scan a new QR code to reconnect."
        confirmLabel="Unlink Session"
        variant="danger"
        icon={<Unlink className="w-5 h-5" />}
      />

      {/* Outbox Dispatch Test Modal */}
      {testModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Send className="w-5 h-5 text-brand-600" /> Send Test Message via Outbox
            </h3>
            <form onSubmit={handleSendTestMessage} className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Recipient Phone / Group JID
                </label>
                <input
                  type="text"
                  placeholder="+12505550199 or 120363xxx@g.us"
                  value={testJid}
                  onChange={(e) => setTestJid(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl font-mono text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Test Message Body
                </label>
                <textarea
                  rows={3}
                  value={testMessage}
                  onChange={(e) => setTestMessage(e.target.value)}
                  className="w-full px-3 py-2 border rounded-xl text-xs focus:ring-2 focus:ring-brand-500 focus:outline-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button variant="ghost" size="sm" onClick={() => setTestModalOpen(false)} type="button">
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" loading={actionLoading}>
                  Queue Outbound Message
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
