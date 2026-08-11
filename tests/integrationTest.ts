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
  const { runDailyOrderRequest } = await import('../../CRM/src/services/dailyOrderRequestService');
  const { processMessageSafely } = await import('../../CRM/src/services/resilientProcessing');
  const { getWhatsAppMonitoringStats } = await import('../../CRM/src/services/whatsappMonitoringService');
  const { forwardConfirmedOrderToRoute } = await import('../../CRM/src/services/routeRoutingService');
  const adminId = 'a1111111-1111-1111-1111-111111111111';

  // Seed test catalog if running on a clean slate database
  if (localDb.getCustomers().length === 0) {
    localDb.createCustomer({
      company_name: 'Test Bakery Ltd',
      contact_person: 'John Test',
      phone: '2505551234',
      whatsapp_number: '2505551234',
      email: 'test@bakery.com',
      city: 'Kelowna',
      route: 'Kelowna',
      address: '123 Test St',
      country: 'Canada',
      notes: '',
      status: 'active',
    }, adminId);

    localDb.createCustomer({
      company_name: 'Valley Restaurant',
      contact_person: 'Sarah Valley',
      phone: '2505555678',
      whatsapp_number: '2505555678',
      email: 'sarah@valley.com',
      city: 'Penticton',
      route: 'Penticton',
      address: '456 Main St',
      country: 'Canada',
      notes: '',
      status: 'active',
    }, adminId);

    localDb.createCustomer({
      company_name: 'Okanagan Bistro',
      contact_person: 'Mike Bistro',
      phone: '2505559012',
      whatsapp_number: '2505559012',
      email: 'mike@okbistro.com',
      city: 'Vernon',
      route: 'Vernon',
      address: '789 Lake Rd',
      country: 'Canada',
      notes: '',
      status: 'active',
    }, adminId);
  }

  if (localDb.getProducts().length === 0) {
    localDb.createProduct({
      sku: 'BLU-GLOV-LRG',
      product_name: 'Nitrile Examination Gloves Large Blue',
      description: 'Blue nitrile gloves large size',
      category_id: '',
      brand_id: '',
      unit_price: 15.99,
      availability_status: 'available',
      availability_notes: '',
      expected_available_date: '',
      is_active: true,
    }, adminId);

    localDb.createProduct({
      sku: 'BLU-WRAP-ROLL',
      product_name: 'Blue Plastic Film Wrap Roll',
      description: 'Blue plastic film wrap 18 inch roll',
      category_id: '',
      brand_id: '',
      unit_price: 24.50,
      availability_status: 'available',
      availability_notes: '',
      expected_available_date: '',
      is_active: true,
    }, adminId);

    localDb.createProduct({
      sku: 'FPK-GEN-FOIL-ITEM',
      product_name: 'Aluminum Foil Roll 12in',
      description: '',
      category_id: '',
      brand_id: '',
      unit_price: 29.00,
      availability_status: 'available',
      availability_notes: '',
      expected_available_date: '',
      is_active: true,
    }, adminId);
  }

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
    message_text: '5 FPK-GEN-FOIL-ITEM', sender: customer2.whatsapp_number || undefined,
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

  // --- Flow 8: automated daily order request (Phase 7) ---
  const future = new Date('2026-08-12T20:00:00Z'); // Wed 13:00 in America/Vancouver → tomorrow = Thursday
  const runResult = await runDailyOrderRequest(adminId, future);
  check('flow8: run computed a delivery date', !!runResult.deliveryDate, runResult.deliveryDate);
  check('flow8: Thursday routes included', runResult.routes.includes('Kelowna'), runResult.routes.join(','));
  const reminders = localDb.getOrderRequestReminders({ deliveryDate: runResult.deliveryDate });
  check('flow8: reminders recorded', reminders.length > 0, reminders.length.toString());
  check('flow8: reminders are sent', reminders.every(r => r.status === 'sent'), reminders.map(r => r.status).join('|'));
  check('flow8: message text rendered', reminders.every(r => r.message_text.includes('J&T Supplies') && r.message_text.includes(r.customer_name)), '');

  // --- Flow 9: retry only fails cleanly; dedupe prevents double-send ---
  const rerun = await runDailyOrderRequest(adminId, future);
  check('flow9: rerun skipped already-sent', rerun.skipped === rerun.eligibleCustomers, `${rerun.skipped}/${rerun.eligibleCustomers}`);

  // --- Flow 10: Phase 8 duplicate protection on confirmDraft ---
  const confirmedDraft = r4.draft;
  check('flow10: confirmed draft exists', !!confirmedDraft, confirmedDraft?.id);
  const beforeOrderEvents = localDb.getOrderIntakeEvents().filter(e => e.event_type === 'order_created').length;
  const dupConfirm = orderDraftService.confirmDraft(confirmedDraft!.id, 'confirm again', conv2, confirmMsg.id);
  check('flow10: double confirm blocked', dupConfirm.outcome === 'confirmation' && dupConfirm.reply.includes('No duplicate will be created'), dupConfirm.reply);
  const afterOrderEvents = localDb.getOrderIntakeEvents().filter(e => e.event_type === 'order_created').length;
  check('flow10: no second order created', afterOrderEvents === beforeOrderEvents, `${beforeOrderEvents} -> ${afterOrderEvents}`);

  // --- Flow 11: Phase 8 route-forward idempotency ---
  const fwd1 = await forwardConfirmedOrderToRoute(confirmedDraft!.id);
  const fwd2 = await forwardConfirmedOrderToRoute(confirmedDraft!.id);
  const fwdEvents = localDb.getOrderIntakeEvents().filter(e => e.event_type === 'route_forwarded' && e.order_draft_id === confirmedDraft!.id);
  check('flow11: first forward dispatched', fwd1.success === true, fwd1.destinationJid);
  check('flow11: second forward short-circuited', fwd2.success === true, '');
  check('flow11: only one route_forwarded event', fwdEvents.length === 1, fwdEvents.length.toString());
  const fwdDraft = localDb.getOrderDraftWithItems(confirmedDraft!.id);
  check('flow11: draft status FORWARDED', fwdDraft?.status === 'FORWARDED', fwdDraft?.status);

  // --- Flow 12: Phase 8 reject draft (human control) ---
  const rejectContact = localDb.getOrCreateWhatsAppContact('5550001111', 'Reject Test Co');
  const rejectConv = localDb.getOrCreateWhatsAppConversation(rejectContact.id, null);
  const rejectMsg = localDb.addWhatsAppMessage({
    conversation_id: rejectConv.id, direction: 'inbound', message_type: 'text',
    message_text: '3 BLU-GLOV-LRG', sender: '5550001111', sent_at: new Date().toISOString(),
  });
  const rejectResult = processIncomingMessage(rejectConv, rejectMsg.message_text, { messageId: rejectMsg.id });
  const rejected = orderDraftService.rejectOrderDraft(rejectResult.draft!.id, 'Customer cancelled by phone', { userId: adminId, conversationId: rejectConv.id });
  check('flow12: draft cancelled', rejected?.status === 'CANCELLED', rejected?.status);
  const rejectEvent = localDb.getOrderIntakeEvents().find(e => e.event_type === 'draft_rejected' && e.order_draft_id === rejectResult.draft!.id);
  check('flow12: draft_rejected event recorded', !!rejectEvent, rejectEvent?.description);
  const auditLogs = localDb.getAuditLogs({ action: 'order_draft_rejected' });
  check('flow12: audit entry written', auditLogs.some(a => a.entity_id === rejectResult.draft!.id), auditLogs.map(a => a.entity_id).join('|'));

  // --- Flow 13: Phase 8 edit draft (human control) ---
  const editContact = localDb.getOrCreateWhatsAppContact('5550002222', 'Edit Test Co');
  const editConv = localDb.getOrCreateWhatsAppConversation(editContact.id, null);
  const editMsg = localDb.addWhatsAppMessage({
    conversation_id: editConv.id, direction: 'inbound', message_type: 'text',
    message_text: '5 FPK-GEN-FOIL-ITEM', sender: '5550002222', sent_at: new Date().toISOString(),
  });
  const editResult = processIncomingMessage(editConv, editMsg.message_text, { messageId: editMsg.id });
  const editItem = (editResult.draft?.items || [])[0];
  check('flow13: draft has a matched item', !!editItem, editItem?.matched_product_name);
  const edited = orderDraftService.editOrderDraftItems(editResult.draft!.id, [{ id: editItem.id, quantity: 7 }], { userId: adminId });
  const editedItem = (edited?.items || []).find(i => i.id === editItem.id);
  check('flow13: quantity edited to 7', editedItem?.quantity === 7, String(editedItem?.quantity));
  const editEvent = localDb.getOrderIntakeEvents().find(e => e.event_type === 'draft_edited' && e.order_draft_id === editResult.draft!.id);
  check('flow13: draft_edited event recorded', !!editEvent, '');

  // --- Flow 14: Phase 8 resilient pipeline never throws ---
  const resilientConv = localDb.getOrCreateWhatsAppConversation(
    localDb.getOrCreateWhatsAppContact('5550003333', 'Resilient Co').id, null
  );
  const resilientMsg = localDb.addWhatsAppMessage({
    conversation_id: resilientConv.id, direction: 'inbound', message_type: 'text',
    message_text: '@#%$^!(( unparseable noise', sender: '5550003333', sent_at: new Date().toISOString(),
  });
  let resilientOutcome = '';
  let threw = false;
  try {
    const res = processMessageSafely(resilientConv, resilientMsg.message_text, { messageId: resilientMsg.id });
    resilientOutcome = res.outcome;
  } catch (err) {
    threw = true;
  }
  check('flow14: processMessageSafely never throws', threw === false, String(threw));
  check('flow14: returns a valid outcome', ['order', 'clarification', 'human_review', 'non_order'].includes(resilientOutcome), resilientOutcome);

  // --- Flow 15: Phase 8 error recovery dedupe ---
  const err1 = localDb.recordOrderProcessingError({
    conversation_id: resilientConv.id, customer_id: null, message_id: resilientMsg.id,
    external_message_id: null, stage: 'parse', error_code: 'test_error', error_message: 'boom',
    raw_message_text: resilientMsg.message_text,
  });
  const err2 = localDb.recordOrderProcessingError({
    conversation_id: resilientConv.id, customer_id: null, message_id: resilientMsg.id,
    external_message_id: null, stage: 'parse', error_code: 'test_error', error_message: 'boom',
    raw_message_text: resilientMsg.message_text,
  });
  const sameRecord = err1.id === err2.id;
  const attemptBumped = err2.attempt_count === 2;
  check('flow15: duplicate error deduped to same record', sameRecord, `${err1.id} vs ${err2.id}`);
  check('flow15: attempt_count bumped to 2', attemptBumped, String(err2.attempt_count));
  const openErrors = localDb.getOrderProcessingErrors({ status: 'open' }).filter(e => e.message_id === resilientMsg.id);
  check('flow15: exactly one open record', openErrors.length === 1, openErrors.length.toString());
  localDb.resolveOrderProcessingError(err1.id, 'Resolved in test', adminId);
  check('flow15: error resolved', localDb.getOrderProcessingErrors().find(e => e.id === err1.id)?.status === 'resolved', '');

  // --- Flow 16: Phase 8 monitoring dashboard stats ---
  const stats = getWhatsAppMonitoringStats();
  check('flow16: stats computed', !!stats.dateKey, stats.dateKey);
  check('flow16: messagesToday > 0', stats.messagesToday > 0, String(stats.messagesToday));
  check('flow16: ordersDetected > 0', stats.ordersDetected > 0, String(stats.ordersDetected));
  check('flow16: ordersConfirmed >= 1', stats.ordersConfirmed >= 1, String(stats.ordersConfirmed));
  check('flow16: openProcessingErrors >= 0', stats.openProcessingErrors >= 0, String(stats.openProcessingErrors));
  localDb.updateWhatsAppMessage(msg1.id, { classification: 'ORDER' });
  const stats2 = getWhatsAppMonitoringStats();
  check('flow16: byClassification counts classified messages', (stats2.byClassification.ORDER || 0) >= 1, JSON.stringify(stats2.byClassification.ORDER));

  // --- Flow 17: Phase 8 audit trail shows order lifecycle ---
  const lifecycle = localDb.getOrderIntakeEvents(confirmedDraft!.id).map(e => e.event_type);
  check('flow17: draft_confirmed in lifecycle', lifecycle.includes('draft_confirmed'), lifecycle.join(','));
  check('flow17: order_created in lifecycle', lifecycle.includes('order_created'), lifecycle.join(','));
  check('flow17: order_forwarded in lifecycle', lifecycle.includes('order_forwarded'), lifecycle.join(','));

  console.log(results.join('\n'));
  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail > 0 ? 1 : 0);
}

main().catch(e => { console.error(e); process.exit(1); });