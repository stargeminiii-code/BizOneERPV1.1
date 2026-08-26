import React from 'react';
import { ArrowRight } from 'lucide-react';
import { CrmSnapshotData } from '../../types';
import { formatVND } from '../../services/dashboardViewModel';
import { useLanguage } from '../../i18n';

interface ExecutiveCrmSnapshotProps {
  crm: CrmSnapshotData;
  onNavigateToCrm?: () => void;
}

export const ExecutiveCrmSnapshot: React.FC<ExecutiveCrmSnapshotProps> = ({
  crm,
  onNavigateToCrm
}) => {
  const { t, language } = useLanguage();
  const numberFormatter = new Intl.NumberFormat(language === 'vi' ? 'vi-VN' : 'en-US');

  return (
    <div id="executive-crm-snapshot-card" className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200 shadow-2xs">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-3">
        <div>
          <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
            {t('dashboard.crm.title')}
          </h2>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            {t('dashboard.crm.subtitle')}
          </p>
        </div>

        {onNavigateToCrm && (
          <button
            id="btn-nav-crm-detail"
            onClick={onNavigateToCrm}
            className="text-xs font-semibold text-slate-700 hover:text-slate-900 flex items-center gap-1 border border-slate-200 px-2.5 py-1 rounded-lg hover:bg-slate-50 transition cursor-pointer min-h-[30px]"
          >
            <span>{t('dashboard.crm.details')}</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 4 Core Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block">{t('dashboard.crm.newCustomers')}</span>
          <span className="text-sm sm:text-base font-bold text-slate-900">
            {numberFormatter.format(crm.newCustomersCount)} {t('dashboard.crm.customerUnit')}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[11px] font-medium text-slate-500 block">{t('dashboard.crm.returningCustomers')}</span>
          <span className="text-sm sm:text-base font-bold text-slate-900">
            {numberFormatter.format(crm.returningCustomersCount)} {t('dashboard.crm.customerUnit')}
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[11px] font-medium text-slate-600 block">{t('dashboard.crm.returningOrdersRate')}</span>
          <span className="text-sm sm:text-base font-bold text-emerald-700">
            {crm.returningOrdersPercent}% <span className="text-xs font-normal text-slate-500">({numberFormatter.format(crm.returningOrdersCount)} {t('dashboard.crm.orderUnit')})</span>
          </span>
        </div>

        <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
          <span className="text-[11px] font-medium text-slate-600 block">{t('dashboard.crm.aov')}</span>
          <span className="text-sm sm:text-base font-bold text-slate-900">
            {formatVND(crm.aov)}
          </span>
        </div>
      </div>

      {/* Top Customer Highlight */}
      {crm.topCustomer && (
        <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 flex items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0">
              #1
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900 truncate">{crm.topCustomer.name}</span>
                <span className="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-slate-200 text-slate-700">
                  {t('dashboard.crm.topCustomerBadge')}
                </span>
              </div>
              <p className="text-slate-500 text-[11px] mt-0.5 truncate">
                {t('dashboard.crm.ordered')}: <strong className="text-slate-700">{crm.topCustomer.orderCount} {t('dashboard.crm.orderUnit')}</strong>
                {crm.topCustomer.phone && ` • ${crm.topCustomer.phone}`}
              </p>
            </div>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] text-slate-500 block">{t('dashboard.crm.totalSpent')}:</span>
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              {formatVND(crm.topCustomer.totalSpent)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
