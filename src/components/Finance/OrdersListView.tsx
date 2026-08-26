import React, { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  TrendingUp,
  X,
  Layers,
  QrCode,
  DollarSign,
  ShoppingCart,
  FileSpreadsheet,
  Globe,
  Tag
} from 'lucide-react';
import { Order, PaymentMethod, OrderStatus } from '../../types';
import { useLanguage } from '../../i18n';

interface OrdersListViewProps {
  orders: Order[];
  onSelectOrder?: (order: Order) => void;
  onOpenVietQr?: (order: Order) => void;
}

export const OrdersListView: React.FC<OrdersListViewProps> = ({
  orders = [],
  onSelectOrder,
  onOpenVietQr
}) => {
  const { t, language } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [channelFilter, setChannelFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchSearch =
        order.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (order.customerPhone && order.customerPhone.includes(searchTerm)) ||
        order.items?.some(
          (i) =>
            i.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.sku?.toLowerCase().includes(searchTerm.toLowerCase())
        );

      const matchStatus = statusFilter === 'all' || order.status === statusFilter;
      const matchPayment = paymentFilter === 'all' || order.paymentMethod === paymentFilter;
      const matchChannel =
        channelFilter === 'all' || (order.channel || 'POS').toUpperCase() === channelFilter.toUpperCase();

      const orderDate = order.createdAt.substring(0, 10);
      if (startDate && orderDate < startDate) return false;
      if (endDate && orderDate > endDate) return false;

      return matchSearch && matchStatus && matchPayment && matchChannel;
    });
  }, [orders, searchTerm, statusFilter, paymentFilter, channelFilter, startDate, endDate]);

  // Financial Aggregations
  const totalRevenue = useMemo(() => filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0), [filteredOrders]);
  const totalCogs = useMemo(() => filteredOrders.reduce((sum, o) => sum + (o.cogs || 0), 0), [filteredOrders]);
  const totalGrossProfit = useMemo(
    () => filteredOrders.reduce((sum, o) => sum + (o.grossProfit !== undefined ? o.grossProfit : (o.totalAmount - (o.cogs || 0))), 0),
    [filteredOrders]
  );
  const avgMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;

  // Filter Chips
  const activeChips = useMemo(() => {
    const chips: { key: string; label: string; onRemove: () => void }[] = [];
    if (searchTerm) chips.push({ key: 'search', label: `Tìm: "${searchTerm}"`, onRemove: () => setSearchTerm('') });
    if (statusFilter !== 'all')
      chips.push({ key: 'status', label: `Trạng thái: ${statusFilter}`, onRemove: () => setStatusFilter('all') });
    if (paymentFilter !== 'all')
      chips.push({ key: 'payment', label: `PTTT: ${paymentFilter}`, onRemove: () => setPaymentFilter('all') });
    if (channelFilter !== 'all')
      chips.push({ key: 'channel', label: `Kênh: ${channelFilter}`, onRemove: () => setChannelFilter('all') });
    if (startDate) chips.push({ key: 'start', label: `Từ: ${startDate}`, onRemove: () => setStartDate('') });
    if (endDate) chips.push({ key: 'end', label: `Đến: ${endDate}`, onRemove: () => setEndDate('') });
    return chips;
  }, [searchTerm, statusFilter, paymentFilter, channelFilter, startDate, endDate]);

  const handleClearAll = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPaymentFilter('all');
    setChannelFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const handleExportCsv = () => {
    if (filteredOrders.length === 0) {
      alert(language === 'vi' ? 'Không có đơn hàng nào để xuất' : 'No orders to export');
      return;
    }
    const headers = ['Mã Đơn', 'Ngày Tạo', 'Kênh Bán', 'Khách Hàng', 'SĐT', 'Tổng Tiền (VNĐ)', 'Giá Vốn FIFO', 'Lợi Nhuận Gộp', 'Biên LN (%)', 'Trạng Thái', 'Thanh Toán'];
    const rows = filteredOrders.map((o) => {
      const cogs = o.cogs || 0;
      const profit = o.grossProfit !== undefined ? o.grossProfit : (o.totalAmount - cogs);
      const margin = o.totalAmount > 0 ? (profit / o.totalAmount) * 100 : 0;
      return [
        o.code,
        o.createdAt,
        o.channel || 'POS',
        `"${o.customerName}"`,
        `"${o.customerPhone || ''}"`,
        o.totalAmount,
        cogs,
        profit,
        margin.toFixed(1) + '%',
        o.status,
        o.paymentMethod
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `danh_sach_don_hang_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      {/* 4 Financial Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Tổng doanh thu
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-900">{formatVND(totalRevenue)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">{filteredOrders.length} đơn hàng</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Giá vốn xuất kho (FIFO)
          </div>
          <div className="text-lg sm:text-xl font-bold text-slate-700">{formatVND(totalCogs)}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Chi phí giá vốn thực tế</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Lợi nhuận gộp
          </div>
          <div className="text-lg sm:text-xl font-bold text-emerald-600">+{formatVND(totalGrossProfit)}</div>
          <div className="text-[11px] text-emerald-700 font-medium mt-0.5">Biên LN: {avgMargin.toFixed(1)}%</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200/90 shadow-2xs">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider mb-1">
            Đơn hoàn tất
          </div>
          <div className="text-lg sm:text-xl font-bold text-blue-600">
            {filteredOrders.filter((o) => o.status === 'completed').length} / {filteredOrders.length}
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">
            {filteredOrders.filter((o) => o.paymentStatus === 'paid').length} đơn đã thanh toán
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
        {/* Controls Bar */}
        <div className="p-3 sm:p-4 border-b border-slate-200/80 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                id="input-orders-search"
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo mã đơn, khách hàng, SĐT, SKU..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs sm:text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white transition"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <button
                id="btn-export-orders-csv"
                onClick={handleExportCsv}
                className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Xuất Excel/CSV</span>
              </button>
            </div>
          </div>

          {/* Filters Line */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-1">
            <div>
              <select
                id="filter-order-status"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Tất cả trạng thái</option>
                <option value="completed">Hoàn thành</option>
                <option value="shipping">Đang giao</option>
                <option value="processing">Chờ xử lý</option>
                <option value="cancelled">Đã hủy</option>
              </select>
            </div>

            <div>
              <select
                id="filter-order-payment"
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Tất cả thanh toán</option>
                <option value="vietqr">VietQR Napas</option>
                <option value="cash">Tiền mặt</option>
                <option value="bank_transfer">Chuyển khoản</option>
                <option value="credit">Ghi nợ (Công nợ)</option>
              </select>
            </div>

            <div>
              <select
                id="filter-order-channel"
                value={channelFilter}
                onChange={(e) => setChannelFilter(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="all">Tất cả kênh bán</option>
                <option value="POS">Tại quầy (POS)</option>
                <option value="TAKE_AWAY">Mang đi (Take Away)</option>
                <option value="SHOPEE">Shopee</option>
                <option value="TIKTOK">TikTok Shop</option>
                <option value="LAZADA">Lazada</option>
                <option value="TIKI">Tiki</option>
                <option value="FACEBOOK">Facebook / Chat</option>
                <option value="GRABFOOD">GrabFood</option>
                <option value="DIRECT">Trực tiếp / B2B</option>
              </select>
            </div>

            <div>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Từ ngày"
              />
            </div>

            <div>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Đến ngày"
              />
            </div>
          </div>

          {/* Active Chips */}
          {activeChips.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] text-slate-400 font-medium">Bộ lọc:</span>
              {activeChips.map((chip) => (
                <span
                  key={chip.key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-semibold"
                >
                  {chip.label}
                  <button onClick={chip.onRemove} className="hover:text-blue-900 cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button
                onClick={handleClearAll}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold ml-1 cursor-pointer"
              >
                Xóa tất cả
              </button>
            </div>
          )}
        </div>

        {/* Orders Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold">
                <th className="py-3 px-3.5">Mã đơn</th>
                <th className="py-3 px-3.5">Thời gian</th>
                <th className="py-3 px-3.5">Kênh</th>
                <th className="py-3 px-3.5">Khách hàng</th>
                <th className="py-3 px-3.5 text-right">Tổng tiền</th>
                <th className="py-3 px-3.5 text-right">Giá vốn</th>
                <th className="py-3 px-3.5 text-right">Lợi nhuận</th>
                <th className="py-3 px-3.5 text-center">Trạng thái</th>
                <th className="py-3 px-3.5">Thanh toán</th>
                <th className="py-3 px-3.5 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-10 text-slate-400">
                    Không tìm thấy đơn hàng nào phù hợp
                  </td>
                </tr>
              ) : (
                filteredOrders.map((order) => {
                  const cogs = order.cogs || 0;
                  const profit = order.grossProfit !== undefined ? order.grossProfit : (order.totalAmount - cogs);
                  const margin = order.totalAmount > 0 ? (profit / order.totalAmount) * 100 : 0;
                  const channel = order.channel || 'POS';

                  return (
                    <tr
                      key={order.id}
                      onClick={() => onSelectOrder && onSelectOrder(order)}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    >
                      <td className="py-3 px-3.5 font-bold text-blue-600 whitespace-nowrap">
                        {order.code}
                      </td>
                      <td className="py-3 px-3.5 text-slate-500 font-medium whitespace-nowrap text-[11px]">
                        {order.createdAt.substring(0, 16).replace('T', ' ')}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                          {channel}
                        </span>
                      </td>
                      <td className="py-3 px-3.5 font-semibold text-slate-800">
                        <div className="line-clamp-1">{order.customerName || 'Khách lẻ'}</div>
                        {order.customerPhone && (
                          <div className="text-[10px] font-normal text-slate-400">{order.customerPhone}</div>
                        )}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatVND(order.totalAmount)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-medium text-slate-600 whitespace-nowrap">
                        {formatVND(cogs)}
                      </td>
                      <td className="py-3 px-3.5 text-right font-bold text-emerald-700 whitespace-nowrap">
                        <div>+{formatVND(profit)}</div>
                        <span className="text-[10px] text-emerald-600 font-medium">({margin.toFixed(1)}%)</span>
                      </td>
                      <td className="py-3 px-3.5 text-center whitespace-nowrap">
                        {order.status === 'completed' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Hoàn thành
                          </span>
                        )}
                        {order.status === 'shipping' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Đang giao
                          </span>
                        )}
                        {order.status === 'processing' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Chờ xử lý
                          </span>
                        )}
                        {order.status === 'cancelled' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Đã hủy
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3.5 whitespace-nowrap">
                        <div className="flex items-center gap-1">
                          {order.paymentMethod === 'vietqr' && (
                            <div
                              onClick={(e) => {
                                e.stopPropagation();
                                if (onOpenVietQr) onOpenVietQr(order);
                              }}
                              className="flex items-center gap-1 font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded border border-blue-200 cursor-pointer text-[10px]"
                            >
                              <QrCode className="w-3 h-3 text-blue-600" />
                              <span>VietQR</span>
                            </div>
                          )}
                          {order.paymentMethod === 'cash' && (
                            <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-semibold text-[10px]">
                              Tiền mặt
                            </span>
                          )}
                          {order.paymentMethod === 'bank_transfer' && (
                            <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-semibold border border-purple-200 text-[10px]">
                              Chuyển khoản
                            </span>
                          )}
                          {order.paymentMethod === 'credit' && (
                            <span className="bg-amber-50 text-amber-700 px-2 py-0.5 rounded font-semibold border border-amber-200 text-[10px]">
                              Công nợ
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3.5 text-right whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onSelectOrder) onSelectOrder(order);
                          }}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-bold cursor-pointer transition"
                        >
                          Chi tiết
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
