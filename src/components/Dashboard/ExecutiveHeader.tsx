import React from 'react';
import {
  Building2,
  Warehouse as WarehouseIcon,
  RefreshCw,
  SlidersHorizontal,
  Activity
} from 'lucide-react';
import { Branch, Warehouse, UserAccount } from '../../types';
import { DashboardFilterOptions } from '../../services/dashboardViewModel';
import { useLanguage } from '../../i18n';

interface ExecutiveHeaderProps {
  filters: DashboardFilterOptions;
  onFilterChange: (newFilters: Partial<DashboardFilterOptions>) => void;
  branches: Branch[];
  warehouses: Warehouse[];
  currentUser?: UserAccount | null;
  onRefresh: () => void;
  isRefreshing?: boolean;
  onOpenAdvancedFilter?: () => void;
}

export const ExecutiveHeader: React.FC<ExecutiveHeaderProps> = ({
  filters,
  onFilterChange,
  branches,
  warehouses,
  currentUser,
  onRefresh,
  isRefreshing = false,
  onOpenAdvancedFilter
}) => {
  const { t } = useLanguage();

  const periodTabs: Array<{ id: DashboardFilterOptions['timePeriod']; label: string }> = [
    { id: 'today', label: t('dashboard.periods.today') },
    { id: '7days', label: t('dashboard.periods.sevenDays') },
    { id: 'month', label: t('dashboard.periods.month') },
    { id: 'quarter', label: t('dashboard.periods.quarter') },
    { id: 'year', label: t('dashboard.periods.year') },
    { id: 'custom', label: t('dashboard.periods.custom') }
  ];

  // RBAC scope check for branch dropdown
  const isBranchScoped =
    currentUser?.dataScope === 'division' &&
    currentUser.branchId &&
    currentUser.role !== 'super_admin' &&
    currentUser.role !== 'admin' &&
    currentUser.role !== 'ceo';

  const getScopeName = () => {
    if (currentUser?.dataScope === 'company_wide' || !currentUser?.dataScope) {
      return t('dashboard.scopeCompanyWide');
    }
    if (currentUser?.dataScope === 'division') {
      return `${t('dashboard.scopeDivision')} ${currentUser.branchId || ''}`;
    }
    return t('dashboard.scopeIndividual');
  };

  return (
    <div id="executive-dashboard-header" className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3.5 sticky top-0 z-20 shadow-xs">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
        {/* Left: Title & Live status indicator */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs shrink-0">
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                {t('dashboard.executiveTitle')}
              </h1>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                {t('dashboard.liveBadge')}
              </span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              {currentUser?.tenantName || 'BizOne Enterprise'} • {t('dashboard.scopeLabel')}{' '}
              <strong className="text-slate-800">{getScopeName()}</strong>
            </p>
          </div>
        </div>

        {/* Right: Period Selector, Scopes & Refresh */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Period Tabs */}
          <div className="inline-flex p-0.5 bg-slate-100 rounded-lg border border-slate-200/80 overflow-x-auto max-w-full">
            {periodTabs.map((tab) => {
              const active = filters.timePeriod === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`period-tab-${tab.id}`}
                  onClick={() => onFilterChange({ timePeriod: tab.id })}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition whitespace-nowrap cursor-pointer ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Branch Selector */}
          {!isBranchScoped && (
            <div className="relative">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 transition">
                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                <select
                  id="select-dashboard-branch"
                  value={filters.branchId || 'ALL'}
                  onChange={(e) => onFilterChange({ branchId: e.target.value })}
                  className="bg-transparent outline-none cursor-pointer pr-1 text-xs font-medium text-slate-800"
                >
                  <option value="ALL">{t('dashboard.allBranches')}</option>
                  {branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}

          {/* Warehouse Selector */}
          <div className="relative">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs hover:border-slate-300 transition">
              <WarehouseIcon className="w-3.5 h-3.5 text-slate-400" />
              <select
                id="select-dashboard-warehouse"
                value={filters.warehouseId || 'ALL'}
                onChange={(e) => onFilterChange({ warehouseId: e.target.value })}
                className="bg-transparent outline-none cursor-pointer pr-1 text-xs font-medium text-slate-800"
              >
                <option value="ALL">{t('dashboard.allWarehouses')}</option>
                {warehouses.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Refresh Button */}
          <button
            id="btn-refresh-dashboard"
            onClick={onRefresh}
            disabled={isRefreshing}
            title={t('dashboard.refreshTooltip')}
            aria-label={t('dashboard.refreshTooltip')}
            className="p-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg shadow-2xs transition cursor-pointer disabled:opacity-50 min-h-[32px] min-w-[32px] flex items-center justify-center"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-slate-900' : 'text-slate-600'}`} />
          </button>

          {/* Advanced Filter Builder button */}
          {onOpenAdvancedFilter && (
            <button
              id="btn-advanced-filter"
              onClick={onOpenAdvancedFilter}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs transition cursor-pointer min-h-[32px]"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
              <span className="hidden sm:inline">{t('dashboard.advancedFilter')}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
