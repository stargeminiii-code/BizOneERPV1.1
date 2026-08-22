import React, { useState, useEffect } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  Sparkles,
  Layers,
  BookOpen,
  Eye,
  RefreshCw,
  Building2,
  Calendar,
  Hash,
  Search,
  Check,
  ChevronDown,
  Info,
  ShieldCheck,
  Lock,
  ArrowDownRight,
  ArrowUpRight,
  Plus
} from 'lucide-react';
import {
  Product,
  InventoryLayer,
  PurchaseOrder,
  Order,
  StockTransaction,
  AuditLog,
  JournalEntry,
  RawExtractedInvoice,
  MappedInvoiceItem,
  ExtractedInvoiceSchema
} from '../../types';
import {
  DEFAULT_COMPANY_TAX_CODE,
  DEFAULT_COMPANY_NAME,
  mapDescriptionToSku,
  validateExtractedInvoice,
  determineInvoiceDirection,
  generateJournalEntries,
  executeAtomicPosting
} from '../../services/invoiceExtractionService';
import { SAMPLE_INVOICE_PRESETS, SampleInvoicePreset } from '../../data/sampleInvoices';
import { AuthService } from '../../services/authService';
import confetti from 'canvas-confetti';

interface InvoiceExtractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  inventoryLayers: InventoryLayer[];
  purchaseOrders: PurchaseOrder[];
  orders: Order[];
  stockTransactions: StockTransaction[];
  auditLogs: AuditLog[];
  journalEntries: JournalEntry[];
  currentUser: { name: string; email?: string; id?: string };
  onPostingSuccess: (result: {
    updatedProducts: Product[];
    updatedLayers: InventoryLayer[];
    updatedPOs: PurchaseOrder[];
    updatedOrders: Order[];
    updatedTransactions: StockTransaction[];
    updatedAuditLogs: AuditLog[];
    updatedJournalEntries: JournalEntry[];
    postedRawInvoice: RawExtractedInvoice;
    createdDocumentId?: string;
    createdJournalEntryId?: string;
  }) => void;
  onQuickAddProduct?: (productDraft: Partial<Product>) => void;
}

