import {
  ExtractedInvoiceSchema,
  ExtractedLineItem,
  ExtractedTotals,
  JournalEntry,
  JournalEntryLine,
  MappedInvoiceItem,
  Product,
  RawExtractedInvoice,
  ValidationErrorDetail,
  InventoryLayer,
  PurchaseOrder,
  PurchaseOrderItem,
  Order,
  OrderItem,
  StockTransaction,
  AuditLog,
} from '../types';
import { fifoEngine } from './fifoEngine';

// Default company Tax Code (BizOne ERP company profile)
export const DEFAULT_COMPANY_TAX_CODE = '0108998822';
export const DEFAULT_COMPANY_NAME = 'CÔNG TY CỔ PHẦN THƯƠNG MẠI & PHÂN PHỐI VIỆT PHÁT';

// Helper: Normalize string for fuzzy matching (remove Vietnamese diacritics & punctuation)
export function normalizeVietnameseText(str: string): string {
  if (!str) return '';
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'd')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Calculate similarity score between two strings (0.0 to 1.0)
export function calculateTextSimilarity(str1: string, str2: string): number {
  const s1 = normalizeVietnameseText(str1);
  const s2 = normalizeVietnameseText(str2);

  if (!s1 || !s2) return 0;
  if (s1 === s2) return 1.0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.88;

  const words1 = new Set(s1.split(' ').filter((w) => w.length > 1));
  const words2 = new Set(s2.split(' ').filter((w) => w.length > 1));

  if (words1.size === 0 || words2.size === 0) return 0;

  let intersectionCount = 0;
  words1.forEach((w) => {
    if (words2.has(w)) intersectionCount++;
  });

  const unionCount = new Set([...words1, ...words2]).size;
  return intersectionCount / unionCount;
}

// -------------------------------------------------------------------------
// STEP 1 & 2: MAPPING HÀNG HÓA SANG SKU / PRODUCT_ID
// -------------------------------------------------------------------------
export function mapDescriptionToSku(
  description: string,
  products: Product[],
  unit?: string | null
): {
  matchedSku: string | null;
  matchedProductId: string | null;
  matchedProductName: string | null;
  matchedUnit: string | null;
  matchConfidence: number;
  matchType: 'exact' | 'fuzzy' | 'manual' | 'unmatched';
  needsManualReview: boolean;
} {
  if (!description || products.length === 0) {
    return {
      matchedSku: null,
      matchedProductId: null,
      matchedProductName: null,
      matchedUnit: unit || null,
      matchConfidence: 0,
      matchType: 'unmatched',
      needsManualReview: true,
    };
  }

  const rawNorm = normalizeVietnameseText(description);

  // 1. EXACT MATCH on code, sku, or full name
  for (const p of products) {
    if (
      p.sku.toLowerCase() === description.trim().toLowerCase() ||
      p.code.toLowerCase() === description.trim().toLowerCase() ||
      p.name.toLowerCase() === description.trim().toLowerCase()
    ) {
      return {
        matchedSku: p.sku,
        matchedProductId: p.id,
        matchedProductName: p.name,
        matchedUnit: p.unit,
        matchConfidence: 1.0,
        matchType: 'exact',
        needsManualReview: false,
      };
    }
  }

  // 2. NORMALIZED EXACT MATCH
  for (const p of products) {
    const pNameNorm = normalizeVietnameseText(p.name);
    const pSkuNorm = normalizeVietnameseText(p.sku);
    const pCodeNorm = normalizeVietnameseText(p.code);

    if (
      rawNorm === pNameNorm ||
      rawNorm === pSkuNorm ||
      rawNorm === pCodeNorm
    ) {
      return {
        matchedSku: p.sku,
        matchedProductId: p.id,
        matchedProductName: p.name,
        matchedUnit: p.unit,
        matchConfidence: 0.95,
        matchType: 'exact',
        needsManualReview: false,
      };
    }
  }

  // 3. FUZZY MATCH WITH SIMILARITY THRESHOLD
  let bestProduct: Product | null = null;
  let highestScore = 0;

  for (const p of products) {
    const scoreName = calculateTextSimilarity(description, p.name);
    const scoreSku = calculateTextSimilarity(description, p.sku);
    const score = Math.max(scoreName, scoreSku);

    if (score > highestScore) {
      highestScore = score;
      bestProduct = p;
    }
  }

  if (bestProduct && highestScore >= 0.65) {
    const isHighConfidence = highestScore >= 0.85;
    return {
      matchedSku: bestProduct.sku,
      matchedProductId: bestProduct.id,
      matchedProductName: bestProduct.name,
      matchedUnit: bestProduct.unit,
      matchConfidence: Math.round(highestScore * 100) / 100,
      matchType: 'fuzzy',
      needsManualReview: !isHighConfidence,
    };
  }

  // 4. UNMATCHED (Requires manual confirmation)
  return {
    matchedSku: null,
    matchedProductId: null,
    matchedProductName: null,
    matchedUnit: unit || null,
    matchConfidence: 0,
    matchType: 'unmatched',
    needsManualReview: true,
  };
}

