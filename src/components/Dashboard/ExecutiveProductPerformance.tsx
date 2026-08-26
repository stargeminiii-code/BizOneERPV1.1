import React, { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { ProductPerformanceMetric } from '../../types';
import { formatVND } from '../../services/dashboardViewModel';
import { useLanguage } from '../../i18n';

interface ExecutiveProductPerformanceProps {
  products: {
    topSelling: ProductPerformanceMetric[];
    topRevenue: ProductPerformanceMetric[];
    topProfit: ProductPerformanceMetric[];
  };
  onNavigateToProducts?: () => void;
  onSelectProduct?: (sku: string) => void;
}

export const ExecutiveProductPerformance: React.FC<ExecutiveProductPerformanceProps> = ({
  products,
  onNavigateToProducts,
  onSelectProduct
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<'selling' | 'revenue' | 'profit'>('selling');

  const currentList =
    activeTab === 'selling'
      ? products.topSelling
      : activeTab === 'revenue'
      ? products.topRevenue
      : products.topProfit;

  return (
    <div id="executive-product-performance-card" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {t('dashboard.products.title')}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {t('dashboard.products.subtitle')}
          </p>
        </div>

        {/* Tab Controls */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto">
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg text-xs font-semibold">
            <button
              onClick={() => setActiveTab('selling')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'selling' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('dashboard.products.topSelling')}
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'revenue' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('dashboard.products.topRevenue')}
            </button>
            <button
              onClick={() => setActiveTab('profit')}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                activeTab === 'profit' ? 'bg-white text-slate-900 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t('dashboard.products.topProfit')}
            </button>
          </div>

          {onNavigateToProducts && (
            <button
              id="btn-view-all-products"
              onClick={onNavigateToProducts}
              className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 transition cursor-pointer min-h-[30px]"
            >
              <span>{t('dashboard.products.viewAll')}</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="divide-y divide-slate-100 mt-2">
        {currentList.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            {t('dashboard.products.empty')}
          </div>
        ) : (
          currentList.map((item, index) => {
            const margin = item.revenue > 0 ? Math.round((item.grossProfit / item.revenue) * 1000) / 10 : 0;
            return (
              <div
                key={item.productId || item.sku || index}
                onClick={() => onSelectProduct?.(item.sku)}
                className="py-2.5 flex items-center justify-between gap-3 hover:bg-slate-50/70 px-2 rounded-lg transition cursor-pointer"
              >
                {/* Left: Rank & Info */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[11px] font-bold shrink-0 ${
                      index === 0
                        ? 'bg-slate-900 text-white'
                        : index === 1
                        ? 'bg-slate-200 text-slate-800'
                        : index === 2
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-slate-50 text-slate-400 border border-slate-200'
                    }`}
                  >
                    {index + 1}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 truncate">{item.name}</p>
                    <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                      <span className="font-mono bg-slate-100 px-1 rounded text-[10px]">{item.sku}</span>
                      <span>•</span>
                      <span>{t('dashboard.products.sold')}: <strong className="text-slate-700">{item.quantitySold} {item.unit}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right: Metrics */}
                <div className="text-right shrink-0">
                  <div className="text-xs sm:text-sm font-bold text-slate-900">
                    {formatVND(item.revenue)}
                  </div>
                  <div className="text-[11px] font-semibold text-emerald-700 mt-0.5">
                    {t('dashboard.products.profit')}: +{formatVND(item.grossProfit)} ({margin}%)
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
