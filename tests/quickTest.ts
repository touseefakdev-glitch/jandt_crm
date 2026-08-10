import { classifyMessage } from '../../CRM/src/services/messageClassifier';
import { parseOrderMessage } from '../../CRM/src/services/orderParser';
import { matchOrderCandidates } from '../../CRM/src/services/productMatcher';
import type { Product } from '../../CRM/src/types';

const products: Product[] = [
  { id: 'p-gloves-blue', sku: 'BLU-GLOV-LRG', product_name: 'Nitrile Examination Gloves Large Blue', description: null, category_id: null, brand_id: null, unit_price: 0, availability_status: 'available', availability_notes: null, expected_available_date: null, is_active: true, created_by: null, created_at: '', updated_by: null, updated_at: '' },
  { id: 'p-gloves-black', sku: 'BLK-GLOV-MED', product_name: 'Nitrile Examination Gloves Medium Black', description: null, category_id: null, brand_id: null, unit_price: 0, availability_status: 'available', availability_notes: null, expected_available_date: null, is_active: true, created_by: null, created_at: '', updated_by: null, updated_at: '' },
  { id: 'p-masks', sku: 'SURG-MASK-BOX', product_name: 'Surgical Masks Box of 50', description: null, category_id: null, brand_id: null, unit_price: 0, availability_status: 'available', availability_notes: null, expected_available_date: null, is_active: true, created_by: null, created_at: '', updated_by: null, updated_at: '' },
  { id: 'p-tape-packing', sku: 'TAPE-PACK', product_name: 'Packing Tape Clear 2 inch', description: null, category_id: null, brand_id: null, unit_price: 0, availability_status: 'available', availability_notes: null, expected_available_date: null, is_active: true, created_by: null, created_at: '', updated_by: null, updated_at: '' },
  { id: 'p-tape-medical', sku: 'TAPE-MED', product_name: 'Medical Tape White', description: null, category_id: null, brand_id: null, unit_price: 0, availability_status: 'available', availability_notes: null, expected_available_date: null, is_active: true, created_by: null, created_at: '', updated_by: null, updated_at: '' },
  { id: 'p-blue-tape', sku: 'BLU-TAPE', product_name: 'Blue Tape', description: null, category_id: null, brand_id: null, unit_price: 0, availability_status: 'available', availability_notes: null, expected_available_date: null, is_active: true, created_by: null, created_at: '', updated_by: null, updated_at: '' },
];

const ctx = { products, history: [], productAliases: [], customerAliases: [] };

function check(name: string, actual: unknown, expect: unknown) {
  const ok = JSON.stringify(actual) === JSON.stringify(expect);
  console.log(`${ok ? 'PASS' : 'FAIL'} — ${name}`);
  if (!ok) console.log('  actual:', JSON.stringify(actual), '\n  expect:', JSON.stringify(expect));
}

// --- Classifier tests ---
check('greeting', classifyMessage('hi').classification, 'GREETING');
check('question', classifyMessage('what time are you delivering tomorrow?').classification, 'QUESTION');
check('order', classifyMessage('send 5 blue gloves and 2 masks').classification, 'ORDER');
check('confirm', classifyMessage('yes that is correct').classification, 'ORDER_CONFIRMATION');
check('thank you', classifyMessage('thanks').classification, 'NON_ORDER');
check('complaint', classifyMessage('my order is missing').classification, 'COMPLAINT');
check('mixed order+question', classifyMessage('Good morning. Send 5 gloves. Also can you tell me if my last invoice was paid?').isOrder, true);
check('mixed secondary', classifyMessage('send 5 gloves also did invoice get paid?').secondary, 'QUESTION');
check('unknown/urgent', classifyMessage('URGENT I need this today').priority, 'urgent');

// --- Parser tests ---
const cands = parseOrderMessage('send 5 blue gloves large and 2 mask box');
check('parser segments count', cands.length, 2);
check('parser qty1', cands[0].quantity, 5);
check('parser mention1', cands[0].mention, 'blue gloves large');
check('parser qty2', cands[1].quantity, 2);
check('parser unit2', cands[1].unit, 'box');
check('parser mention2', cands[1].mention, 'mask');
check('parser no qty', parseOrderMessage('send gloves')[0].quantityMissing, true);
check('parser leading numbers', parseOrderMessage('kal 10 blue gloves')[0].quantity, 10);

