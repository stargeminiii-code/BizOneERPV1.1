import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Building2,
  Layers,
  Users,
  DollarSign,
  Package,
  ShoppingCart,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  ChevronRight,
  Filter,
  RefreshCw,
  Plus,
  ArrowUpRight,
  Activity,
  Boxes,
  Zap,
  Target,
  FileText,
  Search,
  SlidersHorizontal,
  Send,
  Calendar,
  Sparkles,
  Shield,
  Truck,
  HelpCircle,
  Eye,
  BarChart3,
  ExternalLink,
  Globe
} from 'lucide-react';
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  Area
} from 'recharts';
import { useLanguage } from '../../i18n';
import {
  EnterpriseExecutiveKpi,
  BusinessFunctionMetric,
  EnterpriseAlert,
  PerformanceTimeSlice,
  INITIAL_EXECUTIVE_KPIS,
  INITIAL_BUSINESS_FUNCTIONS,
  INITIAL_ENTERPRISE_ALERTS,
  INITIAL_TIME_SLICES
} from '../../data/controlTowerData';
import {
  ControlTowerDrillDownDrawer,
  DrillDownTarget
} from './ControlTowerDrillDownDrawer';
import { ProductValueChainOverview } from './ProductValueChainOverview';
import { CustomerLifecycleSummaryWidget } from './CustomerLifecycleSummaryWidget';
import { WorkloadBottleneckMatrix } from './WorkloadBottleneckMatrix';
import { OmniChannelMarketingPerformance } from './OmniChannelMarketingPerformance';
import {
  FilterBuilderModal,
  GlobalFilterState
} from '../Dashboard/FilterBuilderModal';
import {
  Order,
  Customer,
  CrmTask,
  InventoryLayer,
  PurchaseOrder,
  CashTransaction,
  UserAccount,
  Warehouse,
  Supplier,
  Product,
  OrgLevel
} from '../../types';
import { formatNumberWithDots } from '../../data/administrativeData';

interface EnterpriseControlTowerProps {
  orders?: Order[];
  customers?: Customer[];
  inventoryLots?: InventoryLayer[];
  crmTasks?: CrmTask[];
  cashTransactions?: CashTransaction[];
  purchaseOrders?: PurchaseOrder[];
  warehouses?: Warehouse[];
  suppliers?: Supplier[];
  products?: Product[];
  users?: UserAccount[];
  currentUser?: UserAccount;
  onNavigateToView?: (view: string, filter?: string) => void;
  onSelectOrder?: (order: Order) => void;
  onSelectCustomer?: (customer: Customer) => void;
}

