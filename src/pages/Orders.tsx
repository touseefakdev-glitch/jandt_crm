import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DailyOrderOperation, PortalType } from '../types';
import { localDb } from '../services/db';
import { subscribeOrdersRealtime } from '../services/realtime';
import { permissions } from '../services/permissions';
import { formatDate, timeAgo } from '../utils/format';
import {
  ORDER_WORKFLOW_STEPS,
  DailyOpStepKey,
  OrdersQuickFilter,
  getExceptionKind,
  hasOrderException,
  isOperationCompleted,
  isOperationError,
  isOrderDifferent,
  matchesQuickFilter,
} from '../utils/orderWorkflow';
import { SOModal } from '../components/orders/SOModal';
import { InvoiceModal } from '../components/orders/InvoiceModal';
import { ReportErrorModal } from '../components/orders/ReportErrorModal';
import { UndoStepModal } from '../components/orders/UndoStepModal';
import { OrderMatchModal } from '../components/orders/OrderMatchModal';
import { OrderDetailDrawer } from '../components/orders/OrderDetailDrawer';
import {
  Calendar as CalendarIcon,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Search,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Filter,
  Send,
  Scale,
  Wifi,
  WifiOff,
  RefreshCw,
  ShieldCheck,
  Inbox,
  ClipboardList,
  FileText,
  Truck,
  AlertCircle,
} from 'lucide-react';
import {
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Select,
  StatCard,
  Table,
  TableToolbar,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useToast,
  Pagination,
} from '../components/ui';

type AreaView = 'ALL' | 'KELOWNA' | 'OUTSIDE_KELOWNA';

const PAGE_SIZE = 25;

const todayStr = () => new Date().toISOString().split('T')[0];

const QUICK_FILTERS: { value: OrdersQuickFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'exceptions', label: 'Exceptions' },
  { value: 'different', label: 'Different Orders' },
  { value: 'pod_pending', label: 'POD Pending' },
];

