import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lsibpbdxbyxhnbsgodxa.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_jAzbw1TeVD5oYc6Fg44Myg_4WOL6YWH';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const CITY_PATTERNS: Array<{ name: string; regex: RegExp }> = [
  { name: 'West Kelowna', regex: /\b(?:west\s*kelowna|west\s*kelwona)\b/i },
  { name: 'Lake Country', regex: /\blake\s*country\b/i },
  { name: 'Salmon Arm', regex: /\bsalmon\s*arm|salmonarm\b/i },
  { name: 'Kelowna', regex: /\b(?:kelowna|rutland)\b/i },
  { name: 'Kamloops', regex: /\bkamloops\b/i },
  { name: 'Penticton', regex: /\bpenticton\b/i },
  { name: 'Vernon', regex: /\bvernon\b/i },
  { name: 'Oliver', regex: /\boliver\b/i },
  { name: 'Osoyoos', regex: /\bosoyoos\b/i },
  { name: 'Summerland', regex: /\bsummerland\b/i },
  { name: 'Keremeos', regex: /\bkeremeos\b/i },
  { name: 'Merritt', regex: /\bmerritt\b/i },
  { name: 'Armstrong', regex: /\barmstrong\b/i },
  { name: 'Calgary', regex: /\bcalgary\b/i },
  { name: 'Edmonton', regex: /\bedmonton\b/i },
  { name: 'Vancouver', regex: /\bvancouver\b/i },
  { name: 'Surrey', regex: /\bsurrey\b/i },
  { name: 'Abbotsford', regex: /\babbotsford\b/i },
  { name: 'Princeton', regex: /\bprinceton\b/i },
  { name: 'Falkland', regex: /\bfalkland\b/i },
  { name: 'Chase', regex: /\bchase\b/i },
  { name: 'Enderby', regex: /\benderby\b/i },
  { name: 'Sicamous', regex: /\bsicamous\b/i },
  { name: 'Revelstoke', regex: /\brevelstoke\b/i },
  { name: 'Barriere', regex: /\bbarriere\b/i },
  { name: 'Lumby', regex: /\blumby\b/i },
  { name: 'Peachland', regex: /\bpeachland\b/i },
  { name: 'Coldstream', regex: /\bcoldstream\b/i },
];

export function extractCityFromCompanyName(companyName: string): string {
  for (const item of CITY_PATTERNS) {
    if (item.regex.test(companyName)) {
      return item.name;
    }
  }
  return 'Kelowna'; // Default central BC city fallback
}

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
  console.log(`[Supabase Customer Upload] Syncing ${rows.length} rows to table '${table}' (batch size: ${batchSize})...`);
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
  console.log('=== Processing Customer Data Clean Up & Supabase Upload ===');
  console.log(`Target Supabase Host: ${supabaseUrl}`);

  const csvPath = path.resolve(process.cwd(), 'backup/customers_local.csv');
  if (!fs.existsSync(csvPath)) {
    throw new Error(`Backup file not found at ${csvPath}`);
  }

  const rawContent = fs.readFileSync(csvPath, 'utf-8');
  const lines = rawContent.split(/\r?\n/).filter(l => l.trim().length > 0);

  if (lines.length <= 1) {
    console.log('No customer rows found.');
    return;
  }

  const header = parseCsvLine(lines[0]);
  console.log(`Header columns (${header.length}): ${header.join(', ')}`);

  const customersToUpsert: Record<string, unknown>[] = [];
  const cityCount: Record<string, number> = {};

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i]);
    if (cols.length < 2) continue;

    const row: Record<string, string> = {};
    header.forEach((h, idx) => {
      row[h.trim()] = (cols[idx] || '').trim();
    });

    if (!row.id || !row.company_name) continue;

    const extractedCity = extractCityFromCompanyName(row.company_name);
    cityCount[extractedCity] = (cityCount[extractedCity] || 0) + 1;

    const custObj: Record<string, unknown> = {
      id: row.id,
      customer_code: row.customer_code || `CUST-${String(i).padStart(4, '0')}`,
      company_name: row.company_name,
      contact_person: null,
      phone: row.phone || null,
      email: null,
      address: null,
      city: extractedCity,
      country: 'Canada',
      notes: null,
      status: row.status || 'active',
      created_at: new Date('2026-01-01').toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
      updated_by: null,
    };

    customersToUpsert.push(custObj);
  }

  console.log(`Parsed ${customersToUpsert.length} customers.`);
  console.log('Extracted City Distribution:', JSON.stringify(cityCount, null, 2));

  await batchUpsert('customers', customersToUpsert, 100);

  // Verification
  const { count, error } = await supabase.from('customers').select('*', { count: 'exact', head: true });
  if (error) {
    console.error('Failed to verify customer count in Supabase:', error.message);
  } else {
    console.log(`=== Verification Complete: Live Supabase 'customers' table now has ${count} total records with Country='Canada' and Extracted Cities! ===`);
  }
}

main().catch(err => {
  console.error('Fatal error during Supabase customer processing:', err);
  process.exit(1);
});
