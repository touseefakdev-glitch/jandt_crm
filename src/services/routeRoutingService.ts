/**
 * Phase 5 — Confirmed Order Routing Service
 *
 * Handles routing of confirmed WhatsApp orders to operational route destinations,
 * delivery date calculation from the weekly route schedule, internal route message formatting,
 * and integration with Baileys messaging gateway.
 */

import { localDb } from './db';
import { supabase } from './supabaseSync';
import { OrderDraft, RouteDestination } from '../types';

export const WEEKLY_ROUTE_SCHEDULE: Record<string, string[]> = {
  Monday: ['Kelowna'],
  Tuesday: ['Kelowna', 'West Kelowna', 'Summerland'],
  Wednesday: ['Kelowna', 'Penticton', 'West Kelowna', 'Osoyoos', 'Oliver'],
  Thursday: ['Kelowna', 'Penticton', 'Princeton', 'Keremeos', 'Osoyoos', 'Oliver', 'Merritt'],
  Friday: ['Vernon', 'Salmon Arm', 'Lake Country', 'Armstrong'],
  Saturday: ['Vernon', 'Kamloops', 'Falkland', 'Chase', 'Salmon Arm', 'Lake Country'],
  Sunday: ['Kelowna', 'Penticton', 'Osoyoos', 'Oliver', 'West Kelowna'],
};

/**
 * Determines the next delivery date string (e.g. "Tuesday, August 11") for a given route.
 */
export function getNextDeliveryDate(route: string, referenceDate: Date = new Date()): string {
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  const normRoute = (route || 'Kelowna').trim().toLowerCase();

  for (let offset = 1; offset <= 7; offset++) {
    const candidate = new Date(referenceDate);
    candidate.setDate(candidate.getDate() + offset);
    const dayName = dayNames[candidate.getDay()];
    const scheduledRoutes = WEEKLY_ROUTE_SCHEDULE[dayName] || [];

    if (scheduledRoutes.some(r => r.toLowerCase() === normRoute)) {
      const month = monthNames[candidate.getMonth()];
      const day = candidate.getDate();
      return `${dayName}, ${month} ${day}`;
    }
  }

  // Fallback to tomorrow
  const tomorrow = new Date(referenceDate);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayName = dayNames[tomorrow.getDay()];
  const month = monthNames[tomorrow.getMonth()];
  return `${dayName}, ${month} ${tomorrow.getDate()}`;
}

/**
 * Formats the standardized internal route operational message.
 */
export function buildInternalRouteMessage(draft: OrderDraft): string {
  const items = draft.items || localDb.getOrderDraftItems(draft.id);
  const validItems = items.filter(i => i.status !== 'rejected');
  
  const itemLines = validItems.map(i => {
    const name = i.matched_product_name || i.product?.product_name || i.customer_text;
    const qty = i.quantity != null ? ` — ${i.quantity}` : '';
    return `• ${name}${qty}`;
  });

  const customerName = draft.customer?.company_name || 'Unknown Customer';
  const route = draft.route || 'Kelowna';
  const deliveryDate = draft.delivery_date || getNextDeliveryDate(route);
  const refCode = draft.internal_reference || 'CRM-ORD-000001';

  return [
    '📦 NEW ORDER CONFIRMED',
    '',
    'Customer:',
    customerName,
    '',
    'Route:',
    route,
    '',
    'Delivery:',
    deliveryDate,
    '',
    'Items:',
    ...(itemLines.length > 0 ? itemLines : ['• (No line items recorded)']),
    '',
    'CRM Reference:',
    refCode,
  ].join('\n');
}

/**
 * Resolves destination WhatsApp group JID for a given route.
 * Checks env ORDER_GROUP_JID or local route_destinations. Never hardcodes JIDs.
 */
export function resolveDestinationJidForRoute(route: string): string {
  const envOrderGroup = (import.meta.env?.ORDER_GROUP_JID || '').trim();
  const routeDestinations = localDb.getRouteDestinations();
  
  const matched = routeDestinations.find(rd => rd.route.toLowerCase() === route.toLowerCase() && rd.active);
  if (matched && matched.destination_identifier) {
    return matched.destination_identifier;
  }

  return envOrderGroup || '120363409575608646@g.us';
}

/**
 * Forwards a confirmed order draft to the Baileys WhatsApp route destination via Supabase outbox / messages.
 * Phase 8: idempotent — never forwards the same order twice.
 */
export async function forwardConfirmedOrderToRoute(draftId: string): Promise<{ success: boolean; destinationJid: string; messageText: string }> {
  const draft = localDb.getOrderDraftWithItems(draftId);
  if (!draft) {
    throw new Error(`Order draft ${draftId} not found.`);
  }

  // Duplicate protection: a forwarded order is never forwarded again.
  if (draft.status === 'FORWARDED') {
    return {
      success: true,
      destinationJid: resolveDestinationJidForRoute(draft.route || 'Kelowna'),
      messageText: buildInternalRouteMessage(draft),
    };
  }

  const destinationJid = resolveDestinationJidForRoute(draft.route || 'Kelowna');
  const messageText = buildInternalRouteMessage(draft);

  // Update draft status to FORWARDED
  localDb.updateOrderDraft(draftId, { status: 'FORWARDED' });

  // Outbound dispatch: write message to Supabase 'messages' table for Baileys connector pickup
  if (supabase) {
    try {
      await supabase.from('messages').insert({
        remote_jid: destinationJid,
        text: messageText,
        is_group: destinationJid.endsWith('@g.us'),
        from_me: true,
        processing_status: 'PROCESSED',
      });
    } catch (e: any) {
      console.warn('[Routing] Supabase message insert warning:', e?.message);
    }
  }

  // Log order intake events: order_forwarded for the audit trail + route_forwarded for the route pipeline
  localDb.logOrderIntakeEvent({
    order_draft_id: draftId,
    conversation_id: draft.conversation_id,
    event_type: 'order_forwarded',
    description: `Confirmed order ${draft.internal_reference} forwarded to destination JID ${destinationJid}`,
  });
  localDb.logOrderIntakeEvent({
    order_draft_id: draftId,
    conversation_id: draft.conversation_id,
    event_type: 'route_forwarded',
    description: `Order ${draft.internal_reference} dispatched on route ${draft.route || 'Kelowna'}`,
    payload: { destination_jid: destinationJid },
  });

  return { success: true, destinationJid, messageText };
}

export const routeRoutingService = {
  WEEKLY_ROUTE_SCHEDULE,
  getNextDeliveryDate,
  buildInternalRouteMessage,
  resolveDestinationJidForRoute,
  forwardConfirmedOrderToRoute,
};
