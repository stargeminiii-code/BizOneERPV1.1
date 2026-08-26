import React, { useState, useMemo, useCallback } from 'react';
import {
  DashboardMetrics,
  DiagnosisInsight,
  Order,
  Product,
  Customer,
  InventoryLayer,
  StockTransaction,
  Warehouse,
  Branch,
  Supplier,
  PurchaseOrder,
  CrmTask,
  CashTransaction,
  UserAccount
} from '../types';
import {
  calculateDashboardViewModel,
  DashboardFilterOptions
} from '../services/dashboardViewModel';
import { ExecutiveHeader } from './Dashboard/ExecutiveHeader';
import { ExecutiveKpiStrip } from './Dashboard/ExecutiveKpiStrip';
import { ExecutiveQuickActions } from './Dashboard/ExecutiveQuickActions';
import { ExecutiveRevenueOrdersChart } from './Dashboard/ExecutiveRevenueOrdersChart';
import { ExecutiveChannelPerformance } from './Dashboard/ExecutiveChannelPerformance';
import { ExecutiveProductPerformance } from './Dashboard/ExecutiveProductPerformance';
import { ExecutiveInventorySnapshot } from './Dashboard/ExecutiveInventorySnapshot';
import { ExecutiveFinanceMarketplace } from './Dashboard/ExecutiveFinanceMarketplace';
import { ExecutiveCrmSnapshot } from './Dashboard/ExecutiveCrmSnapshot';
import { ExecutiveAlertCenter } from './Dashboard/ExecutiveAlertCenter';
import { FilterBuilderModal, GlobalFilterState } from './Dashboard/FilterBuilderModal';
import { DashboardDetailDrawer, DetailDrawerState } from './Dashboard/DashboardDetailDrawer';

