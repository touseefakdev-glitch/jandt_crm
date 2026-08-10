import Papa from 'papaparse';
import { 
  ImportType, 
  ImportStrategy, 
  ImportJob, 
  ImportErrorItem, 
  ImportDuplicateItem,
  ProductAvailabilityStatus,
  Customer,
  Product
} from '../types';
import { localDb } from '../services/db';

export const MAX_CSV_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB Limit

// Normalized availability values (spec supports only Available and Out of Stock)
export function normalizeAvailability(raw: string | undefined | null): ProductAvailabilityStatus | null {
  if (!raw) return null;
  const clean = raw.trim().toLowerCase();
  if (clean === 'available' || clean === 'in stock') {
    return 'available';
  }
  if (clean === 'out of stock' || clean === 'outofstock' || clean === 'out_of_stock' || clean === 'unavailable') {
    return 'out_of_stock';
  }
  return null;
}

// Safe phone / whatsapp normalization layer (preserves string type, leading zeros, country codes)
export function normalizePhoneNumber(raw: string | undefined | null): string {
  if (!raw) return '';
  return raw.trim();
}

// Download template files
export function downloadProductsTemplate() {
  const headers = ['product_name', 'category', 'sku', 'availability'];
  const sampleRow1 = ['"[EXAMPLE ROW - REMOVE BEFORE IMPORT] Premium Paper"', '"A4 Paper"', '"PP-001"', '"Available"'];
  const sampleRow2 = ['"Blue Pen"', '"Stationery"', '"BP-002"', '"Out of Stock"'];
  const sampleRow3 = ['"Printer Toner"', '"Toner"', '"PT-003"', '"Available"'];

  const csvContent = [headers.join(','), sampleRow1.join(','), sampleRow2.join(','), sampleRow3.join(',')].join('\n');
  downloadBlob(csvContent, 'products_import_template.csv', 'text/csv;charset=utf-8;');
}

export function downloadCustomersTemplate() {
  const headers = ['customer_name', 'whatsapp_number', 'phone_number', 'city', 'route'];
  const sampleRow1 = ['"[EXAMPLE ROW - REMOVE BEFORE IMPORT] ABC Traders"', '"03001234567"', '"0911234567"', '"Peshawar"', '"Route 1"'];
  const sampleRow2 = ['"XYZ Supplies"', '"03007654321"', '"0917654321"', '"Charsadda"', '"Route 2"'];

  const csvContent = [headers.join(','), sampleRow1.join(','), sampleRow2.join(',')].join('\n');
  downloadBlob(csvContent, 'customers_import_template.csv', 'text/csv;charset=utf-8;');
}

export function downloadBlob(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadErrorReportCSV(filename: string, errors: ImportErrorItem[]) {
  const headers = ['Row Number', 'Error Reason', 'Original Row Data'];
  const rows = errors.map(err => {
    const originalStr = JSON.stringify(err.data).replace(/"/g, '""');
    const reasonStr = err.error.replace(/"/g, '""');
    return `"${err.row}","${reasonStr}","${originalStr}"`;
  });
  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadBlob(csvContent, filename, 'text/csv;charset=utf-8;');
}

export interface CSVParseResult {
  importType: ImportType;
  totalRows: number;
  validRows: Record<string, string>[];
  errors: ImportErrorItem[];
  duplicates: ImportDuplicateItem[];
  headers: string[];
}

export function parseAndValidateCSV(file: File, importType: ImportType): Promise<CSVParseResult> {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_CSV_FILE_SIZE_BYTES) {
      reject(new Error('The CSV file is too large. Please split it into smaller files (Max 5MB).'));
      return;
    }

    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Failed to read CSV file. Please ensure file is valid.'));
    reader.onload = (e) => {
      let content = e.target?.result as string;
      if (!content) {
        reject(new Error('CSV file is empty.'));
        return;
      }

      // Remove UTF-8 BOM if present
      if (content.charCodeAt(0) === 0xFEFF) {
        content = content.slice(1);
      }

      Papa.parse<Record<string, string>>(content, {
        header: true,
        skipEmptyLines: 'greedy',
        transformHeader: (header) => header.trim().toLowerCase(),
        complete: (results) => {
          try {
            const headers = results.meta.fields || [];
            const rows = results.data;
            const validation = validateCSVRows(rows, headers, importType);
            resolve(validation);
          } catch (err: any) {
            reject(new Error(err.message || 'Error processing CSV rows.'));
          }
        },
        error: (err: Error) => {
          reject(new Error(`CSV Parsing error: ${err.message}`));
        }
      });
    };

    reader.readAsText(file, 'UTF-8');
  });
}

