import React, { useState, useMemo, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Shield,
  Layers,
  Users,
  Building2,
  DollarSign,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  Clock,
  AlertCircle,
  AlertTriangle,
  ChevronRight,
  ChevronDown,
  ArrowUpRight,
  Filter,
  Plus,
  RefreshCw,
  Award,
  Calendar,
  Lock,
  Unlock,
  Edit3,
  Send,
  Check,
  X,
  Search,
  Eye,
  SlidersHorizontal,
  Briefcase,
  HelpCircle,
  PieChart as PieIcon,
  BarChart3,
  Package,
  ShoppingCart,
  Target,
  Wallet,
  Activity,
  ArrowRight,
  ExternalLink,
  Zap,
  Boxes
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Cell,
  ComposedChart
} from 'recharts';
import {
  OrgLevel,
  OrgScope,
  MultiLevelReport,
  ManagementKpiRecord,
  ManagementAuditEntry,
  Order,
  Customer,
  CrmTask,
  CashTransaction,
  UserAccount,
  Product,
  InventoryLayer,
  Warehouse,
  Supplier,
  PurchaseOrder
} from '../../types';
import {
  ORG_UNITS,
  OrgUnit,
  INITIAL_MANAGEMENT_KPIS,
  INITIAL_MULTI_LEVEL_REPORTS,
  INITIAL_MANAGEMENT_AUDIT_LOGS,
  calculateBottomUpMetrics
} from '../../data/managementReportingData';
import { exportCustomersToExcel, exportTasksToExcel } from '../../utils/excelEngine';

interface MultiLevelManagementDashboardProps {
  orders: Order[];
  customers: Customer[];
  crmTasks: CrmTask[];
  cashTransactions: CashTransaction[];
  users: UserAccount[];
  currentUser?: UserAccount;
  products?: Product[];
  inventoryLots?: InventoryLayer[];
  warehouses?: Warehouse[];
  suppliers?: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  onOpenCustomerDetail?: (customer: Customer) => void;
  onOpenOrderModal?: (order: Order) => void;
  onOpenTaskModal?: (task?: CrmTask) => void;
  onNavigateToView?: (view: string, filter?: string) => void;
}