export const EnterpriseControlTower: React.FC<EnterpriseControlTowerProps> = ({
  orders = [],
  customers = [],
  inventoryLots = [],
  crmTasks = [],
  cashTransactions = [],
  purchaseOrders = [],
  warehouses = [],
  suppliers = [],
  products = [],
  users = [],
  currentUser,
  onNavigateToView,
  onSelectOrder,
  onSelectCustomer
}) => {
  // Global Filters
  const [timePeriod, setTimePeriod] = useState<'day' | 'week' | 'month' | 'quarter' | 'year'>('month');
  const [selectedOrgLevel, setSelectedOrgLevel] = useState<OrgLevel>(currentUser?.managementLevel || 'ceo_chairman');
  const [selectedDivision, setSelectedDivision] = useState<string>('ALL');
  const [selectedBranch, setSelectedBranch] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'good' | 'warning' | 'critical'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [perspectiveTab, setPerspectiveTab] = useState<'all' | 'inventory' | 'retail' | 'wholesale' | 'online' | 'beverages'>('all');
  const [isFilterBuilderOpen, setIsFilterBuilderOpen] = useState(false);
  const [globalFilter, setGlobalFilter] = useState<GlobalFilterState>({
    timePeriod: 'this_month',
    branchId: 'ALL',
    warehouseId: 'ALL',
    businessModels: ['retail', 'wholesale', 'online', 'fnb'],
    channel: 'ALL',
    productGroup: 'ALL',
    customConditions: []
  });

  // Language State from Context
  const { language, setLanguage, t } = useLanguage();

  const handleToggleLanguage = (lang: 'vi' | 'en') => {
    setLanguage(lang);
  };

  // Helper for localized KPI titles
  const getKpiTitle = (kpiId: string, defaultTitle: string) => {
    if (language === 'vi') {
      switch (kpiId) {
        case 'kpi-rev': return 'DOANH THU THUẦN';
        case 'kpi-profit': return 'LỢI NHUẬN GỘP';
        case 'kpi-cash': return 'THANH KHOẢN TIỀN MẶT';
        case 'kpi-debt': return 'CÔNG NỢ PHẢI THU';
        case 'kpi-inv': return 'TỒN KHO & FIFO';
        case 'kpi-order': return 'TỔNG ĐƠN HÀNG';
        case 'kpi-cust': return 'KHÁCH HÀNG MỚI';
        case 'kpi-prod': return 'SẢN LƯỢNG NHÀ MÁY';
        case 'kpi-otif': return 'GIAO HÀNG OTIF';
        case 'kpi-cskh': return 'HÀI LÒNG CSAT';
        case 'kpi-cost': return 'TIẾT KIỆM CHI PHÍ';
        case 'kpi-overall': return 'KPI TỔNG THỂ';
        default: return defaultTitle;
      }
    } else {
      switch (kpiId) {
        case 'kpi-rev': return 'NET REVENUE';
        case 'kpi-profit': return 'GROSS PROFIT';
        case 'kpi-cash': return 'CASH LIQUIDITY';
        case 'kpi-debt': return 'ACCOUNTS RECEIVABLE';
        case 'kpi-inv': return 'INVENTORY & FIFO';
        case 'kpi-order': return 'TOTAL ORDERS';
        case 'kpi-cust': return 'NEW CUSTOMERS';
        case 'kpi-prod': return 'FACTORY OUTPUT';
        case 'kpi-otif': return 'OTIF DELIVERY';
        case 'kpi-cskh': return 'CSAT SCORE';
        case 'kpi-cost': return 'COST SAVING';
        case 'kpi-overall': return 'COMPANY KPI';
        default: return defaultTitle;
      }
    }
  };

  // Live datasets
  const [executiveKpis, setExecutiveKpis] = useState<EnterpriseExecutiveKpi[]>(INITIAL_EXECUTIVE_KPIS);
  const [businessFunctions, setBusinessFunctions] = useState<BusinessFunctionMetric[]>(INITIAL_BUSINESS_FUNCTIONS);
  const [enterpriseAlerts, setEnterpriseAlerts] = useState<EnterpriseAlert[]>(INITIAL_ENTERPRISE_ALERTS);

  // Drilldown Drawer State
  const [drillDownTarget, setDrillDownTarget] = useState<DrillDownTarget | null>(null);

  // Time-slice Chart Data
  const timeSliceData = INITIAL_TIME_SLICES[timePeriod];

  // Dynamic calculations from actual transactions
  const realTimeRevenue = useMemo(() => {
    return orders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [orders]);

  const realTimeInventoryValue = useMemo(() => {
    return inventoryLots.reduce((sum, l) => {
      const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
      const cost = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
      return sum + qty * cost;
    }, 0);
  }, [inventoryLots]);

  const realTimeCustomerDebt = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.debt) || 0), 0);
  }, [customers]);

  const activeAlertCount = useMemo(() => {
    return enterpriseAlerts.filter((a) => a.status !== 'resolved').length;
  }, [enterpriseAlerts]);

  // Filtered Business Functions
  const filteredFunctions = useMemo(() => {
    return businessFunctions.filter((bf) => {
      const nameMatch = language === 'en' && bf.nameEn ? bf.nameEn : bf.name;
      const matchSearch =
        !searchTerm ||
        nameMatch.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bf.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bf.headOfDepartment.toLowerCase().includes(searchTerm.toLowerCase()) ||
        bf.primaryKpiSummary.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus = statusFilter === 'ALL' || bf.status === statusFilter;
      const matchDiv = selectedDivision === 'ALL' || bf.category === selectedDivision;

      return matchSearch && matchStatus && matchDiv;
    });
  }, [businessFunctions, searchTerm, statusFilter, selectedDivision, language]);

  // Handle Delegate Task from Drawer
  const handleDelegateTask = (newTaskData: Partial<CrmTask>) => {
    // Alert user & update local tasks/alerts state if needed
    const alertId = 'alt-task-' + Date.now();
    const newAlert: EnterpriseAlert = {
      id: alertId,
      type: 'overdue_task',
      severity: 'warning',
      title: `[Mới giao] ${newTaskData.title}`,
      description: newTaskData.notes || newTaskData.note || 'Chỉ đạo từ Executive Dashboard',
      impactValue: 'Theo dõi tiến độ',
      department: 'Phòng ban nhận việc',
      pic: newTaskData.assignedTo || 'Chưa gán',
      deadline: newTaskData.dueDate,
      status: 'in_progress',
      linkedEntityType: 'task'
    };

    setEnterpriseAlerts((prev) => [newAlert, ...prev]);
  };

  return (
    <div id="enterprise-executive-control-tower" className="space-y-5 pb-12 max-w-[1680px] mx-auto">
      {/* ========================================================================= */}
      {/* 1. DASHBOARD HEADER & GLOBAL FILTER TOOLBAR                                */}
      {/* ========================================================================= */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-xl border border-slate-800 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <span className="px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs">
                BizOne ERP
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>{language === 'vi' ? 'Dữ liệu thời gian thực' : 'Real-time Metrics'}</span>
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2.5">
              <Building2 className="w-6 h-6 text-blue-400" />
              <span>DASHBOARD</span>
            </h1>
          </div>

          {/* Controls: Language switcher, Filter builder button, Time Slice */}
          <div className="flex items-center gap-2.5 flex-wrap self-start lg:self-auto">
            {/* Language Switcher Toggle */}
            <div className="flex items-center bg-slate-800 p-1 rounded-2xl border border-slate-700 font-bold text-xs">
              <button
                type="button"
                onClick={() => handleToggleLanguage('vi')}
                className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  language === 'vi'
                    ? 'bg-blue-600 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Chuyển sang Tiếng Việt"
              >
                <span>🇻🇳</span>
                <span>VI</span>
              </button>
              <button
                type="button"
                onClick={() => handleToggleLanguage('en')}
                className={`px-2.5 py-1.5 rounded-xl transition-all flex items-center gap-1.5 ${
                  language === 'en'
                    ? 'bg-blue-600 text-white shadow-md font-black'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                }`}
                title="Switch to English"
              >
                <span>🇬🇧</span>
                <span>EN</span>
              </button>
            </div>

            <button
              onClick={() => setIsFilterBuilderOpen(true)}
              className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-md cursor-pointer transition-all active:scale-95"
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{language === 'vi' ? '+ Thêm Bộ Lọc' : '+ Custom Filter'}</span>
              {globalFilter.customConditions.length > 0 && (
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              )}
            </button>

            <div className="flex items-center bg-slate-800 p-1.5 rounded-2xl border border-slate-700 font-bold text-xs">
              {(['day', 'week', 'month', 'quarter', 'year'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setTimePeriod(period)}
                  className={`px-3 py-1.5 rounded-xl transition-all capitalize ${
                    timePeriod === period
                      ? 'bg-blue-600 text-white shadow-md font-black'
                      : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                  }`}
                >
                  {language === 'vi'
                    ? (period === 'day' ? 'Ngày' : period === 'week' ? 'Tuần' : period === 'month' ? 'Tháng' : period === 'quarter' ? 'Quý' : 'Năm')
                    : (period === 'day' ? 'Day' : period === 'week' ? 'Week' : period === 'month' ? 'Month' : period === 'quarter' ? 'Quarter' : 'Year')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 6 Business Perspective Tabs */}
        <div className="pt-3 border-t border-slate-800 flex items-center gap-2 overflow-x-auto pb-1 text-xs">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider shrink-0 mr-1">
            {language === 'vi' ? 'Góc nhìn:' : 'Perspective:'}
          </span>
          <button
            onClick={() => setPerspectiveTab('all')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              perspectiveTab === 'all'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            🌟 {language === 'vi' ? 'Tổng quan' : 'Overview'}
          </button>
          <button
            onClick={() => setPerspectiveTab('inventory')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              perspectiveTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            📦 {language === 'vi' ? 'Kho & FIFO' : 'Inventory & FIFO'}
          </button>
          <button
            onClick={() => setPerspectiveTab('retail')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              perspectiveTab === 'retail'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            🏪 {language === 'vi' ? 'Bán lẻ' : 'Retail'}
          </button>
          <button
            onClick={() => setPerspectiveTab('wholesale')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              perspectiveTab === 'wholesale'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            🏢 {language === 'vi' ? 'Bán buôn' : 'Wholesale'}
          </button>
          <button
            onClick={() => setPerspectiveTab('online')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              perspectiveTab === 'online'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            🌐 {language === 'vi' ? 'Online' : 'Online'}
          </button>
          <button
            onClick={() => setPerspectiveTab('beverages')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
              perspectiveTab === 'beverages'
                ? 'bg-amber-600 text-white shadow-xs'
                : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            ☕ {language === 'vi' ? 'F&B' : 'F&B'}
          </button>
        </div>

        {/* Global Multi-Dimension Scope Filter Strip */}
        <div className="pt-3 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {/* 5-Level Scope */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              {language === 'vi' ? 'Cấp Quản Trị' : 'Hierarchy Scope'}
            </label>
            <select
              value={selectedOrgLevel}
              onChange={(e) => setSelectedOrgLevel(e.target.value as OrgLevel)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ceo_chairman">{language === 'vi' ? 'Cấp 5: Tổng Giám Đốc / HĐQT' : 'Level 5: CEO & Board'}</option>
              <option value="deputy_ceo">{language === 'vi' ? 'Cấp 4: Phó TGĐ / Lãnh Đạo Khối' : 'Level 4: Deputy CEO / Division'}</option>
              <option value="director">{language === 'vi' ? 'Cấp 3: Giám Đốc Chi Nhánh / Vùng' : 'Level 3: Regional / Branch Director'}</option>
              <option value="team_lead">{language === 'vi' ? 'Cấp 2: Trưởng Phòng / Team Lead' : 'Level 2: Manager / Team Lead'}</option>
              <option value="individual">{language === 'vi' ? 'Cấp 1: Chuyên Viên / Cá Nhân' : 'Level 1: Specialist / Individual'}</option>
            </select>
          </div>

          {/* Division / Function Filter */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              {language === 'vi' ? 'Khối Chức Năng' : 'Business Function'}
            </label>
            <select
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">{language === 'vi' ? 'Toàn bộ 16 Khối' : 'All 16 Departments'}</option>
              <option value="sales">{language === 'vi' ? 'Kinh Doanh' : 'Sales'}</option>
              <option value="marketing">{language === 'vi' ? 'Marketing' : 'Marketing'}</option>
              <option value="cskh">{language === 'vi' ? 'Chăm Sóc Khách Hàng' : 'Customer Service'}</option>
              <option value="finance">{language === 'vi' ? 'Tài Chính - Kế Toán' : 'Finance & Accounting'}</option>
              <option value="warehouse">{language === 'vi' ? 'Kho Vận & FIFO' : 'Warehouse & Inventory'}</option>
              <option value="production">{language === 'vi' ? 'Sản Xuất & Nhà Máy' : 'Manufacturing & Factory'}</option>
              <option value="procurement">{language === 'vi' ? 'Mua Hàng & NCC' : 'Procurement'}</option>
              <option value="supply_chain">{language === 'vi' ? 'Chuỗi Cung Ứng' : 'Supply Chain'}</option>
              <option value="retail">{language === 'vi' ? 'Chuỗi Bán Lẻ' : 'Retail'}</option>
              <option value="ecommerce">{language === 'vi' ? 'Thương Mại Điện Tử' : 'E-Commerce'}</option>
            </select>
          </div>

          {/* Branch / Region Filter */}
          <div>
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              {language === 'vi' ? 'Chi Nhánh / Vùng' : 'Branch / Location'}
            </label>
            <select
              value={selectedBranch}
              onChange={(e) => setSelectedBranch(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs font-semibold focus:ring-2 focus:ring-blue-500 focus:outline-none"
            >
              <option value="ALL">{language === 'vi' ? 'Tất cả chi nhánh & Nhà máy' : 'All Branches & Factories'}</option>
              <option value="HN">{language === 'vi' ? 'Trụ sở & Mega Hub Hà Nội' : 'Hanoi HQ & Mega Hub'}</option>
              <option value="HCM">{language === 'vi' ? 'Chi Nhánh & Kho TP.HCM' : 'HCMC Branch & Warehouse'}</option>
              <option value="DN">{language === 'vi' ? 'Chi Nhánh Đà Nẵng' : 'Da Nang Branch'}</option>
              <option value="NM1">{language === 'vi' ? 'Nhà Máy Sản Xuất 1 (Bắc Thăng Long)' : 'Factory 1 (Bac Thang Long)'}</option>
              <option value="NM2">{language === 'vi' ? 'Nhà Máy Chế Biến 2 (Tân Bình)' : 'Factory 2 (Tan Binh)'}</option>
            </select>
          </div>

          {/* Search & Status Quick Filter */}
          <div className="relative">
            <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
              {language === 'vi' ? 'Tìm kiếm & Trạng thái' : 'Search & Status'}
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder={language === 'vi' ? 'Tìm KPI, Khối, PIC...' : 'Search KPI, Division, PIC...'}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 text-white pl-8 pr-3 py-1.5 text-xs rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none placeholder:text-slate-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="bg-slate-800 border border-slate-700 text-white rounded-xl px-2 py-1.5 text-xs font-semibold"
              >
                <option value="ALL">{language === 'vi' ? 'Tất cả' : 'All'}</option>
                <option value="good">{language === 'vi' ? '✓ Đạt' : '✓ Good'}</option>
                <option value="warning">{language === 'vi' ? '⚠ Cảnh báo' : '⚠ Warning'}</option>
                <option value="critical">{language === 'vi' ? '🔴 Nguy cơ' : '🔴 At-Risk'}</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. EXECUTIVE KPI STRIP (12 Core Indicators - All Clickable Drilldown!)     */}
      {/* ========================================================================= */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h2 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-blue-600" />
            <span>{language === 'vi' ? 'CHỈ SỐ HIỆU SUẤT CỐT LÕI' : 'KEY PERFORMANCE INDICATORS'}</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {executiveKpis.map((kpi) => {
            const isWarning = kpi.status === 'warning';
            const isCritical = kpi.status === 'critical';
            const isExcellent = kpi.status === 'excellent';
            const displayTitle = getKpiTitle(kpi.id, kpi.title);

            return (
              <button
                key={kpi.id}
                type="button"
                onClick={() => setDrillDownTarget({ type: 'kpi', data: kpi })}
                className={`bg-white rounded-2xl p-3.5 border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left group flex flex-col justify-between cursor-pointer ${
                  isCritical
                    ? 'border-rose-300 bg-rose-50/20'
                    : isWarning
                    ? 'border-amber-300 bg-amber-50/15'
                    : 'border-slate-200 hover:border-blue-400'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span className="text-[10px] font-extrabold uppercase text-slate-500 truncate group-hover:text-blue-600 transition-colors">
                      {displayTitle}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-md ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : isExcellent
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {kpi.achievementRate}%
                    </span>
                  </div>

                  <div className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                    {kpi.formattedActual}
                  </div>
                </div>

                <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between text-[10px] text-slate-500">
                    <span>Plan: <strong>{kpi.formattedPlan}</strong></span>
                    <span
                      className={`font-bold ${
                        kpi.gap < 0 && !kpi.formattedGap.includes('Tiết kiệm')
                          ? 'text-rose-600'
                          : 'text-emerald-600'
                      }`}
                    >
                      {kpi.formattedGap}
                    </span>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isCritical
                          ? 'bg-rose-500'
                          : isWarning
                          ? 'bg-amber-500'
                          : isExcellent
                          ? 'bg-emerald-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(kpi.achievementRate, 100)}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. ENTERPRISE PERFORMANCE MATRIX & UNIFIED TREND CHART                    */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Unified Enterprise Chart */}
        <div className="lg:col-span-2 bg-white p-5 rounded-3xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-600" />
                <span>{language === 'vi' ? 'KẾ HOẠCH vs THỰC HIỆN vs DỰ BÁO' : 'PLAN vs ACTUAL vs FORECAST'}</span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {language === 'vi'
                  ? 'Theo dõi Doanh thu, Chi phí, Lợi nhuận và Sản lượng thành phẩm'
                  : 'Track Revenue, Cost, Profit, and Output across periods'}
              </p>
            </div>

            <span className="text-xs bg-slate-100 text-slate-700 font-bold px-3 py-1 rounded-xl">
              {language === 'vi' ? 'Kỳ' : 'Period'}: <strong className="capitalize">{timePeriod}</strong>
            </span>
          </div>

          <div className="h-64 sm:h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={timeSliceData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="periodLabel" tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
                <YAxis
                  yAxisId="left"
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(val) => (val / 1000000000).toFixed(0) + 'B'}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  domain={[80, 110]}
                  tick={{ fill: '#64748B', fontSize: 10 }}
                  tickFormatter={(val) => `${val}%`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#0F172A',
                    borderRadius: '16px',
                    color: '#F8FAFC',
                    fontSize: '11px',
                    border: 'none',
                    boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)'
                  }}
                  formatter={(value: any, name: string) => {
                    if (name === 'Tỷ Lệ Đạt' || name === 'Achievement Rate') return [`${value}%`, name];
                    return [formatNumberWithDots(value) + ' đ', name];
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', fontWeight: 600, paddingTop: '8px' }} />
                <Bar yAxisId="left" dataKey="planRevenue" name={language === 'vi' ? 'Kế Hoạch Doanh Thu' : 'Planned Revenue'} fill="#94A3B8" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="left" dataKey="actualRevenue" name={language === 'vi' ? 'Thực Hiện Doanh Thu' : 'Actual Revenue'} fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="forecastRevenue"
                  name={language === 'vi' ? 'Dự Báo Run-rate' : 'Forecast Run-rate'}
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  strokeDasharray="4 4"
                  dot={{ r: 4, fill: '#F59E0B' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="achievementRate"
                  name={language === 'vi' ? 'Tỷ Lệ Đạt' : 'Achievement Rate'}
                  stroke="#10B981"
                  strokeWidth={3}
                  dot={{ r: 4, fill: '#10B981' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Centralized Enterprise Alert Center */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-xs font-black uppercase text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600" />
              <span>{language === 'vi' ? `CẢNH BÁO TẬP TRUNG (${activeAlertCount})` : `CENTRAL ALERTS (${activeAlertCount})`}</span>
            </h2>
            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
              {language === 'vi' ? 'Cần xử lý' : 'Action Required'}
            </span>
          </div>

          {/* Alert list */}
          <div className="space-y-2.5 overflow-y-auto max-h-[290px] pr-1">
            {enterpriseAlerts.map((alt) => {
              const isCrit = alt.severity === 'critical';
              const isWarn = alt.severity === 'warning';

              return (
                <button
                  key={alt.id}
                  type="button"
                  onClick={() => setDrillDownTarget({ type: 'alert', data: alt })}
                  className={`w-full p-3 rounded-2xl border text-left transition-all hover:shadow-sm cursor-pointer space-y-1 ${
                    isCrit
                      ? 'border-rose-300 bg-rose-50/30 hover:bg-rose-50/60'
                      : isWarn
                      ? 'border-amber-300 bg-amber-50/30 hover:bg-amber-50/60'
                      : 'border-emerald-200 bg-emerald-50/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <span className="font-bold text-xs text-slate-900 line-clamp-1">{alt.title}</span>
                    <span
                      className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded shrink-0 ${
                        isCrit ? 'bg-rose-600 text-white' : isWarn ? 'bg-amber-600 text-white' : 'bg-emerald-600 text-white'
                      }`}
                    >
                      {alt.impactValue}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">{alt.description}</p>
                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1">
                    <span>PIC: <strong>{alt.pic}</strong></span>
                    <span className="text-blue-600 font-bold flex items-center gap-0.5">
                      <span>{language === 'vi' ? 'Mở giải pháp' : 'View Action'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PERFORMANCE BY BUSINESS FUNCTION (16 Khối Chức Năng Hợp Nhất)          */}
      {/* ========================================================================= */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-1">
          <div>
            <h2 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-blue-600" />
              <span>{language === 'vi' ? 'HIỆU SUẤT THEO KHỐI CHỨC NĂNG' : 'PERFORMANCE BY BUSINESS FUNCTION'}</span>
            </h2>
          </div>

          <span className="text-xs text-slate-600 font-bold bg-slate-100 px-3 py-1 rounded-xl self-start sm:self-auto">
            {language === 'vi' ? `Hiển thị ${filteredFunctions.length} / 16 Khối` : `Showing ${filteredFunctions.length} / 16 Departments`}
          </span>
        </div>

        {/* 16 Functional Blocks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredFunctions.map((bf) => {
            const isCritical = bf.status === 'critical';
            const isWarning = bf.status === 'warning';
            const isExcellent = bf.status === 'excellent';
            const displayName = language === 'en' && bf.nameEn ? bf.nameEn : bf.name;

            return (
              <button
                key={bf.id}
                type="button"
                onClick={() => setDrillDownTarget({ type: 'function', data: bf })}
                className={`bg-white rounded-3xl p-4 border shadow-xs hover:shadow-md hover:-translate-y-0.5 transition-all text-left group flex flex-col justify-between cursor-pointer space-y-3 ${
                  isCritical
                    ? 'border-rose-300 bg-rose-50/15'
                    : isWarning
                    ? 'border-amber-300 bg-amber-50/10'
                    : 'border-slate-200 hover:border-blue-400'
                }`}
              >
                {/* Header */}
                <div>
                  <div className="flex items-start justify-between gap-1 mb-1">
                    <span className="font-black text-xs text-slate-900 group-hover:text-blue-600 transition-colors">
                      {displayName}
                    </span>
                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full shrink-0 ${
                        isCritical
                          ? 'bg-rose-100 text-rose-800'
                          : isWarning
                          ? 'bg-amber-100 text-amber-800'
                          : isExcellent
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {bf.achievementRate}%
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-500 font-medium truncate">
                    {language === 'vi' ? 'Trưởng ban' : 'Head'}: {bf.headOfDepartment}
                  </div>
                </div>

                {/* Primary KPI compact summary */}
                <div className="bg-slate-50 p-2.5 rounded-2xl text-[11px] font-semibold text-slate-700 leading-snug border border-slate-100">
                  {bf.primaryKpiSummary}
                </div>

                {/* Key indicators list */}
                <div className="space-y-1.5 pt-1">
                  {bf.keyIndicators.slice(0, 2).map((ind, idx) => (
                    <div key={idx} className="flex items-center justify-between text-[11px] text-slate-600">
                      <span className="truncate max-w-[140px]">{ind.name}:</span>
                      <strong className="text-slate-900">{ind.actual} ({ind.rate}%)</strong>
                    </div>
                  ))}
                </div>

                {/* Footer status & drilldown prompt */}
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px]">
                  <span className="text-slate-500">
                    {bf.alertCount > 0 ? (
                      <span className="text-amber-700 font-bold flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-amber-600" />
                        <span>{language === 'vi' ? `${bf.alertCount} Cảnh báo` : `${bf.alertCount} Alerts`}</span>
                      </span>
                    ) : (
                      <span className="text-emerald-700 font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                        <span>{language === 'vi' ? 'Vận hành tốt' : 'Good'}</span>
                      </span>
                    )}
                  </span>

                  <span className="text-blue-600 font-extrabold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                    <span>{language === 'vi' ? 'Phân rã' : 'Drilldown'}</span>
                    <ChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 5. END-TO-END PRODUCT VALUE CHAIN OVERVIEW                                */}
      {/* ========================================================================= */}
      <ProductValueChainOverview
        onSelectStage={(cat) => {
          const matched = businessFunctions.find((b) => b.category === cat);
          if (matched) {
            setDrillDownTarget({ type: 'function', data: matched });
          }
        }}
      />

      {/* ========================================================================= */}
      {/* 6. CUSTOMER LIFECYCLE JOURNEY (4 PHASES)                                  */}
      {/* ========================================================================= */}
      <CustomerLifecycleSummaryWidget
        customers={customers}
        crmTasks={crmTasks}
        onSelectCustomer={onSelectCustomer}
        onNavigateToCrm={() => onNavigateToView && onNavigateToView('crm')}
      />

      {/* ========================================================================= */}
      {/* 7. OMNI-CHANNEL MARKETING & GENSEO STRIP                                 */}
      {/* ========================================================================= */}
      <OmniChannelMarketingPerformance
        onNavigateToGenSeo={() => onNavigateToView && onNavigateToView('genseo')}
      />

      {/* ========================================================================= */}
      {/* 8. WORKLOAD & BOTTLENECK ALLOCATION MATRIX                                */}
      {/* ========================================================================= */}
      <WorkloadBottleneckMatrix
        users={users}
        crmTasks={crmTasks}
        onOpenDelegateTask={(assignee) => {
          const targetKpi = executiveKpis[0];
          setDrillDownTarget({ type: 'kpi', data: targetKpi });
        }}
      />

      {/* ========================================================================= */}
      {/* 9. INTERACTIVE DRILL-DOWN DETAIL DRAWER                                   */}
      {/* ========================================================================= */}
      <ControlTowerDrillDownDrawer
        target={drillDownTarget}
        onClose={() => setDrillDownTarget(null)}
        users={users}
        orders={orders}
        customers={customers}
        inventoryLots={inventoryLots}
        crmTasks={crmTasks}
        cashTransactions={cashTransactions}
        purchaseOrders={purchaseOrders}
        onDelegateTask={handleDelegateTask}
        onSelectOrder={onSelectOrder}
        onSelectCustomer={onSelectCustomer}
      />

      {/* ========================================================================= */}
      {/* 10. ADVANCED GLOBAL FILTER BUILDER MODAL                                  */}
      {/* ========================================================================= */}
      <FilterBuilderModal
        isOpen={isFilterBuilderOpen}
        onClose={() => setIsFilterBuilderOpen(false)}
        onApplyFilter={(filters) => {
          setGlobalFilter(filters);
          // Sync with local state if applicable
          if (filters.branchId !== 'ALL') setSelectedBranch(filters.branchId);
        }}
        initialFilter={globalFilter}
      />
    </div>
  );
};
