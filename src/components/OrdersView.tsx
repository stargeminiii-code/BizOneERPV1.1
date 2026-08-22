import React, { useState, useMemo } from 'react';
import {
  FileText,
  Search,
  Filter,
  Plus,
  QrCode,
  Download,
  Calendar,
  CheckCircle2,
  Clock,
  Truck,
  XCircle,
  MoreHorizontal,
  TrendingUp,
  X,
  RotateCcw,
  Layers
} from 'lucide-react';
import { Order, OrderStatus, PaymentMethod } from '../types';

interface OrdersViewProps {
  orders: Order[];
  onOpenCreateOrder: () => void;
  onSelectOrder: (order: Order) => void;
  onOpenVietQr: (order: Order) => void;
}

export const OrdersView: React.FC<OrdersViewProps> = ({
  orders = [],
  onOpenCreateOrder,
  onSelectOrder,
  onOpenVietQr
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch =
        order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.items?.some((i) => i.productName.toLowerCase().includes(searchTerm.toLowerCase()) || i.sku?.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchPayment = paymentFilter === 'all' || order.paymentMethod === paymentFilter;

      const orderDate = order.createdAt.substring(0, 10);
      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;

      return matchSearch && matchStatus && matchPayment;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, startDate, endDate]);

  // Overall Financial Aggregations
  const totalRevenue = useMemo(() => filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0), [filteredOrders]);
  const totalCogs = useMemo(() => filteredOrders.reduce((sum, o) => sum + (o.cogs || 0), 0), [filteredOrders]);
  const totalGrossProfit = useMemo(() => filteredOrders.reduce((sum, o) => sum + (o.grossProfit || (o.totalAmount - (o.cogs || 0))), 0), [filteredOrders]);
  const avgMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  // Filter Chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (searchTerm) chips.push({ key: 'search', label: `Tìm: "${searchTerm}"`, onRemove: () => setSearchTerm('') });
    if (statusFilter !== 'all') chips.push({ key: 'status', label: `Trạng thái: ${statusFilter}`, onRemove: () => setStatusFilter('all') });
    if (paymentFilter !== 'all') chips.push({ key: 'payment', label: `PTTT: ${paymentFilter}`, onRemove: () => setPaymentFilter('all') });
    if (startDate) chips.push({ key: 'start', label: `Từ: ${startDate}`, onRemove: () => setStartDate('') });
    if (endDate) chips.push({ key: 'end', label: `Đến: ${endDate}`, onRemove: () => setEndDate('') });
    return chips;
  }, [searchTerm, statusFilter, paymentFilter, startDate, endDate]);

  const handleClearAll = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div className="p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-4 sm:space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Đơn Hàng
          </h1>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <button
            onClick={() => alert('Xuất danh sách đơn hàng & Lợi nhuận gộp sang Excel')}
            className="flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 sm:py-2 bg-white border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-700 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Xuất Excel</span>
          </button>

          <button
            id="btn-new-order-view"
            onClick={onOpenCreateOrder}
            className="flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20"
          >
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span>Tạo đơn bán hàng</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Tổng Doanh Thu</p>
            <h3 className="text-base sm:text-xl font-extrabold text-blue-700 mt-0.5">
              {formatVND(totalRevenue)}
            </h3>
            <span className="text-[10px] text-slate-400">{filteredOrders.length} đơn hàng</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Giá Vốn Hàng Bán (COGS)</p>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-800 mt-0.5">
              {formatVND(totalCogs)}
            </h3>
            <span className="text-[10px] text-slate-400">Trừ trực tiếp từ các lô</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Layers className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-emerald-700 uppercase">Lợi Nhuận Gộp Thực Tế</p>
            <h3 className="text-base sm:text-xl font-extrabold text-emerald-700 mt-0.5">
              +{formatVND(totalGrossProfit)}
            </h3>
            <span className="text-[10px] text-slate-400">Doanh thu - Giá vốn FIFO</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Biên Lợi Nhuận Gộp</p>
            <h3 className="text-base sm:text-xl font-extrabold text-slate-900 mt-0.5">
              {avgMargin.toFixed(1)}%
            </h3>
            <span className="text-[10px] text-slate-400">Tỷ suất trung bình</span>
          </div>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Mã đơn, Tên KH, Mặt hàng..."
              className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="completed">Hoàn thành</option>
            <option value="shipping">Đang giao hàng</option>
            <option value="processing">Chờ xử lý</option>
            <option value="cancelled">Đã hủy</option>
          </select>

          <select
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-slate-700 focus:outline-none"
          >
            <option value="all">Tất cả hình thức PTTT</option>
            <option value="vietqr">VietQR</option>
            <option value="cash">Tiền mặt</option>
            <option value="bank_transfer">Chuyển khoản</option>
            <option value="credit">Công nợ</option>
          </select>

          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-slate-800"
              title="Từ ngày"
            />
            <span className="text-slate-400">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full text-xs bg-slate-50 border border-slate-200 rounded-xl p-1.5 text-slate-800"
              title="Đến ngày"
            />
          </div>
        </div>

        {/* Chips */}
        {activeChips.length > 0 && (
          <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-400 mr-1">Bộ lọc đang áp dụng:</span>
            {activeChips.map((chip) => (
              <span
                key={chip.key}
                className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 text-xs font-semibold px-2.5 py-0.5 rounded-full border border-blue-200"
              >
                <span>{chip.label}</span>
                <button
                  onClick={chip.onRemove}
                  className="p-0.5 hover:bg-blue-200 rounded-full transition-colors text-blue-600 hover:text-blue-800"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={handleClearAll}
              className="text-[11px] font-bold text-rose-600 hover:underline ml-2"
            >
              Xóa tất cả
            </button>
          </div>
        )}
      </div>

      {/* Orders Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto w-full">
          <table className="w-full min-w-[850px] text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70 text-[10px] sm:text-[11px] font-extrabold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">MÃ ĐƠN</th>
                <th className="py-3 px-4">NGÀY TẠO</th>
                <th className="py-3 px-4">KHÁCH HÀNG</th>
                <th className="py-3 px-4 text-right">DOANH THU</th>
                <th className="py-3 px-4 text-right">GIÁ VỐN (FIFO)</th>
                <th className="py-3 px-4 text-right text-emerald-700">LỢI NHUẬN GỘP</th>
                <th className="py-3 px-4 text-center">TRẠNG THÁI</th>
                <th className="py-3 px-4">THANH TOÁN</th>
                <th className="py-3 px-4 text-right">THAO TÁC</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => {
                const cogs = order.cogs || 0;
                const profit = order.grossProfit || (order.totalAmount - cogs);
                const margin = order.totalAmount > 0 ? (profit / order.totalAmount) * 100 : 0;

                return (
                  <tr
                    key={order.id}
                    onClick={() => onSelectOrder(order)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="py-3.5 px-4 font-mono font-bold text-blue-600 whitespace-nowrap">
                      {order.code}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                      {order.createdAt}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-800">
                      <div className="line-clamp-1">{order.customerName}</div>
                      {order.customerPhone && (
                        <div className="text-[11px] font-normal text-slate-400">{order.customerPhone}</div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-slate-900 whitespace-nowrap">
                      {formatVND(order.totalAmount)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-medium text-slate-600 whitespace-nowrap">
                      {formatVND(cogs)}
                    </td>
                    <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 whitespace-nowrap">
                      <div>+{formatVND(profit)}</div>
                      <span className="text-[10px] text-emerald-600 font-semibold">({margin.toFixed(1)}%)</span>
                    </td>
                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      {order.status === 'completed' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Hoàn thành
                        </span>
                      )}
                      {order.status === 'shipping' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                          Đang giao
                        </span>
                      )}
                      {order.status === 'processing' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Chờ xử lý
                        </span>
                      )}
                      {order.status === 'cancelled' && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                          Đã hủy
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {order.paymentMethod === 'vietqr' && (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenVietQr(order);
                            }}
                            className="flex items-center gap-1 font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 cursor-pointer"
                          >
                            <QrCode className="w-3.5 h-3.5 text-blue-600" />
                            <span>VietQR</span>
                          </div>
                        )}
                        {order.paymentMethod === 'cash' && (
                          <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[11px]">
                            Tiền mặt
                          </span>
                        )}
                        {order.paymentMethod === 'bank_transfer' && (
                          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold border border-purple-200 text-[11px]">
                            Chuyển khoản
                          </span>
                        )}
                        {order.paymentMethod === 'credit' && (
                          <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold border border-amber-200 text-[11px]">
                            Công nợ
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectOrder(order);
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
                      >
                        Chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
