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

function extractCity(str: string): string | null {
  if (!str) return null;
  for (const item of CITY_PATTERNS) {
    if (item.regex.test(str)) {
      return item.name;
    }
  }
  return null;
}

function cleanPhone(phoneRaw: string): string | null {
  if (!phoneRaw) return null;
  let p = phoneRaw.replace(/^['"\s]+/, '').replace(/['"\s]+$/, '');
  p = p.replace(/^\+1-?/, '').replace(/^\+1/, '');
  p = p.replace(/[^0-9]/g, '');
  if (p.length === 11 && p.startsWith('1')) {
    p = p.substring(1);
  }
  if (p.length === 10) {
    return p;
  }
  return phoneRaw.replace(/^['"\s]+/, '').replace(/['"\s]+$/, '') || null;
}

function normalizeName(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .trim();
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

async function main() {
  console.log('=== Matching Customer Data from Contacts (1).csv & Contacts.csv ===');

  // Load Contacts (1).csv
  const contacts1Path = 'C:\\Users\\TIW COMPUTER\\Desktop\\J&T VERNON\\Contacts (1).csv';
  const contacts1Content = fs.readFileSync(contacts1Path, 'utf-8');
  const contacts1Lines = contacts1Content.split(/\r?\n/).filter(l => l.trim().length > 0);

  interface ContactInfo {
    displayName: string;
    companyName: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    source: string;
  }

  const contactList: ContactInfo[] = [];
  const contactMap = new Map<string, ContactInfo>();

  for (let i = 1; i < contacts1Lines.length; i++) {
    const cols = parseCsvLine(contacts1Lines[i]);
    const displayName = (cols[0] || '').trim();
    const companyName = (cols[1] || '').trim();
    const firstName = (cols[3] || '').trim();
    const lastName = (cols[4] || '').trim();
    const email = (cols[5] || '').trim();
    const phone = (cols[6] || '').trim();

    if (!displayName && !companyName) continue;

    const info: ContactInfo = {
      displayName,
      companyName,
      firstName,
      lastName,
      email,
      phone,
      source: 'Contacts (1).csv'
    };

    contactList.push(info);
    if (displayName) contactMap.set(normalizeName(displayName), info);
    if (companyName) contactMap.set(normalizeName(companyName), info);
  }

  // Also load Contacts.csv for secondary phone lookup
  const contacts2Path = 'C:\\Users\\TIW COMPUTER\\Desktop\\J&T VERNON\\Contacts.csv';
  if (fs.existsSync(contacts2Path)) {
    const contacts2Content = fs.readFileSync(contacts2Path, 'utf-8');
    const contacts2Lines = contacts2Content.split(/\r?\n/).filter(l => l.trim().length > 0);
    const contacts2Header = parseCsvLine(contacts2Lines[0]);
    const nameIdx = contacts2Header.indexOf('Name');
    const compIdx = contacts2Header.indexOf('Company Name');
    const emailIdx = contacts2Header.indexOf('Email');
    const phoneIdx = contacts2Header.indexOf('Work Phone');

    for (let i = 1; i < contacts2Lines.length; i++) {
      const cols = parseCsvLine(contacts2Lines[i]);
      const name = (cols[nameIdx] || '').trim();
      const companyName = (cols[compIdx] || '').trim();
      const email = (cols[emailIdx] || '').trim();
      const phone = (cols[phoneIdx] || '').trim();

      if (!name && !companyName) continue;

      const norm1 = normalizeName(name);
      const norm2 = normalizeName(companyName);

      if (norm1 && !contactMap.has(norm1)) {
        contactMap.set(norm1, { displayName: name, companyName, firstName: '', lastName: '', email, phone, source: 'Contacts.csv' });
      }
      if (norm2 && !contactMap.has(norm2)) {
        contactMap.set(norm2, { displayName: name, companyName, firstName: '', lastName: '', email, phone, source: 'Contacts.csv' });
      }
    }
  }

  console.log(`Loaded ${contactList.length} contacts from Contacts (1).csv (${contactMap.size} normalized keys).`);

  // Load existing customers from Supabase
  const { data: dbCustomers, error: dbErr } = await supabase.from('customers').select('*');
  if (dbErr || !dbCustomers) {
    console.error('Error fetching customers from Supabase:', dbErr?.message);
    return;
  }

  console.log(`Total live customers in Supabase: ${dbCustomers.length}`);

  let phoneUpdatedCount = 0;
  let cityUpdatedCount = 0;
  let matchedCount = 0;

  const updatedCustomers: Record<string, unknown>[] = [];

  for (const cust of dbCustomers) {
    const normComp = normalizeName(cust.company_name);
    let matchedContact = contactMap.get(normComp);

    if (!matchedContact) {
      for (const info of contactList) {
        const normD = normalizeName(info.displayName);
        const normC = normalizeName(info.companyName);
        if ((normD && (normD.includes(normComp) || normComp.includes(normD))) ||
            (normC && (normC.includes(normComp) || normComp.includes(normC)))) {
          matchedContact = info;
          break;
        }
      }
    }

    let finalPhone = cust.phone;
    let finalCity = cust.city;

    if (matchedContact) {
      matchedCount++;

      if (matchedContact.phone) {
        const cleaned = cleanPhone(matchedContact.phone);
        if (cleaned && cleaned !== cust.phone) {
          finalPhone = cleaned;
          phoneUpdatedCount++;
        }
      }

      const cityFromContact = extractCity(matchedContact.displayName) || extractCity(matchedContact.companyName);
      if (cityFromContact && cityFromContact !== cust.city) {
        finalCity = cityFromContact;
        cityUpdatedCount++;
      }
    }

    if (!finalCity) {
      finalCity = extractCity(cust.company_name) || 'Kelowna';
    }

    const contactPerson = (matchedContact && matchedContact.firstName)
      ? `${matchedContact.firstName} ${matchedContact.lastName}`.trim()
      : cust.contact_person;

    const updatedCustObj: Record<string, unknown> = {
      id: cust.id,
      customer_code: cust.customer_code,
      company_name: cust.company_name,
      contact_person: contactPerson || null,
      phone: finalPhone || null,
      city: finalCity,
      country: 'Canada',
      notes: cust.notes || null,
      status: cust.status || 'active',
      updated_at: new Date().toISOString()
    };

    updatedCustomers.push(updatedCustObj);
  }

  console.log(`\nMatch Summary:`);
  console.log(`Matched Customers: ${matchedCount} / ${dbCustomers.length}`);
  console.log(`Phone/Mobile Numbers Updated: ${phoneUpdatedCount}`);
  console.log(`Cities Updated/Refined: ${cityUpdatedCount}`);

  // Batch update Supabase
  console.log(`\n[Supabase Upload] Syncing ${updatedCustomers.length} customer records to Supabase 'customers' table...`);
  for (let i = 0; i < updatedCustomers.length; i += 100) {
    const chunk = updatedCustomers.slice(i, i + 100);
    const { error: upsertErr } = await supabase.from('customers').upsert(chunk, { onConflict: 'id' });
    if (upsertErr) {
      console.error(`Error updating batch ${i / 100 + 1}:`, upsertErr.message);
      throw upsertErr;
    }
  }

  // Also update backup/customers_local.csv for local consistency
  const csvPath = path.resolve(process.cwd(), 'backup/customers_local.csv');
  let newCsvContent = 'id,customer_code,company_name,phone,whatsapp_number,city,route,country,status\n';

  updatedCustomers.forEach((c) => {
    const phoneVal = (c.phone as string) || '';
    const cityVal = (c.city as string) || '';
    const compVal = (c.company_name as string).includes(',') ? `"${c.company_name}"` : c.company_name;
    newCsvContent += `${c.id},${c.customer_code},${compVal},${phoneVal},${phoneVal},${cityVal},,Canada,active\n`;
  });

  fs.writeFileSync(csvPath, newCsvContent, 'utf-8');
  console.log(`Local backup file updated: ${csvPath}`);

  console.log(`=== Verification Complete: Live Supabase 'customers' table & backup CSV successfully updated with phone/mobile numbers and cities! ===`);
}

main().catch(err => {
  console.error('Fatal error during contact matching:', err);
  process.exit(1);
});
