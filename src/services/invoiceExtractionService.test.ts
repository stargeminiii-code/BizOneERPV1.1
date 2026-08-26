import { describe, it, expect } from 'vitest';
import {
  mapDescriptionToSku,
  validateExtractedInvoice,
  determineInvoiceDirection,
  generateJournalEntries,
  executeAtomicPosting,
  DEFAULT_COMPANY_TAX_CODE
} from './invoiceExtractionService';
import { Product, InventoryLayer, ExtractedInvoiceSchema, MappedInvoiceItem } from '../types';

describe('e-Invoice Extraction Unit Tests', () => {
  it('runs all invoice extraction and accounting unit tests successfully', () => {
    const out = runInvoiceExtractionUnitTests();
    expect(out.failed).toBe(0);
    expect(out.passed).toBe(out.total);
  });
});

/**
 * Unit Test Suite for e-Invoice Extraction, SKU Mapping, Validation & Accounting
 */
export function runInvoiceExtractionUnitTests(): {
  total: number;
  passed: number;
  failed: number;
  results: { testName: string; passed: boolean; message?: string }[];
} {
  const results: { testName: string; passed: boolean; message?: string }[] = [];

  const mockProducts: Product[] = [
    {
      id: 'prod-1',
      productId: 'P000001',
      code: 'TP-5LY',
      sku: 'TP-5LY',
      name: 'Thép tấm 5 ly cán nóng SS400',
      unit: 'kg',
      costPrice: 18000,
      sellingPrice: 22000,
      stock: 1000,
      category: 'Thép công nghiệp',
      minStock: 200,
      location: 'Kệ A01',
      supplierName: 'Công ty CP Thép Miền Bắc'
    },
    {
      id: 'prod-2',
      productId: 'P000002',
      code: 'TH-4080',
      sku: 'TH-4080',
      name: 'Thép hộp mạ kẽm Hòa Phát 40x80x1.8mm',
      unit: 'Cây',
      costPrice: 240000,
      sellingPrice: 280000,
      stock: 150,
      category: 'Thép hộp',
      minStock: 30,
      location: 'Kệ B02',
      supplierName: 'Hòa Phát Steel'
    }
  ];

  // -------------------------------------------------------------------------
  // TEST 1: Exact & Fuzzy SKU Mapping
  // -------------------------------------------------------------------------
  try {
    // 1.1 Exact SKU Match
    const match1 = mapDescriptionToSku('TP-5LY', mockProducts);
    if (match1.matchedSku === 'TP-5LY' && match1.matchType === 'exact' && match1.matchConfidence === 1.0) {
      results.push({ testName: 'TEST 1.1: Exact SKU Matching', passed: true });
    } else {
      results.push({ testName: 'TEST 1.1: Exact SKU Matching', passed: false, message: `Expected TP-5LY exact, got ${match1.matchedSku}` });
    }

    // 1.2 Fuzzy / Name Match with diacritics removal
    const match2 = mapDescriptionToSku('Thep tam 5 ly can nong ss400', mockProducts);
    if (match2.matchedSku === 'TP-5LY') {
      results.push({ testName: 'TEST 1.2: Fuzzy Matching with Diacritics Removal', passed: true });
    } else {
      results.push({ testName: 'TEST 1.2: Fuzzy Matching with Diacritics Removal', passed: false, message: `Fuzzy failed to match TP-5LY` });
    }

    // 1.3 Unmatched handling
    const match3 = mapDescriptionToSku('Sản phẩm lạ chưa có trong kho', mockProducts);
    if (match3.matchedSku === null && match3.needsManualReview === true) {
      results.push({ testName: 'TEST 1.3: Unmatched SKU Flags Manual Review', passed: true });
    } else {
      results.push({ testName: 'TEST 1.3: Unmatched SKU Flags Manual Review', passed: false });
    }
  } catch (err: any) {
    results.push({ testName: 'TEST 1: SKU Mapping Exception', passed: false, message: err.message });
  }

  // -------------------------------------------------------------------------
  // TEST 2: Direction Detection (Inbound vs Outbound)
  // -------------------------------------------------------------------------
  try {
    const inboundSchema: ExtractedInvoiceSchema = {
      invoice_meta: { series: '1C26TMB', invoice_no: '001', issue_date: '2026-08-20', tax_auth_code: null, lookup_code: null, lookup_url: null },
      seller: { name: 'NCC Thép', tax_code: '0102345678', address: 'HN' },
      buyer: { company_name: 'Việt Phát ERP', tax_code: DEFAULT_COMPANY_TAX_CODE, address: 'HN' },
      line_items: [],
      totals: { amount_before_tax: 0, vat_amount: 0, amount_after_tax: 0, breakdown_by_rate: { rate_0: { before_tax: 0, vat_amount: 0 }, rate_5: { before_tax: 0, vat_amount: 0 }, rate_8: { before_tax: 0, vat_amount: 0 }, rate_10: { before_tax: 0, vat_amount: 0 } } }
    };
    const dirIn = determineInvoiceDirection(inboundSchema, DEFAULT_COMPANY_TAX_CODE);
    if (dirIn === 'inbound') {
      results.push({ testName: 'TEST 2.1: Inbound Invoice Direction Detection', passed: true });
    } else {
      results.push({ testName: 'TEST 2.1: Inbound Invoice Direction Detection', passed: false });
    }

    const outboundSchema: ExtractedInvoiceSchema = {
      ...inboundSchema,
      seller: { name: 'Việt Phát ERP', tax_code: DEFAULT_COMPANY_TAX_CODE, address: 'HN' },
      buyer: { company_name: 'Khách hàng ABC', tax_code: '0109999999', address: 'HN' }
    };
    const dirOut = determineInvoiceDirection(outboundSchema, DEFAULT_COMPANY_TAX_CODE);
    if (dirOut === 'outbound') {
      results.push({ testName: 'TEST 2.2: Outbound Invoice Direction Detection', passed: true });
    } else {
      results.push({ testName: 'TEST 2.2: Outbound Invoice Direction Detection', passed: false });
    }
  } catch (err: any) {
    results.push({ testName: 'TEST 2: Direction Detection Exception', passed: false, message: err.message });
  }

  // -------------------------------------------------------------------------
  // TEST 3: Validation Engine & Discrepancy Blocking
  // -------------------------------------------------------------------------
  try {
    const validItems: MappedInvoiceItem[] = [
      {
        stt: 1,
        rawDescription: 'Thép tấm 5 ly',
        matchedSku: 'TP-5LY',
        matchedProductId: 'prod-1',
        matchedProductName: 'Thép tấm 5 ly',
        matchedUnit: 'kg',
        matchConfidence: 1,
        matchType: 'exact',
        needsManualReview: false,
        quantity: 100,
        unitPrice: 18000,
        amountBeforeTax: 1800000, // 100 * 18000 = 1,800,000
        vatRate: 8,
        vatAmount: 144000, // 1,800,000 * 8% = 144,000
        amountAfterTax: 1944000,
        lineValidationStatus: 'valid'
      }
    ];

    const validSchema: ExtractedInvoiceSchema = {
      invoice_meta: { series: '1C26TMB', invoice_no: '001', issue_date: '2026-08-20', tax_auth_code: null, lookup_code: null, lookup_url: null },
      seller: { name: 'NCC', tax_code: '0102345678', address: 'HN' },
      buyer: { company_name: 'VP', tax_code: DEFAULT_COMPANY_TAX_CODE, address: 'HN' },
      line_items: [],
      totals: {
        amount_before_tax: 1800000,
        vat_amount: 144000,
        amount_after_tax: 1944000,
        breakdown_by_rate: {
          rate_0: { before_tax: 0, vat_amount: 0 },
          rate_5: { before_tax: 0, vat_amount: 0 },
          rate_8: { before_tax: 1800000, vat_amount: 144000 },
          rate_10: { before_tax: 0, vat_amount: 0 }
        }
      }
    };

    const validCheck = validateExtractedInvoice(validSchema, validItems);
    if (validCheck.validationStatus === 'passed' && validCheck.validationErrors.length === 0) {
      results.push({ testName: 'TEST 3.1: Valid Calculation Passes Validation', passed: true });
    } else {
      results.push({ testName: 'TEST 3.1: Valid Calculation Passes Validation', passed: false, message: JSON.stringify(validCheck.validationErrors) });
    }

    // Invalid item (Calculation mismatch)
    const invalidItems: MappedInvoiceItem[] = [
      {
        ...validItems[0],
        amountBeforeTax: 2500000 // Incorrect: 100 * 18,000 = 1,800,000 != 2,500,000
      }
    ];
    const invalidCheck = validateExtractedInvoice(validSchema, invalidItems);
    if (invalidCheck.validationStatus === 'has_errors') {
      results.push({ testName: 'TEST 3.2: Math Discrepancy Correctly Flagged as Error', passed: true });
    } else {
      results.push({ testName: 'TEST 3.2: Math Discrepancy Correctly Flagged as Error', passed: false });
    }
  } catch (err: any) {
    results.push({ testName: 'TEST 3: Validation Engine Exception', passed: false, message: err.message });
  }

  // -------------------------------------------------------------------------
  // TEST 4: Double-Entry Journal Entry Generation by Tax Rate
  // -------------------------------------------------------------------------
  try {
    const rawInv: any = {
      id: 'RAW-TEST',
      invoiceDirection: 'inbound',
      uploadedBy: 'Tester',
      extractedData: {
        invoice_meta: { series: '1C26', invoice_no: '001', issue_date: '2026-08-20' },
        seller: { name: 'Công ty Cổ phần Thép Miền Bắc', tax_code: '0102345678' },
        buyer: { company_name: 'Việt Phát', tax_code: DEFAULT_COMPANY_TAX_CODE },
        totals: { amount_before_tax: 10000000, vat_amount: 800000, amount_after_tax: 10800000 }
      },
      mappedItems: [
        {
          stt: 1,
          rawDescription: 'Thép',
          matchedSku: 'TP-5LY',
          quantity: 100,
          unitPrice: 100000,
          amountBeforeTax: 10000000,
          vatRate: 8,
          vatAmount: 800000,
          amountAfterTax: 10800000
        }
      ]
    };

    const journal = generateJournalEntries(rawInv);
    const has156 = journal.lines.some((l) => l.accountCode === '1561' && l.debitAmount === 10000000);
    const has1331 = journal.lines.some((l) => l.accountCode === '1331' && l.debitAmount === 800000 && l.vatRate === 8);
    const has331 = journal.lines.some((l) => l.accountCode === '331' && l.creditAmount === 10800000);

    if (has156 && has1331 && has331 && journal.isBalanced) {
      results.push({ testName: 'TEST 4: Inbound Journal Entry (TK 156 / 1331 / 331) Generated & Balanced', passed: true });
    } else {
      results.push({ testName: 'TEST 4: Inbound Journal Entry Generated & Balanced', passed: false, message: JSON.stringify(journal.lines) });
    }
  } catch (err: any) {
    results.push({ testName: 'TEST 4: Journal Entry Exception', passed: false, message: err.message });
  }

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  return {
    total: results.length,
    passed,
    failed,
    results
  };
}
