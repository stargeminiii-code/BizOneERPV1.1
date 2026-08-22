import React, { useState, useMemo } from 'react';
import {
  Truck,
  Plus,
  Search,
  Filter,
  Download,
  Calendar,
  DollarSign,
  AlertCircle,
  Building,
  CheckCircle2,
  Clock,
  ChevronRight,
  Layers,
  X,
  RotateCcw,
  Eye,
  FileText,
  Zap,
  Trash2,
  Edit3
} from 'lucide-react';
import { PurchaseOrder, Supplier, Product, InventoryLot } from '../types';
import { DeletePOModal } from './Modals/DeletePOModal';

interface PurchasingViewProps {
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  products: Product[];
  inventoryLots: InventoryLot[];
  onOpenCreatePO: (productName?: string) => void;
  onEditPurchaseOrder?: (po: PurchaseOrder) => void;
  onOpenSyncEInvoice?: () => void;
  onOpenEInvoiceEntry?: () => void;
  onOpenInvoiceExtraction?: () => void;
  onDeletePurchaseOrder?: (poId: string, revertInventoryLots: boolean) => void;
}

export const PurchasingView: React.FC<PurchasingViewProps> = ({
  purchaseOrders = [],
  suppliers = [],
  products = [],
  inventoryLots = [],
  onOpenCreatePO,
  onEditPurchaseOrder,
  onOpenSyncEInvoice,
  onOpenEInvoiceEntry,
  onOpenInvoiceExtraction,
  onDeletePurchaseOrder
}) => {
  // Advanced Filter state
  const [globalSearch, setGlobalSearch] = useState('');
  const [filterSupplier, setFilterSupplier] = useState('all');
  const [filterWarehouse, setFilterWarehouse] = useState('all');
  const [filterPaymentStatus, setFilterPaymentStatus] = useState('all');
  const [filterOnlyOverpaid, setFilterOnlyOverpaid] = useState(false);
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterSku, setFilterSku] = useState('');
  const [filterLotCode, setFilterLotCode] = useState('');
  const [selectedPO, setSelectedPO] = useState<PurchaseOrder | null>(null);
  const [poToDelete, setPoToDelete] = useState<PurchaseOrder | null>(null);

  // Financial KPI calculations
  const totalPurchaseValue = useMemo(
    () => purchaseOrders.reduce((sum, po) => sum + po.totalAmount, 0),
    [purchaseOrders]
  );
  const totalPaid = useMemo(
    () => purchaseOrders.reduce((sum, po) => sum + (po.paidAmount || (po.status === 'completed' ? po.totalAmount : 0)), 0),
    [purchaseOrders]
  );
  const totalDebt = useMemo(
    () => purchaseOrders.reduce((sum, po) => sum + (po.debtAmount || (po.status === 'pending' ? po.totalAmount : 0)), 0),
    [purchaseOrders]
  );
  const totalOverpaid = useMemo(
    () => purchaseOrders.reduce((sum, po) => sum + (po.overpaidAmount || 0), 0),
    [purchaseOrders]
  );

  // Unique SKUs & Lots from PO items
  const uniqueSkus = useMemo(() => {
    const set = new Set<string>();
    purchaseOrders.forEach((po) => po.items?.forEach((i) => i.sku && set.add(i.sku)));
    return Array.from(set);
  }, [purchaseOrders]);

  // Strict AND filter logic
  const filteredPOs = useMemo(() => {
    return purchaseOrders.filter((po) => {
      // Global quick search
      if (globalSearch) {
        const s = globalSearch.toLowerCase();
        const matchesCode = po.code.toLowerCase().includes(s);
        const matchesSup = po.supplierName.toLowerCase().includes(s);
        const matchesItem = po.items?.some(
          (i) => i.productName.toLowerCase().includes(s) || (i.sku && i.sku.toLowerCase().includes(s)) || (i.lotCode && i.lotCode.toLowerCase().includes(s))
        );
        if (!matchesCode && !matchesSup && !matchesItem) return false;
      }

      // Supplier
      if (filterSupplier !== 'all' && po.supplierName !== filterSupplier) return false;

      // Warehouse
      if (filterWarehouse !== 'all' && po.warehouse !== filterWarehouse) return false;

      // Payment / Order Status
      if (filterPaymentStatus !== 'all') {
        if (filterPaymentStatus === 'paid' && (po.debtAmount || 0) > 0) return false;
        if (filterPaymentStatus === 'partial' && (po.status !== 'partial' && (!po.paidAmount || po.paidAmount >= po.totalAmount))) return false;
        if (filterPaymentStatus === 'debt' && (po.debtAmount || 0) <= 0) return false;
      }

      // Overpaid filter
      if (filterOnlyOverpaid && (po.overpaidAmount || 0) <= 0) return false;

      // SKU filter
      if (filterSku && !po.items?.some((i) => i.sku === filterSku)) return false;

      // Lot filter
      if (filterLotCode && !po.items?.some((i) => i.lotCode?.toLowerCase().includes(filterLotCode.toLowerCase()))) return false;

      // Date range
      const poDate = po.createdAt.substring(0, 10);
      if (filterStartDate && poDate < filterStartDate) return false;
      if (filterEndDate && poDate > filterEndDate) return false;

      return true;
    });
  }, [
    purchaseOrders,
    globalSearch,
    filterSupplier,
    filterWarehouse,
    filterPaymentStatus,
    filterOnlyOverpaid,
    filterSku,
    filterLotCode,
    filterStartDate,
    filterEndDate
  ]);

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (globalSearch) chips.push({ key: 'search', label: `Tìm: "${globalSearch}"`, onRemove: () => setGlobalSearch('') });
    if (filterSupplier !== 'all') chips.push({ key: 'sup', label: `NCC: ${filterSupplier}`, onRemove: () => setFilterSupplier('all') });
    if (filterWarehouse !== 'all') chips.push({ key: 'wh', label: `Kho: ${filterWarehouse}`, onRemove: () => setFilterWarehouse('all') });
    if (filterPaymentStatus !== 'all') {
      const label = filterPaymentStatus === 'paid' ? 'Đã thanh toán đủ' : filterPaymentStatus === 'partial' ? 'Trả một phần' : 'Còn nợ NCC';
      chips.push({ key: 'pay', label: `Thanh toán: ${label}`, onRemove: () => setFilterPaymentStatus('all') });
    }
    if (filterSku) chips.push({ key: 'sku', label: `SKU: ${filterSku}`, onRemove: () => setFilterSku('') });
    if (filterLotCode) chips.push({ key: 'lot', label: `Mã Lô: ${filterLotCode}`, onRemove: () => setFilterLotCode('') });
    if (filterStartDate) chips.push({ key: 'start', label: `Từ: ${filterStartDate}`, onRemove: () => setFilterStartDate('') });
    if (filterEndDate) chips.push({ key: 'end', label: `Đến: ${filterEndDate}`, onRemove: () => setFilterEndDate('') });
    return chips;
  }, [globalSearch, filterSupplier, filterWarehouse, filterPaymentStatus, filterSku, filterLotCode, filterStartDate, filterEndDate]);

  const handleClearAll = () => {
    setGlobalSearch('');
    setFilterSupplier('all');
    setFilterWarehouse('all');
    setFilterPaymentStatus('all');
    setFilterSku('');
    setFilterLotCode('');
    setFilterStartDate('');
    setFilterEndDate('');
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Nhập kho
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          {onOpenInvoiceExtraction && (
            <button
              onClick={onOpenInvoiceExtraction}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-xl text-xs font-black shadow-md shadow-indigo-600/25 transition cursor-pointer"
              title="Trích xuất tự động hóa đơn GTGT điện tử từ PDF qua AI, kiểm định đối soát và ghi sổ FIFO / Bút toán kế toán"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>✨ Quét PDF HĐĐT AI (NĐ 123)</span>
            </button>
          )}

          {onOpenEInvoiceEntry && (
            <button
              onClick={onOpenEInvoiceEntry}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-600/20 transition cursor-pointer"
              title="Nhập đầy đủ thông tin HĐĐT (MST, Ký hiệu, Số HĐ, Mã CQT, chi tiết hàng hóa, thuế GTGT, tiền bằng chữ, phân loại Product ID/Code)"
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>Nhập HĐĐT Thủ công</span>
            </button>
          )}

          {onOpenSyncEInvoice && (
            <button
              onClick={onOpenSyncEInvoice}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 text-blue-800 rounded-xl text-xs font-bold transition cursor-pointer"
              title="Đồng bộ phiếu nhập và Lô FIFO từ Hóa đơn điện tử đối tác"
            >
              <span>Đồng Bộ HĐĐT Đối Tác</span>
            </button>
          )}

          <button
            onClick={() => alert('Xuất danh sách phiếu nhập kho sang tệp Excel')}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => onOpenCreatePO()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:px-4 sm:py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-600/20"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>+ Tạo phiếu nhập hàng (PO)</span>
          </button>
        </div>
      </div>

      {/* 4 Financial KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        {/* Card 1: Total Purchase Value */}
        <div
          onClick={() => {
            setFilterSupplier('all');
            setFilterWarehouse('all');
            setFilterPaymentStatus('all');
            setFilterOnlyOverpaid(false);
            setFilterSku('');
            setFilterLotCode('');
            setFilterStartDate('');
            setFilterEndDate('');
            setGlobalSearch('');
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            filterPaymentStatus === 'all' && !filterOnlyOverpaid
              ? 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-500/20'
              : 'bg-white border-slate-200 hover:border-blue-300'
          }`}
          title="Bấm để xem tất cả phiếu nhập hàng"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Tổng giá trị nhập (PO)</p>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900 mt-0.5 sm:mt-1">
              {formatVND(totalPurchaseValue)}
            </h3>
            <span className="text-[10px] text-blue-600 font-semibold">
              {purchaseOrders.length} phiếu nhập (Xem tất cả →)
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Truck className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2: Total Paid */}
        <div
          onClick={() => {
            setFilterOnlyOverpaid(false);
            setFilterPaymentStatus((prev) => (prev === 'paid' ? 'all' : 'paid'));
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            filterPaymentStatus === 'paid'
              ? 'bg-emerald-50/60 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white border-slate-200 hover:border-emerald-300'
          }`}
          title="Bấm để lọc các đơn nhập đã tất toán 100%"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase">Đã thanh toán NCC</p>
            <h3 className="text-base sm:text-xl font-extrabold text-emerald-700 mt-0.5 sm:mt-1">
              {formatVND(totalPaid)}
            </h3>
            <span className="text-[10px] text-emerald-600 font-semibold">
              {((totalPaid / (totalPurchaseValue || 1)) * 100).toFixed(1)}% giá trị (Bấm lọc)
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3: Remaining Debt */}
        <div
          onClick={() => {
            setFilterOnlyOverpaid(false);
            setFilterPaymentStatus((prev) => (prev === 'debt' ? 'all' : 'debt'));
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            filterPaymentStatus === 'debt'
              ? 'bg-rose-50/60 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-white border-slate-200 hover:border-rose-300'
          }`}
          title="Bấm để lọc các đơn nhập còn nợ NCC cần thanh toán"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-rose-600 uppercase">Còn nợ nhà cung cấp</p>
            <h3 className="text-base sm:text-xl font-extrabold text-rose-600 mt-0.5 sm:mt-1">
              {formatVND(totalDebt)}
            </h3>
            <span className="text-[10px] text-rose-600 font-semibold">Cần thanh toán theo kỳ (Bấm lọc)</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4: Overpaid / Deposit */}
        <div
          onClick={() => {
            setFilterPaymentStatus('all');
            setFilterOnlyOverpaid((prev) => !prev);
          }}
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-xs flex items-center justify-between cursor-pointer transition-all ${
            filterOnlyOverpaid
              ? 'bg-indigo-50/60 border-indigo-500 ring-2 ring-indigo-500/20'
              : 'bg-white border-slate-200 hover:border-indigo-300'
          }`}
          title="Bấm để lọc các đơn nhập đã trả thừa / dư nợ NCC"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-indigo-700 uppercase">Đã trả thừa (Dư nợ)</p>
            <h3 className="text-base sm:text-xl font-extrabold text-indigo-700 mt-0.5 sm:mt-1">
              {formatVND(totalOverpaid)}
            </h3>
            <span className="text-[10px] text-indigo-600 font-semibold">Khấu trừ các đơn sau (Bấm lọc)</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Advanced Filter Panel */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-amber-600" />
            <span>Bộ lọc phiếu nhập hàng (AND Multi-criteria)</span>
          </div>
          {activeChips.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Xóa bộ lọc ({activeChips.length})</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Quick Search */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tìm kiếm nhanh
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                value={globalSearch}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Mã PO, NCC, Tên sản phẩm..."
                className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Nhà cung cấp
            </label>
            <select
              value={filterSupplier}
              onChange={(e) => setFilterSupplier(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">Tất cả Nhà Cung Cấp ({suppliers.length})</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.name}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Tình trạng công nợ
            </label>
            <select
              value={filterPaymentStatus}
              onChange={(e) => setFilterPaymentStatus(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">Tất cả tình trạng</option>
              <option value="paid">Đã thanh toán đủ (Hết nợ)</option>
              <option value="partial">Thanh toán một phần</option>
              <option value="debt">Còn nợ NCC</option>
            </select>
          </div>

          {/* SKU */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Mã SKU mặt hàng
            </label>
            <select
              value={filterSku}
              onChange={(e) => setFilterSku(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="">Tất cả SKU ({products.length})</option>
              {products.map((p) => (
                <option key={p.sku} value={p.sku}>
                  [{p.sku}] {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Warehouse */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Kho nhập
            </label>
            <select
              value={filterWarehouse}
              onChange={(e) => setFilterWarehouse(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
            >
              <option value="all">Tất cả kho</option>
              <option value="Kho Tổng TP.HCM (Khu A)">Kho Tổng TP.HCM (Khu A)</option>
              <option value="Kho Thép Bình Dương (Khu B)">Kho Thép Bình Dương (Khu B)</option>
              <option value="Kho Phụ Kiện Hà Nội (Khu C)">Kho Phụ Kiện Hà Nội (Khu C)</option>
            </select>
          </div>

          {/* Date from */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Từ ngày nhập
            </label>
            <input
              type="date"
              value={filterStartDate}
              onChange={(e) => setFilterStartDate(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>

          {/* Date to */}
          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Đến ngày
            </label>
            <input
              type="date"
              value={filterEndDate}
              onChange={(e) => setFilterEndDate(e.target.value)}
              className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Chips */}
        {activeChips.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Bộ lọc đang áp dụng:</span>
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 bg-amber-50 text-amber-800 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-amber-200"
              >
                <span>{chip.label}</span>
                <button
                  onClick={chip.onRemove}
                  className="p-0.5 hover:bg-amber-200 rounded-full transition-colors text-amber-700 hover:text-amber-900"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* PO Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[900px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">MÃ PO</th>
                <th className="py-3 px-4">NGÀY NHẬP</th>
                <th className="py-3 px-4">NHÀ CUNG CẤP & KHO</th>
                <th className="py-3 px-4">LÔ HÀNG TẠO MỚI (LOTS)</th>
                <th className="py-3 px-4 text-right">TỔNG GIÁ TRỊ</th>
                <th className="py-3 px-4 text-right">ĐÃ TRẢ</th>
                <th className="py-3 px-4 text-right text-rose-600">CÒN NỢ</th>
                <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                <th className="py-3 px-4 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredPOs.map((po) => {
                const isDebt = (po.debtAmount || 0) > 0;
                const isPaid = (po.debtAmount || 0) === 0 && (po.paidAmount || 0) >= po.totalAmount;

                return (
                  <tr
                    key={po.id}
                    onClick={() => setSelectedPO(po)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    {/* PO Code */}
                    <td className="py-3.5 px-4 font-mono font-bold text-amber-700 whitespace-nowrap">
                      {po.code}
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                      {po.createdAt}
                    </td>

                    {/* Supplier & Warehouse */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{po.supplierName}</div>
                      <div className="text-[10px] text-slate-400">📍 {po.warehouse || 'Kho Tổng TP.HCM'}</div>
                    </td>

                    {/* Items & Lots */}
                    <td className="py-3.5 px-4">
                      <div className="space-y-1">
                        {po.items?.slice(0, 2).map((item, idx) => (
                          <div key={idx} className="flex items-center gap-1.5">
                            <span className="font-mono text-[10px] font-bold bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded border border-blue-200">
                              {item.lotCode || 'LOT-AUTO'}
                            </span>
                            <span className="line-clamp-1 text-slate-700">
                              {item.productName} ({item.quantity.toLocaleString('vi-VN')} {item.unit} @ {formatVND(item.price)})
                            </span>
                          </div>
                        ))}
                        {(po.items?.length || 0) > 2 && (
                          <span className="text-[10px] text-slate-400 italic">
                            + {(po.items?.length || 0) - 2} mặt hàng khác...
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Amount */}
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 whitespace-nowrap">
                      {formatVND(po.totalAmount)}
                    </td>

                    {/* Paid */}
                    <td className="py-3.5 px-4 text-right font-semibold text-emerald-700 whitespace-nowrap">
                      {formatVND(po.paidAmount || (po.status === 'completed' ? po.totalAmount : 0))}
                    </td>

                    {/* Debt */}
                    <td className="py-3.5 px-4 text-right font-bold whitespace-nowrap">
                      {isDebt ? (
                        <span className="text-rose-600 font-extrabold">
                          {formatVND(po.debtAmount || po.totalAmount)}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-normal">0 đ</span>
                      )}
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {isPaid ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          Đã thanh toán
                        </span>
                      ) : po.paidAmount && po.paidAmount > 0 ? (
                        <span className="bg-amber-50 text-amber-800 border border-amber-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          Trả 1 phần
                        </span>
                      ) : (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                          Chưa trả (Nợ)
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedPO(po);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                        >
                          Chi tiết PO
                        </button>
                        {onEditPurchaseOrder && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onEditPurchaseOrder(po);
                            }}
                            className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                            title="Chỉnh sửa đơn PO"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {onDeletePurchaseOrder && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setPoToDelete(po);
                            }}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title="Xóa / Hủy đơn PO"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* PO Detail View Modal */}
      {selectedPO && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center font-bold shadow-xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 font-mono">{selectedPO.code}</h2>
                  <p className="text-xs text-slate-500">
                    NCC: {selectedPO.supplierName} | Ngày nhập: {selectedPO.createdAt} | {selectedPO.warehouse || 'Kho Tổng TP.HCM'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedPO(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
              {/* Items in PO */}
              <div>
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-2">
                  Danh sách Lô hàng & Đơn giá vốn nhập
                </span>
                <div className="border border-slate-200 rounded-2xl overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 border-b border-slate-200">
                      <tr>
                        <th className="p-2.5">MÃ LÔ (LOT)</th>
                        <th className="p-2.5">MẶT HÀNG</th>
                        <th className="p-2.5 text-center">SỐ LƯỢNG</th>
                        <th className="p-2.5 text-right">ĐƠN GIÁ VỐN</th>
                        <th className="p-2.5 text-right">THÀNH TIỀN</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs">
                      {selectedPO.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2.5 font-mono font-bold text-blue-700">{item.lotCode || '--'}</td>
                          <td className="p-2.5 font-semibold text-slate-800">
                            {item.productName}
                            {item.sku && <span className="block text-[10px] font-mono text-slate-400">SKU: {item.sku}</span>}
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-900">
                            {item.quantity.toLocaleString('vi-VN')} {item.unit}
                          </td>
                          <td className="p-2.5 text-right font-medium text-slate-700">{formatVND(item.price)}</td>
                          <td className="p-2.5 text-right font-extrabold text-slate-900">
                            {formatVND(item.quantity * item.price)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Financial Breakdown */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex justify-between text-slate-600">
                  <span>Tổng tiền hàng nhập:</span>
                  <span className="font-extrabold text-slate-900">{formatVND(selectedPO.totalAmount)}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Số tiền đã thanh toán:</span>
                  <span className="font-bold">
                    {formatVND(selectedPO.paidAmount || (selectedPO.status === 'completed' ? selectedPO.totalAmount : 0))}
                  </span>
                </div>
                {(selectedPO.debtAmount || 0) > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Còn nợ nhà cung cấp:</span>
                    <span>{formatVND(selectedPO.debtAmount || 0)}</span>
                  </div>
                )}
                {(selectedPO.overpaidAmount || 0) > 0 && (
                  <div className="flex justify-between text-indigo-700 font-bold">
                    <span>Đã trả thừa (Dư nợ):</span>
                    <span>{formatVND(selectedPO.overpaidAmount || 0)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                {onEditPurchaseOrder && (
                  <button
                    onClick={() => {
                      const poToEdit = selectedPO;
                      setSelectedPO(null);
                      onEditPurchaseOrder(poToEdit);
                    }}
                    className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Chỉnh sửa PO</span>
                  </button>
                )}
                <button
                  onClick={() => alert(`In phiếu nhập kho ${selectedPO.code}`)}
                  className="px-3.5 py-2 border border-slate-300 rounded-xl text-slate-700 font-bold text-xs hover:bg-white cursor-pointer"
                >
                  In phiếu nhập kho
                </button>
                {onDeletePurchaseOrder && (
                  <button
                    onClick={() => {
                      setPoToDelete(selectedPO);
                    }}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Xóa đơn PO</span>
                  </button>
                )}
              </div>
              <button
                onClick={() => setSelectedPO(null)}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete PO Confirmation Modal */}
      <DeletePOModal
        isOpen={Boolean(poToDelete)}
        onClose={() => setPoToDelete(null)}
        purchaseOrder={poToDelete}
        inventoryLots={inventoryLots}
        onConfirmDelete={(poId, revertLots) => {
          if (onDeletePurchaseOrder) {
            onDeletePurchaseOrder(poId, revertLots);
          }
          if (selectedPO?.id === poId) {
            setSelectedPO(null);
          }
          setPoToDelete(null);
        }}
      />
    </div>
  );
};
