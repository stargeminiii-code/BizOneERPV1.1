import React, { useState, useMemo } from 'react';
import {
  Package,
  Search,
  Plus,
  AlertTriangle,
  Layers,
  ArrowUpDown,
  Download,
  Upload,
  CheckCircle,
  Truck,
  Eye,
  SlidersHorizontal,
  ScrollText,
  X,
  RotateCcw,
  Clock,
  Calendar,
  Edit2,
  Trash2,
  Table,
  LayoutGrid,
  FolderTree,
  Boxes,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Filter,
  Tag,
  Zap
} from 'lucide-react';
import { InventoryLot, Product, StockTransaction } from '../types';
import { LotDetailModal } from './Modals/LotDetailModal';
import { SkuDetailDrawerModal } from './Modals/SkuDetailDrawerModal';

interface InventoryViewProps {
  products: Product[];
  inventoryLots: InventoryLot[];
  stockTransactions?: StockTransaction[];
  onOpenCreatePO: (productName?: string) => void;
  onOpenStockAdjustment?: () => void;
  onNavigateToStockCards?: () => void;
  onNavigateToFifoLots?: () => void;
  onOpenCreateProduct?: () => void;
  onOpenEditProduct?: (product: Product) => void;
  onDeleteProduct?: (productId: string) => void;
  onOpenImportProducts?: () => void;
  onOpenSyncEInvoice?: () => void;
  onOpenEInvoiceEntry?: () => void;
}

type ViewLayout = 'excel-table' | 'hierarchy-tree' | 'cards-grid';

