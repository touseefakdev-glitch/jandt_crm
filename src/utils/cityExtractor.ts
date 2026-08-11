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
  return 'Kelowna'; // Central BC operations hub default
}
