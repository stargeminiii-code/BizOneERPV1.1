import React, { useState, useMemo } from 'react';
import {
  Layers3,
  Search,
  Plus,
  Filter,
  Download,
  Upload,
  Edit2,
  Trash2,
  Boxes,
  Package,
  Sparkles,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Building2,
  RefreshCw,
  Copy,
  Zap,
  ArrowUpDown,
  X,
  SlidersHorizontal,
  ChevronRight,
  Info
} from 'lucide-react';
import { Product, ProductVariant, InventoryLayer, StockTransaction, Order, PurchaseOrder } from '../types';
import {
  generateNextProductId,
  generateProductCode,
  generateVariantSku,
  getStandardCombos,
  ENTERPRISE_TAX_DIRECTORY
} from '../utils/productCodeGenerator';
import { SkuDetailDrawerModal } from './Modals/SkuDetailDrawerModal';
import { SearchableCreatableSelect } from './SearchableCreatableSelect';

interface VariantSkuMasterViewProps {
  products: Product[];
  inventoryLots?: InventoryLayer[];
  stockTransactions?: StockTransaction[];
  orders?: Order[];
  purchaseOrders?: PurchaseOrder[];
  onUpdateProduct: (product: Product) => void;
  onCreateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onOpenEInvoiceEntry: () => void;
  onOpenCreatePO?: (skuName?: string) => void;
}

