/**
 * Order Draft Service for the WhatsApp Order Intelligence System.
 *
 * Orchestrates the full order intake pipeline (plan §19–§27, §44, §49–§54):
 *
 *   Classify → Parse → Match → Create/Update Draft →
 *   Clarify → Confirm → Record Confirmed Order
 *
 * Responsibilities:
 * - Create drafts from parsed + matched order candidates.
 * - Handle explicit customer confirmation ("yes", "correct").
 * - Apply customer corrections (quantity changes, product adds/removes).
 * - Cancel drafts on cancellation intent.
 * - Detect quantity/matching ambiguity and request clarification.
 * - Pause the bot / mark human takeover per conversation.
 * - Emit immutable order intake events (audit trail).
 * - Escalate non-order / urgent / unknown messages as agent attention alerts.
 */
import { localDb } from './db';
import { classifyMessage, detectCancellationIntent } from './messageClassifier';
import { parseOrderMessage } from './orderParser';
import { matchOrderCandidates, ProductMatchContext, MIN_MATCH_CONFIDENCE } from './productMatcher';
import {
  AgentAttentionAlert,
  Customer,
  MessageClassificationResult,
  OrderDraft,
  OrderDraftItem,
  WhatsAppConversation,
  WhatsAppMessage,
} from '../types';
import { normalizeText, tokensContained } from './textNormalizer';

export interface ProcessedIncomingMessage {
  classification: MessageClassificationResult;
  outcome: 'order' | 'confirmation' | 'clarification' | 'cancelled' | 'non_order' | 'unknown' | 'human_review';
  draft?: OrderDraft;
  reply?: string;
  alert?: AgentAttentionAlert;
  message?: WhatsAppMessage;
}

const ACTIVE_DRAFT_STATUSES = [
  'NEW_MESSAGE', 'ANALYZING', 'DRAFT_CREATED', 'NEEDS_CLARIFICATION',
  'AWAITING_CONFIRMATION', 'CUSTOMER_CORRECTING',
] as const;

function buildConfirmationSummary(draft: OrderDraft): string {
  const items = draft.items || localDb.getOrderDraftItems(draft.id);
  const lines = items
    .filter(i => i.status !== 'rejected')
    .map((i, idx) => {
      const name = i.matched_product_name || i.product?.product_name || i.customer_text;
      const qty = i.quantity != null ? ` — ${i.quantity}` : '';
      return `${idx + 1}. ${name}${qty}`;
    });
  const routeLine = draft.route ? ` for ${draft.route}'s delivery` : '';
  return [
    `Please confirm your order${routeLine}:`,
    '',
    ...lines,
    '',
    'Reply YES to confirm.',
    'If anything is incorrect, tell us what needs to be changed.',
  ].join('\n');
}

function buildOrderReceivedMessage(draft: OrderDraft): string {
  const routeLine = draft.route ? ` for tomorrow's ${draft.route} delivery` : '';
  return [
    'Thank you.',
    '',
    `Your order has been received and confirmed${routeLine}.`,
    '',
    'We will process it shortly.',
  ].join('\n');
}

function buildRouteOrderMessage(draft: OrderDraft): string {
  const items = draft.items || localDb.getOrderDraftItems(draft.id);
  const lines = items
    .filter(i => i.status !== 'rejected')
    .map(i => {
      const name = i.matched_product_name || i.product?.product_name || i.customer_text;
      return `• ${name} — ${i.quantity ?? ''}`.trim();
    });
  return [
    'NEW CONFIRMED ORDER',
    '',
    `Customer:\n${draft.customer?.company_name || 'Unknown'}`,
    `Route:\n${draft.route || '—'}`,
    `Delivery:\n${draft.delivery_date || '—'}`,
    '',
    'Items:',
    ...lines,
    '',
    `Confirmed:\n${draft.confirmed_at ? new Date(draft.confirmed_at).toLocaleString() : '—'}`,
    `Reference:\n${draft.internal_reference || '—'}`,
  ].join('\n');
}

function logEvent(
  eventType: string,
  description: string,
  opts: { draftId?: string | null; conversationId?: string | null; messageId?: string | null; confidence?: number | null; payload?: Record<string, unknown> | null } = {}
) {
  localDb.logOrderIntakeEvent({
    order_draft_id: opts.draftId ?? null,
    conversation_id: opts.conversationId ?? null,
    message_id: opts.messageId ?? null,
    event_type: eventType,
    description,
    confidence: opts.confidence ?? null,
    payload: opts.payload ?? null,
  });
}

