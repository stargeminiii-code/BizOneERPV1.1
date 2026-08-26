import React from 'react';
import {
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { FinanceSnapshotData, MarketplaceFinanceItem } from '../../types';
import { formatVND, formatCompactVND } from '../../services/dashboardViewModel';
import { useLanguage } from '../../i18n';

interface ExecutiveFinanceMarketplaceProps {
  finance: FinanceSnapshotData;
  marketplaceFinance: MarketplaceFinanceItem[];
  onNavigateToFinance?: () => void;
  onNavigateToDebtReceivables?: () => void;
}

export const ExecutiveFinanceMarketplace: React.FC<ExecutiveFinanceMarketplaceProps> = ({
  finance,
  marketplaceFinance,
  onNavigateToFinance,
  onNavigateToDebtReceivables
}) => {
  const { t } = useLanguage();

  const getMarketplaceStatusLabel = (status: string) => {
    switch (status) {
      case 'RECONCILED':
        return t('dashboard.finance.marketplaceStatus.reconciled');
      case 'ACTUAL':
        return t('dashboard.finance.marketplaceStatus.actual');
      case 'ESTIMATED':
        return t('dashboard.finance.marketplaceStatus.estimated');
      default:
        return t('dashboard.finance.marketplaceStatus.none');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* 1. Finance Snapshot Card */}
      <div id="executive-finance-snapshot-card" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {t('dashboard.finance.title')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t('dashboard.finance.subtitle')}
              </p>
            </div>
            {onNavigateToFinance && (
              <button
                id="btn-nav-finance-detail"
                onClick={onNavigateToFinance}
                className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition cursor-pointer min-h-[30px]"
              >
                <span>{t('dashboard.finance.details')}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Grid of 6 Key Financial Indicators */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">{t('dashboard.finance.netRevenue')}</span>
              <span className="text-sm sm:text-base font-bold text-slate-900">
                {formatVND(finance.netRevenue)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5 font-normal truncate">
                Gross: {formatCompactVND(finance.grossRevenue)} (CK: -{formatCompactVND(finance.discount)})
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] font-medium text-slate-500 block">{t('dashboard.finance.cogs')}</span>
              <span className="text-sm sm:text-base font-bold text-slate-700">
                {formatVND(finance.cogs)}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] font-medium text-slate-600 block">{t('dashboard.finance.grossProfit')}</span>
              <span className="text-sm sm:text-base font-bold text-emerald-700">
                +{formatVND(finance.grossProfit)}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] font-medium text-slate-600 block">{t('dashboard.finance.grossMargin')}</span>
              <span className="text-sm sm:text-base font-bold text-slate-900">
                {finance.grossMarginPercent}%
              </span>
            </div>

            <div
              onClick={onNavigateToDebtReceivables}
              className="p-2.5 bg-slate-50 rounded-lg border border-slate-100 hover:border-slate-300 transition cursor-pointer"
            >
              <span className="text-[11px] font-medium text-slate-600 block">{t('dashboard.finance.receivables')}</span>
              <span className="text-sm sm:text-base font-bold text-slate-900">
                {formatVND(finance.receivable)}
              </span>
            </div>

            <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-[11px] font-medium text-slate-600 block">{t('dashboard.finance.payables')}</span>
              <span className="text-sm sm:text-base font-bold text-slate-900">
                {formatVND(finance.payable)}
              </span>
            </div>
          </div>
        </div>

        {/* Note / Ratio badge */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span className="flex items-center gap-1 text-slate-600 font-medium text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            {t('dashboard.finance.syncNote')}
          </span>
          <span className="font-semibold text-slate-700 text-[11px]">
            D/R: {finance.payable > 0 ? (finance.receivable / finance.payable).toFixed(2) : '1.00'}x
          </span>
        </div>
      </div>

      {/* 2. Marketplace Finance (Đối soát sàn TMĐT & Food App) */}
      <div id="executive-marketplace-finance-card" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs flex flex-col justify-between">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
                {t('dashboard.finance.marketplaceTitle')}
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {t('dashboard.finance.marketplaceSubtitle')}
              </p>
            </div>
            <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              V1.1
            </span>
          </div>

          {/* Table / List */}
          <div className="divide-y divide-slate-100 text-xs">
            {marketplaceFinance.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                {t('dashboard.finance.marketplaceEmpty')}
              </div>
            ) : (
              marketplaceFinance.map((item) => (
                <div key={item.channelId} className="py-2.5 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900">{item.channelName}</span>
                      <span
                        className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                          item.status === 'RECONCILED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : item.status === 'ACTUAL'
                            ? 'bg-slate-100 text-slate-800 border border-slate-200'
                            : item.status === 'ESTIMATED'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-slate-50 text-slate-500 border border-slate-200'
                        }`}
                      >
                        {getMarketplaceStatusLabel(item.status)}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {item.grossSales > 0 ? (
                        <>
                          {t('dashboard.finance.sales')}: <strong className="text-slate-700">{formatCompactVND(item.grossSales)}</strong> • {t('dashboard.finance.fee')}: <span className="text-slate-700">-{formatCompactVND(item.marketplaceCost)}</span> ({item.reconciliationNote || 'Biểu phí V1.1'})
                        </>
                      ) : (
                        <span className="text-slate-400 italic">{t('dashboard.finance.noSalesInPeriod')}</span>
                      )}
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="font-semibold text-slate-900">
                      {item.grossSales > 0 ? `${t('dashboard.finance.netSettlement')}: ${formatCompactVND(item.netSettlement)}` : '0 đ'}
                    </div>
                    <div className={`text-[11px] font-medium mt-0.5 ${item.realizedGrossProfit > 0 ? 'text-emerald-700' : 'text-slate-500'}`}>
                      {item.grossSales > 0 ? `${t('dashboard.finance.profit')}: +${formatCompactVND(item.realizedGrossProfit)}` : '—'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer note */}
        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 font-medium flex items-center justify-between">
          <span>{t('dashboard.finance.feeFormulaNote')}</span>
          <span className="text-slate-700 font-semibold">BizOne Connector</span>
        </div>
      </div>
    </div>
  );
};
