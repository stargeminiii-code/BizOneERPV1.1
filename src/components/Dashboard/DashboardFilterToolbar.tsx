import React, { useState } from 'react';
import {
  Calendar,
  Filter,
  RefreshCw,
  X,
  Warehouse as WarehouseIcon,
  Tag,
  Boxes,
  Building2,
  MapPin,
  Clock,
  Layers,
  Sparkles,
  ChevronDown,
  Users,
  Store
} from 'lucide-react';
import {
  DashboardFilterState,
  TimeFilterMode,
  Warehouse,
  Product,
  Supplier,
  Branch,
  Customer
} from '../../types';

interface DashboardFilterToolbarProps {
  filters?: DashboardFilterState;
  filterState?: DashboardFilterState;
  onFilterChange?: (newFilters: DashboardFilterState) => void;
  onChangeFilter?: (newFilters: DashboardFilterState) => void;
  branches?: Branch[];
  warehouses?: Warehouse[];
  products?: Product[];
  suppliers?: Supplier[];
  customers?: Customer[];
  onRefresh?: () => void;
}

const defaultFilters: DashboardFilterState = {
  timeMode: 'realtime',
  timeRange: 'today',
  branchId: 'ALL',
  warehouseId: 'ALL',
  categoryId: 'ALL',
  brandId: 'ALL',
  sku: 'ALL',
  supplierId: 'ALL',
  customerId: 'ALL',
  locationZone: 'ALL'
};