/** Builds the matcher context for a customer from the local database. */
export function buildMatchContext(customer: Customer | null): ProductMatchContext {
  const { productAliases, customerAliases } = localDb.getProductAliasesForCustomer(customer?.id || null);
  return {
    products: localDb.getProducts(),
    history: customer ? localDb.getCustomerProductHistory(customer.id) : [],
    productAliases,
    customerAliases,
  };
}

function resolveDraftCustomer(conversation: WhatsAppConversation): Customer | null {
  if (conversation.customer_id) return localDb.getCustomerById(conversation.customer_id);
  return null;
}

function isConversationBotPaused(conversation: WhatsAppConversation): boolean {
  return conversation.bot_status === 'paused' || conversation.bot_status === 'human_takeover';
}

/**
 * Core entry point: processes an inbound customer text message.
 * Phase A does not auto-confirm anything — it produces drafts, clarifications,
 * confirmations and alerts that a human/customer approves.
 */
export function processIncomingMessage(
  conversation: WhatsAppConversation,
  rawText: string,
  opts: { messageId?: string } = {}
): ProcessedIncomingMessage {
  const classification = classifyMessage(rawText);
  const customer = resolveDraftCustomer(conversation);
  const messageId = opts.messageId || null;

  // --- Cancellation intent (plan §49) ---
  if (detectCancellationIntent(rawText)) {
    const activeDraft = localDb.getActiveDraftForConversation(conversation.id);
    if (activeDraft && activeDraft.status !== 'FORWARDED') {
      const cancelled = localDb.updateOrderDraft(activeDraft.id, { status: 'CANCELLED' });
      const draft = localDb.getOrderDraftWithItems(activeDraft.id);
      logEvent('draft_cancelled', `Order draft ${activeDraft.internal_reference || activeDraft.id} cancelled by customer.`, {
        draftId: activeDraft.id, conversationId: conversation.id, messageId,
      });
      return {
        classification,
        outcome: 'cancelled',
        draft: draft ?? undefined,
        reply: 'Your order request has been cancelled. Let us know if you need anything else.',
      };
    }
    // No cancellable draft — escalate to human.
    const alert = localDb.createAgentAttentionAlert({
      customer_id: conversation.customer_id,
      conversation_id: conversation.id,
      message_id: messageId,
      classification: classification.classification,
      message_text: rawText,
      priority: 'high',
    });
    logEvent('escalation_created', 'Cancellation request without an active order draft — escalated to human.', {
      conversationId: conversation.id, messageId,
    });
    return { classification, outcome: 'human_review', alert, reply: 'One of our team members will review your request.' };
  }

  // --- Explicit confirmation (plan §20–§22) ---
  if (classification.classification === 'ORDER_CONFIRMATION') {
    const activeDraft = localDb.getActiveDraftForConversation(conversation.id);
    if (activeDraft) {
      return confirmDraft(activeDraft.id, rawText, conversation, messageId);
    }
    // "Yes" with no pending draft — nothing to confirm.
    logEvent('message_received', 'Confirmation reply with no active order draft — ignored.', {
      conversationId: conversation.id, messageId,
    });
    return { classification, outcome: 'non_order' };
  }

  // --- Non-order / attention-required messages (plan §33–§34) ---
  if (!classification.isOrder) {
    if (classification.requiresHumanAttention) {
      const alert = localDb.createAgentAttentionAlert({
        customer_id: conversation.customer_id,
        conversation_id: conversation.id,
        message_id: messageId,
        classification: classification.classification,
        message_text: rawText,
        priority: classification.priority,
      });
      logEvent('escalation_created', `Non-order message (${classification.classification}) escalated to human.`, {
        conversationId: conversation.id, messageId,
      });
      return {
        classification,
        outcome: 'human_review',
        alert,
        reply: 'I want to make sure I handle this correctly. One of our team members will get back to you shortly.',
      };
    }
    logEvent('message_received', `Non-order message classified as ${classification.classification}.`, {
      conversationId: conversation.id, messageId,
    });
    return { classification, outcome: 'non_order' };
  }

  // --- Bot paused / human takeover (plan §53–§54) ---
  if (isConversationBotPaused(conversation)) {
    const alert = localDb.createAgentAttentionAlert({
      customer_id: conversation.customer_id,
      conversation_id: conversation.id,
      message_id: messageId,
      classification: classification.classification,
      message_text: rawText,
      priority: classification.priority === 'normal' ? 'normal' : classification.priority,
    });
    logEvent('message_received', 'Message received while bot paused / human takeover — escalated.', {
      conversationId: conversation.id, messageId,
    });
    return { classification, outcome: 'human_review', alert };
  }

  // --- Order handling: parse + match ---
  const candidates = parseOrderMessage(rawText);
  const ctx = buildMatchContext(customer);
  const matchResult = matchOrderCandidates(candidates, ctx);
  const matchedItems = matchResult.matched.filter(m => m.confidence >= MIN_MATCH_CONFIDENCE);

  logEvent('candidate_extracted', `Extracted ${candidates.length} candidate(s) from message.`, {
    conversationId: conversation.id, messageId, payload: { candidates: candidates.map(c => ({ mention: c.mention, quantity: c.quantity, unit: c.unit })) },
  });
  if (matchResult.matched.length > 0) {
    logEvent('product_matched', `Matched ${matchResult.matched.length} product mention(s) against the catalog.`, {
      conversationId: conversation.id, messageId, confidence: matchResult.matched[0].confidence,
      payload: { matches: matchResult.matched.map(m => ({ productId: m.product.id, method: m.matchMethod, confidence: m.confidence })) },
    });
  }

  // Existing draft in AWAITING_CONFIRMATION / CUSTOMER_CORRECTING → treat new
  // order content as a correction (plan §22–§24).
  const activeDraft = localDb.getActiveDraftForConversation(conversation.id);
  if (activeDraft) {
    if (activeDraft.status === 'AWAITING_CONFIRMATION' || activeDraft.status === 'CUSTOMER_CORRECTING') {
      return applyCorrection(activeDraft, rawText, conversation, messageId);
    }
    // Re-create for new message contexts
    localDb.updateOrderDraft(activeDraft.id, { status: 'CANCELLED' });
  }

  // Build draft items
  const now = new Date().toISOString();
  const draft = localDb.createOrderDraft({
    customer_id: conversation.customer_id,
    conversation_id: conversation.id,
    route: conversation.route,
    delivery_date: conversation.delivery_date,
    status: 'DRAFT_CREATED',
  });

  const items: OrderDraftItem[] = [];
  for (const m of matchedItems) {
    items.push({
      id: crypto.randomUUID(),
      order_draft_id: draft.id,
      product_id: m.product.id,
      customer_text: m.mention,
      matched_product_name: m.product.product_name,
      quantity: m.quantity,
      unit: m.unit,
      match_method: m.matchMethod,
      match_confidence: m.confidence,
      status: m.quantity == null ? 'needs_clarification' : 'matched',
      created_at: now,
      updated_at: now,
    });
  }
  // Ambiguous mentions become needs_clarification items
  for (const a of matchResult.ambiguous) {
    items.push({
      id: crypto.randomUUID(),
      order_draft_id: draft.id,
      product_id: a.product.id,
      customer_text: a.mention,
      matched_product_name: a.product.product_name,
      quantity: a.quantity,
      unit: a.unit,
      match_method: a.matchMethod,
      match_confidence: a.confidence,
      status: 'needs_clarification',
      created_at: now,
      updated_at: now,
    });
  }
  localDb.setOrderDraftItems(draft.id, items);

  const avgConfidence = items.length
    ? items.reduce((s, i) => s + i.match_confidence, 0) / items.length
    : 0;

  const needsClarification =
    matchResult.needsClarification || matchedItems.length === 0 || matchResult.unmatched.length > 0;

  const nextStatus = needsClarification ? 'NEEDS_CLARIFICATION' : 'AWAITING_CONFIRMATION';
  const finalDraft = localDb.updateOrderDraft(draft.id, {
    status: nextStatus,
    overall_confidence: avgConfidence,
    clarification_reason: needsClarification ? matchResult.clarificationQuestion || 'Order requires clarification.' : null,
    pending_question: needsClarification ? matchResult.clarificationQuestion || null : null,
  });

  const fullDraft = localDb.getOrderDraftWithItems(draft.id);

  logEvent('draft_created', `Order draft created with status ${nextStatus} (confidence ${Math.round(avgConfidence * 100)}%).`, {
    draftId: draft.id, conversationId: conversation.id, messageId, confidence: avgConfidence,
  });

  if (needsClarification) {
    const alert = localDb.createAgentAttentionAlert({
      customer_id: conversation.customer_id,
      conversation_id: conversation.id,
      message_id: messageId,
      classification: classification.classification,
      message_text: rawText,
      priority: matchResult.ambiguous.length > 0 ? 'high' : 'normal',
    });
    return {
      classification,
      outcome: 'clarification',
      draft: fullDraft ?? undefined,
      reply: matchResult.clarificationQuestion || 'I could not fully understand this order. Could you clarify?',
      alert,
    };
  }

  return {
    classification,
    outcome: 'order',
    draft: fullDraft ?? undefined,
    reply: buildConfirmationSummary(fullDraft!),
  };
}

