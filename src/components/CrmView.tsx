import React, { useState } from 'react';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  Sparkles,
  PhoneCall,
  DollarSign,
  AlertCircle,
  FileText,
  FileSpreadsheet,
  Download,
  Upload,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  Clock,
  Calendar,
  Filter,
  CheckSquare,
  AlertTriangle,
  Building2,
  ChevronRight,
  TrendingUp,
  LayoutGrid,
  List,
  Globe,
  Briefcase,
  CreditCard,
  Gift,
  Award
} from 'lucide-react';
import { Customer, CrmTask, CrmTaskPriority, CrmTaskStatus, UserAccount, CustomerSpecialOccasion, LoyaltyTransaction } from '../types';
import { formatNumberWithDots } from '../data/administrativeData';
import { getDaysRemaining, LOYALTY_TIER_CONFIG, OCCASION_TYPE_CONFIG } from '../data/specialOccasionsData';
import { exportCustomersToExcel } from '../utils/excelEngine';
import { DeleteCustomerModal } from './Modals/DeleteCustomerModal';
import { TaskListView } from './TaskManagement/TaskListView';
import { TaskCalendarView } from './TaskManagement/TaskCalendarView';
import { TaskGanttView } from './TaskManagement/TaskGanttView';
import { TaskReportsView } from './TaskManagement/TaskReportsView';
import { TaskEmailConfigMatrix } from './TaskManagement/TaskEmailConfigMatrix';
import { TaskOverviewView } from './TaskManagement/TaskOverviewView';
import { SpecialOccasionsDashboard } from './SpecialOccasions/SpecialOccasionsDashboard';
import { CustomerJourneyPipeline, STAGES_CONFIG } from './CrmJourney/CustomerJourneyPipeline';

interface CrmViewProps {
  customers: Customer[];
  crmTasks?: CrmTask[];
  users?: UserAccount[];
  specialOccasions?: CustomerSpecialOccasion[];
  loyaltyTransactions?: LoyaltyTransaction[];
  onOpenCreateCustomer: () => void;
  onOpenEditCustomer: (customer: Customer) => void;
  onOpenCustomerDetail: (customer: Customer) => void;
  onDeleteCustomer: (customerId: string) => void;
  onOpenCrmTask: (customerName?: string, taskTitle?: string) => void;
  onOpenImportCustomers: () => void;
  onOpenCreateOrder: (customerName?: string) => void;
  onToggleTaskComplete?: (taskId: string) => void;
  onDeleteTask?: (taskId: string) => void;
  onCheckinTask?: (taskId: string) => void;
  onBatchCheckin?: (taskIds: string[]) => void;
  onSaveUser?: (user: UserAccount) => void;
  onSaveOccasion?: (occasion: CustomerSpecialOccasion) => void;
  onDeleteOccasion?: (occasionId: string) => void;
  onUpdateOccasionStatus?: (occasionId: string, updates: Partial<CustomerSpecialOccasion>) => void;
  onGrantBonusPoints?: (customerId: string, points: number, reason: string) => void;
  onSaveLoyaltyTransaction?: (tx: LoyaltyTransaction) => void;
}

