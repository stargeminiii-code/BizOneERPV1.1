import React, { useState, useMemo } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  X,
  RotateCcw,
  Download,
  Calendar,
  Package,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  SlidersHorizontal,
  Plus,
  FileSpreadsheet,
  Building,
  Tag,
  Hash
} from 'lucide-react';
import { InventoryLot, Product, StockTransaction } from '../types';

interface StockCardViewProps {
  stockTransactions?: StockTransaction[];
  inventoryLots?: InventoryLot[];
  products?: Product[];
  onOpenCreatePO?: (productName?: string) => void;
  onOpenStockAdjustment?: () => void;
}

export const StockCardView: React.FC<StockCardViewProps> = ({
  stockTransactions = [],
  inventoryLots = [],
  products = [],
  onOpenCreatePO,
  onOpenStockAdjustment
}) => {
  // Advanced Filter State (AND multi-criteria)
  const [filterSku, setFilterSku] = useState<string>('');
  const [filterProductId, setFilterProductId] = useState<string>('');
  const [filterDocCode, setFilterDocCode] = useState<string>('');
  const [filterSupplier, setFilterSupplier] = useState<string>('');
  const [filterLotId, setFilterLotId] = useState<string>('');
  const [filterStartDate, setFilterStartDate] = useState<string>('');
  const [filterEndDate, setFilterEndDate] = useState<string>('');
  const [filterType, setFilterType] = useState<string>('all');
  const [globalSearch, setGlobalSearch] = useState<string>('');
  const [showAdvancedPanel, setShowAdvancedPanel] = useState<boolean>(true);

  // Extract unique filter dropdown values
  const uniqueSkus = useMemo(() => Array.from(new Set(products.map((p) => p.sku))), [products]);
  const uniqueProductIds = useMemo(() => Array.from(new Set(products.map((p) => p.productId))), [products]);
  const uniqueLots = useMemo(() => Array.from(new Set(inventoryLots.map((l) => l.lotId))), [inventoryLots]);
  const uniqueSuppliers = useMemo(
    () => Array.from(new Set(inventoryLots.map((l) => l.supplierName).filter(Boolean))),
    [inventoryLots]
  );

  // Filter Logic: Strict AND conditions
  const filteredTransactions = useMemo(() => {
    return stockTransactions.filter((tx) => {
      // Global quick search
      if (globalSearch) {
        const searchLower = globalSearch.toLowerCase();
        const matchesGlobal =
          tx.sku.toLowerCase().includes(searchLower) ||
          tx.productName.toLowerCase().includes(searchLower) ||
          tx.docCode.toLowerCase().includes(searchLower) ||
          (tx.lotId && tx.lotId.toLowerCase().includes(searchLower)) ||
          (tx.actor && tx.actor.toLowerCase().includes(searchLower)) ||
          (tx.note && tx.note.toLowerCase().includes(searchLower));
        if (!matchesGlobal) return false;
      }

      // SKU filter
      if (filterSku && tx.sku !== filterSku) return false;

      // Product ID filter
      if (filterProductId) {
        const prod = products.find((p) => p.sku === tx.sku);
        if (prod && prod.productId !== filterProductId) return false;
      }

      // Doc Code filter (PO / ORD / ADJ)
      if (filterDocCode && !tx.docCode.toLowerCase().includes(filterDocCode.toLowerCase())) return false;

      // Lot ID filter
      if (filterLotId && tx.lotId !== filterLotId) return false;

      // Type filter
      if (filterType !== 'all' && tx.type !== filterType) return false;

      // Supplier filter (via lot lookup)
      if (filterSupplier) {
        const matchedLot = inventoryLots.find((l) => l.lotId === tx.lotId);
        if (!matchedLot || matchedLot.supplierName !== filterSupplier) return false;
      }

      // Date Range filter (YYYY-MM-DD)
      const txDate = tx.date.substring(0, 10);
      if (filterStartDate && txDate < filterStartDate) return false;
      if (filterEndDate && txDate > filterEndDate) return false;

      return true;
    });
  }, [
    stockTransactions,
    globalSearch,
    filterSku,
    filterProductId,
    filterDocCode,
    filterLotId,
    filterType,
    filterSupplier,
    filterStartDate,
    filterEndDate,
    products,
    inventoryLots
  ]);

  // KPI Calculations based on filtered transactions with bulletproof NaN safeguards
  const totalQtyIn = useMemo(
    () => filteredTransactions.reduce((sum, tx) => sum + (Number(tx.qtyIn) || 0), 0),
    [filteredTransactions]
  );
  const totalQtyOut = useMemo(
    () => filteredTransactions.reduce((sum, tx) => sum + (Number(tx.qtyOut) || 0), 0),
    [filteredTransactions]
  );
  const netQtyChange = totalQtyIn - totalQtyOut;
  const totalTransactionValue = useMemo(
    () => filteredTransactions.reduce((sum, tx) => sum + (Number(tx.totalValue) || 0), 0),
    [filteredTransactions]
  );

  // Active filter chips list
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (globalSearch) {
      chips.push({
        key: 'search',
        label: `Tìm: "${globalSearch}"`,
        onRemove: () => setGlobalSearch('')
      });
    }
    if (filterSku) {
      chips.push({
        key: 'sku',
        label: `SKU: ${filterSku}`,
        onRemove: () => setFilterSku('')
      });
    }
    if (filterProductId) {
      chips.push({
        key: 'productId',
        label: `Mã SP: ${filterProductId}`,
        onRemove: () => setFilterProductId('')
      });
    }
    if (filterDocCode) {
      chips.push({
        key: 'docCode',
        label: `Chứng từ: ${filterDocCode}`,
        onRemove: () => setFilterDocCode('')
      });
    }
    if (filterSupplier) {
      chips.push({
        key: 'supplier',
        label: `NCC: ${filterSupplier}`,
        onRemove: () => setFilterSupplier('')
      });
    }
    if (filterLotId) {
      chips.push({
        key: 'lot',
        label: `Lô: ${filterLotId}`,
        onRemove: () => setFilterLotId('')
      });
    }
    if (filterType !== 'all') {
      chips.push({
        key: 'type',
        label: `Loại: ${filterType}`,
        onRemove: () => setFilterType('all')
      });
    }
    if (filterStartDate) {
      chips.push({
        key: 'startDate',
        label: `Từ: ${filterStartDate}`,
        onRemove: () => setFilterStartDate('')
      });
    }
    if (filterEndDate) {
      chips.push({
        key: 'endDate',
        label: `Đến: ${filterEndDate}`,
        onRemove: () => setFilterEndDate('')
      });
    }
    return chips;
  }, [
    globalSearch,
    filterSku,
    filterProductId,
    filterDocCode,
    filterSupplier,
    filterLotId,
    filterType,
    filterStartDate,
    filterEndDate
  ]);

  const handleClearAllFilters = () => {
    setGlobalSearch('');
    setFilterSku('');
    setFilterProductId('');
    setFilterDocCode('');
    setFilterSupplier('');
    setFilterLotId('');
    setFilterStartDate('');
    setFilterEndDate('');
    setFilterType('all');
  };

  const formatVND = (v: number) => {
    const num = Number(v);
    return new Intl.NumberFormat('vi-VN').format(isNaN(num) ? 0 : num) + ' đ';
  };

  return (
    <div className="p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Thẻ kho
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
          <button
            onClick={() => alert('Xuất toàn bộ Thẻ Kho sang file Excel .xlsx')}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>

          <button
            onClick={() => onOpenStockAdjustment?.()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-600/20"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>+ Điều chỉnh kho</span>
          </button>

          <button
            onClick={() => onOpenCreatePO?.()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Nhập kho (PO)</span>
          </button>
        </div>
      </div>

      {/* KPI Cards (Synced with Filtered Results) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Tổng lượng nhập</p>
            <h3 className="text-base sm:text-xl font-extrabold text-emerald-700 mt-0.5 sm:mt-1">
              +{totalQtyIn.toLocaleString('vi-VN')}
            </h3>
            <span className="text-[10px] text-slate-400">Từ phiếu PO & Tăng kho</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Tổng lượng xuất bán</p>
            <h3 className="text-base sm:text-xl font-extrabold text-rose-600 mt-0.5 sm:mt-1">
              -{totalQtyOut.toLocaleString('vi-VN')}
            </h3>
            <span className="text-[10px] text-slate-400">Xuất bán POS & Giảm kho</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Biến động ròng</p>
            <h3
              className={`text-base sm:text-xl font-extrabold mt-0.5 sm:mt-1 ${
                netQtyChange >= 0 ? 'text-blue-700' : 'text-amber-700'
              }`}
            >
              {netQtyChange >= 0 ? `+${netQtyChange.toLocaleString('vi-VN')}` : netQtyChange.toLocaleString('vi-VN')}
            </h3>
            <span className="text-[10px] text-slate-400">Chênh lệch nhập - xuất</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Tổng giá trị giao dịch</p>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900 mt-0.5 sm:mt-1">
              {formatVND(totalTransactionValue)}
            </h3>
            <span className="text-[10px] text-slate-400">{filteredTransactions.length} dòng biến động</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <ScrollText className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Advanced Filter Panel (AND Condition) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-2.5 pb-2 border-b border-slate-100">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
            <Filter className="w-4 h-4 text-blue-600" />
            <span>Bộ lọc nâng cao (Điều kiện kết hợp AND)</span>
          </div>

          <div className="flex items-center gap-2">
            {activeChips.length > 0 && (
              <button
                onClick={handleClearAllFilters}
                className="flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 px-2.5 py-1 rounded-lg transition-colors cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Xóa tất cả bộ lọc ({activeChips.length})</span>
              </button>
            )}
            <button
              onClick={() => setShowAdvancedPanel(!showAdvancedPanel)}
              className="text-xs font-bold text-slate-500 hover:text-slate-800"
            >
              {showAdvancedPanel ? 'Thu gọn bộ lọc' : 'Mở rộng bộ lọc'}
            </button>
          </div>
        </div>

        {/* Multi-criteria filter controls */}
        {showAdvancedPanel && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 text-xs">
            {/* Quick Search */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tìm từ khóa nhanh
              </label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={globalSearch}
                  onChange={(e) => setGlobalSearch(e.target.value)}
                  placeholder="SKU, Tên SP, Mã chứng từ..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Filter by SKU */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Mã SKU
              </label>
              <select
                value={filterSku}
                onChange={(e) => setFilterSku(e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="">Tất cả SKU ({uniqueSkus.length})</option>
                {uniqueSkus.map((sku) => (
                  <option key={sku} value={sku}>
                    {sku}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Product ID */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Product ID
              </label>
              <select
                value={filterProductId}
                onChange={(e) => setFilterProductId(e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="">Tất cả Product ID ({uniqueProductIds.length})</option>
                {uniqueProductIds.map((pid) => (
                  <option key={pid} value={pid}>
                    {pid}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Lot ID */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Mã Lô (Lot ID)
              </label>
              <select
                value={filterLotId}
                onChange={(e) => setFilterLotId(e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="">Tất cả Lô ({uniqueLots.length})</option>
                {uniqueLots.map((lot) => (
                  <option key={lot} value={lot}>
                    {lot}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Supplier */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Nhà Cung Cấp
              </label>
              <select
                value={filterSupplier}
                onChange={(e) => setFilterSupplier(e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="">Tất cả Nhà Cung Cấp</option>
                {uniqueSuppliers.map((sup) => (
                  <option key={sup} value={sup}>
                    {sup}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Transaction Type */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Loại biến động
              </label>
              <select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
              >
                <option value="all">Tất cả loại giao dịch</option>
                <option value="Nhập kho">Nhập kho (PO)</option>
                <option value="Xuất bán">Xuất bán (POS / Đơn hàng)</option>
                <option value="Điều chỉnh tăng">Điều chỉnh tăng (+)</option>
                <option value="Điều chỉnh giảm">Điều chỉnh giảm (-)</option>
              </select>
            </div>

            {/* Date Range: From */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Từ ngày (Intake/Tx Date)
              </label>
              <input
                type="date"
                value={filterStartDate}
                onChange={(e) => setFilterStartDate(e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
              >
              </input>
            </div>

            {/* Date Range: To */}
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Đến ngày
              </label>
              <input
                type="date"
                value={filterEndDate}
                onChange={(e) => setFilterEndDate(e.target.value)}
                className="w-full py-1.5 px-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
              >
              </input>
            </div>
          </div>
        )}

        {/* Filter Chips Display Area */}
        {activeChips.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Bộ lọc đang áp dụng:</span>
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200"
              >
                <span>{chip.label}</span>
                <button
                  onClick={chip.onRemove}
                  className="p-0.5 hover:bg-blue-200 rounded-full transition-colors text-blue-600 hover:text-blue-800"
                  title="Xóa điều kiện này"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Stock Card Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-xs text-slate-800">
              Danh sách Giao dịch Thẻ kho ({filteredTransactions.length} bản ghi)
            </span>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Tự động sắp xếp theo thứ tự thời gian biến động mới nhất
          </span>
        </div>

        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[1100px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-3.5">NGÀY GIỜ</th>
                <th className="py-3 px-3.5">LOẠI BIẾN ĐỘNG</th>
                <th className="py-3 px-3.5">MÃ CHỨNG TỪ</th>
                <th className="py-3 px-3.5">MÃ SKU / PRODUCT ID</th>
                <th className="py-3 px-3.5">TÊN SẢN PHẨM</th>
                <th className="py-3 px-3.5">MÃ LOT (FIFO)</th>
                <th className="py-3 px-3.5 text-right text-emerald-700">SL NHẬP</th>
                <th className="py-3 px-3.5 text-right text-rose-700">SL XUẤT</th>
                <th className="py-3 px-3.5 text-right font-bold">TỒN CUỐI</th>
                <th className="py-3 px-3.5 text-right">ĐƠN GIÁ VỐN</th>
                <th className="py-3 px-3.5 text-right">THÀNH TIỀN</th>
                <th className="py-3 px-3.5">NGƯỜI THỰC HIỆN</th>
                <th className="py-3 px-3.5">GHI CHÚ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={13} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">Không tìm thấy giao dịch thẻ kho nào khớp với bộ lọc</p>
                    <button
                      onClick={handleClearAllFilters}
                      className="mt-2 text-xs font-bold text-blue-600 hover:underline"
                    >
                      Xóa bộ lọc để xem lại toàn bộ
                    </button>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* Date */}
                    <td className="py-3 px-3.5 font-mono text-slate-600 whitespace-nowrap">
                      {tx.date}
                    </td>

                    {/* Transaction Type */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      {tx.type === 'Nhập kho' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Nhập kho
                        </span>
                      )}
                      {tx.type === 'Xuất bán' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-50 text-rose-700 border border-rose-200">
                          Xuất bán
                        </span>
                      )}
                      {tx.type === 'Điều chỉnh tăng' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          Đ/C Tăng (+)
                        </span>
                      )}
                      {tx.type === 'Điều chỉnh giảm' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-50 text-amber-800 border border-amber-200">
                          Đ/C Giảm (-)
                        </span>
                      )}
                    </td>

                    {/* Doc Code */}
                    <td className="py-3 px-3.5 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {tx.docCode}
                    </td>

                    {/* SKU & Product ID */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-mono font-bold text-slate-800">{tx.sku}</span>
                      {tx.productId && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          ID: {tx.productId}
                        </span>
                      )}
                    </td>

                    {/* Product Name */}
                    <td className="py-3 px-3.5 font-semibold text-slate-900 max-w-[200px]">
                      <div className="line-clamp-1" title={tx.productName}>
                        {tx.productName}
                      </div>
                    </td>

                    {/* Lot ID */}
                    <td className="py-3 px-3.5 font-mono text-slate-700 whitespace-nowrap">
                      {tx.lotId ? (
                        <span className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-[11px] font-bold">
                          {tx.lotId}
                        </span>
                      ) : (
                        <span className="text-slate-400 italic">--</span>
                      )}
                    </td>

                    {/* Qty In */}
                    <td className="py-3 px-3.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                      {tx.qtyIn > 0 ? `+${(tx.qtyIn || 0).toLocaleString('vi-VN')}` : '-'}
                    </td>

                    {/* Qty Out */}
                    <td className="py-3 px-3.5 text-right font-bold text-rose-600 whitespace-nowrap">
                      {tx.qtyOut > 0 ? `-${(tx.qtyOut || 0).toLocaleString('vi-VN')}` : '-'}
                    </td>

                    {/* Balance */}
                    <td className="py-3 px-3.5 text-right font-extrabold text-slate-900 whitespace-nowrap">
                      {(tx.balance || 0).toLocaleString('vi-VN')}
                    </td>

                    {/* Unit Cost */}
                    <td className="py-3 px-3.5 text-right font-medium text-slate-600 whitespace-nowrap">
                      {formatVND(tx.unitCost)}
                    </td>

                    {/* Total Value */}
                    <td className="py-3 px-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                      {formatVND(tx.totalValue)}
                    </td>

                    {/* Actor */}
                    <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                      {tx.actor}
                    </td>

                    {/* Note */}
                    <td className="py-3 px-3.5 text-slate-500 max-w-[180px]">
                      <div className="truncate" title={tx.note}>
                        {tx.note || '--'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
