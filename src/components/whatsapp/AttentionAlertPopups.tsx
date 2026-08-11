import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { BellRing, X, ArrowRight, Check, FilePlus2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import {
  attentionAlertService,
  subscribeToAttentionAlerts,
  convertAlertToQuery,
} from '../../services/attentionAlertService';
import { AgentAttentionAlert } from '../../types';
import { cn } from '../../utils/cn';
import { getAttentionPriorityBadge } from '../../utils/badges';
import { Badge } from '../ui/Badge';
import { useToast } from '../ui/Toast';

const SEEN_KEY = 'jt_crm_attention_seen_alerts';
const MAX_VISIBLE = 3;

interface PopupEntry {
  alert: AgentAttentionAlert;
  timestamp: number;
}

function loadSeen(): Set<string> {
  try {
    const raw = sessionStorage.getItem(SEEN_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveSeen(seen: Set<string>) {
  try {
    sessionStorage.setItem(SEEN_KEY, JSON.stringify(Array.from(seen)));
  } catch {
    /* sessionStorage unavailable — seen tracking is best-effort */
  }
}

/**
 * Global in-app popup center for Phase 6 human-attention alerts.
 *
 * Renders a toast-style card for each new attention alert with:
 *   Open Conversation | Dismiss | Create Query
 * Pops alerts raised live via `raiseAttentionAlert` and replays the most
 * recent unresolved alerts on mount (without re-popping dismissed ones).
 */
export const AttentionAlertPopups: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [popups, setPopups] = useState<PopupEntry[]>([]);
  const seenRef = useRef<Set<string>>(loadSeen());

  const dismissPopup = useCallback((alertId: string) => {
    setPopups((prev) => prev.filter((p) => p.alert.id !== alertId));
  }, []);

  const markSeen = useCallback((alertId: string) => {
    if (seenRef.current.has(alertId)) return;
    const next = new Set(seenRef.current);
    next.add(alertId);
    seenRef.current = next;
    saveSeen(next);
  }, []);

  const pushPopup = useCallback(
    (alert: AgentAttentionAlert) => {
      if (seenRef.current.has(alert.id)) return;
      markSeen(alert.id);
      setPopups((prev) => {
        if (prev.some((p) => p.alert.id === alert.id)) return prev;
        return [...prev, { alert, timestamp: Date.now() }].slice(-MAX_VISIBLE);
      });
    },
    [markSeen]
  );

  // Live subscription: new alerts raised while the app is open.
  useEffect(() => {
    const unsubscribe = subscribeToAttentionAlerts(pushPopup);
    return unsubscribe;
  }, [pushPopup]);

  // Replay the newest unresolved alerts on mount (recent activity from other
  // sessions / refreshes) without re-popping ones already seen this session.
  useEffect(() => {
    const openAlerts = attentionAlertService.getOpenAlerts();
    openAlerts.slice(0, MAX_VISIBLE).forEach((alert) => pushPopup(alert));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userId = user?.id || '00000000-0000-0000-0000-000000000001';

  const handleOpen = (alert: AgentAttentionAlert) => {
    dismissPopup(alert.id);
    const path = alert.conversation_id
      ? `/whatsapp-conversations?conversation=${encodeURIComponent(alert.conversation_id)}`
      : '/whatsapp-conversations';
    navigate(path);
  };

  const handleDismiss = (alert: AgentAttentionAlert) => {
    attentionAlertService.resolveAlert(alert.id, userId, 'Dismissed by agent');
    dismissPopup(alert.id);
    toast({ type: 'success', title: 'Alert dismissed', message: 'The attention alert was marked resolved.' });
  };

  const handleCreateQuery = (alert: AgentAttentionAlert) => {
    if (!alert.customer_id) {
      toast({ type: 'error', title: 'Cannot create query', message: 'This alert has no linked customer account. Open the conversation to review it.' });
      return;
    }
    const customerName = alert.customer?.company_name || 'Unknown Customer';
    const result = convertAlertToQuery(alert, userId, `WhatsApp Attention — ${customerName}`);
    dismissPopup(alert.id);
    if (result.queryId) {
      toast({
        type: 'success',
        title: 'Support query created',
        message: 'The alert was converted into the existing Customer Query module (no duplicate ticket system).',
      });
    } else {
      toast({ type: 'error', title: 'Query creation failed', message: 'The alert could not be converted to a support query.' });
    }
  };

  if (popups.length === 0) return null;

  return createPortal(
    <div className="fixed bottom-4 right-4 z-[70] flex flex-col gap-3 w-[min(23rem,calc(100vw-2rem))]" role="region" aria-label="Customer attention alerts">
      {popups.map(({ alert }) => {
        const customerName = alert.customer?.company_name || 'Unknown Customer';
        return (
          <div
            key={alert.id}
            className="bg-white rounded-xl border border-rose-200 shadow-overlay overflow-hidden animate-slide-in-up"
          >
            {/* Header */}
            <div className="px-4 py-2.5 bg-rose-600 text-white flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <BellRing className="w-4 h-4 shrink-0 animate-pulse" />
                <span className="text-xs font-extrabold uppercase tracking-wide truncate">
                  Customer Needs Attention
                </span>
              </div>
              <button
                onClick={() => dismissPopup(alert.id)}
                aria-label="Close alert popup"
                className="text-white/70 hover:text-white transition-colors shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body */}
            <div className="p-4 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-extrabold text-slate-900 truncate">{customerName}</span>
                <Badge badge={getAttentionPriorityBadge(alert.priority)} />
              </div>
              <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-line line-clamp-3">
                "{alert.message_text}"
              </p>
              {alert.classification && (
                <p className="text-[10px] font-mono text-slate-400">
                  Classified as <span className="font-bold text-rose-600">{alert.classification}</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="px-4 pb-4 flex flex-col gap-1.5">
              <button
                onClick={() => handleOpen(alert)}
                className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-[8px] transition-colors"
              >
                Open Conversation
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => handleCreateQuery(alert)}
                  disabled={!alert.customer_id}
                  className={cn(
                    'inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold rounded-[8px] transition-colors',
                    alert.customer_id
                      ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
                      : 'bg-slate-50 text-slate-400 border border-slate-200 cursor-not-allowed'
                  )}
                >
                  <FilePlus2 className="w-3.5 h-3.5" />
                  Create Query
                </button>
                <button
                  onClick={() => handleDismiss(alert)}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 rounded-[8px] transition-colors"
                >
                  <Check className="w-3.5 h-3.5" />
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>,
    document.body
  );
};
