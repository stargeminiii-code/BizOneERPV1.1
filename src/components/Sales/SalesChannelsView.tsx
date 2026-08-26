import React, { useState, useMemo } from 'react';
import {
  Globe,
  ShoppingBag,
  Store,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  RefreshCw,
  Search,
  Filter,
  ArrowRight,
  ExternalLink,
  ShieldCheck,
  Building2,
  DollarSign
} from 'lucide-react';
import { Order, SalesChannel, UserAccount } from '../../types';

interface SalesChannelsViewProps {
  orders: Order[];
  currentUser?: UserAccount;
  onNavigateToOrders?: (channelId?: string) => void;
}

interface ChannelMeta {
  id: SalesChannel;
  name: string;
  category: 'POS & Offline' | 'Food Delivery' | 'E-commerce' | 'Social & Web' | 'B2B Wholesale';
  feePercent: number;
  status: 'active' | 'syncing' | 'pending';
  integrationType: 'DIRECT' | 'OPEN_API' | 'WEBHOOK';
}

const CANONICAL_CHANNELS: ChannelMeta[] = [
  { id: 'POS', name: 'Tại Quầy (POS)', category: 'POS & Offline', feePercent: 0, status: 'active', integrationType: 'DIRECT' },
  { id: 'TAKE_AWAY', name: 'Mang Đi (Take Away)', category: 'POS & Offline', feePercent: 0, status: 'active', integrationType: 'DIRECT' },
  { id: 'GRABFOOD', name: 'GrabFood', category: 'Food Delivery', feePercent: 20.0, status: 'active', integrationType: 'OPEN_API' },
  { id: 'SHOPEEFOOD', name: 'ShopeeFood', category: 'Food Delivery', feePercent: 20.0, status: 'active', integrationType: 'OPEN_API' },
  { id: 'SHOPEE', name: 'Shopee Mall / Retail', category: 'E-commerce', feePercent: 6.5, status: 'active', integrationType: 'OPEN_API' },
  { id: 'TIKTOK_SHOP', name: 'TikTok Shop', category: 'E-commerce', feePercent: 4.5, status: 'active', integrationType: 'OPEN_API' },
  { id: 'LAZADA', name: 'Lazada Việt Nam', category: 'E-commerce', feePercent: 5.5, status: 'active', integrationType: 'OPEN_API' },
  { id: 'TIKI', name: 'Tiki Trading', category: 'E-commerce', feePercent: 8.0, status: 'active', integrationType: 'OPEN_API' },
  { id: 'WEBSITE', name: 'Website E-Commerce', category: 'Social & Web', feePercent: 1.5, status: 'active', integrationType: 'WEBHOOK' },
  { id: 'FACEBOOK', name: 'Facebook Shop & Chatbot', category: 'Social & Web', feePercent: 0, status: 'active', integrationType: 'WEBHOOK' },
  { id: 'ZALO', name: 'Zalo Mini App / OA', category: 'Social & Web', feePercent: 1.0, status: 'active', integrationType: 'WEBHOOK' },
  { id: 'WHOLESALE', name: 'Bán Buôn & Đại Lý B2B', category: 'B2B Wholesale', feePercent: 0, status: 'active', integrationType: 'DIRECT' }
];

export const SalesChannelsView: React.FC<SalesChannelsViewProps> = ({
  orders = [],
  currentUser,
  onNavigateToOrders
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(Math.round(v)) + ' đ';

  // Compute metrics per channel from real orders
  const channelStats = useMemo(() => {
    return CANONICAL_CHANNELS.map((ch) => {
      const matchingOrders = orders.filter((o) => {
        const oChan = (o.channel || 'POS').toUpperCase();
        return oChan === ch.id.toUpperCase();
      });

      const orderCount = matchingOrders.length;
      const grossRevenue = matchingOrders.reduce((sum, o) => sum + (o.totalAmount || 0), 0);
      const aov = orderCount > 0 ? grossRevenue / orderCount : 0;
      const estimatedFee = (grossRevenue * ch.feePercent) / 100;
      const netRevenue = grossRevenue - estimatedFee;

      return {
        ...ch,
        orderCount,
        grossRevenue,
        aov,
        estimatedFee,
        netRevenue
      };
    });
  }, [orders]);

  const filteredChannels = useMemo(() => {
    return channelStats.filter((ch) => {
      if (selectedCategory !== 'all' && ch.category !== selectedCategory) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return ch.name.toLowerCase().includes(q) || ch.id.toLowerCase().includes(q);
    });
  }, [channelStats, selectedCategory, searchQuery]);

  const totalOmniRevenue = useMemo(() => {
    return channelStats.reduce((sum, c) => sum + c.grossRevenue, 0);
  }, [channelStats]);

  const totalOmniOrders = useMemo(() => {
    return channelStats.reduce((sum, c) => sum + c.orderCount, 0);
  }, [channelStats]);

  return (
    <div id="sales-channels-container" className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-blue-600" />
          <h2 className="text-sm font-bold text-slate-900">
            Kênh Bán Hàng & Phân Phối (Omnichannel)
          </h2>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Doanh thu đa kênh:</span>
            <span className="ml-1.5 text-sm font-bold text-blue-600 font-mono">{formatVND(totalOmniRevenue)}</span>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1">
          {['all', 'POS & Offline', 'Food Delivery', 'E-commerce', 'Social & Web', 'B2B Wholesale'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              {cat === 'all' ? 'Tất cả kênh (12)' : cat}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên kênh..."
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
          />
        </div>
      </div>

      {/* Channels Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredChannels.map((ch) => (
          <div
            key={ch.id}
            className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs hover:border-slate-300 transition flex flex-col justify-between"
          >
            <div>
              {/* Card Top */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {ch.category}
                  </span>
                  <h3 className="text-sm font-black text-slate-900 mt-0.5">{ch.name}</h3>
                </div>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Đang kết nối</span>
                </span>
              </div>

              {/* Metrics */}
              <div className="grid grid-cols-2 gap-2.5 py-3 border-y border-slate-100 mb-3">
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Doanh thu</div>
                  <div className="text-sm font-black text-slate-900 font-mono mt-0.5">
                    {formatVND(ch.grossRevenue)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Số lượng đơn</div>
                  <div className="text-sm font-bold text-slate-900 font-mono mt-0.5">
                    {ch.orderCount} đơn
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Giá trị TB/Đơn</div>
                  <div className="text-xs font-bold text-slate-700 font-mono mt-0.5">
                    {formatVND(ch.aov)}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] font-semibold text-slate-400 uppercase">Phí sàn / Chiết khấu</div>
                  <div className="text-xs font-bold text-rose-600 font-mono mt-0.5">
                    {ch.feePercent}% ({formatVND(ch.estimatedFee)})
                  </div>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] font-mono text-slate-400 font-semibold">
                Kênh: {ch.id}
              </span>
              <button
                onClick={() => onNavigateToOrders && onNavigateToOrders(ch.id)}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
              >
                <span>Xem đơn hàng</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
