import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DailyOrderOperation, DailyOrderOperationHistory, PortalType } from '../types';
import { localDb } from '../services/db';
import { permissions } from '../services/permissions';
import { formatDate } from '../utils/format';
import { SOModal } from '../components/orders/SOModal';
import { InvoiceModal } from '../components/orders/InvoiceModal';
import { ReportErrorModal } from '../components/orders/ReportErrorModal';
import { UndoStepModal } from '../components/orders/UndoStepModal';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  MapPin, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  RotateCcw, 
  History, 
  Info, 
  ExternalLink,
  Layers,
  Filter,
  CheckSquare,
  Clock,
  Send,
  FileText
} from 'lucide-react';
import { Badge, Button, Card, Input, Modal, Select, Table, TBody, Td, Th, THead, Tr, useToast } from '../components/ui';

export const Orders: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Permission Checks
  const canUpdate = permissions.canUpdateDailyOperations(user).allowed;
  const canRevert = permissions.canRevertDailyOperations(user).allowed;
  const isAdmin = user?.role === 'admin';

  // Date State (Defaults to today in YYYY-MM-DD)
  const [selectedDateStr, setSelectedDateStr] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Portal & Route State
  const [selectedPortal, setSelectedPortal] = useState<PortalType>('all');
  const [selectedRoute, setSelectedRoute] = useState<string>('');

  // Filter & Search State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'name' | 'status' | 'updated_at'>('name');

  // Active Modals
  const [activeSOModalOp, setActiveSOModalOp] = useState<DailyOrderOperation | null>(null);
  const [activeInvoiceModalOp, setActiveInvoiceModalOp] = useState<DailyOrderOperation | null>(null);
  const [activeErrorModalOp, setActiveErrorModalOp] = useState<DailyOrderOperation | null>(null);
  const [activeUndoModal, setActiveUndoModal] = useState<{
    op: DailyOrderOperation;
    step: 'order_received' | 'sales_order_generated' | 'invoiced' | 'dispatched';
    stepName: string;
  } | null>(null);

  const [activeHistoryOp, setActiveHistoryOp] = useState<DailyOrderOperation | null>(null);
  const [historyList, setHistoryList] = useState<DailyOrderOperationHistory[]>([]);

  // Load Operations Data from DB
  const { operations, activeRoutes, weekday } = useMemo(() => {
    return localDb.getDailyOrderOperations({
      date: selectedDateStr,
      route: selectedRoute,
      portal: selectedPortal,
      searchTerm,
      statusFilter,
      sortBy: sortBy === 'name' ? 'customer_name' : sortBy,
    });
  }, [selectedDateStr, selectedRoute, selectedPortal, searchTerm, statusFilter, sortBy]);

  // Set initial selected route when activeRoutes load/change
  useEffect(() => {
    if (activeRoutes.length > 0) {
      if (!selectedRoute || !activeRoutes.includes(selectedRoute)) {
        setSelectedRoute(activeRoutes[0]);
      }
    } else {
      setSelectedRoute('');
    }
  }, [activeRoutes, selectedRoute]);

  // Date Navigation Handlers
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

  const handleToday = () => {
    setSelectedDateStr(new Date().toISOString().split('T')[0]);
  };

  // Route Progress Metrics Calculations
  const metrics = useMemo(() => {
    const total = operations.length;
    const completed = operations.filter(o => o.status === 'completed').length;
    const errors = operations.filter(o => o.error_flag).length;
    const notStarted = operations.filter(o => o.status === 'not_started').length;
    const inProgress = total - completed - errors - notStarted;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    const orderReceivedCount = operations.filter(o => o.order_received).length;
    const salesOrderCount = operations.filter(o => o.sales_order_generated).length;
    const invoicedCount = operations.filter(o => o.invoiced).length;
    const dispatchedCount = operations.filter(o => o.dispatched).length;

    return {
      total,
      completed,
      errors,
      notStarted,
      inProgress,
      percentage,
      orderReceivedCount,
      salesOrderCount,
      invoicedCount,
      dispatchedCount,
    };
  }, [operations]);

  // Workflow Action Handlers
  const handleToggleOrderReceived = (op: DailyOrderOperation) => {
    if (!canUpdate) {
      toast({ type: 'error', title: 'Permission Denied', message: 'You do not have permission to update daily operations.' });
      return;
    }

    if (op.order_received) {
      if (!canRevert) {
        toast({ type: 'error', title: 'Permission Denied', message: 'Only Sales Agents and Admins can revert completed steps.' });
        return;
      }
      setActiveUndoModal({ op, step: 'order_received', stepName: 'Order Received' });
    } else {
      try {
        localDb.updateDailyOrderOperationStep(op.id, 'order_received', null, user!.id);
        toast({ type: 'success', title: 'Order Received', message: `Marked Order Received for ${op.customer?.company_name}` });
      } catch (err: any) {
        toast({ type: 'error', title: 'Action Failed', message: err.message });
      }
    }
  };

  const handleToggleSalesOrderGenerated = (op: DailyOrderOperation) => {
    if (!canUpdate) {
      toast({ type: 'error', title: 'Permission Denied', message: 'You do not have permission to update daily operations.' });
      return;
    }

    if (op.sales_order_generated) {
      if (!canRevert) {
        toast({ type: 'error', title: 'Permission Denied', message: 'Only Sales Agents and Admins can revert completed steps.' });
        return;
      }
      setActiveUndoModal({ op, step: 'sales_order_generated', stepName: 'Sales Order Generated' });
    } else {
      if (!op.order_received) {
        toast({ type: 'error', title: 'Dependency Required', message: 'Order Received must be completed before generating a Sales Order.' });
        return;
      }
      setActiveSOModalOp(op);
    }
  };

  const handleToggleInvoiced = (op: DailyOrderOperation) => {
    if (!canUpdate) {
      toast({ type: 'error', title: 'Permission Denied', message: 'You do not have permission to update daily operations.' });
      return;
    }

    if (op.invoiced) {
      if (!canRevert) {
        toast({ type: 'error', title: 'Permission Denied', message: 'Only Sales Agents and Admins can revert completed steps.' });
        return;
      }
      setActiveUndoModal({ op, step: 'invoiced', stepName: 'Invoiced' });
    } else {
      if (!op.sales_order_generated) {
        toast({ type: 'error', title: 'Dependency Required', message: 'Sales Order must be generated before Invoicing.' });
        return;
      }
      setActiveInvoiceModalOp(op);
    }
  };

  const handleToggleDispatched = (op: DailyOrderOperation) => {
    if (!canUpdate) {
      toast({ type: 'error', title: 'Permission Denied', message: 'You do not have permission to update daily operations.' });
      return;
    }

    if (op.dispatched) {
      if (!canRevert) {
        toast({ type: 'error', title: 'Permission Denied', message: 'Only Sales Agents and Admins can revert completed steps.' });
        return;
      }
      setActiveUndoModal({ op, step: 'dispatched', stepName: 'Dispatched' });
    } else {
      if (!op.invoiced) {
        toast({ type: 'error', title: 'Dependency Required', message: 'Customer must be Invoiced before Dispatch.' });
        return;
      }
      try {
        localDb.updateDailyOrderOperationStep(op.id, 'dispatched', null, user!.id);
        toast({ type: 'success', title: 'Dispatched', message: `Marked Dispatched for ${op.customer?.company_name}` });
      } catch (err: any) {
        toast({ type: 'error', title: 'Action Failed', message: err.message });
      }
    }
  };

  const handleConfirmSOSubmit = (soNumber: string) => {
    if (!activeSOModalOp) return;
    try {
      localDb.updateDailyOrderOperationStep(activeSOModalOp.id, 'sales_order_generated', soNumber, user!.id);
      toast({ type: 'success', title: 'Sales Order Saved', message: `Recorded SO #${soNumber} for ${activeSOModalOp.customer?.company_name}` });
    } catch (err: any) {
      toast({ type: 'error', title: 'Action Failed', message: err.message });
    }
  };

  const handleConfirmInvoiceSubmit = (invoiceNumber: string) => {
    if (!activeInvoiceModalOp) return;
    try {
      localDb.updateDailyOrderOperationStep(activeInvoiceModalOp.id, 'invoiced', invoiceNumber, user!.id);
      toast({ type: 'success', title: 'Invoice Saved', message: `Recorded INV #${invoiceNumber} for ${activeInvoiceModalOp.customer?.company_name}` });
    } catch (err: any) {
      toast({ type: 'error', title: 'Action Failed', message: err.message });
    }
  };

  const handleConfirmReportError = (description: string, priority: 'normal' | 'high' | 'urgent') => {
    if (!activeErrorModalOp) return;
    try {
      const res = localDb.reportDailyOrderOperationError(activeErrorModalOp.id, description, priority, user!.id);
      toast({ type: 'info', title: 'Error Ticket Created', message: `Created Customer Query ${res.query.query_number} for ${activeErrorModalOp.customer?.company_name}` });
    } catch (err: any) {
      toast({ type: 'error', title: 'Action Failed', message: err.message });
    }
  };

  const handleConfirmUndoStep = (reason: string) => {
    if (!activeUndoModal) return;
    try {
      localDb.revertDailyOrderOperationStep(activeUndoModal.op.id, activeUndoModal.step, reason, user!.id);
      toast({ type: 'info', title: 'Step Reverted', message: `Reverted ${activeUndoModal.stepName} for ${activeUndoModal.op.customer?.company_name}` });
    } catch (err: any) {
      toast({ type: 'error', title: 'Revert Failed', message: err.message });
    }
  };

  const handleOpenHistory = (op: DailyOrderOperation) => {
    const list = localDb.getDailyOrderOperationHistory(op.id);
    setHistoryList(list);
    setActiveHistoryOp(op);
  };

  const formatWeekdayTitle = (dayStr: string) => {
    return dayStr.charAt(0).toUpperCase() + dayStr.slice(1);
  };

  return (
    <div className="space-y-6">
      {/* Header Info Banner */}
      <Card className="p-4 border-l-4 border-l-brand-500 bg-brand-50/50">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-brand-600 shrink-0 mt-0.5" />
          <div className="text-xs text-slate-700 space-y-1">
            <p className="font-bold text-slate-900">J&T Supplies Route-Based Daily Order Operations</p>
            <p>
              Process customer milestone workflows scheduled for active routes. 
              <span className="font-semibold text-slate-900"> NO INVENTORY / CART ENTRY:</span> Track daily processing progression (<span className="font-semibold">Order Received ➔ SO Generated ➔ Invoiced ➔ Dispatched</span>) directly per customer without traditional order building.
            </p>
          </div>
        </div>
      </Card>

      {/* Date & Weekday Selector Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-brand-50 text-brand-600 rounded-xl flex items-center justify-center font-bold">
            <CalendarIcon className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-black text-slate-900">
                {formatDate(selectedDateStr, { month: 'long', day: 'numeric', year: 'numeric' })}
              </h2>
              <span className="text-xs px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider bg-brand-100 text-brand-800">
                {formatWeekdayTitle(weekday)}
              </span>
            </div>
            <span className="text-xs text-slate-500">Route schedule derived automatically from selected date</span>
          </div>
        </div>

        {/* Date Selector Navigation Controls */}
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" onClick={handlePreviousDay} icon={<ChevronLeft className="w-4 h-4" />}>
            Prev Day
          </Button>

          <Input
            type="date"
            value={selectedDateStr}
            onChange={(e) => e.target.value && setSelectedDateStr(e.target.value)}
            className="w-36 text-xs"
          />

          <Button size="sm" variant="outline" onClick={handleNextDay} icon={<ChevronRight className="w-4 h-4" />}>
            Next Day
          </Button>

          <Button size="sm" variant="secondary" onClick={handleToday}>
            Today
          </Button>
        </div>
      </div>

      {/* Portal Switcher & Route Selection Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Operational Portal View</span>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            <button
              onClick={() => setSelectedPortal('all')}
              className={`px-3 py-1 rounded-lg transition-all ${selectedPortal === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              All Routes
            </button>
            <button
              onClick={() => setSelectedPortal('kelowna')}
              className={`px-3 py-1 rounded-lg transition-all ${selectedPortal === 'kelowna' ? 'bg-white text-brand-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Kelowna Portal
            </button>
            <button
              onClick={() => setSelectedPortal('outside_kelowna')}
              className={`px-3 py-1 rounded-lg transition-all ${selectedPortal === 'outside_kelowna' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              Outside Kelowna Portal
            </button>
          </div>
        </div>

        {/* Scheduled Route Tabs/Cards */}
        {activeRoutes.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {activeRoutes.map((rt) => {
              const isSelected = selectedRoute === rt;
              return (
                <button
                  key={rt}
                  onClick={() => setSelectedRoute(rt)}
                  className={`p-3 rounded-[12px] border text-left transition-all ${
                    isSelected
                      ? 'border-teal-500 bg-teal-50/70 text-teal-900 font-extrabold shadow-xs ring-1 ring-teal-500/20'
                      : 'border-[#D9E2EC] bg-white hover:border-[#BCCCDC] text-[#172B4D]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-extrabold">{rt}</span>
                    <MapPin className={`w-3.5 h-3.5 ${isSelected ? 'text-teal-600' : 'text-[#829AB1]'}`} />
                  </div>
                  <span className="text-[10px] text-[#52606D] block mt-1 uppercase font-bold tracking-wider">Scheduled Today</span>
                </button>
              );
            })}
          </div>
        ) : (
          <Card className="p-6 text-center border-amber-200 bg-amber-50/50">
            <MapPin className="w-8 h-8 text-amber-500 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-900">No Active Routes Scheduled for {formatWeekdayTitle(weekday)}</p>
            <p className="text-xs text-slate-600 mt-1">Check customer route assignments or configure the weekly route schedule in the Admin Panel.</p>
          </Card>
        )}
      </div>

      {/* Selected Route Summary & Progress Metrics */}
      {selectedRoute && (
        <div className="space-y-4">
          <Card className="p-5 bg-[#102A43] text-white space-y-4 shadow-card border border-[#243B53]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#243B53] pb-4">
              <div>
                <span className="text-[10px] text-teal-400 font-extrabold uppercase tracking-widest block">Active Operations Route</span>
                <h3 className="text-xl font-extrabold tracking-tight text-white mt-0.5">{selectedRoute.toUpperCase()} ROUTE</h3>
              </div>

              {/* Progress Summary */}
              <div className="flex items-center gap-4 text-xs">
                <div>
                  <span className="text-[#9FB3C8] block text-[10px] uppercase font-bold tracking-wider">Route Progress</span>
                  <span className="text-base font-extrabold text-white">{metrics.completed} / {metrics.total} Completed</span>
                </div>
                <div className="w-28 bg-[#243B53] rounded-full h-3 overflow-hidden border border-[#334E68]">
                  <div className="bg-teal-500 h-full transition-all duration-500" style={{ width: `${metrics.percentage}%` }} />
                </div>
                <span className="font-mono font-extrabold text-teal-400 text-sm">{metrics.percentage}%</span>
              </div>
            </div>

            {/* Stage Bottleneck Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
              <div className="bg-[#243B53]/80 p-3 rounded-[8px] border border-[#334E68]">
                <span className="text-[10px] text-[#9FB3C8] uppercase font-bold block">Order Received</span>
                <span className="text-base font-extrabold text-teal-400 block mt-0.5">{metrics.orderReceivedCount} / {metrics.total}</span>
              </div>
              <div className="bg-[#243B53]/80 p-3 rounded-[8px] border border-[#334E68]">
                <span className="text-[10px] text-[#9FB3C8] uppercase font-bold block">SO Generated</span>
                <span className="text-base font-extrabold text-indigo-300 block mt-0.5">{metrics.salesOrderCount} / {metrics.total}</span>
              </div>
              <div className="bg-[#243B53]/80 p-3 rounded-[8px] border border-[#334E68]">
                <span className="text-[10px] text-[#9FB3C8] uppercase font-bold block">Invoiced</span>
                <span className="text-base font-extrabold text-purple-300 block mt-0.5">{metrics.invoicedCount} / {metrics.total}</span>
              </div>
              <div className="bg-[#243B53]/80 p-3 rounded-[8px] border border-[#334E68]">
                <span className="text-[10px] text-[#9FB3C8] uppercase font-bold block">Dispatched</span>
                <span className="text-base font-extrabold text-green-400 block mt-0.5">{metrics.dispatchedCount} / {metrics.total}</span>
              </div>
              <div className="bg-[#243B53]/80 p-3 rounded-[8px] border border-[#334E68]">
                <span className="text-[10px] text-red-400 uppercase font-bold block">Errors / Tickets</span>
                <span className="text-base font-extrabold text-red-400 block mt-0.5">{metrics.errors}</span>
              </div>
            </div>
          </Card>

          {/* Search, Status Filters, & Sorting Bar */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-card flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="relative flex-1 max-w-xl">
              <Input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search customers by name, phone, WhatsApp, SO #, or Invoice #..."
                icon={<Search className="w-4 h-4 text-slate-400" />}
                className="pl-9"
              />
            </div>

            <div className="flex items-center gap-3">
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs"
              >
                <option value="all">All Statuses</option>
                <option value="not_started">Not Started</option>
                <option value="order_received">Order Received</option>
                <option value="sales_order_generated">SO Generated</option>
                <option value="invoiced">Invoiced</option>
                <option value="dispatched">Dispatched</option>
                <option value="completed">✓ Completed</option>
                <option value="error">⚠ Errors Only</option>
              </Select>

              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="text-xs"
              >
                <option value="name">Sort by Customer Name</option>
                <option value="status">Sort by Status</option>
                <option value="updated_at">Sort by Last Updated</option>
              </Select>
            </div>
          </div>

          {/* Daily Customer Workflow Table */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-card overflow-hidden">
            {operations.length > 0 ? (
              <div className="overflow-x-auto max-w-full">
                <Table className="min-w-[1100px]">
                  <THead>
                    <Tr hover={false}>
                      <Th className="sticky left-0 bg-slate-100 z-10 w-72 border-r border-slate-200">Customer</Th>
                      <Th className="text-center w-36">Order Received</Th>
                      <Th className="text-center w-44">Sales Order Generated</Th>
                      <Th className="w-36">SO #</Th>
                      <Th className="text-center w-36">Invoiced</Th>
                      <Th className="w-36">Invoice #</Th>
                      <Th className="text-center w-32">Dispatched</Th>
                      <Th className="text-center w-40">Error / Ticket</Th>
                      <Th className="w-32">Status</Th>
                      <Th className="text-right w-20">Audit</Th>
                    </Tr>
                  </THead>
                  <TBody>
                    {operations.map((op) => (
                      <Tr key={op.id}>
                        {/* Sticky Customer Info Cell */}
                        <Td className="sticky left-0 bg-white z-10 border-r border-slate-200 shadow-sm">
                          <div>
                            <button
                              onClick={() => navigate(`/customers/${op.customer_id}`)}
                              className="font-bold text-slate-900 hover:text-brand-600 transition-colors text-xs text-left block flex items-center gap-1 group"
                            >
                              <span>{op.customer?.company_name || 'Customer'}</span>
                              <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-brand-600 opacity-0 group-hover:opacity-100 transition-all shrink-0" />
                            </button>
                            <span className="text-[10px] text-slate-400 font-mono block">{op.customer?.customer_code}</span>
                            <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>📞 {op.customer?.phone || op.customer?.whatsapp_number || '—'}</span>
                              <span className="text-slate-300">•</span>
                              <span className="font-semibold text-slate-600">{op.customer?.city}</span>
                            </div>
                          </div>
                        </Td>

                        {/* Step 1: Order Received Checkbox */}
                        <Td className="text-center">
                          <button
                            onClick={() => handleToggleOrderReceived(op)}
                            disabled={!canUpdate}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              op.order_received
                                ? 'bg-sky-600 text-white shadow-sm'
                                : 'border-2 border-slate-300 hover:border-sky-500 bg-slate-50'
                            }`}
                          >
                            {op.order_received && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          {op.order_received_at && (
                            <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                              {formatDate(op.order_received_at, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </Td>

                        {/* Step 2: Sales Order Generated Checkbox */}
                        <Td className="text-center">
                          <button
                            onClick={() => handleToggleSalesOrderGenerated(op)}
                            disabled={!canUpdate}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              op.sales_order_generated
                                ? 'bg-indigo-600 text-white shadow-sm'
                                : op.order_received
                                ? 'border-2 border-slate-300 hover:border-indigo-500 bg-slate-50'
                                : 'border border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            {op.sales_order_generated && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          {op.sales_order_generated_at && (
                            <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                              {formatDate(op.sales_order_generated_at, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </Td>

                        {/* SO # Display */}
                        <Td>
                          {op.sales_order_number ? (
                            <span className="font-mono text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                              {op.sales_order_number}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300 italic">—</span>
                          )}
                        </Td>

                        {/* Step 3: Invoiced Checkbox */}
                        <Td className="text-center">
                          <button
                            onClick={() => handleToggleInvoiced(op)}
                            disabled={!canUpdate}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              op.invoiced
                                ? 'bg-purple-600 text-white shadow-sm'
                                : op.sales_order_generated
                                ? 'border-2 border-slate-300 hover:border-purple-500 bg-slate-50'
                                : 'border border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            {op.invoiced && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          {op.invoiced_at && (
                            <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                              {formatDate(op.invoiced_at, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </Td>

                        {/* Invoice # Display */}
                        <Td>
                          {op.invoice_number ? (
                            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-100">
                              {op.invoice_number}
                            </span>
                          ) : (
                            <span className="text-xs text-slate-300 italic">—</span>
                          )}
                        </Td>

                        {/* Step 4: Dispatched Checkbox */}
                        <Td className="text-center">
                          <button
                            onClick={() => handleToggleDispatched(op)}
                            disabled={!canUpdate}
                            className={`w-7 h-7 rounded-lg inline-flex items-center justify-center transition-all ${
                              op.dispatched
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : op.invoiced
                                ? 'border-2 border-slate-300 hover:border-emerald-500 bg-slate-50'
                                : 'border border-slate-200 bg-slate-100 text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            {op.dispatched && <CheckCircle2 className="w-4 h-4" />}
                          </button>
                          {op.dispatched_at && (
                            <span className="block text-[9px] text-slate-400 font-mono mt-0.5">
                              {formatDate(op.dispatched_at, { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          )}
                        </Td>

                        {/* Error Flag / Customer Query Link */}
                        <Td className="text-center">
                          {op.error_flag && op.error_query ? (
                            <button
                              onClick={() => navigate(`/queries/${op.error_query!.id}`)}
                              className={`text-[10px] font-bold px-2 py-1 rounded-md inline-flex items-center gap-1 border transition-all ${
                                op.error_query.status === 'resolved' || op.error_query.status === 'closed'
                                  ? 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100'
                                  : 'bg-rose-50 text-rose-800 border-rose-300 hover:bg-rose-100'
                              }`}
                            >
                              <AlertTriangle className="w-3 h-3 text-rose-600 shrink-0" />
                              <span>{op.error_query.query_number}</span>
                              {op.error_query.status === 'resolved' && <span className="text-[9px] opacity-75">(Resolved)</span>}
                            </button>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => setActiveErrorModalOp(op)}
                              className="text-slate-500 hover:text-rose-600 hover:border-rose-300"
                              icon={<AlertTriangle className="w-3 h-3" />}
                            >
                              Report Error
                            </Button>
                          )}
                        </Td>

                        {/* Status Badge */}
                        <Td>
                          {op.status === 'completed' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              <span>✓ Completed</span>
                            </span>
                          )}
                          {op.status === 'error' && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-200">
                              <AlertTriangle className="w-3 h-3 text-rose-600" />
                              <span>Error</span>
                            </span>
                          )}
                          {op.status === 'not_started' && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                              Not Started
                            </span>
                          )}
                          {['order_received', 'sales_order_generated', 'invoiced', 'dispatched'].includes(op.status) && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 capitalize">
                              <Clock className="w-3 h-3 text-sky-600" />
                              <span>{op.status.replace(/_/g, ' ')}</span>
                            </span>
                          )}
                        </Td>

                        {/* History Audit Log Button */}
                        <Td className="text-right">
                          <button
                            onClick={() => handleOpenHistory(op)}
                            className="p-1.5 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                            title="View Workflow Audit History"
                          >
                            <History className="w-4 h-4" />
                          </button>
                        </Td>
                      </Tr>
                    ))}
                  </TBody>
                </Table>
              </div>
            ) : (
              <div className="p-12 text-center text-slate-500 text-xs">
                <MapPin className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="font-semibold text-slate-700">No scheduled customers found for {selectedRoute}.</p>
                <p className="mt-1">Assign customers to the <span className="font-semibold text-slate-900">{selectedRoute}</span> city or route in the Customers module.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Sales Order Number Input */}
      {activeSOModalOp && (
        <SOModal
          isOpen={!!activeSOModalOp}
          onClose={() => setActiveSOModalOp(null)}
          onSubmit={handleConfirmSOSubmit}
          customerName={activeSOModalOp.customer?.company_name || 'Customer'}
        />
      )}

      {/* Modal: Invoice Number Input */}
      {activeInvoiceModalOp && (
        <InvoiceModal
          isOpen={!!activeInvoiceModalOp}
          onClose={() => setActiveInvoiceModalOp(null)}
          onSubmit={handleConfirmInvoiceSubmit}
          customerName={activeInvoiceModalOp.customer?.company_name || 'Customer'}
          soNumber={activeInvoiceModalOp.sales_order_number}
        />
      )}

      {/* Modal: Report Operational Error */}
      {activeErrorModalOp && (
        <ReportErrorModal
          isOpen={!!activeErrorModalOp}
          onClose={() => setActiveErrorModalOp(null)}
          onSubmit={handleConfirmReportError}
          customerName={activeErrorModalOp.customer?.company_name || 'Customer'}
        />
      )}

      {/* Modal: Undo/Revert Step Reason */}
      {activeUndoModal && (
        <UndoStepModal
          isOpen={!!activeUndoModal}
          onClose={() => setActiveUndoModal(null)}
          onConfirm={handleConfirmUndoStep}
          stepName={activeUndoModal.stepName}
          customerName={activeUndoModal.op.customer?.company_name || 'Customer'}
        />
      )}

      {/* Modal: Operation History Audit Log */}
      {activeHistoryOp && (
        <Modal
          isOpen={!!activeHistoryOp}
          onClose={() => setActiveHistoryOp(null)}
          title={`Workflow History — ${activeHistoryOp.customer?.company_name}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 flex items-center justify-between">
              <span className="font-mono text-slate-500 font-semibold">{activeHistoryOp.operation_date}</span>
              <span className="font-bold text-slate-900">{activeHistoryOp.route} Route</span>
            </div>

            {historyList.length > 0 ? (
              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {historyList.map((h) => (
                  <div key={h.id} className="p-3 border border-slate-200 rounded-lg text-xs space-y-1 bg-white">
                    <div className="flex items-center justify-between font-bold text-slate-900">
                      <span>{h.action}</span>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {formatDate(h.timestamp, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {h.reference_number && (
                      <span className="text-[11px] font-mono font-bold text-brand-700 block">Ref: {h.reference_number}</span>
                    )}
                    {h.reason && (
                      <p className="text-amber-800 bg-amber-50 p-2 rounded text-[11px] font-medium border border-amber-200">
                        Reason: {h.reason}
                      </p>
                    )}
                    <span className="text-[10px] text-slate-500 block pt-1">
                      By: {h.user_profile ? h.user_profile.full_name : 'System Agent'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">No historical workflow audit events logged yet.</p>
            )}

            <div className="flex justify-end pt-2">
              <Button variant="outline" onClick={() => setActiveHistoryOp(null)}>
                Close History
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Orders;