// -------------------------------------------------------------------------
// STEP 3: VALIDATION ENGINE (KIỂM TRA TÍNH TOÁN & SAI SỐ HÓA ĐƠN)
// -------------------------------------------------------------------------
export function validateExtractedInvoice(
  invoice: ExtractedInvoiceSchema,
  mappedItems: MappedInvoiceItem[]
): {
  validationErrors: ValidationErrorDetail[];
  validationStatus: 'passed' | 'has_warnings' | 'has_errors';
} {
  const errors: ValidationErrorDetail[] = [];
  const TOLERANCE = 100; // Sai số làm tròn tiền Việt Nam Đồng cho phép (<= 100 VND)

  // 1. Line-by-line verification
  mappedItems.forEach((item) => {
    const calculatedBeforeTax = Math.round(item.quantity * item.unitPrice);
    const diffBeforeTax = Math.abs(calculatedBeforeTax - item.amountBeforeTax);

    if (item.quantity > 0 && item.unitPrice > 0 && diffBeforeTax > TOLERANCE) {
      errors.push({
        code: 'LINE_CALC_MISMATCH',
        severity: 'error',
        lineNumber: item.stt,
        message: `Dòng ${item.stt} (${item.rawDescription}): Số lượng (${item.quantity}) × Đơn giá (${item.unitPrice.toLocaleString('vi-VN')} đ) = ${calculatedBeforeTax.toLocaleString('vi-VN')} đ, nhưng thành tiền ghi ${item.amountBeforeTax.toLocaleString('vi-VN')} đ (lệch ${diffBeforeTax.toLocaleString('vi-VN')} đ).`,
        expectedValue: calculatedBeforeTax,
        actualValue: item.amountBeforeTax,
        diff: diffBeforeTax,
      });
      item.lineValidationStatus = 'error';
      item.validationMessage = `Sai lệch thành tiền ${diffBeforeTax.toLocaleString('vi-VN')} đ`;
    }

    const calculatedVat = Math.round(
      (item.amountBeforeTax * item.vatRate) / 100
    );
    const diffVat = Math.abs(calculatedVat - item.vatAmount);
    if (item.amountBeforeTax > 0 && diffVat > TOLERANCE) {
      errors.push({
        code: 'VAT_CALC_MISMATCH',
        severity: 'warning',
        lineNumber: item.stt,
        message: `Dòng ${item.stt}: Thuế VAT (${item.vatRate}%) tính ra ${calculatedVat.toLocaleString('vi-VN')} đ, nhưng hóa đơn ghi ${item.vatAmount.toLocaleString('vi-VN')} đ (lệch ${diffVat.toLocaleString('vi-VN')} đ).`,
        expectedValue: calculatedVat,
        actualValue: item.vatAmount,
        diff: diffVat,
      });
      if (item.lineValidationStatus !== 'error') {
        item.lineValidationStatus = 'warning';
        item.validationMessage = `Lệch thuế VAT ${diffVat.toLocaleString('vi-VN')} đ`;
      }
    }

    if (!item.matchedSku) {
      errors.push({
        code: 'UNMATCHED_SKU',
        severity: 'warning',
        lineNumber: item.stt,
        message: `Dòng ${item.stt}: Tên hàng "${item.rawDescription}" chưa được ghép nối với SKU trong kho.`,
      });
    }
  });

  // 2. Sum lines vs Totals verification
  const sumLinesBeforeTax = mappedItems.reduce(
    (acc, it) => acc + (it.amountBeforeTax || 0),
    0
  );
  const sumLinesVat = mappedItems.reduce(
    (acc, it) => acc + (it.vatAmount || 0),
    0
  );
  const sumLinesAfterTax = mappedItems.reduce(
    (acc, it) => acc + (it.amountAfterTax || 0),
    0
  );

  const totalBeforeTax = invoice.totals.amount_before_tax ?? sumLinesBeforeTax;
  const totalVat = invoice.totals.vat_amount ?? sumLinesVat;
  const totalAfterTax = invoice.totals.amount_after_tax ?? sumLinesAfterTax;

  const diffTotalBeforeTax = Math.abs(sumLinesBeforeTax - totalBeforeTax);
  if (diffTotalBeforeTax > TOLERANCE) {
    errors.push({
      code: 'TOTAL_BEFORE_TAX_MISMATCH',
      severity: 'error',
      message: `Tổng tiền trước thuế các dòng (${sumLinesBeforeTax.toLocaleString('vi-VN')} đ) không khớp với Tổng tiền ghi trên hóa đơn (${totalBeforeTax.toLocaleString('vi-VN')} đ, lệch ${diffTotalBeforeTax.toLocaleString('vi-VN')} đ).`,
      expectedValue: sumLinesBeforeTax,
      actualValue: totalBeforeTax,
      diff: diffTotalBeforeTax,
    });
  }

  const diffTotalVat = Math.abs(sumLinesVat - totalVat);
  if (diffTotalVat > TOLERANCE) {
    errors.push({
      code: 'TOTAL_VAT_MISMATCH',
      severity: 'error',
      message: `Tổng thuế VAT các dòng (${sumLinesVat.toLocaleString('vi-VN')} đ) không khớp với Tổng thuế VAT ghi trên hóa đơn (${totalVat.toLocaleString('vi-VN')} đ, lệch ${diffTotalVat.toLocaleString('vi-VN')} đ).`,
      expectedValue: sumLinesVat,
      actualValue: totalVat,
      diff: diffTotalVat,
    });
  }

  // 3. Check rate breakdown consistency
  if (invoice.totals.breakdown_by_rate) {
    const rates: (0 | 5 | 8 | 10)[] = [0, 5, 8, 10];
    rates.forEach((rate) => {
      const breakdownKey = `rate_${rate}`;
      const rateBreakdown = (invoice.totals.breakdown_by_rate as any)?.[
        breakdownKey
      ];
      if (rateBreakdown && rateBreakdown.vat_amount != null) {
        const itemsWithRate = mappedItems.filter((i) => i.vatRate === rate);
        const sumItemVatForRate = itemsWithRate.reduce(
          (acc, i) => acc + (i.vatAmount || 0),
          0
        );
        const diffRateVat = Math.abs(
          sumItemVatForRate - (rateBreakdown.vat_amount || 0)
        );
        if (itemsWithRate.length > 0 && diffRateVat > TOLERANCE) {
          errors.push({
            code: 'RATE_BREAKDOWN_MISMATCH',
            severity: 'warning',
            message: `Nhóm thuế suất ${rate}%: Tổng tiền thuế các dòng (${sumItemVatForRate.toLocaleString('vi-VN')} đ) lệch so với bảng kê thuế suất (${Number(rateBreakdown.vat_amount).toLocaleString('vi-VN')} đ).`,
            expectedValue: sumItemVatForRate,
            actualValue: rateBreakdown.vat_amount,
            diff: diffRateVat,
          });
        }
      }
    });
  }

  const hasErrors = errors.some((e) => e.severity === 'error');
  const hasWarnings = errors.some((e) => e.severity === 'warning');

  let validationStatus: 'passed' | 'has_warnings' | 'has_errors' = 'passed';
  if (hasErrors) {
    validationStatus = 'has_errors';
  } else if (hasWarnings) {
    validationStatus = 'has_warnings';
  }

  return {
    validationErrors: errors,
    validationStatus,
  };
}