export const InventoryView: React.FC<InventoryViewProps> = ({
  products = [],
  inventoryLots = [],
  stockTransactions = [],
  onOpenCreatePO,
  onOpenStockAdjustment,
  onNavigateToStockCards,
  onNavigateToFifoLots,
  onOpenCreateProduct,
  onOpenEditProduct,
  onDeleteProduct,
  onOpenImportProducts,
  onOpenSyncEInvoice,
  onOpenEInvoiceEntry
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterPackSize, setFilterPackSize] = useState('all');
  const [onlyLowStock, setOnlyLowStock] = useState(false);
  const [onlyAgedStock, setOnlyAgedStock] = useState(false);
  const [onlyExpiringSoon, setOnlyExpiringSoon] = useState(false);
  const [viewLayout, setViewLayout] = useState<ViewLayout>('excel-table');
  const [selectedProductForLots, setSelectedProductForLots] = useState<Product | null>(null);
  const [selectedSkuForDetail, setSelectedSkuForDetail] = useState<Product | null>(null);
  const [expandedParents, setExpandedParents] = useState<Record<string, boolean>>({});

  // Helper to check aged lot (> 30 days)
  const isAgedLot = (intakeDate: string) => {
    const intake = new Date(intakeDate);
    const now = new Date('2026-08-14');
    const diffDays = Math.floor((now.getTime() - intake.getTime()) / (1000 * 3600 * 24));
    return diffDays > 30;
  };

  // Helper to check expiring soon (< 60 days)
  const isExpiringSoon = (expiryDate?: string) => {
    if (!expiryDate) return false;
    const exp = new Date(expiryDate);
    const now = new Date('2026-08-14');
    const diffDays = Math.floor((exp.getTime() - now.getTime()) / (1000 * 3600 * 24));
    return diffDays >= 0 && diffDays <= 60;
  };

  // Extract unique brands and categories
  const brandList = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => {
      if (p.brand) brands.add(p.brand);
    });
    return Array.from(brands);
  }, [products]);

  const categoryList = useMemo(() => {
    const categories = new Set<string>();
    products.forEach((p) => {
      if (p.category) categories.add(p.category);
    });
    return Array.from(categories);
  }, [products]);

  // Filter products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const pName = p.name || p.productName || '';
      const pCode = p.code || p.productCode || '';
      const pSku = p.sku || p.variantSku || '';
      const pId = p.productId || '';
      const pBrand = p.brand || '';
      const pNote = p.note || p.notes || '';
      const pVariant = p.variant || p.variantName || '';
      const pLoc = p.location || '';

      const matchSearch =
        pName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pBrand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pNote.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pVariant.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pLoc.toLowerCase().includes(searchTerm.toLowerCase());

      const matchBrand = filterBrand === 'all' || pBrand === filterBrand;
      const matchCategory = filterCategory === 'all' || p.category === filterCategory;

      let matchPack = true;
      if (filterPackSize !== 'all') {
        const ps = String(p.packSize || '');
        if (filterPackSize === '1') matchPack = ps === '1' || ps.toLowerCase().includes('1 hộp');
        else if (filterPackSize === 'combo-small') matchPack = ['2', '3', '5'].some((v) => ps.includes(v));
        else if (filterPackSize === 'combo-medium') matchPack = ['6', '10'].some((v) => ps.includes(v));
        else if (filterPackSize === 'case') matchPack = ['12', '24', 'thùng'].some((v) => ps.toLowerCase().includes(v));
      }

      const matchLow = !onlyLowStock || p.isLowStock;

      let matchAged = true;
      if (onlyAgedStock) {
        const prodLots = inventoryLots.filter((l) => (l.sku === p.sku || l.sku === p.variantSku) && l.remainingQuantity > 0);
        matchAged = prodLots.some((l) => isAgedLot(l.intakeDate));
      }

      let matchExpiring = true;
      if (onlyExpiringSoon) {
        const prodLots = inventoryLots.filter((l) => (l.sku === p.sku || l.sku === p.variantSku) && l.remainingQuantity > 0);
        matchExpiring = prodLots.some((l) => isExpiringSoon(l.expiryDate));
      }

      return matchSearch && matchBrand && matchCategory && matchPack && matchLow && matchAged && matchExpiring;
    });
  }, [
    products,
    inventoryLots,
    searchTerm,
    filterBrand,
    filterCategory,
    filterPackSize,
    onlyLowStock,
    onlyAgedStock,
    onlyExpiringSoon
  ]);

  // Grouped products by Product Code / Product Name for Hierarchy View
  const hierarchyGroups = useMemo(() => {
    const groups: {
      groupKey: string;
      productId: string;
      productCode: string;
      productName: string;
      category: string;
      brand: string;
      unit: string;
      note?: string;
      items: Product[];
      totalStock: number;
      variantsCount: number;
    }[] = [];

    const map = new Map<string, typeof groups[0]>();

    filteredProducts.forEach((p) => {
      const groupKey = p.productCode || p.code || p.productId || p.name;
      if (!map.has(groupKey)) {
        map.set(groupKey, {
          groupKey,
          productId: p.productId || '',
          productCode: p.productCode || p.code || '',
          productName: p.productName || p.name,
          category: p.category,
          brand: p.brand || 'Vietcoco',
          unit: p.unit,
          note: p.note || p.notes,
          items: [],
          totalStock: 0,
          variantsCount: 0
        });
      }
      const group = map.get(groupKey)!;
      group.items.push(p);
      group.totalStock += p.stock || 0;
      group.variantsCount += 1;
    });

    return Array.from(map.values());
  }, [filteredProducts]);

  // Total Stock Value calculated purely from individual lots remainingQuantity * costPrice (FIFO)
  const totalStockValue = useMemo(() => {
    return inventoryLots.reduce((acc, lot) => acc + (lot.remainingQuantity || 0) * (lot.costPrice || 0), 0);
  }, [inventoryLots]);

  const lowStockCount = products.filter((p) => p.isLowStock).length;
  const agedLotsCount = inventoryLots.filter((l) => (l.remainingQuantity || 0) > 0 && isAgedLot(l.intakeDate)).length;
  const vietcocoCount = products.filter((p) => p.brand === 'Vietcoco').length;

  // Active filter chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (searchTerm) {
      chips.push({
        key: 'search',
        label: `Tìm: "${searchTerm}"`,
        onRemove: () => setSearchTerm('')
      });
    }
    if (filterBrand !== 'all') {
      chips.push({
        key: 'brand',
        label: `Thương hiệu: ${filterBrand}`,
        onRemove: () => setFilterBrand('all')
      });
    }
    if (filterCategory !== 'all') {
      chips.push({
        key: 'cat',
        label: `Danh mục: ${filterCategory}`,
        onRemove: () => setFilterCategory('all')
      });
    }
    if (filterPackSize !== 'all') {
      chips.push({
        key: 'pack',
        label: `Quy cách: ${filterPackSize}`,
        onRemove: () => setFilterPackSize('all')
      });
    }
    if (onlyLowStock) {
      chips.push({
        key: 'low',
        label: 'Đang lọc: Sắp hết',
        onRemove: () => setOnlyLowStock(false)
      });
    }
    if (onlyAgedStock) {
      chips.push({
        key: 'aged',
        label: 'Đang lọc: Tồn lâu >30 ngày',
        onRemove: () => setOnlyAgedStock(false)
      });
    }
    if (onlyExpiringSoon) {
      chips.push({
        key: 'exp',
        label: 'Đang lọc: Sắp hết hạn',
        onRemove: () => setOnlyExpiringSoon(false)
      });
    }
    return chips;
  }, [searchTerm, filterBrand, filterCategory, filterPackSize, onlyLowStock, onlyAgedStock, onlyExpiringSoon]);

  const handleClearAll = () => {
    setSearchTerm('');
    setFilterBrand('all');
    setFilterCategory('all');
    setFilterPackSize('all');
    setOnlyLowStock(false);
    setOnlyAgedStock(false);
    setOnlyExpiringSoon(false);
  };

  const handleExportCSV = () => {
    let csv = 'Category,Brand,Product Name,Variant Name,Variant SKU,Pack Size,Product ID,Product Code,Unit,Ghi chú,Giá bán,Giá vốn,Tồn kho\n';
    filteredProducts.forEach((p) => {
      const row = [
        `"${p.category || ''}"`,
        `"${p.brand || ''}"`,
        `"${(p.productName || p.name || '').replace(/"/g, '""')}"`,
        `"${(p.variantName || p.variant || '').replace(/"/g, '""')}"`,
        `"${p.variantSku || p.sku || ''}"`,
        `"${p.packSize || '1'}"`,
        `"${p.productId || ''}"`,
        `"${p.productCode || p.code || ''}"`,
        `"${p.unit || ''}"`,
        `"${(p.note || p.notes || '').replace(/"/g, '""')}"`,
        p.sellingPrice || 0,
        p.costPrice || 0,
        p.stock || 0
      ];
      csv += row.join(',') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `danh_muc_san_pham_sku_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const toggleHierarchyExpand = (key: string) => {
    setExpandedParents((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const expandAllHierarchy = () => {
    const nextState: Record<string, boolean> = {};
    hierarchyGroups.forEach((g) => {
      nextState[g.groupKey] = true;
    });
    setExpandedParents(nextState);
  };

  const collapseAllHierarchy = () => {
    setExpandedParents({});
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-[1700px] mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            Sản phẩm
          </h1>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* View Mode Switcher */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200 shadow-2xs">
            <button
              onClick={() => setViewLayout('excel-table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'excel-table'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Bảng ma trận SKU chuẩn theo bảng chụp mẫu"
            >
              <Table className="w-3.5 h-3.5" />
              <span>Ma trận SKU</span>
            </button>
            <button
              onClick={() => setViewLayout('hierarchy-tree')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'hierarchy-tree'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Cây danh mục phân cấp theo SP cha và Combos"
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Cây Phân Cấp</span>
            </button>
            <button
              onClick={() => setViewLayout('cards-grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                viewLayout === 'cards-grid'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Dạng thẻ lưới trực quan"
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Thẻ Lưới</span>
            </button>
          </div>

          {/* Import / Export */}
          {onOpenEInvoiceEntry && (
            <button
              onClick={onOpenEInvoiceEntry}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-500/20 cursor-pointer transition-all"
              title="Nhập đầy đủ thông tin HĐĐT (Phương Án 2): MST, Ký hiệu, Số HĐ, Mã CQT, danh sách hàng hoá, thuế GTGT, tiền bằng chữ, phân loại Product ID/Code"
            >
              <Zap className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>⚡ Nhập HĐĐT (PA 2)</span>
            </button>
          )}

          {onOpenSyncEInvoice && (
            <button
              onClick={onOpenSyncEInvoice}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-white hover:bg-blue-50 border border-blue-200 text-blue-800 rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-all"
              title="Đồng bộ lô hàng tồn kho trực tiếp từ Hóa đơn điện tử đối tác"
            >
              <span>Đồng Bộ HĐĐT</span>
            </button>
          )}

          {onOpenImportProducts && (
            <button
              onClick={onOpenImportProducts}
              className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-all"
              title="Nhập danh mục từ file Excel/CSV"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-600" />
              <span className="hidden sm:inline">Nhập Excel</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-all"
            title="Xuất bảng danh mục theo định dạng 10 cột chuẩn CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span className="hidden sm:inline">Xuất CSV</span>
          </button>

          {onOpenCreateProduct && (
            <button
              onClick={onOpenCreateProduct}
              className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-500/20 cursor-pointer transition-all"
            >
              <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>+ Thêm sản phẩm</span>
            </button>
          )}

          <button
            onClick={() => onOpenCreatePO()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-500/20 cursor-pointer transition-all"
          >
            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>+ Nhập kho PO</span>
          </button>
        </div>
      </div>

      {/* KPI Overview Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div
          onClick={() => {
            if (onNavigateToFifoLots) {
              onNavigateToFifoLots();
            }
          }}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 hover:border-purple-400 shadow-2xs flex items-center justify-between cursor-pointer transition-all group"
          title="Bấm để xem bảng chi tiết định giá và phân bổ từng lô nhập FIFO"
        >
          <div>
            <div className="flex items-center gap-1">
              <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Tổng giá trị tồn kho (FIFO)</p>
            </div>
            <h3 className="text-base sm:text-xl font-black text-slate-900 mt-0.5 group-hover:text-purple-600 transition-colors">
              {formatVND(totalStockValue)}
            </h3>
            <span className="text-[10px] text-purple-600 font-semibold flex items-center gap-0.5">
              Định giá từng lô nhập (Xem chi tiết →)
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 group-hover:bg-purple-100 text-purple-600 flex items-center justify-center font-bold transition-colors">
            <Package className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => {
            setOnlyLowStock(false);
            setOnlyAgedStock(false);
            setOnlyExpiringSoon(false);
            setSearchTerm('');
            setFilterBrand('all');
            setFilterCategory('all');
          }}
          className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 hover:border-blue-400 shadow-2xs flex items-center justify-between cursor-pointer transition-all group"
          title="Bấm để hiển thị toàn bộ danh sách biến thể SKU và các lô tương ứng"
        >
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Tổng Biến Thể SKU / Lô</p>
            <h3 className="text-base sm:text-xl font-black text-slate-900 mt-0.5 group-hover:text-blue-600 transition-colors">
              {products.length} SKU / {inventoryLots.length} Lô
            </h3>
            <span className="text-[10px] text-emerald-600 font-bold">
              {vietcocoCount} SKU Vietcoco đồ uống
            </span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 group-hover:bg-blue-100 text-blue-600 flex items-center justify-center font-bold transition-colors">
            <Boxes className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setOnlyLowStock(!onlyLowStock)}
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            onlyLowStock
              ? 'bg-amber-500 text-white border-amber-600'
              : 'bg-white border-slate-200 hover:border-amber-400'
          }`}
        >
          <div>
            <p
              className={`text-[10px] sm:text-xs font-bold uppercase ${
                onlyLowStock ? 'text-amber-100' : 'text-amber-700'
              }`}
            >
              Cảnh báo sắp hết hàng
            </p>
            <h3
              className={`text-base sm:text-xl font-black mt-0.5 ${
                onlyLowStock ? 'text-white' : 'text-rose-600'
              }`}
            >
              ⚠ {lowStockCount} SKU dưới ngưỡng
            </h3>
            <span className={`text-[10px] ${onlyLowStock ? 'text-amber-100' : 'text-slate-400'}`}>
              Bấm để lọc danh sách
            </span>
          </div>
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold ${
              onlyLowStock ? 'bg-white/20 text-white' : 'bg-rose-50 text-rose-600'
            }`}
          >
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        <div
          onClick={() => setOnlyAgedStock(!onlyAgedStock)}
          className={`p-3.5 sm:p-4 rounded-2xl border shadow-2xs flex items-center justify-between cursor-pointer transition-all ${
            onlyAgedStock
              ? 'bg-indigo-600 text-white border-indigo-700'
              : 'bg-white border-slate-200 hover:border-indigo-400'
          }`}
        >
          <div>
            <p
              className={`text-[10px] sm:text-xs font-bold uppercase ${
                onlyAgedStock ? 'text-indigo-100' : 'text-indigo-700'
              }`}
            >
              Lô tồn lâu (&gt;30 ngày)
            </p>
            <h3
              className={`text-base sm:text-xl font-black mt-0.5 ${
                onlyAgedStock ? 'text-white' : 'text-indigo-700'
              }`}
            >
              {agedLotsCount} Lô cần ưu tiên xuất
            </h3>
            <span className={`text-[10px] ${onlyAgedStock ? 'text-indigo-100' : 'text-slate-400'}`}>
              Theo nguyên tắc FIFO
            </span>
          </div>
          <div
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-bold ${
              onlyAgedStock ? 'bg-white/20 text-white' : 'bg-indigo-50 text-indigo-600'
            }`}
          >
            <Clock className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Search & Multi-Filter Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
          {/* Search Box */}
          <div className="md:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm theo Variant SKU, Product Code, Tên SP, Thương hiệu, Ghi chú..."
              className="w-full pl-9 pr-4 py-2 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Brand Filter */}
          <div className="md:col-span-2">
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả thương hiệu</option>
              {brandList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div className="md:col-span-2">
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả danh mục</option>
              {categoryList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Pack Size Filter */}
          <div className="md:col-span-2">
            <select
              value={filterPackSize}
              onChange={(e) => setFilterPackSize(e.target.value)}
              className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả quy cách</option>
              <option value="1">Lẻ (1 Hộp/cái)</option>
              <option value="combo-small">Combo nhỏ (2 - 5)</option>
              <option value="combo-medium">Combo vừa (6 - 10)</option>
              <option value="case">Thùng (12 - 24)</option>
            </select>
          </div>

          {/* Quick Filter Buttons */}
          <div className="md:col-span-2 flex items-center gap-1.5">
            <button
              onClick={() => setOnlyLowStock(!onlyLowStock)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors text-center cursor-pointer ${
                onlyLowStock
                  ? 'bg-amber-100 text-amber-900 border-amber-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {onlyLowStock ? 'Sắp hết' : 'Sắp hết'}
            </button>
            <button
              onClick={() => setOnlyAgedStock(!onlyAgedStock)}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-colors text-center cursor-pointer ${
                onlyAgedStock
                  ? 'bg-indigo-100 text-indigo-900 border-indigo-300'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {onlyAgedStock ? '>30 ngày' : '>30 ngày'}
            </button>
          </div>
        </div>

        {/* Filter Chips & Total result info */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Hiển thị:</span>
            <span className="bg-slate-100 text-slate-700 text-xs font-bold px-2 py-0.5 rounded-lg">
              {filteredProducts.length} / {products.length} biến thể SKU
            </span>

            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200"
              >
                <span>{chip.label}</span>
                <button
                  onClick={chip.onRemove}
                  className="p-0.5 hover:bg-blue-200 rounded-full transition-colors text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}

            {activeChips.length > 0 && (
              <button
                onClick={handleClearAll}
                className="text-[11px] font-bold text-rose-600 hover:underline ml-1 cursor-pointer"
              >
                Xóa tất cả bộ lọc
              </button>
            )}
          </div>

          {viewLayout === 'hierarchy-tree' && (
            <div className="flex items-center gap-2">
              <button
                onClick={expandAllHierarchy}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                Mở rộng tất cả
              </button>
              <span className="text-slate-300">•</span>
              <button
                onClick={collapseAllHierarchy}
                className="text-[11px] font-bold text-slate-500 hover:underline cursor-pointer"
              >
                Thu gọn tất cả
              </button>
            </div>
          )}
        </div>
      </div>

      {/* VIEW 1: EXCEL MATRIX TABLE (EXACT 10 COLUMNS FROM IMAGE) */}
      {viewLayout === 'excel-table' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto w-full">
            <table className="w-full min-w-[1250px] text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-2.5 text-center w-10">STT</th>
                  <th className="py-3 px-3.5">Category</th>
                  <th className="py-3 px-3.5">Brand</th>
                  <th className="py-3 px-3.5">Product Name</th>
                  <th className="py-3 px-3.5">Variant Name</th>
                  <th className="py-3 px-3.5 font-mono">Variant SKU</th>
                  <th className="py-3 px-3 text-center">Pack Size</th>
                  <th className="py-3 px-3 font-mono">Product ID</th>
                  <th className="py-3 px-3.5 font-mono">Product Code</th>
                  <th className="py-3 px-2.5">Unit</th>
                  <th className="py-3 px-3.5">Ghi chú</th>
                  <th className="py-3 px-3 text-right">Giá vốn FIFO</th>
                  <th className="py-3 px-3 text-right">Giá bán</th>
                  <th className="py-3 px-3 text-center font-black text-slate-900">Tồn kho thực tế</th>
                  <th className="py-3 px-3.5 text-right">Thao tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredProducts.map((p, idx) => {
                  const prodLots = inventoryLots.filter((l) => l.sku === p.sku || l.sku === p.variantSku);
                  const activeProdLots = prodLots.filter((l) => (l.remainingQuantity || 0) > 0);
                  const nextCost = activeProdLots[0]?.costPrice || p.costPrice;
                  const hasAged = activeProdLots.some((l) => isAgedLot(l.intakeDate));

                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-blue-50/40 transition-colors ${
                        p.isLowStock ? 'bg-amber-50/30' : ''
                      }`}
                    >
                      {/* STT */}
                      <td className="py-3 px-2.5 text-center font-bold text-slate-400">
                        {idx + 1}
                      </td>

                      {/* 1. Category */}
                      <td className="py-3 px-3.5 font-medium text-slate-700 whitespace-nowrap">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-[11px] text-slate-700">
                          {p.category}
                        </span>
                      </td>

                      {/* 2. Brand */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span
                          className={`font-black text-[11px] px-2 py-0.5 rounded-md ${
                            p.brand === 'Vietcoco'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.brand === 'Hòa Phát'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {p.brand || 'Vietcoco'}
                        </span>
                      </td>

                      {/* 3. Product Name */}
                      <td className="py-3 px-3.5 font-bold text-slate-900 min-w-[220px]">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <button
                            onClick={() => setSelectedSkuForDetail(p)}
                            className="text-left font-bold hover:text-blue-600 hover:underline transition"
                            title="Bấm để mở chi tiết đầy đủ SKU"
                          >
                            {p.productName || p.name}
                          </button>
                          {p.isLowStock && (
                            <span className="bg-rose-100 text-rose-700 text-[10px] font-extrabold px-1.5 py-0.2 rounded shrink-0">
                              Sắp hết
                            </span>
                          )}
                          {hasAged && (
                            <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-1.5 py-0.2 rounded shrink-0">
                              Lô &gt;30d
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 4. Variant Name */}
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-100">
                          {p.variantName || p.variant || '1 Hộp'}
                        </span>
                      </td>

                      {/* 5. Variant SKU */}
                      <td className="py-3 px-3.5 font-mono whitespace-nowrap">
                        <span className="font-extrabold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                          {p.variantSku || p.sku}
                        </span>
                      </td>

                      {/* 6. Pack Size */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 font-black text-slate-800 bg-slate-100 rounded-full text-xs">
                          {p.packSize || '1'}
                        </span>
                      </td>

                      {/* 7. Product ID */}
                      <td className="py-3 px-3 font-mono text-slate-500 whitespace-nowrap">
                        {p.productId || 'P000001'}
                      </td>

                      {/* 8. Product Code */}
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {p.productCode || p.code}
                      </td>

                      {/* 9. Unit */}
                      <td className="py-3 px-2.5 text-slate-600 font-medium whitespace-nowrap">
                        {p.unit}
                      </td>

                      {/* 10. Ghi chú */}
                      <td className="py-3 px-3.5 text-slate-500 text-[11px] max-w-[200px]">
                        <span className="truncate block" title={p.note || p.notes || ''}>
                          {p.note || p.notes || '-'}
                        </span>
                      </td>

                      {/* Giá vốn FIFO */}
                      <td className="py-3 px-3 text-right font-semibold text-slate-600 whitespace-nowrap">
                        {formatVND(nextCost)}
                      </td>

                      {/* Giá bán */}
                      <td className="py-3 px-3 text-right font-black text-blue-700 whitespace-nowrap">
                        {formatVND(p.sellingPrice)}
                      </td>

                      {/* Tồn kho thực tế */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <span
                            className={`font-black text-sm px-2 py-0.5 rounded-lg ${
                              p.isLowStock ? 'bg-rose-100 text-rose-700' : 'bg-emerald-50 text-emerald-800'
                            }`}
                          >
                            {(p.stock || 0).toLocaleString('vi-VN')}
                          </span>
                          <span className="text-[10px] text-slate-400">{p.unit}</span>
                        </div>
                      </td>

                      {/* Thao tác */}
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelectedSkuForDetail(p)}
                            className="p-1.5 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                            title="Xem chi tiết toàn diện SKU"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onOpenCreatePO(p.name)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                            title="Lập phiếu nhập kho PO"
                          >
                            + Nhập
                          </button>
                          {onOpenEditProduct && (
                            <button
                              onClick={() => onOpenEditProduct(p)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Chỉnh sửa sản phẩm"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteProduct && (
                            <button
                              onClick={() => onDeleteProduct(p.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa sản phẩm"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
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
      )}

      {/* VIEW 2: HIERARCHY TREE (PRODUCT PARENT & COMBOS) */}
      {viewLayout === 'hierarchy-tree' && (
        <div className="space-y-4">
          {hierarchyGroups.map((group) => {
            const isExpanded = expandedParents[group.groupKey] ?? true;

            return (
              <div
                key={group.groupKey}
                className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden transition-all"
              >
                {/* Parent Product Header */}
                <div
                  onClick={() => toggleHierarchyExpand(group.groupKey)}
                  className="px-5 py-4 bg-slate-50/70 hover:bg-slate-100/70 border-b border-slate-200 flex items-center justify-between cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <button className="p-1 text-slate-400 hover:text-slate-700 rounded-lg">
                      {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-bold text-xs bg-slate-200 text-slate-800 px-2 py-0.5 rounded-md">
                          {group.productId}
                        </span>
                        <span className="font-mono font-black text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
                          {group.productCode}
                        </span>
                        <h3 className="font-black text-sm text-slate-900">{group.productName}</h3>
                        <span className="bg-emerald-100 text-emerald-800 font-bold text-[11px] px-2 py-0.5 rounded-md">
                          {group.brand}
                        </span>
                        <span className="bg-slate-100 text-slate-600 font-semibold text-[11px] px-2 py-0.5 rounded-md">
                          {group.category}
                        </span>
                      </div>
                      {group.note && (
                        <p className="text-[11px] text-slate-500 mt-1 pl-1">
                          💡 {group.note}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <span className="text-[11px] text-slate-400 block font-medium">Tổng tồn nhóm</span>
                      <span className="text-sm font-black text-slate-900">
                        {group.totalStock.toLocaleString('vi-VN')} {group.unit}
                      </span>
                    </div>
                    <span className="bg-purple-100 text-purple-800 font-extrabold text-xs px-2.5 py-1 rounded-full">
                      {group.variantsCount} Quy cách & Combo
                    </span>
                  </div>
                </div>

                {/* Sub-variant rows */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100">
                    <table className="w-full text-left border-collapse text-xs">
                      <thead className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase">
                        <tr>
                          <th className="py-2.5 px-6">Quy cách (Variant Name)</th>
                          <th className="py-2.5 px-4 font-mono">Mã SKU (Variant SKU)</th>
                          <th className="py-2.5 px-4 text-center">Pack Size</th>
                          <th className="py-2.5 px-4 text-right">Giá vốn</th>
                          <th className="py-2.5 px-4 text-right">Giá bán niêm yết</th>
                          <th className="py-2.5 px-4 text-center">Tồn kho</th>
                          <th className="py-2.5 px-6 text-right">Thao tác</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {group.items.map((item) => (
                          <tr key={item.id} className="hover:bg-purple-50/30">
                            <td className="py-3 px-6 font-bold text-emerald-800">
                              <span className="bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">
                                📦 {item.variantName || item.variant || '1 Hộp'}
                              </span>
                            </td>
                            <td className="py-3 px-4 font-mono font-extrabold text-purple-700">
                              {item.variantSku || item.sku}
                            </td>
                            <td className="py-3 px-4 text-center font-black text-slate-700">
                              {item.packSize || '1'} {item.unit}
                            </td>
                            <td className="py-3 px-4 text-right text-slate-600 font-semibold">
                              {formatVND(item.costPrice)}
                            </td>
                            <td className="py-3 px-4 text-right font-black text-blue-700">
                              {formatVND(item.sellingPrice)}
                            </td>
                            <td className="py-3 px-4 text-center">
                              <span className="font-black text-emerald-700 text-sm">
                                {(item.stock || 0).toLocaleString('vi-VN')}
                              </span>{' '}
                              <span className="text-[10px] text-slate-400">{item.unit}</span>
                            </td>
                            <td className="py-3 px-6 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setSelectedProductForLots(item)}
                                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  Lô FIFO
                                </button>
                                <button
                                  onClick={() => onOpenCreatePO(item.name)}
                                  className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-bold cursor-pointer"
                                >
                                  + Nhập
                                </button>
                                {onOpenEditProduct && (
                                  <button
                                    onClick={() => onOpenEditProduct(item)}
                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                                    title="Chỉnh sửa sản phẩm"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {onDeleteProduct && (
                                  <button
                                    onClick={() => onDeleteProduct(item.id)}
                                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                                    title="Xóa sản phẩm"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW 3: CARDS GRID */}
      {viewLayout === 'cards-grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((p) => {
            const prodLots = inventoryLots.filter((l) => l.sku === p.sku || l.sku === p.variantSku);
            const activeProdLots = prodLots.filter((l) => (l.remainingQuantity || 0) > 0);

            return (
              <div
                key={p.id}
                className="bg-white rounded-3xl border border-slate-200 p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                      {p.productId}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                        p.brand === 'Vietcoco'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {p.brand || 'Vietcoco'}
                    </span>
                  </div>

                  <div>
                    <span className="font-mono font-black text-xs text-blue-700 block">
                      {p.variantSku || p.sku}
                    </span>
                    <h3 className="font-black text-sm text-slate-900 mt-0.5 line-clamp-2">
                      {p.productName || p.name}
                    </h3>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="bg-emerald-50 text-emerald-800 font-extrabold text-[11px] px-2 py-0.5 rounded-lg border border-emerald-100">
                      {p.variantName || p.variant || '1 Hộp'}
                    </span>
                    <span className="bg-slate-100 text-slate-600 font-bold text-[11px] px-2 py-0.5 rounded-lg">
                      Pack: {p.packSize || '1'} {p.unit}
                    </span>
                  </div>

                  {p.note && (
                    <p className="text-[11px] text-slate-500 italic line-clamp-1">
                      {p.note}
                    </p>
                  )}

                  <div className="pt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Giá bán niêm yết</span>
                      <span className="font-black text-blue-700 text-sm">
                        {formatVND(p.sellingPrice)}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Tồn khả dụng</span>
                      <span className="font-black text-emerald-700 text-sm">
                        {(p.stock || 0).toLocaleString('vi-VN')} {p.unit}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 mt-3 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedProductForLots(p)}
                    className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{activeProdLots.length} Lô FIFO</span>
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onOpenCreatePO(p.name)}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      + Nhập
                    </button>
                    {onOpenEditProduct && (
                      <button
                        onClick={() => onOpenEditProduct(p)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded cursor-pointer"
                        title="Chỉnh sửa sản phẩm"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    {onDeleteProduct && (
                      <button
                        onClick={() => onDeleteProduct(p.id)}
                        className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded cursor-pointer"
                        title="Xóa sản phẩm"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Lot Detail Modal */}
      <LotDetailModal
        isOpen={!!selectedProductForLots}
        onClose={() => setSelectedProductForLots(null)}
        product={selectedProductForLots}
        lots={inventoryLots}
        onOpenCreatePO={onOpenCreatePO}
      />

      {/* Sku Detail Drawer Modal */}
      <SkuDetailDrawerModal
        isOpen={!!selectedSkuForDetail}
        onClose={() => setSelectedSkuForDetail(null)}
        product={selectedSkuForDetail}
        inventoryLots={inventoryLots}
        stockTransactions={stockTransactions}
        onOpenCreatePO={onOpenCreatePO}
        onOpenStockAdjustment={onOpenStockAdjustment}
      />
    </div>
  );
};
