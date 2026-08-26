import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight
} from 'lucide-react';
import { ExecutivePrimaryKpi } from '../../types';
import { useLanguage } from '../../i18n';

interface ExecutiveKpiStripProps {
  kpis: {
    revenue: ExecutivePrimaryKpi;
    orders: ExecutivePrimaryKpi;
    grossProfit: ExecutivePrimaryKpi;
    cash: ExecutivePrimaryKpi;
  };
  onSelectRevenue?: () => void;
  onSelectOrders?: () => void;
  onSelectGrossProfit?: () => void;
  onSelectCash?: () => void;
  onNavigateToOrders?: () => void;
  onNavigateToFinance?: () => void;
  onNavigateToCashflow?: () => void;
}

export const ExecutiveKpiStrip: React.FC<ExecutiveKpiStripProps> = ({
  kpis,
  onSelectRevenue,
  onSelectOrders,
  onSelectGrossProfit,
  onSelectCash,
  onNavigateToOrders,
  onNavigateToFinance,
  onNavigateToCashflow
}) => {
  const { t } = useLanguage();

  const cards: Array<{
    id: string;
    title: string;
    kpi: ExecutivePrimaryKpi;
    onClick?: () => void;
  }> = [
    {
      id: 'kpi-revenue',
      title: t('dashboard.kpis.revenue'),
      kpi: kpis.revenue,
      onClick: onSelectRevenue || onNavigateToOrders
    },
    {
      id: 'kpi-orders',
      title: t('dashboard.kpis.orders'),
      kpi: kpis.orders,
      onClick: onSelectOrders || onNavigateToOrders
    },
    {
      id: 'kpi-gross-profit',
      title: t('dashboard.kpis.grossProfit'),
      kpi: kpis.grossProfit,
      onClick: onSelectGrossProfit || onNavigateToFinance
    },
    {
      id: 'kpi-cash',
      title: t('dashboard.kpis.cash'),
      kpi: kpis.cash,
      onClick: onSelectCash || onNavigateToCashflow
    }
  ];

  return (
    <div id="executive-kpi-strip" className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {cards.map(({ id, title, kpi, onClick }) => {
        const isUp = kpi.trend === 'up';
        const isDown = kpi.trend === 'down';

        return (
          <div
            key={id}
            id={`kpi-card-${id}`}
            onClick={onClick}
            role={onClick ? 'button' : undefined}
            tabIndex={onClick ? 0 : undefined}
            className={`bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs hover:border-slate-300 transition group ${
              onClick ? 'cursor-pointer' : ''
            }`}
          >
            {/* Top row: Title & Trend Pill */}
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-500 tracking-wider uppercase truncate">
                {title}
              </span>
              <div className="flex items-center gap-1">
                <span
                  className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[11px] font-semibold ${
                    isUp
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : isDown
                      ? 'bg-rose-50 text-rose-700 border border-rose-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {isUp && <TrendingUp className="w-3 h-3 text-emerald-600" />}
                  {isDown && <TrendingDown className="w-3 h-3 text-rose-600" />}
                  {!isUp && !isDown && <Minus className="w-3 h-3 text-slate-400" />}
                  <span>{kpi.changePercent > 0 ? `+${kpi.changePercent}%` : `${kpi.changePercent}%`}</span>
                </span>
                {onClick && (
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-slate-600 transition" />
                )}
              </div>
            </div>

            {/* Main Value */}
            <div className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate">
              {kpi.formattedActual}
            </div>

            {/* Bottom Subtitle */}
            <p className="text-[11px] text-slate-500 font-medium mt-2 pt-2 border-t border-slate-100 truncate">
              {kpi.subtitle || `${kpi.changePercent >= 0 ? '+' : ''}${kpi.changePercent}% ${t('dashboard.kpis.comparisonVsPrevious')}`}
            </p>
          </div>
        );
      })}
    </div>
  );
};
