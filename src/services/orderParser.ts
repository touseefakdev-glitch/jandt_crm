/**
 * Order Parser for the WhatsApp Order Intelligence System.
 *
 * Extracts structured order candidates from messy customer messages.
 *
 * Input:  "send 5 blue gloves large and 2 mask box"
 * Output: [
 *   { rawText: "5 blue gloves large", mention: "blue gloves large", quantity: 5, unit: null },
 *   { rawText: "2 mask box", mention: "mask box", quantity: 2, unit: "box" }
 * ]
 *
 * Candidates are NOT confirmed orders — they are draft items awaiting matching
 * and customer confirmation (plan §12, §17, §18).
 */
import { OrderCandidate } from '../types';
import { normalizeText } from './textNormalizer';

const WORD_NUMBERS: Record<string, number> = {
  one: 1, a: 1, an: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  seven: 7, eight: 8, nine: 9, ten: 10, eleven: 11, twelve: 12,
  dozen: 12, 'a couple': 2, couple: 2, 'half dozen': 6,
};

// Normalized unit vocabulary (plan §18). Units are preserved as structured
// values; conversion rates are never assumed.
const UNITS = new Set([
  'piece', 'pieces', 'pcs', 'pc', 'pce',
  'box', 'boxes', 'bx', 'bxs',
  'pack', 'packs', 'pk', 'pkt', 'pkts',
  'carton', 'cartons', 'ctn', 'ctns',
  'case', 'cases', 'cs',
  'dozen', 'dz', 'dozens',
  'roll', 'rolls',
  'sleeve', 'sleeves',
  'bag', 'bags',
  'bottle', 'bottles',
  'bundle', 'bundles',
  'unit', 'units',
]);

// Filler words stripped from mentions (urdu/english informal speech)
const FILLER_WORDS = new Set([
  'send', 'sending', 'need', 'needed', 'want', 'wanted', 'get', 'please',
  'add', 'also', 'plus', 'and', 'then', 'aur', 'or', 'plz', 'pls',
  'wo', 'the', 'that', 'us', 'to', 'a', 'an', 'my', 'i', 'we', 'for',
  'bro', 'bhai', 'yaar', 'kindly', 'usual', 'regular', 'stuff', 'thing',
  'kal', 'aaj', 'today', 'tomorrow', 'hi', 'hey', 'hello', 'salam', 'sir',
  'sendme', 'getting', 'needneed',
]);

// Leading order-intent phrases stripped before quantity extraction
const LEADING_PHRASE_RE =
  /^(?:please\s+send(?:\s+me)?|send(?:\s+me)?|i\s+need|we\s+need|need|i\s+want|want|get\s+me|give\s+me|i\s+would\s+like|would\s+like|can\s+i\s+get|please\s+order|kindly\s+send|order|also\s+add|add)\s+/;

// Leading date/time filler words (urdu/english): "kal 10 gloves", "today 2 boxes"
const LEADING_DATE_RE =
  /^(?:kal|aaj|today|tomorrow|tommarow|tommorow|now|asap|urgent|please|plz|pls|hi|hey|hello|salam|good\s+morning|good\s+afternoon|good\s+evening|good\s+day|bhai|bro|yaar|sir|kindly|thanks|thank\s+you)\s+/;

// Phrases that reference history and are meaningless as product attributes
const HISTORY_REFERENCE_RES =
  [
    /\bmy\s+usual\b/g,
    /\bthe\s+usual\b/g,
    /\bas\s+usual\b/g,
    /\bthe\s+regular\b/g,
  ];

/** Splits a message into candidate segments on newlines and conjunctions. */
export function splitOrderSegments(message: string): string[] {
  return message
    .split(/\n|;|,| and | & | plus |also|aur\b|,? then\b/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function isUnit(word: string): boolean {
  return UNITS.has(word);
}

function wordToNumber(word: string): number | null {
  return WORD_NUMBERS[word] ?? null;
}

function cleanMention(raw: string): string {
  let text = raw;
  HISTORY_REFERENCE_RES.forEach(re => { text = text.replace(re, ' '); });
  return normalizeText(text)
    .split(' ')
    .filter((w) => w && !FILLER_WORDS.has(w))
    .join(' ');
}

function stripLeadingPhrases(normalized: string): string {
  let out = normalized;
  let prev: string | null = null;
  // Repeat so multi-word greetings/date words are all removed ("good morning send 5...")
  while (out !== prev) {
    prev = out;
    out = out.replace(LEADING_PHRASE_RE, '').replace(LEADING_DATE_RE, '');
  }
  return out;
}

/**
 * Extracts quantity / unit / mention from a single segment.
 * Never invents a quantity — quantityMissing is true when none was provided.
 */
export function extractCandidate(segment: string): OrderCandidate {
  let normalized = normalizeText(segment);
  normalized = stripLeadingPhrases(normalized);

  let quantity: number | null = null;
  let unit: string | null = null;
  let mention = '';

  // Pattern A: leading digit quantity with optional attached unit "5pcs gloves", "2 box masks"
  const matchA = normalized.match(/^(\d{1,4}(?:\.\d+)?)(?:\s*([a-z]+))?\s*(.*)$/);
  if (matchA) {
    quantity = parseFloat(matchA[1]);
    const unitCandidate = (matchA[2] || '').trim();
    let rest = (matchA[3] || '').trim();
    if (isUnit(unitCandidate)) {
      unit = unitCandidate;
      mention = rest;
    } else {
      // unitCandidate (if any) is part of the product mention
      if (unitCandidate) rest = `${unitCandidate} ${rest}`.trim();
      // Handle trailing unit: "2 mask box", "10 gloves pcs"
      const words = rest.split(' ');
      if (words.length >= 2 && isUnit(words[words.length - 1]) && !isUnit(words[0])) {
        unit = words[words.length - 1];
        mention = words.slice(0, -1).join(' ');
      } else {
        mention = rest;
      }
    }
  } else {
    // Pattern B: leading word-number "five blue gloves", "two box masks"
    const tokens = normalized.split(' ');
    const firstWord = tokens[0] || '';
    const num = wordToNumber(firstWord);
    if (num !== null) {
      quantity = num;
      const words = tokens.slice(1);
      if (words.length >= 2 && isUnit(words[0]) && !isUnit(words[words.length - 1])) {
        unit = words[0];
        mention = words.slice(1).join(' ');
      } else if (words.length >= 1 && isUnit(words[0])) {
        unit = words[0];
        mention = words.slice(1).join(' ');
      } else {
        mention = words.join(' ');
      }
    } else {
      // Pattern C: trailing quantity "<mention> 5" or "<mention> 5 pcs"
      const matchC = normalized.match(/^(.+?)\s+(\d{1,4}(?:\.\d+)?)(?:\s*([a-z]+))?$/);
      if (matchC) {
        quantity = parseFloat(matchC[2]);
        const trailingUnit = (matchC[3] || '').trim();
        if (trailingUnit && isUnit(trailingUnit)) {
          unit = trailingUnit;
        }
        mention = matchC[1];
      } else {
        // Pattern D: bare mention, no quantity
        mention = normalized;
      }
    }
  }

  // Strip filler words from the mention
  const cleaned = cleanMention(mention);

  return {
    rawText: segment,
    mention: cleaned,
    quantity: quantity === null ? null : quantity,
    unit,
    quantityMissing: quantity === null,
  };
}

/** Extracts all order candidates from a full message. */
export function parseOrderMessage(message: string): OrderCandidate[] {
  return splitOrderSegments(message).map(extractCandidate);
}
