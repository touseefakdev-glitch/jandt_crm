import React, { useState, useMemo } from 'react';
import { localDb } from '../services/db';
import { orderDraftService, buildMatchContext } from '../services/orderDraftService';
import { attentionAlertService } from '../services/attentionAlertService';
import { normalizeText } from '../services/textNormalizer';
import { classifyMessage } from '../services/messageClassifier';
import { parseOrderMessage } from '../services/orderParser';
import { matchOrderCandidates } from '../services/productMatcher';
import { Card, CardHeader, CardBody, Button, Badge, Input, Select, Textarea } from '../components/ui';
import {
  MessageSquare,
  Bot,
  Send,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  ShoppingBag,
  RefreshCw,
  ArrowRight,
  ShieldAlert,
  User,
  Zap,
  Info,
  Layers,
  FileText,
  Clock,
  Package
} from 'lucide-react';
import { getMessageClassificationBadge, getAttentionPriorityBadge } from '../utils/badges';

const PRESET_MESSAGES = [
  { label: 'Multi-Product Order', text: 'kal 10 blue gloves aur 2 box masks' },
  { label: 'Customer History ("Usual")', text: 'send my usual gloves' },
  { label: 'Ambiguous Mentions', text: 'send 5 blue' },
  { label: 'Missing Quantity', text: 'send gloves' },
  { label: 'Exact SKU Order', text: 'FPK-GEN-ALUMINFOIL-500FT: 5' },
  { label: 'Customer Question (Non-Order)', text: 'what time is delivery tomorrow?' },
  { label: 'Urgent Complaint', text: 'URGENT my order from yesterday was incomplete' },
  { label: 'Order Confirmation', text: 'yes confirm order' },
];