// --- Matcher tests ---
const r1 = matchOrderCandidates([{ rawText: '5 blue gloves', mention: 'blue gloves', quantity: 5, unit: null, quantityMissing: false }], ctx);
check('matcher blue gloves -> p-gloves-blue', r1.matched[0]?.product.id, 'p-gloves-blue');
check('matcher confidence >= 0.8', r1.matched[0]?.confidence >= 0.8, true);

const r2 = matchOrderCandidates([{ rawText: '1 packing tape', mention: 'packing tape', quantity: 1, unit: null, quantityMissing: false }], ctx);
check('matcher packing tape', r2.matched[0]?.product.id, 'p-tape-packing');

// Ambiguity: "blue" alone matches multiple blue products
const r3 = matchOrderCandidates([{ rawText: '5 blue', mention: 'blue', quantity: 5, unit: null, quantityMissing: false }], ctx);
check('matcher blue is ambiguous', r3.ambiguous.length > 0, true);
check('matcher needs clarification on ambiguity', r3.needsClarification, true);

// SKU match
const r4 = matchOrderCandidates([{ rawText: 'BLU-GLOV-LRG', mention: 'BLU-GLOV-LRG', quantity: 3, unit: null, quantityMissing: false }], ctx);
check('matcher SKU', r4.matched[0]?.product.id, 'p-gloves-blue');
check('matcher SKU confidence 1.0', r4.matched[0]?.confidence, 1.0);

// "gloves" alone with no history → ambiguous across glove products
const r5 = matchOrderCandidates([{ rawText: '2 gloves', mention: 'gloves', quantity: 2, unit: null, quantityMissing: false }], ctx);
check('matcher bare gloves ambiguous', r5.needsClarification, true);

// Missing quantity triggers clarification
const r5b = matchOrderCandidates([{ rawText: 'gloves', mention: 'gloves', quantity: null, unit: null, quantityMissing: true }], ctx);
check('matcher missing quantity flagged', r5b.needsClarification, true);

// History context: customer usually buys the blue gloves. The parser strips
// "usual" so the mention becomes just "gloves".
const r6a = parseOrderMessage('send my usual gloves');
check('parser strips usual -> gloves', r6a[0]?.mention, 'gloves');
const historyCtx = {
  products,
  history: [{ id: 'h1', customer_id: 'c1', product_id: 'p-gloves-blue', source_item_code: 'X', source_item_name: 'Blue Gloves', packaging_unit: 'Box', customer_price: 10, inner_unit: null, inner_qty: null, unit_price: null, created_at: '', updated_at: '' }],
  productAliases: [],
  customerAliases: [],
};
const r7 = matchOrderCandidates([{ rawText: 'gloves', mention: 'gloves', quantity: 2, unit: null, quantityMissing: false }], historyCtx);
check('history disambiguates usual gloves', r7.matched[0]?.product.id, 'p-gloves-blue');
check('history matched via customer_history method', r7.matched[0]?.matchMethod, 'customer_history');

// Explicit mention must NOT match a conflicting-history product ("blue gloves large"
// must not match a black gloves history entry).
const conflictingHistoryCtx = {
  products,
  history: [
    { id: 'h1', customer_id: 'c1', product_id: 'p-gloves-blue', source_item_code: 'X', source_item_name: 'Blue Gloves', packaging_unit: 'Box', customer_price: 10, inner_unit: null, inner_qty: null, unit_price: null, created_at: '', updated_at: '' },
    { id: 'h2', customer_id: 'c1', product_id: 'p-gloves-black', source_item_code: 'Y', source_item_name: 'Nitrile Gloves 5 Mil Black Large', packaging_unit: 'Box', customer_price: 10, inner_unit: null, inner_qty: null, unit_price: null, created_at: '', updated_at: '' },
  ],
  productAliases: [],
  customerAliases: [],
};
const r8 = matchOrderCandidates([{ rawText: 'blue gloves large', mention: 'blue gloves large', quantity: 5, unit: null, quantityMissing: false }], conflictingHistoryCtx);
check('explicit blue excludes black history', r8.matched[0]?.product.id, 'p-gloves-blue');
check('black history not in candidates', !r8.ambiguous.some(a => a.product.id === 'p-gloves-black'), true);
