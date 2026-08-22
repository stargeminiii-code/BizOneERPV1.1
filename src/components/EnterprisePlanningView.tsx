import React, { useState, useMemo } from 'react';
import {
  FileText,
  Target,
  AlertTriangle,
  Award,
  TrendingUp,
  Plus,
  Filter,
  Search,
  CheckCircle2,
  Clock,
  UserCheck,
  Building2,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Sliders,
  Calendar,
  Layers,
  ChevronRight,
  Zap,
  BarChart3,
  HelpCircle,
  FolderTree,
  DollarSign,
  ChevronDown,
  Printer,
  FileSpreadsheet
} from 'lucide-react';
import {
  EnterprisePlan,
  KpiDefinition,
  KpiActionPlan,
  PerformanceScorecard,
  WorkCategoryHierarchy,
  EnterpriseSystemAlert,
  EnterpriseForecastItem,
  UserAccount,
  Order,
  Customer,
  CrmTask,
  CashTransaction,
  InventoryLayer,
  PurchaseOrder,
  PlanPeriodGranularity
} from '../types';
import { formatNumberWithDots } from '../data/administrativeData';
import { ROOT_CAUSE_DEFINITIONS, planningKpiEngine } from '../services/planningKpiEngine';
import { EnterprisePlanModal } from './Modals/EnterprisePlanModal';
import { KpiActionAssignModal } from './Modals/KpiActionAssignModal';

interface EnterprisePlanningViewProps {
  plans: EnterprisePlan[];
  setPlans: React.Dispatch<React.SetStateAction<EnterprisePlan[]>>;
  kpis: KpiDefinition[];
  setKpis: React.Dispatch<React.SetStateAction<KpiDefinition[]>>;
  actionPlans: KpiActionPlan[];
  setActionPlans: React.Dispatch<React.SetStateAction<KpiActionPlan[]>>;
  workCategories: WorkCategoryHierarchy[];
  setWorkCategories: React.Dispatch<React.SetStateAction<WorkCategoryHierarchy[]>>;
  alerts: EnterpriseSystemAlert[];
  forecasts: EnterpriseForecastItem[];
  scorecards: PerformanceScorecard[];
  orders?: Order[];
  customers?: Customer[];
  crmTasks?: CrmTask[];
  cashTransactions?: CashTransaction[];
  inventoryLayers?: InventoryLayer[];
  purchaseOrders?: PurchaseOrder[];
  users?: UserAccount[];
  currentUser?: UserAccount;
  onNavigateToTask?: (taskId: string) => void;
  onNavigateToCustomer?: (customerId: string) => void;
}

