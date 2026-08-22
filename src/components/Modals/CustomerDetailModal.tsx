import React, { useState } from 'react';
import {
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Building2,
  CreditCard,
  TrendingUp,
  Calendar,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Plus,
  FileText,
  ShoppingBag,
  MessageSquare,
  PhoneCall,
  Users,
  Edit,
  ExternalLink,
  ChevronRight,
  Globe,
  Briefcase,
  Percent,
  Gift,
  Award,
  Send,
  Trash2,
  Check
} from 'lucide-react';
import { Customer, Order, CrmTask, CustomerInteraction, CustomerSpecialOccasion, LoyaltyTransaction } from '../../types';
import { formatNumberWithDots } from '../../data/administrativeData';
import {
  OCCASION_TYPE_CONFIG,
  LOYALTY_TIER_CONFIG,
  getDaysRemaining,
  formatVnd
} from '../../data/specialOccasionsData';
import { SpecialOccasionModal } from '../SpecialOccasions/SpecialOccasionModal';
import { SendGreetingModal } from '../SpecialOccasions/SendGreetingModal';
import { LoyaltyPointsModal } from '../SpecialOccasions/LoyaltyPointsModal';

interface CustomerDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: Customer | null;
  orders?: Order[];
  crmTasks?: CrmTask[];
  interactions?: CustomerInteraction[];
  specialOccasions?: CustomerSpecialOccasion[];
  loyaltyTransactions?: LoyaltyTransaction[];
  onOpenEditCustomer: (customer: Customer) => void;
  onOpenCreateTask: (customerName: string, title?: string) => void;
  onOpenCreateOrder?: (customerName: string) => void;
  onAddInteraction?: (interaction: CustomerInteraction) => void;
  onToggleTaskComplete?: (taskId: string) => void;
  onSaveOccasion?: (occasion: CustomerSpecialOccasion) => void;
  onDeleteOccasion?: (occasionId: string) => void;
  onUpdateOccasionStatus?: (occasionId: string, updates: Partial<CustomerSpecialOccasion>) => void;
  onGrantBonusPoints?: (customerId: string, points: number, reason: string) => void;
  onSaveLoyaltyTransaction?: (tx: LoyaltyTransaction) => void;
}

