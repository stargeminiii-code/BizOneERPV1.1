import React, { useState, useEffect, useMemo } from 'react';
import { X, SlidersHorizontal, CheckCircle2, AlertCircle, Tag } from 'lucide-react';
import { InventoryLot, Product, StockTransaction } from '../../types';
import { SearchableCreatableSelect } from '../SearchableCreatableSelect';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  products: Product[];
  inventoryLots: InventoryLot[];
  onPerformAdjustment: (adjustment: {
    sku: string;
    productName: string;
    lotId?: string;
    brand?: string;
    type: 'Điều chỉnh tăng' | 'Điều chỉnh giảm';
    quantity: number;
    unitCost: number;
    reason: string;
    actor: string;
  }) => void;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  products,
  inventoryLots,
  onPerformAdjustment
}) => {
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id || '');
  const [brand, setBrand] = useState(products[0]?.brand || 'Vietcoco');
  const [adjustmentType, setAdjustmentType] = useState<'Điều chỉnh tăng' | 'Điều chỉnh giảm'>('Điều chỉnh tăng');
  const [selectedLotId, setSelectedLotId] = useState('');
  const [quantity, setQuantity] = useState(10);
  const [unitCost, setUnitCost] = useState(products[0]?.costPrice || 15000);
  const [reason, setReason] = useState('Kiểm kê kho định kỳ - bù lệch');
  const [actor, setActor] = useState('Nguyễn Văn An (Quản lý kho)');

  const selectedProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const productLots = inventoryLots.filter((lot) => lot.sku === selectedProduct?.sku && lot.remainingQuantity > 0);

  // Sync product info when selectedProductId changes
  useEffect(() => {
    if (selectedProduct) {
      setBrand(selectedProduct.brand || 'Vietcoco');
      setUnitCost(selectedProduct.costPrice || 0);
      const lots = inventoryLots.filter((l) => l.sku === selectedProduct.sku && l.remainingQuantity > 0);
      setSelectedLotId(lots[0]?.lotId || '');
    }
  }, [selectedProductId]);

  // Unique brands collection for combobox
  const brandOptions = useMemo(() => {
    const list = new Set(['Vietcoco', 'Hòa Phát', 'Hoa Sen', 'Pomina', 'Vinamilk', 'MediPlus', 'Kim Tín', 'Posco', 'Hà Tiên', 'Đông Á']);
    products.forEach((p) => {
      if (p.brand && p.brand.trim()) list.add(p.brand.trim());
    });
    return Array.from(list);
  }, [products]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    if (quantity <= 0) {
      alert('Vui lòng nhập số lượng điều chỉnh lớn hơn 0');
      return;
    }

    if (adjustmentType === 'Điều chỉnh giảm' && selectedLotId) {
      const targetLot = inventoryLots.find((l) => l.lotId === selectedLotId);
      if (targetLot && quantity > targetLot.remainingQuantity) {
        alert(`Số lượng giảm (${quantity}) vượt quá tồn của Lô ${selectedLotId} (${targetLot.remainingQuantity})!`);
        return;
      }
    }

    onPerformAdjustment({
      sku: selectedProduct.sku,
      productName: selectedProduct.name,
      lotId: selectedLotId || undefined,
      brand: brand.trim() || selectedProduct.brand,
      type: adjustmentType,
      quantity,
      unitCost: unitCost || selectedProduct.costPrice,
      reason,
      actor
    });

    onClose();
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-bold shadow-xs">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900">Phiếu Điều Chỉnh Kho (Kiểm Kê)</h2>
              <p className="text-xs text-slate-500">Cập nhật sai lệch tồn thực tế & ghi nhận Thẻ kho</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4 text-xs">
          {/* Adjustment Type */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Loại điều chỉnh
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('Điều chỉnh tăng')}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all text-xs flex items-center justify-center gap-1.5 ${
                  adjustmentType === 'Điều chỉnh tăng'
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-400 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>➕ Điều chỉnh Tăng (Thừa)</span>
              </button>
              <button
                type="button"
                onClick={() => setAdjustmentType('Điều chỉnh giảm')}
                className={`py-2.5 px-3 rounded-xl font-bold border transition-all text-xs flex items-center justify-center gap-1.5 ${
                  adjustmentType === 'Điều chỉnh giảm'
                    ? 'bg-rose-50 text-rose-800 border-rose-400 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>➖ Điều chỉnh Giảm (Thiếu/Hao hụt)</span>
              </button>
            </div>
          </div>

          {/* Product Selection & Brand Modification */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Chọn SKU / Sản phẩm
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => {
                  const pid = e.target.value;
                  setSelectedProductId(pid);
                  const prod = products.find((p) => p.id === pid);
                  if (prod) {
                    setBrand(prod.brand || 'Vietcoco');
                    setUnitCost(prod.costPrice);
                    const lots = inventoryLots.filter((l) => l.sku === prod.sku && l.remainingQuantity > 0);
                    setSelectedLotId(lots[0]?.lotId || '');
                  }
                }}
                className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
              >
                {products.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.sku}] {p.name} - Tồn: {p.stock} {p.unit}
                  </option>
                ))}
              </select>
            </div>

            {/* Brand / Thương hiệu (Searchable + Quick Creatable) */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Tag className="w-3 h-3 text-purple-600" />
                <span>Thương hiệu (Brand)</span>
              </label>
              <SearchableCreatableSelect
                options={brandOptions}
                value={brand}
                onChange={(newBrand) => setBrand(newBrand)}
                placeholder="Chọn hoặc nhập thương hiệu..."
                quickAddLabel="Tạo thương hiệu mới"
              />
            </div>
          </div>

          {/* Lot Selection */}
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Lô hàng áp dụng
            </label>
            <select
              value={selectedLotId}
              onChange={(e) => {
                const lid = e.target.value;
                setSelectedLotId(lid);
                const targetLot = inventoryLots.find((l) => l.lotId === lid);
                if (targetLot) setUnitCost(targetLot.costPrice);
              }}
              className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800 focus:ring-2 focus:ring-purple-500 focus:outline-none"
            >
              <option value="">
                {adjustmentType === 'Điều chỉnh tăng'
                  ? '-- Tự động tạo lô điều chỉnh mới --'
                  : '-- Tự động trừ lô FIFO sớm nhất --'}
              </option>
              {productLots.map((lot) => (
                <option key={lot.id} value={lot.lotId}>
                  {lot.lotId} (Còn: {lot.remainingQuantity} {selectedProduct?.unit} - Giá vốn: {formatVND(lot.costPrice)} - Nhập: {lot.intakeDate})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Số lượng điều chỉnh ({selectedProduct?.unit})
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Đơn giá vốn ghi nhận (đ/{selectedProduct?.unit})
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={unitCost}
                onChange={(e) => setUnitCost(Math.max(0, parseInt(e.target.value) || 0))}
                className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 bg-white text-slate-900"
              />
            </div>
          </div>

          {/* Reason & Actor */}
          <div className="space-y-2.5">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Lý do điều chỉnh
              </label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800"
              >
                <option value="Kiểm kê kho định kỳ - bù thừa tồn">Kiểm kê kho định kỳ - bù thừa tồn</option>
                <option value="Kiểm kê kho định kỳ - xử lý hao hụt thiếu">Kiểm kê kho định kỳ - xử lý hao hụt thiếu</option>
                <option value="Hàng hóa bị ẩm mốc / móp méo loại thải">Hàng hóa bị ẩm mốc / móp méo loại thải</option>
                <option value="Khách trả hàng bảo hành nhập lại kho">Khách trả hàng bảo hành nhập lại kho</option>
                <option value="Điều chuyển nội bộ giữa các phân xưởng">Điều chuyển nội bộ giữa các phân xưởng</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Người thực hiện
              </label>
              <input
                type="text"
                value={actor}
                onChange={(e) => setActor(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 bg-white text-slate-800"
              />
            </div>
          </div>

          {/* Total Value Preview */}
          <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex justify-between items-center">
            <span className="font-semibold text-slate-600">Tổng giá trị điều chỉnh:</span>
            <span className="font-extrabold text-sm text-purple-700">
              {formatVND(quantity * unitCost)}
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-bold text-slate-600 hover:bg-slate-100 rounded-xl text-xs"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md shadow-purple-600/20 flex items-center gap-1.5 text-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Ghi nhận Thẻ kho & Cập nhật tồn</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
