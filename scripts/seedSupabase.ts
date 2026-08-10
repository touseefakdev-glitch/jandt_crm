import { createClient } from '@supabase/supabase-js';
import { SEED_HTML_PRODUCTS, SEED_HTML_CUSTOMERS } from '../src/data/seedHtmlData';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lsibpbdxbyxhnbsgodxa.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_jAzbw1TeVD5oYc6Fg44Myg_4WOL6YWH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SEED_PRODUCT_CATEGORIES = [
  { id: '00000000-0000-0000-0002-000000000001', name: 'Food Wrap', description: 'Commercial food packaging wraps, cling wraps, parchment and wax paper sheets', is_active: true },
  { id: '00000000-0000-0000-0002-000000000002', name: 'Foil Items', description: 'Standard, heavy-duty, and freezer aluminum foil rolls and insulated sheets', is_active: true },
  { id: '00000000-0000-0000-0002-000000000003', name: 'Bags', description: 'Grease proof dry wax sandwich bags and commercial food service paper bags', is_active: true },
  { id: '00000000-0000-0000-0002-000000000004', name: 'Pizza Essentials', description: 'Standard and corrugated pizza box inserts, liners, and liners cases', is_active: true },
];

const SEED_PRODUCT_BRANDS = [
  { id: '00000000-0000-0000-0003-000000000001', name: 'J&T Packaging', description: 'Premium commercial food packaging products', is_active: true },
  { id: '00000000-0000-0000-0003-000000000002', name: 'GenPak / Royal', description: 'High quality cling film rolls and baking paper supplies', is_active: true },
  { id: '00000000-0000-0000-0003-000000000003', name: 'FoilPro', description: 'Heavy-duty commercial aluminum foil and freezer paper rolls', is_active: true },
  { id: '00000000-0000-0000-0003-000000000004', name: 'PizzaGuard', description: 'Corrugated and moisture-resistant pizza liner products', is_active: true },
];

async function batchUpsert(table: string, rows: Record<string, unknown>[], batchSize = 100) {
  console.log(`[Seed] Syncing ${rows.length} rows to Supabase table '${table}' (batch size: ${batchSize})...`);
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`[Seed Error] Batch ${Math.floor(i / batchSize) + 1} for ${table} failed:`, error.message);
      throw error;
    }
  }
  console.log(`[Seed Success] Table '${table}' now has ${rows.length} records in Supabase.`);
}

async function seed() {
  console.log('=== Starting Supabase Catalog Seeding Migration ===');
  console.log(`Target Supabase Host: ${supabaseUrl}`);

  // Clean old dummy data that might collide with SKUs or IDs
  console.log('Clearing old sample records in Supabase...');
  await supabase.from('customer_product_history').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('products').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('customers').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  // 1. Seed product categories and brands
  await batchUpsert('product_categories', SEED_PRODUCT_CATEGORIES);
  await batchUpsert('product_brands', SEED_PRODUCT_BRANDS);

  // 2. Convert SEED_HTML_PRODUCTS -> Product[]
  const catMap = new Map<string, string>();
  SEED_PRODUCT_CATEGORIES.forEach(c => catMap.set(c.name.toLowerCase(), c.id));
  const defaultCatId = SEED_PRODUCT_CATEGORIES[0].id;

  const usedSkus = new Set<string>();
  const codeToProductMap = new Map<string, Record<string, unknown>>();

  const newProducts = SEED_HTML_PRODUCTS.map((p, idx) => {
    const catId = catMap.get(p.category.toLowerCase()) || defaultCatId;
    const prodUuid = `00000000-0000-0000-0001-${String(idx + 1).padStart(12, '0')}`;

    let baseSku = p.sku || `ITEM-${p.itemCode}`;
    let finalSku = baseSku;
    let dupCounter = 1;
    while (usedSkus.has(finalSku)) {
      finalSku = `${baseSku}-${p.itemCode}-${dupCounter++}`;
    }
    usedSkus.add(finalSku);

    const prodObj = {
      id: prodUuid,
      sku: finalSku,
      product_name: p.name,
      description: p.subcategory ? `${p.category} > ${p.subcategory}` : p.category,
      category_id: catId,
      brand_id: null,
      unit_price: p.desiredSPBase || 0,
      availability_status: 'available',
      availability_notes: null,
      expected_available_date: null,
      is_active: true,
      created_at: new Date('2026-01-01').toISOString(),
      updated_at: new Date('2026-01-01').toISOString(),
      created_by: null,
      updated_by: null,
    };
    codeToProductMap.set(p.itemCode, prodObj);
    return prodObj;
  });

  await batchUpsert('products', newProducts, 100);

  // 3. Convert SEED_HTML_CUSTOMERS -> Customer[] & CustomerProductHistory[]
  const newCustomers: Record<string, unknown>[] = [];
  const newHistory: Record<string, unknown>[] = [];

  SEED_HTML_CUSTOMERS.forEach((c, cIdx) => {
    const custUuid = `00000000-0000-0000-0002-${String(cIdx + 1).padStart(12, '0')}`;
    const custCode = `CUST-${String(cIdx + 1).padStart(4, '0')}`;

    const custObj = {
      id: custUuid,
      customer_code: custCode,
      company_name: c.customerName,
      contact_person: null,
      phone: '',
      whatsapp_number: '',
      email: null,
      city: '',
      route: '',
      address: '',
      country: 'USA',
      notes: null,
      status: 'active',
      created_at: new Date('2026-01-01').toISOString(),
      updated_at: new Date('2026-01-01').toISOString(),
      created_by: null,
      updated_by: null,
    };
    newCustomers.push(custObj);

    c.items.forEach((item) => {
      const matchedProd = codeToProductMap.get(item.itemCode);
      const histUuid = `00000000-0000-0000-0003-${String(newHistory.length + 1).padStart(12, '0')}`;
      const histObj = {
        id: histUuid,
        customer_id: custUuid,
        customer_name: c.customerName,
        product_id: matchedProd ? matchedProd.id : null,
        source_item_code: item.itemCode,
        source_item_name: item.itemName,
        packaging_unit: item.unit,
        customer_price: item.price,
        inner_unit: item.innerUnit,
        inner_qty: item.innerQty,
        unit_price: item.unitPrice,
        created_at: new Date('2026-01-01').toISOString(),
        updated_at: new Date('2026-01-01').toISOString(),
      };
      newHistory.push(histObj);
    });
  });

  await batchUpsert('customers', newCustomers, 100);
  await batchUpsert('customer_product_history', newHistory, 100);

  console.log('=== Supabase Seeding Completed Successfully! ===');
}

seed().catch((err) => {
  console.error('Seeding process failed:', err);
  process.exit(1);
});
