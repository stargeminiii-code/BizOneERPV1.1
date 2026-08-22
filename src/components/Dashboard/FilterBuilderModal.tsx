import React, { useState } from 'react';
import {
  X,
  Plus,
  Trash2,
  Filter,
  Check,
  RotateCcw,
  Sparkles,
  Layers,
  Bookmark
} from 'lucide-react';

export interface FilterCondition {
  id: string;
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
  value: string;
}

export interface GlobalFilterState {
  timePeriod: 'today' | 'yesterday' | '7days' | '30days' | 'this_month' | 'this_quarter' | 'this_year';
  branchId: string;
  warehouseId: string;
  businessModels: string[]; // 'retail' | 'wholesale' | 'online' | 'fnb'
  channel: string;
  productGroup: string;
  customConditions: FilterCondition[];
}

interface FilterBuilderModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilter: GlobalFilterState;
  onApplyFilter: (newFilter: GlobalFilterState) => void;
}

export const FILTER_FIELD_OPTIONS = [
  { value: 'revenue', label: 'Doanh thu đơn hàng (VNĐ)', type: 'number' },
  { value: 'branch', label: 'Chi nhánh bán hàng', type: 'select' },
  { value: 'warehouse', label: 'Kho xuất hàng', type: 'select' },
  { value: 'businessModel', label: 'Mô hình kinh doanh', type: 'select' },
  { value: 'salesChannel', label: 'Kênh bán (POS / Shopee / TikTok / Web)', type: 'select' },
  { value: 'productCategory', label: 'Nhóm sản phẩm', type: 'select' },
  { value: 'orderStatus', label: 'Trạng thái đơn hàng', type: 'select' },
  { value: 'paymentMethod', label: 'Phương thức thanh toán', type: 'select' }
];

export const OPERATOR_OPTIONS = [
  { value: 'equals', label: 'Bằng (=)' },
  { value: 'not_equals', label: 'Khác (!=)' },
  { value: 'greater_than', label: 'Lớn hơn (>)' },
  { value: 'less_than', label: 'Nhỏ hơn (<)' },
  { value: 'contains', label: 'Chứa ký tự' },
  { value: 'in', label: 'Nằm trong danh sách' }
];

