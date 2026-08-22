import React from 'react';
import {
  Globe,
  ShoppingBag,
  Video,
  Share2,
  TrendingUp,
  Search,
  ArrowUpRight,
  Sparkles,
  Layers,
  ChevronRight
} from 'lucide-react';
import { formatNumberWithDots } from '../../data/administrativeData';

interface OmniChannelMarketingPerformanceProps {
  onNavigateToGenSeo?: () => void;
}

export const OmniChannelMarketingPerformance: React.FC<OmniChannelMarketingPerformanceProps> = ({
  onNavigateToGenSeo
}) => {
  const channels = [
    {
      id: 'chn-google',
      name: 'Google Organic & SEO (GenSeo)',
      icon: Search,
      metric1: '52 Từ khóa Top 3',
      metric2: '48,500 Traffic/tháng',
      cvr: '4.2%',
      leadsGenerated: 1420,
      roas: '6.8x',
      status: 'excellent' as const,
      color: 'blue'
    },
    {
      id: 'chn-shopee',
      name: 'Shopee Enterprise Mall',
      icon: ShoppingBag,
      metric1: '12,400 Lượt Click SKU',
      metric2: '1,180 Đơn Hàng',
      cvr: '9.5%',
      leadsGenerated: 1180,
      roas: '5.2x',
      status: 'good' as const,
      color: 'amber'
    },
    {
      id: 'chn-lazada',
      name: 'Lazada LazMall Official',
      icon: ShoppingBag,
      metric1: '6,200 Lượt Click SKU',
      metric2: '540 Đơn Hàng',
      cvr: '8.7%',
      leadsGenerated: 540,
      roas: '4.9x',
      status: 'good' as const,
      color: 'indigo'
    },
    {
      id: 'chn-tiktok',
      name: 'TikTok Shop & Livestream',
      icon: Video,
      metric1: '1.2M Lượt Xem Video',
      metric2: '1,450 Đơn Hàng',
      cvr: '3.8%',
      leadsGenerated: 1450,
      roas: '5.8x',
      status: 'excellent' as const,
      color: 'rose'
    },
    {
      id: 'chn-facebook',
      name: 'Facebook B2B & Lead Ads',
      icon: Share2,
      metric1: 'CPL 38,000 đ',
      metric2: '360 Lead Doanh Nghiệp',
      cvr: '12.4%',
      leadsGenerated: 360,
      roas: '4.5x',
      status: 'good' as const,
      color: 'blue'
    }
  ];

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-purple-100 text-purple-800 border border-purple-200">
              Omni-Channel Acquisition & GenSeo
            </span>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
              <span>HIỆU QUẢ MARKETING ĐA KÊNH & NGUỒN KHÁCH HÀNG (OMNI-CHANNEL PERFORMANCE)</span>
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dữ liệu tăng trưởng từ Google GenSeo, Shopee, Lazada, TikTok Shop và Facebook B2B được tổng hợp trực tiếp về Dashboard.
          </p>
        </div>

        <button
          onClick={() => onNavigateToGenSeo && onNavigateToGenSeo()}
          className="text-xs font-bold text-purple-700 hover:text-purple-900 flex items-center gap-1 self-start sm:self-auto hover:underline"
        >
          <span>Mở GenSeo Engine</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 5 Channels Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {channels.map((chn) => {
          const Icon = chn.icon;
          return (
            <div
              key={chn.id}
              className="p-3.5 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:border-purple-300 transition-all shadow-2xs space-y-2 text-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between gap-1 mb-1.5">
                  <div className="w-6 h-6 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                    <Icon className="w-3.5 h-3.5 text-purple-400" />
                  </div>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    ROAS {chn.roas}
                  </span>
                </div>

                <span className="font-extrabold text-slate-900 block truncate">{chn.name}</span>
              </div>

              <div className="space-y-1 py-1 border-y border-slate-200/60 text-[11px]">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Quy mô:</span>
                  <strong className="text-slate-900">{chn.metric1}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Hiệu quả:</span>
                  <strong className="text-slate-900">{chn.metric2}</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600">
                  <span>Tỷ lệ CVR:</span>
                  <strong className="text-emerald-700">{chn.cvr}</strong>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 pt-0.5">
                <span>Đóng góp Lead/Đơn:</span>
                <strong className="text-purple-700 font-extrabold">{chn.leadsGenerated}</strong>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