// -------------------------------------------------------------------------
// STEP 4: PHÂN BIỆT CHIỀU HÓA ĐƠN (ĐẦU VÀO VS ĐẦU RA)
// -------------------------------------------------------------------------
export function determineInvoiceDirection(
  extractedData: ExtractedInvoiceSchema,
  companyTaxCode: string = DEFAULT_COMPANY_TAX_CODE
): 'inbound' | 'outbound' {
  const buyerTax = extractedData.buyer?.tax_code?.replace(/[^0-9]/g, '') || '';
  const sellerTax =
    extractedData.seller?.tax_code?.replace(/[^0-9]/g, '') || '';
  const myTax = companyTaxCode.replace(/[^0-9]/g, '');

  if (buyerTax === myTax) {
    // Công ty mình là người mua => Hóa đơn ĐẦU VÀO (Mua hàng / Nhập kho)
    return 'inbound';
  }
  if (sellerTax === myTax) {
    // Công ty mình là người bán => Hóa đơn ĐẦU RA (Bán hàng / Xuất kho)
    return 'outbound';
  }

  // Mặc định cho luồng quét hóa đơn kế toán là đầu vào
  return 'inbound';
}

// -------------------------------------------------------------------------
// STEP 5: TẠO BÚT TOÁN KẾ TOÁN (DOUBLE-ENTRY GENERAL LEDGER)
// -------------------------------------------------------------------------
export function generateJournalEntries(
  rawInvoice: RawExtractedInvoice,
  fifoCogs?: number
): JournalEntry {
  const { extractedData, mappedItems, invoiceDirection } = rawInvoice;
  const isOutbound = invoiceDirection === 'outbound';
  const lines: JournalEntryLine[] = [];

  const totalBeforeTax =
    extractedData.totals.amount_before_tax ??
    mappedItems.reduce((acc, i) => acc + i.amountBeforeTax, 0);
  const totalVat =
    extractedData.totals.vat_amount ??
    mappedItems.reduce((acc, i) => acc + i.vatAmount, 0);
  const totalAfterTax =
    extractedData.totals.amount_after_tax ?? totalBeforeTax + totalVat;

  const invoiceNo = extractedData.invoice_meta.invoice_no || 'Chưa có số';
  const invoiceSeries = extractedData.invoice_meta.series
    ? `(Mẫu ${extractedData.invoice_meta.series})`
    : '';
  const partnerName = isOutbound
    ? extractedData.buyer.company_name || extractedData.buyer.name || 'Khách hàng'
    : extractedData.seller.name || extractedData.seller.company_name || 'Nhà cung cấp';

  // Group VAT by rate
  const vatByRate: { [rate: number]: { beforeTax: number; vat: number } } = {};
  mappedItems.forEach((item) => {
    const rate = item.vatRate || 0;
    if (!vatByRate[rate]) {
      vatByRate[rate] = { beforeTax: 0, vat: 0 };
    }
    vatByRate[rate].beforeTax += item.amountBeforeTax;
    vatByRate[rate].vat += item.vatAmount;
  });

  if (!isOutbound) {
    // =========================================================================
    // HÓA ĐƠN ĐẦU VÀO (NHẬP KHO / CHI PHÍ MUA HÀNG)
    // Nợ TK 1561 (Hàng hóa)
    // Nợ TK 1331 (Thuế GTGT được khấu trừ - tách theo từng mức thuế suất 0, 5, 8, 10%)
    // Có TK 331 (Phải trả người bán)
    // =========================================================================
    mappedItems.forEach((item, idx) => {
      lines.push({
        id: `line-debit-156-${idx + 1}`,
        accountCode: '1561',
        accountName: 'Hàng hóa tồn kho',
        debitAmount: item.amountBeforeTax,
        creditAmount: 0,
        description: `Nhập kho: ${item.rawDescription} (SL: ${item.quantity} ${item.matchedUnit || ''}) theo HĐ ${invoiceNo}`,
        sku: item.matchedSku || undefined,
        vatRate: item.vatRate,
      });
    });

    // Thuế GTGT đầu vào được khấu trừ (TK 1331) tách theo từng mức thuế suất
    Object.entries(vatByRate).forEach(([rateStr, data]) => {
      const rate = Number(rateStr);
      if (data.vat > 0) {
        lines.push({
          id: `line-debit-1331-rate-${rate}`,
          accountCode: '1331',
          accountName: `Thuế GTGT được khấu trừ (${rate}%)`,
          debitAmount: data.vat,
          creditAmount: 0,
          description: `Thuế GTGT đầu vào ${rate}% theo HĐ ${invoiceNo} ${invoiceSeries} - ${partnerName}`,
          vatRate: rate,
        });
      }
    });

    // Phải trả người bán (TK 331)
    lines.push({
      id: 'line-credit-331',
      accountCode: '331',
      accountName: 'Phải trả người bán',
      debitAmount: 0,
      creditAmount: totalAfterTax,
      description: `Phải trả NCC: ${partnerName} theo HĐ GTGT ${invoiceNo}`,
    });
  } else {
    // =========================================================================
    // HÓA ĐƠN ĐẦU RA (BÁN HÀNG / DOANH THU)
    // 1. Ghi nhận Doanh thu & Thuế đầu ra:
    //    Nợ TK 131 (Phải thu khách hàng): Tổng thanh toán
    //    Có TK 5111 (Doanh thu bán hàng): Tiền trước thuế
    //    Có TK 33311 (Thuế GTGT đầu ra phải nộp): Tách theo thuế suất
    // 2. Ghi nhận Giá vốn hàng bán (nếu có tính từ FIFO Engine):
    //    Nợ TK 632 (Giá vốn hàng bán)
    //    Có TK 1561 (Hàng hóa tồn kho)
    // =========================================================================
    lines.push({
      id: 'line-debit-131',
      accountCode: '131',
      accountName: 'Phải thu của khách hàng',
      debitAmount: totalAfterTax,
      creditAmount: 0,
      description: `Phải thu khách hàng: ${partnerName} theo HĐ GTGT ${invoiceNo}`,
    });

    mappedItems.forEach((item, idx) => {
      lines.push({
        id: `line-credit-5111-${idx + 1}`,
        accountCode: '5111',
        accountName: 'Doanh thu bán hàng hóa',
        debitAmount: 0,
        creditAmount: item.amountBeforeTax,
        description: `Doanh thu bán: ${item.rawDescription} (SL: ${item.quantity}) theo HĐ ${invoiceNo}`,
        sku: item.matchedSku || undefined,
        vatRate: item.vatRate,
      });
    });

    // Thuế GTGT đầu ra phải nộp (TK 33311)
    Object.entries(vatByRate).forEach(([rateStr, data]) => {
      const rate = Number(rateStr);
      if (data.vat > 0) {
        lines.push({
          id: `line-credit-33311-rate-${rate}`,
          accountCode: '33311',
          accountName: `Thuế GTGT đầu ra phải nộp (${rate}%)`,
          debitAmount: 0,
          creditAmount: data.vat,
          description: `Thuế GTGT đầu ra ${rate}% theo HĐ ${invoiceNo} - ${partnerName}`,
          vatRate: rate,
        });
      }
    });

    // Giá vốn xuất kho (COGS)
    if (fifoCogs && fifoCogs > 0) {
      lines.push({
        id: 'line-debit-632',
        accountCode: '632',
        accountName: 'Giá vốn hàng bán',
        debitAmount: fifoCogs,
        creditAmount: 0,
        description: `Giá vốn xuất kho bán hàng theo HĐ ${invoiceNo}`,
      });
      lines.push({
        id: 'line-credit-1561-cogs',
        accountCode: '1561',
        accountName: 'Hàng hóa tồn kho (Giá vốn FIFO)',
        debitAmount: 0,
        creditAmount: fifoCogs,
        description: `Xuất kho hàng bán theo HĐ ${invoiceNo}`,
      });
    }
  }

  const totalDebit = lines.reduce((acc, l) => acc + l.debitAmount, 0);
  const totalCredit = lines.reduce((acc, l) => acc + l.creditAmount, 0);
  const isBalanced = Math.abs(totalDebit - totalCredit) <= 100;

  const now = new Date();
  const dateStr =
    extractedData.invoice_meta.issue_date ||
    now.toISOString().split('T')[0];

  return {
    id: `JE-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    entryCode: `PKT-${dateStr.replace(/-/g, '')}-${invoiceNo.padStart(4, '0')}`,
    date: dateStr,
    refDocType: isOutbound ? 'EINVOICE_OUTBOUND' : 'EINVOICE_INBOUND',
    refDocCode: `HĐ ${invoiceNo} ${invoiceSeries}`,
    description: isOutbound
      ? `Hạch toán doanh thu và thuế GTGT đầu ra theo HĐ ${invoiceNo} - ${partnerName}`
      : `Hạch toán mua hàng nhập kho và thuế GTGT đầu vào theo HĐ ${invoiceNo} - ${partnerName}`,
    lines,
    totalDebit,
    totalCredit,
    isBalanced,
    status: 'draft',
    createdAt: now.toISOString(),
    createdBy: rawInvoice.uploadedBy || 'Hệ thống AI',
  };
}

// -------------------------------------------------------------------------
// STEP 6: ATOMIC TRANSACTION POSTING
// Cập nhật Tồn kho FIFO + Tạo Bút toán Kế toán + Lưu Hóa đơn (All-or-Nothing)
// -------------------------------------------------------------------------
export interface AtomicPostingParams {
  rawInvoice: RawExtractedInvoice;
  currentProducts: Product[];
  currentLayers: InventoryLayer[];
  currentPOs: PurchaseOrder[];
  currentOrders: Order[];
  currentTransactions: StockTransaction[];
  currentAuditLogs: AuditLog[];
  currentJournalEntries: JournalEntry[];
  currentUser: { name: string; email?: string; id?: string };
  warehouseId?: string;
  warehouseName?: string;
}

export interface AtomicPostingResult {
  success: boolean;
  errorMessage?: string;
  updatedProducts?: Product[];
  updatedLayers?: InventoryLayer[];
  updatedPOs?: PurchaseOrder[];
  updatedOrders?: Order[];
  updatedTransactions?: StockTransaction[];
  updatedAuditLogs?: AuditLog[];
  updatedJournalEntries?: JournalEntry[];
  postedRawInvoice?: RawExtractedInvoice;
  createdDocumentId?: string;
  createdJournalEntryId?: string;
}

export function executeAtomicPosting(
  params: AtomicPostingParams
): AtomicPostingResult {
  const {
    rawInvoice,
    currentProducts,
    currentLayers,
    currentPOs,
    currentOrders,
    currentTransactions,
    currentAuditLogs,
    currentJournalEntries,
    currentUser,
    warehouseId = 'wh-01',
    warehouseName = 'Kho Tổng Miền Bắc (Hà Nội)',
  } = params;

  try {
    // 1. Pre-validation checks
    if (rawInvoice.status === 'posted') {
      return {
        success: false,
        errorMessage: 'Hóa đơn này đã được ghi sổ trước đó.',
      };
    }

    const unmappedItems = rawInvoice.mappedItems.filter(
      (item) => !item.matchedSku
    );
    if (unmappedItems.length > 0) {
      return {
        success: false,
        errorMessage: `Vẫn còn ${unmappedItems.length} dòng hàng chưa được ghép nối SKU: "${unmappedItems[0].rawDescription}". Vui lòng gán SKU trước khi ghi sổ.`,
      };
    }

    const isOutbound = rawInvoice.invoiceDirection === 'outbound';
    const now = new Date();
    const dateStr =
      rawInvoice.extractedData.invoice_meta.issue_date ||
      now.toISOString().split('T')[0];
    const invoiceNo =
      rawInvoice.extractedData.invoice_meta.invoice_no || 'EINV';

    let nextProducts = [...currentProducts];
    let nextLayers = [...currentLayers];
    let nextPOs = [...currentPOs];
    let nextOrders = [...currentOrders];
    let nextTransactions = [...currentTransactions];
    let nextAuditLogs = [...currentAuditLogs];
    let nextJournalEntries = [...currentJournalEntries];

    let createdDocId = '';
    let totalFifoCogs = 0;

    if (!isOutbound) {
      // ---------------------------------------------------------------------
      // INBOUND: TẠO PHIẾU NHẬP (PO) + TẠO LỚP FIFO MỚI + CỘNG TỒN KHO
      // ---------------------------------------------------------------------
      const newPoId = `PO-EINV-${Date.now().toString().slice(-6)}`;
      createdDocId = newPoId;

      const poItems: PurchaseOrderItem[] = rawInvoice.mappedItems.map((item, idx) => {
        const prod = nextProducts.find((p) => p.sku === item.matchedSku);
        return {
          sku: item.matchedSku!,
          productId: prod?.productId || prod?.id || item.matchedProductId || undefined,
          productName: prod?.name || item.matchedProductName || item.rawDescription,
          lotId: `LOT-EINV-${Date.now().toString().slice(-6)}-${idx + 1}`,
          quantity: item.quantity,
          unit: item.matchedUnit || prod?.unit || 'Cái',
          price: item.unitPrice,
          sellingPrice: prod?.sellingPrice || item.unitPrice * 1.2,
          vat: item.vatRate,
          totalAmount: item.amountAfterTax,
          eInvoiceNumber: invoiceNo,
          eInvoiceSerial: rawInvoice.extractedData.invoice_meta.series || undefined,
          eInvoiceLookupCode: rawInvoice.extractedData.invoice_meta.lookup_code || undefined,
        };
      });

      const totalPoAmount = rawInvoice.mappedItems.reduce(
        (acc, i) => acc + i.amountAfterTax,
        0
      );

      const newPO: PurchaseOrder = {
        id: newPoId,
        code: `PO-${new Date().getFullYear()}-${rawInvoice.extractedData.invoice_meta.invoice_no || Date.now().toString().slice(-4)}`,
        supplierId: 'SUP-EINV',
        supplierName:
          rawInvoice.extractedData.seller.name ||
          rawInvoice.extractedData.seller.company_name ||
          'Nhà cung cấp HĐĐT',
        supplierTaxCode: rawInvoice.extractedData.seller.tax_code || undefined,
        warehouseId,
        warehouse: warehouseName,
        status: 'received',
        paymentStatus: 'paid',
        items: poItems,
        totalAmount: totalPoAmount,
        paidAmount: totalPoAmount,
        debtAmount: 0,
        note: `Tự động nhập kho từ HĐĐT GTGT số ${invoiceNo} (Mẫu ${rawInvoice.extractedData.invoice_meta.series || '1C26TMB'})`,
        hasEInvoice: true,
        eInvoiceNumber: invoiceNo,
        eInvoiceSerial: rawInvoice.extractedData.invoice_meta.series || undefined,
        eInvoiceLookupCode: rawInvoice.extractedData.invoice_meta.lookup_code || undefined,
        createdAt: now.toISOString().replace('T', ' ').substring(0, 16),
      };

      nextPOs.unshift(newPO);

      // Tạo các FIFO layer tương ứng cho từng dòng sản phẩm
      rawInvoice.mappedItems.forEach((item, idx) => {
        const prod = nextProducts.find((p) => p.sku === item.matchedSku);
        const newLayer: InventoryLayer = {
          id: `LAYER-EINV-${Date.now()}-${idx + 1}`,
          layerId: poItems[idx].lotId,
          layerType: 'RECEIPT',
          sku: item.matchedSku!,
          productId: prod?.productId || prod?.id || `P-${Date.now().toString().slice(-4)}`,
          productCode: prod?.code || item.matchedSku!,
          productName: prod?.name || item.rawDescription,
          unit: item.matchedUnit || prod?.unit || 'Cái',
          packSize: '1',
          branchId: 'BR01',
          branchName: 'Tổng kho Miền Bắc',
          warehouseId,
          warehouseName,
          supplierName: rawInvoice.extractedData.seller.name || 'Nhà cung cấp HĐĐT',
          supplierId: 'SUP-EINV',
          receiptCode: newPO.code,
          receivedAt: dateStr,
          createdAt: now.toISOString(),
          quantityReceived: item.quantity,
          quantityIssued: 0,
          quantityRemaining: item.quantity,
          purchasePrice: item.unitPrice,
          salePrice: prod?.sellingPrice || item.unitPrice * 1.2,
          status: 'active',
          notes: `Nhập từ HĐĐT GTGT #${invoiceNo}`
        };
        nextLayers.unshift(newLayer);

        // Tạo thẻ kho StockTransaction
        const currentStock = prod ? prod.stock : 0;
        const newStock = currentStock + item.quantity;

        const newTrans: StockTransaction = {
          id: `TX-IN-${Date.now()}-${idx + 1}`,
          date: dateStr,
          type: 'Nhập kho',
          docCode: newPO.code,
          sku: item.matchedSku!,
          productId: prod?.productId || prod?.id,
          productName: prod?.name || item.rawDescription,
          lotId: newLayer.layerId,
          branchId: 'BR01',
          warehouseId,
          qtyIn: item.quantity,
          qtyOut: 0,
          balance: newStock,
          unitCost: item.unitPrice,
          totalValue: Math.round(item.quantity * item.unitPrice),
          actor: currentUser.name,
          note: `Nhập kho HĐĐT GTGT ${invoiceNo}`,
        };
        nextTransactions.unshift(newTrans);
      });

      // Đồng bộ tồn kho và giá vốn FIFO vào sản phẩm
      nextProducts = fifoEngine.syncProductsWithLayers(nextProducts, nextLayers);
    } else {
      // ---------------------------------------------------------------------
      // OUTBOUND: TẠO ĐƠN HÀNG XUẤT (ORDER) + TRỪ TỒN KHO THEO FIFO ENGINE
      // ---------------------------------------------------------------------
      const newOrderId = `ORD-EINV-${Date.now().toString().slice(-6)}`;
      createdDocId = newOrderId;

      const orderItems: OrderItem[] = rawInvoice.mappedItems.map((item) => {
        const prod = nextProducts.find((p) => p.sku === item.matchedSku);
        return {
          productId: prod?.id || item.matchedProductId || 'P000001',
          productName: prod?.name || item.matchedProductName || item.rawDescription,
          sku: item.matchedSku!,
          quantity: item.quantity,
          unit: item.matchedUnit || prod?.unit || 'Cái',
          unitPrice: item.unitPrice,
          totalPrice: item.amountAfterTax,
          fifoCost: (item.amountBeforeTax || 0) * 0.8
        };
      });

      const totalOrderAmount = rawInvoice.mappedItems.reduce(
        (acc, i) => acc + i.amountAfterTax,
        0
      );

      // Trừ kho FIFO cho danh sách mặt hàng
      const itemsToDeduct = rawInvoice.mappedItems.map((item) => {
        const prod = nextProducts.find((p) => p.sku === item.matchedSku);
        return {
          sku: item.matchedSku!,
          productId: prod?.productId || prod?.id || item.matchedProductId,
          productName: prod?.name || item.matchedProductName || item.rawDescription,
          quantity: item.quantity,
          salePrice: item.unitPrice,
          unit: item.matchedUnit || prod?.unit || 'Cái'
        };
      });

      const fifoIssueResult = fifoEngine.executeFifoIssue(itemsToDeduct, nextLayers, {
        issueId: `iss-einv-${newOrderId}`,
        docCode: `ORD-${invoiceNo}`,
        docType: 'Xuất bán',
        branchId: 'BR01',
        warehouseId,
        actor: currentUser.name,
        note: `Xuất kho tự động từ HĐĐT GTGT bán ra số ${invoiceNo}`
      });

      if (fifoIssueResult.success) {
        nextLayers = fifoIssueResult.updatedLayers;
        totalFifoCogs = fifoIssueResult.totalCogs;
        nextTransactions.unshift(...fifoIssueResult.generatedTransactions);
      }

      const newOrder: Order = {
        id: newOrderId,
        code: `DH-EINV-${invoiceNo}`,
        customerName:
          rawInvoice.extractedData.buyer.company_name ||
          rawInvoice.extractedData.buyer.name ||
          'Khách hàng HĐĐT',
        customerPhone: '0900000000',
        customerAddress: rawInvoice.extractedData.buyer.address || '',
        branchId: 'BR01',
        warehouseId,
        items: orderItems,
        subtotal: rawInvoice.extractedData.totals.amount_before_tax || 0,
        discount: 0,
        tax: rawInvoice.extractedData.totals.vat_amount || 0,
        totalAmount: totalOrderAmount,
        cogs: totalFifoCogs,
        grossProfit: totalOrderAmount - totalFifoCogs,
        status: 'completed',
        paymentMethod: 'bank_transfer',
        paymentStatus: 'paid',
        createdAt: now.toISOString().replace('T', ' ').substring(0, 16),
        creator: currentUser.name,
        note: `Tự động xuất kho từ HĐĐT GTGT bán ra số ${invoiceNo}`,
      };

      nextOrders.unshift(newOrder);

      // Đồng bộ tồn kho
      nextProducts = fifoEngine.syncProductsWithLayers(nextProducts, nextLayers);
    }

    // -----------------------------------------------------------------------
    // TẠO BÚT TOÁN KẾ TOÁN VÀ GHI SỔ
    // -----------------------------------------------------------------------
    const journalEntry = generateJournalEntries(rawInvoice, totalFifoCogs);
    journalEntry.status = 'posted';
    nextJournalEntries.unshift(journalEntry);

    // -----------------------------------------------------------------------
    // CẬP NHẬT RAW INVOICE SANG TRẠNG THÁI POSTED
    // -----------------------------------------------------------------------
    const postedRawInvoice: RawExtractedInvoice = {
      ...rawInvoice,
      status: 'posted',
      postedAt: now.toISOString(),
      postedBy: currentUser.name,
      createdPoId: !isOutbound ? createdDocId : undefined,
      createdOrderId: isOutbound ? createdDocId : undefined,
      createdJournalEntryId: journalEntry.id,
      auditTrail: [
        ...rawInvoice.auditTrail,
        {
          id: `audit-${Date.now()}`,
          timestamp: now.toISOString(),
          actor: currentUser.name,
          action: 'posted',
          details: `Đã ghi sổ thành công ${isOutbound ? 'Xuất kho bán hàng' : 'Nhập kho mua hàng'} và sinh Bút toán kế toán ${journalEntry.entryCode} (${journalEntry.lines.length} dòng).`,
        },
      ],
    };

    // Ghi log kiểm toán hệ thống
    const newAuditLog: AuditLog = {
      id: `audit-log-${Date.now()}`,
      timestamp: now.toISOString(),
      userId: 'admin-01',
      userName: currentUser.name,
      action: isOutbound ? 'issued' : 'received',
      referenceType: isOutbound ? 'ORDER' : 'PO',
      referenceId: createdDocId,
      description: `[HĐĐT AI Extraction] Ghi sổ thành công HĐ GTGT số ${invoiceNo} (${isOutbound ? 'Đầu ra' : 'Đầu vào'}). Tạo chứng từ ${createdDocId} và Bút toán ${journalEntry.entryCode}.`,
    };
    nextAuditLogs.unshift(newAuditLog);

    return {
      success: true,
      updatedProducts: nextProducts,
      updatedLayers: nextLayers,
      updatedPOs: nextPOs,
      updatedOrders: nextOrders,
      updatedTransactions: nextTransactions,
      updatedAuditLogs: nextAuditLogs,
      updatedJournalEntries: nextJournalEntries,
      postedRawInvoice,
      createdDocumentId: createdDocId,
      createdJournalEntryId: journalEntry.id,
    };
  } catch (error: any) {
    return {
      success: false,
      errorMessage: error.message || 'Lỗi không xác định khi thực hiện ghi sổ.',
    };
  }
}