function validateCSVRows(
  rows: Record<string, string>[],
  headers: string[],
  importType: ImportType
): CSVParseResult {
  const normalizedHeaders = headers.map(h => h.trim().toLowerCase());
  const validRows: Record<string, string>[] = [];
  const errors: ImportErrorItem[] = [];
  const duplicates: ImportDuplicateItem[] = [];

  if (importType === 'products') {
    const required = ['product_name', 'sku', 'availability'];
    const missing = required.filter(r => !normalizedHeaders.includes(r));
    if (missing.length > 0) {
      throw new Error(`CSV is missing required product header(s): ${missing.join(', ')}. Expected: product_name, category, sku, availability.`);
    }

    const existingProducts = localDb.getProducts();
    const seenSkusInCSV = new Set<string>();

    rows.forEach((row, idx) => {
      const rowNum = idx + 2; // Row 1 is header
      const name = (row['product_name'] || '').trim();
      const sku = (row['sku'] || '').trim().toUpperCase();
      const category = (row['category'] || '').trim();
      const rawAvailability = (row['availability'] || '').trim();

      // Check if user left example row
      if (name.includes('[EXAMPLE ROW') || sku === 'PP-001' && idx === 0 && name.includes('Example')) {
        return; // Ignore example row cleanly
      }

      if (!name) {
        errors.push({ row: rowNum, data: row, error: 'Product Name is missing.' });
        return;
      }
      if (!sku) {
        errors.push({ row: rowNum, data: row, error: 'SKU is missing.' });
        return;
      }

      // Availability validation
      const normAvailability = normalizeAvailability(rawAvailability);
      if (!normAvailability) {
        errors.push({ 
          row: rowNum, 
          data: row, 
          error: `Invalid availability value: "${rawAvailability}". Supported values: "Available", "Out of Stock".` 
        });
        return;
      }

      // Check SKU duplicate inside uploaded CSV
      if (seenSkusInCSV.has(sku)) {
        errors.push({ row: rowNum, data: row, error: `SKU "${sku}" is duplicated within this uploaded CSV file.` });
        return;
      }
      seenSkusInCSV.add(sku);

      // Check SKU existing in DB
      const existingInDb = existingProducts.find(p => p.sku.toUpperCase() === sku);
      if (existingInDb) {
        duplicates.push({
          row: rowNum,
          data: row,
          existing_id: existingInDb.id,
          existing_name: existingInDb.product_name,
          existing_identifier: existingInDb.sku,
          reason: `SKU "${sku}" already exists in product catalog.`
        });
      }

      validRows.push({
        product_name: name,
        category: category,
        sku: sku,
        availability: normAvailability === 'available' ? 'Available' : 'Out of Stock',
        norm_availability: normAvailability,
      });
    });

  } else {
    // Customers CSV
    const required = ['customer_name'];
    const missing = required.filter(r => !normalizedHeaders.includes(r));
    if (missing.length > 0) {
      throw new Error(`CSV is missing required customer header: ${missing.join(', ')}. Expected: customer_name, whatsapp_number, phone_number, city, route.`);
    }

    const existingCustomers = localDb.getCustomers();

    rows.forEach((row, idx) => {
      const rowNum = idx + 2;
      const name = (row['customer_name'] || row['company_name'] || '').trim();
      const whatsapp = normalizePhoneNumber(row['whatsapp_number'] || row['whatsapp']);
      const phone = normalizePhoneNumber(row['phone_number'] || row['phone']);
      const city = (row['city'] || '').trim();
      const route = (row['route'] || '').trim();

      // Ignore example row if kept
      if (name.includes('[EXAMPLE ROW') || (name.includes('Example') && idx === 0)) {
        return;
      }

      if (!name) {
        errors.push({ row: rowNum, data: row, error: 'Customer Name is missing.' });
        return;
      }

      // Duplicate match logic (matching phone, whatsapp, or name+phone)
      const existingMatch = existingCustomers.find(c => {
        if (whatsapp && c.whatsapp_number && c.whatsapp_number.trim() === whatsapp) return true;
        if (phone && c.phone && c.phone.trim() === phone) return true;
        if (whatsapp && c.phone && c.phone.trim() === whatsapp) return true;
        if (phone && c.whatsapp_number && c.whatsapp_number.trim() === phone) return true;
        if (c.company_name.toLowerCase().trim() === name.toLowerCase() && (phone || whatsapp)) return true;
        return false;
      });

      if (existingMatch) {
        duplicates.push({
          row: rowNum,
          data: row,
          existing_id: existingMatch.id,
          existing_name: existingMatch.company_name,
          existing_identifier: existingMatch.phone || existingMatch.whatsapp_number || existingMatch.customer_code,
          reason: `Potential duplicate matching existing customer "${existingMatch.company_name}" (${existingMatch.customer_code}).`
        });
      }

      validRows.push({
        customer_name: name,
        whatsapp_number: whatsapp,
        phone_number: phone,
        city: city,
        route: route,
      });
    });
  }

  return {
    importType,
    totalRows: rows.length,
    validRows,
    errors,
    duplicates,
    headers: normalizedHeaders
  };
}

