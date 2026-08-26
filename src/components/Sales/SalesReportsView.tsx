import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Calendar,
  Filter,
  Layers,
  ArrowUpRight,
  PieChart as PieChartIcon,
  Package,
  Clock,
  Sparkles,
  Download,
  Eye,
  FileSpreadsheet
} from 'lucide-react';
import { Order, OrderTransactionSnapshot, SalesChannel } from '../../types';
import { TransactionSnapshotService } from '../../services/transaction/transactionSnapshotService';
import { useLanguage } from '../../i18n';

interface SalesReportsViewProps {
  orders: Order[];
}

export const SalesReportsView: React.FC<SalesReportsViewProps> = ({ orders = [] }) => {
  const { t, language } = useLanguage();
  const [selectedChannel, setSelectedChannel] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'channel' | 'products' | 'snapshots'>('channel');

  // Filter completed or non-cancelled orders
  const validOrders = useMemo(() => {
    return orders.filter((o) => o.status !== 'cancelled' && (selectedChannel === 'all' || o.channel === selectedChannel));
  }, [orders, selectedChannel]);

  // Overall Financial KPIs
  const totalRevenue = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
  }, [validOrders]);

  const totalCogs = useMemo(() => {
    return validOrders.reduce((sum, o) => sum + (o.cogs || 0), 0);
  }, [validOrders]);

  const grossProfit = totalRevenue - totalCogs;
  const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

  // Revenue by Channel Aggregation
  const channelBreakdown = useMemo(() => {
    const map: Record<string, { channel: string; revenue: number; orderCount: number; cogs: number }> = {};

    validOrders.forEach((o) => {
      const ch = o.channel || 'POS';
      if (!map[ch]) {
        map[ch] = { channel: ch, revenue: 0, orderCount: 0, cogs: 0 };
      }
      map[ch].revenue += o.totalAmount || 0;
      map[ch].orderCount += 1;
      map[ch].cogs += o.cogs || 0;
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [validOrders]);

  // Product Margin & Volume Aggregation
  const productPerformance = useMemo(() => {
    const map: Record<
      string,
      {
        sku: string;
        name: string;
        quantity: number;
        revenue: number;
        cogs: number;
      }
    > = {};

    validOrders.forEach((o) => {
      o.items.forEach((item) => {
        if (!map[item.sku]) {
          map[item.sku] = {
            sku: item.sku,
            name: item.productName,
            quantity: 0,
            revenue: 0,
            cogs: 0
          };
        }
        map[item.sku].quantity += item.quantity;
        map[item.sku].revenue += item.totalPrice || item.quantity * item.unitPrice;
        map[item.sku].cogs += item.fifoCost || (o.cogs ? (o.cogs * (item.totalPrice / (o.subtotal || 1))) : 0);
      });
    });

    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [validOrders]);

  // Snapshots List
  const allSnapshots = useMemo(() => {
    const list = TransactionSnapshotService.getAllSnapshots();
    return list.sort((a, b) => new Date(b.snapshotTimestamp).getTime() - new Date(a.snapshotTimestamp).getTime());
  }, [validOrders]);

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  return (
    <div id="sales-reports-container" className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">
            {language === 'vi' ? 'BÁO CÁO & HIỆU SUẤT BÁN HÀNG' : 'SALES REPORTS & ANALYTICS'}
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {language === 'vi'
              ? 'Phân tích doanh thu đa kênh, biên lợi nhuận gộp và giá vốn FIFO thực tế'
              : 'Multi-channel revenue analysis, gross margin %, and actual FIFO COGS'}
          </p>
        </div>

        {/* Channel Filter */}
        <div className="flex items-center gap-2">
          <select
            value={selectedChannel}
            onChange={(e) => setSelectedChannel(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-700 shadow-2xs focus:outline-none focus:ring-1 focus:ring-blue-600"
          >
            <option value="all">{language === 'vi' ? 'Tất cả kênh bán' : 'All Channels'}</option>
            <option value="POS">POS</option>
            <option value="TAKE_AWAY">Take Away</option>
            <option value="SHOPEE">Shopee</option>
            <option value="TIKTOK_SHOP">TikTok Shop</option>
            <option value="GRABFOOD">GrabFood</option>
            <option value="SHOPEEFOOD">ShopeeFood</option>
            <option value="B2B">B2B / Sỉ</option>
          </select>
        </div>
      </div>

      {/* Top 4 KPI Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">
            {language === 'vi' ? 'Tổng Doanh Thu' : 'Total Revenue'}
          </p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">
            {formatVND(totalRevenue)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {validOrders.length} {language === 'vi' ? 'đơn hàng' : 'orders'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">
            {language === 'vi' ? 'Giá Vốn Hàng Bán (FIFO COGS)' : 'Total COGS (FIFO)'}
          </p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">
            {formatVND(totalCogs)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {language === 'vi' ? 'Khấu trừ theo từng lô' : 'Deducted from FIFO layers'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">
            {language === 'vi' ? 'Lợi Nhuận Gộp' : 'Gross Profit'}
          </p>
          <h3 className="text-xl font-extrabold text-emerald-600 mt-1">
            {formatVND(grossProfit)}
          </h3>
          <p className="text-[11px] text-emerald-600 mt-1 font-bold">
            {grossMarginPercent.toFixed(1)}% {language === 'vi' ? 'biên LN gộp' : 'margin'}
          </p>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <p className="text-xs font-semibold text-slate-500">
            {language === 'vi' ? 'Giá Trị Trung Bình / Đơn (AOV)' : 'Average Order Value'}
          </p>
          <h3 className="text-xl font-extrabold text-slate-900 mt-1">
            {formatVND(validOrders.length > 0 ? totalRevenue / validOrders.length : 0)}
          </h3>
          <p className="text-[11px] text-slate-400 mt-1 font-medium">
            {language === 'vi' ? 'Hiệu suất giỏ hàng' : 'Per transaction'}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        {[
          { id: 'channel', label: language === 'vi' ? 'Theo Kênh Bán Hàng' : 'By Sales Channel' },
          { id: 'products', label: language === 'vi' ? 'Hiệu Suất Sản Phẩm' : 'Product Performance' },
          { id: 'snapshots', label: language === 'vi' ? 'Snapshot Giao Dịch Bất Biến' : 'Immutable Snapshots' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`pb-3 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Channel Breakdown */}
      {activeTab === 'channel' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">{language === 'vi' ? 'Kênh bán hàng' : 'Channel'}</th>
                  <th className="py-3 px-4 text-center">{language === 'vi' ? 'Số đơn' : 'Orders'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Doanh thu' : 'Revenue'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Giá vốn FIFO' : 'FIFO COGS'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Lợi nhuận gộp' : 'Gross Profit'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Biên LN %' : 'Margin %'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {channelBreakdown.map((row) => {
                  const chProfit = row.revenue - row.cogs;
                  const chMargin = row.revenue > 0 ? (chProfit / row.revenue) * 100 : 0;

                  return (
                    <tr key={row.channel} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {row.channel}
                      </td>
                      <td className="py-3 px-4 text-center font-bold text-slate-600">
                        {row.orderCount}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {formatVND(row.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatVND(row.cogs)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {formatVND(chProfit)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                        {chMargin.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Product Performance */}
      {activeTab === 'products' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Tên sản phẩm' : 'Product Name'}</th>
                  <th className="py-3 px-4 text-center">{language === 'vi' ? 'Số lượng bán' : 'Quantity Sold'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Doanh thu' : 'Revenue'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Giá vốn FIFO' : 'COGS'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Lợi nhuận gộp' : 'Gross Profit'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Biên LN %' : 'Margin %'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {productPerformance.map((p) => {
                  const pProfit = p.revenue - p.cogs;
                  const pMargin = p.revenue > 0 ? (pProfit / p.revenue) * 100 : 0;

                  return (
                    <tr key={p.sku} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">
                        {p.sku}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {p.name}
                      </td>
                      <td className="py-3 px-4 text-center font-extrabold text-slate-700">
                        {p.quantity}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {formatVND(p.revenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-600">
                        {formatVND(p.cogs)}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-emerald-600">
                        {formatVND(pProfit)}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-emerald-700">
                        {pMargin.toFixed(1)}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Snapshots */}
      {activeTab === 'snapshots' && (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 font-bold text-slate-600 uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-4">{language === 'vi' ? 'Mã đơn hàng' : 'Order Code'}</th>
                  <th className="py-3 px-4">{language === 'vi' ? 'Thời điểm ghi nhận' : 'Snapshot Time'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Doanh thu' : 'Revenue'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Giá vốn FIFO thực' : 'Actual COGS'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Giá vốn chuẩn' : 'Standard Cost'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'Chênh lệch (Variance)' : 'Variance'}</th>
                  <th className="py-3 px-4 text-right">{language === 'vi' ? 'LN gộp' : 'Profit'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {allSnapshots.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-400">
                      {language === 'vi' ? 'Chưa có snapshot nào được tạo' : 'No snapshots recorded'}
                    </td>
                  </tr>
                ) : (
                  allSnapshots.map((s) => (
                    <tr key={s.orderId} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-blue-600">
                        {s.orderCode}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500">
                        {new Date(s.snapshotTimestamp).toLocaleString('vi-VN')}
                      </td>
                      <td className="py-3 px-4 text-right font-extrabold text-slate-900">
                        {formatVND(s.totalRevenue)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-700">
                        {formatVND(s.totalActualCogs)}
                      </td>
                      <td className="py-3 px-4 text-right text-slate-500">
                        {formatVND(s.totalStandardCogs)}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold ${s.cogsVariance > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                        {s.cogsVariance > 0 ? `+${formatVND(s.cogsVariance)}` : formatVND(s.cogsVariance)}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-emerald-700">
                        {formatVND(s.grossProfit)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
