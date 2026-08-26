import React, { useState, useMemo } from 'react';
import {
  X,
  Plus,
  Layers,
  Tag,
  DollarSign,
  Share2,
  Boxes,
  Clock,
  Building2,
  FileSpreadsheet
} from 'lucide-react';
import {
  Product,
  ProductAggregate,
  InventoryLayer,
  StockTransaction,
  Order,
  PurchaseOrder
} from '../../types';
import { ProductMasterRepository } from '../../repositories/productMasterRepository';
import { useLanguage } from '../../i18n';

interface ProductDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  productAggregate?: ProductAggregate | null;
  inventoryLots?: InventoryLayer[];
  stockTransactions?: StockTransaction[];
  orders?: Order[];
  purchaseOrders?: PurchaseOrder[];
  tenantId?: string;
  onOpenCreatePO?: (skuName?: string) => void;
  onEditProduct?: (product: Product) => void;
}

type DrawerTab = 'overview' | 'skus' | 'pricing' | 'channels' | 'combos' | 'inventory' | 'audit';

export const ProductDetailDrawer: React.FC<ProductDetailDrawerProps> = ({
  isOpen,
  onClose,
  product,
  productAggregate,
  inventoryLots = [],
  stockTransactions = [],
  orders = [],
  purchaseOrders = [],
  tenantId = 'tenant-001',
  onOpenCreatePO,
  onEditProduct
}) => {
  const { t, formatCurrency } = useLanguage();
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview');

  // Load related records from ProductMasterRepository if available
  const aggregateData = useMemo(() => {
    if (!product) return null;
    ProductMasterRepository.initialize();
    return ProductMasterRepository.getProductAggregate(tenantId, product.id || product.productId || '') || productAggregate;
  }, [product, productAggregate, tenantId]);

  if (!isOpen || !product) return null;

  const productCode = product.productCode || product.code || 'SP-000';
  const productId = product.productId || product.id || '';
  const productName = product.productName || product.name || '';
  const brand = product.brand || 'Vietcoco';
  const category = product.category || 'Mặc định';
  const status = (product.status || 'ACTIVE').toUpperCase();
  const productType = product.productType || 'FINISHED_GOOD';
  const baseUnit = product.unit || 'Hộp';

  // Matched FIFO lots
  const matchedLots = inventoryLots.filter(
    (l) =>
      (l.productId && l.productId === productId) ||
      (l.productCode && l.productCode.toUpperCase() === productCode.toUpperCase()) ||
      (l.sku && (product.variantSku || product.sku) && l.sku.toUpperCase() === (product.variantSku || product.sku || '').toUpperCase())
  );
  const totalRemainingStock = matchedLots.reduce((sum, l) => sum + (l.quantityRemaining || 0), 0) || product.stock || 0;

  // Price List items from repo
  const priceLists = ProductMasterRepository.findPriceLists(tenantId);
  const priceListItems = aggregateData?.priceListItems || [];
  const channelMappings = aggregateData?.channelMappings || [];
  const comboComponents = aggregateData?.comboComponents || [];
  const skus = aggregateData?.skus || [];

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/40 transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-2xl bg-white border-l border-slate-200 shadow-xl flex flex-col">
          {/* Drawer Header */}
          <div className="px-6 py-4 border-b border-slate-200 bg-white flex items-start justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-semibold text-slate-500">{productCode}</span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                    status === 'ACTIVE'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {t(`productMaster.productStatuses.${status}`, status)}
                </span>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {t(`productMaster.productTypes.${productType}`, productType)}
                </span>
              </div>
              <h2 className="text-base font-bold text-slate-900">{productName}</h2>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span>{t('productMaster.table.brand')}: <strong className="text-slate-800">{brand}</strong></span>
                <span>•</span>
                <span>{t('productMaster.table.category')}: <strong className="text-slate-800">{category}</strong></span>
                <span>•</span>
                <span>{t('productMaster.table.unit')}: <strong className="text-slate-800">{baseUnit}</strong></span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onEditProduct && onEditProduct(product)}
                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors"
              >
                {t('productMaster.drawer.editProduct')}
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-slate-200 px-6 bg-slate-50/50 overflow-x-auto gap-2 py-2">
            {[
              { id: 'overview', label: t('productMaster.drawer.overview') },
              { id: 'skus', label: `${t('productMaster.drawer.skus')} (${skus.length || 1})` },
              { id: 'pricing', label: t('productMaster.drawer.pricing') },
              { id: 'channels', label: t('productMaster.drawer.channels') },
              { id: 'combos', label: t('productMaster.drawer.combos') },
              { id: 'inventory', label: t('productMaster.drawer.inventory') }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as DrawerTab)}
                className={`px-3 py-1.5 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white font-semibold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Drawer Content */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {activeTab === 'overview' && (
              <div className="space-y-5">
                {/* Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] text-slate-500">{t('productMaster.drawer.stockLabel')}</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                      {totalRemainingStock} <span className="text-xs font-normal text-slate-500">{baseUnit}</span>
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] text-slate-500">{t('productMaster.drawer.costPriceLabel')}</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                      {formatCurrency(product.costPrice || 0)}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] text-slate-500">{t('productMaster.drawer.sellingPriceLabel')}</div>
                    <div className="text-base font-bold font-mono text-slate-900 mt-0.5">
                      {formatCurrency(product.sellingPrice || 0)}
                    </div>
                  </div>

                  <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                    <div className="text-[11px] text-slate-500">{t('productMaster.drawer.grossMarginLabel')}</div>
                    <div className="text-base font-bold font-mono text-emerald-700 mt-0.5">
                      {product.sellingPrice
                        ? Math.round(((product.sellingPrice - (product.costPrice || 0)) / product.sellingPrice) * 100)
                        : 0}%
                    </div>
                  </div>
                </div>

                {/* Additional Attributes */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {t('productMaster.form.generalInfo')}
                  </h3>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500">{t('productMaster.table.sku')}:</span>{' '}
                      <span className="font-mono font-bold text-slate-900">{product.variantSku || product.sku || productCode}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{t('productMaster.table.packSize')}:</span>{' '}
                      <span className="font-semibold text-slate-900">{product.packSize || 1} {baseUnit}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{t('productMaster.drawer.locationLabel')}</span>{' '}
                      <span className="font-medium text-slate-900">{product.location || 'Khu A - Kệ 01'}</span>
                    </div>
                    <div>
                      <span className="text-slate-500">{t('productMaster.drawer.shelfLifeLabel')}</span>{' '}
                      <span className="font-medium text-slate-900">{product.shelfLifeDays || 365} {t('productMaster.drawer.days')}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 font-medium">
                      ✓ {t('productMaster.drawer.trackLotBadge')}
                    </span>
                    <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200 font-medium">
                      ✓ {t('productMaster.drawer.trackExpiryBadge')}
                    </span>
                  </div>

                  {product.note && (
                    <div className="pt-2 border-t border-slate-200 text-xs text-slate-600">
                      <strong>{t('productMaster.form.notes')}:</strong> {product.note}
                    </div>
                  )}
                </div>

                {/* Quick PO Button */}
                <div className="flex items-center justify-between p-4 bg-slate-900 text-white rounded-xl">
                  <div>
                    <div className="font-bold text-xs">{t('productMaster.drawer.quickPo')}</div>
                    <div className="text-[11px] text-slate-300">{productName}</div>
                  </div>
                  <button
                    onClick={() => onOpenCreatePO && onOpenCreatePO(productName)}
                    className="px-3 py-1.5 bg-white text-slate-900 font-semibold text-xs rounded-lg hover:bg-slate-100 transition-colors"
                  >
                    + {t('productMaster.drawer.quickPo')}
                  </button>
                </div>
              </div>
            )}

            {activeTab === 'skus' && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">{t('productMaster.table.sku')}</th>
                      <th className="py-2.5 px-3">{t('productMaster.table.packSize')}</th>
                      <th className="py-2.5 px-3 text-right">{t('productMaster.table.costPrice')}</th>
                      <th className="py-2.5 px-3 text-right">{t('productMaster.table.sellingPrice')}</th>
                      <th className="py-2.5 px-3 text-center">{t('productMaster.table.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{product.variantSku || product.sku || productCode}</td>
                      <td className="py-2.5 px-3 font-medium text-slate-800">{product.packSize || 1} {baseUnit}</td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-600">{formatCurrency(product.costPrice || 0)}</td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(product.sellingPrice || 0)}</td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium px-2 py-0.5 rounded">
                          {t('productMaster.productStatuses.ACTIVE')}
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'pricing' && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">{t('productMaster.priceLists.title')}</th>
                      <th className="py-2.5 px-3">{t('productMaster.priceLists.type')}</th>
                      <th className="py-2.5 px-3 text-right">{t('productMaster.priceLists.appliedPrice')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {priceLists.map((pl) => {
                      const factor =
                        pl.type === 'WHOLESALE' ? 0.85 : pl.type === 'B2B' ? 0.8 : pl.type === 'MARKETPLACE' ? 1.05 : 1.0;
                      const priceInList = Math.round((product.sellingPrice || 0) * factor);

                      return (
                        <tr key={pl.priceListId} className="hover:bg-slate-50">
                          <td className="py-2.5 px-3 font-semibold text-slate-900">{pl.name}</td>
                          <td className="py-2.5 px-3 font-mono text-slate-500">{pl.type}</td>
                          <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">{formatCurrency(priceInList)}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'channels' && (
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Kênh bán</th>
                      <th className="py-2.5 px-3">External SKU ID</th>
                      <th className="py-2.5 px-3 text-center">{t('productMaster.channels.syncStatus')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {['Shopee', 'TikTok Shop', 'Lazada', 'POS Retail', 'B2B'].map((ch) => (
                      <tr key={ch} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{ch}</td>
                        <td className="py-2.5 px-3 font-mono text-slate-600">
                          {(product.variantSku || product.sku || productCode)}-{ch.substring(0, 3).toUpperCase()}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-medium px-2 py-0.5 rounded">
                            {t('productMaster.channels.synced')}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {activeTab === 'combos' && (
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                {product.productType === 'COMBO'
                  ? `${t('productMaster.combos.comboSku')}: ${product.variantSku || product.sku || productCode} (x${product.packSize || 2} ${baseUnit})`
                  : t('productMaster.combos.empty')}
              </div>
            )}

            {activeTab === 'inventory' && (
              <div className="space-y-3">
                {matchedLots.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-xl border border-slate-200">
                    {t('productMaster.drawer.noLots')}
                  </div>
                ) : (
                  <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase text-[11px]">
                        <tr>
                          <th className="py-2.5 px-3">Mã Lô FIFO</th>
                          <th className="py-2.5 px-3">Hạn sử dụng (EXP)</th>
                          <th className="py-2.5 px-3 text-right">Tồn khả dụng</th>
                          <th className="py-2.5 px-3 text-right">Giá vốn lô</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {matchedLots.map((lot) => (
                          <tr key={lot.lotId || lot.id} className="hover:bg-slate-50">
                            <td className="py-2.5 px-3 font-mono font-bold text-slate-900">{lot.lotNumber || lot.lotId}</td>
                            <td className="py-2.5 px-3 font-mono text-slate-700">{lot.expiryDate || '—'}</td>
                            <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                              {lot.quantityRemaining} {lot.unit || baseUnit}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                              {formatCurrency(lot.unitCost || 0)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
