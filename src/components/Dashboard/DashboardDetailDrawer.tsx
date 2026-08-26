import React from 'react';
import {
  X,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  Minus,
  DollarSign,
  Package,
  Layers,
  FileText,
  AlertTriangle,
  CreditCard,
  Building2,
  Calendar,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Users
} from 'lucide-react';
import {
  Order,
  Product,
  Customer,
  InventoryLayer,
  CashTransaction,
  SalesChannel,
  DashboardViewModel
} from '../../types';

export type DetailDrawerType =
  | 'revenue'
  | 'orders'
  | 'gross_profit'
  | 'cash'
  | 'channel'
  | 'product'
  | 'inventory'
  | 'fifo_aging'
  | 'debt'
  | 'alerts';

export interface DetailDrawerState {
  type: DetailDrawerType;
  channelId?: string;
  sku?: string;
  product?: Product;
}

interface DashboardDetailDrawerProps {
  detail: DetailDrawerState | null;
  onClose: () => void;
  viewModel: DashboardViewModel;
  orders: Order[];
  products: Product[];
  customers: Customer[];
  inventoryLots: InventoryLayer[];
  cashTransactions: CashTransaction[];
  onNavigateToModule: (view: string, filter?: string) => void;
}

export const DashboardDetailDrawer: React.FC<DashboardDetailDrawerProps> = ({
  detail,
  onClose,
  viewModel,
  orders = [],
  products = [],
  customers = [],
  inventoryLots = [],
  cashTransactions = [],
  onNavigateToModule
}) => {
  if (!detail) return null;

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(Math.round(v)) + ' đ';

  // Render detail content based on type
  const renderContent = () => {
    switch (detail.type) {
      case 'revenue': {
        const kpi = viewModel.kpis.revenue;
        const totalRev = viewModel.revenueChart.totalRevenue;
        const totalOrders = viewModel.revenueChart.totalOrders;
        const aov = viewModel.revenueChart.averageOrderValue;

        return (
          <div className="space-y-5">
            {/* Header KPI Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                TỔNG DOANH THU THUẦN
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {kpi.formattedValue}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${
                    kpi.trend === 'up'
                      ? 'bg-emerald-100 text-emerald-800'
                      : kpi.trend === 'down'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {kpi.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {kpi.changePercent > 0 ? `+${kpi.changePercent}%` : `${kpi.changePercent}%`}
                </span>
                <span className="text-xs text-slate-500">{kpi.comparisonText}</span>
              </div>
            </div>

            {/* Quick Metrics Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Tổng số đơn</div>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {totalOrders.toLocaleString('vi-VN')} đơn
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Giá trị đơn TB (AOV)</div>
                <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                  {formatVND(aov)}
                </div>
              </div>
            </div>

            {/* Revenue by Channel Breakdown */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Phân bổ Doanh thu theo Kênh bán
              </div>
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {viewModel.channels.slice(0, 6).map((ch, idx) => {
                  const percent = totalRev > 0 ? Math.round((ch.revenue / totalRev) * 100) : 0;
                  const channelKey = ch.channelId || (ch as any).id || `channel-${idx}`;
                  const orderCount = ch.orders ?? (ch as any).orderCount ?? 0;
                  return (
                    <div key={channelKey} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{ch.name}</div>
                        <div className="text-[11px] text-slate-500">{orderCount} đơn hàng</div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 font-mono">{formatVND(ch.revenue)}</div>
                        <div className="text-[11px] font-semibold text-blue-600">{percent}% tổng thu</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Top Products */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Top Sản phẩm Đóng góp Doanh thu
              </div>
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {(viewModel.products?.topRevenue || viewModel.products?.topSelling || []).slice(0, 5).map((p, idx) => {
                  const prodKey = p.sku ? `prod-${p.sku}` : (p as any).productId ? `prod-id-${(p as any).productId}` : `prod-idx-${idx}`;
                  const sold = (p as any).quantitySold ?? (p as any).unitsSold ?? 0;
                  return (
                    <div key={prodKey} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div className="flex items-center gap-2.5">
                        <span className="w-5 h-5 rounded-md bg-slate-100 font-mono font-bold text-slate-600 flex items-center justify-center text-[10px]">
                          {idx + 1}
                        </span>
                        <div>
                          <div className="font-bold text-slate-900">{p.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">SKU: {p.sku} • Đã bán {sold}</div>
                        </div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900">
                        {formatVND(p.revenue)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Action */}
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToModule('orders');
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <span>Xem toàn bộ đơn hàng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }

      case 'orders': {
        const kpi = viewModel.kpis.orders;
        const completedOrders = orders.filter((o) => o.status === 'completed');
        const processingOrders = orders.filter((o) => o.status === 'processing' || o.status === 'shipping');
        const cancelledOrders = orders.filter((o) => o.status === 'cancelled' || o.status === 'refunded');

        return (
          <div className="space-y-5">
            {/* Header KPI Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                TỔNG SỐ ĐƠN HÀNG
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {kpi.formattedValue}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span
                  className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded ${
                    kpi.trend === 'up'
                      ? 'bg-emerald-100 text-emerald-800'
                      : kpi.trend === 'down'
                      ? 'bg-rose-100 text-rose-800'
                      : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  {kpi.trend === 'up' ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  {kpi.changePercent > 0 ? `+${kpi.changePercent}%` : `${kpi.changePercent}%`}
                </span>
                <span className="text-xs text-slate-500">{kpi.comparisonText}</span>
              </div>
            </div>

            {/* Status Breakdown */}
            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">Hoàn thành</div>
                <div className="text-base font-black text-emerald-900 font-mono mt-0.5">
                  {completedOrders.length}
                </div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-amber-700 uppercase">Đang xử lý</div>
                <div className="text-base font-black text-amber-900 font-mono mt-0.5">
                  {processingOrders.length}
                </div>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-rose-700 uppercase">Đã hủy/Hoàn</div>
                <div className="text-base font-black text-rose-900 font-mono mt-0.5">
                  {cancelledOrders.length}
                </div>
              </div>
            </div>

            {/* Recent 5 Orders */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Đơn hàng Gần đây Nhất
              </div>
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {orders.slice(0, 5).map((o, idx) => {
                  const ordKey = o.id ? `ord-${o.id}` : o.code ? `ord-code-${o.code}` : `ord-idx-${idx}`;
                  return (
                    <div key={ordKey} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900 font-mono">{o.code}</div>
                        <div className="text-[11px] text-slate-500">
                          {o.customerName} • {o.channel || 'POS'}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-slate-900 font-mono">{formatVND(o.totalAmount)}</div>
                        <span
                          className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                            o.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : o.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {o.status === 'completed' ? 'Thành công' : o.status === 'cancelled' ? 'Đã hủy' : 'Đang xử lý'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Action */}
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToModule('orders');
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <span>Xem toàn bộ đơn hàng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }

      case 'gross_profit': {
        const kpi = viewModel.kpis.grossProfit;
        const totalRev = viewModel.finance.revenue;
        const cogs = viewModel.finance.cogs;
        const grossProfit = viewModel.finance.grossProfit;
        const gpMargin = viewModel.finance.grossMargin;

        return (
          <div className="space-y-5">
            {/* Header KPI Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                LỢI NHUẬN GỘP (GROSS PROFIT)
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {kpi.formattedValue}
              </div>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                  Biên LN gộp: {gpMargin}%
                </span>
                <span className="text-xs text-slate-500">{kpi.comparisonText}</span>
              </div>
            </div>

            {/* Breakdown Grid */}
            <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Doanh thu thuần:</span>
                <span className="font-bold text-slate-900 font-mono">{formatVND(totalRev)}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-600">Giá vốn FIFO (COGS):</span>
                <span className="font-bold text-rose-600 font-mono">-{formatVND(cogs)}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-xs">
                <span className="font-bold text-slate-900">Lợi nhuận gộp thực tế:</span>
                <span className="font-black text-emerald-600 font-mono">{formatVND(grossProfit)}</span>
              </div>
            </div>

            {/* FIFO Principle note */}
            <div className="bg-blue-50/60 border border-blue-200 rounded-xl p-3.5 text-xs text-blue-900">
              <div className="font-bold flex items-center gap-1.5 mb-1">
                <ShieldCheck className="w-4 h-4 text-blue-700" />
                <span>Nguyên tắc hạch toán FIFO & Recipe Engine</span>
              </div>
              <p className="text-[11px] text-blue-800 leading-relaxed">
                Toàn bộ giá vốn COGS được khấu trừ chính xác theo từng tầng lô hàng (Inventory Layer) hoặc theo định mức công thức Recipe/BOM tại thời điểm phát sinh giao dịch.
              </p>
            </div>

            {/* Navigation Action */}
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToModule('pnl');
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <span>Xem Báo cáo Tài chính & P&L</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }

      case 'cash': {
        const kpi = viewModel.kpis.cash;
        const totalCash = viewModel.finance.cashOnHand;
        const totalBank = viewModel.finance.bankBalance;
        const totalAvailable = totalCash + totalBank;

        return (
          <div className="space-y-5">
            {/* Header KPI Summary */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                TỔNG QUỸ TIỀN MẶT & NGÂN HÀNG
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {kpi.formattedValue}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Số dư tiền sẵn sàng thanh toán trên toàn hệ thống
              </div>
            </div>

            {/* Cash on Hand vs Bank Accounts */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Tiền mặt tại két</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {formatVND(totalCash)}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Tài khoản ngân hàng</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {formatVND(totalBank)}
                </div>
              </div>
            </div>

            {/* Recent Cash Transactions */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Giao dịch Thu / Chi Gần nhất
              </div>
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {cashTransactions.slice(0, 5).map((tx, idx) => {
                  const txKey = tx.id ? `tx-${tx.id}` : tx.code ? `tx-code-${tx.code}` : `tx-idx-${idx}`;
                  return (
                    <div key={txKey} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900">{tx.category || tx.description}</div>
                        <div className="text-[11px] text-slate-500 font-mono">{tx.code} • {tx.payerOrPayee}</div>
                      </div>
                      <div className="text-right font-mono font-bold">
                        <span className={tx.type === 'thu' ? 'text-emerald-600' : 'text-rose-600'}>
                          {tx.type === 'thu' ? '+' : '-'}{formatVND(tx.amount)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Navigation Action */}
            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToModule('cashflow');
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <span>Mở Sổ Quỹ & Dòng Tiền</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }

      case 'channel': {
        const channelItem = viewModel.channels.find((c) => c.channelId === detail.channelId || (c as any).id === detail.channelId) || viewModel.channels[0];
        if (!channelItem) return null;

        const targetChannelId = channelItem.channelId || (channelItem as any).id || '';
        const channelOrders = orders.filter((o) => (o.channel || 'POS').toLowerCase() === targetChannelId.toLowerCase());

        return (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                KÊNH PHÂN PHỐI
              </div>
              <div className="text-xl font-bold text-slate-900">
                {channelItem.name}
              </div>
              <div className="text-2xl font-black text-blue-600 font-mono mt-1">
                {formatVND(channelItem.revenue)}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Số lượng đơn hàng</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {channelItem.orders ?? (channelItem as any).orderCount ?? 0} đơn
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Giá trị TB/Đơn</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {formatVND(channelItem.avgOrderValue ?? (channelItem as any).averageOrderValue ?? 0)}
                </div>
              </div>
            </div>

            {/* Channel Orders preview */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Đơn hàng qua kênh {channelItem.name}
              </div>
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {channelOrders.slice(0, 5).map((o, idx) => {
                  const chOrdKey = o.id ? `ch-ord-${o.id}` : o.code ? `ch-ord-${o.code}` : `ch-ord-${idx}`;
                  return (
                    <div key={chOrdKey} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <div className="font-bold text-slate-900 font-mono">{o.code}</div>
                        <div className="text-[11px] text-slate-500">{o.customerName}</div>
                      </div>
                      <div className="text-right font-mono font-bold text-slate-900">
                        {formatVND(o.totalAmount)}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToModule('orders', targetChannelId);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <span>Xem tất cả đơn hàng kênh {channelItem.name}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }

      case 'product': {
        const prod = products.find((p) => p.sku === detail.sku) || detail.product;
        if (!prod) return null;

        const prodOrders = orders.filter((o) => o.items.some((i) => i.sku === prod.sku));
        const totalSold = prodOrders.reduce((sum, o) => {
          const item = o.items.find((i) => i.sku === prod.sku);
          return sum + (item ? item.quantity : 0);
        }, 0);

        return (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                CHI TIẾT SẢN PHẨM MASTER
              </div>
              <div className="text-lg font-bold text-slate-900">{prod.name}</div>
              <div className="text-xs text-slate-500 font-mono mt-0.5">SKU: {prod.sku} • Đơn vị: {prod.unit || 'Cái'}</div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Giá niêm yết</div>
                <div className="text-base font-bold text-slate-900 font-mono mt-0.5">
                  {formatVND(prod.sellingPrice || 0)}
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-xl p-3.5">
                <div className="text-[11px] font-semibold text-slate-500 uppercase">Đã bán trong kỳ</div>
                <div className="text-base font-bold text-blue-600 font-mono mt-0.5">
                  {totalSold} {prod.unit || 'Ly'}
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToModule('inventory', prod.sku);
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <span>Xem chi tiết Lô hàng & Tồn kho SKU</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }

      case 'inventory': {
        const inv = viewModel.inventory;

        return (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                TỔNG GIÁ TRỊ TỒN KHO THEO FIFO
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">
                {formatVND(inv.totalValuation)}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                Quản lý trên {inv.totalSkus} mã SKU tại các kho chi nhánh
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2.5">
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-emerald-700 uppercase">An toàn</div>
                <div className="text-base font-black text-emerald-900 font-mono mt-0.5">{inv.healthySkus}</div>
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-amber-700 uppercase">Sắp hết</div>
                <div className="text-base font-black text-amber-900 font-mono mt-0.5">{inv.lowStockSkus}</div>
              </div>
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-center">
                <div className="text-[10px] font-bold text-rose-700 uppercase">Hết hàng</div>
                <div className="text-base font-black text-rose-900 font-mono mt-0.5">{inv.outOfStockSkus}</div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToModule('inventory');
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <span>Xem danh mục tồn kho</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }

      case 'fifo_aging': {
        const aging = viewModel.inventory.agingBuckets;

        return (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                CƠ CẤU TUỔI TỒN KHO (FIFO AGING - 7 NHÓM)
              </div>
              <div className="text-sm font-bold text-slate-800">
                Phân bổ giá trị tồn kho theo thời gian nhập kho
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden text-xs">
              {aging.map((b, idx) => {
                const bKey = b.bucketKey || (b as any).bucket || `aging-${idx}`;
                const val = b.fifoValue ?? (b as any).value ?? 0;
                return (
                  <div key={bKey} className="p-3 flex items-center justify-between hover:bg-slate-50">
                    <div>
                      <div className="font-bold text-slate-900">{b.label}</div>
                      <div className="text-[11px] text-slate-500">{b.lotCount} lô hàng</div>
                    </div>
                    <div className="text-right font-mono font-bold text-slate-900">
                      {formatVND(val)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToModule('warehouse-fifo-lots');
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <span>Xem chi tiết các lô hàng FIFO</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }

      case 'debt': {
        const debtReceivables = viewModel.finance.debtReceivables;
        const debtPayables = viewModel.finance.debtPayables;

        return (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                TỔNG HỢP CÔNG NỢ PHẢI THU & PHẢI TRẢ
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Phải thu khách hàng</div>
                  <div className="text-lg font-black text-blue-600 font-mono">{formatVND(debtReceivables)}</div>
                </div>
                <div>
                  <div className="text-[11px] text-slate-500 font-semibold uppercase">Phải trả nhà cung cấp</div>
                  <div className="text-lg font-black text-rose-600 font-mono">{formatVND(debtPayables)}</div>
                </div>
              </div>
            </div>

            {/* Top Debt Customers */}
            <div>
              <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2.5">
                Top Khách hàng Dư nợ Cao nhất
              </div>
              <div className="bg-white border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                {customers
                  .filter((c) => (c.debt || 0) > 0)
                  .sort((a, b) => (b.debt || 0) - (a.debt || 0))
                  .slice(0, 5)
                  .map((c, idx) => {
                    const custKey = c.id ? `cust-${c.id}` : c.code ? `cust-${c.code}` : `cust-${idx}`;
                    return (
                      <div key={custKey} className="p-3 flex items-center justify-between text-xs hover:bg-slate-50">
                        <div>
                          <div className="font-bold text-slate-900">{c.name}</div>
                          <div className="text-[11px] text-slate-500 font-mono">{c.phone || c.code}</div>
                        </div>
                        <div className="text-right font-mono font-bold text-rose-600">
                          {formatVND(c.debt || 0)}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={() => {
                  onClose();
                  onNavigateToModule('crm');
                }}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition cursor-pointer shadow-xs"
              >
                <span>Quản lý Sổ Công nợ Khách hàng</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      }

      case 'alerts': {
        const alerts = viewModel.alerts;

        return (
          <div className="space-y-5">
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
              <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                TRUNG TÂM CẢNH BÁO DOANH NGHIỆP
              </div>
              <div className="text-base font-bold text-slate-900">
                {alerts.length} sự vụ cần được giám sát & xử lý
              </div>
            </div>

            <div className="space-y-3">
              {alerts.map((alt, idx) => {
                const altKey = alt.id ? `alert-${alt.id}` : `alert-${idx}`;
                const isCritical = alt.severity === 'critical' || (alt as any).severity === 'high';
                const isWarning = alt.severity === 'warning' || (alt as any).severity === 'medium';
                const targetMod = alt.targetModule || (alt as any).actionModule;

                return (
                  <div
                    key={altKey}
                    className={`border rounded-xl p-3.5 text-xs ${
                      isCritical
                        ? 'bg-rose-50/70 border-rose-200'
                        : isWarning
                        ? 'bg-amber-50/70 border-amber-200'
                        : 'bg-blue-50/70 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{alt.title}</span>
                      <span
                        className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                          isCritical
                            ? 'bg-rose-200 text-rose-800'
                            : isWarning
                            ? 'bg-amber-200 text-amber-800'
                            : 'bg-blue-200 text-blue-800'
                        }`}
                      >
                        {alt.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 mb-2">{alt.description}</p>
                    {targetMod && (
                      <button
                        onClick={() => {
                          onClose();
                          onNavigateToModule(targetMod);
                        }}
                        className="text-[11px] font-bold text-blue-700 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <span>{(alt as any).actionLabel || 'Đi đến xử lý'}</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        id="dashboard-drawer-backdrop"
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-50 transition-opacity"
      />

      {/* Drawer Panel */}
      <aside
        id="dashboard-detail-drawer"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-white shadow-2xl border-l border-slate-200 flex flex-col justify-between animate-in slide-in-from-right duration-200"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <h2 className="text-sm font-black text-slate-900 uppercase tracking-wider">
              {detail.type === 'revenue' && 'DOANH THU — CHI TIẾT'}
              {detail.type === 'orders' && 'ĐƠN HÀNG — CHI TIẾT'}
              {detail.type === 'gross_profit' && 'LỢI NHUẬN GỘP & TÀI CHÍNH'}
              {detail.type === 'cash' && 'DÒNG TIỀN & SỔ QUỸ'}
              {detail.type === 'channel' && 'KÊNH BÁN — CHI TIẾT'}
              {detail.type === 'product' && 'HIỆU SUẤT SẢN PHẨM'}
              {detail.type === 'inventory' && 'TỒN KHO & ĐỊNH GIÁ'}
              {detail.type === 'fifo_aging' && 'TUỔI TỒN KHO FIFO'}
              {detail.type === 'debt' && 'CÔNG NỢ DOANH NGHIỆP'}
              {detail.type === 'alerts' && 'TRUNG TÂM CẢNH BÁO'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition cursor-pointer"
            title="Đóng (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 custom-scrollbar">
          {renderContent()}
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-100 bg-slate-50 text-[11px] text-slate-400 text-center">
          Nhấn ESC hoặc nhấp bên ngoài để đóng chi tiết
        </div>
      </aside>
    </>
  );
};
