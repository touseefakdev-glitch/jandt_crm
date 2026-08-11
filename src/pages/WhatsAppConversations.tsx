import React, { useState, useMemo, useEffect } from 'react';
import { localDb } from '../services/db';
import { orderDraftService } from '../services/orderDraftService';
import { attentionAlertService, getOpenAlerts, convertAlertToQuery } from '../services/attentionAlertService';
import { whatsappIngestionService } from '../services/whatsappIngestionService';
import {
  Customer,
  CustomerQuery,
  QueryFormInput,
  WhatsAppConversation,
  WhatsAppMessage,
  OrderDraft,
  OrderDraftItem,
  AgentAttentionAlert
} from '../types';
import { Card, CardHeader, CardBody, Button, Badge, Input, Select, Textarea, Modal } from '../components/ui';
import {
  MessageSquare,
  Bot,
  User,
  Send,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShoppingBag,
  Plus,
  Trash2,
  Edit,
  ShieldAlert,
  PauseCircle,
  PlayCircle,
  UserCheck,
  Phone,
  MapPin,
  Search,
  Check,
  X,
  FileText,
  RefreshCw,
  RotateCcw
} from 'lucide-react';
import { getMessageClassificationBadge, getAttentionPriorityBadge } from '../utils/badges';

export const WhatsAppConversations: React.FC = () => {
  const [conversations, setConversations] = useState<WhatsAppConversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'attention' | 'awaiting' | 'human' | 'confirmed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [ingestionInfo, setIngestionInfo] = useState<{ ingested: number; skipped: number } | null>(null);

  // Agent manual reply state
  const [replyText, setReplyText] = useState('');

  // Draft Edit Modal State
  const [isEditItemsModalOpen, setIsEditItemsModalOpen] = useState(false);
  const [editItemsList, setEditItemsList] = useState<OrderDraftItem[]>([]);

  // Query Conversion Modal State
  const [isCreateQueryModalOpen, setIsCreateQueryModalOpen] = useState(false);
  const [querySubject, setQuerySubject] = useState('');
  const [queryCategory, setQueryCategory] = useState('');
  const [queryDescription, setQueryDescription] = useState('');

  const activeUserId = useAuthUserId();
  const catalogProducts = useMemo(() => localDb.getProducts({ activeOnly: true }), []);
  const categories = useMemo(() => localDb.getCategories(), []);

  const refreshData = async () => {
    // 1. Ingest raw Baileys messages from Supabase (Phase 2)
    const ingRes = await whatsappIngestionService.ingestRawSupabaseMessages();
    setIngestionInfo({ ingested: ingRes.ingested, skipped: ingRes.skipped });

    // 2. Fetch conversations
    const convs = localDb.getWhatsAppConversations();
    setConversations(convs);
    if (!selectedConvId && convs.length > 0) {
      setSelectedConvId(convs[0].id);
    }
  };

  useEffect(() => {
    refreshData();
  }, []);

  const activeConversation = useMemo(() => {
    return conversations.find(c => c.id === selectedConvId) || null;
  }, [conversations, selectedConvId]);

  const activeCustomer = useMemo(() => {
    if (!activeConversation || !activeConversation.customer_id) return null;
    return localDb.getCustomerById(activeConversation.customer_id);
  }, [activeConversation]);

  const activeMessages = useMemo(() => {
    if (!selectedConvId) return [];
    return localDb.getWhatsAppMessages(selectedConvId);
  }, [selectedConvId, conversations]);

  const activeDraft = useMemo(() => {
    if (!selectedConvId) return null;
    return localDb.getOrderDrafts().find(d => d.conversation_id === selectedConvId) || null;
  }, [selectedConvId, conversations]);

  const activeAlerts = useMemo(() => {
    if (!selectedConvId) return [];
    return getOpenAlerts().filter(a => a.conversation_id === selectedConvId);
  }, [selectedConvId, conversations]);

  const activeGroupMapping = useMemo(() => {
    if (!activeConversation || !activeConversation.whatsapp_contact_id) return null;
    const contact = localDb.getWhatsAppContacts().find(c => c.id === activeConversation.whatsapp_contact_id);
    return contact ? whatsappIngestionService.resolveGroupFromRemoteJid(contact.whatsapp_number) : null;
  }, [activeConversation]);

  const filteredConversations = useMemo(() => {
    let list = [...conversations];
    if (filterTab === 'attention') {
      const alertConvIds = new Set(getOpenAlerts().map(a => a.conversation_id));
      list = list.filter(c => alertConvIds.has(c.id));
    } else if (filterTab === 'awaiting') {
      list = list.filter(c => {
        const d = localDb.getOrderDrafts().find(dr => dr.conversation_id === c.id);
        return d && d.status === 'AWAITING_CONFIRMATION';
      });
    } else if (filterTab === 'human') {
      list = list.filter(c => c.bot_status === 'human_takeover');
    } else if (filterTab === 'confirmed') {
      list = list.filter(c => {
        const d = localDb.getOrderDrafts().find(dr => dr.conversation_id === c.id);
        return d && d.status === 'CONFIRMED';
      });
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter(c => {
        const cust = c.customer_id ? localDb.getCustomerById(c.customer_id) : null;
        return (
          (cust && cust.company_name.toLowerCase().includes(q)) ||
          (cust && cust.customer_code.toLowerCase().includes(q)) ||
          (cust && cust.phone && cust.phone.toLowerCase().includes(q)) ||
          (c.route && c.route.toLowerCase().includes(q))
        );
      });
    }

    return list.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
  }, [conversations, filterTab, searchQuery]);

  // Handle agent manual reply
  const handleSendAgentReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedConvId) return;

    localDb.addWhatsAppMessage({
      conversation_id: selectedConvId,
      direction: 'outbound',
      sender: 'human_agent',
      message_type: 'text',
      message_text: replyText.trim(),
      classification: 'NON_ORDER',
      processing_status: 'confirmed',
      sent_at: new Date().toISOString()
    });

    setReplyText('');
    refreshData();
  };

  // Reprocess / Replay Message (Plan §6)
  const handleReprocessMessage = (msgId: string) => {
    const res = whatsappIngestionService.reprocessWhatsAppMessage(msgId);
    alert(res.note);
    refreshData();
  };

  // Toggle Human Takeover
  const handleToggleTakeover = () => {
    if (!selectedConvId || !activeConversation) return;
    if (activeConversation.bot_status === 'human_takeover') {
      orderDraftService.resumeBot(selectedConvId);
    } else {
      orderDraftService.takeOverConversation(selectedConvId);
    }
    refreshData();
  };

  // Toggle Bot Pause / Resume
  const handleTogglePause = () => {
    if (!selectedConvId || !activeConversation) return;
    if (activeConversation.bot_status === 'paused') {
      orderDraftService.resumeBot(selectedConvId);
    } else {
      orderDraftService.pauseBot(selectedConvId);
    }
    refreshData();
  };

  // Confirm Draft Manually
  const handleApproveDraft = () => {
    if (!activeDraft || !activeConversation) return;
    orderDraftService.confirmDraft(activeDraft.id, 'Confirmed by Agent Override', activeConversation);
    refreshData();
  };

  // Open Edit Items Modal
  const handleOpenEditItems = () => {
    if (!activeDraft) return;
    const items = activeDraft.items || localDb.getOrderDraftItems(activeDraft.id);
    setEditItemsList([...items]);
    setIsEditItemsModalOpen(true);
  };

  const handleSaveEditedItems = () => {
    if (!activeDraft) return;
    editItemsList.forEach(item => {
      localDb.updateOrderDraftItem(item.id, { quantity: item.quantity });
    });
    setIsEditItemsModalOpen(false);
    refreshData();
  };

  // Convert Alert to Support Query
  const handleOpenConvertQuery = () => {
    if (!activeAlerts[0] || !activeCustomer) return;
    setQuerySubject(`WhatsApp Inquiry: ${activeCustomer.company_name}`);
    setQueryCategory(categories[0]?.id || '');
    setQueryDescription(activeAlerts[0].message_text || 'Customer inquiry from WhatsApp channel');
    setIsCreateQueryModalOpen(true);
  };

  const handleCreateQueryFromAlert = () => {
    if (!activeAlerts[0] || !activeCustomer || !querySubject.trim()) return;

    convertAlertToQuery(activeAlerts[0], activeUserId, querySubject);

    setIsCreateQueryModalOpen(false);
    refreshData();
  };

  return (
    <div className="space-y-6">
      {/* Page Title & Status Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">WhatsApp Message Center</h1>
            <span className="text-xs font-mono bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
              Baileys Connect Pipe
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Monitor real-time Baileys WhatsApp messages, inspect resolved customer/group accounts, manage draft proposals, and reprocess failed items.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {ingestionInfo && (
            <span className="text-[11px] font-mono text-slate-500 bg-white px-2.5 py-1 rounded border border-slate-200">
              Synced: +{ingestionInfo.ingested} / skipped {ingestionInfo.skipped}
            </span>
          )}
          <Button variant="outline" size="sm" onClick={refreshData} icon={<RefreshCw className="w-3.5 h-3.5" />}>
            Sync Baileys Messages
          </Button>
        </div>
      </div>

      {/* Main 3-Column Operations Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-210px)]">
        
        {/* Left Column (4 cols): Conversation Directory List */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-card flex flex-col overflow-hidden">
          <div className="p-4 border-b border-slate-200 space-y-3">
            <Input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by customer, code, phone, route..."
              icon={<Search className="w-4 h-4 text-slate-400" />}
              className="text-xs"
            />

            <div className="flex items-center gap-1 overflow-x-auto text-[11px] font-semibold border-b border-slate-200 pb-1">
              <button
                onClick={() => setFilterTab('all')}
                className={`px-2.5 py-1 rounded-md transition-colors ${filterTab === 'all' ? 'bg-brand-50 text-brand-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                All ({conversations.length})
              </button>
              <button
                onClick={() => setFilterTab('attention')}
                className={`px-2.5 py-1 rounded-md transition-colors ${filterTab === 'attention' ? 'bg-rose-50 text-rose-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Attention
              </button>
              <button
                onClick={() => setFilterTab('awaiting')}
                className={`px-2.5 py-1 rounded-md transition-colors ${filterTab === 'awaiting' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Awaiting
              </button>
              <button
                onClick={() => setFilterTab('confirmed')}
                className={`px-2.5 py-1 rounded-md transition-colors ${filterTab === 'confirmed' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
              >
                Confirmed
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
            {filteredConversations.length > 0 ? (
              filteredConversations.map((conv) => {
                const cust = conv.customer_id ? localDb.getCustomerById(conv.customer_id) : null;
                const d = localDb.getOrderDrafts().find(dr => dr.conversation_id === conv.id);
                const draft = d || null;
                const hasPendingAlert = getOpenAlerts().some((a: AgentAttentionAlert) => a.conversation_id === conv.id);
                const isSelected = conv.id === selectedConvId;

                return (
                  <button
                    key={conv.id}
                    onClick={() => setSelectedConvId(conv.id)}
                    className={`w-full text-left p-3.5 transition-colors flex items-start gap-3 relative ${
                      isSelected ? 'bg-brand-50/60 border-l-4 border-l-brand-600' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className="w-9 h-9 bg-slate-900 text-white rounded-xl flex items-center justify-center font-bold text-xs shrink-0">
                      {cust ? cust.company_name.substring(0, 2).toUpperCase() : '??'}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-slate-900 truncate">
                          {cust ? cust.company_name : 'UNKNOWN_CUSTOMER'}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">
                          {new Date(conv.last_message_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1 flex-wrap">
                        <span className="text-[10px] font-mono font-bold text-brand-700 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                          {conv.route || 'Kelowna'}
                        </span>
                        {draft && (
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                            draft.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {draft.status}
                          </span>
                        )}
                        {hasPendingAlert && (
                          <span className="text-[10px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded flex items-center gap-1">
                            <ShieldAlert className="w-3 h-3 text-rose-600" /> Attention
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })
            ) : (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No conversations found matching filter.
              </div>
            )}
          </div>
        </div>

        {/* Center Column (5 cols): Chat Stream & Reply Box */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-card flex flex-col overflow-hidden">
          {activeConversation ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 flex items-center justify-between gap-2 bg-slate-50/50">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-extrabold text-slate-900">
                      {activeCustomer ? activeCustomer.company_name : 'UNKNOWN_CUSTOMER'}
                    </h2>
                    {activeGroupMapping && (
                      <span className="text-[10px] font-mono font-bold bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded">
                        {activeGroupMapping.name}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                    <span>Phone: {activeCustomer?.phone || 'Not Resolved'}</span>
                    <span>•</span>
                    <span className="font-bold text-brand-700">Route: {activeConversation.route || 'Kelowna'}</span>
                  </p>
                </div>

                {/* Control Action Buttons */}
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant={activeConversation.bot_status === 'human_takeover' ? 'primary' : 'outline'}
                    onClick={handleToggleTakeover}
                    icon={<UserCheck className="w-3.5 h-3.5" />}
                    title={activeConversation.bot_status === 'human_takeover' ? 'Human Agent Active (Bot Paused)' : 'Take Over Conversation'}
                  >
                    {activeConversation.bot_status === 'human_takeover' ? 'Human Active' : 'Take Over'}
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleTogglePause}
                    icon={activeConversation.bot_status === 'paused' ? <PlayCircle className="w-3.5 h-3.5 text-emerald-600" /> : <PauseCircle className="w-3.5 h-3.5 text-amber-600" />}
                    title="Pause or Resume Bot Automation"
                  >
                    {activeConversation.bot_status === 'paused' ? 'Resume Bot' : 'Pause Bot'}
                  </Button>
                </div>
              </div>

              {/* Message History Stream */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-slate-50/30">
                {activeMessages.map((msg: WhatsAppMessage) => {
                  const isCustomer = msg.direction === 'inbound';
                  return (
                    <div key={msg.id} className={`flex flex-col ${isCustomer ? 'items-start' : 'items-end'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {isCustomer ? 'Customer' : msg.sender === 'bot' ? 'AI Bot' : 'Human Agent'}
                        </span>
                        {msg.classification && (
                          <Badge badge={getMessageClassificationBadge(msg.classification)} />
                        )}
                        <span className="text-[10px] font-mono text-slate-400">
                          {new Date(msg.sent_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <button
                          onClick={() => handleReprocessMessage(msg.id)}
                          title="Reprocess message cleanly without duplicate orders"
                          className="text-[10px] text-slate-400 hover:text-brand-600 flex items-center gap-0.5 ml-1"
                        >
                          <RotateCcw className="w-3 h-3" /> Replay
                        </button>
                      </div>

                      <div className={`p-3 rounded-2xl max-w-md text-xs leading-relaxed ${
                        isCustomer
                          ? 'bg-white border border-slate-200 text-slate-900 rounded-tl-none shadow-xs'
                          : msg.sender === 'bot'
                          ? 'bg-slate-900 text-white rounded-tr-none shadow-xs'
                          : 'bg-brand-600 text-white rounded-tr-none shadow-xs'
                      }`}>
                        <p className="whitespace-pre-line">{msg.message_text}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Agent Manual Reply Form */}
              <form onSubmit={handleSendAgentReply} className="p-3 border-t border-slate-200 bg-white flex gap-2">
                <Input
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  placeholder="Type a manual response to customer..."
                  className="text-xs flex-1"
                />
                <Button type="submit" size="sm" icon={<Send className="w-3.5 h-3.5" />}>
                  Send
                </Button>
              </form>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400 text-xs italic">
              Select a conversation on the left to view messages.
            </div>
          )}
        </div>

        {/* Right Column (3 cols): Order Draft Inspector & Alert Handoff */}
        <div className="lg:col-span-3 space-y-6 overflow-y-auto">
          {/* Attention Alerts Action Box */}
          {activeAlerts.length > 0 && (
            <Card className="border-rose-300 bg-rose-50/50">
              <CardHeader title="Human Attention Needed" icon={<ShieldAlert className="w-4 h-4 text-rose-600" />} />
              <CardBody className="pt-3 space-y-3 text-xs">
                <div className="flex items-center justify-between">
                  <Badge badge={getAttentionPriorityBadge(activeAlerts[0].priority)} />
                  <span className="font-mono text-[10px] text-slate-500">{activeAlerts[0].id}</span>
                </div>
                <p className="font-bold text-rose-950">{activeAlerts[0].message_text}</p>

                <Button
                  size="sm"
                  variant="outline"
                  className="w-full text-xs border-rose-300 text-rose-800 hover:bg-rose-100"
                  onClick={handleOpenConvertQuery}
                  icon={<HelpCircle className="w-3.5 h-3.5" />}
                >
                  Convert Alert to Support Query
                </Button>
              </CardBody>
            </Card>
          )}

          {/* Live Order Draft Inspector */}
          {activeDraft ? (
            <Card>
              <CardHeader title="Order Draft Inspector" icon={<ShoppingBag className="w-4 h-4 text-emerald-600" />} />
              <CardBody className="pt-4 space-y-4 text-xs">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Draft Reference</span>
                    <span className="font-mono font-extrabold text-brand-700">{activeDraft.internal_reference || 'Awaiting'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-slate-400 font-bold uppercase">Status</span>
                    <span className="font-bold text-emerald-700">{activeDraft.status}</span>
                  </div>
                </div>

                {/* Draft Line Items */}
                <div className="space-y-2">
                  <span className="font-bold text-slate-900 block">
                    Extracted Line Items ({(activeDraft.items || localDb.getOrderDraftItems(activeDraft.id)).length}):
                  </span>
                  {(activeDraft.items || localDb.getOrderDraftItems(activeDraft.id)).length > 0 ? (
                    (activeDraft.items || localDb.getOrderDraftItems(activeDraft.id)).map((item: OrderDraftItem, idx: number) => (
                      <div key={idx} className="p-2.5 bg-white rounded-lg border border-slate-200 space-y-1">
                        <div className="flex justify-between font-bold text-slate-900">
                          <span>{item.matched_product_name || item.customer_text}</span>
                          <span className="font-mono text-brand-700">x{item.quantity}</span>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500">
                          <span>Method: {item.match_method}</span>
                          <span className="text-emerald-600 font-bold">{(item.match_confidence * 100).toFixed(0)}%</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 bg-slate-50 rounded-lg text-slate-400 italic text-center text-[11px]">
                      No items in draft.
                    </div>
                  )}
                </div>

                {/* Draft Management Toolbar */}
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  <Button size="sm" variant="secondary" className="w-full text-xs" onClick={handleOpenEditItems} icon={<Edit className="w-3.5 h-3.5" />}>
                    Edit Draft Line Items
                  </Button>

                  {activeDraft.status !== 'CONFIRMED' && (
                    <Button size="sm" className="w-full text-xs" onClick={handleApproveDraft} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                      Approve & Confirm Order
                    </Button>
                  )}
                </div>
              </CardBody>
            </Card>
          ) : (
            <Card className="p-6 text-center text-slate-400 text-xs italic">
              No active order draft for this conversation.
            </Card>
          )}
        </div>
      </div>

      {/* Edit Items Modal */}
      <Modal
        isOpen={isEditItemsModalOpen}
        onClose={() => setIsEditItemsModalOpen(false)}
        title="Edit Order Draft Items"
        subtitle="Modify matched catalog products and quantities before confirmation."
      >
        <div className="space-y-4 text-xs">
          <div className="space-y-2">
            {editItemsList.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-2">
                <div className="flex-1">
                  <span className="font-bold text-slate-900 block">{item.matched_product_name || item.customer_text}</span>
                  <span className="text-[10px] text-slate-500">Customer Mention: "{item.customer_text}"</span>
                </div>
                <Input
                  type="number"
                  value={item.quantity || 1}
                  onChange={(e) => {
                    const q = parseInt(e.target.value, 10) || 1;
                    setEditItemsList(prev => prev.map((it, i) => i === idx ? { ...it, quantity: q } : it));
                  }}
                  className="w-16 text-center text-xs"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setEditItemsList(prev => prev.filter((_, i) => i !== idx))}
                  icon={<Trash2 className="w-3.5 h-3.5 text-red-600" />}
                />
              </div>
            ))}
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsEditItemsModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEditedItems}>Save Draft Changes</Button>
          </div>
        </div>
      </Modal>

      {/* Create Support Query Modal */}
      <Modal
        isOpen={isCreateQueryModalOpen}
        onClose={() => setIsCreateQueryModalOpen(false)}
        title="Convert Alert to Customer Support Query"
        subtitle="Create an operational support ticket in the Customer Query module."
      >
        <div className="space-y-4 text-xs">
          <Input
            label="Query Subject *"
            value={querySubject}
            onChange={(e) => setQuerySubject(e.target.value)}
          />
          <Select
            label="Category *"
            value={queryCategory}
            onChange={(e) => setQueryCategory(e.target.value)}
          >
            {categories.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Textarea
            label="Description *"
            rows={3}
            value={queryDescription}
            onChange={(e) => setQueryDescription(e.target.value)}
          />

          <div className="pt-4 border-t border-slate-200 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCreateQueryModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateQueryFromAlert} icon={<HelpCircle className="w-3.5 h-3.5" />}>Create Support Query</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

function useAuthUserId(): string {
  const rawUser = localStorage.getItem('jt_crm_auth_user');
  if (rawUser) {
    try {
      const u = JSON.parse(rawUser);
      if (u && u.id) return u.id;
    } catch (_) {}
  }
  return '00000000-0000-0000-0000-000000000001';
}
