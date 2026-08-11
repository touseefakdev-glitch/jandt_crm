const { supabase } = require('./supabase');

// Active in-memory draft orders keyed by remoteJid
const draftOrders = new Map();

/**
 * Parse text using Supabase Edge Function or local DB fallback
 */
async function parseOrderText(text) {
  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

  if (supabaseUrl && !supabaseUrl.includes('placeholder')) {
    try {
      const response = await fetch(`${supabaseUrl}/functions/v1/parse-order`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseAnonKey}`,
        },
        body: JSON.stringify({ text }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data.items)) {
          return data.items;
        }
      }
    } catch (e) {
      console.warn('Edge function parse-order unavailable, using DB fallback:', e.message);
    }
  }

  // Fallback: Query products table directly from Supabase DB
  const { data: products } = await supabase.from('products').select('*');
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const items = [];

  for (const line of lines) {
    const match = line.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)?\s+(.+)$/) || line.match(/^(\d+(?:\.\d+)?)\s+(.+)$/);
    let quantity = null;
    let unit = null;
    let itemText = line;

    if (match) {
      quantity = parseFloat(match[1]);
      if (match.length === 4) {
        unit = match[2] ? match[2].toLowerCase() : null;
        itemText = match[3].trim();
      } else {
        itemText = match[2].trim();
      }
    }

    let matchedProduct = null;
    if (products && products.length > 0) {
      matchedProduct = products.find(p => {
        const lowerText = itemText.toLowerCase();
        const nameMatch = p.name?.toLowerCase().includes(lowerText) || lowerText.includes(p.name?.toLowerCase());
        const aliasMatch = Array.isArray(p.aliases) && p.aliases.some(a => a.toLowerCase().includes(lowerText) || lowerText.includes(a.toLowerCase()));
        return nameMatch || aliasMatch;
      });
    }

    items.push({
      original_line: line,
      quantity,
      unit,
      item_text: itemText,
      matched_product_id: matchedProduct ? matchedProduct.id : null,
      matched_product_name: matchedProduct ? matchedProduct.name : null,
    });
  }

  return items;
}

/**
 * Handle incoming message for Order Flow
 */
async function processOrderMessage(sock, remoteJid, senderJid, text, isCustomerGroup, orderGroupJid) {
  const lowerText = text.trim().toLowerCase();
  const finishKeywords = ["that's it", "that is it", "done", "no", "that's all", "complete", "thats it"];

  if (finishKeywords.includes(lowerText)) {
    const activeDraft = draftOrders.get(remoteJid);

    if (activeDraft && activeDraft.items.length > 0) {
      const { data: orderData, error: orderErr } = await supabase
        .from('orders')
        .insert({
          customer_jid: senderJid || remoteJid,
          order_details: { items: activeDraft.items },
          status: 'confirmed',
        })
        .select()
        .single();

      if (orderErr) {
        console.error('Error inserting order to Supabase:', orderErr.message);
      }

      const orderId = orderData ? orderData.id : null;

      if (orderId) {
        const itemRows = activeDraft.items.map(item => ({
          order_id: orderId,
          product_id: item.matched_product_id,
          original_line: item.original_line,
          item_text: item.item_text,
          quantity: item.quantity,
          unit: item.unit,
        }));

        const { error: itemsErr } = await supabase.from('order_items').insert(itemRows);
        if (itemsErr) {
          console.error('Error inserting order_items:', itemsErr.message);
        }
      }

      draftOrders.delete(remoteJid);

      const wrapupMsg = `✅ *Order Confirmed!*\n\nThank you! Your order has been logged and sent to fulfillment.`;
      await sock.sendMessage(remoteJid, { text: wrapupMsg });

      if (orderGroupJid && orderGroupJid !== remoteJid) {
        const summaryLines = activeDraft.items.map(i => 
          `• ${i.quantity || 1} ${i.unit || ''} ${i.matched_product_name || i.item_text}`
        ).join('\n');
        
        await sock.sendMessage(orderGroupJid, {
          text: `📦 *NEW ORDER CONFIRMED*\n\nCustomer: ${senderJid || remoteJid}\n\n*Items:*\n${summaryLines}`,
        });
      }
      return;
    } else {
      await sock.sendMessage(remoteJid, {
        text: `No active order draft found. Send your order line-by-line to get started!`,
      });
      return;
    }
  }

  const parsedItems = await parseOrderText(text);

  const existingDraft = draftOrders.get(remoteJid) || { items: [] };
  existingDraft.items = [...existingDraft.items, ...parsedItems];
  draftOrders.set(remoteJid, existingDraft);

  const matched = parsedItems.filter(i => i.matched_product_id);
  const unmatched = parsedItems.filter(i => !i.matched_product_id);

  let reply = `🛒 *Understood the following items:*\n`;

  if (matched.length > 0) {
    matched.forEach(i => {
      reply += `• ${i.quantity ? i.quantity + ' ' : ''}${i.unit ? i.unit + ' ' : ''}${i.item_text} -> *${i.matched_product_name}*\n`;
    });
  } else {
    reply += `_(No catalog products matched standard items)_\n`;
  }

  if (unmatched.length > 0) {
    reply += `\n⚠️ *Unmatched lines (please clarify):*\n`;
    unmatched.forEach(i => {
      reply += `• "${i.original_line}"\n`;
    });
  }

  reply += `\n*Anything else?*`;

  await sock.sendMessage(remoteJid, { text: reply });
}

module.exports = { processOrderMessage };
