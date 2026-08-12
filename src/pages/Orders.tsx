import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DailyOrderOperation, DailyOrderOperationStatus, PortalType } from '../types';
import { localDb } from '../services/db';
import { subscribeOrdersRealtime } from '../services/realtime';
import { permissions } from '../services/permissions';
import { cn } from '../utils/cn';
import { formatDate, timeAgo } from '../utils/format';
import {
  ORDER_WORKFLOW_STEPS,
  DailyOpStepKey,
  OrdersQuickFilter,
  getExceptionKind,
  getPendingStep,
  hasOrderException,
  isOperationCompleted,
  isOperationError,
  isOrderDifferent,
  isStepDone,
  matchesQuickFilter,
} from '../utils/orderWorkflow';
import { SOModal } from '../components/orders/SOModal';
import { InvoiceModal } from '../components/orders/InvoiceModal';
import { ReportErrorModal } from '../components/orders/ReportErrorModal';
import { UndoStepModal } from '../components/orders/UndoStepModal';
import { OrderMatchModal } from '../components/orders/OrderMatchModal';
import { OrderDetailDrawer } from '../components/orders/OrderDetailDrawer';
import { MobileOrderCard } from '../components/orders/MobileOrderCard';
import {
  AlertCircle,
  AlertTriangle,
  Calendar as CalendarIcon,
  CalendarClock,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock,
  ExternalLink,
  FileText,
  Inbox,
  MapPin,
  PackageCheck,
  ReceiptText,
  Scale,
  Search,
  Send,
  ShieldCheck,
  Truck,
  Wifi,
  WifiOff,
} from 'lucide-react';
import {
  Avatar,
  Badge,
  Button,
  Card,
  EmptyState,
  Input,
  PageHeader,
  Pagination,
  Select,
  StatCard,
  Table,
  TableToolbar,
  Tabs,
  TBody,
  Td,
  Th,
  THead,
  Tr,
  useToast,
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

const AREA_TABS: { value: AreaView; label: string }[] = [
  { value: 'ALL', label: 'All Areas' },
  { value: 'KELOWNA', label: 'Kelowna' },
  { value: 'OUTSIDE_KELOWNA', label: 'Outside Kelowna' },
];

/** Status pill styling derived from the operation status. */
const STATUS_PILL: Record<DailyOrderOperationStatus, { label: string; className: string; dot: string }> = {
  not_started: { label: 'Not Started', className: 'bg-[#E9EFF5] text-[#52606D]', dot: 'bg-[#829AB1]' },
  order_received: { label: 'Received', className: 'bg-sky-50 text-sky-700', dot: 'bg-sky-500' },
  sales_order_generated: { label: 'Sales Order', className: 'bg-indigo-50 text-indigo-700', dot: 'bg-indigo-500' },
  invoiced: { label: 'Invoiced', className: 'bg-purple-50 text-purple-700', dot: 'bg-purple-500' },
  dispatched: { label: 'Dispatched', className: 'bg-emerald-50 text-emerald-700', dot: 'bg-emerald-500' },
  completed: { label: 'Completed', className: 'bg-green-50 text-green-700', dot: 'bg-green-500' },
  error: { label: 'Error', className: 'bg-rose-50 text-rose-700', dot: 'bg-rose-500' },
};

/** Per-stage theme shared with the detail drawer so colors stay consistent. */
const STEP_THEME: Record<DailyOpStepKey, { done: string; active: string; header: string; icon: React.ReactNode }> = {
  order_received: { done: 'bg-sky-500 text-white', active: 'text-sky-600', header: 'text-sky-600', icon: <ClipboardList className="w-3.5 h-3.5" /> },
  sales_order_generated: { done: 'bg-indigo-500 text-white', active: 'text-indigo-600', header: 'text-indigo-600', icon: <FileText className="w-3.5 h-3.5" /> },
  invoiced: { done: 'bg-purple-500 text-white', active: 'text-purple-600', header: 'text-purple-600', icon: <ReceiptText className="w-3.5 h-3.5" /> },
  dispatched: { done: 'bg-emerald-500 text-white', active: 'text-emerald-600', header: 'text-emerald-600', icon: <Truck className="w-3.5 h-3.5" /> },
  order_match: { done: 'bg-teal-500 text-white', active: 'text-teal-600', header: 'text-teal-600', icon: <Scale className="w-3.5 h-3.5" /> },
  pod_sent: { done: 'bg-cyan-500 text-white', active: 'text-cyan-600', header: 'text-cyan-600', icon: <Send className="w-3.5 h-3.5" /> },
};

const STEP_ORDER: DailyOpStepKey[] = ORDER_WORKFLOW_STEPS.map((s) => s.key);

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
      if (activeUndoModal.step !== 'order_match') {
        localDb.revertDailyOrderOperationStep(activeUndoModal.op.id, activeUndoModal.step as any, reason, user!.id);
      }
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
      case 'order_match': handleOpenOrderMatch(op); break;
      case 'pod_sent': handleTogglePODSent(op); break;
    }
  };

  const allUsers = useMemo(() => localDb.getUsers(), [dbVersion]);

  const toggleStepFor = (op: DailyOrderOperation, step: DailyOpStepKey) => {
    if (step === 'order_received') handleToggleOrderReceived(op);
    else if (step === 'sales_order_generated') handleToggleSalesOrderGenerated(op);
    else if (step === 'invoiced') handleToggleInvoiced(op);
    else if (step === 'dispatched') handleToggleDispatched(op);
    else if (step === 'order_match') handleOpenOrderMatch(op);
    else handleTogglePODSent(op);
  };

  const isStepLocked = (op: DailyOrderOperation, step: DailyOpStepKey) => {
    switch (step) {
      case 'order_received': return false;
      case 'sales_order_generated': return !op.order_received;
      case 'invoiced': return !op.sales_order_generated;
      case 'dispatched': return !op.invoiced;
      case 'order_match': return !op.dispatched;
      case 'pod_sent': return !op.dispatched || !isStepDone(op, 'order_match');
    }
  };

  const renderStepMeta = (op: DailyOrderOperation, step: DailyOpStepKey) => {
    if (step === 'sales_order_generated' && op.sales_order_number) {
      return (
        <span className="block font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 px-1.5 py-0.5 rounded border border-indigo-100 truncate max-w-[110px]" title={op.sales_order_number}>
          {op.sales_order_number}
        </span>
      );
    }
    if (step === 'invoiced' && op.invoice_number) {
      return (
        <span className="block font-mono text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-100 truncate max-w-[110px]" title={op.invoice_number}>
          {op.invoice_number}
        </span>
      );
    }
    const at =
      step === 'order_received' ? op.order_received_at
      : step === 'dispatched' ? op.dispatched_at
      : step === 'pod_sent' ? op.pod_sent_at
      : null;
    if (at) {
      return <span className="block text-[10px] text-slate-400 font-mono">{formatDate(at, { hour: '2-digit', minute: '2-digit' })}</span>;
    }
    return null;
  };

  const renderStepCell = (op: DailyOrderOperation, step: DailyOpStepKey) => {
    const theme = STEP_THEME[step] ?? STEP_THEME.order_received;
    const def = ORDER_WORKFLOW_STEPS.find((s) => s.key === step)!;
    const done = isStepDone(op, step);
    const locked = isStepLocked(op, step);
    return (
      <div className="flex flex-col items-center gap-1.5">
        <button
          onClick={() => toggleStepFor(op, step)}
          disabled={!canUpdate || locked}
          title={done ? `${def.label} complete — click to revert` : locked ? 'Complete the previous stage first' : `Mark ${def.label} done`}
          aria-label={done ? `Revert ${step}` : `Complete ${step}`}
          className={cn(
            'w-8 h-8 rounded-full inline-flex items-center justify-center transition-all shrink-0',
            done
              ? theme.done
              : locked
                ? 'bg-slate-100 border border-slate-200 text-slate-300 cursor-not-allowed'
                : 'bg-white border-2 border-slate-300 text-slate-400 hover:border-teal-500 hover:text-teal-500'
          )}
        >
          {done ? <Check className="w-4 h-4" /> : <span className="w-1.5 h-1.5 rounded-full bg-current" />}
        </button>
        {renderStepMeta(op, step)}
      </div>
    );
  };

  const renderStatusCell = (op: DailyOrderOperation) => {
    const status = STATUS_PILL[op.status] ?? STATUS_PILL.not_started;
    const doneCount = STEP_ORDER.filter((s) => isStepDone(op, s)).length;
    const pct = Math.round((doneCount / STEP_ORDER.length) * 100);
    const pendingStep = getPendingStep(op);
    return (
      <div className="flex flex-col items-center gap-1.5">
        <span className={cn('inline-flex items-center gap-1.5 text-[10px] font-bold px-2 py-0.5 rounded-full whitespace-nowrap', status.className)}>
          <span className={cn('w-1.5 h-1.5 rounded-full', status.dot)} />
          {status.label}
        </span>
        <div className="w-full flex items-center gap-1.5 max-w-[100px]">
          <div className="flex-1 h-1 rounded-full bg-slate-200 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all duration-500', isOperationError(op) ? 'bg-rose-500' : 'bg-teal-500')}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-[10px] font-bold text-slate-500 tabular-nums">{doneCount}/{STEP_ORDER.length}</span>
        </div>
        {pendingStep && (
          <span className="text-[10px] font-semibold text-slate-400 truncate max-w-full">Next: {pendingStep.shortLabel}</span>
        )}
      </div>
    );
  };

  const renderOrderMatchCell = (op: DailyOrderOperation) => {
    if (!op.dispatched) {
      return (
        <span
          className="text-[10px] font-medium text-slate-400 italic px-2 py-0.5"
          title="Sales Order vs Invoice matching is available after dispatch"
        >
          ⏳ Wait for Dispatch
        </span>
      );
    }

    if (op.order_match) {
      const isDiff = op.order_match === 'DIFFERENT';
      return (
        <button
          onClick={() => handleOpenOrderMatch(op)}
          disabled={!canUpdateOrderMatch}
          className={cn(
            'inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all',
            isDiff
              ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
          )}
          title={op.difference_note || 'Sales Order vs Invoice match'}
        >
          <Scale className="w-3 h-3 shrink-0" />
          {isDiff ? 'Different' : 'Same'}
        </button>
      );
    }
    return (
      <button
        onClick={() => handleOpenOrderMatch(op)}
        disabled={!canUpdateOrderMatch}
        className="text-[10px] font-bold px-2.5 py-1 rounded-full border border-teal-300 text-teal-800 bg-teal-50 hover:bg-teal-100 shadow-xs transition-all animate-pulse"
        title="Compare Sales Order vs Invoice after dispatch"
      >
        Check Match
      </button>
    );
  };

  const renderExceptionCell = (op: DailyOrderOperation) => {
    const kind = getExceptionKind(op);
    if (kind === 'error') {
      return (
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
            <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" /> Error
          </span>
          {op.error_query && (
            <button
              onClick={() => navigate(`/queries/${op.error_query!.id}`)}
              className="text-[10px] font-bold text-rose-700 hover:underline block truncate max-w-[120px]"
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
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600 shrink-0" /> Different
          </span>
          {op.invoice_updated && (
            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-full px-2 py-0.5 truncate max-w-[120px]">
              <Check className="w-3 h-3 shrink-0" /> Invoice Updated
            </span>
          )}
        </div>
      );
    }
    if (kind === 'invoice_updated') {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
          <Check className="w-3 h-3 shrink-0" /> Invoice Updated
        </span>
      );
    }
    if (canUpdate) {
      return (
        <button
          onClick={() => setActiveErrorModalOp(op)}
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full border border-dashed border-slate-300 text-slate-400 hover:text-rose-600 hover:border-rose-300 transition-all"
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
      <div className="text-[11px] leading-tight">
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
          <Badge
            key="area"
            badge={{
              subtle:
                effectiveArea === 'KELOWNA'
                  ? 'bg-teal-50 text-teal-800 ring-teal-200'
                  : effectiveArea === 'OUTSIDE_KELOWNA'
                    ? 'bg-purple-50 text-purple-800 ring-purple-200'
                    : 'bg-[#E9EFF5] text-[#52606D] ring-[#D9E2EC]',
              solid:
                effectiveArea === 'KELOWNA'
                  ? 'bg-teal-500 text-white'
                  : effectiveArea === 'OUTSIDE_KELOWNA'
                    ? 'bg-purple-600 text-white'
                    : 'bg-[#829AB1] text-white',
              dot:
                effectiveArea === 'KELOWNA'
                  ? 'bg-teal-500'
                  : effectiveArea === 'OUTSIDE_KELOWNA'
                    ? 'bg-purple-500'
                    : 'bg-[#829AB1]',
              label: areaLabel,
            }}
          />,
          <Badge
            key="sync"
            dot
            badge={{
              subtle:
                syncState === 'live'
                  ? 'bg-emerald-50 text-emerald-800 ring-emerald-200'
                  : syncState === 'polling'
                    ? 'bg-amber-50 text-amber-800 ring-amber-200'
                    : 'bg-[#E9EFF5] text-[#52606D] ring-[#D9E2EC]',
              solid:
                syncState === 'live'
                  ? 'bg-emerald-500 text-white'
                  : syncState === 'polling'
                    ? 'bg-amber-500 text-white'
                    : 'bg-[#829AB1] text-white',
              dot:
                syncState === 'live'
                  ? 'bg-emerald-500'
                  : syncState === 'polling'
                    ? 'bg-amber-500'
                    : 'bg-[#829AB1]',
              label: syncState === 'live' ? 'Live Sync' : syncState === 'polling' ? 'Auto-Refresh' : 'Local Only',
            }}
          />,
        ]}
      />

      {/* Date & Area Control */}
      <Card className="p-4">
        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 bg-teal-50 text-teal-700 rounded-[10px] flex items-center justify-center shrink-0">
                <CalendarIcon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <span className="text-[11px] font-extrabold uppercase tracking-widest text-teal-700 block">
                  {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : formatDate(selectedDateStr)}
                </span>
                <h2 className="text-lg font-black text-slate-900 tracking-tight leading-tight truncate">
                  {formatDate(selectedDateStr, { weekday: 'long', month: 'long', day: 'numeric' })}
                </h2>
                <p className="text-xs text-slate-500 flex items-center gap-1.5 flex-wrap">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {activeRoutes.length > 0
                    ? `${activeRoutes.length} route${activeRoutes.length > 1 ? 's' : ''} · ${activeRoutes.slice(0, 4).join(', ')}${activeRoutes.length > 4 ? '…' : ''}`
                    : 'No active routes scheduled'}
                  <span className="text-slate-300">·</span>
                  <span>{formatWeekdayTitle(weekday)}</span>
                  <span className="text-slate-300">·</span>
                  <span className={cn('inline-flex items-center gap-1 font-semibold', syncState === 'live' ? 'text-emerald-600' : syncState === 'polling' ? 'text-amber-600' : 'text-slate-400')}>
                    {syncState === 'live' ? <Wifi className="w-3 h-3" /> : syncState === 'polling' ? <Clock className="w-3 h-3" /> : <WifiOff className="w-3 h-3" />}
                    {syncState === 'live' ? 'Live Sync' : syncState === 'polling' ? 'Auto-Refresh' : 'Local Only'}
                  </span>
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
                className="w-36"
                aria-label="Select operational date"
              />
              <Button size="sm" variant="outline" onClick={handleNextDay} icon={<ChevronRight className="w-4 h-4" />}>
                Next
              </Button>
              <Button size="sm" variant="secondary" onClick={handleToday} icon={<CalendarClock className="w-4 h-4" />}>
                Today
              </Button>
              <Button size="sm" variant="outline" onClick={handleTomorrow} icon={<CalendarClock className="w-4 h-4" />}>
                Tomorrow
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E3E8EE]">
            <div className="flex items-center gap-1.5">
              {isAdmin ? (
                <Tabs
                  tabs={AREA_TABS.map((a) => ({ value: a.value, label: a.label }))}
                  active={effectiveArea}
                  onChange={(v) => { if (isAdmin) setSelectedArea(v); }}
                  size="sm"
                />
              ) : (
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-teal-700 bg-teal-50 px-2.5 py-1 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {areaLabel}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Upcoming:</span>
              {upcomingDates.length > 0 ? (
                upcomingDates.map((d) => (
                  <button
                    key={d.date}
                    onClick={() => setSelectedDateStr(d.date)}
                    className={cn(
                      'text-[11px] font-bold px-2.5 py-1 rounded-full border transition-all',
                      selectedDateStr === d.date
                        ? 'bg-teal-600 text-white border-teal-600'
                        : 'bg-white text-slate-600 border-[#D9E2EC] hover:border-teal-400 hover:text-teal-700'
                    )}
                    title={`${d.routes.length} route(s): ${d.routes.join(', ')}`}
                  >
                    {formatDate(d.date, { weekday: 'short', month: 'short', day: 'numeric' })}
                  </button>
                ))
              ) : (
                <span className="text-xs text-slate-400">No upcoming routes</span>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* KPI Dashboard */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-3">
        <StatCard title="Orders Today" value={metrics.total} icon={<Inbox className="w-4 h-4" />} accent="brand" description={`${metrics.pending} pending · ${metrics.completed} done`} />
        <StatCard title="Order Received" value={metrics.received} icon={<ClipboardList className="w-4 h-4" />} accent="navy" description={`${metrics.total - metrics.received} to receive`} />
        <StatCard title="Sales Orders" value={metrics.salesOrders} icon={<FileText className="w-4 h-4" />} accent="violet" description={`${metrics.salesOrders - metrics.invoiced} to invoice`} />
        <StatCard title="Invoiced" value={metrics.invoiced} icon={<ReceiptText className="w-4 h-4" />} accent="teal" description={`${metrics.invoiced - metrics.dispatched} to dispatch`} />
        <StatCard title="Dispatched" value={metrics.dispatched} icon={<Truck className="w-4 h-4" />} accent="green" description={`${metrics.podPending} POD pending`} />
        <StatCard title="POD Pending" value={metrics.podPending} icon={<Send className="w-4 h-4" />} accent="amber" description="Dispatched, POD not sent" />
        <StatCard title="Exceptions" value={metrics.exceptions} icon={<AlertCircle className="w-4 h-4" />} accent="red" description={`${metrics.errors} errors · ${metrics.different} different`} />
      </div>

      {/* Route Summary + Selection */}
      {activeRoutes.length > 0 ? (
        <Card className="crm-card-dark p-5">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
            <div className="flex items-center gap-4 lg:min-w-[300px]">
              <div className="w-10 h-10 rounded-[10px] bg-white/10 border border-white/10 flex items-center justify-center text-teal-400 shrink-0">
                <PackageCheck className="w-5 h-5" />
              </div>
              <div className="min-w-0 flex-1">
                <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest block">Delivery Area</span>
                <span className="text-base font-extrabold text-white mt-0.5 block truncate">{areaLabel}</span>
                <div className="flex items-center gap-2 mt-2 max-w-[220px]">
                  <div className="flex-1 bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-teal-400 h-full transition-all duration-500" style={{ width: `${metrics.progress}%` }} />
                  </div>
                  <span className="font-mono font-extrabold text-teal-400 text-[11px]">{metrics.progress}%</span>
                </div>
              </div>
            </div>

            <div className="flex-1 min-w-0">
              <span className="text-[10px] text-[#9FB3C8] uppercase font-bold tracking-wider block mb-2">Route Filter</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedRoute('')}
                  className={cn(
                    'px-3 py-1.5 rounded-full border text-xs font-bold transition-all',
                    selectedRoute === ''
                      ? 'bg-teal-500 text-white border-teal-400'
                      : 'bg-white/5 text-[#BCCCDC] border-[#334E68] hover:bg-white/10'
                  )}
                >
                  All Routes
                </button>
                {activeRoutes.map((rt) => (
                  <button
                    key={rt}
                    onClick={() => setSelectedRoute(rt)}
                    className={cn(
                      'px-3 py-1.5 rounded-full border text-xs font-bold transition-all',
                      selectedRoute === rt
                        ? 'bg-teal-500 text-white border-teal-400'
                        : 'bg-white/5 text-[#BCCCDC] border-[#334E68] hover:bg-white/10'
                    )}
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
            <div className="overflow-x-auto pb-1">
              <Tabs
                tabs={QUICK_FILTERS.map((f) => ({ value: f.value, label: f.label, count: metrics.quickCounts[f.value] ?? 0 }))}
                active={quickFilter}
                onChange={(v) => setQuickFilter(v)}
                size="sm"
              />
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
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="min-w-[150px]" aria-label="Order status filter">
              <option value="all">All Statuses</option>
              <option value="not_started">Not Started</option>
              <option value="order_received">Order Received</option>
              <option value="sales_order_generated">Sales Order</option>
              <option value="invoiced">Invoiced</option>
              <option value="dispatched">Dispatched</option>
              <option value="completed">Completed</option>
              <option value="error">Error</option>
            </Select>

            <Select value={orderMatchFilter} onChange={(e) => setOrderMatchFilter(e.target.value as 'all' | 'SAME' | 'DIFFERENT' | 'unset')} className="min-w-[150px]" aria-label="Order match filter">
              <option value="all">All Matches</option>
              <option value="SAME">Same</option>
              <option value="DIFFERENT">Different</option>
              <option value="unset">Not Set</option>
            </Select>

            <Select value={exceptionFilter} onChange={(e) => setExceptionFilter(e.target.value as 'all' | 'error' | 'different' | 'invoice_updated')} className="min-w-[150px]" aria-label="Exception filter">
              <option value="all">All Exceptions</option>
              <option value="error">Errors</option>
              <option value="different">Order Differences</option>
              <option value="invoice_updated">Invoice Updated</option>
            </Select>

            <Select value={assignedUserId} onChange={(e) => setAssignedUserId(e.target.value)} className="min-w-[150px]" aria-label="Assigned user filter">
              <option value="all">All Users</option>
              {allUsers.map((u) => (
                <option key={u.id} value={u.id}>{u.full_name}</option>
              ))}
            </Select>

            <Select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="min-w-[150px]" aria-label="Sort orders">
              <option value="name">Sort by Customer</option>
              <option value="route">Sort by Route</option>
              <option value="status">Sort by Status</option>
              <option value="updated_at">Sort by Last Updated</option>
            </Select>
          </div>
        </div>
      </TableToolbar>

      {/* Operational List: Mobile Cards (md:hidden) vs Desktop Table (hidden md:block) */}
      <Card flush className="p-3 md:p-0">
        {visibleOperations.length > 0 ? (
          <>
            {/* Mobile View: Purpose-built Order Cards */}
            <div className="grid grid-cols-1 gap-3 md:hidden">
              {pagedOperations.map((op) => (
                <MobileOrderCard
                  key={op.id}
                  op={op}
                  canUpdate={canUpdate}
                  canRevert={canRevert}
                  canUpdateOrderMatch={canUpdateOrderMatch}
                  onOpenDetails={setActiveDetailOp}
                  onToggleStep={toggleStepFor}
                  onOpenOrderMatch={handleOpenOrderMatch}
                  onReportError={setActiveErrorModalOp}
                  onOpenSOModal={setActiveSOModalOp}
                  onOpenInvoiceModal={setActiveInvoiceModalOp}
                />
              ))}
            </div>

            {/* Desktop View: Full Operational Data Table */}
            <div className="hidden md:block">
              <Table minWidth={1380}>
                <THead>
                  <Tr hover={false}>
                    <Th width={220} className="sticky left-0 bg-[#F4F7FB] z-10 border-r border-slate-200">Customer</Th>
                    <Th width={90}>City</Th>
                    <Th width={90}>Route</Th>
                    <Th width={120}>Status</Th>
                    <Th width={90} align="center">Received</Th>
                    <Th width={120} align="center">Sales Order</Th>
                    <Th width={120} align="center">Invoiced</Th>
                    <Th width={90} align="center">Dispatched</Th>
                    <Th width={110} align="center">Order Match</Th>
                    <Th width={90} align="center">POD Sent</Th>
                    <Th width={120}>Exception</Th>
                    <Th width={120}>Last Updated</Th>
                  </Tr>
                </THead>
                <TBody>
                  {pagedOperations.map((op) => (
                    <Tr key={op.id} className="group">
                      {/* Customer */}
                      <Td width={220} className="sticky left-0 bg-white z-10 border-r border-slate-200 group-hover:bg-[#F4F7FB]">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => setActiveDetailOp(op)}
                            className="flex items-center gap-2.5 min-w-0 flex-1 text-left group/cell"
                            title="Open order details"
                          >
                            <Avatar name={op.customer?.company_name || 'Customer'} size="sm" className="shrink-0" />
                            <span className="min-w-0">
                              <span className="font-bold text-slate-900 group-hover/cell:text-teal-700 transition-colors text-xs block w-full truncate">
                                {op.customer?.company_name || 'Customer'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono block truncate">{op.customer?.customer_code || '—'}</span>
                            </span>
                          </button>
                          <button
                            onClick={() => navigate(`/customers/${op.customer_id}`)}
                            className="p-1 text-slate-300 hover:text-teal-600 hover:bg-teal-50 rounded-md transition-all shrink-0"
                            title="Open customer profile"
                            aria-label="Open customer profile"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </Td>

                      {/* City */}
                      <Td width={90}>
                        <span className="text-xs font-semibold text-slate-600 block truncate" title={op.customer?.city || ''}>
                          {op.customer?.city || '—'}
                        </span>
                      </Td>

                      {/* Route */}
                      <Td width={90}>
                        <span className="inline-block text-[10px] font-bold text-navy-800 bg-navy-50 border border-navy-100 rounded px-1.5 py-0.5 truncate max-w-full" title={op.route}>
                          {op.route}
                        </span>
                      </Td>

                      {/* Status + Progress */}
                      <Td width={120}>
                        {renderStatusCell(op)}
                      </Td>

                      {/* Step 1: Order Received */}
                      <Td width={90} className="text-center">{renderStepCell(op, 'order_received')}</Td>

                      {/* Step 2: Sales Order + SO # */}
                      <Td width={120} className="text-center">{renderStepCell(op, 'sales_order_generated')}</Td>

                      {/* Step 3: Invoiced + Invoice # */}
                      <Td width={120} className="text-center">{renderStepCell(op, 'invoiced')}</Td>

                      {/* Step 4: Dispatched */}
                      <Td width={90} className="text-center">{renderStepCell(op, 'dispatched')}</Td>

                      {/* Order Match */}
                      <Td width={110} className="text-center">{renderOrderMatchCell(op)}</Td>

                      {/* Step 5: POD Sent */}
                      <Td width={90} className="text-center">{renderStepCell(op, 'pod_sent')}</Td>

                      {/* Exception */}
                      <Td width={120}>
                        {renderExceptionCell(op)}
                      </Td>

                      {/* Last Updated */}
                      <Td width={120}>
                        {renderLastUpdatedCell(op)}
                      </Td>
                    </Tr>
                  ))}
                </TBody>
              </Table>
            </div>

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
