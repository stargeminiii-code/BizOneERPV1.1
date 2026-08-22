import React, { useState, useMemo } from 'react';
import {
  X,
  ChevronRight,
  ArrowLeft,
  Warehouse as WarehouseIcon,
  Package,
  Layers,
  TrendingUp,
  Boxes,
  DollarSign,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Building2,
  Tag,
  CreditCard,
  Truck,
  FileText,
  Search,
  Filter,
  Plus,
  ArrowUpRight,
  Sparkles,
  Info,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet
} from 'lucide-react';
import {
  Product,
  InventoryLayer,
  StockTransaction,
  Warehouse,
  Branch,
  Supplier,
  PurchaseOrder,
  Customer,
  Order
} from '../../types';
import { fifoEngine } from '../../services/fifoEngine';

export interface DrilldownState {
  level: 'none' | 'warehouse' | 'sku' | 'lot' | 'kpi' | 'supplier' | 'po';
  warehouseId?: string;
  warehouseName?: string;
  sku?: string;
  product?: Product | null;
  lotId?: string;
  lot?: InventoryLayer | null;
  kpiType?:
    | 'all-sku'
    | 'total-stock'
    | 'inventory-val'
    | 'low-stock'
    | 'out-of-stock'
    | 'aged'
    | 'supplier-debt'
    | 'customer-debt'
    | 'fifo-structure'
    | 'stock-allocation';
  agingBucket?: string; // '<30' | '30-90' | '90-180' | '180-360' | '360-720' | '>=720'
  supplierId?: string;
  supplier?: Supplier | null;
  poCode?: string;
  po?: PurchaseOrder | null;
  history: Array<{
    level: string;
    label: string;
    payload: any;
  }>;
}

