/**
 * Message Classifier for the WhatsApp Order Intelligence System.
 *
 * Classifies an incoming customer message into the plan's taxonomy:
 *   ORDER, ORDER_CLARIFICATION, ORDER_CONFIRMATION, NON_ORDER,
 *   QUESTION, COMPLAINT, GREETING, UNKNOWN
 *
 * The classifier must NOT treat greetings, questions, complaints or thank-you
 * messages as orders. It also detects mixed messages (e.g. an order plus a
 * question) so the pipeline can handle both parts.
 */
import {
  MessageClassification,
  AttentionPriority,
  MessageClassificationResult,
} from '../types';
import { normalizeText, tokenize } from './textNormalizer';

const GREETING_KEYWORDS = [
  'hi', 'hello', 'hey', 'salam', 'assalamualaikum', 'salamalikum',
  'good morning', 'good afternoon', 'good evening', 'good morning sir',
  'morning', 'gm',
];

const CONFIRMATION_KEYWORDS = [
  'yes', 'correct', 'confirm', 'confirmed', 'ok', 'okay', 'thats right',
  "that's right", 'that is right', 'right', 'yep', 'yeah', 'yup', 'fine',
  'sure', 'perfect', 'looks good', 'all good',
];

const CANCELLATION_KEYWORDS = [
  'cancel', 'cancel my order', 'dont send', "don't send", 'forget the order',
  'forget it', 'dont deliver', "don't deliver", 'skip my order',
];

const QUESTION_KEYWORDS = [
  'what time', 'when', 'where', 'why', 'how much', 'how many', 'who',
  'can you', 'could you', 'do you', 'is it', 'are you', 'will you',
  'delivery tomorrow', 'what time is delivery', 'what time will', 'call me',
  'please call', 'invoice', 'paid', 'payment', 'price', 'cost', 'available',
  'tracking', 'driver', 'coming', 'question', '??',
];

const COMPLAINT_KEYWORDS = [
  'wrong', 'missing', 'damaged', 'broken', 'refund', 'late', 'not received',
  'never received', 'complaint', 'issue', 'problem', 'mistake', 'shortage',
  'defective', 'bad', 'angry', 'disappointed',
];

const ORDER_INTENT_KEYWORDS = [
  'send', 'order', 'need', 'want', 'get me', 'please send', 'send me',
  'i need', 'we need', 'my usual', 'regular', 'the usual', 'as usual',
  'add', 'also', 'plus', 'would like', 'can i get', 'give me', 'put me down',
];

const URGENCY_KEYWORDS = ['urgent', 'asap', 'as soon as possible', 'emergency', 'immediately', 'right away'];

/** True when the text looks like a product quantity line, e.g. "10 blue gloves". */
function looksLikeOrderLine(text: string): boolean {
  const normalized = normalizeText(text);
  // Pattern 1: "<quantity> <unit?> <product...>"
  if (/(^|\s)\d{1,3}\s+[a-z]+/.test(normalized)) return true;
  // Pattern 2: "<product...> <quantity>"
  if (/\s\d{1,3}$/.test(normalized)) return true;
  // Pattern 3: pure multi-item list without numbers ("gloves, masks, tape")
  const commaItems = normalized.split(',').filter(Boolean);
  if (commaItems.length >= 2) return true;
  return false;
}

function hasKeyword(text: string, keywords: string[]): boolean {
  return keywords.some((kw) => text.includes(kw));
}

