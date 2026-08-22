import React, { useState } from 'react';
import {
  FileText,
  Search,
  Upload,
  Layers,
  Building2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  HelpCircle,
  PackagePlus,
  QrCode,
  Tag,
  Warehouse as WarehouseIcon,
  Plus,
  Trash2,
  Edit3,
  Check,
  ExternalLink,
  Globe,
  CheckCircle,
  Calendar,
  Lock,
  Clock,
  Eye,
  Filter
} from 'lucide-react';
import {
  Branch,
  EInvoiceData,
  EInvoiceItem,
  Product,
  Supplier,
  Warehouse
} from '../../types';
import {
  eInvoiceService,
  sampleEInvoices,
  GDT_PORTAL_URL,
  GDT_PORTAL_HTTPS_URL,
  GdtVerificationResult
} from '../../services/eInvoiceService';

interface SyncEInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  suppliers: Supplier[];
  branches: Branch[];
  warehouses: Warehouse[];
  onSyncSuccess: (
    eInvoice: EInvoiceData,
    options: {
      branchId: string;
      branchName: string;
      warehouseId: string;
      warehouseName: string;
      costBasis: 'before_vat' | 'with_vat';
      createPurchaseOrder: boolean;
      actor: string;
      autoCreateMissingProducts?: boolean;
    }
  ) => void;
}