export const WhatsAppSimulator: React.FC = () => {
  const customers = useMemo(() => localDb.getCustomers('', 'all'), []);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>(customers[0]?.id || '');
  const [customMessage, setCustomMessage] = useState<string>(PRESET_MESSAGES[0].text);
  const [executionResult, setExecutionResult] = useState<any | null>(null);

  const selectedCustomer = useMemo(() => {
    return customers.find(c => c.id === selectedCustomerId) || customers[0];
  }, [customers, selectedCustomerId]);

  const handleSimulate = (textToTest?: string) => {
    const msgText = textToTest !== undefined ? textToTest : customMessage;
    if (!msgText.trim() || !selectedCustomer) return;

    // Step-by-step pipeline execution for visualization
    const normalized = normalizeText(msgText);
    const classification = classifyMessage(msgText);
    const candidates = parseOrderMessage(msgText);

    const ctx = buildMatchContext(selectedCustomer);
    const matchResult = matchOrderCandidates(candidates, ctx);

    // Get or create conversation for test customer
    const contact = localDb.getOrCreateWhatsAppContact(selectedCustomer.phone || '2505550199', selectedCustomer.company_name);
    const conversation = localDb.getOrCreateWhatsAppConversation(contact.id, selectedCustomer.id);

    // Run actual orderDraftService execution
    const processRes = orderDraftService.processIncomingMessage(conversation, msgText);

    const resultObj = {
      rawText: msgText,
      normalized,
      classification,
      candidates,
      matchResult,
      processRes,
    };

    setExecutionResult(resultObj);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Phase B Testing Workbench
              </span>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white mt-1">WhatsApp Order Intelligence Simulator</h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Simulate messy customer WhatsApp messages, test multi-level product matching, customer history context, and human escalation.
            </p>
          </div>
        </div>

        <Button
          onClick={() => {
            setExecutionResult(null);
            setCustomMessage(PRESET_MESSAGES[0].text);
          }}
          variant="outline"
          className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
          icon={<RefreshCw className="w-3.5 h-3.5" />}
        >
          Reset Simulator
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Customer Selector & Input Panel */}
        <div className="lg:col-span-1 space-y-6">
          <Card>
            <CardHeader title="1. Select Test Customer Account" icon={<User className="w-4 h-4 text-brand-600" />} />
            <CardBody className="space-y-4 pt-4">
              <Select
                label="Customer Account (393 Live Customers)"
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value)}
              >
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} ({c.customer_code}) {c.city ? `— ${c.city}` : ''}
                  </option>
                ))}
              </Select>

              {selectedCustomer && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Customer Code:</span>
                    <span className="font-mono font-bold text-brand-700">{selectedCustomer.customer_code}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">Phone / WhatsApp:</span>
                    <span className="font-mono font-semibold text-slate-900">{selectedCustomer.phone || '2505550199'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 font-medium">City & Route:</span>
                    <span className="font-semibold text-slate-800">{selectedCustomer.city || 'Kelowna'} {selectedCustomer.route ? `• ${selectedCustomer.route}` : ''}</span>
                  </div>
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="2. Quick Preset Scenarios" icon={<Zap className="w-4 h-4 text-amber-600" />} />
            <CardBody className="pt-4 space-y-2">
              {PRESET_MESSAGES.map((preset, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setCustomMessage(preset.text);
                    handleSimulate(preset.text);
                  }}
                  className="w-full text-left p-2.5 rounded-lg border border-slate-200 hover:border-brand-400 hover:bg-brand-50/50 transition-all text-xs flex justify-between items-center group"
                >
                  <span className="font-semibold text-slate-800 group-hover:text-brand-700">{preset.label}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-brand-600" />
                </button>
              ))}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="3. Enter Custom WhatsApp Message" icon={<MessageSquare className="w-4 h-4 text-emerald-600" />} />
            <CardBody className="space-y-4 pt-4">
              <Textarea
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                placeholder="Type any unstructured WhatsApp message..."
                className="font-mono text-xs"
              />

              <Button
                onClick={() => handleSimulate()}
                className="w-full"
                icon={<Sparkles className="w-4 h-4" />}
              >
                Run Order Intelligence Engine
              </Button>
            </CardBody>
          </Card>
        </div>

        {/* Right Column: Real-Time Execution Inspector */}
        <div className="lg:col-span-2 space-y-6">
          {executionResult ? (
            <>
              {/* Classification & Primary Decision Card */}
              <Card>
                <CardHeader title="Pipeline Decision & Message Classification" icon={<Layers className="w-4 h-4 text-brand-600" />} />
                <CardBody className="pt-4 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-slate-900 text-white rounded-xl">
                    <div>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Detected Intent</span>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge badge={getMessageClassificationBadge(executionResult.classification.classification)} />
                        <span className="text-xs text-slate-300 font-mono">
                          Confidence: {(executionResult.classification.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider block">Bot Action</span>
                      <span className="text-sm font-bold text-emerald-400 font-mono mt-0.5 block">
                        {executionResult.processRes.draft ? `Draft Status: ${executionResult.processRes.draft.status}` : 'Human Escalation / Non-Order'}
                      </span>
                    </div>
                  </div>

                  {/* Customer Message Display */}
                  <div className="p-4 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-1.5">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">Raw Customer Input</span>
                    <p className="text-sm font-mono font-bold text-emerald-950">"{executionResult.rawText}"</p>
                    <span className="text-[11px] text-emerald-700 block">
                      Normalized: <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono">{executionResult.normalized}</code>
                    </span>
                  </div>

                  {/* Automated Bot Reply Card */}
                  {executionResult.processRes.reply && (
                    <div className="p-4 bg-slate-800 text-slate-100 rounded-xl space-y-2 border border-slate-700">
                      <div className="flex items-center justify-between text-xs text-slate-400 font-semibold border-b border-slate-700 pb-2">
                        <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                          <Bot className="w-4 h-4" /> Generated WhatsApp Bot Response
                        </span>
                        <span className="font-mono text-[10px]">Automated Confirmation Engine</span>
                      </div>
                      <p className="text-xs font-mono whitespace-pre-line leading-relaxed text-slate-200">
                        {executionResult.processRes.reply}
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Product Extraction & Matching Details */}
              <Card>
                <CardHeader title="Product Candidate Extraction & Catalog Matching" icon={<Package className="w-4 h-4 text-violet-600" />} />
                <CardBody className="pt-4 space-y-4">
                  {executionResult.matchResult.matched && executionResult.matchResult.matched.length > 0 ? (
                    <div className="space-y-3">
                      {executionResult.matchResult.matched.map((item: any, idx: number) => (
                        <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                            <div className="flex items-center gap-2">
                              <span className="w-5 h-5 bg-brand-100 text-brand-700 font-bold text-xs rounded-full flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-bold text-slate-900">
                                Extracted Mention: <code className="bg-white px-2 py-0.5 rounded border border-slate-200 text-brand-700">"{item.mention}"</code>
                              </span>
                            </div>
                            <span className="text-xs font-mono font-bold text-slate-600">
                              Qty: <span className="text-brand-600 font-extrabold">{item.quantity !== null ? item.quantity : 'Missing (?)'}</span> {item.unit || ''}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Catalog Match Method</span>
                              <span className="font-bold text-slate-800 uppercase block">{item.matchMethod}</span>
                              <span className="text-[11px] text-slate-500 block">
                                Score: <strong className="text-emerald-600">{(item.confidence * 100).toFixed(0)}%</strong>
                              </span>
                            </div>

                            <div className="p-3 bg-white rounded-lg border border-slate-200 space-y-1">
                              <span className="text-[10px] text-slate-400 font-bold uppercase block">Matched Catalog Product</span>
                              <div>
                                <span className="font-mono font-bold text-brand-700 mr-2">{item.product.sku}</span>
                                <span className="font-bold text-slate-900">{item.product.product_name}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-500 italic text-center">
                      No high-confidence product matches found.
                    </div>
                  )}

                  {/* Ambiguous Choice Trigger */}
                  {executionResult.matchResult.ambiguous && executionResult.matchResult.ambiguous.length > 0 && (
                    <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2 text-xs text-amber-950">
                      <span className="font-bold flex items-center gap-1 text-amber-800">
                        <AlertTriangle className="w-4 h-4" /> Ambiguity Detected — Clarification Triggered:
                      </span>
                      <p className="font-mono bg-white p-3 rounded border border-amber-200 whitespace-pre-line text-slate-800">
                        {executionResult.matchResult.clarificationQuestion}
                      </p>
                    </div>
                  )}
                </CardBody>
              </Card>

              {/* Order Draft & Route Operations Intake */}
              {executionResult.processRes.draft && (
                <Card>
                  <CardHeader title="Order Draft & Route Operations Intake" icon={<ShoppingBag className="w-4 h-4 text-emerald-600" />} />
                  <CardBody className="pt-4 space-y-4">
                    <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-emerald-900 uppercase">Internal Draft Reference</span>
                        <span className="font-mono font-extrabold text-emerald-700 bg-white px-2 py-0.5 rounded border border-emerald-300">
                          {executionResult.processRes.draft.internal_reference || 'Draft Pending Confirmation'}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-slate-700">
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Route</span>
                          <span className="font-bold">{executionResult.processRes.draft.route}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Delivery Date</span>
                          <span className="font-bold">{executionResult.processRes.draft.delivery_date}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                          <span className="font-bold text-emerald-700">{executionResult.processRes.draft.status}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-400 block uppercase">Total Line Items</span>
                          <span className="font-bold">{executionResult.processRes.draft.items?.length || 0}</span>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </Card>
              )}

              {/* Human Attention Alert Card */}
              {executionResult.processRes.alert && (
                <Card className="border-rose-300 bg-rose-50/40">
                  <CardHeader title="Human Attention Alert Triggered" icon={<ShieldAlert className="w-4 h-4 text-rose-600" />} />
                  <CardBody className="pt-4 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <Badge badge={getAttentionPriorityBadge(executionResult.processRes.alert.priority)} />
                      <span className="text-[10px] font-mono text-slate-500">Alert ID: {executionResult.processRes.alert.id}</span>
                    </div>
                    <p className="font-bold text-rose-950">{executionResult.processRes.alert.message_text}</p>
                    <p className="text-slate-600">
                      Message classified as <strong className="text-slate-900">{executionResult.classification.classification}</strong> requiring agent intervention.
                    </p>
                  </CardBody>
                </Card>
              )}
            </>
          ) : (
            <Card className="p-12 text-center border-dashed">
              <div className="max-w-md mx-auto space-y-3">
                <div className="w-12 h-12 bg-brand-50 text-brand-600 rounded-full flex items-center justify-center mx-auto">
                  <Sparkles className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Run a Simulator Test</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Select a test customer on the left or click one of the quick preset scenarios to inspect how the order intelligence engine parses text, matches products, checks customer history, and handles ambiguity.
                </p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};