interface DashboardViewProps {
  metrics?: DashboardMetrics;
  insights?: DiagnosisInsight[];
  orders: Order[];
  products?: Product[];
  inventoryLots?: InventoryLayer[];
  stockTransactions?: StockTransaction[];
  warehouses?: Warehouse[];
  branches?: Branch[];
  suppliers?: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  customers?: Customer[];
  crmTasks?: CrmTask[];
  cashTransactions?: CashTransaction[];
  users?: UserAccount[];
  currentUser?: UserAccount;
  onNavigateToView?: (view: string, filter?: string) => void;
  onOpenCreatePO: (productName?: string) => void;
  onOpenCrmTask: (customerName?: string) => void;
  onViewAllOrders: () => void;
  onSelectOrder: (order: Order) => void;
  onRefreshDiagnosis: () => void;
  isDiagnosing: boolean;
  onOpenVietQrModal: (order: Order) => void;
  onEditProduct?: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders = [],
  products = [],
  inventoryLots = [],
  warehouses = [],
  branches = [],
  suppliers = [],
  purchaseOrders = [],
  customers = [],
  crmTasks = [],
  cashTransactions = [],
  users = [],
  currentUser,
  onNavigateToView,
  onSelectOrder,
  onOpenCrmTask,
  onOpenCreatePO,
  onViewAllOrders,
  onRefreshDiagnosis,
  isDiagnosing,
  onOpenVietQrModal,
  onEditProduct
}) => {
  // 1. Dashboard Filters State
  const [filters, setFilters] = useState<DashboardFilterOptions>({
    timePeriod: 'month',
    branchId: 'ALL',
    warehouseId: 'ALL',
    chartGranularity: 'day'
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isAdvancedFilterOpen, setIsAdvancedFilterOpen] = useState(false);
  const [activeDetail, setActiveDetail] = useState<DetailDrawerState | null>(null);

  const handleFilterChange = useCallback((newFilters: Partial<DashboardFilterOptions>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    onRefreshDiagnosis();
    setTimeout(() => {
      setIsRefreshing(false);
    }, 400);
  }, [onRefreshDiagnosis]);

  // 2. Calculate Unified ViewModel (Single Source of Truth)
  const viewModel = useMemo(() => {
    return calculateDashboardViewModel({
      orders,
      products,
      inventoryLots,
      customers,
      cashTransactions,
      purchaseOrders,
      warehouses,
      suppliers,
      currentUser,
      filters
    });
  }, [
    orders,
    products,
    inventoryLots,
    customers,
    cashTransactions,
    purchaseOrders,
    warehouses,
    suppliers,
    currentUser,
    filters
  ]);

  // Navigation Helpers
  const handleNav = (view: string, filter?: string) => {
    if (onNavigateToView) {
      onNavigateToView(view, filter);
    }
  };

  return (
    <div id="executive-business-dashboard-container" className="min-h-screen bg-slate-50/60 pb-16">
      {/* 1. Header Toolbar with Scopes and Period Selection */}
      <ExecutiveHeader
        filters={filters}
        onFilterChange={handleFilterChange}
        branches={branches}
        warehouses={warehouses}
        currentUser={currentUser}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing || isDiagnosing}
        onOpenAdvancedFilter={() => setIsAdvancedFilterOpen(true)}
      />

      {/* Main Content Area */}
      <div className="p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-[1680px] mx-auto">
        {/* 2. Quick Actions Strip */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
          <ExecutiveQuickActions
            currentUser={currentUser}
            onOpenCreateOrder={onViewAllOrders}
            onOpenPos={() => handleNav('pos')}
            onOpenCreatePO={() => onOpenCreatePO()}
            onNavigateToInventory={() => handleNav('inventory')}
            onNavigateToCrm={() => handleNav('crm')}
          />
        </div>

        {/* 3. Primary KPI Strip (4 Core Cards) */}
        <ExecutiveKpiStrip
          kpis={viewModel.kpis}
          onSelectRevenue={() => setActiveDetail({ type: 'revenue' })}
          onSelectOrders={() => setActiveDetail({ type: 'orders' })}
          onSelectGrossProfit={() => setActiveDetail({ type: 'gross_profit' })}
          onSelectCash={() => setActiveDetail({ type: 'cash' })}
          onNavigateToOrders={() => setActiveDetail({ type: 'orders' })}
          onNavigateToFinance={() => setActiveDetail({ type: 'gross_profit' })}
          onNavigateToCashflow={() => setActiveDetail({ type: 'cash' })}
        />

        {/* 4. Revenue & Orders Trend Chart */}
        <ExecutiveRevenueOrdersChart
          data={viewModel.revenueChart.data}
          totalRevenue={viewModel.revenueChart.totalRevenue}
          totalOrders={viewModel.revenueChart.totalOrders}
          averageOrderValue={viewModel.revenueChart.averageOrderValue}
          granularity={viewModel.revenueChart.granularity}
          onGranularityChange={(g) => handleFilterChange({ chartGranularity: g })}
          onViewAllOrders={() => setActiveDetail({ type: 'revenue' })}
        />

        {/* 6. Channel Performance (13 Omni-channels) */}
        <ExecutiveChannelPerformance
          channels={viewModel.channels}
          onSelectChannel={(chId) => setActiveDetail({ type: 'channel', channelId: chId })}
        />

        {/* 7. Product Performance (Top 5) */}
        <ExecutiveProductPerformance
          products={viewModel.products}
          onNavigateToProducts={() => setActiveDetail({ type: 'inventory' })}
          onSelectProduct={(sku) => setActiveDetail({ type: 'product', sku })}
        />

        {/* 8. Inventory Snapshot & FIFO Aging (7 Buckets) */}
        <ExecutiveInventorySnapshot
          inventory={viewModel.inventory}
          onNavigateToInventory={() => setActiveDetail({ type: 'inventory' })}
          onNavigateToFifoLots={() => setActiveDetail({ type: 'fifo_aging' })}
        />

        {/* 9. Finance & Marketplace Reconciliation */}
        <ExecutiveFinanceMarketplace
          finance={viewModel.finance}
          marketplaceFinance={viewModel.marketplaceFinance}
          onNavigateToFinance={() => setActiveDetail({ type: 'gross_profit' })}
          onNavigateToDebtReceivables={() => setActiveDetail({ type: 'debt' })}
        />

        {/* 10. CRM & Alert Center (2-Column Grid) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          <ExecutiveCrmSnapshot
            crm={viewModel.crm}
            onNavigateToCrm={() => handleNav('crm')}
          />
          <ExecutiveAlertCenter
            alerts={viewModel.alerts}
            onNavigateToModule={() => setActiveDetail({ type: 'alerts' })}
          />
        </div>
      </div>

      {/* Dashboard Detail Drill-down Drawer */}
      <DashboardDetailDrawer
        detail={activeDetail}
        onClose={() => setActiveDetail(null)}
        viewModel={viewModel}
        orders={orders}
        products={products}
        customers={customers}
        inventoryLots={inventoryLots}
        cashTransactions={cashTransactions}
        onNavigateToModule={handleNav}
      />

      {/* Advanced Filter Modal */}
      {isAdvancedFilterOpen && (
        <FilterBuilderModal
          isOpen={isAdvancedFilterOpen}
          onClose={() => setIsAdvancedFilterOpen(false)}
          currentFilter={{
            timePeriod: filters.timePeriod === 'month' ? 'this_month' : filters.timePeriod === 'quarter' ? 'this_quarter' : filters.timePeriod === 'year' ? 'this_year' : filters.timePeriod === '7days' ? '7days' : 'today',
            branchId: filters.branchId || 'ALL',
            warehouseId: filters.warehouseId || 'ALL',
            businessModels: [],
            channel: 'ALL',
            productGroup: 'ALL',
            customConditions: []
          }}
          onApplyFilter={(applied: GlobalFilterState) => {
            const mappedPeriod: DashboardFilterOptions['timePeriod'] =
              applied.timePeriod === 'this_month'
                ? 'month'
                : applied.timePeriod === 'this_quarter'
                ? 'quarter'
                : applied.timePeriod === 'this_year'
                ? 'year'
                : applied.timePeriod === '7days'
                ? '7days'
                : 'today';

            handleFilterChange({
              timePeriod: mappedPeriod,
              branchId: applied.branchId || 'ALL',
              warehouseId: applied.warehouseId || 'ALL'
            });
            setIsAdvancedFilterOpen(false);
          }}
        />
      )}
    </div>
  );
};
