import React, { useState, useMemo } from 'react';
import {
  Package,
  Boxes,
  TrendingDown,
  AlertTriangle,
  Clock,
  DollarSign,
  Plus,
  ArrowUpRight,
  ArrowRightLeft,
  ClipboardCheck,
  Layers,
  Building2,
  Warehouse as WarehouseIcon,
  Search,
  Filter,
  Calendar,
  ChevronRight,
  X,
  Tag,
  Info,
  Layers3
} from 'lucide-react';
import {
  Product,
  InventoryLayer,
  StockTransaction,
  Branch,
  Warehouse,
  StockIssue,
  StockTransfer,
  Stocktake,
  Order,
  PurchaseOrder
} from '../types';
import { fifoEngine } from '../services/fifoEngine';
import { SkuDetailDrawerModal } from './Modals/SkuDetailDrawerModal';

interface WarehouseDashboardViewProps {
  products: Product[];
  inventoryLots: InventoryLayer[];
  stockTransactions: StockTransaction[];
  branches: Branch[];
  warehouses: Warehouse[];
  stockIssues?: StockIssue[];
  stockTransfers?: StockTransfer[];
  stocktakes?: Stocktake[];
  orders?: Order[];
  purchaseOrders?: PurchaseOrder[];
  selectedBranchId: string;
  onSelectBranch: (branchId: string) => void;
  onNavigateToTab: (view: string) => void;
  onOpenCreatePO: () => void;
  onOpenCreateIssue: () => void;
  onOpenCreateTransfer: () => void;
  onOpenStocktake: () => void;
  onEditProduct?: (product: Product) => void;
}

type DrillDownType = 'all-sku' | 'total-stock' | 'inventory-val' | 'low-stock' | 'out-of-stock' | 'aged' | null;

