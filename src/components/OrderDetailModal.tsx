import React from 'react';
import {
  X,
  Printer,
  QrCode,
  CheckCircle2,
  Clock,
  Truck,
  Building,
  User,
  Phone,
  MapPin,
  Calendar,
  FileText,
  Layers,
  TrendingUp
} from 'lucide-react';
import { Order } from '../types';

interface OrderDetailModalProps {
  order: Order | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenVietQr: (order: Order) => void;
  onUpdateStatus: (orderId: string, newStatus: Order['status']) => void;
}

export const OrderDetailModal: React.FC<OrderDetailModalProps> = ({
  order,
  isOpen,
  onClose,
  onOpenVietQr,
  onUpdateStatus
}) => {
  if (!isOpen || !order) return null;

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  const cogs = order.cogs || 0;
  const grossProfit = order.grossProfit || (order.totalAmount - cogs);
  const profitMargin = order.totalAmount > 0 ? (grossProfit / order.totalAmount) * 100 : 0;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-mono font-bold text-base shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 font-mono">{order.code}</h2>
                {order.status === 'completed' && (
                  <span className="bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    Hoàn thành
                  </span>
                )}
                {order.status === 'shipping' && (
                  <span className="bg-blue-100 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    Đang giao hàng
                  </span>
                )}
                {order.status === 'processing' && (
                  <span className="bg-amber-100 text-amber-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                    Chờ xử lý
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500">Thời gian tạo: {order.createdAt} | Người lập: {order.creator}</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
          {/* Customer Info Box */}
          <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Khách hàng</span>
              <h4 className="font-bold text-slate-900 text-sm mt-0.5">{order.customerName}</h4>
              <p className="text-slate-600 mt-0.5">📞 {order.customerPhone || '0908 123 456'}</p>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Địa chỉ giao hàng</span>
              <p className="text-slate-700 font-medium mt-0.5">
                📍 {order.customerAddress || 'Khu CN Tân Bình, TP.HCM'}
              </p>
            </div>
          </div>

          {/* Items Table */}
          <div>
            <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block mb-1.5">
              Danh sách sản phẩm ({order.items?.length || 0})
            </span>
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-[10px] font-extrabold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2.5">SẢN PHẨM</th>
                    <th className="p-2.5 text-center">SỐ LƯỢNG</th>
                    <th className="p-2.5 text-right">ĐƠN GIÁ BÁN</th>
                    <th className="p-2.5 text-right">THÀNH TIỀN</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {order.items?.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-2.5 font-semibold text-slate-800">
                        {item.productName}
                        <div className="text-[10px] font-mono text-slate-400">SKU: {item.sku}</div>
                      </td>
                      <td className="p-2.5 text-center font-bold text-slate-700">
                        {item.quantity.toLocaleString('vi-VN')} {item.unit}
                      </td>
                      <td className="p-2.5 text-right text-slate-600">
                        {formatVND(item.unitPrice)}
                      </td>
                      <td className="p-2.5 text-right font-bold text-slate-900">
                        {formatVND(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* FIFO Lots Deduction Breakdown Box */}
          <div className="bg-blue-50/50 rounded-2xl p-3.5 border border-blue-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-600" />
                Chi tiết khấu trừ Lô hàng theo chuẩn FIFO
              </span>
              <span className="text-[10px] text-blue-700 font-medium">Hàng nhập trước xuất trước</span>
            </div>

            <div className="space-y-1.5">
              {order.items?.map((item, idx) => (
                <div key={idx} className="bg-white/80 rounded-xl p-2 border border-blue-100 space-y-1 text-xs">
                  <div className="font-bold text-slate-800 flex justify-between">
                    <span>{item.productName} ({item.sku})</span>
                    {item.fifoCost && (
                      <span className="text-slate-600 text-[11px]">
                        Vốn FIFO: <strong>{formatVND(item.fifoCost)}</strong>
                      </span>
                    )}
                  </div>
                  {item.fifoDeductions && item.fifoDeductions.length > 0 ? (
                    <div className="space-y-0.5 text-[11px]">
                      {item.fifoDeductions.map((ded, dIdx) => (
                        <div key={dIdx} className="flex justify-between text-slate-600 font-mono">
                          <span>↳ Lô: <strong className="text-blue-700">{ded.lotId}</strong> (-{ded.quantity} {item.unit})</span>
                          <span>Giá vốn lô: {formatVND(ded.costPrice)}/đv</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-slate-400 italic">Đã tự động cấn trừ từ lô sớm nhất trong kho</p>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary with FIFO COGS and Realized Gross Profit */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
            <div className="flex justify-between text-slate-600">
              <span>Doanh thu tạm tính:</span>
              <span className="font-semibold">{formatVND(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-rose-600">
                <span>Chiết khấu giảm giá:</span>
                <span className="font-semibold">- {formatVND(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-900 font-extrabold text-base pt-1.5 border-t border-slate-200">
              <span>Tổng tiền đơn hàng:</span>
              <span className="text-blue-700">{formatVND(order.totalAmount)}</span>
            </div>

            {/* FIFO COGS & Realized Gross Profit */}
            <div className="pt-2 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs">
              <div className="p-2 bg-white rounded-xl border border-slate-200">
                <span className="text-slate-500 block text-[10px] uppercase font-bold">Giá vốn hàng bán (COGS):</span>
                <span className="font-extrabold text-slate-800 text-sm">{formatVND(cogs)}</span>
              </div>
              <div className="p-2 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="text-emerald-800 block text-[10px] uppercase font-bold">Lợi nhuận gộp thực tế:</span>
                <span className="font-extrabold text-emerald-700 text-sm">
                  +{formatVND(grossProfit)} ({profitMargin.toFixed(1)}%)
                </span>
              </div>
            </div>
          </div>

          {/* Payment & Action Controls */}
          <div className="flex items-center justify-between p-3 bg-blue-50/60 rounded-xl border border-blue-200">
            <div className="flex items-center gap-2">
              <span className="font-bold text-blue-900">Hình thức thanh toán:</span>
              <span className="font-semibold uppercase text-blue-700">{order.paymentMethod}</span>
            </div>
            {order.paymentMethod === 'vietqr' && (
              <button
                onClick={() => onOpenVietQr(order)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold"
              >
                <QrCode className="w-3.5 h-3.5" />
                <span>Xem mã VietQR</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <button
            onClick={() => alert(`Đang xuất lệnh in hóa đơn VAT & phiếu xuất kho cho đơn ${order.code}...`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-300 hover:bg-white text-slate-700 font-bold text-xs"
          >
            <Printer className="w-4 h-4" />
            <span>In phiếu xuất kho</span>
          </button>

          <div className="flex items-center gap-2">
            {order.status !== 'completed' && (
              <button
                onClick={() => {
                  onUpdateStatus(order.id, 'completed');
                  onClose();
                }}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs"
              >
                Đánh dấu Hoàn thành
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-xs"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