/**
 * Confirms an awaiting-confirmation draft. Records the confirmed order request
 * (plan §25–§26) without touching the legacy billing/inventory system.
 */
export function confirmDraft(
  draftId: string,
  confirmationText: string,
  conversation: WhatsAppConversation,
  messageId?: string | null
): ProcessedIncomingMessage {
  const existing = localDb.getOrderDraftById(draftId);
  if (!existing) {
    return { classification: { classification: 'ORDER_CONFIRMATION', confidence: 1, isOrder: false, requiresHumanAttention: false, priority: 'normal', matchedKeywords: [] }, outcome: 'non_order' };
  }

  const internalReference = existing.internal_reference || localDb.generateInternalReference();
  const now = new Date().toISOString();

  // Mark matched items confirmed
  const items = localDb.getOrderDraftItems(draftId);
  items.forEach(i => {
    if (i.status !== 'rejected') {
      localDb.updateOrderDraftItem(i.id, { status: 'confirmed' });
    }
  });

  const confirmed = localDb.updateOrderDraft(draftId, {
    status: 'CONFIRMED',
    overall_confidence: Math.max(existing.overall_confidence, 0.95),
    confirmed_at: now,
    confirmed_message: confirmationText,
    internal_reference: internalReference,
    clarification_reason: null,
    pending_question: null,
  });

  const draft = localDb.getOrderDraftWithItems(draftId);
  localDb.updateWhatsAppConversation(conversation.id, { status: 'closed' });

  logEvent('customer_confirmed', `Customer confirmed order ${internalReference}.`, {
    draftId, conversationId: conversation.id, messageId, confidence: 1,
  });
  logEvent('draft_confirmed', `Order draft confirmed and recorded as ${internalReference}.`, {
    draftId, conversationId: conversation.id, messageId, confidence: 1,
  });

  return {
    classification: { classification: 'ORDER_CONFIRMATION', confidence: 1, isOrder: false, requiresHumanAttention: false, priority: 'normal', matchedKeywords: ['yes'] },
    outcome: 'confirmation',
    draft: draft ?? undefined,
    reply: buildOrderReceivedMessage(draft!),
  };
}

