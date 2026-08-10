// End-to-end integration test for the WhatsApp Order Intelligence Phase A pipeline.
// Uses a localStorage shim so the db.ts localStorage-backed store runs under Node.

const store = new Map<string, string>();
(globalThis as any).localStorage = {
  getItem: (k: string) => (store.has(k) ? store.get(k)! : null),
  setItem: (k: string, v: string) => { store.set(k, v); },
  removeItem: (k: string) => { store.delete(k); },
  clear: () => { store.clear(); },
};
(globalThis as any).window = {
  dispatchEvent: () => true,
  clearTimeout: clearTimeout,
  setTimeout: setTimeout,
};

async function main() {
  const { localDb } = await import('../../CRM/src/services/db');
  const { processIncomingMessage, orderDraftService } = await import('../../CRM/src/services/orderDraftService');

  const customers = localDb.getCustomers();
  const products = localDb.getProducts();
  console.log(`Catalog ready: ${customers.length} customers, ${products.length} products`);

  const customer = customers[0];
  const contact = localDb.getOrCreateWhatsAppContact(customer.whatsapp_number || '9999999999', customer.company_name);
  const conversation = localDb.getOrCreateWhatsAppConversation(contact.id, customer.id);
  console.log(`Conversation for ${customer.company_name} (${customer.whatsapp_number})`);

  const results: string[] = [];
  let pass = 0, fail = 0;
  const check = (name: string, cond: boolean, extra?: string) => {
    results.push(`${cond ? 'PASS' : 'FAIL'} — ${name}${extra ? ' :: ' + extra : ''}`);
    cond ? pass++ : fail++;
  };

  // --- Flow 1: messy order message ---
  const msg1 = localDb.addWhatsAppMessage({
    conversation_id: conversation.id,
    direction: 'inbound',
    message_type: 'text',
    message_text: 'Hi bhai kal 5 blue gloves large',
    sender: customer.whatsapp_number || undefined,
    sent_at: new Date().toISOString(),
  });
  const r1 = processIncomingMessage(conversation, msg1.message_text, { messageId: msg1.id });
  check('flow1: classified as ORDER', r1.classification.isOrder === true, r1.classification.classification);
  check('flow1: draft created', !!r1.draft, r1.draft?.id);
  const items1 = r1.draft?.items || [];
  check('flow1: candidate(s) matched or flagged', items1.length > 0, items1.map(i => `${i.matched_product_name}:${i.quantity}`).join(' | '));
  check('flow1: quantity extracted', items1.some(i => i.quantity === 5), items1.map(i => i.quantity).join('|'));
  check('flow1: clarification or awaiting confirmation', r1.draft?.status === 'AWAITING_CONFIRMATION' || r1.draft?.status === 'NEEDS_CLARIFICATION', r1.draft?.status);

  // --- Flow 2: ambiguous "send blue" with NO history (unknown customer) ---
  const unknownContact = localDb.getOrCreateWhatsAppContact('6666666666', 'Unknown Number');
  const unknownConv = localDb.getOrCreateWhatsAppConversation(unknownContact.id, null);
  const msg2 = localDb.addWhatsAppMessage({
    conversation_id: unknownConv.id, direction: 'inbound', message_type: 'text',
    message_text: 'send 5 blue', sender: '6666666666',
    sent_at: new Date().toISOString(),
  });
  const r2 = processIncomingMessage(unknownConv, msg2.message_text, { messageId: msg2.id });
  check('flow2: ambiguity flagged', r2.outcome === 'clarification' || r2.draft?.status === 'NEEDS_CLARIFICATION', r2.draft?.status);
  check('flow2: clarification question present', !!(r2.reply && r2.reply.includes('Which product do you mean?')), r2.reply);

  // --- Flow 3: unambiguous SKU order then explicit confirmation ---
  const customer2 = customers.find(c => c.id !== customer.id) || customer;
  const contact2 = localDb.getOrCreateWhatsAppContact(customer2.whatsapp_number || '8888888888', customer2.company_name);
  const conv2 = localDb.getOrCreateWhatsAppConversation(contact2.id, customer2.id);
  const orderMsg = localDb.addWhatsAppMessage({
    conversation_id: conv2.id, direction: 'inbound', message_type: 'text',
    message_text: '5 FPK-GEN-ALUMINFOIL-500FT', sender: customer2.whatsapp_number || undefined,
    sent_at: new Date().toISOString(),
  });
  const r3 = processIncomingMessage(conv2, orderMsg.message_text, { messageId: orderMsg.id });
  check('flow3: SKU order matched', r3.outcome === 'order', `${r3.outcome} :: ${r3.draft?.status}`);
  const items3 = r3.draft?.items || [];
  check('flow3: SKU matched exactly', items3.length === 1 && items3[0].match_method === 'sku' && items3[0].quantity === 5,
    items3.map(i => `${i.match_method}:${i.quantity}`).join(' | '));

  const confirmMsg = localDb.addWhatsAppMessage({
    conversation_id: conv2.id, direction: 'inbound', message_type: 'text',
    message_text: 'yes correct', sender: customer2.whatsapp_number || undefined,
    sent_at: new Date().toISOString(),
  });
  const r4 = processIncomingMessage(conv2, confirmMsg.message_text, { messageId: confirmMsg.id });
  check('flow3: confirmed', r4.outcome === 'confirmation', r4.outcome);
  check('flow3: draft CONFIRMED', r4.draft?.status === 'CONFIRMED', r4.draft?.status);
  check('flow3: internal reference assigned', /CRM-ORD-\d+/.test(r4.draft?.internal_reference || ''), r4.draft?.internal_reference);
  check('flow3: order received reply', !!r4.reply && r4.reply.includes('order has been received'), r4.reply?.split('\n')[1]);

  // --- Flow 4: non-order message → human attention ---
  const customer3 = customers[2] || customer;
  const contact3 = localDb.getOrCreateWhatsAppContact(customer3.whatsapp_number || '7777777777', customer3.company_name);
  const conv3 = localDb.getOrCreateWhatsAppConversation(contact3.id, customer3.id);
  const qMsg = localDb.addWhatsAppMessage({
    conversation_id: conv3.id, direction: 'inbound', message_type: 'text',
    message_text: 'what time are you delivering tomorrow?', sender: customer3.whatsapp_number || undefined,
    sent_at: new Date().toISOString(),
  });
  const r5 = processIncomingMessage(conv3, qMsg.message_text, { messageId: qMsg.id });
  check('flow4: classified QUESTION', r5.classification.classification === 'QUESTION', r5.classification.classification);
  check('flow4: NOT an order draft', r5.outcome === 'human_review', r5.outcome);
  check('flow4: attention alert raised', !!r5.alert, JSON.stringify(r5.alert?.priority));
  const counts = localDb.getUnresolvedAlertCounts();
  check('flow4: alert counts reflect urgent/high', counts.total > 0, JSON.stringify(counts));

  // --- Flow 5: correction on awaiting-confirmation draft ---
  const correctionMsg = localDb.addWhatsAppMessage({
    conversation_id: conv2.id, direction: 'inbound', message_type: 'text',
    message_text: 'actually make masks 10', sender: customer2.whatsapp_number || undefined,
    sent_at: new Date().toISOString(),
  });
  const r6 = processIncomingMessage(conv2, correctionMsg.message_text, { messageId: correctionMsg.id });
  check('flow5: correction produces clarification/awaiting', r6.outcome === 'clarification', r6.outcome);

  // --- Flow 6: template builder ---
  const tpl = orderDraftService.buildOrderRequestTemplate({ customerName: 'ABC Pharmacy', route: 'Kamloops' });
  check('flow6: template rendered', tpl.includes('ABC Pharmacy') && tpl.includes('Kamloops'), '');

  // --- Flow 7: intake audit trail ---
  const events = localDb.getOrderIntakeEvents(r4.draft?.id);
  check('flow7: intake events recorded', events.length > 0, events.length.toString());

  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });