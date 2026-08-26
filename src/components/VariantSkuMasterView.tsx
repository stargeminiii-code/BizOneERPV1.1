import React, { useState, useMemo } from 'react';
import {
  Search,
  Plus,
  Upload,
  Download,
  Trash2,
  Edit2,
  Eye,
  Zap
} from 'lucide-react';
import {
  Product,
  InventoryLayer,
  StockTransaction,
  Order,
  PurchaseOrder,
  ProductType
} from '../types';
import { ProductMasterRepository } from '../repositories/productMasterRepository';
import { ProductDetailDrawer } from './ProductMaster/ProductDetailDrawer';
import { ProductFormModal } from './ProductMaster/ProductFormModal';
import { PriceListsView } from './ProductMaster/PriceListsView';
import { SalesChannelsView } from './ProductMaster/SalesChannelsView';
import { CombosView } from './ProductMaster/CombosView';
import { CategoriesBrandsView } from './ProductMaster/CategoriesBrandsView';
import { ExcelImportExportModal } from './ProductMaster/ExcelImportExportModal';
import { useLanguage } from '../i18n';

interface VariantSkuMasterViewProps {
  products: Product[];
  tenantId?: string;
  inventoryLots?: InventoryLayer[];
  stockTransactions?: StockTransaction[];
  orders?: Order[];
  purchaseOrders?: PurchaseOrder[];
  onAddProduct: (prod: Product) => void;
  onUpdateProduct: (prod: Product) => void;
  onDeleteProduct: (id: string) => void;
  onOpenCreatePO?: (skuName?: string) => void;
  onOpenEInvoiceEntry?: () => void;
}

type ProductMasterTab =
  | 'products'
  | 'skus'
  | 'categories_brands'
  | 'pricing'
  | 'channels'
  | 'combos';

export const VariantSkuMasterView: React.FC<VariantSkuMasterViewProps> = ({
  products,
  tenantId = 'tenant-001',
  inventoryLots = [],
  stockTransactions = [],
  orders = [],
  purchaseOrders = [],
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onOpenCreatePO,
  onOpenEInvoiceEntry
}) => {
  const { t, formatCurrency } = useLanguage();
  ProductMasterRepository.initialize();

  // Active Tab
  const [activeTab, setActiveTab] = useState<ProductMasterTab>('products');

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterBrand, setFilterBrand] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Modals & Drawers state
  const [selectedProductForDetail, setSelectedProductForDetail] = useState<Product | null>(null);
  const [isFormModalOpen, setIsFormModalOpen] = useState<boolean>(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState<boolean>(false);

  // Distinct Filter Options
  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [products]);

  const brandsList = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchTerm ||
        (p.productName || p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.productCode || p.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.variantSku || p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.productId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase());

      const matchType = filterType === 'all' || (p.productType || 'FINISHED_GOOD') === filterType;
      const matchCategory = filterCategory === 'all' || p.category === filterCategory;
      const matchBrand = filterBrand === 'all' || p.brand === filterBrand;
      const matchStatus = filterStatus === 'all' || (p.status || 'ACTIVE').toUpperCase() === filterStatus;

      return matchSearch && matchType && matchCategory && matchBrand && matchStatus;
    });
  }, [products, searchTerm, filterType, filterCategory, filterBrand, filterStatus]);

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-5 max-w-[1700px] mx-auto text-slate-900">
      {/* 1. PAGE HEADER & ACTIONS */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            {t('productMaster.title')}
          </h1>
        </div>

        {/* Global Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => {
              setEditingProduct(null);
              setIsFormModalOpen(true);
            }}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Plus className="w-4 h-4" />
            <span>+ {t('productMaster.actions.createProduct')}</span>
          </button>

          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>{t('productMaster.actions.importExcel')}</span>
          </button>

          <button
            onClick={() => setIsExcelModalOpen(true)}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs sm:text-sm font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>{t('productMaster.actions.exportExcel')}</span>
          </button>

          {onOpenEInvoiceEntry && (
            <button
              onClick={onOpenEInvoiceEntry}
              className="px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
              title={t('productMaster.actions.eInvoiceEntry')}
            >
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>{t('productMaster.actions.eInvoiceEntry')}</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. TAB NAVIGATION */}
      <div className="border-b border-slate-200 flex gap-6 overflow-x-auto text-xs sm:text-sm font-medium">
        <button
          onClick={() => setActiveTab('products')}
          className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'products'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          {t('productMaster.tabs.products')} ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('skus')}
          className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'skus'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          {t('productMaster.tabs.skus')}
        </button>

        <button
          onClick={() => setActiveTab('categories_brands')}
          className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'categories_brands'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          {t('productMaster.tabs.categoriesBrands')}
        </button>

        <button
          onClick={() => setActiveTab('pricing')}
          className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'pricing'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          {t('productMaster.tabs.pricing')}
        </button>

        <button
          onClick={() => setActiveTab('channels')}
          className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'channels'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          {t('productMaster.tabs.channels')}
        </button>

        <button
          onClick={() => setActiveTab('combos')}
          className={`py-3 border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'combos'
              ? 'border-slate-900 text-slate-900 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          {t('productMaster.tabs.combos')}
        </button>
      </div>

      {/* 3. TAB VIEWS CONTENT */}
      {activeTab === 'products' && (
        <div className="space-y-4">
          {/* SEARCH & FILTERS TOOLBAR */}
          <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 space-y-3 text-xs shadow-2xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {/* Search Box */}
              <div className="relative lg:col-span-2">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={t('productMaster.filters.searchPlaceholder')}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
                />
              </div>

              {/* Filter Type */}
              <div>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                >
                  <option value="all">{t('productMaster.filters.allTypes')}</option>
                  <option value="FINISHED_GOOD">{t('productMaster.productTypes.FINISHED_GOOD')}</option>
                  <option value="BEVERAGE">{t('productMaster.productTypes.BEVERAGE')}</option>
                  <option value="TRADING_GOOD">{t('productMaster.productTypes.TRADING_GOOD')}</option>
                  <option value="RAW_MATERIAL">{t('productMaster.productTypes.RAW_MATERIAL')}</option>
                  <option value="FNB_INGREDIENT">{t('productMaster.productTypes.FNB_INGREDIENT')}</option>
                  <option value="FOOD">{t('productMaster.productTypes.FOOD')}</option>
                  <option value="PACKAGING">{t('productMaster.productTypes.PACKAGING')}</option>
                  <option value="COMBO">{t('productMaster.productTypes.COMBO')}</option>
                </select>
              </div>

              {/* Filter Category */}
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                >
                  <option value="all">{t('productMaster.filters.allCategories')}</option>
                  {categoriesList.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              {/* Filter Status */}
              <div>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs font-medium"
                >
                  <option value="all">{t('productMaster.filters.allStatuses')}</option>
                  <option value="ACTIVE">{t('productMaster.productStatuses.ACTIVE')}</option>
                  <option value="INACTIVE">{t('productMaster.productStatuses.INACTIVE')}</option>
                  <option value="ARCHIVED">{t('productMaster.productStatuses.ARCHIVED')}</option>
                </select>
              </div>
            </div>

            {/* Filter Summary */}
            <div className="flex items-center justify-between text-slate-500 pt-2 border-t border-slate-100 text-xs">
              <div>
                {t('common.showing', 'Hiển thị')}{' '}
                <strong className="text-slate-900">{filteredProducts.length}</strong> / {products.length}{' '}
                {t('productMaster.stats.totalProducts').toLowerCase()}
              </div>
              {(searchTerm || filterType !== 'all' || filterCategory !== 'all' || filterStatus !== 'all') && (
                <button
                  onClick={() => {
                    setSearchTerm('');
                    setFilterType('all');
                    setFilterCategory('all');
                    setFilterBrand('all');
                    setFilterStatus('all');
                  }}
                  className="text-slate-900 font-semibold hover:underline cursor-pointer"
                >
                  {t('productMaster.filters.clearFilter')}
                </button>
              )}
            </div>
          </div>

          {/* DATA TABLE (DESKTOP) */}
          <div className="hidden md:block bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-3 text-center w-10">{t('productMaster.table.stt')}</th>
                    <th className="py-3 px-3.5 font-mono">{t('productMaster.table.productCode')}</th>
                    <th className="py-3 px-4 min-w-[220px]">{t('productMaster.table.productName')}</th>
                    <th className="py-3 px-3.5">{t('productMaster.table.brand')}</th>
                    <th className="py-3 px-3.5">{t('productMaster.table.category')}</th>
                    <th className="py-3 px-3 text-center">{t('productMaster.table.unit')}</th>
                    <th className="py-3 px-3 text-right">{t('productMaster.table.costPrice')}</th>
                    <th className="py-3 px-3.5 text-right font-bold">{t('productMaster.table.sellingPrice')}</th>
                    <th className="py-3 px-3 text-center">{t('productMaster.drawer.trackLotBadge')}</th>
                    <th className="py-3 px-3 text-center">{t('productMaster.table.status')}</th>
                    <th className="py-3 px-3 text-right">{t('productMaster.table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-10 text-slate-400">
                        {t('productMaster.table.empty')}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((prod, idx) => {
                      const prodStatus = (prod.status || 'ACTIVE').toUpperCase();

                      return (
                        <tr
                          key={prod.id}
                          className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                          onClick={() => setSelectedProductForDetail(prod)}
                        >
                          <td className="py-3 px-3 text-center text-slate-400 font-mono">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-3.5 font-mono font-semibold text-slate-900 whitespace-nowrap">
                            {prod.productCode || prod.code}
                          </td>
                          <td className="py-3 px-4 font-medium text-slate-900">
                            <span className="hover:text-blue-600 transition-colors">
                              {prod.productName || prod.name}
                            </span>
                          </td>
                          <td className="py-3 px-3.5 text-slate-700 whitespace-nowrap font-medium">
                            {prod.brand || '—'}
                          </td>
                          <td className="py-3 px-3.5 text-slate-600 whitespace-nowrap">
                            {prod.category || '—'}
                          </td>
                          <td className="py-3 px-3 text-center text-slate-700 whitespace-nowrap">
                            {prod.unit || 'Hộp'}
                          </td>
                          <td className="py-3 px-3 text-right font-mono text-slate-600 whitespace-nowrap">
                            {formatCurrency(prod.costPrice || 0)}
                          </td>
                          <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900 whitespace-nowrap">
                            {formatCurrency(prod.sellingPrice || 0)}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            {prod.trackLot ? (
                              <span className="text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-mono">
                                Lot/EXP
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center whitespace-nowrap">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                prodStatus === 'ACTIVE'
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                  : prodStatus === 'INACTIVE'
                                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {t(`productMaster.productStatuses.${prodStatus}`, prodStatus)}
                            </span>
                          </td>
                          <td
                            className="py-3 px-3 text-right whitespace-nowrap"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => setSelectedProductForDetail(prod)}
                                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                title={t('productMaster.actions.viewDetail')}
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setEditingProduct(prod);
                                  setIsFormModalOpen(true);
                                }}
                                className="p-1 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded transition-colors"
                                title={t('productMaster.actions.edit')}
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (window.confirm(`Xác nhận xóa sản phẩm ${prod.productName || prod.name}?`)) {
                                    onDeleteProduct(prod.id);
                                  }
                                }}
                                className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                                title={t('productMaster.actions.delete')}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* MOBILE COMPACT LIST VIEW */}
          <div className="md:hidden space-y-2.5">
            {filteredProducts.length === 0 ? (
              <div className="bg-white p-6 rounded-xl border border-slate-200 text-center text-slate-400 text-xs">
                {t('productMaster.table.empty')}
              </div>
            ) : (
              filteredProducts.map((prod) => {
                const prodStatus = (prod.status || 'ACTIVE').toUpperCase();
                return (
                  <div
                    key={prod.id}
                    onClick={() => setSelectedProductForDetail(prod)}
                    className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 active:bg-slate-50 transition-colors cursor-pointer shadow-2xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="font-mono text-xs font-semibold text-slate-500">
                          {prod.productCode || prod.code}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug mt-0.5">
                          {prod.productName || prod.name}
                        </h3>
                      </div>
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded border ${
                          prodStatus === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {t(`productMaster.productStatuses.${prodStatus}`, prodStatus)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
                      <span>{prod.brand || 'Vietcoco'} • {prod.unit || 'Hộp'}</span>
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        {formatCurrency(prod.sellingPrice || 0)}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 2: SKU & BARCODE */}
      {activeTab === 'skus' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-semibold text-slate-600 uppercase tracking-wider">
                <tr>
                  <th className="py-3 px-3 text-center w-10">{t('productMaster.table.stt')}</th>
                  <th className="py-3 px-3.5 font-mono">{t('productMaster.table.sku')}</th>
                  <th className="py-3 px-4">{t('productMaster.table.productName')}</th>
                  <th className="py-3 px-3.5 font-mono">{t('productMaster.table.barcode')}</th>
                  <th className="py-3 px-3 text-center">{t('productMaster.table.packSize')}</th>
                  <th className="py-3 px-3 text-center">{t('productMaster.table.unit')}</th>
                  <th className="py-3 px-3 text-right">{t('productMaster.table.costPrice')}</th>
                  <th className="py-3 px-3.5 text-right font-bold">{t('productMaster.table.sellingPrice')}</th>
                  <th className="py-3 px-3 text-center">{t('productMaster.table.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {products.map((p, idx) => {
                  const skuCode = p.variantSku || p.sku || `${p.productCode || p.code || 'SKU'}-01`;
                  const barcode = `8936${Math.floor(10000000 + idx * 832)}`;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">{idx + 1}</td>
                      <td className="py-3 px-3.5 font-mono font-bold text-slate-900">{skuCode}</td>
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {p.productName || p.name}{' '}
                        {p.variantName && (
                          <span className="text-slate-500 font-normal text-[11px]">({p.variantName})</span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 font-mono text-slate-600">{barcode}</td>
                      <td className="py-3 px-3 text-center text-slate-700">{p.packSize || '1'}</td>
                      <td className="py-3 px-3 text-center text-slate-600">{p.unit || 'Hộp'}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">
                        {formatCurrency(p.costPrice || 0)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-mono font-bold text-slate-900">
                        {formatCurrency(p.sellingPrice || 0)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium px-2 py-0.5 rounded">
                          {t('productMaster.productStatuses.ACTIVE')}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: DANH MỤC & THƯƠNG HIỆU */}
      {activeTab === 'categories_brands' && <CategoriesBrandsView tenantId={tenantId} />}

      {/* TAB 4: BẢNG GIÁ */}
      {activeTab === 'pricing' && <PriceListsView products={products} tenantId={tenantId} />}

      {/* TAB 5: KÊNH BÁN */}
      {activeTab === 'channels' && <SalesChannelsView products={products} tenantId={tenantId} />}

      {/* TAB 6: COMBO & BOM */}
      {activeTab === 'combos' && (
        <CombosView
          products={products}
          tenantId={tenantId}
          onCreateCombo={() => {
            setEditingProduct(null);
            setIsFormModalOpen(true);
          }}
        />
      )}

      {/* PRODUCT DETAIL DRAWER */}
      <ProductDetailDrawer
        isOpen={!!selectedProductForDetail}
        onClose={() => setSelectedProductForDetail(null)}
        product={selectedProductForDetail}
        tenantId={tenantId}
        inventoryLots={inventoryLots}
        stockTransactions={stockTransactions}
        orders={orders}
        purchaseOrders={purchaseOrders}
        onOpenCreatePO={onOpenCreatePO}
        onEditProduct={(prod) => {
          setEditingProduct(prod);
          setIsFormModalOpen(true);
        }}
      />

      {/* PRODUCT FORM MODAL */}
      <ProductFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setEditingProduct(null);
        }}
        tenantId={tenantId}
        productToEdit={editingProduct}
        onSave={(data) => {
          if (editingProduct) {
            onUpdateProduct({ ...editingProduct, ...data } as Product);
          } else {
            onAddProduct(data as Product);
          }
        }}
      />

      {/* EXCEL IMPORT / EXPORT MODAL */}
      <ExcelImportExportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        tenantId={tenantId}
        products={products}
        onImportProducts={(imported) => {
          imported.forEach((p) => onAddProduct(p));
        }}
      />
    </div>
  );
};