export const MultiLevelManagementDashboard: React.FC<MultiLevelManagementDashboardProps> = ({
  orders = [],
  customers = [],
  crmTasks = [],
  cashTransactions = [],
  users = [],
  currentUser,
  products = [],
  inventoryLots = [],
  warehouses = [],
  suppliers = [],
  purchaseOrders = [],
  onOpenCustomerDetail,
  onOpenOrderModal,
  onOpenTaskModal,
  onNavigateToView
}) => {
  // Selected hierarchy level & unit (Initialized based on currentUser profile)
  const initialLevel: OrgLevel = currentUser?.managementLevel || 'ceo_chairman';
  const [selectedLevel, setSelectedLevel] = useState<OrgLevel>(initialLevel);
  const [selectedUnitId, setSelectedUnitId] = useState<string>('org-hq');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('month'); // 'today' | 'week' | 'month' | 'quarter' | 'year'

  // Synchronize when currentUser changes
  useEffect(() => {
    if (currentUser?.managementLevel) {
      setSelectedLevel(currentUser.managementLevel);
      const matchedUnit = ORG_UNITS.find((u) => u.level === currentUser.managementLevel) || ORG_UNITS[0];
      setSelectedUnitId(matchedUnit.id);
      setDrilldownPath([
        { level: 'ceo_chairman', unitId: 'org-hq', unitName: 'Toàn Công Ty BizOne' },
        ...(currentUser.managementLevel !== 'ceo_chairman' ? [{ level: currentUser.managementLevel, unitId: matchedUnit.id, unitName: matchedUnit.name }] : [])
      ]);
    }
  }, [currentUser?.id, currentUser?.managementLevel]);

  // Reports & KPI state
  const [reports, setReports] = useState<MultiLevelReport[]>(INITIAL_MULTI_LEVEL_REPORTS);
  const [kpis, setKpis] = useState<ManagementKpiRecord[]>(INITIAL_MANAGEMENT_KPIS);
  const [auditLogs, setAuditLogs] = useState<ManagementAuditEntry[]>(INITIAL_MANAGEMENT_AUDIT_LOGS);

  // Active sub-tab in Management Dashboard
  const [activeTab, setActiveTab] = useState<'overview' | 'drilldown' | 'reports_approval' | 'kpi_action_plans' | 'audit_log'>('overview');

  // Drill-down State across 5 levels
  const [drilldownPath, setDrilldownPath] = useState<{
    level: OrgLevel;
    unitId?: string;
    unitName: string;
    staffName?: string;
  }[]>([
    { level: 'ceo_chairman', unitId: 'org-hq', unitName: 'Toàn Công Ty BizOne' }
  ]);

  // Modals & Action States
  const [selectedReportDetail, setSelectedReportDetail] = useState<MultiLevelReport | null>(null);
  const [editingKpi, setEditingKpi] = useState<ManagementKpiRecord | null>(null);
  const [isSubmitReportOpen, setIsSubmitReportOpen] = useState(false);
  const [returnReasonInput, setReturnReasonInput] = useState('');
  const [returningReportId, setReturningReportId] = useState<string | null>(null);

  // CEO/Admin Widget Visibility Customization
  const [widgetVisibility, setWidgetVisibility] = useState({
    kpiCards: true,
    performanceMatrix: true,
    bottomUpFlow: true,
    kpiActionPlans: true,
    recentReports: true
  });
  const [isCustomizeWidgetsOpen, setIsCustomizeWidgetsOpen] = useState(false);

  // Current OrgUnit
  const currentUnit = useMemo(() => {
    return ORG_UNITS.find((u) => u.id === selectedUnitId) || ORG_UNITS[0];
  }, [selectedUnitId]);

  // Aggregate metrics automatically from lower levels to top
  const bottomUpData = useMemo(() => {
    const scope: OrgScope =
      selectedLevel === 'ceo_chairman'
        ? 'company_wide'
        : selectedLevel === 'deputy_ceo'
        ? 'division'
        : selectedLevel === 'director' || selectedLevel === 'team_lead'
        ? 'department'
        : 'individual';

    return calculateBottomUpMetrics(orders, customers, crmTasks, cashTransactions, scope, selectedUnitId);
  }, [orders, customers, crmTasks, cashTransactions, selectedLevel, selectedUnitId]);

  // FIFO Inventory Value & Total Qty from real inventoryLots
  const realTimeFifoValue = useMemo(() => {
    return inventoryLots.reduce((sum, l) => {
      const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
      const cost = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
      return sum + qty * cost;
    }, 0);
  }, [inventoryLots]);

  const totalStockQty = useMemo(() => {
    return inventoryLots.reduce((sum, l) => sum + (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0), 0);
  }, [inventoryLots]);

  const activeLotsCount = useMemo(() => {
    return inventoryLots.filter((l) => (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0) > 0).length;
  }, [inventoryLots]);

  // Overdue tasks count
  const overdueTasks = useMemo(() => {
    const todayStr = '2026-08-16';
    return crmTasks.filter((t) => t.status !== 'completed' && t.dueDate && t.dueDate < todayStr);
  }, [crmTasks]);

  // Overdue debt
  const overdueDebt = useMemo(() => {
    return customers
      .filter((c) => (Number(c.debt) || 0) > 0 && (c.creditStatus === 'overdue' || (c as any).debtOverdue))
      .reduce((sum, c) => sum + (Number(c.debt) || 0), 0);
  }, [customers]);

  // Low stock products count
  const lowStockCount = useMemo(() => {
    return products.filter((p) => {
      const stock = Number(p.stock) || 0;
      const min = Number(p.minStock) || 10;
      return stock <= min;
    }).length;
  }, [products]);

  // CRM Pipeline Deals & Value
  const pipelineMetrics = useMemo(() => {
    const stages = [
      { key: 'lead', name: 'Tiếp cận Lead', deals: 8, val: 1200000000, color: '#94a3b8' },
      { key: 'qualified', name: 'Đủ điều kiện', deals: 6, val: 2400000000, color: '#38bdf8' },
      { key: 'needs_analysis', name: 'Khảo sát nhu cầu', deals: 5, val: 3100000000, color: '#60a5fa' },
      { key: 'proposal_sent', name: 'Gửi Báo Giá', deals: 4, val: 4200000000, color: '#818cf8' },
      { key: 'negotiation', name: 'Thương lượng HĐ', deals: 3, val: 2800000000, color: '#a78bfa' },
      { key: 'contract_sent', name: 'Trình Ký Hợp Đồng', deals: 2, val: 1500000000, color: '#c084fc' }
    ];
    const totalVal = stages.reduce((s, st) => s + st.val, 0);
    const totalDeals = stages.reduce((s, st) => s + st.deals, 0);
    return { stages, totalVal, totalDeals };
  }, []);

  // Unit performance comparison chart data
  const unitChartData = useMemo(() => {
    return ORG_UNITS.filter((u) => u.level === 'director' || u.level === 'team_lead').map((u) => {
      const actual = u.id.includes('south')
        ? Math.round(u.targetMonthlyRevenue * 1.04)
        : Math.round(u.targetMonthlyRevenue * 0.82);
      return {
        id: u.id,
        level: u.level,
        name: u.name.replace('Chi Nhánh ', '').replace('Phòng ', ''),
        fullName: u.name,
        targetTriệu: Math.round(u.targetMonthlyRevenue / 1000000),
        actualTriệu: Math.round(actual / 1000000),
        targetFull: u.targetMonthlyRevenue,
        actualFull: actual,
        percent: Math.round((actual / u.targetMonthlyRevenue) * 100)
      };
    });
  }, []);

  const formatVND = (val: number) => {
    return new Intl.NumberFormat('vi-VN').format(Math.round(val || 0)) + ' đ';
  };

  // Handle Level Change
  const handleSelectLevel = (level: OrgLevel) => {
    setSelectedLevel(level);
    const matchedUnit = ORG_UNITS.find((u) => u.level === level) || ORG_UNITS[0];
    setSelectedUnitId(matchedUnit.id);
    setDrilldownPath([
      { level: 'ceo_chairman', unitId: 'org-hq', unitName: 'Toàn Công Ty BizOne' },
      ...(level !== 'ceo_chairman' ? [{ level, unitId: matchedUnit.id, unitName: matchedUnit.name }] : [])
    ]);
  };

  // Workflow Handlers
  const handleApproveReport = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'approved',
              approvedBy: currentUser?.name || 'Đức Tăng (Chủ tịch HĐQT)',
              approvedAt: new Date().toISOString().replace('T', ' ').substring(0, 16)
            }
          : r
      )
    );

    // Audit log
    const newLog: ManagementAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorId: currentUser?.id || 'usr-admin-ductang',
      actorName: currentUser?.name || 'Đức Tăng',
      actorRole: 'Chủ tịch HĐQT / CEO',
      action: 'APPROVE_REPORT',
      targetType: 'REPORT',
      targetId: reportId,
      details: `Phê duyệt báo cáo quản trị ID ${reportId}`
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const handleReturnReport = (reportId: string) => {
    if (!returnReasonInput.trim()) return;
    setReports((prev) =>
      prev.map((r) =>
        r.id === reportId
          ? {
              ...r,
              status: 'returned',
              returnReason: returnReasonInput
            }
          : r
      )
    );

    const newLog: ManagementAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorId: currentUser?.id || 'usr-admin-ductang',
      actorName: currentUser?.name || 'Đức Tăng',
      actorRole: 'Chủ tịch HĐQT / CEO',
      action: 'RETURN_REPORT',
      targetType: 'REPORT',
      targetId: reportId,
      details: `Trả lại báo cáo yêu cầu giải trình: "${returnReasonInput}"`
    };
    setAuditLogs((prev) => [newLog, ...prev]);
    setReturningReportId(null);
    setReturnReasonInput('');
  };

  const handleToggleLockReport = (reportId: string) => {
    setReports((prev) =>
      prev.map((r) => {
        if (r.id === reportId) {
          const nextLock = !r.isLocked;
          return {
            ...r,
            isLocked: nextLock,
            status: nextLock ? 'locked' : 'approved'
          };
        }
        return r;
      })
    );
  };

  const handleSaveKpiAction = (updatedKpi: ManagementKpiRecord) => {
    setKpis((prev) => prev.map((k) => (k.id === updatedKpi.id ? updatedKpi : k)));
    setEditingKpi(null);

    const newLog: ManagementAuditEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      actorId: currentUser?.id || 'usr-admin-ductang',
      actorName: currentUser?.name || 'Đức Tăng',
      actorRole: 'Lãnh đạo Quản trị',
      action: 'UPDATE_KPI',
      targetType: 'KPI',
      targetId: updatedKpi.id,
      details: `Cập nhật kế hoạch khắc phục & phương án bù đắp cho chỉ tiêu ${updatedKpi.name}`
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Level badge configurations
  const LEVEL_CONFIGS: Record<OrgLevel, { label: string; badge: string; roleDesc: string; color: string }> = {
    ceo_chairman: {
      label: 'Cấp 5: Tổng Giám Đốc / Chủ Tịch',
      badge: 'bg-rose-50 text-rose-700 border-rose-200',
      roleDesc: 'Quản trị tổng hợp toàn diện hệ thống, kiểm soát KPI trọng yếu & duyệt chiến lược',
      color: 'border-rose-500'
    },
    deputy_ceo: {
      label: 'Cấp 4: Phó Tổng Giám Đốc',
      badge: 'bg-amber-50 text-amber-800 border-amber-300',
      roleDesc: 'Tổng hợp từ các Giám đốc/Khối phụ trách, kiểm soát tiến độ & phân bổ ngân sách',
      color: 'border-amber-500'
    },
    director: {
      label: 'Cấp 3: Giám Đốc Khối / Chi Nhánh',
      badge: 'bg-blue-50 text-blue-700 border-blue-200',
      roleDesc: 'Tổng hợp các phòng ban trực thuộc, so sánh hiệu suất & duyệt báo cáo',
      color: 'border-blue-500'
    },
    team_lead: {
      label: 'Cấp 2: Trưởng Phòng / Team Leader',
      badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      roleDesc: 'Tổng hợp dữ liệu của các nhân viên thuộc phòng, giao task & khắc phục sai lệch',
      color: 'border-emerald-500'
    },
    staff: {
      label: 'Cấp 1: Chuyên Viên / Nhân Viên (PIC)',
      badge: 'bg-teal-50 text-teal-700 border-teal-200',
      roleDesc: 'Cập nhật trực tiếp dữ liệu khách hàng, task, đơn hàng và nộp báo cáo định kỳ',
      color: 'border-teal-500'
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Toolbar & Multi-level Hierarchy Selector */}
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-2 rounded-xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <Layers className="w-5 h-5" />
              </span>
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <span>Dashboard Quản Trị Đa Cấp & Báo Cáo Từ Dưới Lên</span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    Bottom-Up Hierarchy
                  </span>
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dữ liệu phát sinh từ nhân viên → Tự động tổng hợp qua từng cấp quản trị → Cho phép Drill-down ngược về nguồn
                </p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Period Selector */}
            <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setSelectedPeriod('week')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  selectedPeriod === 'week' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tuần Này
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('month')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  selectedPeriod === 'month' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Tháng 08/2026
              </button>
              <button
                type="button"
                onClick={() => setSelectedPeriod('quarter')}
                className={`px-3 py-1.5 rounded-xl transition-all ${
                  selectedPeriod === 'quarter' ? 'bg-white text-blue-700 shadow-xs font-bold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Quý 3/2026
              </button>
            </div>

            {/* Customize Widgets Button */}
            <button
              type="button"
              onClick={() => setIsCustomizeWidgetsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 transition-colors"
            >
              <SlidersHorizontal className="w-4 h-4 text-slate-500" />
              <span>Tùy Biến Widget</span>
            </button>

            {/* Export Report Excel */}
            <button
              type="button"
              onClick={() => exportTasksToExcel(crmTasks, `Bao_Cao_Quan_Tri_${selectedLevel}_${selectedPeriod}.xlsx`)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Xuất Excel (.xlsx)</span>
            </button>
          </div>
        </div>

        {/* 5-Level Architecture Tab Steps */}
        <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {(['ceo_chairman', 'deputy_ceo', 'director', 'team_lead', 'staff'] as OrgLevel[]).map((lvl, index) => {
            const isSelected = selectedLevel === lvl;
            const cfg = LEVEL_CONFIGS[lvl];
            return (
              <button
                key={lvl}
                type="button"
                onClick={() => handleSelectLevel(lvl)}
                className={`p-3 rounded-2xl border text-left transition-all relative overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'bg-blue-50/70 border-blue-500 shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-slate-50/60 hover:bg-white border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase text-slate-400">
                      Cấp {5 - index}
                    </span>
                    {isSelected && (
                      <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                    )}
                  </div>
                  <div className="text-xs font-bold text-slate-900 mt-1 line-clamp-1">
                    {lvl === 'ceo_chairman' && 'Tổng Giám Đốc / Chủ Tịch'}
                    {lvl === 'deputy_ceo' && 'Phó Tổng Giám Đốc'}
                    {lvl === 'director' && 'Giám Đốc Khối / Vùng'}
                    {lvl === 'team_lead' && 'Trưởng Phòng / Lead'}
                    {lvl === 'staff' && 'Chuyên Viên / Nhân Viên'}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 mt-2 line-clamp-1">
                  {lvl === 'ceo_chairman' && 'Toàn doanh nghiệp'}
                  {lvl === 'deputy_ceo' && 'Khối & Phân bổ nguồn lực'}
                  {lvl === 'director' && 'Chi nhánh Miền Bắc / Nam'}
                  {lvl === 'team_lead' && 'Đội nhóm & Task hàng ngày'}
                  {lvl === 'staff' && 'Phát sinh dữ liệu nguồn'}
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Unit & Scope Selector */}
        <div className="mt-4 p-3.5 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold text-xs">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-900">{currentUnit.name}</span>
                <span className="text-[11px] font-semibold text-slate-500">
                  (Mã: {currentUnit.code} • Phụ trách: {currentUnit.headName} - {currentUnit.headTitle})
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {LEVEL_CONFIGS[selectedLevel].roleDesc}
              </p>
            </div>
          </div>

          {/* Org Unit Dropdown for drill-in within current level */}
          <div className="flex items-center gap-2">
            <label className="text-xs text-slate-500 font-semibold whitespace-nowrap">Đơn vị / Phòng:</label>
            <select
              value={selectedUnitId}
              onChange={(e) => setSelectedUnitId(e.target.value)}
              className="bg-white border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              {ORG_UNITS.filter((u) => selectedLevel === 'ceo_chairman' || u.level === selectedLevel || selectedLevel === 'staff').map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name} ({unit.headName})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 2. Management Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Tổng Quan Điều Hành</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('drilldown')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'drilldown'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ChevronRight className="w-4 h-4" />
          <span>Drill-Down Xuyên Cấp Quản Trị</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('kpi_action_plans')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'kpi_action_plans'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <AlertCircle className="w-4 h-4" />
          <span>KPI & Kế Hoạch Khắc Phục (Root Cause)</span>
          {kpis.filter((k) => k.status === 'at_risk' || k.status === 'failed').length > 0 && (
            <span className="px-1.5 py-0.5 bg-rose-500 text-white text-[10px] font-black rounded-full">
              {kpis.filter((k) => k.status === 'at_risk' || k.status === 'failed').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('reports_approval')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'reports_approval'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Báo Cáo Định Kỳ & Phê Duyệt</span>
          {reports.filter((r) => r.status === 'submitted').length > 0 && (
            <span className="px-1.5 py-0.5 bg-amber-500 text-white text-[10px] font-black rounded-full">
              {reports.filter((r) => r.status === 'submitted').length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('audit_log')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all whitespace-nowrap ${
            activeTab === 'audit_log'
              ? 'bg-blue-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Audit Log Quản Trị ({auditLogs.length})</span>
        </button>
      </div>

      {/* 3. TAB 1: OVERVIEW - MÀN HÌNH ĐIỀU HÀNH TRỰC QUAN DUY NHẤT */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Actionable Alerts & Drill-down Triggers */}
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="text-xs font-bold text-slate-500 flex items-center gap-1.5 mr-1">
              <Zap className="w-3.5 h-3.5 text-amber-500" />
              <span>Cảnh Báo Điều Hành:</span>
            </span>

            {/* Overdue Tasks Trigger */}
            <button
              type="button"
              onClick={() => {
                if (onNavigateToView) onNavigateToView('crm', 'Quá hạn');
                else onOpenTaskModal?.();
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                overdueTasks.length > 0
                  ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200 shadow-xs'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}
            >
              <AlertCircle className="w-3.5 h-3.5" />
              <span>{overdueTasks.length} Task quá hạn</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
            </button>

            {/* Overdue Debt Trigger */}
            <button
              type="button"
              onClick={() => {
                if (onNavigateToView) onNavigateToView('crm', 'Quá hạn');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-all shadow-xs"
            >
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>{formatVND(overdueDebt)} Công nợ quá hạn</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
            </button>

            {/* Pipeline Trigger */}
            <button
              type="button"
              onClick={() => {
                if (onNavigateToView) onNavigateToView('crm');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 transition-all shadow-xs"
            >
              <Target className="w-3.5 h-3.5 text-blue-600" />
              <span>{formatVND(pipelineMetrics.totalVal)} Pipeline ({pipelineMetrics.totalDeals} Deals)</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
            </button>

            {/* Low Stock Alert */}
            <button
              type="button"
              onClick={() => {
                if (onNavigateToView) onNavigateToView('inventory');
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 transition-all shadow-xs"
            >
              <Package className="w-3.5 h-3.5 text-purple-600" />
              <span>{lowStockCount} SKU sắp hết hàng</span>
              <ExternalLink className="w-3 h-3 ml-0.5 opacity-60" />
            </button>
          </div>

          {/* 8 Key Visual Executive KPI Cards (Linked Directly to Source Modules) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Tổng Khách Hàng -> CRM Customer List */}
            <div
              onClick={() => {
                if (onNavigateToView) onNavigateToView('crm');
                else if (customers[0]) onOpenCustomerDetail?.(customers[0]);
              }}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Tổng Khách Hàng</span>
                <span className="p-2 rounded-2xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <Users className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2 flex items-baseline gap-2">
                <span>{customers.length.toLocaleString()}</span>
                <span className="text-xs font-bold text-emerald-600">+12% Tăng trưởng</span>
              </div>
              <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                <span className="text-slate-500">Xem module CRM & Đối tác</span>
                <span className="font-bold text-blue-600 flex items-center gap-0.5">
                  Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* 2. Doanh Số Bán Hàng -> Sales / Orders */}
            <div
              onClick={() => {
                if (onNavigateToView) onNavigateToView('orders');
                else if (orders[0]) onOpenOrderModal?.(orders[0]);
              }}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Doanh Số Tổng Hợp</span>
                <span className="p-2 rounded-2xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-600 group-hover:text-white transition-colors">
                  <DollarSign className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatVND(bottomUpData.revenue)}
              </div>
              <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                <span className="text-slate-500">Kế hoạch: {formatVND(currentUnit.targetMonthlyRevenue)}</span>
                <span className="font-bold text-emerald-600 flex items-center gap-0.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  {Math.round((bottomUpData.revenue / (currentUnit.targetMonthlyRevenue || 1)) * 100)}%
                </span>
              </div>
            </div>

            {/* 3. Công Nợ Phải Thu -> Finance / CRM Debt */}
            <div
              onClick={() => {
                if (onNavigateToView) onNavigateToView('crm', 'Quá hạn');
              }}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-amber-500 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Công Nợ Phải Thu</span>
                <span className="p-2 rounded-2xl bg-amber-50 text-amber-600 group-hover:bg-amber-600 group-hover:text-white transition-colors">
                  <Clock className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatVND(bottomUpData.debt)}
              </div>
              <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                <span className="text-slate-500">Quá hạn: {formatVND(overdueDebt)}</span>
                <span className="font-bold text-amber-700 flex items-center gap-0.5">
                  Xem công nợ <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* 4. Pipeline / Cơ Hội Bán Hàng -> CRM Opportunity */}
            <div
              onClick={() => {
                if (onNavigateToView) onNavigateToView('crm');
              }}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-indigo-500 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Pipeline / Cơ Hội</span>
                <span className="p-2 rounded-2xl bg-indigo-50 text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Target className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatVND(pipelineMetrics.totalVal)}
              </div>
              <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                <span className="text-slate-500">{pipelineMetrics.totalDeals} Cơ hội đang chăm sóc</span>
                <span className="font-bold text-indigo-600 flex items-center gap-0.5">
                  Phễu CRM <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* 5. Tác Vụ & Tiến Độ -> Task Management */}
            <div
              onClick={() => {
                if (onNavigateToView) onNavigateToView('crm');
                else onOpenTaskModal?.();
              }}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-teal-500 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Tác Vụ & Công Việc</span>
                <span className="p-2 rounded-2xl bg-teal-50 text-teal-600 group-hover:bg-teal-600 group-hover:text-white transition-colors">
                  <Check className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {bottomUpData.completedTasks} / {crmTasks.length}
              </div>
              <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                <span className="text-slate-500">Đang làm: {bottomUpData.pendingTasks} • Trễ: {overdueTasks.length}</span>
                <span className="font-bold text-teal-600 flex items-center gap-0.5">
                  {Math.round((bottomUpData.completedTasks / (crmTasks.length || 1)) * 100)}% <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* 6. Tồn Kho & Giá Trị FIFO -> Warehouse / FIFO Inventory */}
            <div
              onClick={() => {
                if (onNavigateToView) onNavigateToView('inventory');
              }}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-purple-500 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Tồn Kho & Giá Trị FIFO</span>
                <span className="p-2 rounded-2xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                  <Boxes className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatVND(realTimeFifoValue)}
              </div>
              <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                <span className="text-slate-500">{totalStockQty.toLocaleString()} ĐVSP ({activeLotsCount} lô)</span>
                <span className="font-bold text-purple-600 flex items-center gap-0.5">
                  Kho hàng <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* 7. Dòng Tiền Thực Thu -> Cashflow */}
            <div
              onClick={() => {
                if (onNavigateToView) onNavigateToView('cashflow');
              }}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-cyan-500 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Tiền Thực Thu (Dòng Tiền)</span>
                <span className="p-2 rounded-2xl bg-cyan-50 text-cyan-600 group-hover:bg-cyan-600 group-hover:text-white transition-colors">
                  <Wallet className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {formatVND(bottomUpData.collections)}
              </div>
              <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                <span className="text-slate-500">{cashTransactions.length} Phiếu thu/chi</span>
                <span className="font-bold text-cyan-600 flex items-center gap-0.5">
                  Sổ quỹ <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* 8. KPI Kế Hoạch / Thực Tế -> KPI Action Plans */}
            <div
              onClick={() => setActiveTab('kpi_action_plans')}
              className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs relative overflow-hidden group hover:border-rose-500 hover:shadow-md transition-all cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-500">Kế Hoạch KPI & Bù Đắp</span>
                <span className="p-2 rounded-2xl bg-rose-50 text-rose-600 group-hover:bg-rose-600 group-hover:text-white transition-colors">
                  <Award className="w-4 h-4" />
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {kpis.filter((k) => k.status === 'on_track').length} / {kpis.length} Đạt
              </div>
              <div className="flex items-center justify-between text-xs mt-3 pt-3 border-t border-slate-100">
                <span className="text-slate-500">{kpis.filter((k) => k.status === 'off_track').length} Chỉ tiêu cần bù đắp</span>
                <span className="font-bold text-rose-600 flex items-center gap-0.5">
                  Kế hoạch <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          </div>

          {/* Visual Charts: Doanh số vs Chỉ tiêu theo đơn vị + Phễu Cơ Hội Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Chart 1: Doanh số Thực tế vs Chỉ tiêu từng đơn vị (Clickable Bars) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-600" />
                    <span>Doanh Số Thực Tế vs Chỉ Tiêu Theo Đơn Vị (Trực quan hóa)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click vào thanh đơn vị để lọc Dashboard và Drill-down chi tiết
                  </p>
                </div>
                <div className="flex items-center gap-3 text-xs font-bold">
                  <span className="flex items-center gap-1 text-slate-500">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-200" />
                    Chỉ tiêu (Triệu đ)
                  </span>
                  <span className="flex items-center gap-1 text-blue-600">
                    <span className="w-2.5 h-2.5 rounded-sm bg-blue-600" />
                    Thực tế (Triệu đ)
                  </span>
                </div>
              </div>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={unitChartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    onClick={(e: any) => {
                      if (e && e.activePayload && e.activePayload[0]) {
                        const unit = e.activePayload[0].payload;
                        setSelectedLevel(unit.level);
                        setSelectedUnitId(unit.id);
                        setActiveTab('drilldown');
                      }
                    }}
                    className="cursor-pointer"
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                    <Tooltip
                      formatter={(value: any) => [
                        new Intl.NumberFormat('vi-VN').format(value) + ' Triệu VNĐ',
                        ''
                      ]}
                      labelFormatter={(label) => `Đơn vị: ${label}`}
                      contentStyle={{ borderRadius: 12, fontSize: 12, border: '1px solid #e2e8f0' }}
                    />
                    <Bar dataKey="targetTriệu" name="Chỉ tiêu" fill="#cbd5e1" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="actualTriệu" name="Thực tế" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Cơ cấu Phễu Cơ Hội Pipeline (6 Giai đoạn) */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  <span>Phễu Cơ Hội Bán Hàng</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onNavigateToView?.('crm')}
                  className="text-xs font-bold text-blue-600 hover:underline flex items-center gap-0.5"
                >
                  CRM <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>

              <div className="space-y-3 mt-2">
                {pipelineMetrics.stages.map((stage) => {
                  const percent = Math.round((stage.val / pipelineMetrics.totalVal) * 100);
                  return (
                    <div
                      key={stage.key}
                      onClick={() => onNavigateToView?.('crm', stage.name)}
                      className="group p-2.5 rounded-2xl hover:bg-slate-50 border border-slate-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: stage.color }} />
                          {stage.name}
                        </span>
                        <span className="font-bold text-slate-900">{formatVND(stage.val)}</span>
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                        <span>{stage.deals} cơ hội kinh doanh</span>
                        <span className="font-semibold">{percent}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden mt-1.5">
                        <div
                          className="h-full rounded-full transition-all"
                          style={{ width: `${percent}%`, backgroundColor: stage.color }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Unit Comparison Matrix with Direct Action Links */}
          {widgetVisibility.performanceMatrix && (
            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-blue-600" />
                    <span>Bảng Xếp Hạng & Điều Hành Đơn Vị Trực Thuộc</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Số liệu thực tế liên thông từ các module • Click để điều phối hoặc drill-down
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-600 border-b border-slate-200 font-bold">
                      <th className="p-3">Đơn vị / Chi nhánh</th>
                      <th className="p-3">Người phụ trách</th>
                      <th className="p-3 text-right">Chỉ tiêu</th>
                      <th className="p-3 text-right">Thực tế</th>
                      <th className="p-3 text-center">% Hoàn thành</th>
                      <th className="p-3 text-center">Trạng thái</th>
                      <th className="p-3 text-center">Thao tác điều hành</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                    {ORG_UNITS.filter((u) => u.level === 'director' || u.level === 'team_lead').map((unit) => {
                      const actual = unit.id.includes('south')
                        ? Math.round(unit.targetMonthlyRevenue * 1.04)
                        : Math.round(unit.targetMonthlyRevenue * 0.82);
                      const percent = Math.round((actual / unit.targetMonthlyRevenue) * 100);
                      const isGood = percent >= 100;
                      return (
                        <tr key={unit.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="p-3">
                            <div className="font-bold text-slate-900">{unit.name}</div>
                            <span className="text-[10px] text-slate-500">Mã: {unit.code} • {unit.staffCount} nhân sự</span>
                          </td>
                          <td className="p-3">
                            <div className="font-semibold text-slate-900">{unit.headName}</div>
                            <span className="text-[10px] text-slate-500">{unit.headTitle}</span>
                          </td>
                          <td className="p-3 text-right font-semibold text-slate-600">
                            {formatVND(unit.targetMonthlyRevenue)}
                          </td>
                          <td className="p-3 text-right font-bold text-slate-900">
                            {formatVND(actual)}
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${isGood ? 'bg-emerald-500' : 'bg-amber-500'}`}
                                  style={{ width: `${Math.min(100, percent)}%` }}
                                />
                              </div>
                              <span className={`font-bold ${isGood ? 'text-emerald-700' : 'text-amber-700'}`}>
                                {percent}%
                              </span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            <span
                              className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                                isGood
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-amber-50 text-amber-700 border border-amber-200'
                              }`}
                            >
                              {isGood ? 'Đạt chỉ tiêu' : 'Cần bù đắp'}
                            </span>
                          </td>
                          <td className="p-3 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedLevel(unit.level);
                                  setSelectedUnitId(unit.id);
                                  setActiveTab('drilldown');
                                }}
                                className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl text-xs font-bold transition-colors"
                              >
                                Drill-down
                              </button>
                              <button
                                type="button"
                                onClick={() => onNavigateToView?.('orders', unit.name)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                                title="Xem danh sách đơn hàng của đơn vị"
                              >
                                Đơn hàng
                              </button>
                              <button
                                type="button"
                                onClick={() => onNavigateToView?.('crm', unit.name)}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                                title="Xem tác vụ của đơn vị"
                              >
                                Tác vụ
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
          )}
        </div>
      )}

      {/* 4. TAB 2: CASCADING DRILL-DOWN */}
      {activeTab === 'drilldown' && (
        <div className="space-y-6">
          {/* Breadcrumb Navigation */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex items-center gap-2 text-xs font-bold overflow-x-auto">
            <span className="text-slate-400">Đường dẫn Drill-down:</span>
            <button
              type="button"
              onClick={() => handleSelectLevel('ceo_chairman')}
              className="text-blue-600 hover:underline flex items-center gap-1"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Toàn Doanh Nghiệp (CEO)</span>
            </button>
            {selectedLevel !== 'ceo_chairman' && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg">
                  {currentUnit.name} ({LEVEL_CONFIGS[selectedLevel].label.split(':')[1]})
                </span>
              </>
            )}
          </div>

          {/* Drill-down Detailed Records: Orders, Customers, Tasks */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Orders Breakdown */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm sm:text-base font-bold text-slate-900 flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-blue-600" />
                    <span>Đơn Hàng & Doanh Số Nguồn ({orders.length} đơn)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Click vào đơn hàng để mở phiếu chi tiết và phân bổ FIFO
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto max-h-[380px] overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="sticky top-0 bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-2.5">Mã đơn</th>
                      <th className="p-2.5">Khách hàng</th>
                      <th className="p-2.5 text-right">Tổng tiền</th>
                      <th className="p-2.5">Thanh toán</th>
                      <th className="p-2.5">Nhân viên</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {orders.slice(0, 8).map((ord) => (
                      <tr
                        key={ord.id}
                        onClick={() => onOpenOrderModal && onOpenOrderModal(ord)}
                        className="hover:bg-blue-50/50 cursor-pointer transition-colors"
                      >
                        <td className="p-2.5 font-bold text-blue-600">{ord.code}</td>
                        <td className="p-2.5 font-semibold text-slate-900">{ord.customerName}</td>
                        <td className="p-2.5 text-right font-bold text-slate-900">{formatVND(ord.totalAmount)}</td>
                        <td className="p-2.5">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            ord.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {ord.paymentStatus === 'paid' ? 'Đã thu tiền' : 'Ghi nợ'}
                          </span>
                        </td>
                        <td className="p-2.5 text-slate-500">{ord.creator || 'Sales KV'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Related Customers & Tasks in Scope */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-emerald-600" />
                  <span>Khách Hàng Trọng Điểm</span>
                </h3>
                <div className="mt-3 space-y-2 max-h-[160px] overflow-y-auto">
                  {customers.slice(0, 4).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => onOpenCustomerDetail && onOpenCustomerDetail(c)}
                      className="p-2.5 rounded-2xl bg-slate-50 hover:bg-emerald-50/60 border border-slate-200/80 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 line-clamp-1">{c.name}</div>
                        <span className="text-[10px] text-slate-500">Nợ: {formatVND(c.debt)}</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Briefcase className="w-4 h-4 text-blue-600" />
                  <span>Tác Vụ CRM & CSKH</span>
                </h3>
                <div className="mt-3 space-y-2 max-h-[160px] overflow-y-auto">
                  {crmTasks.slice(0, 4).map((t) => (
                    <div
                      key={t.id}
                      onClick={() => onOpenTaskModal && onOpenTaskModal(t)}
                      className="p-2.5 rounded-2xl bg-slate-50 hover:bg-blue-50/60 border border-slate-200/80 cursor-pointer transition-all flex items-center justify-between"
                    >
                      <div>
                        <div className="font-bold text-xs text-slate-900 line-clamp-1">{t.title}</div>
                        <span className="text-[10px] text-slate-500">Phụ trách: {t.assignedTo}</span>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'completed' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                      }`}>
                        {t.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. TAB 3: KPI & ROOT CAUSE ACTION PLANS */}
      {activeTab === 'kpi_action_plans' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-rose-600" />
                  <span>Quản Trị KPI Trọng Yếu & Phương Án Xử Lý Lệch Chỉ Tiêu</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bắt buộc ghi nhận nguyên nhân cụ thể + dữ liệu chứng minh + biện pháp khắc phục + PIC + Deadline đối với chỉ tiêu chưa đạt
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {kpis.map((kpi) => {
                const isUnderperforming = kpi.achievementRate < 100;
                return (
                  <div
                    key={kpi.id}
                    className={`p-4 sm:p-5 rounded-3xl border transition-all ${
                      isUnderperforming
                        ? 'bg-rose-50/30 border-rose-200 shadow-xs'
                        : 'bg-white border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            kpi.status === 'achieved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : kpi.status === 'on_track'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {kpi.status === 'achieved' ? 'Đã Đạt' : kpi.status === 'on_track' ? 'Đang Tiến Độ' : 'Cảnh Báo Chưa Đạt'}
                          </span>
                          <h3 className="font-black text-sm sm:text-base text-slate-900">{kpi.name}</h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-4 text-xs mt-2 text-slate-600">
                          <span>Chỉ tiêu: <strong className="text-slate-900">{kpi.unit === 'VNĐ' ? formatVND(kpi.target) : `${kpi.target} ${kpi.unit}`}</strong></span>
                          <span>Thực tế: <strong className="text-slate-900">{kpi.unit === 'VNĐ' ? formatVND(kpi.actual) : `${kpi.actual} ${kpi.unit}`}</strong></span>
                          <span>Tỷ lệ: <strong className={isUnderperforming ? 'text-rose-600' : 'text-emerald-600'}>{kpi.achievementRate}%</strong></span>
                          {kpi.gap > 0 && (
                            <span className="text-rose-700 font-semibold">Khoảng thiếu (Gap): {kpi.unit === 'VNĐ' ? formatVND(kpi.gap) : `${kpi.gap} ${kpi.unit}`}</span>
                          )}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingKpi(kpi)}
                        className="px-3.5 py-2 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 text-xs font-bold text-slate-800 flex items-center gap-1.5 shadow-xs transition-colors self-start lg:self-center"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" />
                        <span>Cập Nhật Giải Trình & Hành Động</span>
                      </button>
                    </div>

                    {/* Root cause and action plan details */}
                    <div className="mt-4 pt-3 border-t border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white/80 rounded-2xl border border-slate-200/60">
                        <span className="font-bold text-slate-900 block mb-1 text-[11px] uppercase tracking-wider text-rose-700">
                          🔍 Nguyên Nhân Gốc Rễ & Dữ Liệu Chứng Minh:
                        </span>
                        <p className="text-slate-700 leading-relaxed">{kpi.rootCause || 'Chưa ghi nhận nguyên nhân'}</p>
                        {kpi.proofData && (
                          <div className="mt-1.5 text-[11px] text-slate-500 italic">
                            Số liệu đối chứng: {kpi.proofData}
                          </div>
                        )}
                      </div>

                      <div className="p-3 bg-white/80 rounded-2xl border border-slate-200/60">
                        <span className="font-bold text-slate-900 block mb-1 text-[11px] uppercase tracking-wider text-emerald-700">
                          ⚡ Biện Pháp Khắc Phục, PIC & Hạn Chót:
                        </span>
                        <p className="text-slate-700 leading-relaxed">{kpi.correctiveAction || 'Chưa lập kế hoạch xử lý'}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-3 text-[11px] text-slate-600">
                          {kpi.recoveryAmount && <span>Giá trị cần bù: <strong>{formatVND(kpi.recoveryAmount)}</strong></span>}
                          {kpi.pic && <span>PIC: <strong>{kpi.pic}</strong></span>}
                          {kpi.deadline && <span>Hạn chót: <strong>{kpi.deadline}</strong></span>}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 4: PERIODIC REPORTS & APPROVAL WORKFLOW */}
      {activeTab === 'reports_approval' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <span>Quy Trình Nộp & Phê Duyệt Báo Cáo Định Kỳ</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Draft → Submitted → Reviewed → Approved → Locked (Khóa dữ liệu lịch sử)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsSubmitReportOpen(true)}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-xs transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span>Tạo & Nộp Báo Cáo Mới</span>
              </button>
            </div>

            <div className="space-y-3">
              {reports.map((rep) => {
                const isApproved = rep.status === 'approved' || rep.status === 'locked';
                const isReturned = rep.status === 'returned';
                const isSubmitted = rep.status === 'submitted';
                return (
                  <div
                    key={rep.id}
                    className="p-4 sm:p-5 rounded-3xl border border-slate-200 hover:border-blue-300 bg-white transition-all shadow-xs"
                  >
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            rep.status === 'locked'
                              ? 'bg-purple-100 text-purple-800'
                              : rep.status === 'approved'
                              ? 'bg-emerald-100 text-emerald-800'
                              : rep.status === 'submitted'
                              ? 'bg-blue-100 text-blue-800'
                              : rep.status === 'returned'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {rep.status === 'locked' ? '🔒 Đã Khóa Lịch Sử' : rep.status.toUpperCase()}
                          </span>
                          <h3 className="font-bold text-sm sm:text-base text-slate-900">{rep.title}</h3>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-2">
                          <span>Người lập: <strong>{rep.authorName}</strong> ({rep.authorRole})</span>
                          <span>•</span>
                          <span>Đơn vị: <strong>{rep.department}</strong></span>
                          <span>•</span>
                          <span>Kỳ: <strong>{rep.periodLabel}</strong></span>
                          {rep.submittedAt && (
                            <>
                              <span>•</span>
                              <span>Nộp lúc: {rep.submittedAt}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedReportDetail(rep)}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Chi Tiết</span>
                        </button>

                        {isSubmitted && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleApproveReport(rep.id)}
                              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1 shadow-xs"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Phê Duyệt</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setReturningReportId(rep.id)}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Yêu Cầu Giải Trình</span>
                            </button>
                          </>
                        )}

                        {isApproved && (
                          <button
                            type="button"
                            onClick={() => handleToggleLockReport(rep.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors flex items-center gap-1 ${
                              rep.isLocked
                                ? 'bg-purple-100 text-purple-800 hover:bg-purple-200'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            {rep.isLocked ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                            <span>{rep.isLocked ? 'Mở Khóa' : 'Khóa Báo Cáo'}</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Returning prompt input */}
                    {returningReportId === rep.id && (
                      <div className="mt-3 p-3 bg-rose-50 rounded-2xl border border-rose-200 flex flex-col sm:flex-row items-center gap-2">
                        <input
                          type="text"
                          placeholder="Nhập lý do trả lại hoặc yêu cầu giải trình số liệu..."
                          value={returnReasonInput}
                          onChange={(e) => setReturnReasonInput(e.target.value)}
                          className="flex-1 bg-white border border-rose-300 rounded-xl px-3 py-1.5 text-xs text-slate-800 focus:outline-hidden focus:ring-2 focus:ring-rose-500"
                        />
                        <button
                          type="button"
                          onClick={() => handleReturnReport(rep.id)}
                          className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 whitespace-nowrap"
                        >
                          Xác Nhận Trả Lại
                        </button>
                        <button
                          type="button"
                          onClick={() => setReturningReportId(null)}
                          className="px-2 py-1.5 text-xs text-slate-500 hover:text-slate-700"
                        >
                          Hủy
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 5: AUDIT LOG */}
      {activeTab === 'audit_log' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-blue-600" />
                  <span>Nhật Ký Quản Trị & Truy Vết Hoạt Động (Audit Trail)</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ghi nhận đầy đủ: Ai sửa, sửa lúc nào, giá trị trước và sau khi thay đổi
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100">
              {auditLogs.map((log) => (
                <div key={log.id} className="py-3.5 flex items-start justify-between gap-3 text-xs">
                  <div className="flex items-start gap-3">
                    <span className="p-2 rounded-xl bg-slate-100 text-slate-600 mt-0.5">
                      <Shield className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="font-bold text-slate-900">{log.details}</div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Người thực hiện: <strong>{log.actorName}</strong> ({log.actorRole}) • Đối tượng: {log.targetType} #{log.targetId}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400 whitespace-nowrap">{log.timestamp}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. MODAL: EDIT KPI ROOT CAUSE & CORRECTIVE ACTION */}
      {editingKpi && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Giải Trình & Kế Hoạch Xử Lý KPI</h3>
                <p className="text-xs text-slate-500">{editingKpi.name} • Mục tiêu: {formatVND(editingKpi.target)}</p>
              </div>
              <button
                type="button"
                onClick={() => setEditingKpi(null)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-xl"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  1. Nguyên nhân cụ thể dẫn đến chưa đạt chỉ tiêu (Không ghi chung chung):
                </label>
                <textarea
                  rows={3}
                  value={editingKpi.rootCause || ''}
                  onChange={(e) => setEditingKpi({ ...editingKpi, rootCause: e.target.value })}
                  placeholder="Ví dụ: Đối tác A chậm bàn giao mặt bằng dự án..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  2. Dữ liệu / Số liệu chứng minh đối chứng:
                </label>
                <input
                  type="text"
                  value={editingKpi.proofData || ''}
                  onChange={(e) => setEditingKpi({ ...editingKpi, proofData: e.target.value })}
                  placeholder="Ví dụ: Đơn hàng ORD-2026-088, Báo giá BG-102..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  3. Biện pháp khắc phục cụ thể:
                </label>
                <textarea
                  rows={2}
                  value={editingKpi.correctiveAction || ''}
                  onChange={(e) => setEditingKpi({ ...editingKpi, correctiveAction: e.target.value })}
                  placeholder="Ví dụ: Triển khai chiến dịch đẩy mạnh đại lý cấp 1, chiết khấu 1.5%..."
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">4. Người chịu trách nhiệm (PIC):</label>
                  <input
                    type="text"
                    value={editingKpi.pic || ''}
                    onChange={(e) => setEditingKpi({ ...editingKpi, pic: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">5. Hạn chót hoàn thành (Deadline):</label>
                  <input
                    type="date"
                    value={editingKpi.deadline || ''}
                    onChange={(e) => setEditingKpi({ ...editingKpi, deadline: e.target.value })}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingKpi(null)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-bold hover:bg-slate-200"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleSaveKpiAction(editingKpi)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs"
              >
                Lưu Kế Hoạch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 9. MODAL: WIDGET CUSTOMIZATION FOR CEO/ADMIN */}
      {isCustomizeWidgetsOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <span>Tùy Biến Bố Cục Dashboard</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomizeWidgetsOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Chọn các khối widget quản trị hiển thị trên màn hình điều hành:
            </p>

            <div className="space-y-2.5 text-xs font-medium">
              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span>Thẻ KPI Trọng Yếu (Doanh số, Tiền thu, Nợ, Task)</span>
                <input
                  type="checkbox"
                  checked={widgetVisibility.kpiCards}
                  onChange={(e) => setWidgetVisibility({ ...widgetVisibility, kpiCards: e.target.checked })}
                  className="rounded-sm text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span>Sơ Đồ Luồng Tổng Hợp Bottom-Up</span>
                <input
                  type="checkbox"
                  checked={widgetVisibility.bottomUpFlow}
                  onChange={(e) => setWidgetVisibility({ ...widgetVisibility, bottomUpFlow: e.target.checked })}
                  className="rounded-sm text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer">
                <span>Ma Trận So Sánh Hiệu Suất Đơn Vị</span>
                <input
                  type="checkbox"
                  checked={widgetVisibility.performanceMatrix}
                  onChange={(e) => setWidgetVisibility({ ...widgetVisibility, performanceMatrix: e.target.checked })}
                  className="rounded-sm text-blue-600 focus:ring-blue-500 w-4 h-4"
                />
              </label>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCustomizeWidgetsOpen(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700"
              >
                Hoàn Tất
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
