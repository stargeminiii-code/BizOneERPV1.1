import React, { useState, useMemo } from 'react';
import {
  X,
  Search,
  Check,
  Package,
  Boxes,
  Layers,
  Filter,
  Plus,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-react';
import { Product, ProductVariant } from '../../types';
import { FlatProductItem } from '../ProductSearchCombobox';

interface ProductCatalogPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  onSelectProduct: (item: FlatProductItem, quantity: number) => void;
  onOpenQuickAdd?: () => void;
}

export const ProductCatalogPickerModal: React.FC<ProductCatalogPickerModalProps> = ({
  isOpen,
  onClose,
  products,
  onSelectProduct,
  onOpenQuickAdd
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedBrand, setSelectedBrand] = useState<string>('all');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  // Flatten all products & variants
  const flattenedCatalog = useMemo<FlatProductItem[]>(() => {
    const items: FlatProductItem[] = [];

    products.forEach((prod) => {
      const mainSku = prod.sku || prod.variantSku || prod.code || prod.productId;
      items.push({
        id: `prod-${prod.id}`,
        parentProductId: prod.id,
        productId: prod.productId || prod.id,
        productCode: prod.code || prod.productCode || '',
        productName: prod.name || prod.productName || '',
        variantName: prod.variant || prod.variantName || 'Tiêu chuẩn',
        sku: mainSku,
        variantSku: prod.variantSku || prod.sku || mainSku,
        packSize: String(prod.packSize || '1'),
        unit: prod.unit || 'Hộp',
        category: prod.category || 'Đồ uống',
        brand: prod.brand,
        sellingPrice: prod.sellingPrice || 0,
        costPrice: prod.costPrice || 0,
        stock: prod.stock || 0,
        isLowStock: prod.isLowStock
      });

      if (prod.variants && prod.variants.length > 0) {
        prod.variants.forEach((v, vIdx) => {
          const varSku = v.sku || v.variantSku || `${mainSku}-V${vIdx + 1}`;
          if (varSku !== mainSku) {
            items.push({
              id: `var-${prod.id}-${v.id || vIdx}`,
              parentProductId: prod.id,
              productId: prod.productId || prod.id,
              productCode: prod.code || prod.productCode || '',
              productName: prod.name || prod.productName || '',
              variantName: v.variantName || `Quy cách ${v.packSize}`,
              sku: varSku,
              variantSku: v.variantSku || varSku,
              packSize: String(v.packSize || '1'),
              unit: v.unit || prod.unit || 'Hộp',
              category: prod.category || 'Đồ uống',
              brand: prod.brand,
              sellingPrice: v.sellingPrice || prod.sellingPrice,
              costPrice: v.costPrice || prod.costPrice,
              stock: v.stock !== undefined ? v.stock : prod.stock,
              isLowStock: v.stock !== undefined ? v.stock <= 10 : prod.isLowStock
            });
          }
        });
      }
    });

    return items;
  }, [products]);

  // Categories and Brands lists for filters
  const categories = useMemo(() => {
    const set = new Set<string>();
    flattenedCatalog.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return Array.from(set);
  }, [flattenedCatalog]);

  const brands = useMemo(() => {
    const set = new Set<string>();
    flattenedCatalog.forEach((p) => {
      if (p.brand) set.add(p.brand);
    });
    return Array.from(set);
  }, [flattenedCatalog]);

  // Filtered Items
  const filteredList = useMemo(() => {
    return flattenedCatalog.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.sku.toLowerCase().includes(q) ||
        item.variantSku.toLowerCase().includes(q) ||
        item.productName.toLowerCase().includes(q) ||
        item.variantName.toLowerCase().includes(q) ||
        item.packSize.toLowerCase().includes(q) ||
        item.productId.toLowerCase().includes(q) ||
        item.productCode.toLowerCase().includes(q);

      const matchCat = selectedCategory === 'all' || item.category === selectedCategory;
      const matchBrand = selectedBrand === 'all' || item.brand === selectedBrand;
      const matchStock = !inStockOnly || item.stock > 0;

      return matchSearch && matchCat && matchBrand && matchStock;
    });
  }, [flattenedCatalog, searchTerm, selectedCategory, selectedBrand, inStockOnly]);

  if (!isOpen) return null;

  const handleSetQty = (id: string, qty: number) => {
    setQuantities((prev) => ({ ...prev, [id]: Math.max(1, qty) }));
  };

  const handlePick = (item: FlatProductItem) => {
    const qty = quantities[item.id] || 1;
    onSelectProduct(item, qty);
    onClose();
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-60 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4.5 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center font-bold">
              <Boxes className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold flex items-center gap-2">
                <span>Bảng Tra Cứu & Chọn Nhanh Mặt Hàng / SKU</span>
                <span className="text-xs bg-blue-500/30 text-blue-300 px-2 py-0.5 rounded-full font-bold">
                  {filteredList.length} SKU
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Tìm kiếm đa trường (SKU, Tên SP, Biến thể, Quy cách, Mã Cha, Product ID) và thêm vào Đơn Hàng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter bar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between text-xs">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Nhập SKU, Variant SKU, Tên SP, Quy cách, Product ID, Code để tìm kiếm..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Tất cả ngành hàng</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-2.5 py-2 font-semibold text-slate-700 focus:outline-none"
            >
              <option value="all">Tất cả thương hiệu</option>
              {brands.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>

            <label className="flex items-center gap-1.5 font-bold text-slate-700 bg-white border border-slate-300 px-3 py-2 rounded-xl cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inStockOnly}
                onChange={(e) => setInStockOnly(e.target.checked)}
                className="rounded text-blue-600 focus:ring-blue-500"
              />
              <span>Còn hàng</span>
            </label>

            {onOpenQuickAdd && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenQuickAdd();
                }}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Thêm nhanh SP</span>
              </button>
            )}
          </div>
        </div>

        {/* Content Table / Grid */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filteredList.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <Package className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="font-bold">Không tìm thấy sản phẩm nào</p>
              <p className="text-xs mt-1">Thử thay đổi từ khóa hoặc bộ lọc danh mục</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredList.map((item) => {
                const currentQty = quantities[item.id] || 1;

                return (
                  <div
                    key={item.id}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                            {item.sku}
                          </span>
                          {item.productCode && item.productCode !== item.sku && (
                            <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                              Mã cha: {item.productCode}
                            </span>
                          )}
                          {item.packSize && (
                            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-50 text-purple-700">
                              QC: {item.packSize}
                            </span>
                          )}
                        </div>

                        {/* Stock badge */}
                        <div>
                          {item.stock > 10 ? (
                            <span className="font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                              Tồn: {item.stock.toLocaleString('vi-VN')} {item.unit}
                            </span>
                          ) : item.stock > 0 ? (
                            <span className="font-bold text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                              Sắp hết ({item.stock})
                            </span>
                          ) : (
                            <span className="font-bold text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                              Hết hàng (0)
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="font-extrabold text-sm text-slate-900">
                        {item.productName}
                        {item.variantName && item.variantName !== 'Tiêu chuẩn' && (
                          <span className="text-blue-700 ml-1.5 font-bold text-xs">({item.variantName})</span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{item.category}</span>
                        {item.brand && <span>• Thương hiệu: {item.brand}</span>}
                        <span>• ID: {item.productId}</span>
                      </div>
                    </div>

                    {/* Bottom action row */}
                    <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between gap-3">
                      <div>
                        <div className="font-extrabold text-sm text-blue-700">
                          {formatVND(item.sellingPrice)}
                          <span className="text-xs font-medium text-slate-500">/{item.unit}</span>
                        </div>
                        {item.costPrice > 0 && (
                          <div className="text-[10px] text-slate-400">
                            Giá vốn FIFO: {formatVND(item.costPrice)}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-slate-500">SL:</span>
                          <input
                            type="number"
                            min="1"
                            value={currentQty}
                            onChange={(e) => handleSetQty(item.id, parseInt(e.target.value) || 1)}
                            className="w-14 text-center font-bold border border-slate-300 rounded-lg p-1 bg-slate-50"
                          />
                        </div>

                        <button
                          type="button"
                          onClick={() => handlePick(item)}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1 shadow-xs cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Chọn</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Hiển thị <strong>{filteredList.length}</strong> trên tổng số {flattenedCatalog.length} mặt hàng & biến thể
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
