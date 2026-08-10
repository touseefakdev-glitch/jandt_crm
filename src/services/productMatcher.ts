/**
 * Product Matching Engine for the WhatsApp Order Intelligence System.
 *
 * Matches extracted customer mentions against the Product Catalog using a
 * deterministic priority chain (plan §13, §41):
 *
 *   SKU → Exact Name → Customer-Specific Alias → Global Alias →
 *   Customer Historical Product → Normalized Name Token Match → Semantic (future)
 *
 * RULES:
 * - Never blindly pick a product when confidence is low (plan §14).
 * - Customer history is context only and never overrides an explicit current
 *   mention (plan §16).
 * - Every match carries a method and a confidence score (plan §40).
 */
import {
  Customer,
  CustomerProductHistory,
  MatchedProductCandidate,
  OrderCandidate,
  Product,
  ProductAlias,
  CustomerProductAlias,
  ProductMatchResult,
  MatchMethod,
} from '../types';
import {
  normalizeText,
  tokenOverlapRatio,
  tokensContained,
  similarityRatio,
} from './textNormalizer';

export const MIN_MATCH_CONFIDENCE = 0.6;
const AMBIGUITY_DELTA = 0.15;

export interface ProductMatchContext {
  products: Product[];
  history?: CustomerProductHistory[];
  productAliases?: ProductAlias[];
  customerAliases?: CustomerProductAlias[];
}

interface ScoredMatch {
  product: Product;
  method: MatchMethod;
  confidence: number;
}

/** SKU comparison ignores dashes/spaces/case so ABC-123 == abc123. */
function skuEquals(mention: string, sku: string): boolean {
  const norm = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return norm(mention) === norm(sku) && norm(mention).length > 0;
}

/** Collects every plausible product match for a single mention. */
function scoreMention(
  mention: string,
  ctx: ProductMatchContext,
  activeAliases?: ProductAlias[]
): ScoredMatch[] {
  const results: ScoredMatch[] = [];
  const normMention = normalizeText(mention);
  if (!normMention) return results;

  const catalog = ctx.products.filter((p) => p.is_active !== false);

  // Levels only run while there are no strong (>= MIN) matches yet.
  const hasStrongMatch = () => results.some((r) => r.confidence >= MIN_MATCH_CONFIDENCE);

  // ---- Level 1: SKU ----
  for (const p of catalog) {
    if (skuEquals(normMention, p.sku)) {
      results.push({ product: p, method: 'sku', confidence: 1.0 });
    }
  }

  // ---- Level 2: Exact product name ----
  if (!hasStrongMatch()) {
    for (const p of catalog) {
      if (normalizeText(p.product_name) === normMention) {
        results.push({ product: p, method: 'exact_name', confidence: 0.97 });
      }
    }
  }

  // ---- Level 3: Customer-specific alias ----
  if (!hasStrongMatch() && ctx.customerAliases && ctx.customerAliases.length > 0) {
    for (const ca of ctx.customerAliases) {
      if (!ca.is_active) continue;
      if (normalizeText(ca.alias) === normMention || tokensContained(normMention, ca.normalized_alias)) {
        const p = catalog.find((prod) => prod.id === ca.product_id);
        if (p) results.push({ product: p, method: 'customer_alias', confidence: 0.95 });
      }
    }
  }

  // ---- Level 4: Global alias ----
  if (!hasStrongMatch() && activeAliases && activeAliases.length > 0) {
    for (const a of activeAliases) {
      if (normalizeText(a.alias) === normMention || tokensContained(normMention, a.normalized_alias)) {
        const p = catalog.find((prod) => prod.id === a.product_id);
        if (p) results.push({ product: p, method: 'alias', confidence: 0.9 });
      }
    }
  }

  // ---- Level 5: Customer historical products ----
  // History is context only (plan §16). A partial token overlap without every
  // explicit mention token present is de-weighted so explicit mentions like
  // "blue gloves" don't match black-glove history entries.
  if (!hasStrongMatch() && ctx.history && ctx.history.length > 0) {
    for (const h of ctx.history) {
      const p = h.product_id ? catalog.find((prod) => prod.id === h.product_id) : null;
      const histName = h.source_item_name || (p ? p.product_name : '');
      const containment = tokensContained(normMention, histName);
      const overlap = tokenOverlapRatio(normMention, histName);
      let confidence = 0;
      if (containment) {
        confidence = Math.max(0.8, 0.5 + overlap * 0.4);
      } else if (overlap >= 0.6) {
        confidence = overlap * 0.7; // partial overlap, explicit tokens missing
      }
      if (confidence >= MIN_MATCH_CONFIDENCE && p) {
        results.push({ product: p, method: 'customer_history', confidence });
      } else if (confidence >= MIN_MATCH_CONFIDENCE && histName && !p) {
        const fuzzy = catalog.find((prod) => tokenOverlapRatio(normMention, prod.product_name) >= 0.6);
        if (fuzzy) {
          results.push({ product: fuzzy, method: 'customer_history', confidence });
        }
      }
    }
  }

  // ---- Level 6: Normalized name / containment matching across catalog ----
  if (!hasStrongMatch()) {
    const plentyMatches: ScoredMatch[] = [];
    const fuzzyMatches: ScoredMatch[] = [];
    for (const p of catalog) {
      const containment = tokensContained(normMention, p.product_name);
      const overlap = tokenOverlapRatio(normMention, p.product_name);
      const ratio = similarityRatio(normMention, p.product_name);
      if (containment) {
        plentyMatches.push({ product: p, method: 'normalized_name', confidence: 0.9 });
      } else if (overlap >= MIN_MATCH_CONFIDENCE) {
        plentyMatches.push({ product: p, method: 'normalized_name', confidence: overlap });
      } else if (ratio >= 0.75) {
        fuzzyMatches.push({ product: p, method: 'normalized_name', confidence: ratio });
      }
    }
    results.push(...[...plentyMatches, ...fuzzyMatches]);
  }

  // Deduplicate by product, keeping the strongest match
  const bestByProduct = new Map<string, ScoredMatch>();
  for (const r of results) {
    const existing = bestByProduct.get(r.product.id);
    if (!existing || r.confidence > existing.confidence) {
      bestByProduct.set(r.product.id, r);
    }
  }

  return [...bestByProduct.values()].sort((a, b) => b.confidence - a.confidence);
}