export const FilterBuilderModal: React.FC<FilterBuilderModalProps> = ({
  isOpen,
  onClose,
  currentFilter,
  onApplyFilter
}) => {
  const [filterState, setFilterState] = useState<GlobalFilterState>(currentFilter);

  if (!isOpen) return null;

  const handleAddCondition = () => {
    const newCond: FilterCondition = {
      id: `cond-${Date.now()}`,
      field: 'revenue',
      operator: 'greater_than',
      value: '1000000'
    };
    setFilterState((prev) => ({
      ...prev,
      customConditions: [...prev.customConditions, newCond]
    }));
  };

  const handleRemoveCondition = (id: string) => {
    setFilterState((prev) => ({
      ...prev,
      customConditions: prev.customConditions.filter((c) => c.id !== id)
    }));
  };

  const handleUpdateCondition = (id: string, updates: Partial<FilterCondition>) => {
    setFilterState((prev) => ({
      ...prev,
      customConditions: prev.customConditions.map((c) => (c.id === id ? { ...c, ...updates } : c))
    }));
  };

  const handleApplyPreset = (presetName: string) => {
    if (presetName === 'ceo') {
      setFilterState({
        timePeriod: 'this_month',
        branchId: 'ALL',
        warehouseId: 'ALL',
        businessModels: ['retail', 'wholesale', 'online', 'fnb'],
        channel: 'ALL',
        productGroup: 'ALL',
        customConditions: []
      });
    } else if (presetName === 'retail_today') {
      setFilterState({
        timePeriod: 'today',
        branchId: 'ALL',
        warehouseId: 'ALL',
        businessModels: ['retail'],
        channel: 'pos',
        productGroup: 'ALL',
        customConditions: []
      });
    } else if (presetName === 'online_month') {
      setFilterState({
        timePeriod: 'this_month',
        branchId: 'ALL',
        warehouseId: 'ALL',
        businessModels: ['online'],
        channel: 'shopee',
        productGroup: 'ALL',
        customConditions: []
      });
    } else if (presetName === 'fnb_beverages') {
      setFilterState({
        timePeriod: 'this_month',
        branchId: 'ALL',
        warehouseId: 'ALL',
        businessModels: ['fnb'],
        channel: 'ALL',
        productGroup: 'beverages',
        customConditions: []
      });
    }
  };

  const handleReset = () => {
    setFilterState({
      timePeriod: 'this_month',
      branchId: 'ALL',
      warehouseId: 'ALL',
      businessModels: ['retail', 'wholesale', 'online', 'fnb'],
      channel: 'ALL',
      productGroup: 'ALL',
      customConditions: []
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs font-['Plus_Jakarta_Sans',sans-serif]">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-xl">
              <Filter className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900">BỘ LỌC ĐA CHIỀU TỰ CHỌN (FILTER BUILDER)</h2>
              <p className="text-xs text-slate-500">Tùy biến điều kiện lọc động tác động toàn bộ 12 chỉ số KPI và biểu đồ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        <div className="space-y-2">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Bookmark className="w-3.5 h-3.5 text-indigo-500" />
            Mẫu lọc nhanh (Presets):
          </div>
          <div className="flex items-center gap-2 flex-wrap text-xs">
            <button
              onClick={() => handleApplyPreset('ceo')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 font-bold rounded-xl border border-slate-200 transition-colors"
            >
              📊 Toàn Doanh Nghiệp (CEO)
            </button>
            <button
              onClick={() => handleApplyPreset('retail_today')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 font-bold rounded-xl border border-slate-200 transition-colors"
            >
              🏪 Bán Lẻ POS Hôm Nay
            </button>
            <button
              onClick={() => handleApplyPreset('online_month')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-purple-50 hover:text-purple-700 font-bold rounded-xl border border-slate-200 transition-colors"
            >
              🌐 Online TMĐT Tháng Này
            </button>
            <button
              onClick={() => handleApplyPreset('fnb_beverages')}
              className="px-3 py-1.5 bg-slate-100 hover:bg-amber-50 hover:text-amber-700 font-bold rounded-xl border border-slate-200 transition-colors"
            >
              ☕ F&B & Đồ Uống Pha Chế
            </button>
          </div>
        </div>

        {/* Base Filter Dimensions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-100">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Thời gian</label>
            <select
              value={filterState.timePeriod}
              onChange={(e) => setFilterState({ ...filterState, timePeriod: e.target.value as any })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
            >
              <option value="today">Hôm nay</option>
              <option value="yesterday">Hôm qua</option>
              <option value="7days">7 ngày qua</option>
              <option value="30days">30 ngày qua</option>
              <option value="this_month">Tháng này</option>
              <option value="this_quarter">Quý này</option>
              <option value="this_year">Năm nay</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Chi nhánh</label>
            <select
              value={filterState.branchId}
              onChange={(e) => setFilterState({ ...filterState, branchId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
            >
              <option value="ALL">Tất cả chi nhánh</option>
              <option value="BR01">Chi nhánh Hà Nội (Trụ sở)</option>
              <option value="BR02">Chi nhánh TP.HCM</option>
              <option value="BR03">Chi nhánh Đà Nẵng</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Kho xuất hàng</label>
            <select
              value={filterState.warehouseId}
              onChange={(e) => setFilterState({ ...filterState, warehouseId: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
            >
              <option value="ALL">Tất cả các kho</option>
              <option value="WH01">Kho Tổng Hà Nội</option>
              <option value="WH02">Kho Tổng TP.HCM</option>
              <option value="WH03">Kho Phụ Long Biên</option>
            </select>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Kênh bán hàng</label>
            <select
              value={filterState.channel}
              onChange={(e) => setFilterState({ ...filterState, channel: e.target.value })}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2 font-semibold text-slate-800"
            >
              <option value="ALL">Tất cả kênh bán</option>
              <option value="pos">Cửa Hàng / POS Thu Ngân</option>
              <option value="shopee">Shopee Mall</option>
              <option value="tiktok">TikTok Shop</option>
              <option value="website">Website Online</option>
              <option value="meta">Facebook / Fanpage</option>
            </select>
          </div>
        </div>

        {/* Dynamic Condition Builder Section */}
        <div className="space-y-3 pt-2 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Điều kiện nâng cao ({filterState.customConditions.length})
            </span>
            <button
              onClick={handleAddCondition}
              className="px-2.5 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold rounded-lg text-xs flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm dòng điều kiện
            </button>
          </div>

          {filterState.customConditions.length === 0 ? (
            <div className="text-center py-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-xs text-slate-400">
              Chưa có điều kiện nâng cao nào được thêm. Bấm "+ Thêm dòng điều kiện" để tạo quy tắc lọc tùy ý.
            </div>
          ) : (
            <div className="space-y-2">
              {filterState.customConditions.map((cond) => (
                <div key={cond.id} className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 text-xs">
                  <select
                    value={cond.field}
                    onChange={(e) => handleUpdateCondition(cond.id, { field: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 flex-1"
                  >
                    {FILTER_FIELD_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>

                  <select
                    value={cond.operator}
                    onChange={(e) => handleUpdateCondition(cond.id, { operator: e.target.value as any })}
                    className="bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 w-36"
                  >
                    {OPERATOR_OPTIONS.map((op) => (
                      <option key={op.value} value={op.value}>{op.label}</option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={cond.value}
                    onChange={(e) => handleUpdateCondition(cond.id, { value: e.target.value })}
                    placeholder="Giá trị lọc..."
                    className="bg-white border border-slate-200 rounded-lg p-1.5 font-semibold text-slate-800 flex-1"
                  />

                  <button
                    onClick={() => handleRemoveCondition(cond.id)}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    title="Xóa điều kiện"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-100">
          <button
            onClick={handleReset}
            className="px-3.5 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" /> Đặt lại mặc định
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl"
            >
              Hủy
            </button>
            <button
              onClick={() => {
                onApplyFilter(filterState);
                onClose();
              }}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Check className="w-4 h-4" /> Áp Dụng Bộ Lọc
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