export const CustomerDetailModal: React.FC<CustomerDetailModalProps> = ({
  isOpen,
  onClose,
  customer,
  orders = [],
  crmTasks = [],
  interactions = [],
  specialOccasions = [],
  loyaltyTransactions = [],
  onOpenEditCustomer,
  onOpenCreateTask,
  onOpenCreateOrder,
  onAddInteraction,
  onToggleTaskComplete,
  onSaveOccasion,
  onDeleteOccasion,
  onUpdateOccasionStatus,
  onGrantBonusPoints,
  onSaveLoyaltyTransaction
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'orders' | 'tasks' | 'interactions' | 'occasions'>('overview');

  // Modals for Occasions & Loyalty
  const [isOccasionModalOpen, setIsOccasionModalOpen] = useState(false);
  const [occasionToEdit, setOccasionToEdit] = useState<CustomerSpecialOccasion | null>(null);
  const [isSendGreetingModalOpen, setIsSendGreetingModalOpen] = useState(false);
  const [occasionForGreeting, setOccasionForGreeting] = useState<CustomerSpecialOccasion | null>(null);
  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);

  // New interaction form state
  const [newLogType, setNewLogType] = useState<'call' | 'meeting' | 'zalo' | 'email' | 'note'>('call');
  const [newLogTitle, setNewLogTitle] = useState('');
  const [newLogContent, setNewLogContent] = useState('');
  const [newLogOutcome, setNewLogOutcome] = useState('');
  const [isAddingLog, setIsAddingLog] = useState(false);

  // Filter items specific to this customer
  const customerOrders = customer
    ? orders.filter(
        (o) =>
          o.customerName?.toLowerCase() === customer.name.toLowerCase() ||
          (customer.phone && o.customerPhone === customer.phone)
      )
    : [];

  const customerTasks = customer
    ? crmTasks.filter(
        (t) =>
          t.customerId === customer.id ||
          t.customerName?.toLowerCase() === customer.name.toLowerCase()
      )
    : [];

  const customerInteractions = customer
    ? interactions.filter(
        (i) =>
          i.customerId === customer.id ||
          i.customerName?.toLowerCase() === customer.name.toLowerCase()
      )
    : [];

  const customerOccasions = customer
    ? specialOccasions.filter((o) => o.customerId === customer.id)
    : [];

  const customerLoyaltyTxs = customer
    ? loyaltyTransactions.filter((t) => t.customerId === customer.id)
    : [];

  const handleSaveInteraction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customer || !newLogTitle.trim() || !newLogContent.trim()) return;

    if (onAddInteraction) {
      onAddInteraction({
        id: `int-${Date.now()}`,
        customerId: customer.id,
        customerName: customer.name,
        type: newLogType,
        title: newLogTitle.trim(),
        content: newLogContent.trim(),
        resultOutcome: newLogOutcome.trim(),
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16),
        createdBy: 'Nhân viên kinh doanh'
      });
    }

    setNewLogTitle('');
    setNewLogContent('');
    setNewLogOutcome('');
    setIsAddingLog(false);
  };

  const getGroupBadgeClass = (group: string) => {
    switch (group) {
      case 'VIP':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'Doanh nghiệp':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'Đại lý':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  if (!isOpen || !customer) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/90 text-white flex items-center justify-center font-bold text-xl shadow-md">
              {customer.name.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">{customer.name}</h2>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getGroupBadgeClass(
                    customer.group
                  )}`}
                >
                  {customer.group}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-slate-300 font-mono mt-0.5">
                <span>Mã: {customer.code}</span>
                {customer.taxCode && <span>• MST: {customer.taxCode}</span>}
                <span>• ĐT: {customer.phone}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenEditCustomer(customer)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-colors"
            >
              <Edit className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Chỉnh sửa</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-slate-50 border-b border-slate-100 p-3 sm:px-6 text-xs gap-3 shrink-0">
          <div>
            <span className="text-slate-500 font-medium">Tổng tiền đã mua:</span>
            <div className="text-sm font-bold text-slate-900 font-mono">
              {formatNumberWithDots(customer.totalSpent ?? 0)} đ
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Công nợ hiện tại:</span>
            <div
              className={`text-sm font-bold font-mono ${
                customer.debt > 0 ? 'text-rose-600' : 'text-emerald-600'
              }`}
            >
              {formatNumberWithDots(customer.debt ?? 0)} đ
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Hạn mức công nợ:</span>
            <div className="text-sm font-bold text-slate-700 font-mono">
              {formatNumberWithDots(customer.creditLimit ?? 50000000)} đ
            </div>
          </div>
          <div>
            <span className="text-slate-500 font-medium">Sales phụ trách:</span>
            <div className="text-xs font-bold text-blue-700 truncate flex items-center gap-1">
              <Briefcase className="w-3 h-3 text-blue-500 shrink-0" />
              <span>{customer.assignedStaff || 'Lê Hoàng Nam'}</span>
            </div>
            {customer.assignedStaffRole && (
              <div className="text-[10px] text-slate-400 truncate">{customer.assignedStaffRole}</div>
            )}
          </div>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 px-6 bg-white shrink-0 gap-6">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <User className="w-4 h-4" />
            <span>Thông tin & AI</span>
          </button>

          <button
            onClick={() => setActiveTab('orders')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'orders'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Đơn mua hàng ({customerOrders.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('tasks')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'tasks'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Tác vụ CSKH ({customerTasks.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('interactions')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'interactions'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            <span>Nhật ký trao đổi ({customerInteractions.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('occasions')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'occasions'
                ? 'border-rose-600 text-rose-600'
                : 'border-transparent text-slate-500 hover:text-slate-900'
            }`}
          >
            <Gift className="w-4 h-4 text-rose-500" />
            <span>Dịp Đặc Biệt & Điểm Thưởng ({customerOccasions.length})</span>
          </button>
        </div>

        {/* Tab Content Area */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-5 text-xs">
              {/* AI Insights banner */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80">
                <div className="flex items-center gap-2 mb-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  <span className="font-bold text-emerald-900 uppercase tracking-wide">
                    Nhận định & Kịch bản chăm sóc AI
                  </span>
                </div>
                <p className="text-slate-700 leading-relaxed font-medium">
                  {customer.aiNotes ||
                    'Khách hàng có lịch sử giao dịch ổn định. Đề xuất liên hệ định kỳ để thăm dò nhu cầu vật tư dự án mới.'}
                </p>
              </div>

              {/* Payment & Credit Terms Card */}
              <div className="p-4 bg-amber-50/50 border border-amber-200/90 rounded-2xl space-y-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <h4 className="font-bold text-amber-950 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <CreditCard className="w-4 h-4 text-amber-600" />
                    <span>Điều khoản thanh toán & Tỷ lệ công nợ</span>
                  </h4>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-200 text-amber-900">
                    {customer.creditTermsSummary || 'Thỏa thuận tiêu chuẩn'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                    <span className="text-[10px] text-slate-500 font-medium">Tỷ lệ thanh toán trước:</span>
                    <div className="text-sm font-bold text-emerald-700 font-mono">
                      {customer.prepaymentPercent ?? 70}%
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                    <span className="text-[10px] text-slate-500 font-medium">Tỷ lệ cho phép công nợ:</span>
                    <div className="text-sm font-bold text-amber-700 font-mono">
                      {customer.creditPercent ?? 30}%
                    </div>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                    <span className="text-[10px] text-slate-500 font-medium">Thời hạn công nợ tối đa:</span>
                    <div className="text-sm font-bold text-slate-800 font-mono">
                      {customer.creditTermDays ? `${customer.creditTermDays} ngày` : '30 ngày'}
                    </div>
                  </div>
                </div>

                {/* Progress bar visual */}
                <div className="space-y-1">
                  <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${customer.prepaymentPercent ?? 70}%` }}
                      className="bg-emerald-500 h-full"
                      title={`Trả trước: ${customer.prepaymentPercent ?? 70}%`}
                    />
                    <div
                      style={{ width: `${customer.creditPercent ?? 30}%` }}
                      className="bg-amber-500 h-full"
                      title={`Công nợ: ${customer.creditPercent ?? 30}%`}
                    />
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Trả trước: {customer.prepaymentPercent ?? 70}%</span>
                    <span>Công nợ: {customer.creditPercent ?? 30}%</span>
                  </div>
                </div>
              </div>

              {/* Detail fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 border border-slate-100">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center justify-between">
                    <span>Thông tin liên hệ & địa chỉ</span>
                    {customer.isInternational ? (
                      <span className="px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-md font-bold text-[10px] flex items-center gap-1">
                        <Globe className="w-3 h-3" /> {customer.country || 'Quốc tế'}
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md font-bold text-[10px]">
                        🇻🇳 Việt Nam
                      </span>
                    )}
                  </h4>
                  <div className="space-y-1.5 text-slate-600">
                    <p className="flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>Số điện thoại: <strong className="text-slate-900 font-mono">{customer.phone}</strong></span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 text-slate-400" />
                      <span>Email: {customer.email || 'Chưa có email'}</span>
                    </p>
                    <p className="flex items-start gap-2">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                      <span>Địa chỉ: {customer.address || 'Chưa cập nhật'}</span>
                    </p>
                    {customer.city && (
                      <p className="pl-5 text-slate-600 font-medium">
                        Khu vực: <strong>{customer.district ? `${customer.district}, ` : ''}{customer.city}</strong>
                        {customer.country && customer.country !== 'Việt Nam' ? ` (${customer.country})` : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="p-4 bg-slate-50 rounded-2xl space-y-2.5 border border-slate-100">
                  <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[11px]">
                    Thông tin pháp lý & quản lý
                  </h4>
                  <div className="space-y-1.5 text-slate-600">
                    <p>
                      Mã số thuế: <strong className="text-slate-900 font-mono">{customer.taxCode || 'Cá nhân (Không có MST)'}</strong>
                    </p>
                    <p>
                      Đại diện / Mua hàng: <strong>{customer.representative || customer.contactPerson || 'Chưa cập nhật'}</strong>
                    </p>
                    <p>
                      Sales phụ trách: <strong className="text-blue-700">{customer.assignedStaff || 'Lê Hoàng Nam'}</strong>
                      {customer.assignedStaffPhone ? ` (${customer.assignedStaffPhone})` : ''}
                    </p>
                    <p>
                      Giao dịch gần nhất: <span className="font-mono text-slate-700">{customer.lastPurchaseDate}</span>
                    </p>
                    <p>
                      Ghi chú nội bộ: {customer.notes || 'Không có ghi chú đặc biệt.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Quick Actions Row */}
              <div className="p-4 bg-white border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                <div className="text-slate-700 font-bold">Thao tác nhanh với khách hàng này:</div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onOpenCreateTask(customer.name);
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Tạo nhiệm vụ CSKH</span>
                  </button>
                  {onOpenCreateOrder && (
                    <button
                      onClick={() => onOpenCreateOrder(customer.name)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Lập đơn bán hàng</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: ORDERS HISTORY */}
          {activeTab === 'orders' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800">Lịch sử các đơn hàng đã mua ({customerOrders.length})</h4>
                {onOpenCreateOrder && (
                  <button
                    onClick={() => onOpenCreateOrder(customer.name)}
                    className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-1 hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Thêm đơn hàng
                  </button>
                )}
              </div>

              {customerOrders.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <ShoppingBag className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Chưa có đơn hàng nào được ghi nhận cho khách hàng này.</p>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {customerOrders.map((ord) => (
                    <div key={ord.id} className="p-4 hover:bg-slate-50 transition-colors flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{ord.code}</span>
                          <span className="text-slate-400">•</span>
                          <span className="text-slate-500 font-mono">{ord.createdAt}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              ord.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-700'
                                : ord.status === 'shipping'
                                ? 'bg-blue-100 text-blue-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {ord.status === 'completed' ? 'Hoàn tất' : ord.status === 'shipping' ? 'Đang giao' : 'Đang xử lý'}
                          </span>
                        </div>
                        <div className="text-slate-600 mt-1">
                          {ord.items?.length || 0} sản phẩm: {ord.items?.map((i) => i.productName).join(', ')}
                        </div>
                      </div>

                      <div className="text-right font-mono">
                        <div className="font-bold text-slate-900 text-sm">
                          {(ord.totalAmount ?? 0).toLocaleString('vi-VN')} đ
                        </div>
                        <div className="text-[11px] text-slate-500">
                          {ord.paymentStatus === 'paid' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: CRM TASKS */}
          {activeTab === 'tasks' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800">Danh sách tác vụ & công việc cần làm</h4>
                <button
                  onClick={() => onOpenCreateTask(customer.name)}
                  className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-1 hover:bg-blue-700 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Tạo tác vụ mới
                </button>
              </div>

              {customerTasks.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-40 text-emerald-500" />
                  <p>Không có nhiệm vụ nào tồn đọng cho khách hàng này.</p>
                  <button
                    onClick={() => onOpenCreateTask(customer.name)}
                    className="mt-2 text-blue-600 font-bold hover:underline"
                  >
                    + Tạo nhiệm vụ gọi điện / chăm sóc
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {customerTasks.map((t) => (
                    <div
                      key={t.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        t.status === 'completed'
                          ? 'bg-slate-50 border-slate-200 opacity-75'
                          : 'bg-white border-slate-200 shadow-xs'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-2.5">
                          <input
                            type="checkbox"
                            checked={t.status === 'completed'}
                            onChange={() => onToggleTaskComplete && onToggleTaskComplete(t.id)}
                            className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500 mt-0.5 cursor-pointer"
                          />
                          <div>
                            <div className={`font-bold ${t.status === 'completed' ? 'line-through text-slate-400' : 'text-slate-900'}`}>
                              {t.title}
                            </div>
                            {t.note && <p className="text-slate-600 mt-1">{t.note}</p>}
                            <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 mt-2">
                              <span className="flex items-center gap-1 font-mono text-slate-600">
                                <Calendar className="w-3 h-3" /> Hạn: {t.dueDate} {t.dueTime || ''}
                              </span>
                              <span>• Phụ trách: <strong className="text-slate-700">{t.assignedTo}</strong></span>
                              <span
                                className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                                  t.priority === 'urgent'
                                    ? 'bg-rose-100 text-rose-700'
                                    : t.priority === 'high'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {t.priority === 'urgent' ? 'Khẩn' : t.priority === 'high' ? 'Cao' : 'Bình thường'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            t.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-700'
                              : t.status === 'in_progress'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {t.status === 'completed' ? 'Đã xong' : t.status === 'in_progress' ? 'Đang làm' : 'Chờ xử lý'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: INTERACTIONS LOG */}
          {activeTab === 'interactions' && (
            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-slate-800">Nhật ký cuộc gọi, gặp gỡ & trao đổi Zalo</h4>
                {!isAddingLog && (
                  <button
                    onClick={() => setIsAddingLog(true)}
                    className="px-3 py-1.5 bg-blue-600 text-white font-bold rounded-xl flex items-center gap-1 hover:bg-blue-700 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" /> Ghi nhận trao đổi
                  </button>
                )}
              </div>

              {/* Add interaction form */}
              {isAddingLog && (
                <form onSubmit={handleSaveInteraction} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">Thêm ghi chú tương tác mới:</span>
                    <button
                      type="button"
                      onClick={() => setIsAddingLog(false)}
                      className="text-slate-400 hover:text-slate-700"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Hình thức liên hệ</label>
                      <select
                        value={newLogType}
                        onChange={(e) => setNewLogType(e.target.value as any)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800 font-medium"
                      >
                        <option value="call">📞 Cuộc gọi điện thoại</option>
                        <option value="meeting">🤝 Gặp mặt trực tiếp / Khảo sát</option>
                        <option value="zalo">💬 Nhắn tin Zalo / SMS</option>
                        <option value="email">✉️ Gửi Email báo giá</option>
                        <option value="note">📝 Ghi chú nội bộ</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 font-bold mb-1">Tiêu đề / Mục đích</label>
                      <input
                        type="text"
                        value={newLogTitle}
                        onChange={(e) => setNewLogTitle(e.target.value)}
                        placeholder="VD: Báo giá sắt hộp dự án chung cư"
                        required
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Nội dung chi tiết trao đổi</label>
                    <textarea
                      rows={2}
                      value={newLogContent}
                      onChange={(e) => setNewLogContent(e.target.value)}
                      placeholder="Ghi lại các yêu cầu, thắc mắc hoặc phản hồi của khách hàng..."
                      required
                      className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-800"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-600 font-bold mb-1">Kết quả / Bước tiếp theo</label>
                    <input
                      type="text"
                      value={newLogOutcome}
                      onChange={(e) => setNewLogOutcome(e.target.value)}
                      placeholder="VD: Khách hẹn thứ 2 chốt số lượng đặt hàng"
                      className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2 text-slate-800"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setIsAddingLog(false)}
                      className="px-3 py-1.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl"
                    >
                      Hủy
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs"
                    >
                      Lưu ghi chú
                    </button>
                  </div>
                </form>
              )}

              {customerInteractions.length === 0 ? (
                <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-slate-400">
                  <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40" />
                  <p>Chưa có lịch sử liên hệ nào được ghi nhận.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {customerInteractions.map((item) => (
                    <div key={item.id} className="p-4 bg-white border border-slate-200 rounded-2xl shadow-xs space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 font-bold text-slate-900">
                          <span>
                            {item.type === 'call' ? '📞' : item.type === 'meeting' ? '🤝' : item.type === 'zalo' ? '💬' : '✉️'}
                          </span>
                          <span>{item.title}</span>
                        </div>
                        <span className="text-slate-400 font-mono text-[11px]">{item.createdAt}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed">{item.content}</p>
                      {item.resultOutcome && (
                        <div className="text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1 rounded-lg inline-block text-[11px]">
                          <strong>Kết quả:</strong> {item.resultOutcome}
                        </div>
                      )}
                      <div className="text-[10px] text-slate-400 text-right">Ghi nhận bởi: {item.createdBy}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 5: SPECIAL OCCASIONS & LOYALTY */}
          {activeTab === 'occasions' && (
            <div className="space-y-5 text-xs">
              {/* Loyalty Tier Summary Card */}
              {(() => {
                const tier = customer.loyaltyTier || 'standard';
                const tierCfg = LOYALTY_TIER_CONFIG[tier];
                const points = customer.loyaltyPoints || 0;

                return (
                  <div className={`p-4 rounded-2xl border bg-gradient-to-br from-amber-50/50 via-white to-rose-50/30 ${tierCfg.badgeBorder} shadow-xs space-y-3`}>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="text-3xl p-2 bg-white rounded-2xl border border-amber-200 shadow-xs">
                          {tierCfg.icon}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="font-extrabold text-slate-900 text-sm">
                              {tierCfg.label}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${tierCfg.badgeBg} ${tierCfg.badgeText}`}>
                              Ưu đãi VIP
                            </span>
                          </div>
                          <p className="text-slate-500 text-[11px] mt-0.5">
                            Hệ số tích điểm: <strong>x{tierCfg.pointsMultiplier}</strong> • Giảm giá dịp sinh nhật: <strong>{tierCfg.birthdayDiscount}%</strong>
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <span className="text-slate-400 text-[10px] uppercase font-bold block">Điểm tích lũy</span>
                          <span className="text-xl font-black text-amber-600 font-mono">
                            {points.toLocaleString('vi-VN')}
                          </span>
                          <span className="text-[11px] text-slate-400 font-medium"> điểm</span>
                        </div>
                        <button
                          onClick={() => setIsLoyaltyModalOpen(true)}
                          className="px-3 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                        >
                          <Award className="w-4 h-4" />
                          <span>Điều Chỉnh Điểm</span>
                        </button>
                      </div>
                    </div>

                    {/* Perks pills */}
                    <div className="pt-2 border-t border-amber-100 flex flex-wrap items-center gap-2">
                      {tierCfg.perks.map((perk, idx) => (
                        <span key={idx} className="bg-white px-2.5 py-1 rounded-lg border border-amber-200/80 text-[11px] font-medium text-slate-700 flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>{perk}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })()}

              {/* Special Occasions Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Gift className="w-4 h-4 text-rose-500" />
                    <span>Lịch Kỷ Niệm & Dịp Đặc Biệt Của Khách Hàng ({customerOccasions.length})</span>
                  </h4>
                  <button
                    onClick={() => {
                      setOccasionToEdit(null);
                      setIsOccasionModalOpen(true);
                    }}
                    className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Thêm Dịp Đặc Biệt</span>
                  </button>
                </div>

                {customerOccasions.length === 0 ? (
                  <div className="text-center py-10 border border-dashed border-slate-200 rounded-2xl text-slate-400 bg-slate-50/50">
                    <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40 text-rose-500" />
                    <p className="font-bold text-slate-700">Chưa thiết lập ngày đặc biệt nào cho khách hàng này.</p>
                    <p className="text-slate-500 text-[11px] mt-1">
                      Hãy thêm sinh nhật, ngày thành lập công ty hoặc Tết Trung Thu để nhận nhắc nhở và chuẩn bị quà tặng.
                    </p>
                    <button
                      onClick={() => {
                        setOccasionToEdit(null);
                        setIsOccasionModalOpen(true);
                      }}
                      className="mt-3 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold rounded-xl border border-rose-200 inline-flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>+ Thêm dịp đặc biệt ngay</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {customerOccasions.map((occ) => {
                      const days = getDaysRemaining(occ.date);
                      const isToday = days === 0;
                      const isUpcoming = days > 0 && days <= 7;
                      const cfg = OCCASION_TYPE_CONFIG[occ.type] || OCCASION_TYPE_CONFIG.birthday;

                      return (
                        <div
                          key={occ.id}
                          className={`p-4 rounded-2xl border transition-all flex flex-col justify-between space-y-3 ${
                            isToday
                              ? 'bg-rose-50/70 border-rose-300 ring-2 ring-rose-400/20'
                              : 'bg-white border-slate-200 hover:border-blue-300'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.badgeBg} ${cfg.borderColor}`}>
                                {cfg.icon} {cfg.shortLabel}
                              </span>
                              <span
                                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                                  isToday
                                    ? 'bg-rose-600 text-white animate-pulse'
                                    : isUpcoming
                                    ? 'bg-amber-500 text-white'
                                    : 'bg-slate-100 text-slate-600'
                                }`}
                              >
                                {isToday ? 'Hôm nay 🎉' : days > 0 ? `Còn ${days} ngày` : 'Đã qua'}
                              </span>
                            </div>

                            <h5 className="font-bold text-slate-900 text-sm leading-snug">
                              {occ.title}
                            </h5>

                            <div className="mt-2 flex flex-wrap items-center gap-2 text-slate-500 text-[11px]">
                              <span className="font-mono font-bold text-slate-700 flex items-center gap-1">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                {occ.date}
                              </span>
                              {occ.isLunar && (
                                <span className="font-bold text-amber-800 bg-amber-100 px-1.5 py-0.2 rounded text-[10px]">
                                  {occ.lunarDateStr || 'Âm lịch'}
                                </span>
                              )}
                            </div>

                            {/* Gift & Points info */}
                            <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5 text-[11px]">
                              {occ.giftName && (
                                <div className="flex items-center justify-between">
                                  <span className="flex items-center gap-1 text-slate-700 font-medium">
                                    <Gift className="w-3.5 h-3.5 text-purple-600" />
                                    {occ.giftName} ({formatVnd(occ.giftBudget)})
                                  </span>
                                  <span
                                    onClick={() => {
                                      let nextStatus: CustomerSpecialOccasion['giftStatus'] = 'prepared';
                                      if (occ.giftStatus === 'not_sent') nextStatus = 'prepared';
                                      else if (occ.giftStatus === 'prepared') nextStatus = 'delivering';
                                      else if (occ.giftStatus === 'delivering') nextStatus = 'delivered';
                                      else nextStatus = 'not_sent';
                                      onUpdateOccasionStatus && onUpdateOccasionStatus(occ.id, { giftStatus: nextStatus });
                                    }}
                                    className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer ${
                                      occ.giftStatus === 'delivered'
                                        ? 'bg-emerald-100 text-emerald-800'
                                        : occ.giftStatus === 'delivering'
                                        ? 'bg-blue-100 text-blue-800'
                                        : occ.giftStatus === 'prepared'
                                        ? 'bg-purple-100 text-purple-800'
                                        : 'bg-slate-200 text-slate-700'
                                    }`}
                                    title="Click để đổi trạng thái quà"
                                  >
                                    {occ.giftStatus === 'delivered'
                                      ? '✓ Đã trao quà'
                                      : occ.giftStatus === 'delivering'
                                      ? 'Đang giao...'
                                      : occ.giftStatus === 'prepared'
                                      ? 'Đã chuẩn bị'
                                      : 'Chưa chuẩn bị'}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <span className="text-amber-700 font-bold flex items-center gap-1">
                                  <Award className="w-3.5 h-3.5 text-amber-500" />
                                  +{occ.bonusPoints || 500} điểm tri ân
                                </span>
                                {occ.discountPercent && (
                                  <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                                    Ưu đãi -{occ.discountPercent}%
                                  </span>
                                )}
                              </div>
                            </div>

                            {occ.notes && (
                              <p className="mt-2 text-[11px] text-slate-500 italic">
                                "{occ.notes}"
                              </p>
                            )}
                          </div>

                          {/* Action footer */}
                          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => {
                                  setOccasionToEdit(occ);
                                  setIsOccasionModalOpen(true);
                                }}
                                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                title="Sửa dịp"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onDeleteOccasion && onDeleteOccasion(occ.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                                title="Xóa dịp"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => onOpenCreateTask(customer.name, `CSKH Dịp đặc biệt: ${occ.title}`)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                                title="Giao việc cho Sales"
                              >
                                <Calendar className="w-3.5 h-3.5" />
                              </button>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => {
                                  onGrantBonusPoints &&
                                    onGrantBonusPoints(
                                      customer.id,
                                      occ.bonusPoints || 500,
                                      `Tặng điểm thưởng nhanh dịp: ${occ.title}`
                                    );
                                  onUpdateOccasionStatus &&
                                    onUpdateOccasionStatus(occ.id, { actionTaken: true });
                                }}
                                className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-xl transition-colors cursor-pointer flex items-center gap-1"
                              >
                                <Award className="w-3.5 h-3.5 text-amber-600" />
                                <span>+Thưởng</span>
                              </button>

                              <button
                                onClick={() => {
                                  setOccasionForGreeting(occ);
                                  setIsSendGreetingModalOpen(true);
                                }}
                                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1 cursor-pointer"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>Gửi Chúc Mừng</span>
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Loyalty Transaction History for this Customer */}
              {customerLoyaltyTxs.length > 0 && (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3">
                  <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Lịch Sử Giao Dịch Điểm Thưởng ({customerLoyaltyTxs.length})</span>
                  </h4>
                  <div className="divide-y divide-slate-200">
                    {customerLoyaltyTxs.map((tx) => (
                      <div key={tx.id} className="py-2 flex items-center justify-between text-slate-700 text-[11px]">
                        <div>
                          <span className="font-bold text-slate-900">{tx.description}</span>
                          <div className="text-slate-400 text-[10px] font-mono">{tx.date} • {tx.createdBy}</div>
                        </div>
                        <span className={`font-mono font-bold ${tx.points >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.points >= 0 ? `+${tx.points}` : tx.points} điểm
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sub Modals */}
        <SpecialOccasionModal
          isOpen={isOccasionModalOpen}
          onClose={() => setIsOccasionModalOpen(false)}
          onSave={(savedOcc) => {
            onSaveOccasion && onSaveOccasion(savedOcc);
            setIsOccasionModalOpen(false);
          }}
          occasionToEdit={occasionToEdit}
          preselectedCustomerId={customer.id}
          customers={[customer]}
        />

        <SendGreetingModal
          isOpen={isSendGreetingModalOpen}
          onClose={() => setIsSendGreetingModalOpen(false)}
          occasion={occasionForGreeting}
          customer={customer}
          onConfirmSend={(data) => {
            if (onUpdateOccasionStatus) {
              onUpdateOccasionStatus(data.occasionId, {
                actionTaken: true,
                actionDate: new Date().toISOString().substring(0, 10),
                status: 'completed',
                giftStatus: data.giftStatusUpdated || 'delivered'
              });
            }
            if (data.bonusPointsGranted > 0 && onGrantBonusPoints) {
              onGrantBonusPoints(
                customer.id,
                data.bonusPointsGranted,
                `Tặng điểm thưởng tri ân dịp ${data.occasionId}`
              );
            }
            setIsSendGreetingModalOpen(false);
          }}
        />

        <LoyaltyPointsModal
          isOpen={isLoyaltyModalOpen}
          onClose={() => setIsLoyaltyModalOpen(false)}
          customer={customer}
          onSavePoints={({ customerId, pointsChange, transactionType, description, newTier }) => {
            if (onGrantBonusPoints) {
              onGrantBonusPoints(customerId, pointsChange, description);
            }
            if (newTier) {
              customer.loyaltyTier = newTier;
            }
            if (onSaveLoyaltyTransaction) {
              onSaveLoyaltyTransaction({
                id: `lt-${Date.now()}`,
                customerId,
                customerName: customer.name,
                points: pointsChange,
                type: transactionType,
                description,
                date: new Date().toISOString().substring(0, 10),
                createdBy: 'Quản trị viên'
              });
            }
            setIsLoyaltyModalOpen(false);
          }}
        />

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-mono">
            Hồ sơ khách hàng • BizOne ERP
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-xl transition-colors"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
};
