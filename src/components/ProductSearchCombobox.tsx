import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Search,
  Check,
  ChevronDown,
  X,
  Plus,
  Boxes,
  Layers,
  Sparkles,
  Tag,
  PackageCheck
} from 'lucide-react';
import { Product, ProductVariant } from '../types';

export interface FlatProductItem {
  id: string; // unique key
  parentProductId: string;
  productId: string; // e.g. P000001
  productCode: string; // e.g. VCCCM330-UHT
  productName: string; // e.g. Sữa dừa UHT Vietcoco 330ml
  variantName: string; // e.g. Combo 6 Hộp
  sku: string; // e.g. VCCCM330-UHT-C06
  variantSku: string; // e.g. VCCCM330-UHT-C06
  packSize: string; // e.g. 6 Hộp
  unit: string; // e.g. Hộp
  category: string;
  brand?: string;
  sellingPrice: number;
  costPrice: number;
  stock: number;
  isLowStock?: boolean;
}

interface ProductSearchComboboxProps {
  products: Product[];
  selectedSkuOrId: string;
  onSelect: (item: FlatProductItem) => void;
  onOpenQuickAddProduct?: () => void;
  placeholder?: string;
  className?: string;
}

export const ProductSearchCombobox: React.FC<ProductSearchComboboxProps> = ({
  products,
  selectedSkuOrId,
  onSelect,
  onOpenQuickAddProduct,
  placeholder = 'Tìm bằng SKU, Tên SP, Tên biến thể, Mã SKU, Quy cách, Product ID, Code...',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Flatten all products and variants into searchable items
  const flattenedCatalog = useMemo<FlatProductItem[]>(() => {
    const items: FlatProductItem[] = [];

    products.forEach((prod) => {
      // Main / Primary product item
      const mainSku = prod.sku || prod.variantSku || prod.code || prod.productId;
      const mainItem: FlatProductItem = {
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
      };
      items.push(mainItem);

      // Sub-variants if any
      if (prod.variants && prod.variants.length > 0) {
        prod.variants.forEach((v, vIdx) => {
          const varSku = v.sku || v.variantSku || `${mainSku}-V${vIdx + 1}`;
          // Avoid duplicate if same as main item
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

  // Current selected item display
  const currentItem = useMemo(() => {
    return flattenedCatalog.find(
      (it) => it.sku === selectedSkuOrId || it.productId === selectedSkuOrId || it.parentProductId === selectedSkuOrId
    );
  }, [flattenedCatalog, selectedSkuOrId]);

  // Multi-field search algorithm:
  // - sku
  // - Product Name
  // - Variant Name
  // - Variant SKU
  // - Pack Size
  // - Product ID
  // - Product Code
  // - Brand & Category
  const filteredItems = useMemo(() => {
    if (!query.trim()) return flattenedCatalog.slice(0, 35);

    const q = query.toLowerCase().trim();
    return flattenedCatalog
      .filter((item) => {
        const matchSku = item.sku.toLowerCase().includes(q);
        const matchVariantSku = item.variantSku.toLowerCase().includes(q);
        const matchProductName = item.productName.toLowerCase().includes(q);
        const matchVariantName = item.variantName.toLowerCase().includes(q);
        const matchPackSize = item.packSize.toLowerCase().includes(q) || `pack ${item.packSize}`.toLowerCase().includes(q);
        const matchProductId = item.productId.toLowerCase().includes(q);
        const matchProductCode = item.productCode.toLowerCase().includes(q);
        const matchBrand = item.brand?.toLowerCase().includes(q) || false;
        const matchCategory = item.category?.toLowerCase().includes(q) || false;

        return (
          matchSku ||
          matchVariantSku ||
          matchProductName ||
          matchVariantName ||
          matchPackSize ||
          matchProductId ||
          matchProductCode ||
          matchBrand ||
          matchCategory
        );
      })
      .slice(0, 40);
  }, [flattenedCatalog, query]);

  // Outside click listener
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev < filteredItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : filteredItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredItems[highlightedIndex]) {
        handleSelectItem(filteredItems[highlightedIndex]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[highlightedIndex] as HTMLElement;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [highlightedIndex]);

  const handleSelectItem = (item: FlatProductItem) => {
    onSelect(item);
    setIsOpen(false);
    setQuery('');
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div ref={wrapperRef} className={`relative w-full text-xs ${className}`}>
      {/* Combobox Trigger / Search Input */}
      <div
        className={`w-full flex items-center bg-white border rounded-xl transition-all shadow-2xs ${
          isOpen ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-slate-300 hover:border-slate-400'
        }`}
      >
        <div className="pl-3 text-slate-400 shrink-0">
          <Search className="w-3.5 h-3.5" />
        </div>

        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : currentItem ? `[${currentItem.sku}] ${currentItem.productName} - ${currentItem.variantName}` : ''}
          onChange={(e) => {
            setQuery(e.target.value);
            setHighlightedIndex(0);
            if (!isOpen) setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setHighlightedIndex(0);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full px-2.5 py-2 text-xs font-semibold text-slate-900 bg-transparent focus:outline-none placeholder-slate-400"
        />

        {isOpen && query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="p-1 mr-1 text-slate-400 hover:text-slate-600 rounded-md cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            setIsOpen((prev) => !prev);
            if (!isOpen) inputRef.current?.focus();
          }}
          className="px-2.5 py-2 text-slate-400 hover:text-slate-600 border-l border-slate-200 cursor-pointer"
        >
          <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Results List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100 max-h-80 flex flex-col">
          {/* Header Info & Quick Actions */}
          <div className="px-3 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between text-[11px]">
            <div className="text-slate-500 font-medium">
              Tìm theo: <span className="font-bold text-slate-700">SKU, Tên SP, Biến thể, Quy cách, ID</span> ({filteredItems.length} kết quả)
            </div>
            {onOpenQuickAddProduct && (
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  onOpenQuickAddProduct();
                }}
                className="text-blue-600 font-bold hover:text-blue-700 flex items-center gap-1 bg-blue-50 px-2 py-0.5 rounded-lg cursor-pointer"
              >
                <Plus className="w-3 h-3" />
                <span>+ Thêm nhanh SP mới</span>
              </button>
            )}
          </div>

          {/* Results List */}
          <div ref={listRef} className="overflow-y-auto flex-1 divide-y divide-slate-100 p-1">
            {filteredItems.length === 0 ? (
              <div className="p-5 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Search className="w-4 h-4" />
                </div>
                <p className="text-xs text-slate-500">
                  Không tìm thấy sản phẩm nào khớp với từ khóa "<strong>{query}</strong>"
                </p>
                {onOpenQuickAddProduct && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false);
                      onOpenQuickAddProduct();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tạo mới sản phẩm này ngay</span>
                  </button>
                )}
              </div>
            ) : (
              filteredItems.map((item, idx) => {
                const isSelected = item.sku === selectedSkuOrId || item.productId === selectedSkuOrId;
                const isHighlighted = idx === highlightedIndex;

                return (
                  <div
                    key={item.id}
                    onMouseEnter={() => setHighlightedIndex(idx)}
                    onClick={() => handleSelectItem(item)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-colors flex items-start justify-between gap-3 ${
                      isHighlighted
                        ? 'bg-blue-50/80 text-slate-900'
                        : isSelected
                        ? 'bg-blue-50/40 text-slate-800'
                        : 'hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    {/* Left: Info & Identifiers */}
                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {/* SKU Badge */}
                        <span className="font-mono font-bold text-[10px] px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                          {item.sku}
                        </span>

                        {/* Product Code if different */}
                        {item.productCode && item.productCode !== item.sku && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700 border border-slate-200">
                            Code: {item.productCode}
                          </span>
                        )}

                        {/* Pack size */}
                        {item.packSize && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-800">
                            Quy cách: {item.packSize}
                          </span>
                        )}

                        {/* Brand */}
                        {item.brand && (
                          <span className="text-[10px] font-semibold text-slate-500">
                            • {item.brand}
                          </span>
                        )}
                      </div>

                      {/* Product Name & Variant */}
                      <div className="font-bold text-xs text-slate-900 flex items-baseline gap-1.5">
                        <span>{item.productName}</span>
                        {item.variantName && item.variantName !== 'Tiêu chuẩn' && (
                          <span className="text-[11px] font-extrabold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                            ({item.variantName})
                          </span>
                        )}
                      </div>

                      {/* Category & Unit */}
                      <div className="text-[10px] text-slate-400 flex items-center gap-2">
                        <span>{item.category}</span>
                        <span>•</span>
                        <span>ĐVT: {item.unit}</span>
                        <span>•</span>
                        <span>ID: {item.productId}</span>
                      </div>
                    </div>

                    {/* Right: Stock & Prices */}
                    <div className="text-right shrink-0 space-y-1">
                      <div className="font-extrabold text-xs text-slate-900">
                        {formatVND(item.sellingPrice)}
                        <span className="text-[10px] font-normal text-slate-500">/{item.unit}</span>
                      </div>

                      {/* Stock Badge */}
                      <div>
                        {item.stock > 10 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            Tồn: {item.stock.toLocaleString('vi-VN')} {item.unit}
                          </span>
                        ) : item.stock > 0 ? (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            Sắp hết ({item.stock} {item.unit})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-bold text-[10px] text-rose-700 bg-rose-50 px-2 py-0.5 rounded-md border border-rose-200">
                            Hết hàng (0)
                          </span>
                        )}
                      </div>

                      {item.costPrice > 0 && (
                        <div className="text-[10px] text-slate-400">
                          Giá vốn ~{formatVND(item.costPrice)}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