export const CrmView: React.FC<CrmViewProps> = ({
  customers = [],
  crmTasks = [],
  users = [],
  specialOccasions = [],
  loyaltyTransactions = [],
  onOpenCreateCustomer,
  onOpenEditCustomer,
  onOpenCustomerDetail,
  onDeleteCustomer,
  onOpenCrmTask,
  onOpenImportCustomers,
  onOpenCreateOrder,
  onToggleTaskComplete,
  onDeleteTask,
  onCheckinTask,
  onBatchCheckin,
  onSaveUser,
  onSaveOccasion,
  onDeleteOccasion,
  onUpdateOccasionStatus,
  onGrantBonusPoints,
  onSaveLoyaltyTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'customers' | 'journey' | 'tasks' | 'occasions' | 'insights'>('customers');
  const [taskSubTab, setTaskSubTab] = useState<'overview' | 'list' | 'calendar' | 'gantt' | 'reports' | 'email_config'>('overview');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);

  // Customer filters
  const [searchTerm, setSearchTerm] = useState('');
  const [groupFilter, setGroupFilter] = useState('all');
  const [debtFilter, setDebtFilter] = useState<'all' | 'has_debt' | 'no_debt'>('all');

  // Task filters
  const [taskStatusFilter, setTaskStatusFilter] = useState<string>('all');
  const [taskPriorityFilter, setTaskPriorityFilter] = useState<string>('all');
  const [taskSearchTerm, setTaskSearchTerm] = useState('');

  // Special occasions counts
  const todayOccasionsCount = specialOccasions.filter((o) => getDaysRemaining(o.date) === 0).length;
  const upcomingOccasionsCount = specialOccasions.filter((o) => {
    const d = getDaysRemaining(o.date);
    return d >= 0 && d <= 7;
  }).length;

  // Filtered customers
  const filteredCustomers = customers.filter((c) => {
    const matchSearch =
      (c.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.phone || '').includes(searchTerm) ||
      (c.code || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.taxCode || '').includes(searchTerm);

    const matchGroup = groupFilter === 'all' || c.group === groupFilter;

    const matchDebt =
      debtFilter === 'all'
        ? true
        : debtFilter === 'has_debt'
        ? (c.debt ?? 0) > 0
        : (c.debt ?? 0) === 0;

    return matchSearch && matchGroup && matchDebt;
  });

  // Filtered tasks
  const filteredTasks = crmTasks.filter((t) => {
    const matchSearch =
      (t.title || '').toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
      (t.customerName || '').toLowerCase().includes(taskSearchTerm.toLowerCase()) ||
      (t.assignedTo || '').toLowerCase().includes(taskSearchTerm.toLowerCase());

    const matchStatus = taskStatusFilter === 'all' || t.status === taskStatusFilter;
    const matchPriority = taskPriorityFilter === 'all' || t.priority === taskPriorityFilter;

    return matchSearch && matchStatus && matchPriority;
  });

  const totalDebt = customers.reduce((acc, c) => acc + (c.debt ?? 0), 0);
  const customersWithDebt = customers.filter((c) => (c.debt ?? 0) > 0).length;
  const pendingTasksCount = crmTasks.filter((t) => t.status === 'pending' || t.status === 'in_progress').length;
  const urgentTasksCount = crmTasks.filter((t) => (t.priority === 'urgent' || t.priority === 'high') && t.status !== 'completed').length;

  const formatVND = (v: number) => new Intl.NumberFormat('vi-VN').format(v) + ' đ';

  // Export Excel (.xlsx)
  const handleExportExcel = () => {
    exportCustomersToExcel(filteredCustomers, `Danh_sach_Khach_hang_BizOne_${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  const getPriorityBadge = (priority: CrmTaskPriority) => {
    switch (priority) {
      case 'urgent':
        return <span className="bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-bold text-[10px]">Khẩn cấp</span>;
      case 'high':
        return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-bold text-[10px]">Ưu tiên cao</span>;
      case 'normal':
        return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold text-[10px]">Bình thường</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium text-[10px]">Thấp</span>;
    }
  };

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'call_upsell':
        return '📞';
      case 'visit':
        return '🤝';
      case 'debt_reminder':
        return '💰';
      case 'zalo_quote':
        return '💬';
      case 'after_sales':
        return '⭐';
      case 'complaint_resolution':
        return '⚠️';
      default:
        return '📌';
    }
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1600px] mx-auto">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md shadow-blue-500/20">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                CRM
              </h1>
            </div>
          </div>
        </div>

        {/* Global Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={onOpenImportCustomers}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors"
            title="Nhập khách hàng từ file Excel hoặc CSV"
          >
            <Upload className="w-4 h-4 text-slate-500" />
            <span>Nhập Excel</span>
          </button>

          <button
            onClick={handleExportExcel}
            className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold border border-slate-200 shadow-xs flex items-center gap-1.5 transition-colors"
            title="Xuất danh sách ra file Excel (.xlsx)"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Xuất Excel (.xlsx)</span>
          </button>

          <button
            onClick={() => onOpenCrmTask()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
          >
            <PhoneCall className="w-4 h-4" />
            <span>+ Tạo tác vụ CSKH</span>
          </button>

          <button
            onClick={onOpenCreateCustomer}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>+ Thêm khách hàng</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Tổng công nợ phải thu</p>
            <h3 className="text-xl font-extrabold text-amber-600 mt-1 font-mono">
              {formatVND(totalDebt)}
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">Từ {customersWithDebt} khách hàng còn nợ</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Tổng khách hàng</p>
            <h3 className="text-xl font-extrabold text-slate-900 mt-1">{customers.length} đối tác</h3>
            <p className="text-[11px] text-emerald-600 font-semibold mt-0.5">Tỷ lệ hoạt động: 92%</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Users className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Tác vụ đang chờ xử lý</p>
            <h3 className="text-xl font-extrabold text-blue-600 mt-1">{pendingTasksCount} nhiệm vụ</h3>
            <p className="text-[11px] text-rose-600 font-bold mt-0.5">{urgentTasksCount} tác vụ khẩn cấp</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <p className="text-[11px] font-bold text-slate-500 uppercase">Cơ hội Upsell AI</p>
            <h3 className="text-xl font-extrabold text-emerald-600 mt-1">3 đề xuất mới</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Đến chu kỳ tái đặt hàng</p>
          </div>
          <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Sparkles className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex border-b border-slate-200 bg-white px-4 rounded-t-2xl shadow-xs gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab('customers')}
          className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'customers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Danh Sách Khách Hàng ({filteredCustomers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('journey')}
          className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'journey'
              ? 'border-indigo-600 text-indigo-600 font-extrabold'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-4 h-4 text-indigo-600" />
          <span>Hành Trình Khách Hàng (Phễu 9 Bước)</span>
          <span className="bg-indigo-100 text-indigo-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold">
            Pipeline
          </span>
        </button>

        <button
          onClick={() => setActiveTab('tasks')}
          className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'tasks'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <CheckSquare className="w-4 h-4" />
          <span>Quản Lý Tác Vụ & CSKH ({filteredTasks.length})</span>
          {pendingTasksCount > 0 && (
            <span className="bg-blue-100 text-blue-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingTasksCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('occasions')}
          className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'occasions'
              ? 'border-rose-600 text-rose-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Gift className="w-4 h-4 text-rose-500" />
          <span>Dịp Đặc Biệt & Tích Điểm ({specialOccasions.length})</span>
          {todayOccasionsCount > 0 ? (
            <span className="bg-rose-600 text-white text-[10px] px-2 py-0.5 rounded-full font-extrabold animate-pulse">
              Hôm nay: {todayOccasionsCount} 🎉
            </span>
          ) : upcomingOccasionsCount > 0 ? (
            <span className="bg-amber-100 text-amber-800 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              7 ngày: {upcomingOccasionsCount}
            </span>
          ) : null}
        </button>

        <button
          onClick={() => setActiveTab('insights')}
          className={`py-3.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'insights'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-500 hover:text-slate-900'
          }`}
        >
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span>Cơ Hội & Đề Xuất AI</span>
        </button>
      </div>

      {/* TAB 1: CUSTOMERS LIST */}
      {activeTab === 'customers' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên công ty, mã KH, số điện thoại, mã số thuế..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">Tất cả nhóm KH</option>
                <option value="VIP">Khách VIP</option>
                <option value="Doanh nghiệp">Doanh nghiệp</option>
                <option value="Đại lý">Đại lý</option>
                <option value="Cá nhân">Cá nhân / Thợ</option>
              </select>

              <select
                value={debtFilter}
                onChange={(e) => setDebtFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">Tất cả công nợ</option>
                <option value="has_debt">Đang có dư nợ</option>
                <option value="no_debt">Không có nợ (0 đ)</option>
              </select>

              {/* Layout Switcher */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setViewLayout('grid')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewLayout === 'grid' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'
                  }`}
                  title="Xem dạng thẻ (Grid)"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewLayout('table')}
                  className={`p-1.5 rounded-lg transition-colors ${
                    viewLayout === 'table' ? 'bg-white shadow-xs text-blue-600' : 'text-slate-500'
                  }`}
                  title="Xem dạng bảng (Table)"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* GRID LAYOUT */}
          {viewLayout === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-400 hover:shadow-md transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md border border-slate-200">
                        {customer.code}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            customer.group === 'VIP'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : customer.group === 'Doanh nghiệp'
                              ? 'bg-blue-50 text-blue-700 border-blue-200'
                              : customer.group === 'Đại lý'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-slate-50 text-slate-700 border-slate-200'
                          }`}
                        >
                          {customer.group}
                        </span>
                      </div>
                    </div>

                    <h3
                      onClick={() => onOpenCustomerDetail(customer)}
                      className="font-bold text-sm text-slate-900 line-clamp-1 cursor-pointer hover:text-blue-600 transition-colors"
                      title={customer.name}
                    >
                      {customer.name}
                    </h3>

                    <div className="space-y-1.5 mt-3 text-xs text-slate-600">
                      <div className="flex items-center gap-2">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold font-mono text-slate-800">{customer.phone}</span>
                        {customer.taxCode && (
                          <span className="text-[11px] text-slate-400 font-mono">
                            • MST: {customer.taxCode}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">
                          {customer.city ? `${customer.city} - ` : ''}
                          {customer.address}
                        </span>
                        {customer.isInternational && (
                          <span className="px-1.5 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded text-[9px] font-bold shrink-0">
                            {customer.country || 'Quốc tế'}
                          </span>
                        )}
                      </div>
                      {customer.assignedStaff && (
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500">
                          <Briefcase className="w-3 h-3 text-blue-500 shrink-0" />
                          <span>Phụ trách: <strong className="text-slate-700">{customer.assignedStaff}</strong></span>
                        </div>
                      )}
                      {customer.paymentTermRatio && (
                        <div className="flex items-center gap-1.5 text-[10px] text-amber-700 bg-amber-50/80 px-2 py-0.5 rounded-md border border-amber-200/60 font-medium">
                          <CreditCard className="w-3 h-3 shrink-0 text-amber-600" />
                          <span>{customer.creditTermsSummary || customer.paymentTermRatio}</span>
                        </div>
                      )}

                      {/* Loyalty & Occasion Badges */}
                      {(() => {
                        const custOccs = specialOccasions.filter((o) => o.customerId === customer.id);
                        const upcoming = custOccs.find((o) => {
                          const d = getDaysRemaining(o.date);
                          return d >= 0 && d <= 14;
                        });
                        const tier = customer.loyaltyTier || 'standard';
                        const tierCfg = LOYALTY_TIER_CONFIG[tier];

                        return (
                          <div className="space-y-1 pt-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className={`font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${tierCfg.badgeBg} ${tierCfg.badgeBorder} ${tierCfg.badgeText}`}>
                                <span>{tierCfg.icon}</span>
                                <span>{tierCfg.label}</span>
                              </span>
                              <span className="font-bold text-amber-700">
                                ⭐ {(customer.loyaltyPoints || 0).toLocaleString('vi-VN')} đ
                              </span>
                            </div>

                            {upcoming && (
                              <div className="flex items-center justify-between text-[10px] bg-rose-50 border border-rose-200 text-rose-800 px-2 py-1 rounded-lg">
                                <span className="font-bold flex items-center gap-1 truncate">
                                  <span>🎉</span>
                                  <span>{upcoming.title}</span>
                                </span>
                                <span className="font-extrabold text-rose-600 shrink-0 ml-1">
                                  {getDaysRemaining(upcoming.date) === 0 ? 'Hôm nay!' : `Còn ${getDaysRemaining(upcoming.date)} ngày`}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {customer.aiNotes && (
                      <div className="mt-3 p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 leading-relaxed">
                        <span className="font-bold text-emerald-800 flex items-center gap-1 mb-0.5">
                          <Sparkles className="w-3 h-3" /> Gợi ý AI:
                        </span>
                        {customer.aiNotes}
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-slate-100">
                    <div className="flex items-center justify-between text-xs mb-3">
                      <div>
                        <span className="text-slate-500 block text-[11px]">Công nợ / Hạn mức:</span>
                        <span className="text-[10px] text-slate-400 font-mono">
                          Hạn mức: {formatNumberWithDots(customer.creditLimit ?? 50000000)} đ
                        </span>
                      </div>
                      <span
                        className={`font-extrabold font-mono text-sm ${
                          (customer.debt ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'
                        }`}
                      >
                        {formatNumberWithDots(customer.debt ?? 0)} đ
                      </span>
                    </div>

                    {/* Card Actions */}
                    <div className="grid grid-cols-5 gap-1.5">
                      <button
                        onClick={() => onOpenCustomerDetail(customer)}
                        className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors"
                        title="Xem chi tiết hồ sơ & lịch sử đơn hàng"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Xem</span>
                      </button>

                      <button
                        onClick={() => onOpenCrmTask(customer.name)}
                        className="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors"
                        title="Tạo nhiệm vụ CSKH / Gọi điện / Nhắc nợ"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span>CSKH</span>
                      </button>

                      <button
                        onClick={() => onOpenCreateOrder(customer.name)}
                        className="py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1 transition-colors"
                        title="Lập đơn bán hàng mới cho khách này"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>Đơn</span>
                      </button>

                      <button
                        onClick={() => onOpenEditCustomer(customer)}
                        className="py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
                        title="Chỉnh sửa thông tin khách hàng"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => setCustomerToDelete(customer)}
                        className="py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 text-xs font-bold rounded-xl flex items-center justify-center transition-colors"
                        title="Xóa khách hàng này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TABLE LAYOUT */}
          {viewLayout === 'table' && (
            <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                    <tr>
                      <th className="p-3.5">Mã KH</th>
                      <th className="p-3.5">Tên khách hàng</th>
                      <th className="p-3.5">Tỉnh / Quốc gia</th>
                      <th className="p-3.5">Số điện thoại</th>
                      <th className="p-3.5">Mã số thuế</th>
                      <th className="p-3.5">Nhóm</th>
                      <th className="p-3.5 text-right">Công nợ / Hạn mức</th>
                      <th className="p-3.5">Điều khoản nợ</th>
                      <th className="p-3.5">Sales phụ trách</th>
                      <th className="p-3.5 text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCustomers.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-blue-600">{c.code}</td>
                        <td className="p-3.5 font-bold text-slate-900 cursor-pointer hover:text-blue-600" onClick={() => onOpenCustomerDetail(c)}>
                          <div>{c.name}</div>
                          {c.address && <div className="text-[10px] text-slate-400 font-normal truncate max-w-xs">{c.address}</div>}
                        </td>
                        <td className="p-3.5">
                          {c.isInternational ? (
                            <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 border border-indigo-200 rounded-md font-bold text-[10px] inline-flex items-center gap-1">
                              <Globe className="w-3 h-3" /> {c.country || 'Quốc tế'}
                            </span>
                          ) : (
                            <span className="text-slate-700 font-medium text-xs">
                              {c.city || 'Việt Nam'}
                            </span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-slate-700">{c.phone}</td>
                        <td className="p-3.5 font-mono text-slate-500">{c.taxCode || '—'}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium text-[10px]">
                            {c.group}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono">
                          <div className={`font-bold ${(c.debt ?? 0) > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                            {formatNumberWithDots(c.debt ?? 0)} đ
                          </div>
                          <div className="text-[10px] text-slate-400">
                            HM: {formatNumberWithDots(c.creditLimit ?? 50000000)} đ
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 font-medium whitespace-nowrap">
                            {c.creditTermsSummary || c.paymentTermRatio || 'Trả trước 70% • Nợ 30%'}
                          </span>
                        </td>
                        <td className="p-3.5 text-slate-600">
                          <div className="font-semibold text-slate-800">{c.assignedStaff || 'Lê Hoàng Nam'}</div>
                          {c.assignedStaffPhone && (
                            <div className="text-[10px] text-slate-400 font-mono">{c.assignedStaffPhone}</div>
                          )}
                        </td>
                        <td className="p-3.5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => onOpenCustomerDetail(c)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onOpenCrmTask(c.name)}
                              className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                              title="Tạo nhiệm vụ CSKH"
                            >
                              <PhoneCall className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onOpenCreateOrder(c.name)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Tạo đơn hàng"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => onOpenEditCustomer(c)}
                              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                              title="Chỉnh sửa"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setCustomerToDelete(c)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Xóa khách hàng"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 1.5: CUSTOMER JOURNEY PIPELINE */}
      {activeTab === 'journey' && (
        <CustomerJourneyPipeline
          customers={customers}
          onOpenCustomerDetail={onOpenCustomerDetail}
          onOpenCreateOrder={onOpenCreateOrder}
          onOpenCrmTask={onOpenCrmTask}
          onUpdateCustomerStage={(customer, newStage) => {
            const matchedConfig = STAGES_CONFIG.find((s) => s.stage === newStage);
            if (matchedConfig) {
              const updated = {
                ...customer,
                journeyStage: newStage,
                lifecyclePhase: matchedConfig.phase,
                journeyProgressPercent: matchedConfig.defaultProgress
              };
              // if onSaveUser or similar is available or local update
              onOpenCustomerDetail(updated);
            }
          }}
        />
      )}

      {/* TAB 2: CRM TASKS & ADVANCED WORKFLOW MANAGEMENT */}
      {activeTab === 'tasks' && (
        <div className="space-y-4">
          {/* Subtabs Switcher for Tasks */}
          <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setTaskSubTab('overview')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  taskSubTab === 'overview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <CheckSquare className="w-4 h-4" />
                <span>Tổng Quan KPI & Cảnh Báo</span>
              </button>

              <button
                onClick={() => setTaskSubTab('list')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  taskSubTab === 'list'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <List className="w-4 h-4" />
                <span>Danh Sách Công Việc</span>
                <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${taskSubTab === 'list' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'}`}>
                  {crmTasks.length}
                </span>
              </button>

              <button
                onClick={() => setTaskSubTab('calendar')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  taskSubTab === 'calendar'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Calendar className="w-4 h-4" />
                <span>Lịch Công Việc</span>
              </button>

              <button
                onClick={() => setTaskSubTab('gantt')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  taskSubTab === 'gantt'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Sơ Đồ Gantt</span>
              </button>

              <button
                onClick={() => setTaskSubTab('reports')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  taskSubTab === 'reports'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Thống Kê & Báo Cáo</span>
              </button>

              <button
                onClick={() => setTaskSubTab('email_config')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                  taskSubTab === 'email_config'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Mail className="w-4 h-4" />
                <span>Cấu Hình Email Theo Nhân Sự</span>
              </button>
            </div>

            <button
              onClick={() => onOpenCrmTask()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all text-xs cursor-pointer ml-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Thêm việc mới</span>
            </button>
          </div>

          {/* Subtab 0: Task Overview Dashboard with Real Data Bound Overdue KPI */}
          {taskSubTab === 'overview' && (
            <TaskOverviewView
              tasks={crmTasks}
              onOpenCreateTask={() => onOpenCrmTask()}
              onOpenTaskModal={(t) => onOpenCrmTask(t.customerName, t.title)}
              onCheckinTask={(id) => onCheckinTask && onCheckinTask(id)}
              onNavigateSubtab={(tab) => setTaskSubTab(tab)}
            />
          )}

          {/* Subtab 1: Task List View with 1-Click Checkin & Pagination (Tính Năng 1 & 3) */}
          {taskSubTab === 'list' && (
            <TaskListView
              tasks={crmTasks}
              onCheckinTask={(id) => onCheckinTask && onCheckinTask(id)}
              onToggleComplete={(id) => onToggleTaskComplete && onToggleTaskComplete(id)}
              onOpenTaskModal={() => onOpenCrmTask()}
              onDeleteTask={(id) => onDeleteTask && onDeleteTask(id)}
              onBatchCheckin={(ids) => onBatchCheckin && onBatchCheckin(ids)}
            />
          )}

          {/* Subtab 2: Task Calendar View with Color Legend & Tooltips (Tính Năng 4) */}
          {taskSubTab === 'calendar' && (
            <TaskCalendarView
              tasks={crmTasks}
              onCheckinTask={(id) => onCheckinTask && onCheckinTask(id)}
              onOpenTaskModal={() => onOpenCrmTask()}
            />
          )}

          {/* Subtab 3: Task Gantt View with Desktop Horizontal & Mobile Weekly Timeline (Tính Năng 5) */}
          {taskSubTab === 'gantt' && (
            <TaskGanttView
              tasks={crmTasks}
              onCheckinTask={(id) => onCheckinTask && onCheckinTask(id)}
              onOpenTaskModal={() => onOpenCrmTask()}
            />
          )}

          {/* Subtab 4: Task Reports View with KPI Formula Tooltips (Tính Năng 7) */}
          {taskSubTab === 'reports' && (
            <TaskReportsView tasks={crmTasks} />
          )}

          {/* Subtab 5: Per-User Email Notification Configuration Matrix (Tính Năng 2) */}
          {taskSubTab === 'email_config' && (
            <TaskEmailConfigMatrix
              users={users}
              onSaveUser={(u) => onSaveUser && onSaveUser(u)}
            />
          )}
        </div>
      )}

      {/* TAB 3: SPECIAL OCCASIONS & LOYALTY POINTS */}
      {activeTab === 'occasions' && (
        <SpecialOccasionsDashboard
          customers={customers}
          specialOccasions={specialOccasions}
          loyaltyTransactions={loyaltyTransactions}
          onSaveOccasion={(occ) => onSaveOccasion && onSaveOccasion(occ)}
          onDeleteOccasion={(id) => onDeleteOccasion && onDeleteOccasion(id)}
          onUpdateOccasionStatus={(id, updates) => onUpdateOccasionStatus && onUpdateOccasionStatus(id, updates)}
          onGrantBonusPoints={(cId, pts, reason) => onGrantBonusPoints && onGrantBonusPoints(cId, pts, reason)}
          onSaveLoyaltyTransaction={(tx) => onSaveLoyaltyTransaction && onSaveLoyaltyTransaction(tx)}
          onOpenCreateTask={(custName, title) => onOpenCrmTask(custName, title)}
          onOpenCustomerDetail={(cust) => onOpenCustomerDetail(cust)}
        />
      )}

      {/* TAB 4: INSIGHTS & AI UPSELL */}
      {activeTab === 'insights' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-emerald-700 font-bold">
              <Sparkles className="w-5 h-5" />
              <h3 className="text-sm text-slate-900">Cơ Hội Tái Đặt Hàng & Upsell Tự Động</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Khách hàng <strong>Công ty TNHH Xây Dựng ABC</strong> thường mua Kẽm gai & Thép hình vào cuối tháng. Đã 40 ngày chưa phát sinh đơn hàng mới kể từ lần mua gần nhất.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Độ tin cậy AI: 94%</span>
              <button
                onClick={() => onOpenCrmTask('Công ty TNHH Xây Dựng ABC')}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Tạo tác vụ liên hệ ngay</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center gap-2 text-amber-700 font-bold">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm text-slate-900">Cảnh Báo Công Nợ Đến Hạn Thu Hồi</h3>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Khách hàng <strong>Cửa hàng VLXD Phúc Thịnh</strong> đang có dư nợ 7.700.000 đ đã vượt quá hạn thanh toán 15 ngày so với điều khoản thỏa thuận.
            </p>
            <div className="pt-2 flex items-center justify-between">
              <span className="text-slate-400 text-[11px]">Hạn mức tín dụng: 15.000.000 đ</span>
              <button
                onClick={() => onOpenCrmTask('Cửa hàng VLXD Phúc Thịnh')}
                className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1"
              >
                <PhoneCall className="w-3.5 h-3.5" />
                <span>Gửi nhắc nợ VietQR</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Customer Confirmation Modal */}
      <DeleteCustomerModal
        isOpen={!!customerToDelete}
        onClose={() => setCustomerToDelete(null)}
        customer={customerToDelete}
        onConfirmDelete={(id) => {
          onDeleteCustomer(id);
          setCustomerToDelete(null);
        }}
      />
    </div>
  );
};