export interface ExecuteImportParams {
  importType: ImportType;
  importStrategy: ImportStrategy;
  fileName: string;
  validRows: Record<string, string>[];
  errors: ImportErrorItem[];
  duplicates: ImportDuplicateItem[];
  userId: string;
}

export function executeImport(params: ExecuteImportParams): ImportJob {
  const { importType, importStrategy, fileName, validRows, errors, duplicates, userId } = params;
  const startedAt = new Date().toISOString();

  let createdCount = 0;
  let updatedCount = 0;
  let skippedCount = 0;
  let failedCount = errors.length;
  const finalErrors: ImportErrorItem[] = [...errors];

  if (importType === 'products') {
    const categories = localDb.getProductCategories();
    const existingProducts = localDb.getProducts();

    validRows.forEach((row, idx) => {
      try {
        const sku = row.sku.trim().toUpperCase();
        const productName = row.product_name.trim();
        const categoryName = (row.category || '').trim();
        const normStatus = (row.norm_availability || 'available') as ProductAvailabilityStatus;

        // Resolve or default category
        let categoryId: string | undefined = undefined;
        if (categoryName) {
          const matchedCat = categories.find(c => c.name.toLowerCase() === categoryName.toLowerCase());
          if (matchedCat) {
            categoryId = matchedCat.id;
          } else {
            // Auto create category if not exists
            const newCat = localDb.addProductCategory({ name: categoryName, is_active: true }, userId);
            categoryId = newCat.id;
            categories.push(newCat);
          }
        }

        const existingProd = existingProducts.find(p => p.sku.toUpperCase() === sku);

        if (existingProd) {
          if (importStrategy === 'skip_existing') {
            skippedCount++;
            return;
          }

          if (importStrategy === 'create_new_only') {
            skippedCount++;
            return;
          }

          if (importStrategy === 'update_existing') {
            const previousStatus = existingProd.availability_status;

            // Update basic product details
            localDb.updateProduct(existingProd.id, {
              sku,
              product_name: productName,
              category_id: categoryId || existingProd.category_id || undefined,
              unit_price: existingProd.unit_price,
            }, userId);

            // Handle Availability Changes
            if (previousStatus !== normStatus) {
              const reason = normStatus === 'out_of_stock' 
                ? 'Availability updated via CSV import.' 
                : 'Availability restored via CSV import.';
              localDb.changeProductAvailability(existingProd.id, normStatus, reason, null, userId);
            }

            updatedCount++;
          }
        } else {
          // Create New Product
          localDb.createProduct({
            sku,
            product_name: productName,
            category_id: categoryId,
            unit_price: 0.00,
            availability_status: normStatus,
            availability_notes: normStatus === 'out_of_stock' ? 'Initial import status.' : undefined,
            is_active: true,
          }, userId);

          createdCount++;
        }
      } catch (err: any) {
        failedCount++;
        finalErrors.push({
          row: idx + 2,
          data: row,
          error: err.message || 'Failed to process product row.'
        });
      }
    });

  } else {
    // Customer Import Execution
    const existingCustomers = localDb.getCustomers();

    validRows.forEach((row, idx) => {
      try {
        const name = row.customer_name.trim();
        const whatsapp = row.whatsapp_number ? row.whatsapp_number.trim() : undefined;
        const phone = row.phone_number ? row.phone_number.trim() : undefined;
        const city = row.city ? row.city.trim() : undefined;
        const route = row.route ? row.route.trim() : undefined;

        // Match existing customer
        const existingCust = existingCustomers.find(c => {
          if (whatsapp && c.whatsapp_number && c.whatsapp_number.trim() === whatsapp) return true;
          if (phone && c.phone && c.phone.trim() === phone) return true;
          if (c.company_name.toLowerCase().trim() === name.toLowerCase() && (phone || whatsapp)) return true;
          return false;
        });

        if (existingCust) {
          if (importStrategy === 'skip_existing') {
            skippedCount++;
            return;
          }

          if (importStrategy === 'create_new_only') {
            skippedCount++;
            return;
          }

          if (importStrategy === 'update_existing') {
            localDb.updateCustomer(existingCust.id, {
              company_name: name,
              phone: phone || existingCust.phone || undefined,
              whatsapp_number: whatsapp || existingCust.whatsapp_number || undefined,
              city: city || existingCust.city || undefined,
              route: route || existingCust.route || undefined,
            }, userId);
            updatedCount++;
          }
        } else {
          // Create New Customer
          localDb.createCustomer({
            company_name: name,
            phone: phone,
            whatsapp_number: whatsapp,
            city: city,
            route: route,
            status: 'active',
          }, userId);
          createdCount++;
        }
      } catch (err: any) {
        failedCount++;
        finalErrors.push({
          row: idx + 2,
          data: row,
          error: err.message || 'Failed to process customer row.'
        });
      }
    });
  }

  const completedAt = new Date().toISOString();
  const totalRows = createdCount + updatedCount + skippedCount + failedCount;
  const status = failedCount > 0 ? 'completed_with_errors' : 'completed';

  const importJob: ImportJob = {
    id: crypto.randomUUID(),
    import_type: importType,
    file_name: fileName,
    import_strategy: importStrategy,
    total_rows: totalRows,
    created_count: createdCount,
    updated_count: updatedCount,
    skipped_count: skippedCount,
    failed_count: failedCount,
    status: status,
    started_at: startedAt,
    completed_at: completedAt,
    created_by: userId,
    errors: finalErrors.length > 0 ? finalErrors : undefined,
  };

  localDb.saveImportJob(importJob);

  // System Audit Logging
  localDb.logAudit({
    user_id: userId,
    action: importType === 'products' ? 'import_products' : 'import_customers',
    entity_type: 'import_job',
    entity_id: importJob.id,
    entity_number: fileName,
    summary: `Admin imported ${importType} via CSV (${fileName}). Created: ${createdCount}, Updated: ${updatedCount}, Skipped: ${skippedCount}, Failed: ${failedCount}`,
    previous_value: null,
    new_value: `Strategy: ${importStrategy}, Total: ${totalRows}`,
  });

  return importJob;
}
