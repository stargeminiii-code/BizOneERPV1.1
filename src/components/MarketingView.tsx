import React, { useState, useMemo } from 'react';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  TrendingUp,
  Percent,
  Tag,
  Users,
  DollarSign,
  ArrowUpRight,
  Sparkles,
  ShoppingBag,
  Layers,
  CheckCircle2,
  Calendar,
  Zap,
  Target,
  BarChart3,
  ExternalLink,
  Network
} from 'lucide-react';
import {
  INITIAL_CAMPAIGNS,
  INITIAL_VOUCHERS,
  INITIAL_CROSS_SELL,
  MarketingCampaign,
  PromoVoucher,
  CrossSellComboAnalytics
} from '../data/marketingData';
import { formatNumberWithDots } from '../data/administrativeData';
import { KeywordGraphView } from './GenSeo/KeywordGraphView';
import {
  INITIAL_KEYWORD_NODES,
  INITIAL_KEYWORD_EDGES,
  INITIAL_GEN_SEO_ARTICLES
} from '../data/genSeoData';
import { KeywordNode, KeywordEdge, GenSeoArticle } from '../types';

export const MarketingView: React.FC = () => {
  const [campaigns, setCampaigns] = useState<MarketingCampaign[]>(INITIAL_CAMPAIGNS);
  const [vouchers, setVouchers] = useState<PromoVoucher[]>(INITIAL_VOUCHERS);
  const [crossSells, setCrossSells] = useState<CrossSellComboAnalytics[]>(INITIAL_CROSS_SELL);
  const [activeTab, setActiveTab] = useState<'graph' | 'campaigns' | 'vouchers' | 'cross_sell'>('graph');

  // GenSEO Graph state inside Marketing
  const [keywords, setKeywords] = useState<KeywordNode[]>(INITIAL_KEYWORD_NODES);
  const [edges, setEdges] = useState<KeywordEdge[]>(INITIAL_KEYWORD_EDGES);
  const [articles, setArticles] = useState<GenSeoArticle[]>(INITIAL_GEN_SEO_ARTICLES);

  // Stats calculation
  const totalCampaignBudget = useMemo(() => {
    return campaigns.reduce((sum, c) => sum + c.budget, 0);
  }, [campaigns]);

  const totalCampaignRevenue = useMemo(() => {
    return campaigns.reduce((sum, c) => sum + c.revenueGenerated, 0);
  }, [campaigns]);

  const totalCampaignSpend = useMemo(() => {
    return campaigns.reduce((sum, c) => sum + c.actualSpend, 0);
  }, [campaigns]);

  const overallRoas = useMemo(() => {
    if (totalCampaignSpend === 0) return 0;
    return (totalCampaignRevenue / totalCampaignSpend).toFixed(2);
  }, [totalCampaignRevenue, totalCampaignSpend]);

  const handleSaveKeyword = (savedKw: KeywordNode) => {
    setKeywords((prev) => {
      const idx = prev.findIndex((k) => k.id === savedKw.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = savedKw;
        return next;
      }
      return [savedKw, ...prev];
    });
  };

  const handleDeleteKeyword = (id: string) => {
    setKeywords((prev) => prev.filter((k) => k.id !== id));
    setEdges((prev) => prev.filter((e) => e.source !== id && e.target !== id));
  };

  const handleBatchUpdateNodes = (newNodes: KeywordNode[], newEdges?: KeywordEdge[]) => {
    setKeywords(newNodes);
    if (newEdges && newEdges.length > 0) {
      setEdges((prev) => [...prev, ...newEdges]);
    }
  };

  return (
    <div id="marketing-view-container" className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1680px] mx-auto font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Header Banner */}
      <div className="bg-gradient-to-r from-indigo-900 via-purple-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl border border-purple-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
            <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-500 text-white shadow-xs">
              Marketing & Growth
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-400/20 text-purple-200 border border-purple-400/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              Content Production Map & ROAS Analytics
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3">
            <Megaphone className="w-8 h-8 text-purple-300" />
            <span>Marketing & Tăng Trưởng</span>
          </h1>
        </div>

        {/* 4 Summary Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 w-full md:w-auto shrink-0">
          <div className="bg-purple-950/60 border border-purple-700/60 rounded-2xl p-3 text-center min-w-[100px]">
            <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Ngân sách chạy</div>
            <div className="text-base font-black text-white mt-0.5">{formatNumberWithDots(totalCampaignBudget)} đ</div>
          </div>
          <div className="bg-purple-950/60 border border-purple-700/60 rounded-2xl p-3 text-center min-w-[100px]">
            <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Doanh thu tạo ra</div>
            <div className="text-base font-black text-emerald-400 mt-0.5">{formatNumberWithDots(totalCampaignRevenue)} đ</div>
          </div>
          <div className="bg-purple-950/60 border border-purple-700/60 rounded-2xl p-3 text-center min-w-[100px]">
            <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">ROAS Tổng</div>
            <div className="text-lg font-black text-amber-300 mt-0.5">{overallRoas}x</div>
          </div>
          <div className="bg-purple-950/60 border border-purple-700/60 rounded-2xl p-3 text-center min-w-[100px]">
            <div className="text-[10px] text-purple-300 font-bold uppercase tracking-wider">Từ khóa Content</div>
            <div className="text-lg font-black text-sky-300 mt-0.5">{keywords.length} node</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('graph')}
          className={`px-4 py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'graph'
              ? 'bg-slate-900 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Network className="w-4 h-4 text-emerald-400" />
          <span>Biểu Đồ Content (Node Graph First)</span>
        </button>

        <button
          onClick={() => setActiveTab('campaigns')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'campaigns'
              ? 'bg-purple-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Megaphone className="w-4 h-4" />
          <span>Chiến Dịch Marketing & Ads</span>
        </button>

        <button
          onClick={() => setActiveTab('vouchers')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'vouchers'
              ? 'bg-purple-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Mã Giảm Giá & Voucher</span>
        </button>

        <button
          onClick={() => setActiveTab('cross_sell')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'cross_sell'
              ? 'bg-purple-800 text-white shadow-md'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Phân Tích Cross-Sell & Combo</span>
        </button>
      </div>

      {/* TAB 1: CENTRAL NODE GRAPH FIRST */}
      {activeTab === 'graph' && (
        <div className="space-y-4">
          <KeywordGraphView
            nodes={keywords}
            edges={edges}
            articles={articles}
            onSaveKeyword={handleSaveKeyword}
            onDeleteKeyword={handleDeleteKeyword}
            onBatchUpdateNodes={handleBatchUpdateNodes}
          />
        </div>
      )}

      {/* Tab 2: Campaigns */}
      {activeTab === 'campaigns' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900">Danh Sách Chiến Dịch Đang Triển Khai</h2>
            <button className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Tạo Chiến Dịch Mới
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {campaigns.map((camp) => (
              <div key={camp.id} className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800">
                      {camp.channelLabel}
                    </span>
                    <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full">
                      Đang chạy
                    </span>
                  </div>

                  <h3 className="font-bold text-sm text-slate-900">{camp.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">{camp.targetAudience}</p>

                  <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <div className="text-[10px] text-slate-400">Chi phí thực tế</div>
                      <div className="font-bold text-slate-900">{formatNumberWithDots(camp.actualSpend)} đ</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Doanh thu thu về</div>
                      <div className="font-black text-emerald-600">{formatNumberWithDots(camp.revenueGenerated)} đ</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Đơn hàng tạo ra</div>
                      <div className="font-bold text-slate-800">{camp.ordersGenerated} đơn</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-slate-400">Hiệu quả ROAS</div>
                      <div className="font-black text-purple-700">{camp.roas}x</div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                  <span>{camp.startDate} → {camp.endDate}</span>
                  <span className="text-purple-600 font-bold cursor-pointer hover:underline">Chi tiết lead →</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: Vouchers */}
      {activeTab === 'vouchers' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-slate-900">Quản Lý Mã Khuyến Mại & Voucher</h2>
              <p className="text-xs text-slate-500">Mã giảm giá áp dụng linh hoạt cho POS Cửa hàng, Shopee, TikTok Shop & Website</p>
            </div>
            <button className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Tạo Mã Voucher
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <th className="py-3 px-3">Mã Code</th>
                  <th className="py-3 px-3">Tên Chương Trình</th>
                  <th className="py-3 px-3">Mức Giảm</th>
                  <th className="py-3 px-3">Đơn Tối Thiểu</th>
                  <th className="py-3 px-3 text-right">Đã Dùng / Giới Hạn</th>
                  <th className="py-3 px-3">Kênh Áp Dụng</th>
                  <th className="py-3 px-3">Thời Hạn</th>
                  <th className="py-3 px-3">Trạng Thái</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {vouchers.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-3 font-mono font-black text-purple-700 bg-purple-50/50 rounded-lg">{v.code}</td>
                    <td className="py-3 px-3 font-semibold text-slate-900">{v.name}</td>
                    <td className="py-3 px-3 font-bold text-slate-800">
                      {v.type === 'percent' ? `${v.value}%` : `${formatNumberWithDots(v.value)} đ`}
                    </td>
                    <td className="py-3 px-3 text-slate-600">{formatNumberWithDots(v.minOrderValue)} đ</td>
                    <td className="py-3 px-3 text-right font-mono font-bold text-slate-900">
                      {v.usedCount} / {v.totalLimit}
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1 flex-wrap">
                        {v.applicableChannels.map((ch, i) => (
                          <span key={i} className="px-1.5 py-0.2 bg-slate-100 text-slate-700 text-[10px] rounded font-medium">
                            {ch}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-500">{v.startDate} → {v.endDate}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded-full text-[10px]">
                        Hoạt động
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Cross-sell & Combo Attach Rate */}
      {activeTab === 'cross_sell' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Phân Tích Sản Phẩm Thường Mua Cùng (Attach Rate & Cross-Sell)</h2>
            <p className="text-xs text-slate-500">Thuật toán phân tích giỏ hàng tìm ra các cặp sản phẩm có tỷ lệ mua kèm cao nhất để đóng gói Combo khuyến mại</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {crossSells.map((cs) => (
              <div key={cs.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 bg-purple-100 px-2 py-0.5 rounded-full">
                    Attach Rate {cs.attachRatePercent}%
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-600">{cs.coOccurrenceCount} lượt mua cùng</span>
                </div>

                <div className="space-y-1.5">
                  <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                    <span>{cs.primaryName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono pl-3.5">Mã: {cs.primarySku}</div>

                  <div className="text-xs font-bold text-purple-900 flex items-center gap-1.5 pt-1">
                    <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                    <span>+ {cs.frequentlyBoughtWithName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono pl-3.5">Mã: {cs.frequentlyBoughtWithSku}</div>
                </div>

                <div className="pt-2 border-t border-slate-200/80 flex items-baseline justify-between text-xs">
                  <span className="text-slate-500">Doanh thu từ Combo:</span>
                  <span className="font-black text-emerald-700">{formatNumberWithDots(cs.comboRevenue)} đ</span>
                </div>

                <div className="p-2.5 bg-purple-50/70 border border-purple-100 rounded-xl text-[11px] text-purple-900 font-medium">
                  💡 <strong>Đề xuất:</strong> {cs.suggestedAction}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