export const DashboardFilterToolbar: React.FC<DashboardFilterToolbarProps> = ({
  filters,
  filterState,
  onFilterChange,
  onChangeFilter,
  branches = [],
  warehouses = [],
  products = [],
  suppliers = [],
  customers = [],
  onRefresh
}) => {
  // Merge and fallback
  const activeFilters: DashboardFilterState = {
    ...defaultFilters,
    ...(filterState || filters || {})
  };

  const handleUpdate = (updated: DashboardFilterState) => {
    if (onChangeFilter) onChangeFilter(updated);
    if (onFilterChange) onFilterChange(updated);
  };

  const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);
  const [customStart, setCustomStart] = useState(activeFilters.customStartDate || '2026-08-01');
  const [customEnd, setCustomEnd] = useState(activeFilters.customEndDate || '2026-08-16');

  // Extract unique categories and brands
  const categories = Array.from(new Set(products.map((p) => p.category).filter(Boolean))) as string[];
  const brands = Array.from(new Set(products.map((p) => p.brand).filter(Boolean))) as string[];

  const timeModes: Array<{ key: TimeFilterMode; label: string }> = [
    { key: 'realtime', label: '⚡ Realtime' },
    { key: 'today', label: 'Hôm nay' },
    { key: 'day', label: 'Ngày' },
    { key: 'week', label: 'Tuần này' },
    { key: 'month', label: 'Tháng 08/2026' },
    { key: 'quarter', label: 'Quý 3/2026' },
    { key: 'year', label: 'Năm 2026' },
    { key: 'custom', label: 'Tùy chọn...' }
  ];

  const handleTimeModeChange = (mode: TimeFilterMode) => {
    if (mode === 'custom') {
      setShowCustomRangeModal(true);
      return;
    }
    handleUpdate({
      ...activeFilters,
      timeMode: mode,
      timeRange: mode === 'today' ? 'today' : mode === 'week' ? '7days' : mode === 'month' ? '30days' : mode,
      selectedDate: mode === 'day' ? '2026-08-16' : undefined,
      selectedMonth: mode === 'month' ? '2026-08' : undefined,
      selectedQuarter: mode === 'quarter' ? 'Q3-2026' : undefined,
      selectedYear: mode === 'year' ? '2026' : undefined
    });
  };

  const applyCustomRange = () => {
    handleUpdate({
      ...activeFilters,
      timeMode: 'custom',
      timeRange: 'custom',
      customStartDate: customStart,
      customEndDate: customEnd
    });
    setShowCustomRangeModal(false);
  };

  const handleResetFilters = () => {
    handleUpdate({
      ...defaultFilters
    });
  };

  const hasActiveFilters =
    (activeFilters.timeMode && activeFilters.timeMode !== 'realtime') ||
    (activeFilters.branchId && activeFilters.branchId !== 'ALL') ||
    (activeFilters.warehouseId && activeFilters.warehouseId !== 'ALL') ||
    (activeFilters.categoryId && activeFilters.categoryId !== 'ALL') ||
    (activeFilters.brandId && activeFilters.brandId !== 'ALL') ||
    (activeFilters.sku && activeFilters.sku !== 'ALL') ||
    (activeFilters.supplierId && activeFilters.supplierId !== 'ALL') ||
    (activeFilters.customerId && activeFilters.customerId !== 'ALL') ||
    (activeFilters.locationZone && activeFilters.locationZone !== 'ALL');

  const getSelectedWarehouseName = () => {
    if (!activeFilters.warehouseId || activeFilters.warehouseId === 'ALL') return 'Tất cả Kho';
    return warehouses.find((w) => w.id === activeFilters.warehouseId)?.name || activeFilters.warehouseId;
  };

  const getSelectedBranchName = () => {
    if (!activeFilters.branchId || activeFilters.branchId === 'ALL') return 'Tất cả Chi nhánh';
    return branches.find((b) => b.id === activeFilters.branchId)?.name || activeFilters.branchId;
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-4 space-y-3.5 transition-all">
      {/* Row 1: Time Filter Tabs & Realtime Indicator */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-bold text-slate-500 flex items-center gap-1 mr-1">
            <Clock className="w-3.5 h-3.5 text-blue-600" />
            Thời gian:
          </span>
          <div className="flex items-center gap-1 bg-slate-100/90 p-1 rounded-xl flex-wrap">
            {timeModes.map((tm) => {
              const active = activeFilters.timeMode === tm.key;
              return (
                <button
                  key={tm.key}
                  onClick={() => handleTimeModeChange(tm.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
                    active
                      ? 'bg-blue-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  {tm.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(!activeFilters.timeMode || activeFilters.timeMode === 'realtime') && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Đồng bộ Realtime FIFO
            </span>
          )}
          {activeFilters.timeMode === 'custom' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
              <Calendar className="w-3.5 h-3.5" />
              {activeFilters.customStartDate} → {activeFilters.customEndDate}
            </span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition cursor-pointer"
              title="Làm mới dữ liệu tức thì"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Row 2: Multi-criteria Select Dropdowns */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-7 gap-2.5">
        {/* Chi nhánh */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Store className="w-3 h-3 text-indigo-600" />
            Chi nhánh
          </label>
          <select
            value={activeFilters.branchId || 'ALL'}
            onChange={(e) => handleUpdate({ ...activeFilters, branchId: e.target.value })}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">🏪 Tất cả chi nhánh</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </div>

        {/* Kho hàng */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <WarehouseIcon className="w-3 h-3 text-blue-600" />
            Kho hàng
          </label>
          <select
            value={activeFilters.warehouseId || 'ALL'}
            onChange={(e) => handleUpdate({ ...activeFilters, warehouseId: e.target.value })}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">🏢 Tất cả kho</option>
            {warehouses.map((w) => (
              <option key={w.id} value={w.id}>
                {w.name}
              </option>
            ))}
          </select>
        </div>

        {/* Nhóm ngành hàng */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Tag className="w-3 h-3 text-amber-600" />
            Ngành hàng
          </label>
          <select
            value={activeFilters.categoryId || 'ALL'}
            onChange={(e) => handleUpdate({ ...activeFilters, categoryId: e.target.value })}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">📦 Tất cả ngành</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        {/* Thương hiệu (Brand) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Boxes className="w-3 h-3 text-emerald-600" />
            Thương hiệu
          </label>
          <select
            value={activeFilters.brandId || 'ALL'}
            onChange={(e) => handleUpdate({ ...activeFilters, brandId: e.target.value })}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">🏷️ Tất cả Brand</option>
            {brands.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>

        {/* Nhà cung cấp */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Building2 className="w-3 h-3 text-purple-600" />
            Nhà cung cấp
          </label>
          <select
            value={activeFilters.supplierId || 'ALL'}
            onChange={(e) => handleUpdate({ ...activeFilters, supplierId: e.target.value })}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">🏭 Tất cả NCC</option>
            {suppliers.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        {/* Khách hàng */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-500 uppercase flex items-center gap-1">
            <Users className="w-3 h-3 text-teal-600" />
            Khách hàng
          </label>
          <select
            value={activeFilters.customerId || 'ALL'}
            onChange={(e) => handleUpdate({ ...activeFilters, customerId: e.target.value })}
            className="w-full text-xs font-semibold bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="ALL">👥 Tất cả Khách</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Reset Action */}
        <div className="space-y-1 flex flex-col justify-end">
          <button
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
            className={`w-full text-xs font-bold py-1.5 px-3 rounded-xl border flex items-center justify-center gap-1.5 transition ${
              hasActiveFilters
                ? 'bg-rose-50 border-rose-200 text-rose-700 hover:bg-rose-100 cursor-pointer'
                : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70'
            }`}
          >
            <X className="w-3.5 h-3.5" />
            Xóa lọc
          </button>
        </div>
      </div>

      {/* Row 3: Active Filter Badges */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-400">Đang lọc theo:</span>
          {activeFilters.timeMode && activeFilters.timeMode !== 'realtime' && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1">
              Thời gian: {activeFilters.timeMode}
            </span>
          )}
          {activeFilters.branchId && activeFilters.branchId !== 'ALL' && (
            <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200 font-semibold flex items-center gap-1">
              Chi nhánh: {getSelectedBranchName()}
              <button
                onClick={() => handleUpdate({ ...activeFilters, branchId: 'ALL' })}
                className="hover:text-rose-600 ml-1 cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
          {activeFilters.warehouseId && activeFilters.warehouseId !== 'ALL' && (
            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 font-semibold flex items-center gap-1">
              Kho: {getSelectedWarehouseName()}
              <button
                onClick={() => handleUpdate({ ...activeFilters, warehouseId: 'ALL' })}
                className="hover:text-rose-600 ml-1 cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
          {activeFilters.categoryId && activeFilters.categoryId !== 'ALL' && (
            <span className="px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200 font-semibold flex items-center gap-1">
              Ngành: {activeFilters.categoryId}
              <button
                onClick={() => handleUpdate({ ...activeFilters, categoryId: 'ALL' })}
                className="hover:text-rose-600 ml-1 cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
          {activeFilters.brandId && activeFilters.brandId !== 'ALL' && (
            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 font-semibold flex items-center gap-1">
              Brand: {activeFilters.brandId}
              <button
                onClick={() => handleUpdate({ ...activeFilters, brandId: 'ALL' })}
                className="hover:text-rose-600 ml-1 cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
          {activeFilters.supplierId && activeFilters.supplierId !== 'ALL' && (
            <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold flex items-center gap-1">
              NCC: {suppliers.find((s) => s.id === activeFilters.supplierId)?.name || activeFilters.supplierId}
              <button
                onClick={() => handleUpdate({ ...activeFilters, supplierId: 'ALL' })}
                className="hover:text-rose-600 ml-1 cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
          {activeFilters.customerId && activeFilters.customerId !== 'ALL' && (
            <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 font-semibold flex items-center gap-1">
              Khách: {customers.find((c) => c.id === activeFilters.customerId)?.name || activeFilters.customerId}
              <button
                onClick={() => handleUpdate({ ...activeFilters, customerId: 'ALL' })}
                className="hover:text-rose-600 ml-1 cursor-pointer"
              >
                ×
              </button>
            </span>
          )}
        </div>
      )}

      {/* Modal / Dialog for Custom Date Range */}
      {showCustomRangeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-blue-600" />
                Chọn khoảng thời gian tùy chỉnh
              </h3>
              <button
                onClick={() => setShowCustomRangeModal(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Từ ngày:</label>
                <input
                  type="date"
                  value={customStart}
                  onChange={(e) => setCustomStart(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-600">Đến ngày:</label>
                <input
                  type="date"
                  value={customEnd}
                  onChange={(e) => setCustomEnd(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowCustomRangeModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={applyCustomRange}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition cursor-pointer"
              >
                Áp dụng bộ lọc
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