export const Orders: React.FC = () => {
  const { user, dbVersion } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const canUpdate = permissions.canUpdateDailyOperations(user).allowed;
  const canRevert = permissions.canRevertDailyOperations(user).allowed;
  const canUpdateOrderMatch = permissions.canUpdateOrderMatch(user).allowed;
  const isAdmin = user?.role === 'admin';
  const userArea = user?.operational_area || 'BOTH';

  const [selectedDateStr, setSelectedDateStr] = useState<string>(todayStr());
  const [selectedArea, setSelectedArea] = useState<AreaView>(isAdmin ? 'ALL' : userArea === 'BOTH' ? 'ALL' : userArea);
  const [selectedRoute, setSelectedRoute] = useState<string>('');

  const [searchTerm, setSearchTerm] = useState('');
  const [quickFilter, setQuickFilter] = useState<OrdersQuickFilter>('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [orderMatchFilter, setOrderMatchFilter] = useState<'all' | 'SAME' | 'DIFFERENT' | 'unset'>('all');
  const [exceptionFilter, setExceptionFilter] = useState<'all' | 'error' | 'different' | 'invoice_updated'>('all');
  const [assignedUserId, setAssignedUserId] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'updated_at' | 'route'>('name');

  const [currentPage, setCurrentPage] = useState(1);
  const [syncState, setSyncState] = useState<'live' | 'polling' | 'offline'>('offline');

  const [activeSOModalOp, setActiveSOModalOp] = useState<DailyOrderOperation | null>(null);
  const [activeInvoiceModalOp, setActiveInvoiceModalOp] = useState<DailyOrderOperation | null>(null);
  const [activeErrorModalOp, setActiveErrorModalOp] = useState<DailyOrderOperation | null>(null);
  const [activeOrderMatchOp, setActiveOrderMatchOp] = useState<DailyOrderOperation | null>(null);
  const [activeUndoModal, setActiveUndoModal] = useState<{
    op: DailyOrderOperation;
    step: DailyOpStepKey;
    stepName: string;
  } | null>(null);
  const [activeDetailOp, setActiveDetailOp] = useState<DailyOrderOperation | null>(null);

  const lastSelfActionRef = useRef(0);
  const lastLiveToastRef = useRef(0);

  const effectiveArea: AreaView = isAdmin ? selectedArea : userArea === 'BOTH' ? 'ALL' : (userArea as 'KELOWNA' | 'OUTSIDE_KELOWNA');
  const areaLabel = effectiveArea === 'KELOWNA' ? 'Kelowna' : effectiveArea === 'OUTSIDE_KELOWNA' ? 'Outside Kelowna' : 'All Areas';
  const portal: PortalType = effectiveArea === 'ALL' ? 'all' : effectiveArea === 'KELOWNA' ? 'kelowna' : 'outside_kelowna';
  const operationalArea = effectiveArea === 'ALL' ? undefined : effectiveArea;

  const markSelfAction = () => {
    lastSelfActionRef.current = Date.now();
  };

  useEffect(() => {
    const stop = subscribeOrdersRealtime(
      (status) => {
        if (status === 'live') setSyncState('live');
        else if (status === 'polling') setSyncState('polling');
        else setSyncState('offline');
      },
      (row, eventType) => {
        if (eventType === 'DELETE') return;
        if (Date.now() - lastSelfActionRef.current < 4000) return;
        const now = Date.now();
        if (now - lastLiveToastRef.current < 6000) return;
        lastLiveToastRef.current = now;
        toast({ type: 'info', title: 'Order updated', message: 'Another agent changed an order in this view.' });
      }
    );
    return stop;
  }, [toast]);

  const baseData = useMemo(() => {
    return localDb.getDailyOrderOperations({
      date: selectedDateStr,
      route: selectedRoute || undefined,
      portal,
      searchTerm,
      statusFilter,
      orderMatchFilter,
      exceptionFilter,
      assignedUserId,
      sortBy,
      operationalArea,
    });
  }, [selectedDateStr, selectedRoute, portal, operationalArea, searchTerm, statusFilter, orderMatchFilter, exceptionFilter, assignedUserId, sortBy, dbVersion]);

  const { operations: baseOperations, activeRoutes, weekday } = baseData;

  const visibleOperations = useMemo(
    () => baseOperations.filter(o => matchesQuickFilter(o, quickFilter)),
    [baseOperations, quickFilter]
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedDateStr, selectedRoute, effectiveArea, searchTerm, quickFilter, statusFilter, orderMatchFilter, exceptionFilter, assignedUserId, dbVersion]);

  const upcomingDates = useMemo(() => {
    const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    return localDb
      .getOperationalDatesForRange(todayStr(), end)
      .filter(d => d.date > todayStr())
      .slice(0, 5);
  }, [dbVersion]);

  const totalPages = Math.max(1, Math.ceil(visibleOperations.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const pagedOperations = visibleOperations.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  useEffect(() => {
    if (selectedRoute && !activeRoutes.includes(selectedRoute)) {
      setSelectedRoute('');
    }
  }, [activeRoutes, selectedRoute]);

  const metrics = useMemo(() => {
    const total = baseOperations.length;
    const received = baseOperations.filter(o => o.order_received).length;
    const salesOrders = baseOperations.filter(o => o.sales_order_generated).length;
    const invoiced = baseOperations.filter(o => o.invoiced).length;
    const dispatched = baseOperations.filter(o => o.dispatched).length;
    const podSent = baseOperations.filter(o => o.pod_sent).length;
    const podPending = baseOperations.filter(o => o.dispatched && !o.pod_sent).length;
    const completed = baseOperations.filter(isOperationCompleted).length;
    const errors = baseOperations.filter(isOperationError).length;
    const different = baseOperations.filter(isOrderDifferent).length;
    const exceptions = baseOperations.filter(hasOrderException).length;
    const pending = total - completed - errors;
    const progress = total > 0 ? Math.round((completed / total) * 100) : 0;

    const quickCounts = Object.fromEntries(
      (['all', 'pending', 'completed', 'exceptions', 'different', 'pod_pending'] as OrdersQuickFilter[])
        .map(q => [q, baseOperations.filter(o => matchesQuickFilter(o, q)).length])
    ) as Record<OrdersQuickFilter, number>;

    return {
      total, received, salesOrders, invoiced, dispatched, podSent,
      podPending, completed, errors, different, exceptions, pending, progress,
      quickCounts,
    };
  }, [baseOperations]);

  const handlePreviousDay = () => {
    const d = new Date(selectedDateStr + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    setSelectedDateStr(d.toISOString().split('T')[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDateStr + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    setSelectedDateStr(d.toISOString().split('T')[0]);
  };

  const handleToday = () => setSelectedDateStr(todayStr());

  const handleTomorrow = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    setSelectedDateStr(d.toISOString().split('T')[0]);
  };

  const tomorrowStr = (() => { const d = new Date(); d.setDate(d.getDate() + 1); return d.toISOString().split('T')[0]; })();
  const isToday = selectedDateStr === todayStr();
  const isTomorrow = selectedDateStr === tomorrowStr;

  const formatWeekdayTitle = (dayStr: string) => dayStr.charAt(0).toUpperCase() + dayStr.slice(1);

  const handleToggleOrderReceived = (op: DailyOrderOperation) => {
    if (!canUpdate) { toast({ type: 'error', title: 'Permission Denied', message: 'You do not have permission to update daily operations.' }); return; }
    if (op.order_received) {
      if (!canRevert) { toast({ type: 'error', title: 'Permission Denied', message: 'Only Sales Agents and Admins can revert completed steps.' }); return; }
      setActiveUndoModal({ op, step: 'order_received', stepName: 'Order Received' });
    } else {
      try {
        localDb.updateDailyOrderOperationStep(op.id, 'order_received', null, user!.id);
        markSelfAction();
        toast({ type: 'success', title: 'Order Received', message: `Marked Order Received for ${op.customer?.company_name}` });
      } catch (err: any) { toast({ type: 'error', title: 'Action Failed', message: err.message }); }
    }
  };

  const handleToggleSalesOrderGenerated = (op: DailyOrderOperation) => {
    if (!canUpdate) { toast({ type: 'error', title: 'Permission Denied', message: 'You do not have permission to update daily operations.' }); return; }
    if (op.sales_order_generated) {
      if (!canRevert) { toast({ type: 'error', title: 'Permission Denied', message: 'Only Sales Agents and Admins can revert completed steps.' }); return; }
      setActiveUndoModal({ op, step: 'sales_order_generated', stepName: 'Sales Order Generated' });
    } else {
      if (!op.order_received) { toast({ type: 'error', title: 'Dependency Required', message: 'Order Received must be completed before generating a Sales Order.' }); return; }
      setActiveSOModalOp(op);
    }
  };

  const handleToggleInvoiced = (op: DailyOrderOperation) => {
    if (!canUpdate) { toast({ type: 'error', title: 'Permission Denied', message: 'You do not have permission to update daily operations.' }); return; }
    if (op.invoiced) {
      if (!canRevert) { toast({ type: 'error', title: 'Permission Denied', message: 'Only Sales Agents and Admins can revert completed steps.' }); return; }
      setActiveUndoModal({ op, step: 'invoiced', stepName: 'Invoiced' });
    } else {
      if (!op.sales_order_generated) { toast({ type: 'error', title: 'Dependency Required', message: 'Sales Order must be generated before Invoicing.' }); return; }
      setActiveInvoiceModalOp(op);
    }
  };

  const handleToggleDispatched = (op: DailyOrderOperation) => {
    if (!canUpdate) { toast({ type: 'error', title: 'Permission Denied', message: 'You do not have permission to update daily operations.' }); return; }
    if (op.dispatched) {
      if (!canRevert) { toast({ type: 'error', title: 'Permission Denied', message: 'Only Sales Agents and Admins can revert completed steps.' }); return; }
      setActiveUndoModal({ op, step: 'dispatched', stepName: 'Dispatched' });
    } else {
      if (!op.invoiced) { toast({ type: 'error', title: 'Dependency Required', message: 'Customer must be Invoiced before Dispatch.' }); return; }
      try {
        localDb.updateDailyOrderOperationStep(op.id, 'dispatched', null, user!.id);
        markSelfAction();
        toast({ type: 'success', title: 'Dispatched', message: `Marked Dispatched for ${op.customer?.company_name}` });
      } catch (err: any) { toast({ type: 'error', title: 'Action Failed', message: err.message }); }
    }
  };

  const handleConfirmSOSubmit = (soNumber: string) => {
    if (!activeSOModalOp) return;
    try {
      localDb.updateDailyOrderOperationStep(activeSOModalOp.id, 'sales_order_generated', soNumber, user!.id);
      markSelfAction();
      toast({ type: 'success', title: 'Sales Order Saved', message: `Recorded SO #${soNumber} for ${activeSOModalOp.customer?.company_name}` });
    } catch (err: any) { toast({ type: 'error', title: 'Action Failed', message: err.message }); }
  };

  const handleConfirmInvoiceSubmit = (invoiceNumber: string) => {
    if (!activeInvoiceModalOp) return;
    try {
      localDb.updateDailyOrderOperationStep(activeInvoiceModalOp.id, 'invoiced', invoiceNumber, user!.id);
      markSelfAction();
      toast({ type: 'success', title: 'Invoice Saved', message: `Recorded INV #${invoiceNumber} for ${activeInvoiceModalOp.customer?.company_name}` });
    } catch (err: any) { toast({ type: 'error', title: 'Action Failed', message: err.message }); }
  };

  const handleConfirmReportError = (description: string, priority: 'normal' | 'high' | 'urgent') => {
    if (!activeErrorModalOp) return;
    try {
      const res = localDb.reportDailyOrderOperationError(activeErrorModalOp.id, description, priority, user!.id);
      markSelfAction();
      toast({ type: 'info', title: 'Error Ticket Created', message: `Created Customer Query ${res.query.query_number} for ${activeErrorModalOp.customer?.company_name}` });
    } catch (err: any) { toast({ type: 'error', title: 'Action Failed', message: err.message }); }
  };

  const handleTogglePODSent = (op: DailyOrderOperation) => {
    if (!canUpdate) { toast({ type: 'error', title: 'Permission Denied', message: 'You do not have permission to update daily operations.' }); return; }
    if (op.pod_sent) {
      if (!canRevert) { toast({ type: 'error', title: 'Permission Denied', message: 'Only Sales Agents and Admins can revert completed steps.' }); return; }
      setActiveUndoModal({ op, step: 'pod_sent', stepName: 'POD Sent' });
    } else {
      if (!op.dispatched) { toast({ type: 'error', title: 'Dependency Required', message: 'Customer must be Dispatched before the POD can be marked as sent.' }); return; }
      try {
        localDb.updateDailyOrderOperationStep(op.id, 'pod_sent', null, user!.id);
        markSelfAction();
        toast({ type: 'success', title: 'POD Sent', message: `Marked POD as sent for ${op.customer?.company_name}` });
      } catch (err: any) { toast({ type: 'error', title: 'Action Failed', message: err.message }); }
    }
  };

  const handleOpenOrderMatch = (op: DailyOrderOperation) => {
    if (!canUpdateOrderMatch) { toast({ type: 'error', title: 'Permission Denied', message: 'You do not have permission to update order matching.' }); return; }
    setActiveOrderMatchOp(op);
  };

  const handleConfirmOrderMatch = (match: 'SAME' | 'DIFFERENT', differenceNote: string | null, invoiceUpdated: boolean) => {
    if (!activeOrderMatchOp) return;
    try {
      localDb.updateDailyOrderMatch(activeOrderMatchOp.id, match, differenceNote, invoiceUpdated, user!.id);
      markSelfAction();
      toast({ type: 'success', title: 'Order Match Saved', message: `Recorded order match as ${match} for ${activeOrderMatchOp.customer?.company_name}` });
    } catch (err: any) { toast({ type: 'error', title: 'Action Failed', message: err.message }); }
  };

  const handleConfirmUndoStep = (reason: string) => {
    if (!activeUndoModal) return;
    try {
      localDb.revertDailyOrderOperationStep(activeUndoModal.op.id, activeUndoModal.step, reason, user!.id);
      markSelfAction();
      toast({ type: 'info', title: 'Step Reverted', message: `Reverted ${activeUndoModal.stepName} for ${activeUndoModal.op.customer?.company_name}` });
    } catch (err: any) { toast({ type: 'error', title: 'Revert Failed', message: err.message }); }
  };

  const handleToggleStepFromDrawer = (op: DailyOrderOperation, step: DailyOpStepKey) => {
    switch (step) {
      case 'order_received': handleToggleOrderReceived(op); break;
      case 'sales_order_generated': handleToggleSalesOrderGenerated(op); break;
      case 'invoiced': handleToggleInvoiced(op); break;
      case 'dispatched': handleToggleDispatched(op); break;
      case 'pod_sent': handleTogglePODSent(op); break;
    }
  };

  const allUsers = useMemo(() => localDb.getUsers(), [dbVersion]);

  const toggleStepFor = (op: DailyOrderOperation, step: DailyOpStepKey) => {
    if (step === 'order_received') handleToggleOrderReceived(op);
    else if (step === 'sales_order_generated') handleToggleSalesOrderGenerated(op);
    else if (step === 'invoiced') handleToggleInvoiced(op);
    else if (step === 'dispatched') handleToggleDispatched(op);
    else handleTogglePODSent(op);
  };

  const renderWorkflowCheck = (op: DailyOrderOperation, step: DailyOpStepKey, done: boolean, locked: boolean, color: string) => (
    <button
      onClick={() => toggleStepFor(op, step)}
      disabled={!canUpdate}
      title={done ? `${ORDER_WORKFLOW_STEPS.find(s => s.key === step)?.label} complete — click to revert` : locked ? 'Complete the previous stage first' : `Mark ${ORDER_WORKFLOW_STEPS.find(s => s.key === step)?.label} done`}
      aria-label={done ? `Revert ${step}` : `Complete ${step}`}
      className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all shrink-0 ${
        done ? color
        : locked
          ? 'border border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
          : 'border-2 border-slate-300 hover:border-slate-500 bg-slate-50'
      }`}
    >
      {done && <CheckCircle2 className="w-4 h-4" />}
    </button>
  );

  const renderOrderMatchCell = (op: DailyOrderOperation) => {
    if (op.order_match) {
      return (
        <button
          onClick={() => handleOpenOrderMatch(op)}
          disabled={!canUpdateOrderMatch}
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border transition-all ${
            op.order_match === 'DIFFERENT'
              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
          }`}
          title={op.difference_note || 'Order vs invoice match'}
        >
          <Scale className="w-3 h-3 shrink-0" />
          {op.order_match === 'DIFFERENT' ? 'Different' : 'Same'}
        </button>
      );
    }
    return (
      <button
        onClick={() => handleOpenOrderMatch(op)}
        disabled={!canUpdateOrderMatch}
        className="text-[10px] font-semibold px-2 py-1 rounded-md border border-dashed border-slate-300 text-slate-400 hover:text-brand-700 hover:border-brand-400 bg-transparent transition-all"
        title="Set order match"
      >
        Set Match
      </button>
    );
  };

  const renderExceptionCell = (op: DailyOrderOperation) => {
    const kind = getExceptionKind(op);
    if (kind === 'error') {
      return (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border bg-rose-50 text-rose-800 border-rose-300">
            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" /> Error
          </span>
          {op.error_query && (
            <button
              onClick={() => navigate(`/queries/${op.error_query!.id}`)}
              className="text-[9px] font-bold text-rose-700 hover:underline block truncate max-w-[130px]"
              title={`Open ${op.error_query.query_number}`}
            >
              {op.error_query.query_number}
            </button>
          )}
        </div>
      );
    }
    if (kind === 'different') {
      return (
        <div className="space-y-1">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border bg-amber-50 text-amber-800 border-amber-300">
            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" /> Different
          </span>
          {op.invoice_updated && (
            <span className="block text-[9px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded px-1.5 py-0.5 truncate max-w-[130px]">
              Invoice Updated
            </span>
          )}
        </div>
      );
    }
    if (kind === 'invoice_updated') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-md border bg-emerald-50 text-emerald-800 border-emerald-200">
          Invoice Updated
        </span>
      );
    }
    if (canUpdate) {
      return (
        <button
          onClick={() => setActiveErrorModalOp(op)}
          className="text-[10px] font-semibold px-2 py-1 rounded-md border border-dashed border-slate-300 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-all"
          title="Report an operational error"
        >
          Report
        </button>
      );
    }
    return <span className="text-xs text-slate-300">—</span>;
  };

  const renderLastUpdatedCell = (op: DailyOrderOperation) => {
    const name = op.updated_by_profile?.full_name || '—';
    return (
      <div className="text-[10px] leading-tight">
        <span className="font-bold text-slate-700 block truncate">{timeAgo(op.updated_at) || '—'}</span>
        <span className="text-slate-400 block truncate" title={name}>by {name}</span>
      </div>
    );
  };

  return (
    <div className="space-y-5">
      <PageHeader
        icon={<CalendarClock className="w-5 h-5" />}
        iconBg="bg-navy-900"
        title="Orders"
        description="Route-based daily order operations — live operational control center"
        badges={[
          <span
            key="area"
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              effectiveArea === 'KELOWNA'
                ? 'bg-teal-50 text-teal-700 border-teal-300'
                : effectiveArea === 'OUTSIDE_KELOWNA'
                ? 'bg-purple-50 text-purple-700 border-purple-300'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            <ShieldCheck className="w-3 h-3" />
            {areaLabel}
          </span>,
          <span
            key="sync"
            className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${
              syncState === 'live'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                : syncState === 'polling'
                ? 'bg-amber-50 text-amber-700 border-amber-300'
                : 'bg-slate-100 text-slate-500 border-slate-200'
            }`}
            title={syncState === 'live' ? 'Live realtime sync' : syncState === 'polling' ? 'Auto-refresh via polling fallback' : 'Local only — Supabase sync unavailable'}
          >
            {syncState === 'live' ? <Wifi className="w-3 h-3" /> : syncState === 'polling' ? <RefreshCw className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
            {syncState === 'live' ? 'Live Sync' : syncState === 'polling' ? 'Auto-Refresh' : 'Local Only'}
          </span>,
        ]}
        actions={
          <Button size="sm" variant="outline" onClick={handleToday} icon={<CalendarIcon className="w-4 h-4" />}>
            Back to Today
          </Button>
        }
      />

      {/* Operational Day Bar */}
      <Card className="p-4 border-l-4 border-l-teal-500">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-14 h-14 bg-brand-50 text-brand-700 rounded-xl flex items-center justify-center shrink-0">
              <CalendarIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-600 block">
                {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatDate(selectedDateStr)}
              </span>
              <h2 className="text-xl font-black text-slate-900 tracking-tight leading-tight">
                {formatDate(selectedDateStr, { weekday: 'long', month: 'long', day: 'numeric' })}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1.5 flex-wrap">
                <MapPin className="w-3 h-3 text-slate-400" />
                {activeRoutes.length > 0
                  ? `${activeRoutes.length} active route${activeRoutes.length > 1 ? 's' : ''}: ${activeRoutes.slice(0, 4).join(', ')}${activeRoutes.length > 4 ? '…' : ''}`
                  : 'No active routes scheduled'}
                <span className="text-slate-300">·</span>
                <span>{formatWeekdayTitle(weekday)}</span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button size="sm" variant="outline" onClick={handlePreviousDay} icon={<ChevronLeft className="w-4 h-4" />}>
              Prev
            </Button>
            <Input
              type="date"
              value={selectedDateStr}
              onChange={(e) => e.target.value && setSelectedDateStr(e.target.value)}
              className="w-36 text-xs"
              aria-label="Select operational date"
            />
            <Button size="sm" variant="outline" onClick={handleNextDay} icon={<ChevronRight className="w-4 h-4" />}>
              Next
            </Button>
            <Button size="sm" variant="secondary" onClick={handleTomorrow} icon={<CalendarClock className="w-4 h-4" />}>
              Tomorrow
            </Button>
            {upcomingDates.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Upcoming:</span>
                {upcomingDates.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDateStr(d.date)}
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-md border transition-all ${
                      selectedDateStr === d.date
                        ? 'bg-brand-600 text-white border-brand-600'
                        : 'bg-white text-slate-600 border-slate-200 hover:border-brand-400 hover:text-brand-700'
                    }`}
                    title={`${d.routes.length} route(s): ${d.routes.join(', ')}`}
                  >
                    {formatDate(d.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Operational Area Panels */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
          {isAdmin ? (
            <>
              <button
                onClick={() => setSelectedArea('ALL')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${effectiveArea === 'ALL' ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
                title="View all operational areas"
              >
                All Areas
              </button>
              <button
                onClick={() => setSelectedArea('KELOWNA')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${effectiveArea === 'KELOWNA' ? 'bg-white text-teal-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Kelowna
              </button>
              <button
                onClick={() => setSelectedArea('OUTSIDE_KELOWNA')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${effectiveArea === 'OUTSIDE_KELOWNA' ? 'bg-white text-purple-700 shadow-sm ring-1 ring-slate-200' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Outside Kelowna
              </button>
            </>
          ) : (
            <button
              className="px-3.5 py-1.5 rounded-lg bg-white text-brand-700 shadow-sm ring-1 ring-slate-200"
              title={`Locked to your assigned area: ${areaLabel}`}
            >
              <ShieldCheck className="w-3 h-3 inline mr-1" />
              {areaLabel}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <span>{visibleOperations.length} of {baseOperations.length} orders match current filters</span>
        </div>
      </div>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-8 gap-3">
        <StatCard title="Orders Today" value={metrics.total} icon={<Inbox className="w-4 h-4" />} accent="brand" description={`${metrics.pending} pending · ${metrics.completed} completed`} />
        <StatCard title="Order Received" value={metrics.received} icon={<ClipboardList className="w-4 h-4" />} accent="navy" description={`${metrics.total - metrics.received} not received`} />
        <StatCard title="Sales Orders" value={metrics.salesOrders} icon={<FileText className="w-4 h-4" />} accent="violet" description={`${metrics.salesOrders - metrics.invoiced} awaiting invoice`} />
        <StatCard title="Invoiced" value={metrics.invoiced} icon={<FileText className="w-4 h-4" />} accent="teal" description={`${metrics.invoiced - metrics.dispatched} awaiting dispatch`} />
        <StatCard title="Dispatched" value={metrics.dispatched} icon={<Truck className="w-4 h-4" />} accent="green" description={`${metrics.podPending} POD pending`} />
        <StatCard title="POD Pending" value={metrics.podPending} icon={<Send className="w-4 h-4" />} accent="amber" description="Dispatched, POD not sent" />
        <StatCard title="Exceptions" value={metrics.exceptions} icon={<AlertCircle className="w-4 h-4" />} accent="red" description={`${metrics.errors} errors · ${metrics.different} different`} />
        <StatCard title="Different Orders" value={metrics.different} icon={<Scale className="w-4 h-4" />} accent="amber" description="Order vs invoice mismatch" />
      </div>

      {/* Today's Route Summary + Route Selection */}
      {activeRoutes.length > 0 ? (
        <Card className="p-5 bg-[#102A43] text-white shadow-card border border-[#243B53]">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="space-y-3 lg:min-w-[260px]">
              <div>
                <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest block">Delivery Area</span>
                <span className="text-lg font-extrabold text-white mt-0.5 block">{areaLabel}</span>
              </div>
              <div className="flex items-center gap-6 text-xs">
                <div>
                  <span className="text-[#9FB3C8] block text-[10px] uppercase font-bold tracking-wider">Customers</span>
                  <span className="text-lg font-extrabold text-white block">{metrics.total}</span>
                </div>
                <div>
                  <span className="text-[#9FB3C8] block text-[10px] uppercase font-bold tracking-wider">Completed</span>
                  <span className="text-lg font-extrabold text-teal-400 block">{metrics.completed}</span>
                </div>
                <div>
                  <span className="text-[#9FB3C8] block text-[10px] uppercase font-bold tracking-wider">Pending</span>
                  <span className="text-lg font-extrabold text-amber-400 block">{metrics.pending}</span>
                </div>
              </div>
              <div className="flex items-center gap-3 max-w-xs">
                <div className="flex-1 bg-[#243B53] rounded-full h-2.5 overflow-hidden border border-[#334E68]">
                  <div className="bg-teal-500 h-full transition-all duration-500" style={{ width: `${metrics.progress}%` }} />
                </div>
                <span className="font-mono font-extrabold text-teal-400 text-xs">{metrics.progress}%</span>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-[#9FB3C8] uppercase font-bold tracking-wider block mb-2">Route Filter</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedRoute('')}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                    selectedRoute === ''
                      ? 'bg-teal-500 text-white border-teal-400'
                      : 'bg-[#243B53]/80 text-[#BCCCDC] border-[#334E68] hover:bg-[#334E68]'
                  }`}
                >
                  All Routes
                </button>
                {activeRoutes.map((rt) => (
                  <button
                    key={rt}
                    onClick={() => setSelectedRoute(rt)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all ${
                      selectedRoute === rt
                        ? 'bg-teal-500 text-white border-teal-400'
                        : 'bg-[#243B53]/80 text-[#BCCCDC] border-[#334E68] hover:bg-[#334E68]'
                    }`}
                  >
                    {rt}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      ) : (
        <Card className="p-6 text-center border-amber-200 bg-amber-50/50">
          <MapPin className="w-8 h-8 text-amber-500 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-900">No Active Routes Scheduled for {formatWeekdayTitle(weekday)}</p>
          <p className="text-xs text-slate-600 mt-1">Check customer route assignments or configure the weekly route schedule in the Admin Panel.</p>
        </Card>
      )}

      {/* Quick Filters + Search + Advanced Filters */}
      <TableToolbar>
        <div className="flex flex-col gap-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold overflow-x-auto">
              {QUICK_FILTERS.map((f) => (
                <button
                  key={f.value}
                  onClick={() => setQuickFilter(f.value)}
                  className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all inline-flex items-center gap-1.5 ${
                    quickFilter === f.value
                      ? f.value === 'exceptions'
                        ? 'bg-white text-rose-700 shadow-sm ring-1 ring-slate-200'
                        : f.value === 'different'
                        ? 'bg-white text-amber-700 shadow-sm ring-1 ring-slate-200'
                        : 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {f.label}
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-200/70 text-slate-600">
                    {metrics.quickCounts[f.value] ?? 0}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative flex-1 lg:max-w-md">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search name, city, route, SO #, or Invoice #..."
                icon={<Search className="w-4 h-4 text-slate-400" />}
                className="pl-9"
                aria-label="Search orders"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="text-xs w-auto min-w-[150px]" aria-label="Order status filter">
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="order_received">Order Received</option>
              <option value="sales_order_generated">Sales Order</option>
              <option value="invoiced">Invoiced</option>
              <option value="dispatched">Dispatched</option>
              <option value="completed">✓ Completed</option>
              <option value="error">⚠ Error</option>
            </Select>

            <Select value={orderMatchFilter} onChange={(e) => setOrderMatchFilter(e.target.value as 'all' | 'SAME' | 'DIFFERENT' | 'unset')} className="text-xs w-auto min-w-[150px]" aria-label="Order match filter">
              <option value="all">All Matches</option>
              <option value="SAME">Same</option>
              <option value="DIFFERENT">Different</option>
              <option value="unset">Not Set</option>
            </Select>

            <Select value={exceptionFilter} onChange={(e) => setExceptionFilter(e.target.value as 'all' | 'error' | 'different' | 'invoice_updated')} className="text-xs w-auto min-w-[150px]" aria-label="Exception filter">
              <option value="all">All Exceptions</option>
              <option value="error">Errors</option>
              <option value="different">Order Differences</option>
              <option value="invoice_updated">Invoice Updated</option>
            </Select>

            <Select value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)} className="text-xs w-auto min-w-[150px]" aria-label="Assigned user filter">
              <option value="all">All Users</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </Select>

            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="text-xs w-auto min-w-[150px]" aria-label="Sort orders">
              <option value="name">Sort by Customer</option>
              <option value="route">Sort by Route</option>
              <option value="status">Sort by Status</option>
              <option value="updated_at">Sort by Last Updated</option>
            </Select>
          </div>
        </div>
      </TableToolbar>

      {/* Operational Table */}
      <Card flush>
        {visibleOperations.length > 0 ? (
          <>
            <Table minWidth={1490}>
              <THead>
                <Tr hover={false}>
                  <Th width={260} className="sticky left-0 bg-[#F5F7FA] z-10 border-r border-slate-200">Customer</Th>
                  <Th width={100}>City</Th>
                  <Th width={110}>Route</Th>
                  <Th width={96} align="center">Received</Th>
                  <Th width={150} align="center">Sales Order</Th>
                  <Th width={150} align="center">Invoiced</Th>
                  <Th width={132} align="center">Order Match</Th>
                  <Th width={96} align="center">Dispatched</Th>
                  <Th width={96} align="center">POD Sent</Th>
                  <Th width={150}>Exception</Th>
                  <Th width={150}>Last Updated</Th>
                </Tr>
              </THead>
              <TBody>
                {pagedOperations.map((op) => {
                  const isError = isOperationError(op);
                  const isCompleted = isOperationCompleted(op);
                  return (
                    <Tr key={op.id} className={isError ? 'bg-rose-50/40' : isCompleted ? 'bg-emerald-50/30' : ''}>
                      {/* Customer */}
                      <Td width={260} className="sticky left-0 bg-white z-10 border-r border-slate-200">
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => setActiveDetailOp(op)}
                            className="min-w-0 flex-1 text-left group"
                            title="Open order details"
                          >
                            <span className="font-bold text-slate-900 group-hover:text-brand-600 transition-colors text-xs block w-full truncate">
                              {op.customer?.company_name || 'Customer'}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono block truncate">{op.customer?.customer_code}</span>
                            <span className="text-[10px] text-slate-500 block truncate">
                              {op.customer?.phone || op.customer?.whatsapp_number || '—'}
                            </span>
                          </button>
                          <button
                            onClick={() => navigate(`/customers/${op.customer_id}`)}
                            className="p-1 text-slate-300 hover:text-brand-600 hover:bg-brand-50 rounded-md transition-all shrink-0"
                            title="Open customer profile"
                            aria-label="Open customer profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </Td>

                      {/* City */}
                      <Td width={100}>
                        <span className="text-xs font-semibold text-slate-600 block truncate" title={op.customer?.city || ''}>
                          {op.customer?.city || '—'}
                        </span>
                      </Td>

                      {/* Route */}
                      <Td width={110}>
                        <span className="text-[10px] font-bold text-brand-700 bg-brand-50 border border-brand-100 rounded px-1.5 py-0.5 block truncate text-center" title={op.route}>
                          {op.route}
                        </span>
                      </Td>

                      {/* Step 1: Order Received */}
                      <Td className="text-center">
                        {renderWorkflowCheck(op, 'order_received', op.order_received, false, 'bg-sky-600 text-white shadow-sm')}
                        {op.order_received_at && (
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                            {formatDate(op.order_received_at, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </Td>

                      {/* Step 2: Sales Order + SO # */}
                      <Td className="text-center">
                        {renderWorkflowCheck(op, 'sales_order_generated', op.sales_order_generated, !op.order_received, 'bg-indigo-600 text-white shadow-sm')}
                        {op.sales_order_number && (
                          <span className="block font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 mt-0.5 truncate max-w-full" title={op.sales_order_number}>
                            {op.sales_order_number}
                          </span>
                        )}
                      </Td>

                      {/* Step 3: Invoiced + Invoice # */}
                      <Td className="text-center">
                        {renderWorkflowCheck(op, 'invoiced', op.invoiced, !op.sales_order_generated, 'bg-purple-600 text-white shadow-sm')}
                        {op.invoice_number && (
                          <span className="block font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 mt-0.5 truncate max-w-full" title={op.invoice_number}>
                            {op.invoice_number}
                          </span>
                        )}
                      </Td>

                      {/* Order Match */}
                      <Td className="text-center">
                        <div className="space-y-1">
                          {renderOrderMatchCell(op)}
                          {op.order_match === 'DIFFERENT' && op.invoice_updated && (
                            <span className="block text-[9px] font-bold text-emerald-700 truncate max-w-full" title="Invoice has been updated">
                              Invoice Updated
                            </span>
                          )}
                        </div>
                      </Td>

                      {/* Step 4: Dispatched */}
                      <Td className="text-center">
                        {renderWorkflowCheck(op, 'dispatched', op.dispatched, !op.invoiced, 'bg-emerald-600 text-white shadow-sm')}
                        {op.dispatched_at && (
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                            {formatDate(op.dispatched_at, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </Td>

                      {/* Step 5: POD Sent */}
                      <Td className="text-center">
                        {renderWorkflowCheck(op, 'pod_sent', op.pod_sent, !op.dispatched, 'bg-cyan-600 text-white shadow-sm')}
                        {op.pod_sent_at && (
                          <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                            {formatDate(op.pod_sent_at, { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </Td>

                      {/* Exception */}
                      <Td width={150}>
                        {renderExceptionCell(op)}
                      </Td>

                      {/* Last Updated */}
                      <Td width={150}>
                        {renderLastUpdatedCell(op)}
                      </Td>
                    </Tr>
                  );
                })}
              </TBody>
            </Table>
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={visibleOperations.length}
              pageSize={PAGE_SIZE}
              onPageChange={setCurrentPage}
              itemLabel="orders"
            />
          </>
        ) : (
          <EmptyState
            title="No operations found"
            description="Try adjusting your filters or selecting a different operational date."
            icon={<Inbox className="w-6 h-6" />}
          />
        )}
      </Card>
      {/* Undo Step Modal */}
      {activeUndoModal && (
        <UndoStepModal
          isOpen
          stepName={activeUndoModal.stepName}
          customerName={activeUndoModal.op.customer?.company_name || 'Customer'}
          onClose={() => setActiveUndoModal(null)}
          onConfirm={handleConfirmUndoStep}
        />
      )}

      {/* SO Modal */}
      {activeSOModalOp && (
        <SOModal
          isOpen
          customerName={activeSOModalOp.customer?.company_name || 'Customer'}
          onClose={() => setActiveSOModalOp(null)}
          onSubmit={handleConfirmSOSubmit}
        />
      )}

      {/* Invoice Modal */}
      {activeInvoiceModalOp && (
        <InvoiceModal
          isOpen
          customerName={activeInvoiceModalOp.customer?.company_name || 'Customer'}
          soNumber={activeInvoiceModalOp.sales_order_number}
          onClose={() => setActiveInvoiceModalOp(null)}
          onSubmit={handleConfirmInvoiceSubmit}
        />
      )}

      {/* Report Error Modal */}
      {activeErrorModalOp && (
        <ReportErrorModal
          isOpen
          customerName={activeErrorModalOp.customer?.company_name || 'Customer'}
          onClose={() => setActiveErrorModalOp(null)}
          onSubmit={handleConfirmReportError}
        />
      )}

      {/* Order Match Modal */}
      {activeOrderMatchOp && (
        <OrderMatchModal
          isOpen
          customerName={activeOrderMatchOp.customer?.company_name || 'Customer'}
          currentMatch={activeOrderMatchOp.order_match}
          differenceNote={activeOrderMatchOp.difference_note}
          invoiceUpdated={activeOrderMatchOp.invoice_updated}
          onClose={() => setActiveOrderMatchOp(null)}
          onSubmit={handleConfirmOrderMatch}
        />
      )}

      {/* Details Drawer */}
      <OrderDetailDrawer
        op={activeDetailOp}
        onClose={() => setActiveDetailOp(null)}
        canUpdate={canUpdate}
        canRevert={canRevert}
        canUpdateOrderMatch={canUpdateOrderMatch}
        onToggleStep={(op, step) => handleToggleStepFromDrawer(op, step)}
        onOpenOrderMatch={handleOpenOrderMatch}
        onReportError={(op) => setActiveErrorModalOp(op)}
        onViewQuery={(queryId) => navigate(`/queries/${queryId}`)}
      />
    </div>
  );
};

export default Orders;