/**
 * Applies a customer correction to an existing draft (plan §22–§24):
 * - quantity changes ("No I need 10 not 5")
 * - product additions ("also add 3 tapes")
 * - product removals ("remove the masks")
 */
export function applyCorrection(
  activeDraft: OrderDraft,
  rawText: string,
  conversation: WhatsAppConversation,
  messageId?: string | null
): ProcessedIncomingMessage {
  const normalized = normalizeText(rawText);
  const items = localDb.getOrderDraftItems(activeDraft.id);

  // Removal intent
  const removalMatch = normalized.match(/(?:remove|delete|drop|cancel|dont need|don't need|without)\s+(.+)/);
  if (removalMatch) {
    const target = removalMatch[1];
    let removed = 0;
    items.forEach(item => {
      const name = (item.matched_product_name || item.product?.product_name || item.customer_text);
      if (tokensContained(target, name) || tokensContained(name, target)) {
        localDb.updateOrderDraftItem(item.id, { status: 'rejected' });
        removed++;
      }
    });
    logEvent('draft_updated', removed > 0 ? `Removed ${removed} item(s) from draft.` : 'Removal requested but no matching item found.', {
      draftId: activeDraft.id, conversationId: conversation.id, messageId,
    });
    const updated = localDb.updateOrderDraft(activeDraft.id, { status: 'AWAITING_CONFIRMATION', pending_question: null });
    const draft = localDb.getOrderDraftWithItems(activeDraft.id);
    return { classification: { classification: 'ORDER_CLARIFICATION', confidence: 0.9, isOrder: false, requiresHumanAttention: false, priority: 'normal', matchedKeywords: ['remove'] }, outcome: 'clarification', draft: draft ?? undefined, reply: buildConfirmationSummary(draft!) };
  }

  // Addition / quantity-update intent
  const candidates = parseOrderMessage(rawText);
  const customer = resolveDraftCustomer(conversation);
  const ctx = buildMatchContext(customer);
  const matchResult = matchOrderCandidates(candidates, ctx);

  let updatedAny = false;
  for (const m of matchResult.matched) {
    const existingItem = items.find(
      i => i.status !== 'rejected' && i.product_id === m.product.id
    );
    if (existingItem) {
      localDb.updateOrderDraftItem(existingItem.id, {
        quantity: m.quantity ?? existingItem.quantity,
        status: m.quantity == null ? 'needs_clarification' : 'matched',
      });
    } else {
      const now = new Date().toISOString();
      localDb.addOrderDraftItem({
        order_draft_id: activeDraft.id,
        product_id: m.product.id,
        customer_text: m.mention,
        matched_product_name: m.product.product_name,
        quantity: m.quantity,
        unit: m.unit,
        match_method: m.matchMethod,
        match_confidence: m.confidence,
        status: m.quantity == null ? 'needs_clarification' : 'matched',
      });
    }
    updatedAny = true;
  }

  logEvent('draft_updated', updatedAny ? 'Draft updated with customer correction.' : 'Correction received but nothing could be parsed.', {
    draftId: activeDraft.id, conversationId: conversation.id, messageId,
  });

  const needsQuantity = matchResult.matched.some(m => m.quantity == null) || matchResult.needsClarification;
  const updated = localDb.updateOrderDraft(activeDraft.id, {
    status: needsQuantity ? 'NEEDS_CLARIFICATION' : 'AWAITING_CONFIRMATION',
    clarification_reason: needsQuantity ? 'Customer correction is missing a quantity.' : null,
    pending_question: needsQuantity ? 'How many would you like?' : null,
  });

  const draft = localDb.getOrderDraftWithItems(activeDraft.id);
  return {
    classification: { classification: 'ORDER_CLARIFICATION', confidence: 0.9, isOrder: false, requiresHumanAttention: false, priority: 'normal', matchedKeywords: [] },
    outcome: 'clarification',
    draft: draft ?? undefined,
    reply: buildConfirmationSummary(draft!),
  };
}

// --- Bot controls (plan §53–§54) ---

export function pauseBot(conversationId: string): WhatsAppConversation | null {
  const updated = localDb.updateWhatsAppConversation(conversationId, { bot_status: 'paused' });
  logEvent('bot_paused', 'Bot paused by agent for conversation.', { conversationId });
  return updated;
}

export function resumeBot(conversationId: string): WhatsAppConversation | null {
  const updated = localDb.updateWhatsAppConversation(conversationId, { bot_status: 'active' });
  logEvent('bot_resumed', 'Bot resumed by agent for conversation.', { conversationId });
  return updated;
}

export function takeOverConversation(conversationId: string): WhatsAppConversation | null {
  const updated = localDb.updateWhatsAppConversation(conversationId, { bot_status: 'human_takeover' });
  logEvent('human_takeover', 'Human agent took over conversation.', { conversationId });
  return updated;
}

// --- Message builders for outbound provider (plan §7, §30) ---

export function buildOrderRequestTemplate(params: {
  customerName: string;
  route: string;
  template?: string;
}): string {
  const template = params.template || [
    'Good morning {{customer_name}}.',
    '',
    'Your delivery is scheduled for {{route}} tomorrow.',
    '',
    'Please send us your order for tomorrow\'s delivery.',
    '',
    'Thank you,',
    'J&T Supplies',
  ].join('\n');
  return template
    .replace(/\{\{customer_name\}\}/g, params.customerName)
    .replace(/\{\{route\}\}/g, params.route);
}

export const orderDraftService = {
  processIncomingMessage,
  confirmDraft,
  applyCorrection,
  pauseBot,
  resumeBot,
  takeOverConversation,
  buildConfirmationSummary,
  buildOrderReceivedMessage,
  buildRouteOrderMessage,
  buildOrderRequestTemplate,
  buildMatchContext,
};
