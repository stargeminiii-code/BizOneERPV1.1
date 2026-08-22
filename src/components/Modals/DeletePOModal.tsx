import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, FileText, Layers, Building, RefreshCcw } from 'lucide-react';
import { PurchaseOrder, InventoryLayer } from '../../types';

interface DeletePOModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseOrder: PurchaseOrder | null;
  inventoryLots?: InventoryLayer[];
  onConfirmDelete: (poId: string, revertInventoryLots: boolean) => void;
}

export const DeletePOModal: React.FC<DeletePOModalProps> = ({
  isOpen,
  onClose,
  purchaseOrder,
  inventoryLots = [],
  onConfirmDelete
}) => {
  const [revertInventoryLots, setRevertInventoryLots] = useState(true);

  if (!isOpen || !purchaseOrder) return null;

  const linkedLots = inventoryLots.filter(
    (l) => l.receiptCode === purchaseOrder.code || l.receiptCode === purchaseOrder.id
  );

  const totalLotsRemaining = linkedLots.reduce(
    (sum, l) => sum + (l.quantityRemaining || l.remainingQuantity || 0),
    0
  );

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  const handleConfirm = () => {
    onConfirmDelete(purchaseOrder.id, revertInventoryLots);
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
                Xác Nhận Hủy / Xóa Đơn
              </span>
              <h3 className="text-base sm:text-lg font-black text-slate-900 leading-tight mt-0.5">
                Xóa Phiếu Nhập Hàng (PO)
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

        {/* Content */}
        <div className="p-5 space-y-4 text-xs text-slate-700">
          {/* PO Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                Mã PO: {purchaseOrder.code}
              </span>
              <span className="text-[11px] text-slate-500 font-mono">
                Ngày: {purchaseOrder.createdAt}
              </span>
            </div>

            <div>
              <div className="font-black text-sm text-slate-900">
                Nhà cung cấp: {purchaseOrder.supplierName}
              </div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                Kho nhập: {purchaseOrder.warehouse || 'Kho Tổng TP.HCM'}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-[11px]">
              <div>
                <span className="text-slate-400">Tổng giá trị:</span>{' '}
                <strong className="font-mono text-slate-900">{formatVND(purchaseOrder.totalAmount)}</strong>
              </div>
              <div>
                <span className="text-slate-400">Còn nợ:</span>{' '}
                <strong className="font-mono text-rose-600">
                  {formatVND(purchaseOrder.debtAmount || (purchaseOrder.status === 'pending' ? purchaseOrder.totalAmount : 0))}
                </strong>
              </div>
            </div>

            {/* Items preview */}
            <div className="pt-2 border-t border-slate-200 space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400">Mặt hàng trong phiếu ({purchaseOrder.items?.length || 0}):</span>
              <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                {purchaseOrder.items?.map((it, idx) => (
                  <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600 bg-white p-1.5 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-800 truncate max-w-[240px]">{it.productName}</span>
                    <span className="font-mono font-bold text-slate-700">{it.quantity.toLocaleString('vi-VN')} {it.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* FIFO Lots Option */}
          {linkedLots.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3.5 space-y-2">
              <div className="flex items-center gap-2 text-blue-950 font-bold text-xs">
                <Layers className="w-4 h-4 text-blue-600" />
                <span>Tồn kho Lô FIFO liên quan ({linkedLots.length} lô, còn tồn {totalLotsRemaining.toLocaleString('vi-VN')} SP)</span>
              </div>
              <label className="flex items-start gap-2.5 cursor-pointer text-slate-700">
                <input
                  type="checkbox"
                  checked={revertInventoryLots}
                  onChange={(e) => setRevertInventoryLots(e.target.checked)}
                  className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 mt-0.5"
                />
                <span className="text-[11px] leading-relaxed">
                  <strong>Tự động thu hồi / xóa các lô FIFO và giao dịch nhập kho</strong> đã sinh ra từ phiếu PO này để cân bằng lại số lượng tồn kho.
                </span>
              </label>
            </div>
          )}

          <p className="text-slate-500 text-[11px]">
            Hành động này sẽ xóa phiếu nhập hàng khỏi danh sách và tự động điều chỉnh lại số dư công nợ của nhà cung cấp.
          </p>
        </div>

        {/* Footer */}
        <div className="bg-slate-50 border-t border-slate-100 p-4 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-bold text-xs transition cursor-pointer"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs shadow-md shadow-rose-600/20 transition flex items-center gap-1.5 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Xác Nhận Xóa Đơn PO</span>
          </button>
        </div>
      </div>
    </div>
  );
};
