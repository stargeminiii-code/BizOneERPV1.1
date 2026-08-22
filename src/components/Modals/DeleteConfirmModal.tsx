import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Layers, Package, ShieldAlert, CheckCircle2 } from 'lucide-react';
import { Product, InventoryLayer } from '../../types';

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  inventoryLots?: InventoryLayer[];
  onConfirmDelete: (productId: string, cleanUpEmptyLots?: boolean) => void;
}

export const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  product,
  inventoryLots = [],
  onConfirmDelete
}) => {
  const [cleanUpEmptyLots, setCleanUpEmptyLots] = useState(true);

  if (!isOpen || !product) return null;

  const linkedLots = inventoryLots.filter(
    (l) => l.sku === product.sku || l.sku === product.variantSku || l.productId === product.productId || l.productId === product.id
  );
  const activeLots = linkedLots.filter((l) => (l.quantityRemaining || l.remainingQuantity || 0) > 0);
  const totalRemaining = activeLots.reduce(
    (sum, l) => sum + (l.quantityRemaining || l.remainingQuantity || 0),
    0
  );

  const handleConfirm = () => {
    onConfirmDelete(product.id, cleanUpEmptyLots);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="bg-rose-50 border-b border-rose-100 p-5 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-rose-600">
                Xác Nhận Xóa Dữ Liệu
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">
                Xóa Sản Phẩm Khỏi Danh Mục
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-200/60 hover:bg-slate-300/80 text-slate-700 flex items-center justify-center text-sm font-bold transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {/* Target Product Summary Box */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-0.5 rounded">
                ID: {product.productId || product.id}
              </span>
              <span className="font-bold text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                {product.brand || 'Vietcoco'}
              </span>
            </div>

            <div>
              <div className="font-black text-sm text-slate-900">
                {product.productName || product.name}
              </div>
              <div className="flex items-center gap-2 mt-1 text-slate-500 font-mono text-[11px]">
                <span>SKU: <strong className="text-purple-700">{product.variantSku || product.sku}</strong></span>
                <span>•</span>
                <span>Mã cha: <strong>{product.productCode || product.code}</strong></span>
                {product.packSize && (
                  <>
                    <span>•</span>
                    <span>Quy cách: <strong>{product.packSize} {product.unit}</strong></span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Warning if stock exists */}
          {totalRemaining > 0 ? (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-black text-amber-900 text-xs">
                  Cảnh báo: Sản phẩm đang có {totalRemaining.toLocaleString('vi-VN')} {product.unit} tồn kho!
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Sản phẩm này hiện đang tồn tại trong <strong className="font-bold">{activeLots.length} lô hàng FIFO</strong>. Nếu bạn xóa sản phẩm, các lô hàng này sẽ không còn liên kết với mã danh mục hiện tại.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 flex items-center gap-2.5 text-slate-600">
              <Package className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Sản phẩm này hiện không có tồn kho khả dụng (tồn kho = 0).</span>
            </div>
          )}

          {/* Additional Options */}
          <div className="pt-2 border-t border-slate-100 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer text-slate-700 font-medium">
              <input
                type="checkbox"
                checked={cleanUpEmptyLots}
                onChange={(e) => setCleanUpEmptyLots(e.target.checked)}
                className="w-4 h-4 text-rose-600 rounded border-slate-300 focus:ring-rose-500"
              />
              <span>Tự động dọn dẹp các lớp FIFO đã xuất hết (tồn = 0) của sản phẩm này</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 cursor-pointer transition"
          >
            Hủy Bỏ
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md shadow-rose-600/20 cursor-pointer transition"
          >
            <Trash2 className="w-4 h-4" />
            <span>Xác Nhận Xóa Sản Phẩm</span>
          </button>
        </div>
      </div>
    </div>
  );
};