export const InvoiceExtractionModal: React.FC<InvoiceExtractionModalProps> = ({
  isOpen,
  onClose,
  products,
  inventoryLayers,
  purchaseOrders,
  orders,
  stockTransactions,
  auditLogs,
  journalEntries,
  currentUser,
  onPostingSuccess,
  onQuickAddProduct
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [lastBase64, setLastBase64] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'review' | 'journal' | 'raw_json'>('review');
  const [rawInvoice, setRawInvoice] = useState<RawExtractedInvoice | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activePresetId, setActivePresetId] = useState<string>('sample-misa-inbound-1');

  // Function to process extracted data into RawExtractedInvoice state
  const processExtractedSchema = (
    schemaData: ExtractedInvoiceSchema,
    sourceFileName: string = 'hoa_don_gtgt.pdf',
    sourceType: 'manual_upload' | 'tax_portal_sync' = 'manual_upload'
  ) => {
    const direction = determineInvoiceDirection(schemaData, DEFAULT_COMPANY_TAX_CODE);

    // Map each line item to products
    const mapped: MappedInvoiceItem[] = schemaData.line_items.map((line) => {
      const matchResult = mapDescriptionToSku(line.description, products, line.unit);
      const qty = Number(line.quantity) || 1;
      const price = Number(line.unit_price) || 0;
      const beforeTax = Number(line.amount_before_tax) || qty * price;
      const rate = typeof line.vat_rate === 'number' ? line.vat_rate : Number(line.vat_rate) || 8;
      const vat = Number(line.vat_amount) != null ? Number(line.vat_amount) : Math.round((beforeTax * rate) / 100);
      const afterTax = Number(line.amount_after_tax) != null ? Number(line.amount_after_tax) : beforeTax + vat;

      return {
        stt: line.stt,
        rawDescription: line.description,
        matchedSku: matchResult.matchedSku,
        matchedProductId: matchResult.matchedProductId,
        matchedProductName: matchResult.matchedProductName,
        matchedUnit: matchResult.matchedUnit,
        matchConfidence: matchResult.matchConfidence,
        matchType: matchResult.matchType,
        needsManualReview: matchResult.needsManualReview,
        quantity: qty,
        unitPrice: price,
        amountBeforeTax: beforeTax,
        vatRate: rate,
        vatAmount: vat,
        amountAfterTax: afterTax,
        lineValidationStatus: 'valid'
      };
    });

    const validation = validateExtractedInvoice(schemaData, mapped);

    const newRaw: RawExtractedInvoice = {
      id: `RAW-INV-${Date.now()}`,
      uploadedAt: new Date().toISOString(),
      uploadedBy: currentUser.name,
      sourceFileName,
      sourceType,
      invoiceDirection: direction,
      status: validation.validationStatus === 'has_errors' ? 'discrepancy_warning' : 'pending_review',
      extractedData: schemaData,
      mappedItems: mapped,
      validationErrors: validation.validationErrors,
      validationStatus: validation.validationStatus,
      auditTrail: [
        {
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          actor: currentUser.name,
          action: 'uploaded',
          details: `Tải lên file ${sourceFileName} và trích xuất cấu trúc dữ liệu thành công.`
        }
      ]
    };

    setRawInvoice(newRaw);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  const loadPreset = (preset: SampleInvoicePreset) => {
    setActivePresetId(preset.id);
    setSelectedFile(null);
    setLastBase64(null);
    processExtractedSchema(preset.data, preset.fileName, 'manual_upload');
  };

  // Initialize with the first sample preset when opening
  useEffect(() => {
    if (isOpen && !rawInvoice) {
      loadPreset(SAMPLE_INVOICE_PRESETS[0]);
    }
  }, [isOpen]);

  // Perform PDF extraction via server endpoint
  const performExtraction = async (file: File, base64Data: string) => {
    setIsExtracting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const token = AuthService.getActiveToken();
      const response = await fetch('/api/invoices/extract-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          fileBase64: base64Data,
          mimeType: file.type || 'application/pdf',
          fileName: file.name
        })
      });

      const result = await response.json();
      if (result.success && result.data) {
        setActivePresetId(null);
        processExtractedSchema(result.data, file.name, 'manual_upload');
        setSuccessMessage(`Đã trích xuất thành công hóa đơn từ file "${file.name}" bằng mô hình AI (${result.source || 'Gemini'}).`);
      } else {
        throw new Error(result.error || 'Trích xuất thất bại.');
      }
    } catch (err: any) {
      console.error('Extraction API error:', err);
      setErrorMessage(
        `Không thể phân tích file PDF (${err.message || 'Lỗi server'}). Vui lòng nhấn "Thử lại quét AI" hoặc chọn mẫu hóa đơn có sẵn để thử nghiệm.`
      );
    } finally {
      setIsExtracting(false);
    }
  };

  // Handle PDF file upload & server call
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setIsExtracting(true);
    setErrorMessage(null);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64String = reader.result as string;
        setLastBase64(base64String);
        await performExtraction(file, base64String);
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setIsExtracting(false);
      setErrorMessage(err.message || 'Lỗi khi đọc file.');
    }
  };

  // Retry extraction with current file
  const handleRetryExtraction = () => {
    if (selectedFile && lastBase64) {
      performExtraction(selectedFile, lastBase64);
    }
  };

  // Update line item manual mappings
  const handleItemSkuChange = (stt: number, newSku: string) => {
    if (!rawInvoice) return;

    const prod = products.find((p) => p.sku === newSku);
    const updatedMapped = rawInvoice.mappedItems.map((item) => {
      if (item.stt === stt) {
        return {
          ...item,
          matchedSku: newSku || null,
          matchedProductId: prod?.id || null,
          matchedProductName: prod?.name || null,
          matchedUnit: prod?.unit || item.matchedUnit,
          matchType: 'manual' as const,
          matchConfidence: 1.0,
          needsManualReview: false
        };
      }
      return item;
    });

    const validation = validateExtractedInvoice(rawInvoice.extractedData, updatedMapped);

    setRawInvoice({
      ...rawInvoice,
      mappedItems: updatedMapped,
      validationErrors: validation.validationErrors,
      validationStatus: validation.validationStatus
    });
  };

  // Toggle invoice direction (Inbound / Outbound)
  const toggleDirection = (dir: 'inbound' | 'outbound') => {
    if (!rawInvoice) return;
    setRawInvoice({
      ...rawInvoice,
      invoiceDirection: dir
    });
  };

  // Execute atomic posting
  const handleConfirmAndPost = () => {
    if (!rawInvoice) return;

    // Check for blocking errors
    const blockingErrors = rawInvoice.validationErrors.filter((e) => e.severity === 'error');
    if (blockingErrors.length > 0) {
      setErrorMessage(`Không thể ghi sổ tự động do còn ${blockingErrors.length} lỗi sai lệch số liệu cần xử lý.`);
      return;
    }

    const unmapped = rawInvoice.mappedItems.filter((i) => !i.matchedSku);
    if (unmapped.length > 0) {
      setErrorMessage(`Vui lòng ghép nối SKU cho tất cả các dòng hàng (${unmapped.length} dòng chưa có SKU).`);
      return;
    }

    const postingResult = executeAtomicPosting({
      rawInvoice,
      currentProducts: products,
      currentLayers: inventoryLayers,
      currentPOs: purchaseOrders,
      currentOrders: orders,
      currentTransactions: stockTransactions,
      currentAuditLogs: auditLogs,
      currentJournalEntries: journalEntries,
      currentUser
    });

    if (postingResult.success && postingResult.postedRawInvoice) {
      confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      setRawInvoice(postingResult.postedRawInvoice);
      setSuccessMessage(
        `Ghi sổ thành công! Đã tự động cập nhật tồn kho FIFO và sinh Bút toán kế toán (${postingResult.createdJournalEntryId}).`
      );

      onPostingSuccess({
        updatedProducts: postingResult.updatedProducts!,
        updatedLayers: postingResult.updatedLayers!,
        updatedPOs: postingResult.updatedPOs!,
        updatedOrders: postingResult.updatedOrders!,
        updatedTransactions: postingResult.updatedTransactions!,
        updatedAuditLogs: postingResult.updatedAuditLogs!,
        updatedJournalEntries: postingResult.updatedJournalEntries!,
        postedRawInvoice: postingResult.postedRawInvoice,
        createdDocumentId: postingResult.createdDocumentId,
        createdJournalEntryId: postingResult.createdJournalEntryId
      });
    } else {
      setErrorMessage(postingResult.errorMessage || 'Lỗi khi thực hiện ghi sổ.');
    }
  };

  const previewJournalEntry = rawInvoice ? generateJournalEntries(rawInvoice) : null;
  const isPosted = rawInvoice?.status === 'posted';
  const hasErrors = rawInvoice?.validationStatus === 'has_errors';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
      <div
        id="invoice-extraction-modal-container"
        className="relative w-full max-w-7xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      >
        {/* MODAL HEADER */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-slate-50 to-indigo-50/40 dark:from-slate-900 dark:to-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Trích xuất Hóa đơn GTGT điện tử (AI e-Invoice Extraction)
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                  Nghị định 123 / TT 78
                </span>
                {isPosted && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200">
                    ✓ Đã ghi sổ kho & kế toán
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tự động nhận diện PDF từ VNPT, Viettel, MISA, BKAV ➔ Đối soát số liệu & Mapping SKU ➔ Cập nhật kho FIFO & Bút toán kế toán kép
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              ✕
            </button>
          </div>
        </div>

        {/* PRESETS & FILE UPLOAD TOOLBAR */}
        <div className="px-6 py-3 bg-slate-50/80 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
          {/* Preset Buttons */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Mẫu hóa đơn mẫu:
            </span>
            {SAMPLE_INVOICE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => loadPreset(preset)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  activePresetId === preset.id
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {preset.direction === 'inbound' ? (
                  <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <ArrowUpRight className="w-3.5 h-3.5 text-blue-400" />
                )}
                {preset.provider}: {preset.direction === 'inbound' ? 'Đầu vào (Nhập mua)' : 'Đầu ra (Bán hàng)'}
              </button>
            ))}
          </div>

          {/* Upload Custom PDF Button */}
          <div className="flex items-center gap-2">
            <label
              htmlFor="upload-invoice-pdf"
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all flex items-center gap-2 ${
                isExtracting
                  ? 'bg-slate-300 dark:bg-slate-700 text-slate-500 cursor-not-allowed'
                  : 'bg-slate-900 hover:bg-slate-800 text-white dark:bg-slate-100 dark:hover:bg-white dark:text-slate-900 shadow-xs'
              }`}
            >
              {isExtracting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Đang phân tích PDF...
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5" />
                  Tải lên file PDF hóa đơn của bạn
                </>
              )}
              <input
                id="upload-invoice-pdf"
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={handleFileUpload}
                disabled={isExtracting}
                className="hidden"
              />
            </label>
          </div>
        </div>

        {/* ALERTS SECTION */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 text-xs flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMessage}</span>
            </div>
            <div className="flex items-center gap-2">
              {selectedFile && lastBase64 && (
                <button
                  onClick={handleRetryExtraction}
                  disabled={isExtracting}
                  className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-xs"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isExtracting ? 'animate-spin' : ''}`} />
                  Thử lại quét AI
                </button>
              )}
              <button
                onClick={() => setErrorMessage(null)}
                className="text-rose-500 hover:text-rose-700 font-bold px-1.5 py-1"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mx-6 mt-4 p-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-500 hover:text-emerald-700 font-bold">
              ✕
            </button>
          </div>
        )}

        {/* MAIN TABS */}
        <div className="px-6 pt-3 flex items-center gap-4 border-b border-slate-200 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('review')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'review'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <FileText className="w-4 h-4" />
            1. Đối soát Hóa đơn & Mapping SKU ({rawInvoice?.mappedItems.length || 0} dòng)
          </button>
          <button
            onClick={() => setActiveTab('journal')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'journal'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            2. Xem trước Bút toán Kế toán Kép (TK 156, 1331, 331 / 511, 3331)
          </button>
          <button
            onClick={() => setActiveTab('raw_json')}
            className={`pb-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'raw_json'
                ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <Eye className="w-4 h-4" />
            3. Dữ liệu JSON Trích xuất (Schema Output)
          </button>
        </div>

        {/* TAB CONTENTS */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {rawInvoice ? (
            activeTab === 'review' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* LEFT COLUMN: METADATA & PARTIES & VALIDATION STATUS (4 Cols) */}
                <div className="lg:col-span-4 space-y-4">
                  {/* Direction Switch Card */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                        Phân loại Chiều Hóa đơn
                      </span>
                      <span className="text-[11px] text-slate-500">
                        {rawInvoice.invoiceDirection === 'inbound'
                          ? 'Người mua trùng MST Công ty'
                          : 'Người bán trùng MST Công ty'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        disabled={isPosted}
                        onClick={() => toggleDirection('inbound')}
                        className={`p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          rawInvoice.invoiceDirection === 'inbound'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        <ArrowDownRight className="w-4 h-4" />
                        ĐẦU VÀO (Nhập kho)
                      </button>
                      <button
                        disabled={isPosted}
                        onClick={() => toggleDirection('outbound')}
                        className={`p-2.5 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                          rawInvoice.invoiceDirection === 'outbound'
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600'
                        }`}
                      >
                        <ArrowUpRight className="w-4 h-4" />
                        ĐẦU RA (Xuất bán)
                      </button>
                    </div>
                  </div>

                  {/* Invoice Header Details */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    <h3 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                      <Hash className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Thông tin Hóa đơn GTGT
                    </h3>

                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <span className="text-[11px] text-slate-500 block">Ký hiệu (Mẫu số)</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100">
                          {rawInvoice.extractedData.invoice_meta.series || '1C26TMB'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <span className="text-[11px] text-slate-500 block">Số hóa đơn</span>
                        <span className="font-bold text-indigo-600 dark:text-indigo-400">
                          {rawInvoice.extractedData.invoice_meta.invoice_no || '0000000'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <span className="text-[11px] text-slate-500 block">Ngày lập HĐ</span>
                        <span className="font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {rawInvoice.extractedData.invoice_meta.issue_date || '2026-08-21'}
                        </span>
                      </div>
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                        <span className="text-[11px] text-slate-500 block">Mã CQT cấp</span>
                        <span className="font-mono text-[11px] text-slate-700 dark:text-slate-300 truncate block">
                          {rawInvoice.extractedData.invoice_meta.tax_auth_code || 'Chưa cấp mã'}
                        </span>
                      </div>
                    </div>

                    {rawInvoice.extractedData.invoice_meta.lookup_url && (
                      <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-900/50 text-xs">
                        <span className="text-[11px] text-slate-500 block">Tra cứu:</span>
                        <a
                          href={rawInvoice.extractedData.invoice_meta.lookup_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-indigo-600 dark:text-indigo-400 hover:underline truncate block"
                        >
                          {rawInvoice.extractedData.invoice_meta.lookup_url} (Mã: {rawInvoice.extractedData.invoice_meta.lookup_code})
                        </a>
                      </div>
                    )}
                  </div>

                  {/* Seller & Buyer Info */}
                  <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-3">
                    {/* Seller */}
                    <div className="pb-3 border-b border-slate-100 dark:border-slate-700">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Đơn vị bán hàng</span>
                        {rawInvoice.extractedData.seller.tax_code === DEFAULT_COMPANY_TAX_CODE && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                            Công ty mình
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {rawInvoice.extractedData.seller.name || rawInvoice.extractedData.seller.company_name || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        MST: {rawInvoice.extractedData.seller.tax_code || 'N/A'}
                      </div>
                    </div>

                    {/* Buyer */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[11px] font-bold text-slate-500 uppercase">Đơn vị mua hàng</span>
                        {rawInvoice.extractedData.buyer.tax_code === DEFAULT_COMPANY_TAX_CODE && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] bg-indigo-100 text-indigo-800 font-bold">
                            Công ty mình
                          </span>
                        )}
                      </div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {rawInvoice.extractedData.buyer.company_name || rawInvoice.extractedData.buyer.name || 'N/A'}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                        MST: {rawInvoice.extractedData.buyer.tax_code || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {/* Validation Engine Report */}
                  <div
                    className={`p-4 rounded-xl border ${
                      rawInvoice.validationStatus === 'passed'
                        ? 'bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                        : rawInvoice.validationStatus === 'has_warnings'
                        ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800'
                        : 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {rawInvoice.validationStatus === 'passed' ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        )}
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Kiểm định Số học & Thuế suất
                        </span>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                          rawInvoice.validationStatus === 'passed'
                            ? 'bg-emerald-100 text-emerald-800'
                            : rawInvoice.validationStatus === 'has_warnings'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {rawInvoice.validationStatus === 'passed'
                          ? '100% Khớp đúng'
                          : rawInvoice.validationStatus === 'has_warnings'
                          ? 'Có cảnh báo'
                          : 'Cảnh báo Lệch tiền'}
                      </span>
                    </div>

                    {rawInvoice.validationErrors.length > 0 ? (
                      <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                        {rawInvoice.validationErrors.map((err, idx) => (
                          <div
                            key={idx}
                            className={`p-2 rounded text-[11px] ${
                              err.severity === 'error'
                                ? 'bg-rose-100/70 dark:bg-rose-900/40 text-rose-800 dark:text-rose-200'
                                : 'bg-amber-100/70 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200'
                            }`}
                          >
                            • {err.message}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-emerald-700 dark:text-emerald-400">
                        Tất cả phép tính (SL × Đơn giá = Tiền hàng, Thuế GTGT từng mức 0/5/8/10%, Tổng thanh toán) đều khớp chính xác tuyệt đối.
                      </p>
                    )}
                  </div>
                </div>

                {/* RIGHT COLUMN: LINE ITEMS & SKU MAPPING TABLE (8 Cols) */}
                <div className="lg:col-span-8 space-y-4">
                  {/* Table Card */}
                  <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden shadow-xs">
                    <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                          Chi tiết Dòng hàng & Ghép nối SKU Hệ thống
                        </span>
                        <span className="px-2 py-0.5 text-[11px] font-semibold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                          {rawInvoice.mappedItems.length} mặt hàng
                        </span>
                      </div>

                      {/* Quick Add Product Button */}
                      {onQuickAddProduct && (
                        <button
                          onClick={() =>
                            onQuickAddProduct({
                              name: 'Sản phẩm mới từ HĐĐT',
                              unit: 'kg',
                              costPrice: 50000,
                              sellingPrice: 70000
                            })
                          }
                          className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-lg hover:bg-slate-100 text-slate-700 dark:text-slate-200 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5 text-indigo-500" />
                          Thêm mới Sản phẩm vào kho
                        </button>
                      )}
                    </div>

                    {/* Line Items Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-100/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                          <tr>
                            <th className="py-2.5 px-3 w-10 text-center">STT</th>
                            <th className="py-2.5 px-3">Tên hàng trên Hóa đơn</th>
                            <th className="py-2.5 px-3 w-60">Ghép nối SKU trong kho</th>
                            <th className="py-2.5 px-2 text-right">SL</th>
                            <th className="py-2.5 px-2 text-right">Đơn giá</th>
                            <th className="py-2.5 px-2 text-right">Tiền hàng</th>
                            <th className="py-2.5 px-2 text-center">VAT</th>
                            <th className="py-2.5 px-3 text-right">Tổng tiền</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                          {rawInvoice.mappedItems.map((item) => {
                            const isUnmatched = !item.matchedSku;
                            return (
                              <tr
                                key={item.stt}
                                className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                                  isUnmatched ? 'bg-amber-50/30 dark:bg-amber-950/20' : ''
                                }`}
                              >
                                <td className="py-3 px-3 text-center text-slate-400 font-mono">
                                  {item.stt}
                                </td>

                                <td className="py-3 px-3">
                                  <div className="font-semibold text-slate-900 dark:text-white leading-tight">
                                    {item.rawDescription}
                                  </div>
                                  <div className="text-[11px] text-slate-400 mt-0.5">
                                    ĐVT: <span className="font-medium text-slate-600 dark:text-slate-300">{item.matchedUnit || 'N/A'}</span>
                                  </div>
                                  {item.validationMessage && (
                                    <div className="text-[10px] text-rose-600 font-medium mt-0.5">
                                      ⚠️ {item.validationMessage}
                                    </div>
                                  )}
                                </td>

                                <td className="py-3 px-3">
                                  <div className="space-y-1">
                                    <select
                                      disabled={isPosted}
                                      value={item.matchedSku || ''}
                                      onChange={(e) => handleItemSkuChange(item.stt, e.target.value)}
                                      className={`w-full text-xs font-medium py-1.5 px-2 rounded-lg border focus:ring-1 focus:ring-indigo-500 dark:bg-slate-900 ${
                                        isUnmatched
                                          ? 'border-amber-400 bg-amber-50 text-amber-900 dark:bg-amber-950/40 dark:text-amber-200'
                                          : 'border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white'
                                      }`}
                                    >
                                      <option value="">-- Chưa ghép nối (Chọn SKU) --</option>
                                      {products.map((p) => (
                                        <option key={p.sku} value={p.sku}>
                                          [{p.sku}] {p.name} ({p.unit})
                                        </option>
                                      ))}
                                    </select>

                                    {/* Confidence badge */}
                                    <div className="flex items-center gap-1.5">
                                      {item.matchType === 'exact' && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-medium">
                                          <Check className="w-3 h-3" /> Exact 100%
                                        </span>
                                      )}
                                      {item.matchType === 'fuzzy' && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-medium">
                                          Gợi ý AI ({Math.round(item.matchConfidence * 100)}%)
                                        </span>
                                      )}
                                      {item.matchType === 'manual' && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 font-medium">
                                          Khớp tay
                                        </span>
                                      )}
                                      {isUnmatched && (
                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] bg-amber-100 text-amber-800 font-bold">
                                          ⚠️ Cần chọn SKU
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </td>

                                <td className="py-3 px-2 text-right font-mono font-semibold text-slate-800 dark:text-slate-200">
                                  {item.quantity.toLocaleString('vi-VN')}
                                </td>

                                <td className="py-3 px-2 text-right font-mono text-slate-600 dark:text-slate-400">
                                  {item.unitPrice.toLocaleString('vi-VN')} đ
                                </td>

                                <td className="py-3 px-2 text-right font-mono font-medium text-slate-900 dark:text-slate-100">
                                  {item.amountBeforeTax.toLocaleString('vi-VN')} đ
                                </td>

                                <td className="py-3 px-2 text-center">
                                  <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                                    {item.vatRate}%
                                  </span>
                                </td>

                                <td className="py-3 px-3 text-right font-mono font-bold text-indigo-600 dark:text-indigo-400">
                                  {item.amountAfterTax.toLocaleString('vi-VN')} đ
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* VAT Breakdown & Summary Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rate Breakdown */}
                    <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 space-y-2">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                        Bảng kê Thuế suất GTGT (0% / 5% / 8% / 10%)
                      </h4>
                      <div className="space-y-1.5 text-xs">
                        {[0, 5, 8, 10].map((rate) => {
                          const itemsWithRate = rawInvoice.mappedItems.filter((i) => i.vatRate === rate);
                          const totalBefore = itemsWithRate.reduce((acc, i) => acc + i.amountBeforeTax, 0);
                          const totalVat = itemsWithRate.reduce((acc, i) => acc + i.vatAmount, 0);
                          if (itemsWithRate.length === 0 && totalBefore === 0) return null;

                          return (
                            <div
                              key={rate}
                              className="flex items-center justify-between py-1 px-2.5 rounded bg-slate-50 dark:bg-slate-900/50 font-mono text-[11px]"
                            >
                              <span className="font-semibold text-slate-700 dark:text-slate-300">
                                Thuế suất {rate}%:
                              </span>
                              <span>
                                Hàng: {totalBefore.toLocaleString('vi-VN')} đ | Thuế: {totalVat.toLocaleString('vi-VN')} đ
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Grand Totals */}
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-slate-50 dark:from-slate-800 dark:to-slate-800/50 border border-indigo-100 dark:border-slate-700 space-y-2 text-xs">
                      <div className="flex justify-between py-1 border-b border-indigo-100/60 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">Tổng tiền trước thuế:</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">
                          {(rawInvoice.extractedData.totals.amount_before_tax || 0).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="flex justify-between py-1 border-b border-indigo-100/60 dark:border-slate-700">
                        <span className="text-slate-600 dark:text-slate-400">Tổng tiền thuế GTGT:</span>
                        <span className="font-mono font-bold text-indigo-600 dark:text-indigo-400">
                          {(rawInvoice.extractedData.totals.vat_amount || 0).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                      <div className="flex justify-between py-1 pt-2 text-sm font-bold">
                        <span className="text-slate-900 dark:text-white">TỔNG CỘNG THANH TOÁN:</span>
                        <span className="font-mono text-emerald-600 dark:text-emerald-400">
                          {(rawInvoice.extractedData.totals.amount_after_tax || 0).toLocaleString('vi-VN')} đ
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : activeTab === 'journal' ? (
              /* JOURNAL ENTRY PREVIEW TAB */
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-indigo-50/60 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <BookOpen className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        Bút toán Nhật ký chung (Double-Entry General Ledger)
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Mã bút toán dự kiến:{' '}
                        <span className="font-mono font-bold text-indigo-600">
                          {previewJournalEntry?.entryCode}
                        </span>{' '}
                        • Ngày: {previewJournalEntry?.date}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                      ✓ Nợ = Có Cân đối ({(previewJournalEntry?.totalDebit || 0).toLocaleString('vi-VN')} đ)
                    </span>
                  </div>
                </div>

                {/* Journal Lines Table */}
                <div className="rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100/70 dark:bg-slate-900/60 text-slate-600 dark:text-slate-300 font-semibold border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">#</th>
                        <th className="py-2.5 px-3 w-28">Tài khoản</th>
                        <th className="py-2.5 px-3">Tên tài khoản & Diễn giải nghiệp vụ</th>
                        <th className="py-2.5 px-3 text-right w-40">Số tiền Nợ (Debit)</th>
                        <th className="py-2.5 px-3 text-right w-40">Số tiền Có (Credit)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50 font-mono">
                      {previewJournalEntry?.lines.map((line, idx) => (
                        <tr key={line.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40">
                          <td className="py-2.5 px-3 text-center text-slate-400">{idx + 1}</td>
                          <td className="py-2.5 px-3">
                            <span className="px-2 py-0.5 rounded font-bold bg-slate-100 dark:bg-slate-700 text-indigo-600 dark:text-indigo-400">
                              {line.accountCode}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-sans">
                            <div className="font-semibold text-slate-800 dark:text-slate-200">{line.accountName}</div>
                            <div className="text-[11px] text-slate-500">{line.description}</div>
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                            {line.debitAmount > 0 ? `${line.debitAmount.toLocaleString('vi-VN')} đ` : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 dark:text-slate-100">
                            {line.creditAmount > 0 ? `${line.creditAmount.toLocaleString('vi-VN')} đ` : '-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-slate-50 dark:bg-slate-900/80 font-mono font-bold text-xs border-t border-slate-200 dark:border-slate-700">
                      <tr>
                        <td colSpan={3} className="py-3 px-3 text-right font-sans text-slate-700 dark:text-slate-300">
                          TỔNG CỘNG PHÁT SINH NỢ / CÓ:
                        </td>
                        <td className="py-3 px-3 text-right text-indigo-600 dark:text-indigo-400">
                          {(previewJournalEntry?.totalDebit || 0).toLocaleString('vi-VN')} đ
                        </td>
                        <td className="py-3 px-3 text-right text-indigo-600 dark:text-indigo-400">
                          {(previewJournalEntry?.totalCredit || 0).toLocaleString('vi-VN')} đ
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            ) : (
              /* RAW JSON SCHEMA OUTPUT TAB */
              <div className="rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-xs overflow-x-auto max-h-[500px]">
                <pre>{JSON.stringify(rawInvoice.extractedData, null, 2)}</pre>
              </div>
            )
          ) : (
            <div className="text-center py-16 space-y-3">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
              <p className="text-sm text-slate-500">Đang tải hóa đơn...</p>
            </div>
          )}
        </div>

        {/* MODAL FOOTER */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Giao dịch đảm bảo tính toàn vẹn (Atomic Transaction & All-or-Nothing Rollback)</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              Đóng
            </button>

            {!isPosted ? (
              <button
                disabled={isPosted || hasErrors || isExtracting}
                onClick={handleConfirmAndPost}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white shadow-md transition-all flex items-center gap-2 ${
                  hasErrors
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700 active:scale-98'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                Xác nhận & Ghi sổ Tự động (Atomic)
              </button>
            ) : (
              <button
                disabled
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 text-white flex items-center gap-2 cursor-default"
              >
                <Check className="w-4 h-4" />
                Đã ghi sổ vào Hệ thống
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