export const WarehouseDashboardView: React.FC<WarehouseDashboardViewProps> = ({
  products = [],
  inventoryLots = [],
  stockTransactions = [],
  branches = [],
  warehouses = [],
  stockIssues = [],
  stockTransfers = [],
  stocktakes = [],
  orders = [],
  purchaseOrders = [],
  selectedBranchId,
  onSelectBranch,
  onNavigateToTab,
  onOpenCreatePO,
  onOpenCreateIssue,
  onOpenCreateTransfer,
  onOpenStocktake,
  onEditProduct
}) => {
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>('all');
  const [drillDownType, setDrillDownType] = useState<DrillDownType>(null);
  const [drillDownSearch, setDrillDownSearch] = useState<string>('');
  const [selectedSkuForDetail, setSelectedSkuForDetail] = useState<Product | null>(null);

  // Filter layers by branch and warehouse
  const filteredLayers = inventoryLots.filter((layer) => {
    if (selectedBranchId !== 'all' && layer.branchId && layer.branchId !== selectedBranchId) return false;
    if (selectedWarehouseId !== 'all' && layer.warehouseId && layer.warehouseId !== selectedWarehouseId) return false;
    return true;
  });

  // Calculate KPIs
  const totalSkuCount = products.length;
  const activeLayers = filteredLayers.filter((l) => (l.quantityRemaining || l.remainingQuantity || 0) > 0);
  const totalStockQty = activeLayers.reduce((sum, l) => sum + (l.quantityRemaining || l.remainingQuantity || 0), 0);
  const totalInventoryValue = fifoEngine.calculateTotalInventoryValue(inventoryLots, {
    branchId: selectedBranchId,
    warehouseId: selectedWarehouseId
  });

  const lowStockProducts = products.filter((p) => {
    const stock = fifoEngine.getTotalAvailableStock(inventoryLots, p.sku, {
      branchId: selectedBranchId,
      warehouseId: selectedWarehouseId
    });
    return stock > 0 && stock <= p.minStock;
  });

  const outOfStockProducts = products.filter((p) => {
    const stock = fifoEngine.getTotalAvailableStock(inventoryLots, p.sku, {
      branchId: selectedBranchId,
      warehouseId: selectedWarehouseId
    });
    return stock === 0;
  });

  // Old stock: Received > 30 days ago and still has remaining quantity
  const now = new Date().getTime();
  const agingDaysThreshold = 30;
  const agingLayers = activeLayers.filter((l) => {
    const intakeTime = new Date(l.receivedAt || l.intakeDate || l.createdAt || '2026-01-01').getTime();
    const daysDiff = (now - intakeTime) / (1000 * 3600 * 24);
    return daysDiff >= agingDaysThreshold;
  });

  const agingValue = agingLayers.reduce(
    (sum, l) => sum + (l.quantityRemaining || l.remainingQuantity || 0) * (l.purchasePrice || l.costPrice || 0),
    0
  );

  // Warehouse breakdown
  const warehouseBreakdown = warehouses.map((wh) => {
    const whLayers = inventoryLots.filter(
      (l) => l.warehouseId === wh.id && (l.quantityRemaining || l.remainingQuantity || 0) > 0
    );
    const whValue = whLayers.reduce(
      (sum, l) => sum + (l.quantityRemaining || l.remainingQuantity || 0) * (l.purchasePrice || l.costPrice || 0),
      0
    );
    const whQty = whLayers.reduce((sum, l) => sum + (l.quantityRemaining || l.remainingQuantity || 0), 0);
    return {
      ...wh,
      value: whValue,
      qty: whQty,
      layerCount: whLayers.length
    };
  });

  // Recent transactions
  const recentTx = stockTransactions.slice(0, 5);

  // Build Drill-Down Product List based on clicked KPI
  const drillDownProducts = useMemo(() => {
    if (!drillDownType) return [];

    let list: Product[] = [];
    if (drillDownType === 'all-sku' || drillDownType === 'total-stock' || drillDownType === 'inventory-val') {
      list = products;
    } else if (drillDownType === 'low-stock') {
      list = lowStockProducts;
    } else if (drillDownType === 'out-of-stock') {
      list = outOfStockProducts;
    } else if (drillDownType === 'aged') {
      // Products associated with aging layers
      const agedSkus = new Set(agingLayers.map((l) => l.sku?.toUpperCase()));
      list = products.filter((p) => agedSkus.has((p.variantSku || p.sku || '').toUpperCase()));
    }

    if (drillDownSearch.trim()) {
      const q = drillDownSearch.toLowerCase();
      list = list.filter(
        (p) =>
          (p.productName || p.name || '').toLowerCase().includes(q) ||
          (p.productCode || p.code || '').toLowerCase().includes(q) ||
          (p.variantSku || p.sku || '').toLowerCase().includes(q) ||
          (p.brand || '').toLowerCase().includes(q) ||
          (p.productId || '').toLowerCase().includes(q)
      );
    }

    return list;
  }, [drillDownType, products, lowStockProducts, outOfStockProducts, agingLayers, drillDownSearch]);

  const getDrillDownTitle = () => {
    switch (drillDownType) {
      case 'all-sku':
        return 'Danh Sách Chi Tiết Toàn Bộ SKU (Tổng SKU)';
      case 'total-stock':
        return 'Danh Sách Chi Tiết Tồn Kho Thực Tế Từng SKU (Tổng Tồn)';
      case 'inventory-val':
        return 'Chi Tiết Định Giá Vốn FIFO Từng Mặt Hàng (Giá Trị Tồn Kho)';
      case 'low-stock':
        return 'Danh Sách Mặt Hàng Cần Nhập Thêm (Dưới Tồn Tối Thiểu)';
      case 'out-of-stock':
        return 'Danh Sách Mặt Hàng Đang Hết Hàng Trong Kho (Tồn Thực Tế = 0)';
      case 'aged':
        return 'Danh Sách Hàng Tồn Lâu > 30 Ngày Cần Ưu Tiên Xuất FIFO';
      default:
        return '';
    }
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="space-y-6 max-w-[1700px] mx-auto">
      {/* Header & Branch/Warehouse Filter Ribbon */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Dashboard Kho
          </h1>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onOpenCreatePO}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nhập kho (PO)
          </button>
          <button
            onClick={onOpenCreateIssue}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4" />
            Xuất kho
          </button>
          <button
            onClick={onOpenCreateTransfer}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <ArrowRightLeft className="w-4 h-4" />
            Chuyển kho
          </button>
          <button
            onClick={onOpenStocktake}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-xl transition shadow-xs cursor-pointer"
          >
            <ClipboardCheck className="w-4 h-4" />
            Kiểm kê
          </button>
        </div>
      </div>

      {/* Scope Filter Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50/80 p-3.5 rounded-xl border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          {/* Branch Selector */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
            <Building2 className="w-4 h-4 text-blue-600" />
            <span>Chi nhánh:</span>
          </div>
          <select
            value={selectedBranchId}
            onChange={(e) => onSelectBranch(e.target.value)}
            className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Tất cả chi nhánh</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>

          {/* Warehouse Selector */}
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 ml-2">
            <WarehouseIcon className="w-4 h-4 text-purple-600" />
            <span>Kho hàng:</span>
          </div>
          <select
            value={selectedWarehouseId}
            onChange={(e) => setSelectedWarehouseId(e.target.value)}
            className="text-xs font-bold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="all">Tất cả kho hàng</option>
            {warehouses.map((wh) => (
              <option key={wh.id} value={wh.id}>
                {wh.name} ({wh.code})
              </option>
            ))}
          </select>
        </div>

        <div className="text-xs text-slate-500 font-medium">
          Đang theo dõi: <span className="font-bold text-slate-800">{activeLayers.length}</span> lớp FIFO khả dụng
        </div>
      </div>

      {/* 6 Mandatory FIFO KPI Cards (WITH INTERACTIVE DRILL-DOWN CAPABILITY) */}
      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {/* KPI 1: TỔNG SKU */}
        <div
          onClick={() => setDrillDownType(drillDownType === 'all-sku' ? null : 'all-sku')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-2xs group ${
            drillDownType === 'all-sku'
              ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-400'
              : 'bg-white border-slate-200 hover:border-blue-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">TỔNG SKU</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-slate-900">{totalSkuCount}</div>
          <div className="text-[11px] text-blue-600 font-bold mt-1 flex items-center gap-1">
            <span>Bấm để xem chi tiết</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 2: TỔNG TỒN */}
        <div
          onClick={() => setDrillDownType(drillDownType === 'total-stock' ? null : 'total-stock')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-2xs group ${
            drillDownType === 'total-stock'
              ? 'bg-emerald-50/90 border-emerald-500 ring-2 ring-emerald-400'
              : 'bg-white border-slate-200 hover:border-emerald-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">TỔNG TỒN</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-700">
            {totalStockQty.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
            <span>Tồn thực tế từng SKU</span>
            <ChevronRight className="w-3 h-3" />
          </div>
        </div>

        {/* KPI 3: GIÁ TRỊ TỒN (FIFO) */}
        <div
          onClick={() => setDrillDownType(drillDownType === 'inventory-val' ? null : 'inventory-val')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-2xs group ${
            drillDownType === 'inventory-val'
              ? 'bg-indigo-50/90 border-indigo-500 ring-2 ring-indigo-400'
              : 'bg-white border-slate-200 hover:border-indigo-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">GIÁ TRỊ TỒN</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-black text-indigo-900 truncate">
            {totalInventoryValue >= 1000000000
              ? `${(totalInventoryValue / 1000000000).toFixed(2)} tỷ`
              : `${(totalInventoryValue / 1000000).toFixed(1)} tr`}
          </div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-1">Định giá theo FIFO Layer</div>
        </div>

        {/* KPI 4: SẮP HẾT */}
        <div
          onClick={() => setDrillDownType(drillDownType === 'low-stock' ? null : 'low-stock')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-2xs group ${
            drillDownType === 'low-stock'
              ? 'bg-amber-100/90 border-amber-500 ring-2 ring-amber-400'
              : 'bg-amber-50/30 border-amber-200 hover:border-amber-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-700">SẮP HẾT</span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-800">{lowStockProducts.length}</div>
          <div className="text-[11px] text-amber-700 font-bold mt-1">Dưới tồn tối thiểu</div>
        </div>

        {/* KPI 5: HẾT HÀNG */}
        <div
          onClick={() => setDrillDownType(drillDownType === 'out-of-stock' ? null : 'out-of-stock')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-2xs group ${
            drillDownType === 'out-of-stock'
              ? 'bg-rose-100/90 border-rose-500 ring-2 ring-rose-400'
              : 'bg-rose-50/30 border-rose-200 hover:border-rose-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-700">HẾT HÀNG</span>
            <div className="w-7 h-7 rounded-lg bg-rose-100 flex items-center justify-center text-rose-700 group-hover:bg-rose-600 group-hover:text-white transition">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-800">{outOfStockProducts.length}</div>
          <div className="text-[11px] text-rose-700 font-bold mt-1">Tồn thực tế = 0</div>
        </div>

        {/* KPI 6: TỒN LÂU */}
        <div
          onClick={() => setDrillDownType(drillDownType === 'aged' ? null : 'aged')}
          className={`p-4 rounded-2xl border cursor-pointer transition shadow-2xs group ${
            drillDownType === 'aged'
              ? 'bg-orange-100/90 border-orange-500 ring-2 ring-orange-400'
              : 'bg-orange-50/30 border-orange-200 hover:border-orange-400'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-700">TỒN LÂU</span>
            <div className="w-7 h-7 rounded-lg bg-orange-100 flex items-center justify-center text-orange-700 group-hover:bg-orange-600 group-hover:text-white transition">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-orange-800">{agingLayers.length}</div>
          <div className="text-[11px] text-orange-700 font-bold mt-1">&gt; 30 ngày nhập</div>
        </div>
      </div>

      {/* INTERACTIVE DRILL-DOWN DETAIL TABLE PANEL (OPENS WHEN CLICKING ANY KPI CARD) */}
      {drillDownType && (
        <div className="bg-white rounded-3xl border-2 border-blue-400/80 shadow-lg p-5 space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Layers3 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-black text-slate-900 text-sm sm:text-base">
                  {getDrillDownTitle()}
                </h3>
                <p className="text-xs text-slate-500">
                  Hiển thị <strong className="text-blue-700">{drillDownProducts.length}</strong> biến thể SKU • Bấm vào dòng để mở chi tiết sâu
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={drillDownSearch}
                  onChange={(e) => setDrillDownSearch(e.target.value)}
                  placeholder="Lọc nhanh SKU, tên SP..."
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 w-48 sm:w-64"
                />
              </div>
              <button
                onClick={() => setDrillDownType(null)}
                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl transition cursor-pointer"
                title="Đóng bảng chi tiết"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs min-w-[1000px]">
              <thead className="bg-slate-50 text-[10px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">STT</th>
                  <th className="py-2.5 px-3 font-mono">Product ID</th>
                  <th className="py-2.5 px-3 font-mono">Product Code</th>
                  <th className="py-2.5 px-3.5 font-mono">Variant SKU</th>
                  <th className="py-2.5 px-3.5">Tên Sản Phẩm</th>
                  <th className="py-2.5 px-3">Variant / Combo</th>
                  <th className="py-2.5 px-3">Thương Hiệu</th>
                  <th className="py-2.5 px-3 text-center font-black text-slate-900">Tồn Kho Thực Tế</th>
                  <th className="py-2.5 px-2.5 text-center">ĐVT</th>
                  <th className="py-2.5 px-3 text-right">Giá Vốn FIFO</th>
                  <th className="py-2.5 px-3 text-right">Giá Trị Tồn</th>
                  <th className="py-2.5 px-3 text-center">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {drillDownProducts.map((p, idx) => {
                  const sku = (p.variantSku || p.sku || '').toUpperCase();
                  const pLots = inventoryLots.filter(
                    (l) => (l.sku && l.sku.toUpperCase() === sku) || (l.variantSku && l.variantSku.toUpperCase() === sku)
                  );
                  const activePLots = pLots.filter((l) => (l.quantityRemaining || l.remainingQuantity || 0) > 0);
                  const actStock = activePLots.reduce((sum, l) => sum + (l.quantityRemaining || l.remainingQuantity || 0), 0);
                  const nextCost = activePLots[0]?.purchasePrice || activePLots[0]?.costPrice || p.costPrice || 0;
                  const totalVal = actStock * nextCost;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => setSelectedSkuForDetail(p)}
                      className="hover:bg-blue-50/60 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 text-center font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">{p.productId || 'P000001'}</td>
                      <td className="py-2.5 px-3 font-mono font-bold text-purple-700 whitespace-nowrap">{p.productCode || p.code}</td>
                      <td className="py-2.5 px-3.5 font-mono font-extrabold text-indigo-700 whitespace-nowrap">{sku}</td>
                      <td className="py-2.5 px-3.5 font-bold text-slate-900">{p.productName || p.name}</td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span className="bg-purple-50 text-purple-800 px-2 py-0.5 rounded-lg border border-purple-100 font-semibold">
                          {p.variantName || p.variant || '1 Hộp'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap font-bold text-slate-700">{p.brand || 'Vietcoco'}</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <span className={`font-black px-2.5 py-1 rounded-xl ${
                          actStock > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {actStock.toLocaleString('vi-VN')} {p.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-2.5 text-center text-slate-600">{p.unit}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-700 whitespace-nowrap">{formatVND(nextCost)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700 whitespace-nowrap">{formatVND(totalVal)}</td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSkuForDetail(p);
                          }}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-[11px] transition"
                        >
                          Chi Tiết
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Main Content Grid: Warehouse Breakdown & Urgent FIFO Action Needed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Warehouse Inventory Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          {/* Card 1: Phân bổ Tồn kho theo từng Kho */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <WarehouseIcon className="w-4 h-4 text-blue-600" />
                  Cơ cấu Tồn kho & Giá trị FIFO theo Kho Hàng
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Phân bổ tài sản lưu động và số lớp FIFO đang quản lý
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('warehouse-fifo-lots')}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
              >
                Xem chi tiết lớp FIFO →
              </button>
            </div>

            <div className="space-y-3.5">
              {warehouseBreakdown.map((wh) => {
                const percentage = totalInventoryValue > 0 ? (wh.value / totalInventoryValue) * 100 : 0;
                return (
                  <div key={wh.id} className="p-3.5 rounded-xl bg-slate-50/70 border border-slate-200/80">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[11px] font-mono">
                          {wh.code}
                        </span>
                        <span>{wh.name}</span>
                        <span className="text-slate-400 font-normal">({wh.branchName})</span>
                      </div>
                      <div className="text-right">
                        <span className="text-blue-900 font-black">{wh.value.toLocaleString('vi-VN')} đ</span>
                        <span className="text-slate-400 ml-1.5 font-normal">({percentage.toFixed(1)}%)</span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="bg-blue-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(percentage, 2)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2 pt-1 border-t border-slate-200/60">
                      <span>Thủ kho: <strong className="text-slate-700">{wh.manager || 'Chưa gán'}</strong></span>
                      <span>Tổng lượng: <strong className="text-slate-700">{wh.qty.toLocaleString('vi-VN')}</strong></span>
                      <span>Lớp FIFO: <strong className="text-blue-700">{wh.layerCount} lớp</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Card 2: Lớp FIFO Cũ Cần Ưu Tiên Xuất Trước (Aging Layers) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-orange-600" />
                  Lớp Hàng FIFO Cần Ưu Tiên Xuất Trước (Tồn &gt; 30 Ngày)
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Tuân thủ nguyên tắc FIFO: hàng nhập sớm nhất bắt buộc được đưa vào kế hoạch xuất trước
                </p>
              </div>
              <button
                onClick={() => onNavigateToTab('warehouse-fifo-lots')}
                className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline cursor-pointer"
              >
                Xem tất cả {agingLayers.length} lớp →
              </button>
            </div>

            {agingLayers.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                Không có lớp hàng nào tồn vượt quá 30 ngày. Vòng quay kho đang vận hành rất tốt!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 bg-slate-50/50">
                      <th className="py-2.5 px-3 font-semibold">Mã Lớp (Layer ID)</th>
                      <th className="py-2.5 px-3 font-semibold">SKU & Sản phẩm</th>
                      <th className="py-2.5 px-3 font-semibold">Ngày nhập</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Tồn còn</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Giá vốn</th>
                      <th className="py-2.5 px-3 font-semibold text-right">Giá trị còn lại</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {agingLayers.slice(0, 5).map((layer) => {
                      const layerCost = layer.purchasePrice || layer.costPrice || 0;
                      const layerQty = layer.quantityRemaining ?? layer.remainingQuantity ?? 0;
                      const layerVal = layerQty * layerCost;
                      return (
                        <tr key={layer.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                            {layer.layerId || layer.lotId}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-semibold text-slate-800">{layer.productName}</div>
                            <div className="text-[11px] text-slate-400 font-mono">{layer.sku}</div>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {layer.receivedAt || layer.intakeDate}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {layerQty.toLocaleString('vi-VN')} {layer.unit}
                          </td>
                          <td className="py-2.5 px-3 text-right text-slate-700">
                            {layerCost.toLocaleString('vi-VN')} đ
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-orange-700">
                            {layerVal.toLocaleString('vi-VN')} đ
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right 1 Col: Quick Links & Alerts */}
        <div className="space-y-6">
          {/* Card: Cảnh báo Hàng Cần Nhập Thêm (Low Stock) */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Cảnh báo Dưới Định mức ({lowStockProducts.length})
              </h3>
              <button
                onClick={() => onOpenCreatePO()}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Nhập hàng ngay
              </button>
            </div>

            <div className="space-y-2.5">
              {lowStockProducts.slice(0, 4).map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-amber-50/40 border border-amber-200/60 flex items-center justify-between text-xs"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-slate-800 truncate">{item.name}</div>
                    <div className="text-[11px] text-slate-500 font-mono">{item.sku}</div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="font-black text-rose-600">
                      {item.stock} / min {item.minStock} {item.unit}
                    </div>
                    <button
                      onClick={onOpenCreatePO}
                      className="text-[10px] font-bold text-blue-600 hover:text-blue-800 mt-0.5 inline-block cursor-pointer"
                    >
                      + Tạo PO
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card: Lịch sử Biến động Kho Gần nhất */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-purple-600" />
                Giao dịch Kho Vừa ghi nhận
              </h3>
              <button
                onClick={() => onNavigateToTab('stockcards')}
                className="text-[11px] font-bold text-purple-600 hover:underline cursor-pointer"
              >
                Xem thẻ kho →
              </button>
            </div>

            <div className="space-y-2.5">
              {recentTx.map((tx) => (
                <div
                  key={tx.id}
                  className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          tx.type.includes('Nhập')
                            ? 'bg-emerald-100 text-emerald-800'
                            : tx.type.includes('Xuất')
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {tx.type}
                      </span>
                      <span className="font-mono text-slate-500">{tx.docCode}</span>
                    </div>
                    <div className="text-slate-800 font-semibold truncate max-w-[170px] mt-0.5">
                      {tx.productName}
                    </div>
                  </div>
                  <div className="text-right">
                    <div
                      className={`font-black ${
                        tx.qtyIn > 0 ? 'text-emerald-600' : 'text-blue-600'
                      }`}
                    >
                      {tx.qtyIn > 0 ? `+${tx.qtyIn}` : `-${tx.qtyOut}`}
                    </div>
                    <div className="text-[10px] text-slate-400">{tx.date.substring(5)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* SKU DRILL DOWN DRAWER MODAL */}
      <SkuDetailDrawerModal
        isOpen={!!selectedSkuForDetail}
        onClose={() => setSelectedSkuForDetail(null)}
        product={selectedSkuForDetail}
        inventoryLots={inventoryLots}
        stockTransactions={stockTransactions}
        orders={orders}
        purchaseOrders={purchaseOrders}
        onOpenCreatePO={onOpenCreatePO}
        onEditProduct={onEditProduct}
      />
    </div>
  );
};
