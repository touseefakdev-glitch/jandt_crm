import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

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

function parseCsvLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (char === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur);
  return result;
}

async function batchUpsert(table: string, rows: Record<string, unknown>[], batchSize = 100) {
  console.log(`[Supabase Upload] Syncing ${rows.length} rows to table '${table}' (batch size: ${batchSize})...`);
  for (let i = 0; i < rows.length; i += batchSize) {
    const chunk = rows.slice(i, i + batchSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict: 'id' });
    if (error) {
      console.error(`[Upload Error] Batch ${Math.floor(i / batchSize) + 1} for '${table}' failed:`, error.message);
      throw error;
    }
  }
  console.log(`[Upload Success] Table '${table}' successfully updated with ${rows.length} records in Supabase.`);
}

async function main() {
  console.log('=== Starting Products Backup Upload to Supabase ===');
  console.log(`Target Supabase Host: ${supabaseUrl}`);

  // 1. Ensure product categories and brands exist
  await batchUpsert('product_categories', SEED_PRODUCT_CATEGORIES);
  await batchUpsert('product_brands', SEED_PRODUCT_BRANDS);

  // 2. Read backup/products.csv
  const csvPath = path.resolve(process.cwd(), 'backup/products.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Backup file not found at ${csvPath}`);
  }

  const rawContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = rawContent.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (lines.length <= 1) {
    console.log('No data rows found in backup/products.csv');
    return;
  }

  const header = parseCsvLine(lines[0]);
  console.log(`Header columns (${header.length}): ${header.join(', ')}`);

  const productsToUpsert: Record<string, unknown>[] = [];
  const usedSkus = new Set<string>();

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < header.length) continue;

    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h.trim()] = (cols[idx] || '').trim();
    });

    if (!row.id || !row.sku || !row.product_name) continue;

    // Deduplicate SKU if necessary
    let baseSku = row.sku.toUpperCase();
    let finalSku = baseSku;
    let dupCounter = 1;
    while (usedSkus.has(finalSku)) {
      finalSku = `${baseSku}-DUP-${dupCounter++}`;
    }
    usedSkus.add(finalSku);

    const productRecord: Record<string, unknown> = {
      id: row.id,
      sku: finalSku,
      product_name: row.product_name,
      description: row.description || null,
      category_id: row.category_id || '00000000-0000-0000-0002-000000000001',
      brand_id: row.brand_id || null,
      unit_price: parseFloat(row.unit_price) || 0,
      availability_status: row.availability_status || 'available',
      availability_notes: row.availability_notes || null,
      expected_available_date: row.expected_available_date || null,
      is_active: row.is_active === 'true' || row.is_active === 'TRUE' || row.is_active === '1',
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || new Date().toISOString(),
      created_by: null,
      updated_by: null,
    };

    productsToUpsert.push(productRecord);
  }

  console.log(`Parsed ${productsToUpsert.length} products from CSV backup.`);
  await batchUpsert('products', productsToUpsert, 100);

  // 3. Verify count in Supabase
  const { count, error } = await supabase.from('products').select('*', { count: 'exact', head: true });
  if (error) {
    console.error('Failed to verify product count in Supabase:', error.message);
  } else {
    console.log(`=== Verification Complete: Live Supabase 'products' table now has ${count} total records! ===`);
  }
}

main().catch(err => {
  console.error('Fatal error during Supabase products upload:', err);
  process.exit(1);
});