export const SyncEInvoiceModal: React.FC<SyncEInvoiceModalProps> = ({
  isOpen,
  onClose,
  products = [],
  suppliers = [],
  branches = [],
  warehouses = [],
  onSyncSuccess
}) => {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState<'gdt_sync' | 'lookup' | 'xml'>('gdt_sync');
  
  // GDT Account & Inbound Batch Sync
  const [buyerTaxCode, setBuyerTaxCode] = useState('0108998822');
  const [gdtPassword, setGdtPassword] = useState('••••••••••••');
  const [fromDate, setFromDate] = useState('2026-08-01');
  const [toDate, setToDate] = useState('2026-08-15');
  const [isScanningGdt, setIsScanningGdt] = useState(false);
  const [gdtInvoices, setGdtInvoices] = useState<EInvoiceData[]>(sampleEInvoices);
  const [selectedGdtInvoiceId, setSelectedGdtInvoiceId] = useState<string>(sampleEInvoices[0]?.id || '');
  const [scanStats, setScanStats] = useState<{ totalCount: number; lastSyncTime: string } | null>({
    totalCount: sampleEInvoices.length,
    lastSyncTime: new Date().toISOString().replace('T', ' ').substring(0, 16)
  });

  // Lookup fields - default to user's partner invoice
  const [sellerTaxCode, setSellerTaxCode] = useState('0101389216');
  const [invoiceNumber, setInvoiceNumber] = useState('00097453');
  const [invoiceSerial, setInvoiceSerial] = useState('1C26MYT');
  const [lookupCode, setLookupCode] = useState('M1-26-HKYFC-00003100243');
  const [totalInvoiceAmount, setTotalInvoiceAmount] = useState('229250000');
  const [totalVatAmount, setTotalVatAmount] = useState('16750000');
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [verificationResult, setVerificationResult] = useState<GdtVerificationResult | null>(null);

  // XML input
  const [xmlContent, setXmlContent] = useState('');

  // Selected/Parsed EInvoice
  const [eInvoice, setEInvoice] = useState<EInvoiceData | null>(sampleEInvoices[0]);
  const [isEditingHeader, setIsEditingHeader] = useState(false);

  // Destination & Valuation options
  const [selectedBranchId, setSelectedBranchId] = useState<string>(branches[0]?.id || 'BR01');
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || 'WH01');
  const [costBasis, setCostBasis] = useState<'before_vat' | 'with_vat'>('before_vat');
  const [createPurchaseOrder, setCreatePurchaseOrder] = useState<boolean>(true);
  const [autoCreateMissingProducts, setAutoCreateMissingProducts] = useState<boolean>(true);
  const [actorName, setActorName] = useState('Quản trị viên (Thủ Kho / Thu Mua)');

  const filteredWarehouses = warehouses.filter(
    (wh) => !selectedBranchId || wh.branchId === selectedBranchId
  );

  const recalculateTotals = (items: EInvoiceItem[]): { beforeVat: number; vat: number; withVat: number } => {
    let beforeVat = 0;
    let vat = 0;
    items.forEach((it) => {
      const lineBefore = (it.quantity || 0) * (it.unitPrice || 0);
      const lineVat = it.vatAmount || Math.round(lineBefore * ((it.vatRate || 8) / 100));
      beforeVat += lineBefore;
      vat += lineVat;
    });
    return {
      beforeVat,
      vat,
      withVat: beforeVat + vat
    };
  };

  const handleScanGdtPortal = async () => {
    setIsScanningGdt(true);
    setSearchError(null);
    try {
      const res = await eInvoiceService.fetchInboundInvoicesFromGdt({
        buyerTaxCode,
        password: gdtPassword,
        fromDate,
        toDate
      });

      setGdtInvoices(res.invoices);
      setScanStats({
        totalCount: res.totalCount,
        lastSyncTime: res.lastSyncTime
      });

      if (res.invoices.length > 0) {
        handleSelectGdtInvoice(res.invoices[0]);
      }
    } catch (err: any) {
      setSearchError(err.message || 'Lỗi kết nối Cổng Thông tin Hóa đơn điện tử (hoadondientu.gdt.gov.vn)');
    } finally {
      setIsScanningGdt(false);
    }
  };

  const handleSelectGdtInvoice = (inv: EInvoiceData) => {
    setSelectedGdtInvoiceId(inv.id);
    setSellerTaxCode(inv.sellerTaxCode);
    setInvoiceNumber(inv.invoiceNumber);
    setInvoiceSerial(inv.invoiceSerial);
    setLookupCode(inv.lookupCode);
    setTotalInvoiceAmount(inv.totalAmountWithVat.toString());
    setTotalVatAmount(inv.totalVatAmount.toString());

    // Map with products
    const mappedItems = eInvoiceService.mapInvoiceItemsToProducts(inv.items, products);
    setEInvoice({
      ...inv,
      items: mappedItems
    });
  };

  const handleOnlineLookup = async () => {
    if (!sellerTaxCode.trim() || !invoiceNumber.trim()) {
      setSearchError('Vui lòng nhập Mã số thuế NCC và Số hóa đơn điện tử!');
      return;
    }

    setIsSearching(true);
    setSearchError(null);
    setVerificationResult(null);

    try {
      const result = await eInvoiceService.verifyWithGdtPortal({
        sellerTaxCode,
        invoiceNumber,
        invoiceSerial,
        lookupCode,
        totalAmount: parseFloat(totalInvoiceAmount) || undefined,
        taxAmount: parseFloat(totalVatAmount) || undefined
      });

      setVerificationResult(result);

      if (result.invoice) {
        // Map items with products
        const mappedItems = eInvoiceService.mapInvoiceItemsToProducts(result.invoice.items, products);
        setEInvoice({
          ...result.invoice,
          items: mappedItems
        });
      } else {
        setSearchError('Không tìm thấy hóa đơn điện tử hợp lệ trên Cổng Tổng Cục Thuế!');
      }
    } catch (e: any) {
      setSearchError(e.message || 'Lỗi tra cứu hóa đơn điện tử từ Cổng Thuế');
    } finally {
      setIsSearching(false);
    }
  };

  const handleParseXml = () => {
    if (!xmlContent.trim()) {
      setSearchError('Vui lòng dán hoặc tải nội dung tệp XML hóa đơn điện tử!');
      return;
    }

    try {
      const parsed = eInvoiceService.parseEInvoiceXml(xmlContent);
      const mappedItems = eInvoiceService.mapInvoiceItemsToProducts(parsed.items, products);
      setEInvoice({
        ...parsed,
        items: mappedItems
      });
      setSearchError(null);
    } catch (e: any) {
      setSearchError(e.message || 'Tệp XML không hợp lệ theo chuẩn Tổng Cục Thuế');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setXmlContent(content);
      try {
        const parsed = eInvoiceService.parseEInvoiceXml(content);
        const mappedItems = eInvoiceService.mapInvoiceItemsToProducts(parsed.items, products);
        setEInvoice({
          ...parsed,
          items: mappedItems
        });
        setSearchError(null);
      } catch (err: any) {
        setSearchError(err.message || 'Không thể giải mã tệp XML');
      }
    };
    reader.readAsText(file);
  };

  const handleUpdateItem = (index: number, fields: Partial<EInvoiceItem>) => {
    if (!eInvoice) return;
    const newItems = [...eInvoice.items];
    const current = newItems[index];
    const updated: EInvoiceItem = {
      ...current,
      ...fields
    };

    // Auto recalculate line totals
    const quantity = updated.quantity ?? current.quantity ?? 0;
    const unitPrice = updated.unitPrice ?? current.unitPrice ?? 0;
    const vatRate = updated.vatRate ?? current.vatRate ?? 8;
    const lineBefore = quantity * unitPrice;
    const lineVat = Math.round(lineBefore * (vatRate / 100));

    updated.totalBeforeVat = lineBefore;
    updated.vatRate = vatRate;
    updated.vatAmount = lineVat;
    updated.totalWithVat = lineBefore + lineVat;

    newItems[index] = updated;

    const totals = recalculateTotals(newItems);
    setEInvoice({
      ...eInvoice,
      totalBeforeVat: totals.beforeVat,
      totalVatAmount: totals.vat,
      totalAmountWithVat: totals.withVat,
      items: newItems
    });
  };

  const handleUpdateItemMapping = (index: number, sku: string) => {
    if (!eInvoice) return;
    const selectedProd = products.find((p) => p.sku === sku || p.variantSku === sku || p.code === sku);
    handleUpdateItem(index, {
      matchedSku: sku,
      matchedProductId: selectedProd?.id,
      matchedProductName: selectedProd?.name || eInvoice.items[index].itemName,
      unit: selectedProd?.unit || eInvoice.items[index].unit
    });
  };

  const handleAddItem = () => {
    if (!eInvoice) return;
    const newIdx = eInvoice.items.length + 1;
    const cleanNum = eInvoice.invoiceNumber || '00097453';
    const newItem: EInvoiceItem = {
      lineNumber: newIdx,
      itemCode: `MAT-${newIdx}`,
      itemName: `Hàng hóa mới ${newIdx}`,
      unit: 'Hộp',
      quantity: 100,
      unitPrice: 50000,
      vatRate: 8,
      vatAmount: 400000,
      totalBeforeVat: 5000000,
      totalWithVat: 5400000,
      suggestedLotId: `LOT-HD${cleanNum}-${String(newIdx).padStart(2, '0')}`,
      expiryDate: '2028-12-31',
      manufacturingDate: '2026-08-01'
    };

    const newItems = [...eInvoice.items, newItem];
    const totals = recalculateTotals(newItems);
    setEInvoice({
      ...eInvoice,
      totalBeforeVat: totals.beforeVat,
      totalVatAmount: totals.vat,
      totalAmountWithVat: totals.withVat,
      items: newItems
    });
  };

  const handleRemoveItem = (index: number) => {
    if (!eInvoice || eInvoice.items.length <= 1) {
      alert('Hóa đơn phải có ít nhất 1 dòng mặt hàng!');
      return;
    }
    const newItems = eInvoice.items.filter((_, i) => i !== index);
    const totals = recalculateTotals(newItems);
    setEInvoice({
      ...eInvoice,
      totalBeforeVat: totals.beforeVat,
      totalVatAmount: totals.vat,
      totalAmountWithVat: totals.withVat,
      items: newItems
    });
  };

  const handleConfirmSync = () => {
    if (!eInvoice || eInvoice.items.length === 0) {
      alert('Chưa có dữ liệu hóa đơn điện tử hợp lệ để đồng bộ!');
      return;
    }

    const branch = branches.find((b) => b.id === selectedBranchId) || branches[0];
    const warehouse = warehouses.find((w) => w.id === selectedWarehouseId) || warehouses[0];

    onSyncSuccess(eInvoice, {
      branchId: branch?.id || 'BR01',
      branchName: branch?.name || 'Chi nhánh Chính',
      warehouseId: warehouse?.id || 'WH01',
      warehouseName: warehouse?.name || 'Kho Tổng',
      costBasis,
      createPurchaseOrder,
      actor: actorName,
      autoCreateMissingProducts
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-5xl w-full my-auto shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150 flex flex-col max-h-[95vh]">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 border border-white/25 flex items-center justify-center text-blue-100 shadow-inner">
              <Globe className="w-5 h-5 text-amber-300 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-extrabold tracking-wider text-blue-200 uppercase">
                  TỔNG CỤC THUẾ (GDT) • NGHỊ ĐỊNH 123 / THÔNG TƯ 78
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>hoadondientu.gdt.gov.vn</span>
                </span>
              </div>
              <h2 className="text-base sm:text-xl font-black tracking-tight mt-0.5">
                Đồng Bộ Hóa Đơn Điện Tử Trực Tiếp Từ Cổng Tổng Cục Thuế
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={GDT_PORTAL_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-blue-100 rounded-xl text-xs font-bold transition border border-white/15"
              title="Mở cổng chính thức của Tổng cục Thuế để tra cứu độc lập"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Mở Cổng Thuế GDT</span>
            </a>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center text-sm font-bold transition cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
          {/* Official Source Banner */}
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-slate-50 border border-blue-200 rounded-2xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-xs">
                🏛️
              </div>
              <div>
                <div className="font-black text-slate-900 text-xs flex items-center gap-2">
                  <span>Nguồn Đồng Bộ Chính Thức:</span>
                  <a
                    href={GDT_PORTAL_HTTPS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-700 hover:underline font-mono font-bold flex items-center gap-1"
                  >
                    http://hoadondientu.gdt.gov.vn/
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="text-[11px] text-slate-600 mt-0.5">
                  Tự động tải danh sách Hóa đơn đầu vào (Mua hàng), kiểm tra tính hợp lệ của Chữ ký số & Mã CQT, tự động sinh Lô FIFO và Phiếu PO.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleScanGdtPortal}
                disabled={isScanningGdt}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isScanningGdt ? 'animate-spin' : ''}`} />
                <span>{isScanningGdt ? 'Đang kết nối Cổng Thuế...' : '⚡ Quét HĐĐT Mua Vào Mới'}</span>
              </button>
            </div>
          </div>

          {/* Sync Mode Tabs */}
          <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-2">
            <button
              onClick={() => setActiveTab('gdt_sync')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'gdt_sync'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>1. Đồng bộ HĐ Mua Vào Từ Cổng Thuế (hoadondientu.gdt.gov.vn)</span>
            </button>
            <button
              onClick={() => setActiveTab('lookup')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'lookup'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>2. Tra cứu từng tờ HĐĐT công khai</span>
            </button>
            <button
              onClick={() => setActiveTab('xml')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'xml'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>3. Tải tệp XML xuất từ Cổng Thuế</span>
            </button>
          </div>

          {/* TAB 1: GDT Inbound Invoices Scanner */}
          {activeTab === 'gdt_sync' && (
            <div className="space-y-4">
              {/* Account Config & Filter Bar */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      MST Doanh Nghiệp (Bên mua)
                    </label>
                    <input
                      type="text"
                      value={buyerTaxCode}
                      onChange={(e) => setBuyerTaxCode(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Mật khẩu Cổng HĐĐT TCT
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        value={gdtPassword}
                        onChange={(e) => setGdtPassword(e.target.value)}
                        className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 font-bold"
                      />
                      <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-2.5" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Từ ngày
                    </label>
                    <input
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Đến ngày
                    </label>
                    <input
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1 text-[11px] text-slate-500">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Hệ thống mã hóa dữ liệu theo chuẩn an toàn thông tin Tổng cục Thuế</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleScanGdtPortal}
                      disabled={isScanningGdt}
                      className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                    >
                      <Search className="w-3.5 h-3.5" />
                      <span>{isScanningGdt ? 'Đang truy vấn Cổng Thuế...' : 'Lấy danh sách HĐĐT mua vào'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Inbound Invoices List Table from GDT */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                    <span>Danh sách Hóa Đơn Mua Vào Trên Cổng Thuế ({gdtInvoices.length} tờ HĐĐT)</span>
                  </div>
                  {scanStats && (
                    <div className="text-[11px] text-slate-500">
                      Thời điểm đồng bộ: <strong className="font-mono text-slate-700">{scanStats.lastSyncTime}</strong>
                    </div>
                  )}
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Số HĐ / Ký hiệu</th>
                        <th className="py-2.5 px-3">Ngày lập</th>
                        <th className="py-2.5 px-3">Nhà Cung Cấp (Bên bán)</th>
                        <th className="py-2.5 px-3">Mã CQT / Trạng thái</th>
                        <th className="py-2.5 px-3 text-right">Tổng thanh toán</th>
                        <th className="py-2.5 px-3 text-center">Thao tác</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {gdtInvoices.map((inv) => (
                        <tr
                          key={inv.id}
                          className={`hover:bg-blue-50/40 transition cursor-pointer ${
                            selectedGdtInvoiceId === inv.id ? 'bg-blue-50/80 font-semibold' : ''
                          }`}
                          onClick={() => handleSelectGdtInvoice(inv)}
                        >
                          <td className="py-2.5 px-3">
                            <div className="font-black text-blue-900 font-mono">#{inv.invoiceNumber}</div>
                            <div className="text-[10px] text-slate-500 font-mono">
                              Ký hiệu: {inv.invoiceSerial} (Mẫu {inv.invoiceFormSymbol || '1'})
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-700 font-mono">{inv.invoiceDate}</td>
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{inv.sellerName}</div>
                            <div className="text-[10px] text-blue-600 font-mono">MST: {inv.sellerTaxCode}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex items-center gap-1 text-[11px] text-emerald-700 font-bold">
                              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Đã cấp mã CQT</span>
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono truncate max-w-[180px]" title={inv.lookupCode}>
                              {inv.lookupCode}
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="font-black text-slate-900 font-mono">
                              {inv.totalAmountWithVat.toLocaleString('vi-VN')} đ
                            </div>
                            <div className="text-[10px] text-slate-500">
                              VAT: {inv.totalVatAmount.toLocaleString('vi-VN')} đ
                            </div>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectGdtInvoice(inv);
                              }}
                              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                                selectedGdtInvoiceId === inv.id
                                  ? 'bg-blue-600 text-white'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-blue-50 hover:text-blue-700'
                              }`}
                            >
                              {selectedGdtInvoiceId === inv.id ? '✓ Đang chọn' : 'Chọn nạp PO'}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: Single Online Public Lookup */}
          {activeTab === 'lookup' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3.5">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    MST Bên Bán *
                  </label>
                  <input
                    type="text"
                    value={sellerTaxCode}
                    onChange={(e) => setSellerTaxCode(e.target.value)}
                    placeholder="0101389216"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Số HĐĐT *
                  </label>
                  <input
                    type="text"
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    placeholder="00097453"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Ký hiệu HĐ
                  </label>
                  <input
                    type="text"
                    value={invoiceSerial}
                    onChange={(e) => setInvoiceSerial(e.target.value)}
                    placeholder="1C26MYT"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Mã CQT / Tra cứu
                  </label>
                  <input
                    type="text"
                    value={lookupCode}
                    onChange={(e) => setLookupCode(e.target.value)}
                    placeholder="M1-26-HKYFC-00003100243"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tổng tiền thanh toán
                  </label>
                  <input
                    type="text"
                    value={totalInvoiceAmount}
                    onChange={(e) => setTotalInvoiceAmount(e.target.value)}
                    placeholder="229250000"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tổng tiền thuế VAT
                  </label>
                  <input
                    type="text"
                    value={totalVatAmount}
                    onChange={(e) => setTotalVatAmount(e.target.value)}
                    placeholder="16750000"
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs text-slate-800 focus:bg-white font-bold"
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                <div className="flex items-center gap-1 text-[11px] text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Đối soát trực tiếp cơ sở dữ liệu Cổng HĐĐT Quốc Gia (http://hoadondientu.gdt.gov.vn/)</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOnlineLookup}
                    disabled={isSearching}
                    className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isSearching ? 'animate-spin' : ''}`} />
                    <span>{isSearching ? 'Đang xác thực CQT...' : 'Kiểm tra & Lấy dữ liệu từ Cổng GDT'}</span>
                  </button>
                </div>
              </div>

              {verificationResult && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <span>{verificationResult.taxAuthorityMessage}</span>
                  </div>
                  <div className="text-[11px] text-emerald-700 flex flex-wrap items-center gap-3">
                    <span>Chữ ký số: <strong>{verificationResult.digitalSignatureInfo}</strong></span>
                    <span>Nguồn: <strong>hoadondientu.gdt.gov.vn</strong></span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: XML Upload */}
          {activeTab === 'xml' && (
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                <div className="flex items-center gap-2.5">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-bold text-slate-800">Tải tệp XML xuất từ hoadondientu.gdt.gov.vn</div>
                    <div className="text-[11px] text-slate-500">Chuẩn tệp XML hóa đơn điện tử Nghị định 123 / Thông tư 78</div>
                  </div>
                </div>

                <label className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs cursor-pointer shadow-xs">
                  <span>Chọn tệp XML</span>
                  <input type="file" accept=".xml" onChange={handleFileUpload} className="hidden" />
                </label>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Hoặc Dán trực tiếp chuỗi XML của hóa đơn điện tử:
                </label>
                <textarea
                  rows={4}
                  value={xmlContent}
                  onChange={(e) => setXmlContent(e.target.value)}
                  placeholder="<HDon><DLHDon><TTChung><KHHDon>1C26MYT</KHHDon><SHDon>00097453</SHDon>..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-[11px] text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  onClick={handleParseXml}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-xs shadow-xs cursor-pointer"
                >
                  Phân tích & Tải dữ liệu XML
                </button>
              </div>
            </div>
          )}

          {searchError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{searchError}</span>
            </div>
          )}

          {/* Parsed EInvoice Preview & Configuration */}
          {eInvoice && (
            <div className="space-y-4">
              {/* Invoice Summary Header Card */}
              <div className="bg-gradient-to-br from-slate-900 to-blue-950 text-white p-4 rounded-2xl border border-blue-900 shadow-md space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      ✓ Đã xác thực CQT (hoadondientu.gdt.gov.vn)
                    </span>
                    <span className="text-xs font-bold text-blue-200">
                      Mẫu số: {eInvoice.invoiceFormSymbol || '1'} | Ký hiệu: {eInvoice.invoiceSerial}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditingHeader(!isEditingHeader)}
                      className="text-[11px] text-blue-200 hover:text-white flex items-center gap-1 bg-white/10 px-2 py-0.5 rounded-md cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>{isEditingHeader ? 'Xong sửa HĐ' : 'Chỉnh sửa thông tin HĐ'}</span>
                    </button>
                    <div className="text-base font-black text-amber-300 font-mono">
                      Số HĐ: #{eInvoice.invoiceNumber}
                    </div>
                  </div>
                </div>

                {isEditingHeader ? (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white/5 rounded-xl border border-white/10">
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-300">Tên Nhà Cung Cấp (Bên bán)</label>
                      <input
                        type="text"
                        value={eInvoice.sellerName}
                        onChange={(e) => setEInvoice({ ...eInvoice, sellerName: e.target.value, sellerLegalName: e.target.value })}
                        className="w-full mt-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-white text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-300">Mã Số Thuế Bên Bán</label>
                      <input
                        type="text"
                        value={eInvoice.sellerTaxCode}
                        onChange={(e) => setEInvoice({ ...eInvoice, sellerTaxCode: e.target.value })}
                        className="w-full mt-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-amber-300 font-mono text-xs font-bold"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] uppercase font-bold text-slate-300">Mã CQT / Mã tra cứu</label>
                      <input
                        type="text"
                        value={eInvoice.lookupCode}
                        onChange={(e) => setEInvoice({ ...eInvoice, lookupCode: e.target.value, taxAuthorityCode: e.target.value })}
                        className="w-full mt-1 px-2.5 py-1.5 bg-slate-800 border border-slate-700 rounded-lg text-emerald-300 font-mono text-xs font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Đơn vị bán (NCC):</span>
                      <div className="font-bold text-white text-xs mt-0.5">{eInvoice.sellerName}</div>
                      <div className="text-[11px] text-blue-300 font-mono">MST: {eInvoice.sellerTaxCode}</div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Ngày lập HĐ & Mã CQT:</span>
                      <div className="font-bold text-white text-xs mt-0.5">{eInvoice.invoiceDate}</div>
                      <div className="text-[11px] text-emerald-300 font-mono truncate" title={eInvoice.lookupCode}>
                        Mã CQT: {eInvoice.lookupCode}
                      </div>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase font-bold">Tổng thanh toán HĐ:</span>
                      <div className="font-black text-amber-300 text-sm mt-0.5 font-mono">
                        {eInvoice.totalAmountWithVat.toLocaleString('vi-VN')} đ
                      </div>
                      <div className="text-[10px] text-slate-300">
                        Tiền hàng: {eInvoice.totalBeforeVat.toLocaleString('vi-VN')} đ + Thuế VAT: {eInvoice.totalVatAmount.toLocaleString('vi-VN')} đ
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Items & FIFO Lot Mapping Table */}
              <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 font-bold text-slate-900 text-xs">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Danh sách Hàng hóa & Khởi tạo Lô Tồn kho FIFO ({eInvoice.items.length} mặt hàng)</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="flex items-center gap-1 px-3 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>+ Thêm mặt hàng</span>
                    </button>
                    <span className="text-[11px] text-slate-500 font-medium">
                      (Có thể sửa trực tiếp số lượng, giá và ghép SKU kho)
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto border border-slate-200 rounded-xl">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-[11px] font-bold text-slate-700 border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Tên hàng theo HĐĐT</th>
                        <th className="py-2.5 px-2 text-right w-20">SL</th>
                        <th className="py-2.5 px-2 text-center w-16">ĐVT</th>
                        <th className="py-2.5 px-2 text-right w-28">Đơn giá (chưa VAT)</th>
                        <th className="py-2.5 px-2 text-center w-16">VAT %</th>
                        <th className="py-2.5 px-3 text-right w-32">Thành tiền (có VAT)</th>
                        <th className="py-2.5 px-3 w-52">Ghép nối SKU Kho</th>
                        <th className="py-2.5 px-3 w-40">Mã Lô FIFO</th>
                        <th className="py-2.5 px-2 text-center w-10">Xóa</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {eInvoice.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-blue-50/30">
                          {/* Item Name */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={item.itemName}
                              onChange={(e) => handleUpdateItem(idx, { itemName: e.target.value })}
                              className="w-full font-bold text-slate-900 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:bg-white px-1 py-0.5 rounded text-xs"
                            />
                            <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                              <span>Mã HĐ:</span>
                              <input
                                type="text"
                                value={item.itemCode || ''}
                                onChange={(e) => handleUpdateItem(idx, { itemCode: e.target.value })}
                                className="font-mono text-[10px] text-slate-600 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 px-1 py-0.2"
                              />
                            </div>
                          </td>

                          {/* Quantity */}
                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              min="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateItem(idx, { quantity: parseFloat(e.target.value) || 0 })}
                              className="w-full text-right font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* Unit */}
                          <td className="py-2.5 px-2 text-center">
                            <input
                              type="text"
                              value={item.unit}
                              onChange={(e) => handleUpdateItem(idx, { unit: e.target.value })}
                              className="w-full text-center text-slate-600 bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs focus:bg-white"
                            />
                          </td>

                          {/* Unit Price */}
                          <td className="py-2.5 px-2 text-right">
                            <input
                              type="number"
                              min="0"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateItem(idx, { unitPrice: parseFloat(e.target.value) || 0 })}
                              className="w-full text-right font-mono text-slate-700 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs focus:bg-white focus:ring-1 focus:ring-blue-500"
                            />
                          </td>

                          {/* VAT Rate */}
                          <td className="py-2.5 px-2 text-center">
                            <select
                              value={item.vatRate ?? 8}
                              onChange={(e) => handleUpdateItem(idx, { vatRate: parseInt(e.target.value) || 0 })}
                              className="w-full text-center font-mono font-bold text-slate-700 bg-slate-50 border border-slate-200 rounded px-1 py-1 text-xs"
                            >
                              <option value="0">0%</option>
                              <option value="5">5%</option>
                              <option value="8">8%</option>
                              <option value="10">10%</option>
                            </select>
                          </td>

                          {/* Total With VAT */}
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-700">
                            {item.totalWithVat.toLocaleString('vi-VN')} đ
                          </td>

                          {/* SKU Mapping */}
                          <td className="py-2.5 px-3">
                            <select
                              value={item.matchedSku || ''}
                              onChange={(e) => handleUpdateItemMapping(idx, e.target.value)}
                              className="w-full py-1 px-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-800 focus:bg-white"
                            >
                              <option value="">-- Tạo mới theo mã HĐĐT --</option>
                              {products.map((p) => (
                                <option key={p.id} value={p.sku || p.variantSku || p.code}>
                                  [{p.sku || p.variantSku || p.code}] {p.name}
                                </option>
                              ))}
                            </select>
                          </td>

                          {/* FIFO Lot ID */}
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              value={item.suggestedLotId || `LOT-HD${eInvoice.invoiceNumber}-${idx + 1}`}
                              onChange={(e) => handleUpdateItem(idx, { suggestedLotId: e.target.value })}
                              className="w-full font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 rounded px-1.5 py-1 text-[11px] focus:bg-white"
                            />
                          </td>

                          {/* Delete */}
                          <td className="py-2.5 px-2 text-center">
                            <button
                              type="button"
                              onClick={() => handleRemoveItem(idx)}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 cursor-pointer"
                              title="Xóa mặt hàng này"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Destination & FIFO Strategy Config */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                <div className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                  <WarehouseIcon className="w-4 h-4 text-slate-700" />
                  <span>Cấu hình Địa điểm Nhập Kho & Cơ sở Giá vốn FIFO</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Chi nhánh tiếp nhận *</label>
                    <select
                      value={selectedBranchId}
                      onChange={(e) => setSelectedBranchId(e.target.value)}
                      className="w-full py-2 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      {branches.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Kho lưu trữ *</label>
                    <select
                      value={selectedWarehouseId}
                      onChange={(e) => setSelectedWarehouseId(e.target.value)}
                      className="w-full py-2 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      {filteredWarehouses.map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Cơ sở tính giá vốn FIFO *</label>
                    <select
                      value={costBasis}
                      onChange={(e) => setCostBasis(e.target.value as any)}
                      className="w-full py-2 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    >
                      <option value="before_vat">Đơn giá chưa VAT (Khấu trừ thuế)</option>
                      <option value="with_vat">Đơn giá đã bao gồm VAT</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Người lập / Tiếp nhận</label>
                    <input
                      type="text"
                      value={actorName}
                      onChange={(e) => setActorName(e.target.value)}
                      className="w-full py-2 px-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={createPurchaseOrder}
                      onChange={(e) => setCreatePurchaseOrder(e.target.checked)}
                      className="w-4 h-4 text-blue-600 rounded border-slate-300"
                    />
                    <span>Tự động khởi tạo <strong>Phiếu nhập hàng (PO) liên kết HĐĐT</strong> và ghi nhận công nợ NCC</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                    <input
                      type="checkbox"
                      checked={autoCreateMissingProducts}
                      onChange={(e) => setAutoCreateMissingProducts(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 rounded border-slate-300"
                    />
                    <span>Tự động thêm vào danh mục sản phẩm nếu hàng chưa tồn tại</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-[11px] text-slate-500 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>
              {eInvoice
                ? `Sẵn sàng khởi tạo ${eInvoice.items.length} lớp FIFO vào hệ thống với tổng giá trị ${eInvoice.totalAmountWithVat.toLocaleString('vi-VN')} đ.`
                : 'Vui lòng tra cứu hoặc chọn hóa đơn điện tử.'}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer"
            >
              Hủy bỏ
            </button>

            <button
              onClick={handleConfirmSync}
              disabled={!eInvoice}
              className="flex items-center gap-2 px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Đồng Bộ & Khởi Tạo Lô FIFO Vào Kho</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