export const VariantSkuMasterView: React.FC<VariantSkuMasterViewProps> = ({
  products = [],
  inventoryLots = [],
  stockTransactions = [],
  orders = [],
  purchaseOrders = [],
  onUpdateProduct,
  onCreateProduct,
  onDeleteProduct,
  onOpenEInvoiceEntry,
  onOpenCreatePO
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBrand, setFilterBrand] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterClassification, setFilterClassification] = useState<'all' | 'unclassified' | 'classified'>('all');

  // Selected SKU for deep inspection drawer
  const [selectedSkuForDetail, setSelectedSkuForDetail] = useState<Product | null>(null);

  // Modal for creating/editing variant master
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<{
    isNew: boolean;
    productId: string;
    productCode: string;
    productName: string;
    brand: string;
    category: string;
    variantName: string;
    variantSku: string;
    packSize: string;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    location: string;
    note: string;
    originalId?: string;
  } | null>(null);

  // Extract unique brands and categories
  const brandList = useMemo(() => {
    const brands = new Set<string>();
    products.forEach((p) => {
      if (p.brand && p.brand.trim()) brands.add(p.brand.trim());
    });
    return Array.from(brands);
  }, [products]);

  const categoryList = useMemo(() => {
    const cats = new Set<string>();
    products.forEach((p) => {
      if (p.category && p.category.trim()) cats.add(p.category.trim());
    });
    return Array.from(cats);
  }, [products]);

  // Flatten products and their sub-variants into a unified Master Row list
  interface MasterRow {
    id: string;
    productId: string;
    productCode: string;
    productName: string;
    brand: string;
    category: string;
    variantName: string;
    variantSku: string;
    packSize: string;
    unit: string;
    costPrice: number;
    sellingPrice: number;
    stock: number;
    actualStock: number;
    location: string;
    note: string;
    isUnclassified: boolean;
    rawProduct: Product;
  }

  const masterRows: MasterRow[] = useMemo(() => {
    const rows: MasterRow[] = [];

    products.forEach((p) => {
      const pId = p.productId || 'P000001';
      const pCode = (p.productCode || p.code || '').toUpperCase();
      const pName = p.productName || p.name || '';
      const pBrand = p.brand || 'Vietcoco';
      const pCat = p.category || 'Mặc định';
      const pLoc = p.location || 'Kho Tổng';

      // 1. If product has multi-variants defined
      if (p.variants && p.variants.length > 0) {
        p.variants.forEach((v, vIdx) => {
          const varSku = (v.variantSku || v.sku || '').toUpperCase();
          const varName = v.variantName || '1 Hộp';
          const pack = String(v.packSize || '1');
          const unit = v.unit || p.unit || 'Hộp';
          const isUnclass = !varSku || varSku.trim() === '';

          // Calculate actual stock from inventory layers with NaN protection
          const matchedLots = inventoryLots.filter(
            (l) =>
              (l.sku && l.sku.toUpperCase() === varSku) ||
              (l.productCode && l.productCode.toUpperCase() === pCode && l.variantName === varName)
          );
          const actStock = matchedLots.reduce((sum, l) => {
            const rem = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0);
            return sum + (isNaN(rem) ? 0 : rem);
          }, 0);

          const rawStock = Number(v.stock ?? p.stock ?? 0) || 0;

          rows.push({
            id: `${p.id}-var-${vIdx}`,
            productId: pId,
            productCode: pCode,
            productName: pName,
            brand: pBrand,
            category: pCat,
            variantName: varName,
            variantSku: varSku,
            packSize: pack,
            unit,
            costPrice: Number(v.costPrice ?? p.costPrice ?? 0) || 0,
            sellingPrice: Number(v.sellingPrice ?? p.sellingPrice ?? 0) || 0,
            stock: rawStock,
            actualStock: matchedLots.length > 0 ? actStock : rawStock,
            location: pLoc,
            note: v.note || p.note || '',
            isUnclassified: isUnclass,
            rawProduct: {
              ...p,
              sku: varSku,
              variantSku: varSku,
              variant: varName,
              variantName: varName,
              packSize: pack,
              unit,
              sellingPrice: Number(v.sellingPrice ?? p.sellingPrice ?? 0) || 0,
              costPrice: Number(v.costPrice ?? p.costPrice ?? 0) || 0
            }
          });
        });
      } else {
        // Standard single product row
        const varSku = (p.variantSku || p.sku || '').toUpperCase();
        const varName = p.variantName || p.variant || '1 Hộp';
        const pack = String(p.packSize || '1');
        const unit = p.unit || 'Hộp';
        const isUnclass = !varSku || varSku.trim() === '';

        const matchedLots = inventoryLots.filter(
          (l) =>
            (l.sku && l.sku.toUpperCase() === varSku) ||
            (l.productCode && l.productCode.toUpperCase() === pCode && l.variantName === varName)
        );
        const actStock = matchedLots.reduce((sum, l) => {
          const rem = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0);
          return sum + (isNaN(rem) ? 0 : rem);
        }, 0);

        const rawStock = Number(p.stock ?? 0) || 0;

        rows.push({
          id: p.id,
          productId: pId,
          productCode: pCode,
          productName: pName,
          brand: pBrand,
          category: pCat,
          variantName: varName,
          variantSku: varSku,
          packSize: pack,
          unit,
          costPrice: Number(p.costPrice ?? 0) || 0,
          sellingPrice: Number(p.sellingPrice ?? 0) || 0,
          stock: rawStock,
          actualStock: matchedLots.length > 0 ? actStock : rawStock,
          location: pLoc,
          note: p.note || p.notes || '',
          isUnclassified: isUnclass,
          rawProduct: p
        });
      }
    });

    return rows;
  }, [products, inventoryLots]);

  // Filter master rows
  const filteredRows = useMemo(() => {
    return masterRows.filter((r) => {
      const matchSearch =
        r.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.productCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.variantSku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.productId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.variantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.note.toLowerCase().includes(searchTerm.toLowerCase());

      const matchBrand = filterBrand === 'all' || r.brand === filterBrand;
      const matchCategory = filterCategory === 'all' || r.category === filterCategory;

      let matchClass = true;
      if (filterClassification === 'unclassified') matchClass = r.isUnclassified;
      if (filterClassification === 'classified') matchClass = !r.isUnclassified;

      return matchSearch && matchBrand && matchCategory && matchClass;
    });
  }, [masterRows, searchTerm, filterBrand, filterCategory, filterClassification]);

  // KPI Metrics
  const totalMasterProducts = useMemo(() => {
    const pSet = new Set(masterRows.map((r) => r.productCode));
    return pSet.size;
  }, [masterRows]);

  const totalVariantSkus = masterRows.length;
  const unclassifiedCount = masterRows.filter((r) => r.isUnclassified).length;
  const totalActualStockSum = masterRows.reduce((sum, r) => sum + r.actualStock, 0);

  // Quick Open Modal for New Variant SKU Master
  const handleOpenCreateModal = () => {
    const nextPid = generateNextProductId(products);
    setEditingItem({
      isNew: true,
      productId: nextPid,
      productCode: 'VCCCM330-PRM',
      productName: 'Sữa dừa Premium Vietcoco 330ml',
      brand: 'Vietcoco',
      category: 'Sản phẩm Nước Dừa & Sữa Dừa Vietcoco',
      variantName: 'Combo 2 Hộp',
      variantSku: 'VCCCM330-PRM-C2',
      packSize: '2',
      unit: 'Hộp',
      costPrice: 32000,
      sellingPrice: 40000,
      location: 'Kho Tổng',
      note: 'Chuẩn hóa danh mục Master Data'
    });
    setIsEditModalOpen(true);
  };

  // Open Modal to Edit existing row
  const handleOpenEditModal = (row: MasterRow) => {
    setEditingItem({
      isNew: false,
      productId: row.productId,
      productCode: row.productCode,
      productName: row.productName,
      brand: row.brand,
      category: row.category,
      variantName: row.variantName,
      variantSku: row.variantSku,
      packSize: row.packSize,
      unit: row.unit,
      costPrice: row.costPrice,
      sellingPrice: row.sellingPrice,
      location: row.location,
      note: row.note,
      originalId: row.rawProduct.id
    });
    setIsEditModalOpen(true);
  };

  // Save changes from Edit Modal
  const handleSaveModal = () => {
    if (!editingItem) return;

    if (!editingItem.productName.trim()) {
      alert('Vui lòng nhập Tên sản phẩm!');
      return;
    }

    if (editingItem.isNew) {
      const newProd: Product = {
        id: `prod-${Date.now()}`,
        productId: editingItem.productId,
        code: editingItem.productCode.toUpperCase(),
        productCode: editingItem.productCode.toUpperCase(),
        sku: editingItem.variantSku.toUpperCase(),
        variantSku: editingItem.variantSku.toUpperCase(),
        name: editingItem.productName,
        productName: editingItem.productName,
        variant: editingItem.variantName,
        variantName: editingItem.variantName,
        brand: editingItem.brand,
        category: editingItem.category,
        packSize: editingItem.packSize,
        unit: editingItem.unit,
        costPrice: editingItem.costPrice,
        sellingPrice: editingItem.sellingPrice,
        stock: 0,
        minStock: 10,
        location: editingItem.location,
        supplierName: editingItem.brand,
        note: editingItem.note
      };
      onCreateProduct(newProd);
    } else if (editingItem.originalId) {
      const existing = products.find((p) => p.id === editingItem.originalId);
      if (existing) {
        const updated: Product = {
          ...existing,
          productId: editingItem.productId,
          code: editingItem.productCode.toUpperCase(),
          productCode: editingItem.productCode.toUpperCase(),
          sku: editingItem.variantSku.toUpperCase(),
          variantSku: editingItem.variantSku.toUpperCase(),
          name: editingItem.productName,
          productName: editingItem.productName,
          variant: editingItem.variantName,
          variantName: editingItem.variantName,
          brand: editingItem.brand,
          category: editingItem.category,
          packSize: editingItem.packSize,
          unit: editingItem.unit,
          costPrice: editingItem.costPrice,
          sellingPrice: editingItem.sellingPrice,
          location: editingItem.location,
          note: editingItem.note
        };
        onUpdateProduct(updated);
      }
    }

    setIsEditModalOpen(false);
    setEditingItem(null);
  };

  // Quick Clone / Generate Combos for an existing parent product
  const handleQuickAddCombo = (row: MasterRow, comboLabel: string, comboPack: number, skuSuffix: string) => {
    const newSku = `${row.productCode}-${skuSuffix}`;
    const newProd: Product = {
      id: `prod-${Date.now()}-${skuSuffix}`,
      productId: generateNextProductId(products),
      code: row.productCode,
      productCode: row.productCode,
      sku: newSku,
      variantSku: newSku,
      name: row.productName,
      productName: row.productName,
      variant: comboLabel,
      variantName: comboLabel,
      brand: row.brand,
      category: row.category,
      packSize: String(comboPack),
      unit: row.unit,
      costPrice: row.costPrice * comboPack,
      sellingPrice: Math.round(row.sellingPrice * comboPack * 0.95), // 5% combo discount
      stock: 0,
      minStock: 10,
      location: row.location,
      supplierName: row.brand,
      note: `Tự động tạo combo ${comboLabel} từ Master Data`
    };
    onCreateProduct(newProd);
  };

  const handleExportCSV = () => {
    let csv = 'STT,Product ID,Product Code (SP Cha),Tên Sản Phẩm,Thương Hiệu,Tên Biến Thể,Variant SKU,Quy Cách,ĐVT,Tồn Kho Thực Tế,Giá Vốn,Giá Bán,Trạng Thái,Ghi Chú\n';
    filteredRows.forEach((r, idx) => {
      const line = [
        idx + 1,
        `"${r.productId}"`,
        `"${r.productCode}"`,
        `"${r.productName.replace(/"/g, '""')}"`,
        `"${r.brand}"`,
        `"${r.variantName}"`,
        `"${r.variantSku}"`,
        `"${r.packSize}"`,
        `"${r.unit}"`,
        r.actualStock,
        r.costPrice,
        r.sellingPrice,
        r.isUnclassified ? 'Chưa phân loại SKU' : 'Đang áp dụng',
        `"${r.note.replace(/"/g, '""')}"`
      ];
      csv += line.join(',') + '\n';
    });

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `dinh_nghia_variant_sku_master_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-5 max-w-[1700px] mx-auto">
      {/* HEADER SECTION */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Layers3 className="w-6 h-6 text-purple-600" />
            <span>Variant SKU</span>
          </h1>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-md shadow-purple-500/20 cursor-pointer transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Tạo Định Nghĩa Variant SKU</span>
          </button>

          {onOpenEInvoiceEntry && (
            <button
              onClick={onOpenEInvoiceEntry}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-purple-50 border border-purple-200 text-purple-800 rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-all"
              title="Nhập nhanh từ Hóa Đơn Điện Tử (Phương Án 2)"
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Nhập Từ HĐĐT (PA2)</span>
            </button>
          )}

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold shadow-2xs cursor-pointer transition-all"
            title="Xuất bảng Master Data ra file CSV chuẩn ERP"
          >
            <Download className="w-3.5 h-3.5 text-blue-600" />
            <span>Xuất Master CSV</span>
          </button>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: SP Cha */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">SẢN PHẨM CHA</span>
            <div className="w-7 h-7 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900">{totalMasterProducts}</div>
          <div className="text-[11px] text-purple-600 font-semibold mt-0.5">Mã SP Cha (Product Code)</div>
        </div>

        {/* KPI 2: Tổng Variant SKU */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">TỔNG VARIANT SKU</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Layers3 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-indigo-700">{totalVariantSkus}</div>
          <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">Mã biến thể con theo Combo</div>
        </div>

        {/* KPI 3: Tồn Kho Thực Tế */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">TỒN KHO THỰC TẾ</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-700">
            {totalActualStockSum.toLocaleString('vi-VN')}
          </div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">Đơn vị khả dụng trong kho</div>
        </div>

        {/* KPI 4: Chưa phân loại SKU */}
        <div
          onClick={() => setFilterClassification(filterClassification === 'unclassified' ? 'all' : 'unclassified')}
          className={`p-4 rounded-2xl border transition-all cursor-pointer shadow-2xs ${
            unclassifiedCount > 0
              ? 'bg-amber-50/70 border-amber-300 hover:border-amber-500'
              : 'bg-white border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between text-slate-500 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              CHƯA PHÂN LOẠI SKU
            </span>
            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-amber-900">{unclassifiedCount}</div>
          <div className="text-[11px] text-amber-700 font-bold mt-0.5">
            {unclassifiedCount > 0 ? 'Bấm để lọc & bổ sung SKU' : '✓ 100% SKU đã chuẩn hóa'}
          </div>
        </div>
      </div>

      {/* FILTER RIBBON */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Box */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tìm Product ID, Code, SKU, Tên SP, Combo..."
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          {/* Filter Brand */}
          <div>
            <select
              value={filterBrand}
              onChange={(e) => setFilterBrand(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Tất cả Thương hiệu (Brand)</option>
              {brandList.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Category */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Tất cả Nhóm danh mục</option>
              {categoryList.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Filter Status */}
          <div>
            <select
              value={filterClassification}
              onChange={(e) => setFilterClassification(e.target.value as any)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="all">Tất cả trạng thái SKU</option>
              <option value="classified">Đã có Variant SKU đầy đủ</option>
              <option value="unclassified">⚠ Chưa phân loại Variant SKU</option>
            </select>
          </div>
        </div>

        {/* Status Count & Clear */}
        <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
          <div className="text-slate-500">
            Hiển thị: <strong className="text-slate-900">{filteredRows.length}</strong> / {masterRows.length} định nghĩa Variant SKU
          </div>
          {(searchTerm || filterBrand !== 'all' || filterCategory !== 'all' || filterClassification !== 'all') && (
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterBrand('all');
                setFilterCategory('all');
                setFilterClassification('all');
              }}
              className="text-purple-600 hover:text-purple-800 font-bold hover:underline cursor-pointer"
            >
              Xóa bộ lọc
            </button>
          )}
        </div>
      </div>

      {/* MASTER DATA TABLE */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[1300px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-black text-slate-600 uppercase tracking-wider">
                <th className="py-3 px-3 text-center w-10">STT</th>
                <th className="py-3 px-3 font-mono text-blue-700">Product ID</th>
                <th className="py-3 px-3.5 font-mono text-purple-700">Product Code (SP Cha)</th>
                <th className="py-3 px-3.5">Tên Sản Phẩm</th>
                <th className="py-3 px-3">Thương Hiệu (Brand)</th>
                <th className="py-3 px-3.5">Tên Biến Thể / Combo</th>
                <th className="py-3 px-3.5 font-mono text-indigo-700">Variant SKU</th>
                <th className="py-3 px-3 text-center">Quy Cách</th>
                <th className="py-3 px-2.5 text-center">ĐVT</th>
                <th className="py-3 px-3 text-center font-black text-slate-900">Tồn Kho Thực Tế</th>
                <th className="py-3 px-3 text-right">Giá Vốn FIFO</th>
                <th className="py-3 px-3 text-right">Giá Niêm Yết</th>
                <th className="py-3 px-3 text-center">Trạng Thái</th>
                <th className="py-3 px-3.5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan={14} className="text-center py-12 text-slate-400">
                    <Layers3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="font-bold">Không tìm thấy định nghĩa Variant SKU nào</p>
                  </td>
                </tr>
              ) : (
                filteredRows.map((row, idx) => (
                  <tr
                    key={row.id}
                    className={`hover:bg-purple-50/40 transition-colors ${
                      row.isUnclassified ? 'bg-amber-50/30' : ''
                    }`}
                  >
                    {/* STT */}
                    <td className="py-3 px-3 text-center font-bold text-slate-400">
                      {idx + 1}
                    </td>

                    {/* Product ID (P000001) */}
                    <td className="py-3 px-3 font-mono font-bold text-blue-700 whitespace-nowrap">
                      {row.productId}
                    </td>

                    {/* Product Code (VCCCM330-PRM) */}
                    <td className="py-3 px-3.5 font-mono font-black text-purple-900 whitespace-nowrap">
                      {row.productCode}
                    </td>

                    {/* Product Name */}
                    <td className="py-3 px-3.5 font-bold text-slate-900 min-w-[200px]">
                      <button
                        onClick={() => setSelectedSkuForDetail(row.rawProduct)}
                        className="text-left hover:text-purple-700 hover:underline font-bold transition"
                        title="Bấm để xem chi tiết đầy đủ SKU & Lô hàng"
                      >
                        {row.productName}
                      </button>
                    </td>

                    {/* Brand */}
                    <td className="py-3 px-3 whitespace-nowrap">
                      <span className="font-extrabold text-[11px] px-2 py-0.5 rounded-md bg-slate-100 text-slate-800">
                        {row.brand}
                      </span>
                    </td>

                    {/* Variant Name / Combo */}
                    <td className="py-3 px-3.5 whitespace-nowrap">
                      <span className="font-bold text-purple-900 bg-purple-50 px-2 py-0.5 rounded-lg border border-purple-100">
                        {row.variantName}
                      </span>
                    </td>

                    {/* Variant SKU */}
                    <td className="py-3 px-3.5 font-mono whitespace-nowrap">
                      {row.variantSku ? (
                        <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                          {row.variantSku}
                        </span>
                      ) : (
                        <span className="text-amber-700 bg-amber-100 px-2 py-0.5 rounded-lg font-bold text-[10px]">
                          Chưa gán SKU
                        </span>
                      )}
                    </td>

                    {/* Quy Cách / Pack Size */}
                    <td className="py-3 px-3 text-center whitespace-nowrap font-bold text-slate-700">
                      {row.packSize}
                    </td>

                    {/* ĐVT */}
                    <td className="py-3 px-2.5 text-center text-slate-600 font-medium whitespace-nowrap">
                      {row.unit}
                    </td>

                    {/* Tồn Kho Thực Tế */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      <span className={`inline-flex items-center gap-1 font-black px-2.5 py-1 rounded-xl text-xs ${
                        row.actualStock > 0
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}>
                        {row.actualStock.toLocaleString('vi-VN')} {row.unit}
                      </span>
                    </td>

                    {/* Giá Vốn */}
                    <td className="py-3 px-3 text-right font-mono text-slate-700 whitespace-nowrap">
                      {formatVND(row.costPrice)}
                    </td>

                    {/* Giá Bán */}
                    <td className="py-3 px-3 text-right font-mono font-bold text-purple-900 whitespace-nowrap">
                      {formatVND(row.sellingPrice)}
                    </td>

                    {/* Trạng Thái */}
                    <td className="py-3 px-3 text-center whitespace-nowrap">
                      {row.isUnclassified ? (
                        <span className="bg-amber-100 text-amber-900 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          Chưa phân loại
                        </span>
                      ) : (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold px-2 py-0.5 rounded-full text-[10px]">
                          Đang áp dụng
                        </span>
                      )}
                    </td>

                    {/* Thao Tác */}
                    <td className="py-3 px-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => setSelectedSkuForDetail(row.rawProduct)}
                          className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg transition"
                          title="Xem Chi Tiết SKU & Thẻ Kho"
                        >
                          <Info className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(row)}
                          className="p-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg transition"
                          title="Sửa định nghĩa Master"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Xác nhận xóa định nghĩa SKU ${row.variantSku || row.productName}?`)) {
                              onDeleteProduct(row.rawProduct.id);
                            }
                          }}
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition"
                          title="Xóa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE / EDIT MASTER DEFINITION MODAL */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col my-4">
            <div className="px-6 py-4 bg-gradient-to-r from-purple-700 to-indigo-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                  <Layers3 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="font-black text-base">
                    {editingItem.isNew ? 'Tạo Định Nghĩa Variant SKU Master Mới' : 'Cập Nhật Định Nghĩa Variant SKU Master'}
                  </h3>
                  <p className="text-xs text-purple-100">
                    Tự động đồng bộ sang Danh mục Hàng hóa, Kho FIFO và POS Bán Hàng
                  </p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs max-h-[75vh] overflow-y-auto bg-slate-50/50">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Product ID */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Product ID (Auto P000001→P999999) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingItem.productId}
                    onChange={(e) => setEditingItem({ ...editingItem, productId: e.target.value.toUpperCase() })}
                    className="w-full bg-white font-mono font-bold border border-slate-300 rounded-xl px-3 py-2 text-blue-700"
                  />
                </div>

                {/* Product Code */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Product Code (Mã SP Cha) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingItem.productCode}
                    onChange={(e) => {
                      const newCode = e.target.value.toUpperCase();
                      const newSku = generateVariantSku(newCode, editingItem.variantName);
                      setEditingItem({
                        ...editingItem,
                        productCode: newCode,
                        variantSku: newSku
                      });
                    }}
                    placeholder="VCCCM330-PRM"
                    className="w-full bg-white font-mono font-black border border-slate-300 rounded-xl px-3 py-2 text-purple-800"
                  />
                </div>

                {/* Product Name */}
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên Sản Phẩm Cha <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingItem.productName}
                    onChange={(e) => {
                      const newName = e.target.value;
                      const autoCode = generateProductCode(newName, editingItem.brand);
                      const autoSku = generateVariantSku(autoCode, editingItem.variantName);
                      setEditingItem({
                        ...editingItem,
                        productName: newName,
                        productCode: autoCode,
                        variantSku: autoSku
                      });
                    }}
                    placeholder="Sữa dừa Premium Vietcoco 330ml..."
                    className="w-full bg-white font-bold border border-slate-300 rounded-xl px-3 py-2 text-slate-900"
                  />
                </div>

                {/* Brand */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Thương Hiệu (Brand)</label>
                  <SearchableCreatableSelect
                    options={brandList.length > 0 ? brandList : ['Vietcoco', 'Hòa Phát', 'Hoa Sen', 'Vinamilk']}
                    value={editingItem.brand}
                    onChange={(b) => {
                      const autoCode = generateProductCode(editingItem.productName, b);
                      const autoSku = generateVariantSku(autoCode, editingItem.variantName);
                      setEditingItem({
                        ...editingItem,
                        brand: b,
                        productCode: autoCode,
                        variantSku: autoSku
                      });
                    }}
                    placeholder="Chọn hoặc tạo Brand..."
                    quickAddLabel="Tạo Brand mới"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Danh Mục Nhóm Hàng</label>
                  <select
                    value={editingItem.category}
                    onChange={(e) => setEditingItem({ ...editingItem, category: e.target.value })}
                    className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 font-medium text-slate-800"
                  >
                    <option value="Sản phẩm Nước Dừa & Sữa Dừa Vietcoco">Sản phẩm Nước Dừa & Sữa Dừa Vietcoco</option>
                    <option value="Thép Xây Dựng & Thép Cuộn">Thép Xây Dựng & Thép Cuộn</option>
                    <option value="Tôn Mạ Kẽm & Tôn Lạnh">Tôn Mạ Kẽm & Tôn Lạnh</option>
                    <option value="Sữa & Chế Phẩm Từ Sữa">Sữa & Chế Phẩm Từ Sữa</option>
                    <option value="Vật Tư Y Tế & Tiêu Hao">Vật Tư Y Tế & Tiêu Hao</option>
                    <option value="Hàng Tiêu Dùng Nhanh (FMCG)">Hàng Tiêu Dùng Nhanh (FMCG)</option>
                  </select>
                </div>

                {/* Variant Name */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Tên Biến Thể / Quy Cách Combo <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingItem.variantName}
                    onChange={(e) => {
                      const vName = e.target.value;
                      const autoSku = generateVariantSku(editingItem.productCode, vName);
                      setEditingItem({
                        ...editingItem,
                        variantName: vName,
                        variantSku: autoSku
                      });
                    }}
                    placeholder="Combo 2 Hộp / 1 Hộp..."
                    className="w-full bg-white font-bold border border-slate-300 rounded-xl px-3 py-2 text-purple-900"
                  />
                </div>

                {/* Variant SKU */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    Variant SKU (Mã Biến Thể)
                  </label>
                  <input
                    type="text"
                    value={editingItem.variantSku}
                    onChange={(e) => setEditingItem({ ...editingItem, variantSku: e.target.value.toUpperCase() })}
                    placeholder="VCCCM330-PRM-C2"
                    className="w-full bg-white font-mono font-black border border-slate-300 rounded-xl px-3 py-2 text-indigo-800"
                  />
                </div>

                {/* Pack Size & Unit */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Quy Cách Đóng Gói (Pack Size)</label>
                  <input
                    type="text"
                    value={editingItem.packSize}
                    onChange={(e) => setEditingItem({ ...editingItem, packSize: e.target.value })}
                    placeholder="1, 2, 6, 24..."
                    className="w-full bg-white font-bold border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-center"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Đơn Vị Tính (ĐVT)</label>
                  <input
                    type="text"
                    value={editingItem.unit}
                    onChange={(e) => setEditingItem({ ...editingItem, unit: e.target.value })}
                    placeholder="Hộp, Chai, Thùng..."
                    className="w-full bg-white font-bold border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-center"
                  />
                </div>

                {/* Cost Price & Selling Price */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá Vốn Nhập Kho (VND)</label>
                  <input
                    type="number"
                    value={editingItem.costPrice || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, costPrice: Number(e.target.value) || 0 })}
                    placeholder="32000"
                    className="w-full bg-white font-bold border border-slate-300 rounded-xl px-3 py-2 text-slate-800 text-right"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Giá Bán Niêm Yết (VND)</label>
                  <input
                    type="number"
                    value={editingItem.sellingPrice || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, sellingPrice: Number(e.target.value) || 0 })}
                    placeholder="40000"
                    className="w-full bg-white font-black border border-purple-300 rounded-xl px-3 py-2 text-purple-900 text-right"
                  />
                </div>
              </div>

              {/* Note */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ghi Chú Master Data</label>
                <textarea
                  value={editingItem.note}
                  onChange={(e) => setEditingItem({ ...editingItem, note: e.target.value })}
                  rows={2}
                  placeholder="Ghi chú quy cách, đặc điểm đóng gói..."
                  className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                />
              </div>
            </div>

            <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveModal}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Lưu & Đồng Bộ Master</span>
              </button>
            </div>
          </div>
        </div>
      )}

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
        onEditProduct={(p) => {
          const row = masterRows.find((r) => r.rawProduct.id === p.id);
          if (row) handleOpenEditModal(row);
        }}
      />
    </div>
  );
};