interface DashboardDrilldownPanelProps {
  drilldown: DrilldownState;
  onUpdateDrilldown: (next: DrilldownState) => void;
  onClose: () => void;
  products: Product[];
  inventoryLots: InventoryLayer[];
  stockTransactions: StockTransaction[];
  warehouses: Warehouse[];
  branches: Branch[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  customers?: Customer[];
  orders?: Order[];
  onOpenCreatePO?: (skuOrName?: string) => void;
  onEditProduct?: (product: Product) => void;
}

export const DashboardDrilldownPanel: React.FC<DashboardDrilldownPanelProps> = ({
  drilldown,
  onUpdateDrilldown,
  onClose,
  products,
  inventoryLots,
  stockTransactions,
  warehouses,
  branches,
  suppliers,
  purchaseOrders,
  customers = [],
  orders = [],
  onOpenCreatePO,
  onEditProduct
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState<'info' | 'lots' | 'transactions' | 'distribution'>('info');

  const formatVND = (v: number) => {
    const val = Number(v) || 0;
    return new Intl.NumberFormat('vi-VN').format(isNaN(val) ? 0 : val) + ' đ';
  };

  // Helper to step back one level in breadcrumbs
  const handleStepBack = () => {
    if (drilldown.history.length <= 1) {
      onClose();
      return;
    }
    const newHistory = [...drilldown.history];
    newHistory.pop(); // Remove current
    const prev = newHistory[newHistory.length - 1];
    onUpdateDrilldown({
      ...prev.payload,
      history: newHistory
    });
  };

  // Helper to navigate to a specific breadcrumb index
  const handleJumpToBreadcrumb = (index: number) => {
    if (index === 0) {
      onClose();
      return;
    }
    const target = drilldown.history[index];
    const newHistory = drilldown.history.slice(0, index + 1);
    onUpdateDrilldown({
      ...target.payload,
      history: newHistory
    });
  };

  // Helper to select an SKU
  const handleSelectSku = (skuStr: string, matchedProduct?: Product | null) => {
    const normSku = skuStr.trim().toUpperCase();
    const prod =
      matchedProduct ||
      products.find(
        (p) =>
          (p.sku && p.sku.toUpperCase() === normSku) ||
          (p.variantSku && p.variantSku.toUpperCase() === normSku) ||
          (p.code && p.code.toUpperCase() === normSku)
      ) ||
      null;

    const nextPayload: DrilldownState = {
      ...drilldown,
      level: 'sku',
      sku: normSku,
      product: prod,
      history: [
        ...drilldown.history,
        {
          level: 'sku',
          label: `SKU: ${normSku}`,
          payload: {
            ...drilldown,
            level: 'sku',
            sku: normSku,
            product: prod
          }
        }
      ]
    };
    onUpdateDrilldown(nextPayload);
  };

  // Helper to select a Lot
  const handleSelectLot = (lotObj: InventoryLayer) => {
    const nextPayload: DrilldownState = {
      ...drilldown,
      level: 'lot',
      lotId: lotObj.layerId || lotObj.lotId || lotObj.id,
      lot: lotObj,
      history: [
        ...drilldown.history,
        {
          level: 'lot',
          label: `Lô: ${lotObj.layerId || lotObj.lotId || lotObj.id}`,
          payload: {
            ...drilldown,
            level: 'lot',
            lotId: lotObj.layerId || lotObj.lotId || lotObj.id,
            lot: lotObj
          }
        }
      ]
    };
    onUpdateDrilldown(nextPayload);
  };

  // Helper to select a Supplier
  const handleSelectSupplier = (sup: Supplier) => {
    const nextPayload: DrilldownState = {
      ...drilldown,
      level: 'supplier',
      supplierId: sup.id,
      supplier: sup,
      history: [
        ...drilldown.history,
        {
          level: 'supplier',
          label: `NCC: ${sup.name}`,
          payload: {
            ...drilldown,
            level: 'supplier',
            supplierId: sup.id,
            supplier: sup
          }
        }
      ]
    };
    onUpdateDrilldown(nextPayload);
  };

  // Helper to select a PO
  const handleSelectPO = (po: PurchaseOrder) => {
    const nextPayload: DrilldownState = {
      ...drilldown,
      level: 'po',
      poCode: po.code,
      po: po,
      history: [
        ...drilldown.history,
        {
          level: 'po',
          label: `Đơn mua: ${po.code}`,
          payload: {
            ...drilldown,
            level: 'po',
            poCode: po.code,
            po: po
          }
        }
      ]
    };
    onUpdateDrilldown(nextPayload);
  };

  // Active layers filter
  const activeLots = useMemo(() => {
    return inventoryLots.filter((l) => (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0) > 0);
  }, [inventoryLots]);

  if (drilldown.level === 'none') return null;

  return (
    <div
      id="dashboard-drilldown-section"
      className="bg-white rounded-2xl border-2 border-blue-500/80 shadow-xl overflow-hidden transition-all animate-in fade-in slide-in-from-top-4 duration-200"
    >
      {/* Top Breadcrumb & Control Bar */}
      <div className="bg-slate-900 text-white px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
        <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap text-xs sm:text-sm font-semibold">
          <button
            onClick={handleStepBack}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white transition cursor-pointer text-xs mr-1"
            title="Quay lại cấp trước"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Quay lại</span>
          </button>

          {drilldown.history.map((step, idx) => {
            const isLast = idx === drilldown.history.length - 1;
            return (
              <React.Fragment key={idx}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                <button
                  onClick={() => handleJumpToBreadcrumb(idx)}
                  disabled={isLast}
                  className={`px-2 py-0.5 rounded-md transition ${
                    isLast
                      ? 'bg-blue-600 text-white font-bold cursor-default'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800 underline-offset-2 hover:underline cursor-pointer'
                  }`}
                >
                  {step.label}
                </button>
              </React.Fragment>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium text-emerald-400 bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 hidden sm:flex">
            <Sparkles className="w-3 h-3" />
            Realtime Drill-down Active
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600 text-slate-300 hover:text-white transition cursor-pointer"
            title="Đóng / Thu gọn chi tiết"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Drilldown Content Viewport */}
      <div className="p-4 sm:p-6 space-y-6">
        {/* ========================================================= */}
        {/* VIEW 1: WAREHOUSE DRILLDOWN (Chi tiết Kho được chọn)       */}
        {/* ========================================================= */}
        {drilldown.level === 'warehouse' && (
          <WarehouseDetailSection
            warehouseId={drilldown.warehouseId || ''}
            warehouseName={drilldown.warehouseName || ''}
            products={products}
            inventoryLots={inventoryLots}
            stockTransactions={stockTransactions}
            warehouses={warehouses}
            branches={branches}
            suppliers={suppliers}
            purchaseOrders={purchaseOrders}
            onSelectSku={handleSelectSku}
            onSelectLot={handleSelectLot}
            onOpenCreatePO={onOpenCreatePO}
          />
        )}

        {/* ========================================================= */}
        {/* VIEW 2: SKU DEEP INSPECTION (Chi tiết SKU)                */}
        {/* ========================================================= */}
        {drilldown.level === 'sku' && (
          <SkuInspectionSection
            sku={drilldown.sku || ''}
            product={drilldown.product}
            products={products}
            inventoryLots={inventoryLots}
            stockTransactions={stockTransactions}
            warehouses={warehouses}
            branches={branches}
            orders={orders}
            onSelectLot={handleSelectLot}
            onOpenCreatePO={onOpenCreatePO}
            onEditProduct={onEditProduct}
          />
        )}

        {/* ========================================================= */}
        {/* VIEW 3: LOT DEEP INSPECTION (Chi tiết Lô FIFO)            */}
        {/* ========================================================= */}
        {drilldown.level === 'lot' && (
          <LotInspectionSection
            lotId={drilldown.lotId || ''}
            lot={drilldown.lot}
            inventoryLots={inventoryLots}
            stockTransactions={stockTransactions}
            purchaseOrders={purchaseOrders}
            suppliers={suppliers}
            onSelectSku={handleSelectSku}
            onSelectPO={handleSelectPO}
            onSelectSupplier={handleSelectSupplier}
          />
        )}

        {/* ========================================================= */}
        {/* VIEW 4: KPI DRILLDOWNS (Tổng SKU, Tồn, FIFO, Nợ, v.v.)     */}
        {/* ========================================================= */}
        {drilldown.level === 'kpi' && (
          <KpiDrilldownSection
            kpiType={drilldown.kpiType || 'all-sku'}
            agingBucket={drilldown.agingBucket}
            products={products}
            inventoryLots={inventoryLots}
            stockTransactions={stockTransactions}
            warehouses={warehouses}
            branches={branches}
            suppliers={suppliers}
            purchaseOrders={purchaseOrders}
            customers={customers}
            orders={orders}
            onSelectSku={handleSelectSku}
            onSelectLot={handleSelectLot}
            onSelectSupplier={handleSelectSupplier}
            onSelectPO={handleSelectPO}
            onOpenCreatePO={onOpenCreatePO}
          />
        )}

        {/* ========================================================= */}
        {/* VIEW 5: SUPPLIER PAYABLES (Công nợ & Phiếu nhập của NCC)   */}
        {/* ========================================================= */}
        {drilldown.level === 'supplier' && drilldown.supplier && (
          <SupplierInspectionSection
            supplier={drilldown.supplier}
            purchaseOrders={purchaseOrders}
            inventoryLots={inventoryLots}
            onSelectPO={handleSelectPO}
            onSelectLot={handleSelectLot}
            onSelectSku={handleSelectSku}
          />
        )}

        {/* ========================================================= */}
        {/* VIEW 6: PURCHASE ORDER INSPECTION (Chi tiết Đơn mua / HĐ)  */}
        {/* ========================================================= */}
        {drilldown.level === 'po' && drilldown.po && (
          <PurchaseOrderInspectionSection
            po={drilldown.po}
            inventoryLots={inventoryLots}
            stockTransactions={stockTransactions}
            onSelectSku={handleSelectSku}
            onSelectLot={handleSelectLot}
          />
        )}
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: WAREHOUSE DETAIL & INVENTORY MATRIX
// =========================================================================
const WarehouseDetailSection: React.FC<{
  warehouseId: string;
  warehouseName: string;
  products: Product[];
  inventoryLots: InventoryLayer[];
  stockTransactions: StockTransaction[];
  warehouses: Warehouse[];
  branches: Branch[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  onSelectSku: (sku: string, prod?: Product | null) => void;
  onSelectLot: (lot: InventoryLayer) => void;
  onOpenCreatePO?: (skuOrName?: string) => void;
}> = ({
  warehouseId,
  warehouseName,
  products,
  inventoryLots,
  stockTransactions,
  warehouses,
  branches,
  suppliers,
  purchaseOrders,
  onSelectSku,
  onSelectLot,
  onOpenCreatePO
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'skus' | 'lots' | 'transactions'>('skus');

  const whObj = warehouses.find((w) => w.id === warehouseId || w.name.toLowerCase() === warehouseName.toLowerCase());
  const actualWhName = whObj?.name || warehouseName || 'Kho hàng';

  // Filter lots belonging to this warehouse
  const whLots = useMemo(() => {
    return inventoryLots.filter((l) => {
      if (warehouseId && warehouseId !== 'all') {
        if (l.warehouseId && l.warehouseId === warehouseId) return true;
      }
      if (warehouseName && warehouseName !== 'all') {
        if (l.warehouseName && l.warehouseName.toLowerCase().includes(warehouseName.toLowerCase())) return true;
        if (l.warehouse && l.warehouse.toLowerCase().includes(warehouseName.toLowerCase())) return true;
      }
      return false;
    });
  }, [inventoryLots, warehouseId, warehouseName]);

  const activeWhLots = whLots.filter((l) => Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) > 0);

  // Group active lots by SKU to calculate actual real stock in this warehouse
  const skuStockMap = useMemo(() => {
    const map = new Map<
      string,
      {
        sku: string;
        productName: string;
        variantName: string;
        brand: string;
        realStock: number;
        availableStock: number;
        fifoValue: number;
        costPrice: number;
        sellingPrice: number;
        unit: string;
        productRef?: Product;
        lotCount: number;
      }
    >();

    // 1. Initialize with products that exist
    products.forEach((p) => {
      const s = (p.variantSku || p.sku || p.code).toUpperCase();
      if (!map.has(s)) {
        map.set(s, {
          sku: s,
          productName: p.productName || p.name,
          variantName: p.variantName || p.variant || 'Tiêu chuẩn',
          brand: p.brand || 'Khác',
          realStock: 0,
          availableStock: 0,
          fifoValue: 0,
          costPrice: Number(p.costPrice) || 0,
          sellingPrice: Number(p.sellingPrice) || 0,
          unit: p.unit || 'Cái',
          productRef: p,
          lotCount: 0
        });
      }
    });

    // 2. Aggregate active lots in this warehouse
    activeWhLots.forEach((l) => {
      const s = (l.variantSku || l.sku || l.productCode || '').toUpperCase();
      const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
      const unitCost = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
      const unitSale = Number(l.salePrice ?? 0) || 0;

      if (!map.has(s)) {
        map.set(s, {
          sku: s,
          productName: l.productName || 'Sản phẩm',
          variantName: l.variantName || l.variant || 'Tiêu chuẩn',
          brand: l.supplierName?.includes('Vietcoco') ? 'Vietcoco' : 'Khác',
          realStock: qty,
          availableStock: qty,
          fifoValue: qty * unitCost,
          costPrice: unitCost,
          sellingPrice: unitSale,
          unit: l.unit || 'Cái',
          lotCount: 1
        });
      } else {
        const item = map.get(s)!;
        item.realStock += qty;
        item.availableStock += qty;
        item.fifoValue += qty * unitCost;
        item.lotCount += 1;
        if (unitCost > 0 && item.costPrice === 0) item.costPrice = unitCost;
        if (unitSale > 0 && item.sellingPrice === 0) item.sellingPrice = unitSale;
      }
    });

    return Array.from(map.values());
  }, [products, activeWhLots]);

  // Warehouse KPIs
  const totalSkuInWh = skuStockMap.filter((item) => item.realStock > 0).length;
  const totalRealStockWh = activeWhLots.reduce((sum, l) => sum + (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0), 0);
  const totalAvailableStockWh = totalRealStockWh; // In standard single warehouse view
  const totalFifoValWh = activeWhLots.reduce((sum, l) => {
    const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
    const cost = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
    return sum + qty * cost;
  }, 0);

  // Total imported value (all lots ever received in this WH)
  const totalImportValWh = whLots.reduce((sum, l) => {
    const qty = Number(l.quantityReceived ?? l.initialQuantity ?? 0) || 0;
    const cost = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
    return sum + qty * cost;
  }, 0);

  // Total issued value (quantityIssued * purchasePrice)
  const totalIssueValWh = whLots.reduce((sum, l) => {
    const qty = Number(l.quantityIssued ?? 0) || 0;
    const cost = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
    return sum + qty * cost;
  }, 0);

  const activeLotCountWh = activeWhLots.length;
  const outOfStockCountWh = skuStockMap.filter((i) => i.realStock === 0).length;
  const lowStockCountWh = skuStockMap.filter((i) => i.realStock > 0 && i.realStock <= (i.productRef?.minStock || 10)).length;

  // Aging lots (> 30 days)
  const now = new Date().getTime();
  const agingLotsWh = activeWhLots.filter((l) => {
    const intake = new Date(l.receivedAt || l.intakeDate || l.createdAt || '2026-01-01').getTime();
    return (now - intake) / (1000 * 3600 * 24) >= 30;
  });

  // Pending POs for this WH
  const pendingPosWh = purchaseOrders.filter((po) => {
    const matchWh = po.warehouseId === warehouseId || po.warehouse?.toLowerCase().includes(actualWhName.toLowerCase());
    return matchWh && (po.status === 'pending' || po.status === 'draft');
  });
  const pendingPoValueWh = pendingPosWh.reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);

  // Filter SKUs by search
  const filteredSkus = useMemo(() => {
    let list = skuStockMap;
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (i) =>
          i.sku.toLowerCase().includes(q) ||
          i.productName.toLowerCase().includes(q) ||
          i.variantName.toLowerCase().includes(q) ||
          i.brand.toLowerCase().includes(q)
      );
    }
    return list;
  }, [skuStockMap, searchTerm]);

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="space-y-6">
      {/* Header Banner for Warehouse */}
      <div className="bg-gradient-to-r from-blue-50 via-indigo-50/50 to-white p-4 sm:p-5 rounded-2xl border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md">
            <WarehouseIcon className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
                Tổng quan {actualWhName}
              </h2>
              <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md border border-blue-200">
                {whObj?.code || warehouseId || 'WH'}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Địa chỉ: {whObj?.address || 'Chi nhánh hệ thống'} • Quản lý: {whObj?.manager || 'Nguyễn Văn An'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => onOpenCreatePO && onOpenCreatePO()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nhập hàng vào kho này
          </button>
        </div>
      </div>

      {/* 12 Detailed Warehouse KPIs Grid (Exact requirement #2) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 sm:gap-3.5">
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng SKU Có Tồn</span>
          <div className="text-base sm:text-lg font-black text-slate-900 mt-1">{totalSkuInWh} SKU</div>
        </div>

        <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200">
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Tồn Thực Tế</span>
          <div className="text-base sm:text-lg font-black text-blue-900 mt-1">
            {new Intl.NumberFormat('vi-VN').format(totalRealStockWh)}
          </div>
        </div>

        <div className="bg-emerald-50/70 p-3 rounded-xl border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Tồn Khả Dụng</span>
          <div className="text-base sm:text-lg font-black text-emerald-900 mt-1">
            {new Intl.NumberFormat('vi-VN').format(totalAvailableStockWh)}
          </div>
        </div>

        <div className="bg-purple-50/70 p-3 rounded-xl border border-purple-200">
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Giá Trị Tồn FIFO</span>
          <div className="text-base sm:text-lg font-black text-purple-900 mt-1">{formatVND(totalFifoValWh)}</div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Giá Trị Nhập</span>
          <div className="text-sm sm:text-base font-extrabold text-slate-800 mt-1">{formatVND(totalImportValWh)}</div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tổng Giá Trị Xuất</span>
          <div className="text-sm sm:text-base font-extrabold text-slate-800 mt-1">{formatVND(totalIssueValWh)}</div>
        </div>

        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Số Lot Đang Tồn</span>
          <div className="text-base font-extrabold text-slate-900 mt-1">{activeLotCountWh} Lô</div>
        </div>

        <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200">
          <span className="text-[10px] font-bold text-rose-700 uppercase tracking-wider">SKU Hết Hàng</span>
          <div className="text-base font-extrabold text-rose-800 mt-1">{outOfStockCountWh} SKU</div>
        </div>

        <div className="bg-amber-50/80 p-3 rounded-xl border border-amber-200">
          <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider">SKU Sắp Hết</span>
          <div className="text-base font-extrabold text-amber-800 mt-1">{lowStockCountWh} SKU</div>
        </div>

        <div className="bg-orange-50/80 p-3 rounded-xl border border-orange-200">
          <span className="text-[10px] font-bold text-orange-700 uppercase tracking-wider">Lot Tồn Lâu (&gt;30d)</span>
          <div className="text-base font-extrabold text-orange-800 mt-1">{agingLotsWh.length} Lô</div>
        </div>

        <div className="bg-cyan-50/80 p-3 rounded-xl border border-cyan-200">
          <span className="text-[10px] font-bold text-cyan-700 uppercase tracking-wider">Hàng Chờ Nhập (PO)</span>
          <div className="text-sm sm:text-base font-extrabold text-cyan-900 mt-1">{formatVND(pendingPoValueWh)}</div>
        </div>

        <div className="bg-indigo-50/80 p-3 rounded-xl border border-indigo-200">
          <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Đơn Mua Đang Chờ</span>
          <div className="text-base font-extrabold text-indigo-900 mt-1">{pendingPosWh.length} Đơn</div>
        </div>
      </div>

      {/* Tabs & Search Filter for Warehouse Structure */}
      <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900">
              Cơ Cấu Tồn Kho Của {actualWhName}
            </h3>
            <p className="text-xs text-slate-500">
              Click trực tiếp vào SKU hoặc Lot để xem phân rã số liệu chi tiết
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm SKU, sản phẩm, brand..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* SKU Matrix Table (Requirement #3) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[760px]">
            <thead>
              <tr className="bg-slate-50/80 text-[10px] sm:text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-2.5 px-3 text-right w-12">STT</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">SẢN PHẨM</th>
                <th className="py-2.5 px-3">VARIANT</th>
                <th className="py-2.5 px-3">BRAND</th>
                <th className="py-2.5 px-3 text-right">TỒN THỰC TẾ</th>
                <th className="py-2.5 px-3 text-right">TỒN KHẢ DỤNG</th>
                <th className="py-2.5 px-3 text-right">GIÁ FIFO</th>
                <th className="py-2.5 px-3 text-right">GIÁ TRỊ TỒN</th>
                <th className="py-2.5 px-3 text-right">GIÁ BÁN</th>
                <th className="py-2.5 px-3 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredSkus.map((item, idx) => {
                const isOutOfStock = item.realStock === 0;
                return (
                  <tr
                    key={item.sku}
                    onClick={() => onSelectSku(item.sku, item.productRef)}
                    className="hover:bg-blue-50/60 transition-colors cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 text-right text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 group-hover:underline">
                      {item.sku}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">
                      <div>{item.productName}</div>
                      <div className="text-[10px] text-slate-400 font-normal font-mono">{item.unit}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 font-medium text-[11px]">
                        {item.variantName}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">{item.brand}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                      {isOutOfStock ? (
                        <span className="text-rose-600 font-bold">0</span>
                      ) : (
                        new Intl.NumberFormat('vi-VN').format(item.realStock)
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                      {new Intl.NumberFormat('vi-VN').format(item.availableStock)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">
                      {formatVND(item.costPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-purple-700">
                      {formatVND(item.fifoValue)}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono font-semibold text-slate-900">
                      {formatVND(item.sellingPrice)}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectSku(item.sku, item.productRef);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:text-white hover:bg-blue-600 bg-blue-50 rounded-lg transition"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: SKU DEEP INSPECTION (Requirement #4 & #5)
// =========================================================================
const SkuInspectionSection: React.FC<{
  sku: string;
  product?: Product | null;
  products: Product[];
  inventoryLots: InventoryLayer[];
  stockTransactions: StockTransaction[];
  warehouses: Warehouse[];
  branches: Branch[];
  orders: Order[];
  onSelectLot: (lot: InventoryLayer) => void;
  onOpenCreatePO?: (skuOrName?: string) => void;
  onEditProduct?: (product: Product) => void;
}> = ({
  sku,
  product,
  products,
  inventoryLots,
  stockTransactions,
  warehouses,
  branches,
  orders,
  onSelectLot,
  onOpenCreatePO,
  onEditProduct
}) => {
  const normSku = sku.toUpperCase();
  const prod =
    product ||
    products.find((p) => (p.variantSku || p.sku || p.code || '').toUpperCase() === normSku) ||
    null;

  // Matched lots for this SKU
  const matchedLots = useMemo(() => {
    return inventoryLots.filter(
      (l) =>
        (l.sku && l.sku.toUpperCase() === normSku) ||
        (l.variantSku && l.variantSku.toUpperCase() === normSku) ||
        (prod?.code && l.productCode && l.productCode.toUpperCase() === prod.code.toUpperCase() && l.variantName === prod.variantName)
    );
  }, [inventoryLots, normSku, prod]);

  const activeLots = matchedLots.filter((l) => Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) > 0);
  const sortedLotsFifo = fifoEngine.sortLayersFifo(activeLots);

  // Stock stats
  const totalReceived = matchedLots.reduce((sum, l) => sum + (Number(l.quantityReceived ?? l.initialQuantity ?? 0) || 0), 0);
  const totalIssued = matchedLots.reduce((sum, l) => sum + (Number(l.quantityIssued ?? 0) || 0), 0);
  const realStock = activeLots.reduce((sum, l) => sum + (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0), 0);
  const availableStock = realStock; // Assuming all uncommitted

  // Next FIFO Cost
  const nextFifoCost = sortedLotsFifo.length > 0 ? Number(sortedLotsFifo[0].purchasePrice ?? sortedLotsFifo[0].costPrice ?? 0) : Number(prod?.costPrice ?? 0);
  
  // Total FIFO inventory valuation
  const totalFifoValue = activeLots.reduce((sum, l) => {
    const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
    const cost = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
    return sum + qty * cost;
  }, 0);

  const sellingPrice = Number(prod?.sellingPrice ?? (matchedLots[0]?.salePrice || 0));
  const projectedRevenue = realStock * sellingPrice;
  const projectedProfit = projectedRevenue - totalFifoValue;

  // Transactions for this SKU
  const skuTransactions = useMemo(() => {
    return stockTransactions
      .filter((t) => (t.sku && t.sku.toUpperCase() === normSku) || (prod?.name && t.productName?.toLowerCase().includes(prod.name.toLowerCase())))
      .slice(0, 20);
  }, [stockTransactions, normSku, prod]);

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="space-y-6">
      {/* Header Profile */}
      <div className="bg-slate-50 p-4 sm:p-5 rounded-2xl border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold px-2.5 py-1 bg-blue-600 text-white rounded-lg">
              {normSku}
            </span>
            <h2 className="text-lg sm:text-xl font-black text-slate-900">
              {prod?.productName || prod?.name || matchedLots[0]?.productName || 'Chi tiết SKU'}
            </h2>
            <span className="text-xs font-semibold px-2 py-0.5 bg-slate-200 text-slate-700 rounded-md">
              {prod?.variantName || prod?.variant || matchedLots[0]?.variantName || 'Tiêu chuẩn'}
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Product ID: <strong className="text-slate-700">{prod?.productId || 'P000001'}</strong> • Mã SP:{' '}
            <strong className="text-slate-700">{prod?.code || prod?.productCode || 'SP-01'}</strong> • Thương hiệu:{' '}
            <strong className="text-slate-700">{prod?.brand || 'Vietcoco'}</strong> • Quy cách:{' '}
            <strong className="text-slate-700">{prod?.packSize || '1'}</strong> • Đơn vị tính:{' '}
            <strong className="text-slate-700">{prod?.unit || 'Hộp'}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          {onEditProduct && prod && (
            <button
              onClick={() => onEditProduct(prod)}
              className="px-3 py-2 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl transition"
            >
              Chỉnh sửa SKU
            </button>
          )}
          <button
            onClick={() => onOpenCreatePO && onOpenCreatePO(prod?.name || normSku)}
            className="flex items-center gap-1 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Tạo phiếu nhập (PO)
          </button>
        </div>
      </div>

      {/* 3 Blocks: Product Master, Inventory, Finance (Requirement #4) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Block 1: Thông tin sản phẩm */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Tag className="w-4 h-4 text-blue-600" />
            1. Thông tin sản phẩm
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Product ID:</span>
              <strong className="text-slate-800 font-mono">{prod?.productId || 'P000001'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Product Code:</span>
              <strong className="text-slate-800 font-mono">{prod?.code || prod?.productCode || normSku}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">SKU:</span>
              <strong className="text-blue-700 font-mono">{normSku}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Brand:</span>
              <strong className="text-slate-800">{prod?.brand || 'Vietcoco'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Quy cách / Combo:</span>
              <strong className="text-slate-800">{prod?.variantName || prod?.variant || '1 Hộp'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Pack Size:</span>
              <strong className="text-slate-800">{prod?.packSize || '1'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Đơn vị tính:</span>
              <strong className="text-slate-800">{prod?.unit || 'Hộp'}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Vị trí kho:</span>
              <strong className="text-slate-800">{prod?.location || 'Khu A - Kệ 01'}</strong>
            </div>
          </div>
        </div>

        {/* Block 2: Tồn kho & Luân chuyển */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <Boxes className="w-4 h-4 text-emerald-600" />
            2. Tồn kho & Luân chuyển
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-100">
              <span className="text-emerald-700 block text-[10px] font-bold uppercase">Tồn thực tế:</span>
              <strong className="text-base text-emerald-950 font-black">
                {new Intl.NumberFormat('vi-VN').format(realStock)} {prod?.unit || ''}
              </strong>
            </div>
            <div className="p-2 bg-blue-50 rounded-xl border border-blue-100">
              <span className="text-blue-700 block text-[10px] font-bold uppercase">Tồn khả dụng:</span>
              <strong className="text-base text-blue-950 font-black">
                {new Intl.NumberFormat('vi-VN').format(availableStock)} {prod?.unit || ''}
              </strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Đã đặt / Giữ:</span>
              <strong className="text-slate-800">0</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Đang về (PO):</span>
              <strong className="text-slate-800">0</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Tổng đã nhập:</span>
              <strong className="text-slate-800">{new Intl.NumberFormat('vi-VN').format(totalReceived)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Tổng đã xuất:</span>
              <strong className="text-slate-800">{new Intl.NumberFormat('vi-VN').format(totalIssued)}</strong>
            </div>
          </div>
        </div>

        {/* Block 3: Tài chính & Biên lợi nhuận */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-slate-100">
            <DollarSign className="w-4 h-4 text-purple-600" />
            3. Tài chính FIFO
          </h3>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400 block text-[10px]">Giá vốn FIFO kế tiếp:</span>
              <strong className="text-blue-700 font-mono">{formatVND(nextFifoCost)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Giá trị tồn FIFO:</span>
              <strong className="text-purple-700 font-mono font-bold">{formatVND(totalFifoValue)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Giá bán niêm yết:</span>
              <strong className="text-emerald-700 font-mono">{formatVND(sellingPrice)}</strong>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Giá trị bán dự kiến:</span>
              <strong className="text-slate-800 font-mono">{formatVND(projectedRevenue)}</strong>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-slate-500 font-medium">Lợi nhuận dự kiến:</span>
              <strong className="text-emerald-600 font-bold">{formatVND(projectedProfit)}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* FIFO Lots Table for this SKU (Requirement #5) */}
      <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Danh Sách Lô Hàng FIFO Của SKU Này</h3>
            <p className="text-xs text-slate-500">
              Thứ tự xuất hàng tự động theo nguyên tắc Hàng nhập trước - Xuất trước
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            {activeLots.length} Lô còn tồn / {matchedLots.length} Tổng lô
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] sm:text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-2.5 px-3">MÃ LOT</th>
                <th className="py-2.5 px-3">KHO HÀNG</th>
                <th className="py-2.5 px-3">NGÀY NHẬP</th>
                <th className="py-2.5 px-3 text-right">TUỔI TỒN</th>
                <th className="py-2.5 px-3 text-right">SL NHẬP</th>
                <th className="py-2.5 px-3 text-right">SL CÒN</th>
                <th className="py-2.5 px-3 text-right">GIÁ NHẬP GỐC</th>
                <th className="py-2.5 px-3 text-right">GIÁ TRỊ TỒN</th>
                <th className="py-2.5 px-3">HẠN DÙNG</th>
                <th className="py-2.5 px-3 text-center">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {matchedLots.map((l, idx) => {
                const isNext = sortedLotsFifo[0]?.id === l.id;
                const remQty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
                const recQty = Number(l.quantityReceived ?? l.initialQuantity ?? 0) || 0;
                const cost = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
                const intake = new Date(l.receivedAt || l.intakeDate || l.createdAt || '2026-01-01').getTime();
                const now = new Date().getTime();
                const ageDays = Math.floor((now - intake) / (1000 * 3600 * 24));

                return (
                  <tr
                    key={l.id || idx}
                    onClick={() => onSelectLot(l)}
                    className={`hover:bg-blue-50/70 transition cursor-pointer ${
                      isNext ? 'bg-blue-50/40 font-semibold' : remQty === 0 ? 'opacity-50' : ''
                    }`}
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">
                      {l.layerId || l.lotId || l.id}
                      {isNext && (
                        <span className="block text-[10px] text-emerald-600 font-extrabold">★ Đang xuất FIFO</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">{l.warehouseName || l.warehouse || 'Kho chính'}</td>
                    <td className="py-2.5 px-3 text-slate-600">{l.receivedAt || l.intakeDate || '2026-08-01'}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-700">{ageDays} ngày</td>
                    <td className="py-2.5 px-3 text-right font-mono">{recQty}</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-slate-900">{remQty}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatVND(cost)}</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-purple-700">
                      {formatVND(remQty * cost)}
                    </td>
                    <td className="py-2.5 px-3 text-slate-600">{l.expiryDate || '—'}</td>
                    <td className="py-2.5 px-3 text-center">
                      {remQty > 0 ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Còn tồn
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-500">
                          Đã xuất hết
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: LOT DEEP INSPECTION (Requirement #5)
// =========================================================================
const LotInspectionSection: React.FC<{
  lotId: string;
  lot?: InventoryLayer | null;
  inventoryLots: InventoryLayer[];
  stockTransactions: StockTransaction[];
  purchaseOrders: PurchaseOrder[];
  suppliers: Supplier[];
  onSelectSku: (sku: string) => void;
  onSelectPO: (po: PurchaseOrder) => void;
  onSelectSupplier: (sup: Supplier) => void;
}> = ({
  lotId,
  lot,
  inventoryLots,
  stockTransactions,
  purchaseOrders,
  suppliers,
  onSelectSku,
  onSelectPO,
  onSelectSupplier
}) => {
  const targetLot = lot || inventoryLots.find((l) => (l.layerId || l.lotId || l.id) === lotId);

  if (!targetLot) {
    return <div className="p-6 text-center text-slate-500 text-sm">Không tìm thấy thông tin Lô hàng {lotId}</div>;
  }

  const remQty = Number(targetLot.quantityRemaining ?? targetLot.remainingQuantity ?? 0) || 0;
  const recQty = Number(targetLot.quantityReceived ?? targetLot.initialQuantity ?? 0) || 0;
  const issuedQty = Number(targetLot.quantityIssued ?? 0) || (recQty - remQty);
  const cost = Number(targetLot.purchasePrice ?? targetLot.costPrice ?? 0) || 0;
  const intakeDate = targetLot.receivedAt || targetLot.intakeDate || targetLot.createdAt || '2026-08-01';

  const intakeTime = new Date(intakeDate).getTime();
  const now = new Date().getTime();
  const ageDays = Math.floor((now - intakeTime) / (1000 * 3600 * 24));

  const getAgingCategory = (days: number) => {
    if (days < 30) return '< 30 ngày (Tồn mới)';
    if (days < 90) return '30 - <90 ngày (Tồn vừa)';
    if (days < 180) return '90 ngày - <6 tháng (Cần theo dõi)';
    if (days < 360) return '6 - <12 tháng (Tồn lâu)';
    if (days < 720) return '12 - <24 tháng (Tồn rất lâu)';
    return '≥ 24 tháng (Chậm luân chuyển)';
  };

  // Find linked PO
  const linkedPO = purchaseOrders.find(
    (po) => po.code === targetLot.receiptCode || po.id === targetLot.receiptCode || po.code === targetLot.poCode
  );

  // Find linked Supplier
  const linkedSup = suppliers.find(
    (s) => s.id === targetLot.supplierId || s.name.toLowerCase() === targetLot.supplierName?.toLowerCase()
  );

  // Transactions of this Lot
  const lotTransactions = stockTransactions.filter(
    (t) => t.lotId === targetLot.layerId || t.lotId === targetLot.lotId || t.docCode === targetLot.receiptCode
  );

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-50 via-blue-50/40 to-white p-5 rounded-2xl border border-purple-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-extrabold px-2.5 py-1 bg-purple-700 text-white rounded-lg">
              {targetLot.layerId || targetLot.lotId || lotId}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">
              Chi tiết Lô hàng FIFO • {targetLot.productName}
            </h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            SKU: <strong className="text-blue-700 font-mono cursor-pointer hover:underline" onClick={() => onSelectSku(targetLot.sku)}>{targetLot.sku}</strong> • Kho:{' '}
            <strong>{targetLot.warehouseName || targetLot.warehouse || 'Kho chính'}</strong> • NCC:{' '}
            <strong>{targetLot.supplierName}</strong>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-3 py-1.5 rounded-xl bg-purple-100 text-purple-900 border border-purple-200">
            Giá trị tồn: {formatVND(remQty * cost)}
          </span>
        </div>
      </div>

      {/* Grid of 15 Lot details (Exact requirement #5) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Mã Lot:</span>
          <p className="text-xs font-mono font-bold text-slate-900 mt-0.5">{targetLot.layerId || lotId}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">SKU:</span>
          <p
            onClick={() => onSelectSku(targetLot.sku)}
            className="text-xs font-mono font-bold text-blue-700 mt-0.5 cursor-pointer hover:underline"
          >
            {targetLot.sku}
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Kho hàng:</span>
          <p className="text-xs font-bold text-slate-900 mt-0.5">{targetLot.warehouseName || 'Kho Tổng'}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Nhà cung cấp:</span>
          <p
            onClick={() => linkedSup && onSelectSupplier(linkedSup)}
            className="text-xs font-bold text-slate-900 mt-0.5 truncate cursor-pointer hover:text-blue-600"
          >
            {targetLot.supplierName}
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Số phiếu nhập / HĐ:</span>
          <p
            onClick={() => linkedPO && onSelectPO(linkedPO)}
            className="text-xs font-mono font-bold text-emerald-700 mt-0.5 cursor-pointer hover:underline"
          >
            {targetLot.receiptCode || targetLot.poCode || 'PO-OPEN'}
          </p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Ngày nhập kho:</span>
          <p className="text-xs font-bold text-slate-900 mt-0.5">{intakeDate}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Ngày tạo Lot:</span>
          <p className="text-xs font-bold text-slate-900 mt-0.5">{targetLot.createdAt || intakeDate}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Giá nhập gốc (FIFO):</span>
          <p className="text-xs font-mono font-extrabold text-blue-700 mt-0.5">{formatVND(cost)}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Số lượng ban đầu:</span>
          <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">{recQty} {targetLot.unit}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Số lượng đã xuất:</span>
          <p className="text-xs font-mono font-bold text-rose-700 mt-0.5">{issuedQty} {targetLot.unit}</p>
        </div>

        <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
          <span className="text-[10px] font-bold text-emerald-800 uppercase">Số lượng còn lại:</span>
          <p className="text-sm font-mono font-black text-emerald-950 mt-0.5">{remQty} {targetLot.unit}</p>
        </div>

        <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
          <span className="text-[10px] font-bold text-purple-800 uppercase">Giá trị còn lại:</span>
          <p className="text-sm font-mono font-black text-purple-950 mt-0.5">{formatVND(remQty * cost)}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Tuổi tồn kho:</span>
          <p className="text-xs font-bold text-slate-900 mt-0.5">{ageDays} ngày</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Nhóm tuổi tồn:</span>
          <p className="text-xs font-bold text-orange-700 mt-0.5">{getAgingCategory(ageDays)}</p>
        </div>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
          <span className="text-[10px] font-bold text-slate-400 uppercase">Hạn sử dụng:</span>
          <p className="text-xs font-bold text-slate-900 mt-0.5">{targetLot.expiryDate || 'Không thời hạn'}</p>
        </div>
      </div>

      {/* Transactions Table for this Lot */}
      <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3 shadow-xs">
        <h3 className="text-sm font-bold text-slate-900">Lịch Sử Giao Dịch Liên Quan Đến Lô Này</h3>
        {lotTransactions.length === 0 ? (
          <p className="text-xs text-slate-400 py-3">Chưa có giao dịch xuất/chuyển bổ sung cho lô này.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                  <th className="py-2 px-3">NGÀY</th>
                  <th className="py-2 px-3">MÃ CHỨNG TỪ</th>
                  <th className="py-2 px-3">LOẠI</th>
                  <th className="py-2 px-3 text-right">NHẬP</th>
                  <th className="py-2 px-3 text-right">XUẤT</th>
                  <th className="py-2 px-3 text-right">TỒN SAU GD</th>
                  <th className="py-2 px-3">NGƯỜI THỰC HIỆN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {lotTransactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-2 px-3 text-slate-600">{tx.date}</td>
                    <td className="py-2 px-3 font-mono font-bold text-blue-700">{tx.docCode}</td>
                    <td className="py-2 px-3 text-slate-800">{tx.type}</td>
                    <td className="py-2 px-3 text-right font-mono text-emerald-600 font-bold">{tx.qtyIn || 0}</td>
                    <td className="py-2 px-3 text-right font-mono text-rose-600 font-bold">{tx.qtyOut || 0}</td>
                    <td className="py-2 px-3 text-right font-mono font-bold">{tx.balance}</td>
                    <td className="py-2 px-3 text-slate-600">{tx.actor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: KPI DRILLDOWN (All SKU, Total Stock, FIFO, Debt, Aging)
// =========================================================================
const KpiDrilldownSection: React.FC<{
  kpiType: string;
  agingBucket?: string;
  products: Product[];
  inventoryLots: InventoryLayer[];
  stockTransactions: StockTransaction[];
  warehouses: Warehouse[];
  branches: Branch[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  customers: Customer[];
  orders: Order[];
  onSelectSku: (sku: string, prod?: Product | null) => void;
  onSelectLot: (lot: InventoryLayer) => void;
  onSelectSupplier: (sup: Supplier) => void;
  onSelectPO: (po: PurchaseOrder) => void;
  onOpenCreatePO?: (skuOrName?: string) => void;
}> = ({
  kpiType,
  agingBucket,
  products,
  inventoryLots,
  warehouses,
  branches,
  suppliers,
  purchaseOrders,
  customers,
  orders,
  onSelectSku,
  onSelectLot,
  onSelectSupplier,
  onSelectPO,
  onOpenCreatePO
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAging, setSelectedAging] = useState<string>(agingBucket || 'all');

  const activeLots = useMemo(() => {
    return inventoryLots.filter((l) => Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) > 0);
  }, [inventoryLots]);

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  // Aging buckets calculator
  const now = new Date().getTime();
  const getLotAgeDays = (l: InventoryLayer) => {
    const intake = new Date(l.receivedAt || l.intakeDate || l.createdAt || '2026-01-01').getTime();
    return Math.floor((now - intake) / (1000 * 3600 * 24));
  };

  const agingBuckets = [
    { key: '<30', label: '< 30 ngày', filter: (d: number) => d < 30 },
    { key: '30-90', label: '30 – <90 ngày', filter: (d: number) => d >= 30 && d < 90 },
    { key: '90-180', label: '90 ngày – <6 tháng', filter: (d: number) => d >= 90 && d < 180 },
    { key: '180-360', label: '6 – <12 tháng', filter: (d: number) => d >= 180 && d < 360 },
    { key: '360-720', label: '12 – <24 tháng', filter: (d: number) => d >= 360 && d < 720 },
    { key: '>=720', label: '≥ 24 tháng', filter: (d: number) => d >= 720 }
  ];

  // 1. TỔNG SKU TABLE (Requirement #8)
  if (kpiType === 'all-sku') {
    const filtered = products.filter((p) => {
      if (!searchTerm.trim()) return true;
      const q = searchTerm.toLowerCase();
      return (
        (p.productName || p.name || '').toLowerCase().includes(q) ||
        (p.sku || p.variantSku || '').toLowerCase().includes(q) ||
        (p.code || p.productCode || '').toLowerCase().includes(q) ||
        (p.brand || '').toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Danh Mục Toàn Bộ SKU Hệ Thống ({products.length} SKU)
            </h3>
            <p className="text-xs text-slate-500">Click vào dòng bất kỳ để xem phân rã chi tiết SKU</p>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm kiếm SKU, tên sản phẩm..."
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] sm:text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-2.5 px-3 text-right w-12">STT</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">SẢN PHẨM</th>
                <th className="py-2.5 px-3">VARIANT</th>
                <th className="py-2.5 px-3">BRAND</th>
                <th className="py-2.5 px-3 text-right">TỒN THỰC TẾ</th>
                <th className="py-2.5 px-3 text-right">GIÁ TRỊ TỒN</th>
                <th className="py-2.5 px-3 text-right">GIÁ BÁN</th>
                <th className="py-2.5 px-3 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.map((p, idx) => {
                const skuStr = (p.variantSku || p.sku || p.code).toUpperCase();
                const matchedLots = activeLots.filter((l) => (l.sku || l.variantSku || '').toUpperCase() === skuStr);
                const realStock = matchedLots.reduce((sum, l) => sum + (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0), 0);
                const fifoVal = matchedLots.reduce((sum, l) => {
                  const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
                  const c = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
                  return sum + qty * c;
                }, 0);

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectSku(skuStr, p)}
                    className="hover:bg-blue-50/70 transition cursor-pointer group"
                  >
                    <td className="py-2.5 px-3 text-right text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700 group-hover:underline">{skuStr}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{p.productName || p.name}</td>
                    <td className="py-2.5 px-3 text-slate-700">{p.variantName || p.variant || 'Tiêu chuẩn'}</td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">{p.brand || 'Vietcoco'}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-slate-900">
                      {realStock > 0 ? new Intl.NumberFormat('vi-VN').format(realStock) : <span className="text-rose-600">0</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono text-purple-700">{formatVND(fifoVal)}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-800">{formatVND(p.sellingPrice)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button className="px-2 py-0.5 text-[11px] font-bold text-blue-600 bg-blue-50 rounded hover:bg-blue-600 hover:text-white transition">
                        Xem
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 2. GIÁ TRỊ TỒN KHO & CẤU TRÚC FIFO (Requirement #6 & #10)
  if (kpiType === 'inventory-val' || kpiType === 'fifo-structure') {
    const totalFifoAll = activeLots.reduce((sum, l) => {
      const q = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
      const c = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
      return sum + q * c;
    }, 0);

    return (
      <div className="space-y-4">
        <div className="bg-purple-50 p-4 rounded-2xl border border-purple-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-purple-950">
              Cấu Trúc Định Giá Tồn Kho FIFO Toàn Hệ Thống
            </h3>
            <p className="text-xs text-purple-700">Tổng hợp chi tiết theo từng lớp kho và đơn giá nhập gốc</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-purple-700 uppercase">Tổng Giá Trị FIFO:</span>
            <div className="text-lg font-black text-purple-950">{formatVND(totalFifoAll)}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] sm:text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-2.5 px-3">KHO HÀNG</th>
                <th className="py-2.5 px-3">MÃ LOT</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">SẢN PHẨM</th>
                <th className="py-2.5 px-3 text-right">SL CÒN</th>
                <th className="py-2.5 px-3 text-right">GIÁ NHẬP GỐC</th>
                <th className="py-2.5 px-3 text-right">GIÁ TRỊ TỒN</th>
                <th className="py-2.5 px-3 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {activeLots.map((l, idx) => {
                const q = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
                const c = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
                return (
                  <tr
                    key={l.id || idx}
                    onClick={() => onSelectLot(l)}
                    className="hover:bg-purple-50/60 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-semibold text-slate-800">{l.warehouseName || l.warehouse || 'Kho chính'}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-purple-700">{l.layerId || l.lotId || l.id}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{l.sku}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-900">{l.productName}</td>
                    <td className="py-2.5 px-3 text-right font-bold font-mono">{q}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatVND(c)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-purple-900">{formatVND(q * c)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button className="px-2 py-0.5 text-[11px] font-bold text-purple-700 bg-purple-100 rounded hover:bg-purple-600 hover:text-white transition">
                        Chi tiết Lot
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 3. TỔNG TỒN THỰC TẾ & PHÂN BỔ KHO (Requirement #7 & #9)
  if (kpiType === 'total-stock' || kpiType === 'stock-allocation') {
    const totalStockQty = activeLots.reduce((sum, l) => sum + (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0), 0);

    // Distribution by warehouse
    const whDistribution = warehouses.map((wh) => {
      const matchingLots = activeLots.filter((l) => l.warehouseId === wh.id || (l.warehouseName && l.warehouseName.includes(wh.name)));
      const realQty = matchingLots.reduce((sum, l) => sum + (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0), 0);
      const val = matchingLots.reduce((sum, l) => {
        const q = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
        const c = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
        return sum + q * c;
      }, 0);

      return {
        warehouse: wh,
        realQty,
        lotCount: matchingLots.length,
        value: val
      };
    });

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-2xl border border-blue-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-blue-950">Phân Bổ Tồn Kho Thực Tế Theo Kho Hàng</h3>
            <p className="text-xs text-blue-700">Tổng tồn thực tế toàn hệ thống: {new Intl.NumberFormat('vi-VN').format(totalStockQty)} sản phẩm</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] sm:text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-2.5 px-3">KHO HÀNG</th>
                <th className="py-2.5 px-3">CHI NHÁNH</th>
                <th className="py-2.5 px-3 text-right">TỒN THỰC TẾ</th>
                <th className="py-2.5 px-3 text-right">TỒN KHẢ DỤNG</th>
                <th className="py-2.5 px-3 text-right">SỐ LOT</th>
                <th className="py-2.5 px-3 text-right">GIÁ TRỊ TỒN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {whDistribution.map((item) => (
                <tr key={item.warehouse.id} className="hover:bg-blue-50/60 transition">
                  <td className="py-3 px-3 font-bold text-slate-900">{item.warehouse.name}</td>
                  <td className="py-3 px-3 text-slate-600">{item.warehouse.branchName}</td>
                  <td className="py-3 px-3 text-right font-extrabold text-blue-700 font-mono">
                    {new Intl.NumberFormat('vi-VN').format(item.realQty)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-700 font-mono">
                    {new Intl.NumberFormat('vi-VN').format(item.realQty)}
                  </td>
                  <td className="py-3 px-3 text-right font-bold font-mono">{item.lotCount} Lô</td>
                  <td className="py-3 px-3 text-right font-bold font-mono text-purple-700">{formatVND(item.value)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 4. CÔNG NỢ NHÀ CUNG CẤP (Requirement #11)
  if (kpiType === 'supplier-debt') {
    const totalDebt = suppliers.reduce((sum, s) => sum + (Number(s.debt) || 0), 0);

    return (
      <div className="space-y-4">
        <div className="bg-amber-50 p-4 rounded-2xl border border-amber-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-amber-950">Công Nợ Phải Trả Nhà Cung Cấp</h3>
            <p className="text-xs text-amber-700">Click vào Nhà cung cấp để xem các phiếu nhập &amp; hóa đơn liên quan</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] font-bold text-amber-700 uppercase">Tổng Nợ NCC:</span>
            <div className="text-lg font-black text-amber-950">{formatVND(totalDebt)}</div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] sm:text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-2.5 px-3">MÃ NCC</th>
                <th className="py-2.5 px-3">NHÀ CUNG CẤP</th>
                <th className="py-2.5 px-3 text-right">SỐ PHIẾU NHẬP</th>
                <th className="py-2.5 px-3 text-right">TỔNG NHẬP</th>
                <th className="py-2.5 px-3 text-right">ĐÃ THANH TOÁN</th>
                <th className="py-2.5 px-3 text-right">CÒN NỢ</th>
                <th className="py-2.5 px-3 text-center">HẠN THANH TOÁN</th>
                <th className="py-2.5 px-3 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {suppliers.map((s) => {
                const matchingPos = purchaseOrders.filter((po) => po.supplierId === s.id || (po.supplierName && po.supplierName.toLowerCase() === s.name.toLowerCase()));
                const totalPurchased = s.totalPurchased || matchingPos.reduce((sum, po) => sum + (Number(po.totalAmount) || 0), 0);
                const paid = matchingPos.reduce((sum, po) => sum + (Number(po.paidAmount) || 0), 0);
                const debt = Number(s.debt) || Math.max(0, totalPurchased - paid);

                return (
                  <tr
                    key={s.id}
                    onClick={() => onSelectSupplier(s)}
                    className="hover:bg-amber-50/60 transition cursor-pointer"
                  >
                    <td className="py-3 px-3 font-mono font-bold text-amber-700">{s.code}</td>
                    <td className="py-3 px-3 font-bold text-slate-900">{s.name}</td>
                    <td className="py-3 px-3 text-right font-mono">{matchingPos.length || s.purchaseOrderCount || 1}</td>
                    <td className="py-3 px-3 text-right font-mono font-semibold">{formatVND(totalPurchased)}</td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-700 font-semibold">{formatVND(paid)}</td>
                    <td className="py-3 px-3 text-right font-mono font-black text-rose-700">{formatVND(debt)}</td>
                    <td className="py-3 px-3 text-center text-slate-600">
                      {s.paymentTermDays ? `${s.paymentTermDays} ngày` : '30 ngày'}
                    </td>
                    <td className="py-3 px-3 text-center">
                      <button className="px-2 py-0.5 text-[11px] font-bold text-amber-800 bg-amber-100 rounded hover:bg-amber-600 hover:text-white transition">
                        Xem Phiếu
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 5. HÀNG TỒN LÂU / FIFO CẦN ƯU TIÊN XUẤT (Requirement #12)
  if (kpiType === 'aged') {
    // Calculate count per aging bucket
    const bucketCounts = agingBuckets.map((b) => {
      const lotsInBucket = activeLots.filter((l) => b.filter(getLotAgeDays(l)));
      return {
        ...b,
        count: lotsInBucket.length,
        lots: lotsInBucket
      };
    });

    const currentLots =
      selectedAging === 'all'
        ? activeLots.filter((l) => getLotAgeDays(l) >= 30)
        : activeLots.filter((l) => {
            const b = agingBuckets.find((item) => item.key === selectedAging);
            return b ? b.filter(getLotAgeDays(l)) : true;
          });

    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-extrabold text-slate-900">
              Phân Nhóm Tuổi Tồn Kho FIFO (Cần Ưu Tiên Xuất)
            </h3>
            <p className="text-xs text-slate-500">
              Chọn nhóm tuổi tồn để lọc nhanh danh sách Lot và SKU tương ứng
            </p>
          </div>
        </div>

        {/* 6 Aging Buckets Pills / Cards (Requirement #12) */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {bucketCounts.map((b) => {
            const isSelected = selectedAging === b.key;
            return (
              <button
                key={b.key}
                onClick={() => setSelectedAging(b.key)}
                className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                  isSelected
                    ? 'bg-orange-600 text-white border-orange-700 shadow-sm'
                    : 'bg-white hover:bg-orange-50 border-slate-200 text-slate-800'
                }`}
              >
                <span className={`text-[10px] font-bold uppercase block ${isSelected ? 'text-orange-100' : 'text-slate-500'}`}>
                  {b.label}
                </span>
                <div className={`text-base font-extrabold mt-1 ${isSelected ? 'text-white' : 'text-orange-700'}`}>
                  {b.count} Lô
                </div>
              </button>
            );
          })}
        </div>

        {/* Lots List for Selected Aging */}
        <div className="overflow-x-auto border border-slate-200 rounded-2xl p-4 bg-white">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] sm:text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-2.5 px-3">MÃ LOT</th>
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">SẢN PHẨM</th>
                <th className="py-2.5 px-3">KHO</th>
                <th className="py-2.5 px-3 text-right">NGÀY NHẬP</th>
                <th className="py-2.5 px-3 text-right">TUỔI TỒN</th>
                <th className="py-2.5 px-3 text-right">SL CÒN</th>
                <th className="py-2.5 px-3 text-right">GIÁ NHẬP</th>
                <th className="py-2.5 px-3 text-right">GIÁ TRỊ TỒN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {currentLots.map((l) => {
                const age = getLotAgeDays(l);
                const q = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
                const c = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
                return (
                  <tr
                    key={l.id}
                    onClick={() => onSelectLot(l)}
                    className="hover:bg-orange-50/60 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-orange-700">{l.layerId || l.lotId || l.id}</td>
                    <td
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectSku(l.sku);
                      }}
                      className="py-2.5 px-3 font-mono font-bold text-blue-700 hover:underline"
                    >
                      {l.sku}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{l.productName}</td>
                    <td className="py-2.5 px-3 text-slate-600">{l.warehouseName || l.warehouse || 'Kho chính'}</td>
                    <td className="py-2.5 px-3 text-right text-slate-600">{l.receivedAt || l.intakeDate}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-700">{age} ngày</td>
                    <td className="py-2.5 px-3 text-right font-mono font-bold">{q}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatVND(c)}</td>
                    <td className="py-2.5 px-3 text-right font-mono font-extrabold text-purple-700">{formatVND(q * c)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // 6. CẢNH BÁO TỒN KHO (Sắp hết / Hết hàng)
  if (kpiType === 'low-stock' || kpiType === 'out-of-stock') {
    const list = products.filter((p) => {
      const skuStr = (p.variantSku || p.sku || p.code).toUpperCase();
      const matched = activeLots.filter((l) => (l.sku || l.variantSku || '').toUpperCase() === skuStr);
      const stock = matched.reduce((sum, l) => sum + (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0), 0);
      if (kpiType === 'out-of-stock') return stock === 0;
      return stock > 0 && stock <= (Number(p.minStock) || 10);
    });

    return (
      <div className="space-y-4">
        <div className="bg-rose-50 p-4 rounded-2xl border border-rose-200 flex items-center justify-between">
          <div>
            <h3 className="text-base font-extrabold text-rose-950">
              {kpiType === 'out-of-stock' ? 'Mặt Hàng Hết Hàng Trong Kho' : 'Mặt Hàng Cần Nhập Thêm (Dưới Định Mức)'}
            </h3>
            <p className="text-xs text-rose-700">Tạo ngay phiếu nhập kho (PO) để tránh đứt gãy chuỗi cung ứng</p>
          </div>
          <button
            onClick={() => onOpenCreatePO && onOpenCreatePO()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Tạo phiếu nhập (PO)
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] sm:text-[11px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-2.5 px-3">SKU</th>
                <th className="py-2.5 px-3">SẢN PHẨM</th>
                <th className="py-2.5 px-3">BRAND</th>
                <th className="py-2.5 px-3 text-right">TỒN HIỆN TẠI</th>
                <th className="py-2.5 px-3 text-right">TỒN TỐI THIỂU</th>
                <th className="py-2.5 px-3 text-right">ĐƠN GIÁ VỐN</th>
                <th className="py-2.5 px-3 text-center">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {list.map((p) => {
                const skuStr = (p.variantSku || p.sku || p.code).toUpperCase();
                const matched = activeLots.filter((l) => (l.sku || l.variantSku || '').toUpperCase() === skuStr);
                const stock = matched.reduce((sum, l) => sum + (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0), 0);

                return (
                  <tr
                    key={p.id}
                    onClick={() => onSelectSku(skuStr, p)}
                    className="hover:bg-rose-50/50 transition cursor-pointer"
                  >
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-700">{skuStr}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-2.5 px-3 text-slate-600">{p.brand}</td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-rose-700 font-mono">{stock}</td>
                    <td className="py-2.5 px-3 text-right font-mono text-slate-500">{p.minStock || 10}</td>
                    <td className="py-2.5 px-3 text-right font-mono">{formatVND(p.costPrice)}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenCreatePO && onOpenCreatePO(p.name);
                        }}
                        className="px-2.5 py-1 text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                      >
                        Nhập hàng
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return null;
};

// =========================================================================
// SUB-COMPONENT: SUPPLIER INSPECTION SECTION
// =========================================================================
const SupplierInspectionSection: React.FC<{
  supplier: Supplier;
  purchaseOrders: PurchaseOrder[];
  inventoryLots: InventoryLayer[];
  onSelectPO: (po: PurchaseOrder) => void;
  onSelectLot: (lot: InventoryLayer) => void;
  onSelectSku: (sku: string) => void;
}> = ({ supplier, purchaseOrders, inventoryLots, onSelectPO, onSelectLot, onSelectSku }) => {
  const matchingPos = purchaseOrders.filter(
    (po) => po.supplierId === supplier.id || (po.supplierName && po.supplierName.toLowerCase() === supplier.name.toLowerCase())
  );

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="space-y-6">
      <div className="bg-amber-50 p-5 rounded-2xl border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-amber-600 text-white rounded-md">
              {supplier.code}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">{supplier.name}</h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            MST: <strong>{supplier.taxCode || '0102030405'}</strong> • SĐT: <strong>{supplier.phone}</strong> • Địa chỉ:{' '}
            <strong>{supplier.address}</strong>
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-amber-800 uppercase">Công nợ hiện tại:</span>
          <div className="text-lg font-black text-rose-700">{formatVND(supplier.debt || 0)}</div>
        </div>
      </div>

      {/* PO List */}
      <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Danh Sách Phiếu Nhập / Hóa Đơn Từ NCC Này</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[650px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-2.5 px-3">MÃ PHIẾU</th>
                <th className="py-2.5 px-3">NGÀY LẬP</th>
                <th className="py-2.5 px-3">KHO NHẬP</th>
                <th className="py-2.5 px-3 text-right">TỔNG TIỀN</th>
                <th className="py-2.5 px-3 text-right">ĐÃ TRẢ</th>
                <th className="py-2.5 px-3 text-right">CÒN NỢ</th>
                <th className="py-2.5 px-3 text-center">TRẠNG THÁI</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {matchingPos.map((po) => (
                <tr
                  key={po.id}
                  onClick={() => onSelectPO(po)}
                  className="hover:bg-amber-50/60 transition cursor-pointer"
                >
                  <td className="py-2.5 px-3 font-mono font-bold text-blue-700">{po.code}</td>
                  <td className="py-2.5 px-3 text-slate-600">{po.createdAt}</td>
                  <td className="py-2.5 px-3 text-slate-800">{po.warehouse || 'Kho chính'}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold">{formatVND(po.totalAmount)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-emerald-700 font-bold">{formatVND(po.paidAmount)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-rose-700 font-bold">{formatVND(po.debtAmount)}</td>
                  <td className="py-2.5 px-3 text-center">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700">
                      {po.status === 'received' ? 'Đã nhập kho' : 'Chờ xử lý'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =========================================================================
// SUB-COMPONENT: PURCHASE ORDER INSPECTION SECTION
// =========================================================================
const PurchaseOrderInspectionSection: React.FC<{
  po: PurchaseOrder;
  inventoryLots: InventoryLayer[];
  stockTransactions: StockTransaction[];
  onSelectSku: (sku: string) => void;
  onSelectLot: (lot: InventoryLayer) => void;
}> = ({ po, inventoryLots, stockTransactions, onSelectSku, onSelectLot }) => {
  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="space-y-6">
      <div className="bg-blue-50 p-5 rounded-2xl border border-blue-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold px-2 py-0.5 bg-blue-700 text-white rounded-md">
              {po.code}
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900">Chi tiết Phiếu Mua Hàng / HĐĐT</h2>
          </div>
          <p className="text-xs text-slate-600 mt-1">
            NCC: <strong>{po.supplierName}</strong> • Kho nhập: <strong>{po.warehouse}</strong> • Ngày tạo:{' '}
            <strong>{po.createdAt}</strong>
          </p>
        </div>
        <div className="text-right">
          <span className="text-[10px] font-bold text-blue-700 uppercase">Tổng tiền:</span>
          <div className="text-lg font-black text-blue-950">{formatVND(po.totalAmount)}</div>
        </div>
      </div>

      <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
        <h3 className="text-sm font-bold text-slate-900">Danh Mục Mặt Hàng Trong Phiếu</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                <th className="py-2 px-3">SKU</th>
                <th className="py-2 px-3">TÊN SẢN PHẨM</th>
                <th className="py-2 px-3 text-right">SỐ LƯỢNG</th>
                <th className="py-2 px-3 text-right">ĐƠN GIÁ</th>
                <th className="py-2 px-3 text-right">THÀNH TIỀN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {po.items.map((it, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td
                    onClick={() => onSelectSku(it.sku)}
                    className="py-2 px-3 font-mono font-bold text-blue-700 cursor-pointer hover:underline"
                  >
                    {it.sku}
                  </td>
                  <td className="py-2 px-3 font-semibold text-slate-900">{it.productName}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold">{it.quantity} {it.unit}</td>
                  <td className="py-2 px-3 text-right font-mono">{formatVND(it.price)}</td>
                  <td className="py-2 px-3 text-right font-mono font-bold text-blue-900">
                    {formatVND(it.totalAmount || it.quantity * it.price)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
