import { HTMLProductRecord, HTMLCustomerRecord, HTMLImportPreview } from '../types';

/**
 * Parses Product Information HTML File (e.g. Untitled-1.html)
 * Extracts the `const DATA = [...]` array of products.
 */
export function parseProductHTML(htmlContent: string): HTMLProductRecord[] {
  const products: HTMLProductRecord[] = [];

  // Match const DATA = [ ... ];
  const match = htmlContent.match(/const\s+DATA\s*=\s*(\[\s*\{[\s\S]*?\}\s*\]);/);
  if (!match || !match[1]) {
    // Alternative match if formatted slightly differently
    const altMatch = htmlContent.match(/DATA\s*=\s*(\[\s*\{[\s\S]*?\}\s*\])/);
    if (!altMatch || !altMatch[1]) {
      return products;
    }
    return parseProductJsonArray(altMatch[1]);
  }

  return parseProductJsonArray(match[1]);
}

function parseProductJsonArray(jsonText: string): HTMLProductRecord[] {
  try {
    const rawList = JSON.parse(jsonText);
    if (!Array.isArray(rawList)) return [];

    return rawList.map((item: any) => {
      const codeNum = Math.round(Number(item.itemCode || 0));
      const codeStr = String(codeNum);
      return {
        itemCode: codeStr,
        name: String(item.name || '').trim(),
        sku: String(item.sku || `ITEM-${codeStr}`).trim(),
        category: String(item.category || 'General Supplies').trim(),
        subcategory: item.subcategory ? String(item.subcategory).trim() : undefined,
        unitName: String(item.unitName || 'Pieces').trim(),
        salesUnitName: item.salesUnitName ? String(item.salesUnitName).trim() : undefined,
        unitGroup: item.unitGroup ? String(item.unitGroup).trim() : null,
        targets: Array.isArray(item.targets) ? item.targets : [],
        desiredSPBase: Number(item.desiredSPBase || 0),
        minSPBase: Number(item.minSPBase || 0),
        maxSPBase: Number(item.maxSPBase || 0),
      };
    });
  } catch (err) {
    console.error('Failed to parse Product JSON from HTML:', err);
    return [];
  }
}

/**
 * Parses Customer + Order History HTML File (e.g. index.html)
 * Extracts the `const RAW = { data: { ... } }` or `const DATA = { ... }` object mapping customer names to item arrays.
 */
export function parseCustomerHTML(htmlContent: string): HTMLCustomerRecord[] {
  const customerRecords: HTMLCustomerRecord[] = [];

  let dataObj: Record<string, any[]> | null = null;

  // Try extracting RAW object
  const rawStart = htmlContent.indexOf('const RAW = {');
  const rawEnd = htmlContent.indexOf('const DATA = RAW.data;', rawStart);

  if (rawStart !== -1 && rawEnd !== -1) {
    const jsText = htmlContent.substring(rawStart, rawEnd);
    try {
      const fn = new Function(jsText + '; return RAW.data;');
      dataObj = fn();
    } catch (e) {
      console.warn('Failed to extract via Function eval, trying regex fallback');
    }
  }

  if (!dataObj) {
    // Fallback: look for DATA = { ... } or RAW = { data: { ... } }
    const matchObj = htmlContent.match(/(?:const|var|let)?\s*RAW\s*=\s*\{\s*data\s*:\s*(\{[\s\S]*?\})\s*\};/);
    if (matchObj && matchObj[1]) {
      try {
        const fn = new Function('return ' + matchObj[1] + ';');
        dataObj = fn();
      } catch (e) {
        console.error('Fallback object parse failed:', e);
      }
    }
  }

  if (!dataObj) return customerRecords;

  for (const [custName, items] of Object.entries(dataObj)) {
    if (!Array.isArray(items)) continue;

    const parsedItems = items.map((row: any[]) => {
      return {
        itemCode: String(row[0] || '').trim(),
        itemName: String(row[1] || '').trim(),
        unit: String(row[2] || 'Pieces').trim(),
        price: Number(row[3] || 0),
        innerUnit: String(row[4] || 'Pieces').trim(),
        innerQty: Number(row[5] || 1),
        unitPrice: Number(row[6] || 0),
      };
    });

    customerRecords.push({
      customerName: custName.trim(),
      items: parsedItems,
    });
  }

  return customerRecords;
}

/**
 * Analyzes parsed products and customer historical records,
 * checking for duplicates, item code matches, and producing a complete import preview.
 */
export function analyzeAndBuildPreview(
  products: HTMLProductRecord[],
  customers: HTMLCustomerRecord[],
  existingProductSKUs: Set<string> = new Set(),
  existingCustomerNames: Set<string> = new Set()
): HTMLImportPreview {
  const warnings: string[] = [];

  // Track product codes & SKUs
  const productCodeMap = new Map<string, HTMLProductRecord>();
  const productSKUMap = new Map<string, HTMLProductRecord>();
  const normProductNameMap = new Map<string, HTMLProductRecord>();

  let duplicateProducts = 0;

  products.forEach((p) => {
    const code = p.itemCode;
    const normName = p.name.toLowerCase().trim();

    if (productCodeMap.has(code) || (p.sku && productSKUMap.has(p.sku))) {
      duplicateProducts++;
      warnings.push(`Duplicate Product Code/SKU detected: [${code}] ${p.name}`);
    } else {
      productCodeMap.set(code, p);
      if (p.sku) productSKUMap.set(p.sku, p);
      normProductNameMap.set(normName, p);
    }
  });

  const newProducts = products.length - duplicateProducts;

  // Track customers
  const normCustNameMap = new Map<string, string>();
  let duplicateCustomers = 0;

  customers.forEach((c) => {
    const normName = c.customerName.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (normCustNameMap.has(normName) || existingCustomerNames.has(c.customerName)) {
      duplicateCustomers++;
      warnings.push(`Potential Duplicate Customer detected: "${c.customerName}"`);
    } else {
      normCustNameMap.set(normName, c.customerName);
    }
  });

  const newCustomers = customers.length - duplicateCustomers;

  // Track Historical Customer-Product Relationships
  let historicalRelationships = 0;
  let relationshipsMatchedByCode = 0;
  let relationshipsNeedingReview = 0;

  customers.forEach((c) => {
    c.items.forEach((item) => {
      historicalRelationships++;
      const codeMatch = productCodeMap.has(item.itemCode);
      const nameMatch = normProductNameMap.has(item.itemName.toLowerCase().trim());

      if (codeMatch) {
        relationshipsMatchedByCode++;
      } else if (nameMatch) {
        relationshipsMatchedByCode++;
      } else {
        relationshipsNeedingReview++;
        warnings.push(`Historical Item [${item.itemCode}] "${item.itemName}" for customer "${c.customerName}" not found in main product catalog.`);
      }
    });
  });

  return {
    productsFound: products.length,
    newProducts,
    duplicateProducts,
    customersFound: customers.length,
    newCustomers,
    duplicateCustomers,
    historicalRelationships,
    relationshipsMatchedByCode,
    relationshipsNeedingReview,
    warnings,
    productDetails: products,
    customerDetails: customers,
  };
}
