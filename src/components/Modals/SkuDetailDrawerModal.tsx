import React, { useState, useMemo } from 'react';
import {
  X,
  Package,
  Boxes,
  Tag,
  Building2,
  Calendar,
  Layers,
  DollarSign,
  TrendingUp,
  ArrowUpRight,
  Truck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Clock,
  FileText,
  Edit3,
  Barcode,
  Sparkles,
  ChevronRight,
  ShieldCheck,
  Percent,
  Plus
} from 'lucide-react';
import { Product, InventoryLayer, StockTransaction, Order, PurchaseOrder } from '../../types';
import { fifoEngine } from '../../services/fifoEngine';

interface SkuDetailDrawerModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  inventoryLots?: InventoryLayer[];
  stockTransactions?: StockTransaction[];
  orders?: Order[];
  purchaseOrders?: PurchaseOrder[];
  onOpenCreatePO?: (skuName?: string) => void;
  onOpenStockAdjustment?: () => void;
  onEditProduct?: (product: Product) => void;
}

type ActiveTab = 'overview' | 'lots' | 'transactions' | 'finance' | 'variants';

export const SkuDetailDrawerModal: React.FC<SkuDetailDrawerModalProps> = ({
  isOpen,
  onClose,
  product,
  inventoryLots = [],
  stockTransactions = [],
  orders = [],
  purchaseOrders = [],
  onOpenCreatePO,
  onOpenStockAdjustment,
  onEditProduct
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  const sku = (product?.variantSku || product?.sku || '').toUpperCase();
  const productCode = (product?.productCode || product?.code || '').toUpperCase();
  const productId = product?.productId || 'P000001';
  const productName = product?.productName || product?.name || '';
  const variantName = product?.variantName || product?.variant || '1 Hộp';
  const brand = product?.brand || 'Vietcoco';
  const unit = product?.unit || 'Hộp';
  const packSize = product?.packSize || '1';

  // 1. Calculate Associated FIFO Layers for this SKU
  const matchedLayers = useMemo(() => {
    if (!product) return [];
    return inventoryLots.filter(
      (l) =>
        (l.sku && l.sku.toUpperCase() === sku) ||
        (l.variantSku && l.variantSku.toUpperCase() === sku) ||
        (l.productCode && l.productCode.toUpperCase() === productCode && l.variantName === variantName)
    );
  }, [inventoryLots, sku, productCode, variantName, product]);

  const activeLayers = matchedLayers.filter((l) => (l.quantityRemaining || 0) > 0);

  // 2. Exact Stock Calculations ("Tồn kho thực tế")
  const totalReceived = matchedLayers.reduce((sum, l) => sum + (l.quantityReceived || l.initialQuantity || 0), 0);
  const totalIssued = matchedLayers.reduce((sum, l) => sum + (l.quantityIssued || 0), 0);
  const currentActualStock = activeLayers.reduce((sum, l) => sum + (l.quantityRemaining || l.remainingQuantity || 0), 0);

  // Fallback if no layer exist yet, use product.stock
  const actualStock = matchedLayers.length > 0 ? currentActualStock : product?.stock || 0;

  // Next FIFO Cost Price
  const nextFifoCost = activeLayers.length > 0 ? activeLayers[0].purchasePrice || activeLayers[0].costPrice || 0 : product?.costPrice || 0;

  // Average Weighted Cost
  const totalLayerVal = activeLayers.reduce((sum, l) => sum + (l.quantityRemaining || 0) * (l.purchasePrice || l.costPrice || 0), 0);
  const avgFifoCost = currentActualStock > 0 ? Math.round(totalLayerVal / currentActualStock) : nextFifoCost;

  // Total Inventory Valuation (Tồn kho thực tế * Giá vốn)
  const totalInventoryValuation = currentActualStock * avgFifoCost;

  // 3. Transactions for this SKU
  const matchedTransactions = useMemo(() => {
    if (!product) return [];
    return stockTransactions
      .filter(
        (tx) =>
          (tx.sku && tx.sku.toUpperCase() === sku) ||
          (tx.productName && tx.productName.toLowerCase().includes(productName.toLowerCase()))
      )
      .slice(0, 30);
  }, [stockTransactions, sku, productName, product]);

  // 4. Financial Performance (Sales & Margin from Orders)
  const salesMetrics = useMemo(() => {
    if (!product) {
      return { unitsSold: 0, revenue: 0, totalCogs: 0, grossProfit: 0, margin: 0 };
    }
    let unitsSold = 0;
    let revenue = 0;
    let totalCogs = 0;

    orders.forEach((ord) => {
      ord.items?.forEach((item) => {
        if (item.sku?.toUpperCase() === sku || item.productName?.toLowerCase().includes(productName.toLowerCase())) {
          unitsSold += item.quantity || 0;
          revenue += item.totalPrice || (item.quantity * item.unitPrice);
          totalCogs += (item.fifoCost || avgFifoCost) * item.quantity;
        }
      });
    });

    const grossProfit = revenue - totalCogs;
    const margin = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

    return {
      unitsSold,
      revenue,
      totalCogs,
      grossProfit,
      margin
    };
  }, [orders, sku, productName, avgFifoCost, product]);

  // Check Aging & Expiry
  const nowTime = new Date().getTime();
  const agedLayersCount = activeLayers.filter((l) => {
    const intake = new Date(l.receivedAt || l.createdAt || '2026-01-01').getTime();
    return (nowTime - intake) / (1000 * 3600 * 24) > 30;
  }).length;

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  if (!isOpen || !product) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-4xl h-full shadow-2xl flex flex-col overflow-hidden border-l border-slate-200 animate-in slide-in-from-right duration-300">
        {/* DRAWER HEADER */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white shrink-0 shadow-md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shadow-inner">
                <Package className="w-6 h-6 text-amber-300" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-blue-500/30 text-blue-200 border border-blue-400/30">
                    Product ID: {productId}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-purple-500/30 text-purple-200 border border-purple-400/30 font-mono">
                    Code: {productCode}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-mono">
                    SKU: {sku}
                  </span>
                </div>
                <h2 className="text-lg font-black tracking-tight text-white mt-1">
                  {productName}
                </h2>
                <div className="flex items-center gap-3 text-xs text-slate-300 mt-0.5">
                  <span className="font-bold text-amber-300">{brand}</span>
                  <span>•</span>
                  <span className="font-semibold text-emerald-300">{variantName} (Pack {packSize})</span>
                  <span>•</span>
                  <span>ĐVT: {unit}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onEditProduct && (
                <button
                  onClick={() => {
                    onEditProduct(product);
                    onClose();
                  }}
                  className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
                  title="Chỉnh sửa thông tin Master"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition cursor-pointer"
                title="Đóng cửa sổ"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* KPI HIGHLIGHT STRIP (TỒN KHO THỰC TẾ & GIÁ TRỊ) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-white/10 text-xs">
            {/* 1. TỒN KHO THỰC TẾ */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <div className="text-[10px] uppercase font-bold text-emerald-300 flex items-center justify-between">
                <span>TỒN KHO THỰC TẾ</span>
                <Boxes className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black text-white mt-0.5">
                {actualStock.toLocaleString('vi-VN')} <span className="text-xs font-normal text-emerald-200">{unit}</span>
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {activeLayers.length} lô FIFO đang quản lý
              </div>
            </div>

            {/* 2. GIÁ VỐN FIFO */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <div className="text-[10px] uppercase font-bold text-blue-300 flex items-center justify-between">
                <span>GIÁ VỐN FIFO</span>
                <DollarSign className="w-3.5 h-3.5" />
              </div>
              <div className="text-base font-black text-white mt-0.5">
                {formatVND(nextFifoCost)}
              </div>
              <div className="text-[10px] text-blue-200 mt-0.5">
                BQ: {formatVND(avgFifoCost)}
              </div>
            </div>

            {/* 3. GIÁ TRỊ TỒN KHO */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <div className="text-[10px] uppercase font-bold text-purple-300 flex items-center justify-between">
                <span>GIÁ TRỊ TỒN</span>
                <TrendingUp className="w-3.5 h-3.5" />
              </div>
              <div className="text-base font-black text-purple-200 mt-0.5 truncate">
                {formatVND(totalInventoryValuation)}
              </div>
              <div className="text-[10px] text-purple-300 mt-0.5">
                Định giá theo FIFO
              </div>
            </div>

            {/* 4. GIÁ NIÊM YẾT & TRẠNG THÁI */}
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-2.5 border border-white/10">
              <div className="text-[10px] uppercase font-bold text-amber-300 flex items-center justify-between">
                <span>GIÁ BÁN NIÊM YẾT</span>
                <Tag className="w-3.5 h-3.5" />
              </div>
              <div className="text-base font-black text-amber-300 mt-0.5">
                {formatVND(product.sellingPrice || 0)}
              </div>
              <div className="text-[10px] text-slate-300 mt-0.5">
                {actualStock <= (product.minStock || 10) ? (
                  <span className="text-rose-300 font-bold">⚠ Cần nhập thêm</span>
                ) : (
                  <span className="text-emerald-300 font-bold">✓ Tồn khả dụng tốt</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* NAVIGATION TABS */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-200 bg-slate-50 text-xs font-bold shrink-0 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-700 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Package className="w-4 h-4" />
            <span>A. Thông Tin & Tồn Kho Chi Tiết</span>
          </button>
          <button
            onClick={() => setActiveTab('lots')}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'lots'
                ? 'border-blue-600 text-blue-700 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>B. Danh Sách Lô FIFO ({matchedLayers.length})</span>
            {agedLayersCount > 0 && (
              <span className="bg-amber-100 text-amber-800 text-[10px] font-black px-1.5 rounded-full">
                {agedLayersCount} tồn &gt;30d
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'transactions'
                ? 'border-blue-600 text-blue-700 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>C. Thẻ Kho & Biến Động ({matchedTransactions.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('finance')}
            className={`py-3 px-3.5 border-b-2 transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'finance'
                ? 'border-blue-600 text-blue-700 font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-4 h-4" />
            <span>D. Hiệu Quả Kinh Doanh & Lợi Nhuận</span>
          </button>
        </div>

        {/* DRAWER BODY CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6 text-xs">
          {/* TAB 1: OVERVIEW & CLEAR STOCK BREAKDOWN */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Section 1: Master Specification Card */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <Tag className="w-4 h-4 text-blue-600" />
                  <span>1. Định Danh Master Data (Product ID • Code • Variant SKU)</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Product ID (Mã duy nhất)</span>
                    <div className="font-mono font-black text-sm text-blue-700 mt-0.5">{productId}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Product Code (Mã SP Cha)</span>
                    <div className="font-mono font-black text-sm text-purple-700 mt-0.5">{productCode}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Variant SKU (Mã Biến Thể)</span>
                    <div className="font-mono font-black text-sm text-indigo-700 mt-0.5">{sku}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Tên Sản Phẩm</span>
                    <div className="font-bold text-slate-900 mt-0.5">{productName}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Thương Hiệu (Brand)</span>
                    <div className="font-bold text-emerald-800 mt-0.5">{brand}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Quy Cách / Combo & Pack</span>
                    <div className="font-bold text-purple-900 mt-0.5">{variantName} (Quy cách {packSize} {unit})</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Danh Mục / Nhóm Hàng</span>
                    <div className="font-medium text-slate-800 mt-0.5">{product.category || 'Mặc định'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Vị Trí Lưu Kho</span>
                    <div className="font-bold text-slate-700 mt-0.5">{product.location || 'Kho Tổng'}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] font-bold text-slate-500 uppercase">Nhà Cung Cấp Mặc Định</span>
                    <div className="font-bold text-slate-800 mt-0.5">{product.supplierName || 'Chưa chỉ định'}</div>
                  </div>
                </div>

                {product.note && (
                  <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 text-slate-700">
                    <span className="font-bold text-blue-900">Ghi chú: </span>
                    <span>{product.note}</span>
                  </div>
                )}
              </div>

              {/* Section 2: Comprehensive Stock Equations */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-emerald-600" />
                    <span>2. Chi Tiết Tồn Kho & Luân Chuyển Hàng Hóa</span>
                  </h3>
                  <span className="text-[11px] font-extrabold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Cập nhật Real-Time
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                    <span className="text-[11px] font-bold text-emerald-900 uppercase">TỒN KHO THỰC TẾ</span>
                    <div className="text-xl font-black text-emerald-700 mt-1">
                      {actualStock.toLocaleString('vi-VN')} <span className="text-xs font-semibold">{unit}</span>
                    </div>
                    <p className="text-[10px] text-emerald-800 mt-0.5">= Tổng nhập - Tổng xuất</p>
                  </div>

                  <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl">
                    <span className="text-[11px] font-bold text-blue-900 uppercase">TỔNG ĐÃ NHẬP</span>
                    <div className="text-xl font-black text-blue-700 mt-1">
                      {totalReceived.toLocaleString('vi-VN')} <span className="text-xs font-semibold">{unit}</span>
                    </div>
                    <p className="text-[10px] text-blue-800 mt-0.5">Từ PO & HĐĐT đầu vào</p>
                  </div>

                  <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl">
                    <span className="text-[11px] font-bold text-purple-900 uppercase">TỔNG ĐÃ XUẤT</span>
                    <div className="text-xl font-black text-purple-700 mt-1">
                      {totalIssued.toLocaleString('vi-VN')} <span className="text-xs font-semibold">{unit}</span>
                    </div>
                    <p className="text-[10px] text-purple-800 mt-0.5">Bán hàng POS & Phiếu xuất</p>
                  </div>

                  <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-xl">
                    <span className="text-[11px] font-bold text-amber-900 uppercase">ĐỊNH MỨC AN TOÀN</span>
                    <div className="text-xl font-black text-amber-700 mt-1">
                      {product.minStock || 10} <span className="text-xs font-semibold">{unit}</span>
                    </div>
                    <p className="text-[10px] text-amber-800 mt-0.5">Tồn kho tối thiểu</p>
                  </div>
                </div>

                {/* Quick Action Footer */}
                <div className="flex items-center gap-2 pt-2">
                  {onOpenCreatePO && (
                    <button
                      onClick={() => {
                        onOpenCreatePO(productName);
                        onClose();
                      }}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Tạo Đơn Nhập Hàng (PO)</span>
                    </button>
                  )}
                  {onOpenStockAdjustment && (
                    <button
                      onClick={() => {
                        onOpenStockAdjustment();
                        onClose();
                      }}
                      className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 text-purple-600" />
                      <span>Điều Chỉnh Tồn Kho</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: FIFO LOTS LIST */}
          {activeTab === 'lots' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Layers className="w-4 h-4 text-indigo-600" />
                    <span>Danh Sách Lớp Tồn Kho FIFO (Inventory Layers)</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Hệ thống tự động trừ kho từ lô nhập sớm nhất trước (First In, First Out)
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                  {matchedLayers.length} lô ghi nhận
                </span>
              </div>

              {matchedLayers.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Layers className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-600">Chưa có lô hàng FIFO cụ thể cho SKU này</p>
                  <p className="text-xs text-slate-400 mt-1">
                    Hãy tạo phiếu nhập PO hoặc nhập qua Hóa Đơn Điện Tử để khởi tạo lô FIFO.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100/90 text-slate-700 font-extrabold text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">STT</th>
                          <th className="py-2.5 px-3 font-mono">Mã Lô (Lot ID)</th>
                          <th className="py-2.5 px-3">Ngày Nhập (FIFO)</th>
                          <th className="py-2.5 px-3">Hạn Dùng</th>
                          <th className="py-2.5 px-3 text-right">Giá Vốn Nhập</th>
                          <th className="py-2.5 px-3 text-center">SL Nhập</th>
                          <th className="py-2.5 px-3 text-center">SL Còn Lại</th>
                          <th className="py-2.5 px-3 text-right">Giá Trị Tồn</th>
                          <th className="py-2.5 px-3 text-center">Trạng Thái</th>
                          <th className="py-2.5 px-3">Chứng Từ HĐĐT</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {matchedLayers.map((lot, idx) => {
                          const remaining = lot.quantityRemaining || lot.remainingQuantity || 0;
                          const initial = lot.quantityReceived || lot.initialQuantity || 0;
                          const cost = lot.purchasePrice || lot.costPrice || 0;
                          const intakeTime = new Date(lot.receivedAt || lot.createdAt || '2026-01-01').getTime();
                          const isAged = remaining > 0 && (nowTime - intakeTime) / (1000 * 3600 * 24) > 30;

                          return (
                            <tr key={lot.id || idx} className={`hover:bg-blue-50/50 ${remaining === 0 ? 'opacity-60 bg-slate-50' : ''}`}>
                              <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                              <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                                {lot.layerId || lot.lotId || `LOT-${idx + 1}`}
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-700">
                                {lot.receivedAt || lot.intakeDate || lot.createdAt?.split('T')[0] || '2026-08-01'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {lot.expiryDate || '2028-12-31'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-800">
                                {formatVND(cost)}
                              </td>
                              <td className="py-2.5 px-3 text-center font-bold text-slate-600">
                                {initial}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                <span className={`font-black px-2 py-0.5 rounded-md ${
                                  remaining > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500'
                                }`}>
                                  {remaining}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-bold text-indigo-700">
                                {formatVND(remaining * cost)}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {remaining > 0 ? (
                                  isAged ? (
                                    <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                      Tồn &gt;30d
                                    </span>
                                  ) : (
                                    <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                      Khả dụng
                                    </span>
                                  )
                                ) : (
                                  <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full text-[10px] font-bold">
                                    Đã xuất hết
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-slate-500 text-[11px]">
                                {lot.eInvoiceNumber ? (
                                  <span className="font-mono text-purple-700 font-bold">
                                    HĐ {lot.eInvoiceNumber} ({lot.eInvoiceSerial || '1C26'})
                                  </span>
                                ) : (
                                  <span className="text-slate-400">PO / Chứng từ kho</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: STOCK CARD TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-600" />
                    <span>Thẻ Kho & Lịch Sử Giao Dịch Biến Động Tồn</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ghi nhận mọi biến động Nhập kho • Bán hàng • Xuất kho • Điều chỉnh kiểm kê
                  </p>
                </div>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-lg">
                  {matchedTransactions.length} giao dịch gần nhất
                </span>
              </div>

              {matchedTransactions.length === 0 ? (
                <div className="text-center py-10 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
                  <Clock className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="font-bold text-slate-600">Chưa có giao dịch phát sinh cho SKU này</p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-100/90 text-slate-700 font-extrabold text-[11px] border-b border-slate-200">
                        <tr>
                          <th className="py-2.5 px-3">STT</th>
                          <th className="py-2.5 px-3">Thời Gian</th>
                          <th className="py-2.5 px-3">Loại Giao Dịch</th>
                          <th className="py-2.5 px-3 font-mono">Số Chứng Từ</th>
                          <th className="py-2.5 px-3 text-center">SL Nhập (+)</th>
                          <th className="py-2.5 px-3 text-center">SL Xuất (-)</th>
                          <th className="py-2.5 px-3 text-center">Tồn Sau Giao Dịch</th>
                          <th className="py-2.5 px-3 text-right">Đơn Giá Vốn</th>
                          <th className="py-2.5 px-3">Người Thực Hiện</th>
                          <th className="py-2.5 px-3">Ghi Chú</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {matchedTransactions.map((tx, idx) => (
                          <tr key={tx.id || idx} className="hover:bg-slate-50/70">
                            <td className="py-2.5 px-3 text-slate-400 font-bold">{idx + 1}</td>
                            <td className="py-2.5 px-3 text-slate-600">{tx.date}</td>
                            <td className="py-2.5 px-3 font-bold">
                              <span className={`px-2 py-0.5 rounded-md ${
                                tx.type.includes('Nhập') ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                              }`}>
                                {tx.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{tx.docCode}</td>
                            <td className="py-2.5 px-3 text-center font-bold text-emerald-600">
                              {tx.qtyIn > 0 ? `+${tx.qtyIn}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-rose-600">
                              {tx.qtyOut > 0 ? `-${tx.qtyOut}` : '-'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-black text-slate-800 bg-slate-50">
                              {tx.balance}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                              {formatVND(tx.unitCost || 0)}
                            </td>
                            <td className="py-2.5 px-3 text-slate-600">{tx.actor || 'Hệ thống'}</td>
                            <td className="py-2.5 px-3 text-slate-500 text-[11px]">{tx.note || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: FINANCIAL PERFORMANCE */}
          {activeTab === 'finance' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-slate-500 uppercase">ĐÃ BÁN (SẢN LƯỢNG)</span>
                  <div className="text-2xl font-black text-slate-900 mt-1">
                    {salesMetrics.unitsSold.toLocaleString('vi-VN')} <span className="text-xs font-normal text-slate-500">{unit}</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Qua các đơn POS / Bán hàng</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-blue-600 uppercase">DOANH THU GHI NHẬN</span>
                  <div className="text-2xl font-black text-blue-700 mt-1">
                    {formatVND(salesMetrics.revenue)}
                  </div>
                  <div className="text-[10px] text-blue-500 mt-0.5">Tổng giá trị đơn hàng</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-emerald-600 uppercase">LỢI NHUẬN GỘP (FIFO)</span>
                  <div className="text-2xl font-black text-emerald-700 mt-1">
                    {formatVND(salesMetrics.grossProfit)}
                  </div>
                  <div className="text-[10px] text-emerald-600 font-bold mt-0.5">
                    Biên lãi gộp: {salesMetrics.margin.toFixed(1)}%
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
                  <span className="text-[11px] font-bold text-purple-600 uppercase">GIÁ TRỊ TỒN THỰC TẾ</span>
                  <div className="text-2xl font-black text-purple-700 mt-1">
                    {formatVND(totalInventoryValuation)}
                  </div>
                  <div className="text-[10px] text-purple-500 mt-0.5">Tài sản kho đang giữ</div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
                <h3 className="font-black text-slate-900 text-sm flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-600" />
                  <span>Chính Sách Giá & Tỷ Suất Sinh Lời</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-bold">Giá Vốn Nhập Kho (FIFO Base):</span>
                    <div className="text-base font-black text-slate-900 mt-0.5">{formatVND(avgFifoCost)}</div>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-bold">Giá Bán Niêm Yết (Retail Price):</span>
                    <div className="text-base font-black text-amber-700 mt-0.5">{formatVND(product.sellingPrice || 0)}</div>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                    <span className="text-emerald-800 font-bold">Chênh Lệch / Lãi Dự Kiến Mỗi Đơn Vị:</span>
                    <div className="text-base font-black text-emerald-700 mt-0.5">
                      {formatVND(Math.max(0, (product.sellingPrice || 0) - avgFifoCost))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* DRAWER FOOTER */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500">
            Mã định danh SKU: <strong className="font-mono text-purple-700">{sku}</strong> • Thuộc SP:{' '}
            <strong>{productName}</strong>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-xs"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
