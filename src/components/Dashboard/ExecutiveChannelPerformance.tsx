import React, { useState } from 'react';
import {
  Store,
  Globe,
  ShoppingBag,
  Utensils,
  Building
} from 'lucide-react';
import { ChannelPerformanceMetric } from '../../types';
import { formatVND } from '../../services/dashboardViewModel';
import { useLanguage } from '../../i18n';

interface ExecutiveChannelPerformanceProps {
  channels: ChannelPerformanceMetric[];
  onSelectChannel?: (channelId: string) => void;
}

export const ExecutiveChannelPerformance: React.FC<ExecutiveChannelPerformanceProps> = ({
  channels,
  onSelectChannel
}) => {
  const { t } = useLanguage();
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: t('dashboard.channels.all') },
    { id: 'offline_pos', label: t('dashboard.channels.offlinePos') },
    { id: 'direct_online', label: t('dashboard.channels.directOnline') },
    { id: 'marketplace', label: t('dashboard.channels.marketplace') },
    { id: 'food_delivery', label: t('dashboard.channels.foodDelivery') },
    { id: 'b2b_wholesale', label: t('dashboard.channels.b2bWholesale') }
  ];

  const getChannelIcon = (category: string) => {
    switch (category) {
      case 'offline_pos':
        return Store;
      case 'direct_online':
        return Globe;
      case 'marketplace':
        return ShoppingBag;
      case 'food_delivery':
        return Utensils;
      case 'b2b_wholesale':
        return Building;
      default:
        return Store;
    }
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'offline_pos':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">POS</span>;
      case 'direct_online':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Direct</span>;
      case 'marketplace':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">TMĐT</span>;
      case 'food_delivery':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">Food</span>;
      case 'b2b_wholesale':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">B2B</span>;
      default:
        return null;
    }
  };

  const filteredChannels = filterCategory === 'all'
    ? channels
    : channels.filter((ch) => ch.category === filterCategory);

  return (
    <div id="executive-channel-performance-card" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {t('dashboard.channels.title')}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {t('dashboard.channels.subtitle')}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setFilterCategory(cat.id)}
              className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition whitespace-nowrap cursor-pointer ${
                filterCategory === cat.id
                  ? 'bg-slate-900 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Channel Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mt-3">
        {filteredChannels.map((ch) => {
          const Icon = getChannelIcon(ch.category);
          const hasSales = ch.revenue > 0;

          return (
            <div
              key={ch.channelId}
              id={`channel-item-${ch.channelId}`}
              onClick={() => onSelectChannel?.(ch.channelId)}
              className={`p-3 rounded-lg border transition flex flex-col justify-between ${
                hasSales
                  ? 'bg-white border-slate-200 hover:border-slate-400 cursor-pointer shadow-2xs'
                  : 'bg-slate-50/40 border-slate-100 opacity-60'
              }`}
            >
              {/* Top row */}
              <div className="flex items-center justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-6 h-6 rounded bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0">
                    <Icon className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs font-bold text-slate-900 truncate">{ch.name}</span>
                </div>
                {getCategoryBadge(ch.category)}
              </div>

              {/* Middle row: Revenue & Orders */}
              <div className="flex items-baseline justify-between my-1">
                <span className="text-sm font-bold text-slate-900">
                  {formatVND(ch.revenue)}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  {ch.orders} {t('dashboard.channels.ordersUnit')}
                </span>
              </div>

              {/* Bottom row: Contribution bar */}
              <div className="space-y-1 mt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                  <span>{t('dashboard.channels.contribution')}</span>
                  <span className="font-bold text-slate-800">{ch.contributionPercent}%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-slate-800 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, ch.contributionPercent)}%` }}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
