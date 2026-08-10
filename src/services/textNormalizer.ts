/**
 * Text Normalization Utilities for the WhatsApp Order Intelligence System.
 *
 * Normalizes messy real-world customer communication (misspellings, casing,
 * whitespace, punctuation, informal language) into a stable token form used by
 * the classifier, parser and product matching engine.
 */

const ACCENT_MAP: Record<string, string> = {
  é: 'e', è: 'e', ê: 'e', ë: 'e', á: 'a', à: 'a', â: 'a', ä: 'a', í: 'i',
  ì: 'i', î: 'i', ï: 'i', ó: 'o', ò: 'o', ô: 'o', ö: 'o', ú: 'u', ù: 'u',
  û: 'u', ü: 'u', ç: 'c', ñ: 'n',
};

/** Strips accents, lowercases, removes punctuation and collapses whitespace. */
export function normalizeText(raw: string): string {
  return (raw || '')
    .toLowerCase()
    .split('')
    .map((ch) => ACCENT_MAP[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9\s]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Splits normalized text into unique tokens. */
export function tokenize(raw: string): string[] {
  return normalizeText(raw)
    .split(' ')
    .filter(Boolean);
}

/** Normalizes a WhatsApp number to a stable comparable form. */
export function normalizePhoneNumber(raw: string): string {
  let clean = (raw || '').replace(/[^0-9]/g, '');
  if (clean.startsWith('1') && clean.length === 11) {
    clean = clean.slice(1);
  }
  return clean;
}

/** Simple 1-gram Levenshtein distance used for fuzzy mention matching. */
export function levenshteinDistance(a: string, b: string): number {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  const matrix: number[][] = [];
  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      const cost = a[j - 1] === b[i - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }
  return matrix[b.length][a.length];
}

/** Similarity ratio (0..1) between two strings. 1 = identical. */
export function similarityRatio(a: string, b: string): number {
  const na = normalizeText(a);
  const nb = normalizeText(b);
  if (!na.length && !nb.length) return 1;
  const dist = levenshteinDistance(na, nb);
  const maxLen = Math.max(na.length, nb.length);
  return maxLen === 0 ? 1 : 1 - dist / maxLen;
}

/**
 * Token overlap ratio (0..1): how many tokens of `needle` appear in `haystack`.
 * Used to decide whether a customer mention matches a product name.
 */
export function tokenOverlapRatio(needle: string, haystack: string): number {
  const needleTokens = tokenize(needle);
  const hayTokens = new Set(tokenize(haystack));
  if (!needleTokens.length) return 0;
  const hit = needleTokens.filter((t) => hayTokens.has(t)).length;
  return hit / needleTokens.length;
}

/** True when every token of `needle` is present in `haystack`. */
export function tokensContained(needle: string, haystack: string): boolean {
  const needleTokens = tokenize(needle);
  const hayTokens = new Set(tokenize(haystack));
  return needleTokens.length > 0 && needleTokens.every((t) => hayTokens.has(t));
}
