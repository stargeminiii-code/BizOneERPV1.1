import React, { useState } from 'react';
import {
  X,
  Package,
  Layers,
  Plus,
  Boxes,
  DollarSign,
  Tag,
  Warehouse as WarehouseIcon,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { Product, ProductVariant, Warehouse, Branch } from '../../types';

interface QuickAddProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaveProduct: (
    product: Product,
    openingStock?: {
      quantity: number;
      costPrice: number;
      warehouseId: string;
      branchId: string;
    }
  ) => void;
  onSelectForOrder?: (product: Product, quantity: number, unitPrice: number) => void;
  existingProducts?: Product[];
  warehouses?: Warehouse[];
  branches?: Branch[];
}

export const QuickAddProductModal: React.FC<QuickAddProductModalProps> = ({
  isOpen,
  onClose,
  onSaveProduct,
  onSelectForOrder,
  existingProducts = [],
  warehouses = [],
  branches = []
}) => {
  const [productCode, setProductCode] = useState('');
  const [productName, setProductName] = useState('');
  const [variantName, setVariantName] = useState('Tiêu chuẩn');
  const [variantSku, setVariantSku] = useState('');
  const [packSize, setPackSize] = useState('1');
  const [unit, setUnit] = useState('Hộp');
  const [category, setCategory] = useState('Đồ uống');
  const [brand, setBrand] = useState('Vietcoco');
  const [sellingPrice, setSellingPrice] = useState<number>(35000);
  const [costPrice, setCostPrice] = useState<number>(25000);
  const [openingStockQty, setOpeningStockQty] = useState<number>(100);
  const [orderAddQty, setOrderAddQty] = useState<number>(10);
  const [warehouseId, setWarehouseId] = useState(warehouses[0]?.id || 'WH01');
  const [branchId, setBranchId] = useState(branches[0]?.id || 'BR01');

  if (!isOpen) return null;

  // Auto-generate SKUs as name or code changes
  const handleNameChange = (val: string) => {
    setProductName(val);
    if (!productCode) {
      // Auto generate simplified code
      const clean = val
        .toUpperCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^A-Z0-9]/g, '')
        .slice(0, 8);
      const generatedCode = clean ? `SP-${clean}` : `SP-${Date.now().toString().slice(-4)}`;
      setProductCode(generatedCode);
      setVariantSku(`${generatedCode}-01`);
    }
  };

  const handleCodeChange = (val: string) => {
    const clean = val.toUpperCase().replace(/\s+/g, '-');
    setProductCode(clean);
    setVariantSku(`${clean}-01`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productName.trim()) {
      alert('Vui lòng nhập Tên sản phẩm!');
      return;
    }

    const finalCode = productCode.trim() || `SP-${Date.now().toString().slice(-6)}`;
    const finalSku = variantSku.trim() || `${finalCode}-01`;
    const nextProdId = `P${String(existingProducts.length + 1).padStart(6, '0')}`;

    const newVariant: ProductVariant = {
      id: `var-${Date.now()}`,
      variantName: variantName.trim() || 'Tiêu chuẩn',
      sku: finalSku,
      variantSku: finalSku,
      packSize: packSize.trim() || '1',
      unit: unit.trim() || 'Hộp',
      sellingPrice: Math.max(0, sellingPrice),
      costPrice: Math.max(0, costPrice),
      stock: openingStockQty
    };

    const newProduct: Product = {
      id: `p-${Date.now()}`,
      productId: nextProdId,
      code: finalCode,
      productCode: finalCode,
      sku: finalSku,
      variantSku: finalSku,
      name: productName.trim(),
      productName: productName.trim(),
      variant: variantName.trim() || 'Tiêu chuẩn',
      variantName: variantName.trim() || 'Tiêu chuẩn',
      category: category.trim() || 'Đồ uống',
      brand: brand.trim() || 'Vietcoco',
      unit: unit.trim() || 'Hộp',
      packSize: packSize.trim() || '1',
      costPrice: Math.max(0, costPrice),
      sellingPrice: Math.max(0, sellingPrice),
      stock: openingStockQty,
      minStock: 10,
      location: 'Khu A - Kệ 01',
      supplierName: brand ? `Thương hiệu ${brand}` : 'Vietcoco',
      variants: [newVariant]
    };

    // Save product and opening FIFO layer if quantity > 0
    onSaveProduct(
      newProduct,
      openingStockQty > 0
        ? {
            quantity: openingStockQty,
            costPrice: Math.max(0, costPrice),
            warehouseId,
            branchId
          }
        : undefined
    );

    // If callback for order item exists, also insert it directly into the order!
    if (onSelectForOrder) {
      onSelectForOrder(newProduct, Math.max(1, orderAddQty), Math.max(0, sellingPrice));
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-60 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-xl w-full overflow-hidden shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center">
              <Package className="w-4 h-4 text-white" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold flex items-center gap-2">
                <span>Thêm Mặt Hàng / SKU Mới Nhanh</span>
                <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">Khởi tạo Lô FIFO</span>
              </h3>
              <p className="text-[11px] text-emerald-100">
                Tạo mã cha, SKU biến thể, quy cách đóng gói và tự động thêm vào Đơn Hàng
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[82vh] overflow-y-auto">
          {/* Product Name */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Tên Mặt Hàng / Tên Sản Phẩm (Product Name) <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={productName}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Ví dụ: Sữa dừa UHT Vietcoco 330ml Organic..."
              required
              className="w-full font-bold border border-slate-300 rounded-xl px-3 py-2 bg-white text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Product Code & Variant SKU */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mã Sản Phẩm Cha (Product Code) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={productCode}
                onChange={(e) => handleCodeChange(e.target.value)}
                placeholder="VCCCM330-UHT"
                required
                className="w-full font-mono font-bold border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-blue-700 focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mã SKU Biến Thể (Variant SKU) <span className="text-[10px] font-normal text-slate-400">(Tự sinh nếu để trống)</span>
              </label>
              <input
                type="text"
                value={variantSku}
                onChange={(e) => setVariantSku(e.target.value.toUpperCase().replace(/\s+/g, '-'))}
                placeholder="VCCCM330-UHT-C06"
                className="w-full font-mono font-bold border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-purple-700 focus:outline-none"
              />
            </div>
          </div>

          {/* Variant Name & Pack Size */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tên Biến Thể / Combo (Variant Name)
              </label>
              <input
                type="text"
                value={variantName}
                onChange={(e) => setVariantName(e.target.value)}
                placeholder="Thùng 24 Hộp, Combo 6..."
                className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Quy cách (Pack Size)
              </label>
              <input
                type="text"
                value={packSize}
                onChange={(e) => setPackSize(e.target.value)}
                placeholder="24, 12, 6, 1..."
                className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 font-semibold focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Đơn vị tính (Unit)</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 font-bold focus:outline-none"
              >
                {['Hộp', 'Chai', 'Thùng', 'Lon', 'Gói', 'kg', 'tấn', 'cây', 'tấm', 'cuộn', 'm', 'cái'].map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category & Brand */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Ngành hàng / Phân loại</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 font-bold focus:outline-none"
              >
                {['Đồ uống', 'Thực phẩm', 'Thép & Kim loại', 'Tôn & Xà gồ', 'Vật tư phụ kiện', 'Sơn & Hóa chất', 'Khác'].map(
                  (c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Thương hiệu / Hãng SX</label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Vietcoco, Hòa Phát, Hoa Sen..."
                className="w-full border border-slate-300 rounded-xl px-2.5 py-1.5 bg-white text-slate-800 font-bold focus:outline-none"
              />
            </div>
          </div>

          {/* Prices & Initial Stock */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-slate-800 text-[11px] uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                <span>Giá bán, Giá vốn & Khởi tạo Tồn kho Lô FIFO</span>
              </label>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100/70 px-2 py-0.5 rounded-md">
                Tự tạo Lô LOT-OPEN
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Giá bán niêm yết (VNĐ/{unit}) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full font-mono font-bold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Giá vốn nhập kho (VNĐ/{unit})
                </label>
                <input
                  type="number"
                  min="0"
                  step="1000"
                  value={costPrice}
                  onChange={(e) => setCostPrice(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full font-mono font-bold text-slate-900 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-slate-200/80">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Số lượng nhập tồn kho ban đầu ({unit})
                </label>
                <input
                  type="number"
                  min="0"
                  value={openingStockQty}
                  onChange={(e) => setOpeningStockQty(Math.max(0, parseInt(e.target.value) || 0))}
                  className="w-full font-mono font-bold text-emerald-700 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-0.5">
                  Số lượng đưa vào Đơn Bán ({unit})
                </label>
                <input
                  type="number"
                  min="1"
                  value={orderAddQty}
                  onChange={(e) => setOrderAddQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full font-mono font-bold text-blue-700 border border-slate-300 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-md shadow-emerald-500/20 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Tạo & Đưa Vào Đơn Hàng Ngay</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
