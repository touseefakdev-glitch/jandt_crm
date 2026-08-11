import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lsibpbdxbyxhnbsgodxa.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_jAzbw1TeVD5oYc6Fg44Myg_4WOL6YWH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const SEED_CATEGORIES = [
  { id: '00000000-0000-0000-0001-000000000001', name: 'Order Issue', description: 'Order discrepancies, wrong quantities, or missing order confirmation', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000002', name: 'Delivery Issue', description: 'Carrier delays, damaged packaging, or incorrect delivery address', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000003', name: 'Invoice Issue', description: 'Billing errors, tax exempt status, or missing commercial invoices', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000004', name: 'Product Issue', description: 'Defective items, technical specifications, or quality assurance inquiries', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000005', name: 'Stock Availability', description: 'Product availability inquiries, backorder lead times, or stock restock dates', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000006', name: 'Payment Issue', description: 'Payment gateway failures, wire transfer confirmations, or credit terms', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000007', name: 'Customer Information', description: 'Account contact details, address updates, or tax exemption status', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000008', name: 'General Inquiry', description: 'General business inquiries, catalog requests, or support shift info', is_active: true, created_at: new Date('2026-01-01').toISOString() },
  { id: '00000000-0000-0000-0001-000000000009', name: 'Other', description: 'Uncategorized customer tickets requiring agent evaluation', is_active: true, created_at: new Date('2026-01-01').toISOString() },
];

async function main() {
  console.log('=== Aligning Support Queries & Categories with Supabase ===');
  console.log(`Target Supabase Host: ${supabaseUrl}`);

  // 1. Upsert default query categories
  console.log('[Supabase] Syncing 9 default query categories to table "query_categories"...');
  const { error: catError } = await supabase.from('query_categories').upsert(SEED_CATEGORIES, { onConflict: 'id' });
  if (catError) {
    console.error('Failed to upsert query categories:', catError.message);
    throw catError;
  }
  console.log('[Supabase] Table "query_categories" successfully synced with 9 default categories.');

  // 2. Fetch live query categories
  const { data: catData, error: catFetchErr } = await supabase.from('query_categories').select('*');
  if (catFetchErr) {
    console.error('Failed to fetch query categories:', catFetchErr.message);
  } else {
    console.log(`Live query categories in Supabase: ${catData?.length || 0} categories.`);
  }

  // 3. Fetch live customer queries count
  const { count: queryCount, error: queryErr } = await supabase.from('customer_queries').select('*', { count: 'exact', head: true });
  if (queryErr) {
    console.error('Failed to query customer_queries in Supabase:', queryErr.message);
  } else {
    console.log(`Live customer queries in Supabase: ${queryCount || 0} records.`);
  }

  // 4. Check related tables (query_activities, query_internal_notes, query_attachments)
  const { count: actCount } = await supabase.from('query_activities').select('*', { count: 'exact', head: true });
  const { count: notesCount } = await supabase.from('query_internal_notes').select('*', { count: 'exact', head: true });
  const { count: attCount } = await supabase.from('query_attachments').select('*', { count: 'exact', head: true });

  console.log(`Query Activities: ${actCount || 0}, Internal Notes: ${notesCount || 0}, Attachments: ${attCount || 0}`);
  console.log('=== Support Queries & Categories Alignment Complete ===');
}

main().catch(err => {
  console.error('Fatal error during query alignment:', err);
  process.exit(1);
});