export const EnterprisePlanningView: React.FC<EnterprisePlanningViewProps> = ({
  plans,
  setPlans,
  kpis,
  setKpis,
  actionPlans,
  setActionPlans,
  workCategories,
  setWorkCategories,
  alerts,
  forecasts,
  scorecards,
  orders = [],
  customers = [],
  crmTasks = [],
  cashTransactions = [],
  inventoryLayers = [],
  purchaseOrders = [],
  users = [],
  currentUser,
  onNavigateToTask,
  onNavigateToCustomer
}) => {
  const [activeTab, setActiveTab] = useState<
    'plans' | 'kpis' | 'actions' | 'scorecards' | 'forecast' | 'work_categories'
  >('plans');

  const [selectedDivision, setSelectedDivision] = useState<string>('all');
  const [selectedGranularity, setSelectedGranularity] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [isPlanModalOpen, setIsPlanModalOpen] = useState<boolean>(false);
  const [editingPlan, setEditingPlan] = useState<EnterprisePlan | null>(null);

  const [isActionModalOpen, setIsActionModalOpen] = useState<boolean>(false);
  const [actionTargetPlan, setActionTargetPlan] = useState<EnterprisePlan | null>(null);

  // Filtered Plans
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchDivision = selectedDivision === 'all' || p.division.toLowerCase().includes(selectedDivision.toLowerCase());
      const matchGranularity = selectedGranularity === 'all' || p.granularity === selectedGranularity;
      const matchSearch =
        !searchTerm ||
        p.planName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.planCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.picName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.department.toLowerCase().includes(searchTerm.toLowerCase());

      return matchDivision && matchGranularity && matchSearch;
    });
  }, [plans, selectedDivision, selectedGranularity, searchTerm]);

  // Overall calculations
  const totalPlannedTarget = useMemo(() => {
    return plans.filter((p) => p.kpiCode === 'KPI_REVENUE').reduce((sum, p) => sum + p.target, 0) || 450000000;
  }, [plans]);

  const totalActualRevenue = useMemo(() => {
    return plans.filter((p) => p.kpiCode === 'KPI_REVENUE').reduce((sum, p) => sum + p.actual, 0) || 382400000;
  }, [plans]);

  const overallAchievement = useMemo(() => {
    return totalPlannedTarget > 0 ? Number(((totalActualRevenue / totalPlannedTarget) * 100).toFixed(1)) : 85.0;
  }, [totalPlannedTarget, totalActualRevenue]);

  const totalGap = useMemo(() => {
    return Math.max(0, totalPlannedTarget - totalActualRevenue);
  }, [totalPlannedTarget, totalActualRevenue]);

  const handleSavePlan = (plan: EnterprisePlan) => {
    setPlans((prev) => {
      const index = prev.findIndex((p) => p.id === plan.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = plan;
        return next;
      }
      return [plan, ...prev];
    });
  };

  const handleSaveAction = (action: KpiActionPlan) => {
    setActionPlans((prev) => [action, ...prev]);

    // Đồng thời cập nhật trạng thái của Kế hoạch tương ứng
    if (action.planId) {
      setPlans((prev) =>
        prev.map((p) => {
          if (p.id === action.planId) {
            return {
              ...p,
              rootCauseCategory: action.rootCauseCategory,
              rootCause: action.rootCause,
              evidence: action.evidence,
              correctiveAction: action.title,
              actionPic: action.picName,
              actionDeadline: action.deadline
            };
          }
          return p;
        })
      );
    }
  };

  const handleOpenActionModal = (plan?: EnterprisePlan) => {
    setActionTargetPlan(plan || null);
    setIsActionModalOpen(true);
  };

  return (
    <div id="enterprise-planning-view" className="space-y-6">
      {/* Header & Core Philosophy Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="space-y-1.5">
            <h1 className="text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>KH & KPI</span>
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => handleOpenActionModal()}
              className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer border border-rose-400/30 hover:scale-[1.02]"
            >
              <AlertTriangle className="w-4 h-4 text-amber-300 animate-pulse" />
              <span>Giao Phương Án Bù (GAP)</span>
            </button>

            <button
              onClick={() => {
                setEditingPlan(null);
                setIsPlanModalOpen(true);
              }}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-lg flex items-center gap-1.5 transition-all cursor-pointer border border-blue-400/30 hover:scale-[1.02]"
            >
              <Plus className="w-4 h-4" />
              <span>Lập Kế Hoạch Mới</span>
            </button>
          </div>
        </div>

        {/* 4 Macro Key Metric Badges */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-slate-800/80">
          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Mục Tiêu Kế Hoạch (Target)</div>
            <div className="text-lg font-black text-white mt-1">
              {formatNumberWithDots(totalPlannedTarget)} <span className="text-xs text-slate-300 font-normal">VNĐ</span>
            </div>
            <div className="text-[10px] text-blue-300 mt-0.5">Phân bổ 4 cấp quản lý</div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Thực Hiện Lũy Kế (Actual)</div>
            <div className="text-lg font-black text-emerald-400 mt-1">
              {formatNumberWithDots(totalActualRevenue)} <span className="text-xs text-slate-300 font-normal">VNĐ</span>
            </div>
            <div className="text-[10px] text-emerald-300 mt-0.5">Tự động đồng bộ ERP</div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="text-[11px] text-slate-400 font-semibold uppercase">Tiến Độ Hoàn Thành</div>
            <div className="text-lg font-black text-amber-300 mt-1 flex items-center gap-1">
              <span>{overallAchievement}%</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-semibold">
                {overallAchievement >= 85 ? 'On-track' : 'Warning'}
              </span>
            </div>
            <div className="text-[10px] text-slate-300 mt-0.5">Điểm chất lượng: 91/100</div>
          </div>

          <div className="bg-white/5 backdrop-blur-xs p-3.5 rounded-xl border border-white/10">
            <div className="text-[11px] text-rose-300 font-semibold uppercase">Khoảng Lệch Cần Bù (GAP)</div>
            <div className="text-lg font-black text-rose-400 mt-1">
              {formatNumberWithDots(totalGap)} <span className="text-xs text-slate-300 font-normal">VNĐ</span>
            </div>
            <div className="text-[10px] text-rose-200 mt-0.5">{actionPlans.length} Action Plans đang chạy</div>
          </div>
        </div>
      </div>

      {/* Primary Module Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('plans')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'plans'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Kế Hoạch Doanh Nghiệp ({plans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('kpis')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'kpis'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Thư Viện KPI 18 Khối ({kpis.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('actions')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'actions'
                ? 'bg-white text-rose-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-rose-600" />
            <span>Giao Việc & Bù Đắp GAP ({actionPlans.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('scorecards')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'scorecards'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Award className="w-3.5 h-3.5 text-amber-500" />
            <span>Bảng Điểm Hiệu Suất 7 Trụ Cột</span>
          </button>

          <button
            onClick={() => setActiveTab('forecast')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'forecast'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
            <span>Dự Báo & Cảnh Báo Sớm</span>
          </button>

          <button
            onClick={() => setActiveTab('work_categories')}
            className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'work_categories'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <FolderTree className="w-3.5 h-3.5" />
            <span>Cây Hạng Mục & Nhóm Việc</span>
          </button>
        </div>

        {/* Global Search & Export */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Tìm mã kế hoạch, KPI, PIC..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs w-48 focus:w-64 focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button
            onClick={() => window.print()}
            title="In / Xuất mẫu BM01.QC11-EWH"
            className="p-2 text-slate-600 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* =========================================================================
          TAB 1: BẢNG KẾ HOẠCH DOANH NGHIỆP (BM01.QC11-EWH)
          ========================================================================= */}
      {activeTab === 'plans' && (
        <div className="space-y-4">
          {/* Quick Filters */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-bold text-slate-700 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-blue-600" />
                <span>Lọc theo Khối:</span>
              </span>
              {['all', 'Kinh Doanh', 'Tài Chính', 'Kho Vận', 'Sản Xuất'].map((div) => (
                <button
                  key={div}
                  onClick={() => setSelectedDivision(div)}
                  className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                    selectedDivision === div
                      ? 'bg-blue-100 text-blue-800 font-bold border border-blue-300'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {div === 'all' ? 'Tất cả Khối' : div}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs">
              <span className="font-bold text-slate-700">Chu kỳ:</span>
              <select
                value={selectedGranularity}
                onChange={(e) => setSelectedGranularity(e.target.value)}
                className="px-2.5 py-1 bg-slate-50 border border-slate-300 rounded-lg font-medium text-slate-700 text-xs"
              >
                <option value="all">Tất cả chu kỳ</option>
                <option value="quarter">Theo Quý</option>
                <option value="month">Theo Tháng</option>
                <option value="week">Theo Tuần</option>
                <option value="day">Theo Ngày</option>
              </select>
            </div>
          </div>

          {/* Plans Table / Cards */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 uppercase font-extrabold text-[11px] tracking-wider">
                    <th className="py-3.5 px-4">Mã & Kế Hoạch</th>
                    <th className="py-3.5 px-4">Cơ Cấu / Phòng Ban</th>
                    <th className="py-3.5 px-4">Người Phụ Trách (PIC)</th>
                    <th className="py-3.5 px-4 text-right">Mục Tiêu (Target)</th>
                    <th className="py-3.5 px-4 text-right">Thực Hiện</th>
                    <th className="py-3.5 px-4 text-center">Tiến Độ (%)</th>
                    <th className="py-3.5 px-4 text-right">Thiếu Hụt (GAP)</th>
                    <th className="py-3.5 px-4 text-center">Dự Báo Kỳ</th>
                    <th className="py-3.5 px-4 text-center">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredPlans.map((plan) => {
                    const isGap = plan.gap > 0;
                    const achievement = plan.achievementRate;

                    return (
                      <tr key={plan.id} className="hover:bg-blue-50/40 transition-colors">
                        {/* Plan Info */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 hover:text-blue-600 transition-colors">
                            {plan.planName}
                          </div>
                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-500">
                            <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-semibold">
                              {plan.planCode}
                            </span>
                            <span>•</span>
                            <span className="text-blue-700 font-medium">{plan.periodLabel}</span>
                          </div>
                          {plan.objective && (
                            <div className="text-[11px] text-slate-600 line-clamp-1 mt-0.5 italic">
                              "{plan.objective}"
                            </div>
                          )}
                        </td>

                        {/* Org Structure */}
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-slate-800">{plan.division}</div>
                          <div className="text-[11px] text-slate-500">{plan.department}</div>
                          {plan.teamName && (
                            <div className="text-[10px] text-indigo-600 font-medium">{plan.teamName}</div>
                          )}
                        </td>

                        {/* PIC */}
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-[10px] font-black">
                              {plan.picName.slice(0, 1)}
                            </div>
                            <span>{plan.picName}</span>
                          </div>
                          <div className="text-[11px] text-slate-500">{plan.ownerRole}</div>
                        </td>

                        {/* Target */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold text-slate-900">
                            {formatNumberWithDots(plan.target)}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase">{plan.unit}</div>
                        </td>

                        {/* Actual */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="font-bold text-blue-700">
                            {formatNumberWithDots(plan.actual)}
                          </div>
                          <div className="text-[10px] text-slate-500 uppercase">{plan.unit}</div>
                        </td>

                        {/* Achievement */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="inline-flex items-center gap-1 font-bold">
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs ${
                                achievement >= 100
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : achievement >= 80
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {achievement}%
                            </span>
                          </div>
                          <div className="w-16 h-1.5 bg-slate-200 rounded-full mx-auto mt-1 overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                achievement >= 100 ? 'bg-emerald-500' : achievement >= 80 ? 'bg-blue-600' : 'bg-rose-500'
                              }`}
                              style={{ width: `${Math.min(100, achievement)}%` }}
                            />
                          </div>
                        </td>

                        {/* GAP */}
                        <td className="py-3.5 px-4 text-right">
                          {isGap ? (
                            <div>
                              <div className="font-extrabold text-rose-600">
                                -{formatNumberWithDots(plan.gap)}
                              </div>
                              <div className="text-[10px] text-rose-500 font-medium">Lệch chỉ tiêu</div>
                            </div>
                          ) : (
                            <div className="text-emerald-600 font-bold flex items-center justify-end gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Đạt chuẩn</span>
                            </div>
                          )}
                        </td>

                        {/* Forecast */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="font-bold text-slate-800">
                            {formatNumberWithDots(plan.forecast)} {plan.unit}
                          </div>
                          <span
                            className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-md mt-0.5 ${
                              plan.forecastStatus === 'on_track'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : plan.forecastStatus === 'warning'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {plan.forecastStatus === 'on_track'
                              ? 'Dự kiến Đạt'
                              : plan.forecastStatus === 'warning'
                              ? 'Có rủi ro lệch'
                              : 'Khẩn cấp'}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            {isGap && (
                              <button
                                onClick={() => handleOpenActionModal(plan)}
                                title="Giao phương án bù đắp GAP"
                                className="px-2 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1"
                              >
                                <Zap className="w-3 h-3 text-rose-600" />
                                <span>Giao Bù</span>
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setEditingPlan(plan);
                                setIsPlanModalOpen(true);
                              }}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                            >
                              Sửa
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 2: THƯ VIỆN KPI 18 KHỐI (4 CHIỀU ĐÁNH GIÁ)
          ========================================================================= */}
      {activeTab === 'kpis' && (
        <div className="space-y-4">
          <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                <Target className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-blue-950">
                  THƯ VIỆN CHỈ TIÊU KPI ĐO LƯỜNG 4 CHIỀU (QUANTITY, ACHIEVEMENT, QUALITY, EFFICIENCY)
                </div>
                <div className="text-blue-800">
                  Tự động tính toán trực tiếp từ các giao dịch bán hàng, công nợ, kho FIFO và tác vụ CRM thực tế.
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kpis.map((kpi) => {
              const res = planningKpiEngine.calculateKpiActual(
                kpi.kpiCode,
                kpi.defaultTarget,
                orders,
                customers,
                crmTasks,
                cashTransactions,
                inventoryLayers,
                purchaseOrders
              );

              return (
                <div
                  key={kpi.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-shadow space-y-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                        {kpi.categoryLabel}
                      </span>
                      <h3 className="font-bold text-slate-900 mt-1.5 text-sm">{kpi.kpiName}</h3>
                      <div className="text-[11px] font-mono text-slate-500 font-semibold">{kpi.kpiCode}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] text-slate-500 uppercase font-semibold">Trọng Số</div>
                      <div className="font-extrabold text-blue-700 text-sm">{kpi.weight}%</div>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 line-clamp-2">{kpi.description}</p>

                  {/* Realtime KPI Progress from Engine */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Mục tiêu mặc định:</span>
                      <span className="font-bold text-slate-800">
                        {formatNumberWithDots(kpi.defaultTarget)} {kpi.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Thực hiện ERP:</span>
                      <span className="font-bold text-blue-700">
                        {formatNumberWithDots(res.actual)} {kpi.unit}
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-1 border-t border-slate-200">
                      <span className="font-semibold text-slate-700">Tỷ lệ đạt (%):</span>
                      <span
                        className={`font-black text-sm ${
                          res.achievementRate >= 100
                            ? 'text-emerald-600'
                            : res.achievementRate >= 80
                            ? 'text-blue-600'
                            : 'text-rose-600'
                        }`}
                      >
                        {res.achievementRate}%
                      </span>
                    </div>
                  </div>

                  {/* 4 Dimension Criteria Grid */}
                  <div className="space-y-1.5 text-[11px]">
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="font-bold text-blue-700">① Số lượng:</span>
                      <span className="text-slate-600 line-clamp-1">{kpi.quantityCriteria}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="font-bold text-emerald-700">② Hoàn thành:</span>
                      <span className="text-slate-600 line-clamp-1">{kpi.achievementCriteria}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="font-bold text-indigo-700">③ Chất lượng:</span>
                      <span className="text-slate-600 line-clamp-1">{kpi.qualityCriteria} ({res.qualityScore}/100)</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-700">
                      <span className="font-bold text-amber-700">④ Hiệu suất:</span>
                      <span className="text-slate-600 line-clamp-1">{kpi.efficiencyCriteria} ({res.efficiencyRate}%)</span>
                    </div>
                  </div>

                  {/* Formula */}
                  <div className="pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-mono line-clamp-1">
                    Formula: {kpi.formula}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 3: GIAO VIỆC & BÙ ĐẮP GAP (ACTION PLANS & ROOT CAUSE)
          ========================================================================= */}
      {activeTab === 'actions' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div>
              <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Zap className="w-4 h-4 text-rose-600" />
                <span>DANH SÁCH NHIỆM VỤ BÙ ĐẮP & PHÂN TÍCH NGUYÊN NHÂN GỐC RỄ (14 TIÊU CHUẨN)</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Các phương án được Lãnh đạo giao trực tiếp cho PIC kèm deadline và chỉ tiêu bù đắp cụ thể.
              </p>
            </div>
            <button
              onClick={() => handleOpenActionModal()}
              className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Giao Thêm Nhiệm Vụ Bù</span>
            </button>
          </div>

          <div className="space-y-3">
            {actionPlans.map((act) => {
              const rootCauseDef = ROOT_CAUSE_DEFINITIONS.find((r) => r.category === act.rootCauseCategory);

              return (
                <div
                  key={act.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-blue-300 transition-all space-y-3"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2">
                    <div className="flex items-start gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          act.priority === 'urgent'
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}
                      >
                        <AlertTriangle className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                            {act.actionCode}
                          </span>
                          <span className="text-xs font-bold text-blue-700">[{act.kpiName}]</span>
                          <span
                            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                              act.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {act.status === 'completed' ? 'Đã hoàn thành' : 'Đang thực hiện'}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-900 text-sm mt-1">{act.title}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs">
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Chỉ tiêu bù đắp</div>
                        <div className="font-black text-rose-600 text-sm">
                          {formatNumberWithDots(act.recoveryTargetAmount || 0)} VNĐ
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-[10px] text-slate-500 uppercase font-semibold">Hạn chót (Deadline)</div>
                        <div className="font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-blue-600" />
                          <span>{act.deadline}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Root Cause & Evidence Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs">
                    <div>
                      <div className="font-bold text-slate-700 flex items-center gap-1 text-[11px] text-rose-700">
                        <span>🔍 Nguyên nhân gốc rễ:</span>
                        <span>{rootCauseDef?.label || act.rootCauseCategory}</span>
                      </div>
                      <div className="text-slate-600 mt-1">{act.rootCause}</div>
                    </div>
                    <div>
                      <div className="font-bold text-slate-700 text-[11px] text-blue-700">
                        📄 Dữ liệu chứng minh (Evidence):
                      </div>
                      <div className="text-slate-600 mt-1">{act.evidence}</div>
                    </div>
                  </div>

                  {/* PIC & Progress Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-500">Người thực hiện (PIC):</span>
                      <span className="font-bold text-slate-900">{act.picName}</span>
                      <span className="text-slate-400">({act.picRole})</span>
                      {act.supportingPerson && (
                        <span className="text-indigo-600 font-medium">| Hỗ trợ: {act.supportingPerson}</span>
                      )}
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-[11px] font-semibold text-slate-600">
                        Tiến độ bù: <span className="font-bold text-blue-700">{act.progressPercent}%</span>
                      </div>
                      <div className="w-24 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 rounded-full transition-all"
                          style={{ width: `${act.progressPercent}%` }}
                        />
                      </div>
                      {act.status !== 'completed' && (
                        <button
                          onClick={() => {
                            setActionPlans((prev) =>
                              prev.map((a) => (a.id === act.id ? { ...a, status: 'completed', progressPercent: 100 } : a))
                            );
                          }}
                          className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>1-Click Nghiệm Thu</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 4: BẢNG ĐIỂM HIỆU SUẤT CÁ NHÂN (7 TRỤ CỘT)
          ========================================================================= */}
      {activeTab === 'scorecards' && (
        <div className="space-y-4">
          <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 text-xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <div>
                <div className="font-bold text-amber-950">
                  BẢNG XẾP HẠNG & ĐIỂM HIỆU SUẤT TOÀN DIỆN 7 TRỤ CỘT (PERFORMANCE SCORECARD)
                </div>
                <div className="text-amber-800">
                  Đánh giá công bằng dựa trên: Tỷ lệ hoàn thành task, Điểm chất lượng, Đúng hạn deadline, Doanh thu & Lợi nhuận đóng góp.
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {scorecards.map((card, index) => (
              <div
                key={card.userId}
                className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all space-y-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${
                        index === 0
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : index === 1
                          ? 'bg-slate-100 text-slate-800 border border-slate-300'
                          : 'bg-orange-100 text-orange-800 border border-orange-300'
                      }`}
                    >
                      #{card.ranking}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{card.userName}</h3>
                      <div className="text-[11px] text-slate-500">{card.userRole} • {card.department}</div>
                    </div>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-black uppercase ${
                      card.grade === 'A_EXCELLENT'
                        ? 'bg-emerald-100 text-emerald-800'
                        : card.grade === 'B_GOOD'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-amber-100 text-amber-800'
                    }`}
                  >
                    Hạng {card.grade.split('_')[0]}
                  </span>
                </div>

                {/* Score Big Display */}
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Điểm KPI Tổng Hợp</div>
                    <div className="text-2xl font-black text-blue-700">{card.kpiScore}/100</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] text-slate-500 uppercase font-bold">Doanh thu đóng góp</div>
                    <div className="text-sm font-black text-emerald-600">
                      {formatNumberWithDots(card.revenueGenerated)} VNĐ
                    </div>
                  </div>
                </div>

                {/* 7 Performance Bars */}
                <div className="space-y-2 text-xs">
                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Tỷ lệ hoàn thành task:</span>
                      <span className="font-bold text-slate-800">
                        {card.completedTasks}/{card.totalAssignedTasks} ({card.taskCompletionRate}%)
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{ width: `${card.taskCompletionRate}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Điểm chất lượng task:</span>
                      <span className="font-bold text-slate-800">{card.taskQualityScore}/100</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${card.taskQualityScore}%` }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-slate-600 mb-1">
                      <span>Tuân thủ đúng hạn (Deadline):</span>
                      <span className="font-bold text-slate-800">{card.deadlineComplianceRate}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-600 rounded-full"
                        style={{ width: `${card.deadlineComplianceRate}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 5: DỰ BÁO & CẢNH BÁO SỚM (FORECAST & ALERTS)
          ========================================================================= */}
      {activeTab === 'forecast' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Forecasts */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <span>MÔ HÌNH DỰ BÁO HOÀN THÀNH KỲ (FORECASTING)</span>
              </div>

              <div className="space-y-3">
                {forecasts.map((fc, i) => (
                  <div key={i} className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-slate-900 text-sm">{fc.dimension}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          fc.status === 'exceeded'
                            ? 'bg-emerald-100 text-emerald-800'
                            : fc.status === 'on_track'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {fc.achievementForecastRate}% Target
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-1">
                      <div>
                        <div className="text-[10px] text-slate-500">Mục tiêu:</div>
                        <div className="font-bold text-slate-800">{formatNumberWithDots(fc.target)} {fc.unit}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Lũy kế hiện tại:</div>
                        <div className="font-bold text-blue-700">{formatNumberWithDots(fc.actualYtd)} {fc.unit}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-slate-500">Dự báo kết thúc:</div>
                        <div className="font-black text-emerald-600">{formatNumberWithDots(fc.forecastTotal)} {fc.unit}</div>
                      </div>
                    </div>

                    {fc.mitigationAction && (
                      <div className="text-[11px] text-indigo-700 pt-1 font-medium border-t border-slate-200">
                        ⚡ Hành động: {fc.mitigationAction}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* System Alerts */}
            <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 text-sm">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <span>CẢNH BÁO SỚM & ĐIỂM NGHẼN HỆ THỐNG</span>
              </div>

              <div className="space-y-3">
                {alerts.map((alt) => (
                  <div
                    key={alt.id}
                    className={`p-4 rounded-xl border text-xs space-y-2 ${
                      alt.severity === 'critical'
                        ? 'bg-rose-50/70 border-rose-200'
                        : 'bg-amber-50/70 border-amber-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-slate-900 text-xs">{alt.title}</h4>
                      <span
                        className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                          alt.severity === 'critical' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                        }`}
                      >
                        {alt.severity}
                      </span>
                    </div>
                    <p className="text-slate-600">{alt.description}</p>
                    <div className="text-[11px] text-slate-700 pt-1 border-t border-slate-200 flex items-center justify-between">
                      <span>Phụ trách: <strong>{alt.picName}</strong></span>
                      <span className="text-blue-700 font-semibold">{alt.suggestedAction}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          TAB 6: CÂY HẠNG MỤC & NHÓM VIỆC (WORK CATEGORY HIERARCHY)
          ========================================================================= */}
      {activeTab === 'work_categories' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <FolderTree className="w-4 h-4 text-blue-600" />
              <span>CHUẨN HÓA CẤU TRÚC CÔNG VIỆC: HẠNG MỤC → NHÓM CÔNG VIỆC → TÁC VỤ → CHECKLIST SUBTASKS</span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Áp dụng cho mọi vị trí trong doanh nghiệp, giúp phân bổ KPI và giao việc đúng chuẩn hóa quy trình.
            </p>
          </div>

          <div className="space-y-4">
            {workCategories.map((cat) => (
              <div key={cat.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 uppercase">
                      {cat.code}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1">{cat.name}</h3>
                    <p className="text-xs text-slate-500">{cat.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                  {cat.groups.map((grp) => (
                    <div key={grp.id} className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-2">
                      <div className="font-bold text-slate-800 flex items-center justify-between">
                        <span>📁 {grp.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{grp.code}</span>
                      </div>
                      <div className="space-y-1 text-slate-600">
                        {grp.taskTemplates.map((t) => (
                          <div key={t.id} className="flex items-start gap-1.5">
                            <ChevronRight className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
                            <span>{t.title}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <EnterprisePlanModal
        isOpen={isPlanModalOpen}
        onClose={() => {
          setIsPlanModalOpen(false);
          setEditingPlan(null);
        }}
        onSavePlan={handleSavePlan}
        initialPlan={editingPlan}
        parentPlans={plans}
        users={users}
        currentUser={currentUser}
      />

      <KpiActionAssignModal
        isOpen={isActionModalOpen}
        onClose={() => {
          setIsActionModalOpen(false);
          setActionTargetPlan(null);
        }}
        onSaveAction={handleSaveAction}
        selectedPlan={actionTargetPlan}
        users={users}
        currentUser={currentUser}
      />
    </div>
  );
};