/**
 * Matches a single mention to the catalog. Returns the primary match plus any
 * ambiguous candidates.
 */
export function matchMention(
  mention: string,
  ctx: ProductMatchContext
): { matched: MatchedProductCandidate[]; ambiguous: MatchedProductCandidate[]; unmatched: boolean } {
  const activeAliases = (ctx.productAliases || []).filter((a) => a.is_active);
  const scored = scoreMention(mention, ctx, activeAliases);

  if (scored.length === 0) {
    return { matched: [], ambiguous: [], unmatched: true };
  }

  const best = scored[0];
  const shortMention = normalizeText(mention).split(' ').length <= 2;

  const toCandidate = (s: ScoredMatch, ambiguousFlag: boolean): MatchedProductCandidate => ({
    product: s.product,
    mention,
    quantity: null,
    unit: null,
    matchMethod: s.method,
    confidence: s.confidence,
    ambiguous: ambiguousFlag,
  });

  // Exact identity matches (SKU / exact name) are never ambiguous.
  if (best.method === 'sku' || best.method === 'exact_name') {
    return { matched: [toCandidate(best, false)], ambiguous: [], unmatched: false };
  }

  // Ambiguity: (plan §14) multiple distinct products with close confidence, or a
  // short mention that could refer to several products.
  const contenders = scored.filter((s) => s.confidence >= MIN_MATCH_CONFIDENCE);
  if (contenders.length > 1) {
    const isAmbiguous =
      (best.confidence < 0.95 && shortMention) ||
      (best.confidence - scored[1].confidence <= AMBIGUITY_DELTA);

    if (isAmbiguous) {
      const ambiguous = contenders.map((s) => toCandidate(s, true));
      return { matched: [], ambiguous, unmatched: false };
    }
  }

  return { matched: [toCandidate(best, false)], ambiguous: [], unmatched: false };
}

/** Builds the clarification question listing ambiguous products. */
export function buildClarificationQuestion(ambiguous: MatchedProductCandidate[]): string {
  const lines = ambiguous.map((c, i) => `${i + 1}. ${c.product.product_name}`);
  return `Which product do you mean?\n\n${lines.join('\n')}`;
}

/**
 * Full matching pipeline for a parsed order message.
 * Returns confirmed matches, ambiguous candidates, and unmatched mentions.
 */
export function matchOrderCandidates(
  candidates: OrderCandidate[],
  ctx: ProductMatchContext
): ProductMatchResult {
  const matched: MatchedProductCandidate[] = [];
  const ambiguous: MatchedProductCandidate[] = [];
  const unmatched: OrderCandidate[] = [];

  for (const cand of candidates) {
    const result = matchMention(cand.mention, ctx);

    if (result.unmatched) {
      unmatched.push(cand);
      continue;
    }

    if (result.ambiguous.length > 0) {
      result.ambiguous.forEach((a) => {
        a.quantity = cand.quantity;
        a.unit = cand.unit;
      });
      ambiguous.push(...result.ambiguous);
      continue;
    }

    result.matched.forEach((m) => {
      m.quantity = cand.quantity;
      m.unit = cand.unit;
      matched.push(m);
    });
  }

  const needsClarification = ambiguous.length > 0 || unmatched.length > 0 || matched.some((m) => m.quantity === null);

  let clarificationQuestion: string | undefined;
  if (ambiguous.length > 0) {
    clarificationQuestion = buildClarificationQuestion(ambiguous);
  } else if (unmatched.length > 0) {
    const mentions = unmatched.map((u) => `"${u.mention}"`).join(', ');
    clarificationQuestion = `I could not confidently identify ${mentions}. Could you confirm the exact product name or SKU?`;
  } else if (matched.some((m) => m.quantity === null)) {
    clarificationQuestion = 'How many would you like? Please include a quantity for each item.';
  }

  return {
    matched,
    ambiguous,
    unmatched,
    needsClarification,
    clarificationQuestion,
  };
}