export function classifyMessage(rawText: string): MessageClassificationResult {
  const text = normalizeText(rawText);
  const tokens = tokenize(rawText);
  const matchedKeywords: string[] = [];

  const countKeywordMatches = (keywords: string[]) => {
    let count = 0;
    keywords.forEach((kw) => {
      if (text.includes(kw)) {
        count++;
        matchedKeywords.push(kw);
      }
    });
    return count;
  };

  if (!text || tokens.length === 0) {
    return {
      classification: 'UNKNOWN',
      confidence: 0.2,
      isOrder: false,
      requiresHumanAttention: true,
      priority: 'normal',
      matchedKeywords: [],
    };
  }

  const greetingHits = countKeywordMatches(GREETING_KEYWORDS);
  const confirmationHits = countKeywordMatches(CONFIRMATION_KEYWORDS);
  const cancellationHits = countKeywordMatches(CANCELLATION_KEYWORDS);
  const questionHits = countKeywordMatches(QUESTION_KEYWORDS);
  const complaintHits = countKeywordMatches(COMPLAINT_KEYWORDS);
  const orderIntentHits = countKeywordMatches(ORDER_INTENT_KEYWORDS);
  const urgencyHits = countKeywordMatches(URGENCY_KEYWORDS);

  const hasOrderLine = looksLikeOrderLine(text);
  const urgency = urgencyHits > 0;

  // Pure confirmation (a reply to a summary): "yes", "ok", "that's correct"
  const isPureConfirmation =
    confirmationHits > 0 && tokens.length <= 5 && questionHits === 0 && !hasOrderLine;

  // Cancellation intent
  const isCancellation = cancellationHits > 0;

  // Order intent: explicit order verbs + product-like content, or a quantity line,
  // or a multi-item list.
  const isOrder =
    !isPureConfirmation &&
    !isCancellation &&
    ((orderIntentHits > 0 && (hasOrderLine || tokens.length >= 2)) || hasOrderLine);

  const isPureGreeting = greetingHits > 0 && tokens.length <= 4 && !isOrder && !questionHits;

  let classification: MessageClassification;
  let requiresHumanAttention = false;
  let priority: AttentionPriority = 'normal';

  if (isCancellation) {
    classification = 'ORDER_CLARIFICATION';
    requiresHumanAttention = true;
  } else if (isPureConfirmation) {
    classification = 'ORDER_CONFIRMATION';
    requiresHumanAttention = false;
  } else if (complaintHits > 0 && !hasOrderLine) {
    classification = 'COMPLAINT';
    requiresHumanAttention = true;
  } else if (isOrder) {
    classification = 'ORDER';
    requiresHumanAttention = false;
  } else if (isPureGreeting) {
    classification = 'GREETING';
    requiresHumanAttention = false;
  } else if (complaintHits > 0) {
    classification = 'COMPLAINT';
    requiresHumanAttention = true;
  } else if (questionHits > 0) {
    classification = 'QUESTION';
    requiresHumanAttention = true;
  } else if (confirmationHits > 0) {
    // Partial confirmation like "yes 10 gloves" — treat as order clarification
    classification = 'ORDER_CLARIFICATION';
    requiresHumanAttention = false;
  } else if (urgency) {
    classification = 'UNKNOWN';
    requiresHumanAttention = true;
  } else {
    classification = 'NON_ORDER';
    requiresHumanAttention = false;
  }

  // Priority assignment (plan §37): urgency overrides; complaints/questions/cancellation are high.
  if (urgency) {
    priority = 'urgent';
  } else if (classification === 'COMPLAINT' || classification === 'QUESTION' || classification === 'UNKNOWN' || isCancellation) {
    priority = 'high';
  }

  // Mixed message handling (order + question in one message, plan §47)
  let secondary: MessageClassification | null = null;
  if (classification === 'ORDER' && questionHits > 0) {
    secondary = 'QUESTION';
    requiresHumanAttention = true;
  } else if (classification === 'ORDER' && complaintHits > 0) {
    secondary = 'COMPLAINT';
    requiresHumanAttention = true;
  }

  // Human attention rules (plan §34): non-order/ambiguous messages that need an agent
  if (
    classification === 'QUESTION' ||
    classification === 'COMPLAINT' ||
    classification === 'UNKNOWN' ||
    (classification === 'ORDER_CLARIFICATION' && isCancellation)
  ) {
    requiresHumanAttention = true;
  }

  // Confidence heuristic based on signal strength
  const signals = [greetingHits, confirmationHits, questionHits, complaintHits, orderIntentHits].filter((h) => h > 0).length;
  const confidence =
    classification === 'ORDER' ? Math.min(0.95, 0.55 + signals * 0.15)
    : classification === 'QUESTION' || classification === 'COMPLAINT' ? 0.85
    : classification === 'GREETING' ? 0.9
    : classification === 'ORDER_CONFIRMATION' ? 0.9
    : 0.6;

  return {
    classification,
    confidence,
    secondary,
    isOrder,
    requiresHumanAttention,
    priority,
    matchedKeywords: [...new Set(matchedKeywords)],
  };
}

/** Detects cancellation intent text (plan §49) for draft handling. */
export function detectCancellationIntent(rawText: string): boolean {
  const text = normalizeText(rawText);
  return hasKeyword(text, CANCELLATION_KEYWORDS);
}

/** Detects whether a message appears to be an explicit confirmation reply. */
export function detectConfirmationIntent(rawText: string): boolean {
  const text = normalizeText(rawText);
  return hasKeyword(text, CONFIRMATION_KEYWORDS);
}
