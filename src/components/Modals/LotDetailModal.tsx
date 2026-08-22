import React from 'react';
import { X, Layers, Clock, AlertTriangle, CheckCircle, Truck, Calendar } from 'lucide-react';
import { InventoryLot, Product } from '../../types';

interface LotDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  lots: InventoryLot[];
  onOpenCreatePO?: (productName?: string) => void;
}

export const LotDetailModal: React.FC<LotDetailModalProps> = ({
  isOpen,
  onClose,
  product,
  lots,
  onOpenCreatePO
}) => {
  if (!isOpen || !product) return null;

  const productLots = lots.filter((l) => l.sku === product.sku);
  const activeLots = productLots.filter((l) => l.remainingQuantity > 0);
  const depletedLots = productLots.filter((l) => l.remainingQuantity === 0);

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  // Helper to check aged stock (> 30 days)
  const isAgedLot = (intakeDate: string) => {
    const intake = new Date(intakeDate);
    const now = new Date('2026-08-14'); // Current app simulation date
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

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900">{product.name}</h2>
                <span className="font-mono text-xs font-bold bg-blue-50 text-blue-700 px-2 py-0.5 rounded border border-blue-200">
                  {product.sku}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Product ID: {product.productId} | Mã SP: {product.code} | Đơn vị: {product.unit} | Tồn tổng: {product.stock} {product.unit}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Summary KPIs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Tổng số Lô hàng</span>
              <p className="text-base font-extrabold text-slate-900 mt-0.5">
                {productLots.length} Lô ({activeLots.length} Lô còn tồn)
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Giá vốn FIFO kế tiếp</span>
              <p className="text-base font-extrabold text-blue-700 mt-0.5">
                {activeLots.length > 0 ? formatVND(activeLots[0].costPrice) : 'Hết hàng'}
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Giá bán niêm yết</span>
              <p className="text-base font-extrabold text-emerald-700 mt-0.5">
                {formatVND(product.sellingPrice)}
              </p>
            </div>
          </div>

          {/* FIFO Explanation Banner */}
          <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 text-blue-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600 shrink-0" />
              <span>
                Thứ tự xuất hàng: Hệ thống tự động ưu tiên xuất từ lô có ngày nhập sớm nhất còn tồn (Hàng nhập trước - Xuất trước).
              </span>
            </div>
          </div>

          {/* Lots Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 uppercase border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">MÃ LÔ (LOT ID)</th>
                  <th className="py-2.5 px-3">NGÀY NHẬP</th>
                  <th className="py-2.5 px-3">HẠN DÙNG</th>
                  <th className="py-2.5 px-3 text-right">SL BAN ĐẦU</th>
                  <th className="py-2.5 px-3 text-right">TỒN HIỆN TẠI</th>
                  <th className="py-2.5 px-3 text-right">ĐƠN GIÁ VỐN LÔ</th>
                  <th className="py-2.5 px-3 text-center">TRẠNG THÁI</th>
                  <th className="py-2.5 px-3">NHÀ CUNG CẤP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {productLots.map((lot, idx) => {
                  const isNextFifo = activeLots[0]?.id === lot.id;
                  const aged = isAgedLot(lot.intakeDate);
                  const expiring = isExpiringSoon(lot.expiryDate);

                  return (
                    <tr
                      key={lot.id}
                      className={`hover:bg-slate-50/70 transition-colors ${
                        isNextFifo ? 'bg-blue-50/30 font-semibold' : ''
                      } ${lot.remainingQuantity === 0 ? 'opacity-60 bg-slate-50/40' : ''}`}
                    >
                      <td className="py-3 px-3 font-mono font-bold text-slate-900">
                        {lot.lotId}
                        {isNextFifo && (
                          <span className="block text-[10px] text-blue-600 font-extrabold">
                            ★ Đang xuất FIFO
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600">{lot.intakeDate}</td>
                      <td className="py-3 px-3 text-slate-600">
                        {lot.expiryDate ? (
                          <span className={expiring ? 'text-rose-600 font-bold' : ''}>
                            {lot.expiryDate} {expiring && '⚠'}
                          </span>
                        ) : (
                          '--'
                        )}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-500">
                        {lot.initialQuantity.toLocaleString('vi-VN')} {product.unit}
                      </td>
                      <td className="py-3 px-3 text-right font-extrabold text-slate-900">
                        <span
                          className={
                            lot.remainingQuantity > 0 ? 'text-emerald-700' : 'text-slate-400'
                          }
                        >
                          {lot.remainingQuantity.toLocaleString('vi-VN')} {product.unit}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-slate-800">
                        {formatVND(lot.costPrice)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        {lot.remainingQuantity === 0 ? (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Đã xuất hết
                          </span>
                        ) : isNextFifo ? (
                          <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Ưu tiên 1
                          </span>
                        ) : aged ? (
                          <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Tồn &gt;30 ngày
                          </span>
                        ) : (
                          <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                            Khả dụng
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 truncate max-w-[140px]">
                        {lot.supplierName}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => {
              if (onOpenCreatePO) onOpenCreatePO(product.name);
              onClose();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-xs"
          >
            <Truck className="w-3.5 h-3.5" />
            <span>+ Lập phiếu nhập thêm cho SKU này</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
