/**
 * Phase 8 — Resilient Order Processing (AI Failure Fallback & Error Recovery)
 *
 * Guarantee: the WhatsApp ordering system must NOT depend on any AI service
 * being online. The order intake pipeline is intentionally deterministic:
 *
 *     Message → Classifier → Parser → Product Matcher → Draft → Confirmation
 *
 * These wrappers add a final safety net on top of the deterministic pipeline:
 *   1. Every stage failure is caught (never thrown to the caller).
 *   2. Failures are persisted as ProcessingErrorRecords for retry / manual review.
 *   3. The customer's order is NEVER dropped — on failure it escalates to a
 *      human attention alert so an agent can see it in the queue.
 */

import { localDb } from './db';
import { classifyMessage, detectCancellationIntent, detectConfirmationIntent } from './messageClassifier';
import { parseOrderMessage } from './orderParser';
import { matchOrderCandidates, ProductMatchContext } from './productMatcher';
import { processIncomingMessage, ProcessedIncomingMessage } from './orderDraftService';
import { raiseAttentionAlert } from './attentionAlertService';
import { WhatsAppConversation } from '../types';

/** Safe classification: never throws; UNKNOWN + human review on failure. */
export function safeClassify(rawText: string) {
  try {
    return classifyMessage(rawText);
  } catch (err) {
    console.error('[Resilient] classifyMessage failed, using UNKNOWN fallback:', err);
    return {
      classification: 'UNKNOWN' as const,
      confidence: 0.2,
      isOrder: false,
      requiresHumanAttention: true,
      priority: 'normal' as const,
      matchedKeywords: [] as string[],
    };
  }
}

/** Safe parsing: never throws; the whole text becomes one candidate. */
export function safeParse(rawText: string) {
  try {
    return parseOrderMessage(rawText);
  } catch (err) {
    console.error('[Resilient] parseOrderMessage failed, using raw-text fallback:', err);
    return [{
      rawText,
      mention: rawText,
      quantity: null,
      unit: null,
      quantityMissing: true,
    }];
  }
}

/** Safe matching: never throws; returns an empty (unmatched) result. */
export function safeMatch(candidates: ReturnType<typeof parseOrderMessage>, ctx: ProductMatchContext) {
  try {
    return matchOrderCandidates(candidates, ctx);
  } catch (err) {
    console.error('[Resilient] matchOrderCandidates failed, using empty-match fallback:', err);
    return {
      matched: [],
      ambiguous: [],
      unmatched: candidates,
      needsClarification: true,
      clarificationQuestion: 'I could not process this order automatically. One of our team members will review it.',
    };
  }
}

/**
 * Processes an inbound message through the full pipeline without ever throwing.
 * On pipeline failure it records a ProcessingErrorRecord and escalates to human
 * review so the customer order can never silently disappear.
 */
export function processMessageSafely(
  conversation: WhatsAppConversation,
  rawText: string,
  opts: { messageId?: string; externalMessageId?: string } = {}
): ProcessedIncomingMessage {
  try {
    return processIncomingMessage(conversation, rawText, { messageId: opts.messageId });
  } catch (err: any) {
    const error = err instanceof Error ? err : new Error(String(err));
    console.error('[Resilient] Pipeline failed for message, escalating to human:', error);

    const errorRecord = localDb.recordOrderProcessingError({
      conversation_id: conversation.id,
      customer_id: conversation.customer_id || null,
      message_id: opts.messageId || null,
      external_message_id: opts.externalMessageId || null,
      stage: 'dispatch',
      error_code: 'pipeline_error',
      error_message: error.message,
      raw_message_text: rawText,
    });

    localDb.logOrderIntakeEvent({
      conversation_id: conversation.id,
      message_id: opts.messageId || null,
      event_type: 'processing_error',
      description: `Order pipeline failed (${error.message}). Error #${errorRecord.id}.`,
      payload: { error_code: errorRecord.error_code, error_id: errorRecord.id },
    });

    const alert = raiseAttentionAlert({
      customerId: conversation.customer_id,
      conversationId: conversation.id,
      messageId: opts.messageId || null,
      classification: 'UNKNOWN',
      messageText: rawText,
      priority: 'high',
    });

    return {
      classification: safeClassify(rawText),
      outcome: 'human_review',
      alert,
      reply: 'I ran into a technical issue processing your order. A team member will review it right away.',
    };
  }
}

export const resilientProcessing = {
  safeClassify,
  safeParse,
  safeMatch,
  processMessageSafely,
  detectCancellationIntent,
  detectConfirmationIntent,
};
