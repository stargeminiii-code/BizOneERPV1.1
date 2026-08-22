import React, { useState } from 'react';
import {
  Sparkles,
  Calendar,
  Gift,
  Award,
  Search,
  Filter,
  Plus,
  Send,
  CheckCircle2,
  Clock,
  Phone,
  MessageCircle,
  Mail,
  User,
  Building2,
  ChevronRight,
  TrendingUp,
  Percent,
  Copy,
  Check,
  Edit,
  Trash2,
  ExternalLink,
  ShieldCheck,
  Zap,
  Info,
  DollarSign
} from 'lucide-react';
import { Customer, CustomerSpecialOccasion, LoyaltyTier, LoyaltyTransaction, SpecialOccasionType } from '../../types';
import {
  OCCASION_TYPE_CONFIG,
  LOYALTY_TIER_CONFIG,
  DEFAULT_GREETING_TEMPLATES,
  getDaysRemaining,
  formatVnd,
  GreetingTemplate
} from '../../data/specialOccasionsData';
import { SpecialOccasionModal } from './SpecialOccasionModal';
import { SendGreetingModal } from './SendGreetingModal';
import { LoyaltyPointsModal } from './LoyaltyPointsModal';

interface SpecialOccasionsDashboardProps {
  customers: Customer[];
  specialOccasions: CustomerSpecialOccasion[];
  loyaltyTransactions: LoyaltyTransaction[];
  onSaveOccasion: (occasion: CustomerSpecialOccasion) => void;
  onDeleteOccasion: (occasionId: string) => void;
  onUpdateOccasionStatus: (occasionId: string, updates: Partial<CustomerSpecialOccasion>) => void;
  onGrantBonusPoints: (customerId: string, points: number, reason: string) => void;
  onSaveLoyaltyTransaction: (tx: LoyaltyTransaction) => void;
  onOpenCreateTask?: (customerName: string, title?: string) => void;
  onOpenCustomerDetail?: (customer: Customer) => void;
}

export const SpecialOccasionsDashboard: React.FC<SpecialOccasionsDashboardProps> = ({
  customers = [],
  specialOccasions = [],
  loyaltyTransactions = [],
  onSaveOccasion,
  onDeleteOccasion,
  onUpdateOccasionStatus,
  onGrantBonusPoints,
  onSaveLoyaltyTransaction,
  onOpenCreateTask,
  onOpenCustomerDetail
}) => {
  const [activeTab, setActiveTab] = useState<'occasions' | 'loyalty' | 'gifts' | 'templates'>('occasions');
  
  // Filters
  const [timeFilter, setTimeFilter] = useState<'all' | 'today' | 'next_7_days' | 'next_30_days'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Modals state
  const [isOccasionModalOpen, setIsOccasionModalOpen] = useState(false);
  const [occasionToEdit, setOccasionToEdit] = useState<CustomerSpecialOccasion | null>(null);
  
  const [isSendGreetingModalOpen, setIsSendGreetingModalOpen] = useState(false);
  const [occasionForGreeting, setOccasionForGreeting] = useState<CustomerSpecialOccasion | null>(null);

  const [isLoyaltyModalOpen, setIsLoyaltyModalOpen] = useState(false);
  const [selectedCustomerForLoyalty, setSelectedCustomerForLoyalty] = useState<Customer | null>(null);

  // Template copy state
  const [copiedTemplateId, setCopiedTemplateId] = useState<string | null>(null);

  // Stats calculation
  const todayOccasions = specialOccasions.filter((o) => getDaysRemaining(o.date) === 0);
  const next7DaysOccasions = specialOccasions.filter((o) => {
    const days = getDaysRemaining(o.date);
    return days >= 0 && days <= 7;
  });
  const next30DaysOccasions = specialOccasions.filter((o) => {
    const days = getDaysRemaining(o.date);
    return days >= 0 && days <= 30;
  });
  const pendingGifts = specialOccasions.filter(
    (o) => o.giftName && (o.giftStatus === 'not_sent' || o.giftStatus === 'prepared')
  );
  const totalGiftBudget = specialOccasions.reduce((sum, o) => sum + (o.giftBudget || 0), 0);
  const totalBonusPointsAwarded = loyaltyTransactions
    .filter((tx) => tx.type === 'birthday_bonus' || tx.type === 'holiday_bonus')
    .reduce((sum, tx) => sum + tx.points, 0);

  // Filtered Occasions
  const filteredOccasions = specialOccasions.filter((occ) => {
    const days = getDaysRemaining(occ.date);
    
    // Time filter
    if (timeFilter === 'today' && days !== 0) return false;
    if (timeFilter === 'next_7_days' && (days < 0 || days > 7)) return false;
    if (timeFilter === 'next_30_days' && (days < 0 || days > 30)) return false;

    // Type filter
    if (typeFilter !== 'all' && occ.type !== typeFilter) return false;

    // Group filter
    if (groupFilter !== 'all' && occ.customerGroup !== groupFilter) return false;

    // Search term
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchTitle = occ.title.toLowerCase().includes(q);
      const matchName = occ.customerName.toLowerCase().includes(q);
      const matchPhone = (occ.customerPhone || '').includes(q);
      const matchStaff = (occ.assignedStaff || '').toLowerCase().includes(q);
      if (!matchTitle && !matchName && !matchPhone && !matchStaff) return false;
    }

    return true;
  }).sort((a, b) => {
    const daysA = getDaysRemaining(a.date);
    const daysB = getDaysRemaining(b.date);
    return daysA - daysB;
  });

  // Handle Quick Send Greeting Action
  const handleOpenSendGreeting = (occ: CustomerSpecialOccasion) => {
    setOccasionForGreeting(occ);
    setIsSendGreetingModalOpen(true);
  };

  const handleConfirmSendGreeting = (data: {
    occasionId: string;
    customerId: string;
    channel: 'zalo' | 'sms' | 'email';
    content: string;
    bonusPointsGranted: number;
    giftStatusUpdated?: 'not_sent' | 'prepared' | 'delivering' | 'delivered';
  }) => {
    // 1. Update occasion
    onUpdateOccasionStatus(data.occasionId, {
      actionTaken: true,
      actionDate: new Date().toISOString().substring(0, 10),
      status: 'completed',
      giftStatus: data.giftStatusUpdated || 'delivered'
    });

    // 2. Grant points if any
    if (data.bonusPointsGranted > 0) {
      onGrantBonusPoints(
        data.customerId,
        data.bonusPointsGranted,
        `Tặng điểm thưởng tri ân dịp ${data.occasionId}`
      );
    }
  };

  // Handle 1-Click Fast Bonus
  const handleFastBonus = (occ: CustomerSpecialOccasion) => {
    const points = occ.bonusPoints || 500;
    onGrantBonusPoints(
      occ.customerId,
      points,
      `Tặng điểm thưởng nhanh dịp: ${occ.title}`
    );
    onUpdateOccasionStatus(occ.id, { actionTaken: true });
  };

  // Handle Gift status cycle
  const handleCycleGiftStatus = (occ: CustomerSpecialOccasion) => {
    let nextStatus: CustomerSpecialOccasion['giftStatus'] = 'prepared';
    if (occ.giftStatus === 'not_sent') nextStatus = 'prepared';
    else if (occ.giftStatus === 'prepared') nextStatus = 'delivering';
    else if (occ.giftStatus === 'delivering') nextStatus = 'delivered';
    else nextStatus = 'not_sent';

    onUpdateOccasionStatus(occ.id, { giftStatus: nextStatus });
  };

  // Handle Template copy
  const handleCopyTemplate = (template: GreetingTemplate) => {
    navigator.clipboard.writeText(template.content);
    setCopiedTemplateId(template.id);
    setTimeout(() => setCopiedTemplateId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner & KPI Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {/* Card 1: Today */}
        <div
          onClick={() => {
            setActiveTab('occasions');
            setTimeFilter('today');
          }}
          className={`p-4 rounded-2xl border transition-all cursor-pointer ${
            todayOccasions.length > 0
              ? 'bg-gradient-to-br from-rose-500 to-amber-500 text-white shadow-md border-rose-400 hover:scale-102'
              : 'bg-white text-slate-800 border-slate-200 shadow-xs hover:border-blue-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className={`text-xs font-bold ${todayOccasions.length > 0 ? 'text-rose-100' : 'text-slate-500'}`}>
              🎉 Dịp Đặc Biệt Hôm Nay
            </span>
            <span className="text-xl">🎂</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black">{todayOccasions.length}</span>
            <span className={`text-xs font-medium ${todayOccasions.length > 0 ? 'text-rose-100' : 'text-slate-400'}`}>
              sự kiện cần chúc mừng
            </span>
          </div>
          {todayOccasions.length > 0 && (
            <p className="mt-1 text-[11px] font-semibold text-rose-100 truncate">
              {todayOccasions[0].title}
            </p>
          )}
        </div>

        {/* Card 2: Next 7 Days */}
        <div
          onClick={() => {
            setActiveTab('occasions');
            setTimeFilter('next_7_days');
          }}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">📅 Trong 7 Ngày Tới</span>
            <Calendar className="w-5 h-5 text-blue-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-blue-700">{next7DaysOccasions.length}</span>
            <span className="text-xs text-slate-400">sự kiện sắp diễn ra</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            Cần lên kế hoạch quà tặng & thiệp chúc
          </p>
        </div>

        {/* Card 3: Gifts Pending */}
        <div
          onClick={() => setActiveTab('gifts')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-purple-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">🎁 Quà Cần Chuẩn Bị</span>
            <Gift className="w-5 h-5 text-purple-600" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-purple-700">{pendingGifts.length}</span>
            <span className="text-xs text-slate-400">món quà / lẵng hoa</span>
          </div>
          <p className="mt-1 text-[11px] text-purple-600 font-bold">
            Ngân sách: {formatVnd(totalGiftBudget)}
          </p>
        </div>

        {/* Card 4: Loyalty Points Awarded */}
        <div
          onClick={() => setActiveTab('loyalty')}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs hover:border-amber-300 transition-all cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500">⭐ Điểm Tích Lũy Tri Ân</span>
            <Award className="w-5 h-5 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600">
              +{totalBonusPointsAwarded.toLocaleString('vi-VN')}
            </span>
            <span className="text-xs text-slate-400">điểm đã thưởng</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-500">
            {customers.filter((c) => (c.loyaltyPoints || 0) > 0).length} khách hàng tích điểm
          </p>
        </div>
      </div>

      {/* Subtabs Switcher */}
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setActiveTab('occasions')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'occasions'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Nhắc Ngày Đặc Biệt & Lễ Tết</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'occasions' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}
            >
              {specialOccasions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('loyalty')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'loyalty'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Award className="w-4 h-4" />
            <span>Tích Điểm Thưởng & Hạng Thẻ</span>
          </button>

          <button
            onClick={() => setActiveTab('gifts')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'gifts'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Gift className="w-4 h-4" />
            <span>Quà Tặng & Ngân Sách</span>
          </button>

          <button
            onClick={() => setActiveTab('templates')}
            className={`px-4 py-2 rounded-xl font-bold transition-all flex items-center gap-2 cursor-pointer ${
              activeTab === 'templates'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Mẫu Lời Chúc Mừng Zalo/Email</span>
          </button>
        </div>

        <button
          onClick={() => {
            setOccasionToEdit(null);
            setIsOccasionModalOpen(true);
          }}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl shadow-xs flex items-center gap-1.5 transition-all cursor-pointer ml-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Thêm ngày đặc biệt</span>
        </button>
      </div>

      {/* ===================== TAB 1: OCCASIONS LIST & CARDS ===================== */}
      {activeTab === 'occasions' && (
        <div className="space-y-4 text-xs">
          {/* Filters Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Tìm theo tên sự kiện, đối tác, SĐT hoặc người phụ trách..."
                className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-xl bg-slate-50 focus:bg-white focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              <select
                value={timeFilter}
                onChange={(e) => setTimeFilter(e.target.value as any)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">Tất cả thời gian</option>
                <option value="today">Hôm nay 🎉</option>
                <option value="next_7_days">Trong 7 ngày tới</option>
                <option value="next_30_days">Trong 30 ngày tới</option>
              </select>

              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">Tất cả loại dịp</option>
                <option value="birthday">🎂 Sinh nhật</option>
                <option value="company_anniversary">🏢 Thành lập công ty</option>
                <option value="mid_autumn">🥮 Tết Trung Thu</option>
                <option value="tet_holiday">🧧 Tết Nguyên Đán</option>
                <option value="women_day_vn">💐 Phụ Nữ VN 20/10</option>
                <option value="business_day_vn">👔 Doanh Nhân 13/10</option>
                <option value="first_order_anniversary">🤝 Kỷ niệm hợp tác</option>
              </select>

              <select
                value={groupFilter}
                onChange={(e) => setGroupFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 text-slate-700 font-semibold focus:outline-none"
              >
                <option value="all">Tất cả nhóm KH</option>
                <option value="VIP">Khách VIP</option>
                <option value="Doanh nghiệp">Doanh nghiệp</option>
                <option value="Đại lý">Đại lý</option>
                <option value="Cá nhân">Cá nhân</option>
              </select>
            </div>
          </div>

          {/* Occasions Cards Grid */}
          {filteredOccasions.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border border-dashed border-slate-200 text-slate-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-40 text-rose-500" />
              <p className="font-bold text-slate-700">Không tìm thấy ngày đặc biệt nào phù hợp bộ lọc.</p>
              <button
                onClick={() => {
                  setTimeFilter('all');
                  setTypeFilter('all');
                  setGroupFilter('all');
                  setSearchTerm('');
                }}
                className="mt-3 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl inline-flex items-center gap-1.5"
              >
                Đặt lại bộ lọc
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOccasions.map((occ) => {
                const days = getDaysRemaining(occ.date);
                const isToday = days === 0;
                const isUpcomingSoon = days > 0 && days <= 3;
                const config = OCCASION_TYPE_CONFIG[occ.type] || OCCASION_TYPE_CONFIG.birthday;
                const cust = customers.find((c) => c.id === occ.customerId);

                return (
                  <div
                    key={occ.id}
                    className={`rounded-2xl border p-4 shadow-xs flex flex-col justify-between space-y-3 transition-all ${
                      isToday
                        ? 'bg-gradient-to-br from-rose-50 to-amber-50 border-rose-300 ring-2 ring-rose-400/30'
                        : isUpcomingSoon
                        ? 'bg-white border-amber-300 hover:border-amber-400'
                        : 'bg-white border-slate-200 hover:border-blue-300'
                    }`}
                  >
                    {/* Header */}
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${config.badgeBg} ${config.borderColor}`}>
                          {config.icon} {config.shortLabel}
                        </span>

                        {/* Countdown Pill */}
                        <span
                          className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full ${
                            isToday
                              ? 'bg-rose-600 text-white animate-pulse'
                              : isUpcomingSoon
                              ? 'bg-amber-500 text-white'
                              : days > 0
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-slate-100 text-slate-400'
                          }`}
                        >
                          {isToday
                            ? 'Hôm nay 🎉'
                            : days > 0
                            ? `Còn ${days} ngày`
                            : `Đã qua`}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="font-bold text-slate-900 text-sm leading-snug">
                        {occ.title}
                      </h4>

                      {/* Customer Info */}
                      <div className="flex items-center gap-2 mt-2 text-slate-600">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span
                          onClick={() => cust && onOpenCustomerDetail && onOpenCustomerDetail(cust)}
                          className="font-bold text-blue-700 hover:underline cursor-pointer truncate"
                        >
                          {occ.customerName}
                        </span>
                        {occ.customerGroup && (
                          <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold shrink-0">
                            {occ.customerGroup}
                          </span>
                        )}
                      </div>

                      {/* Date details */}
                      <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
                        <span className="flex items-center gap-1 font-mono font-bold text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {occ.date}
                        </span>
                        {occ.isLunar && (
                          <span className="font-bold text-amber-800 bg-amber-100/70 px-1.5 py-0.2 rounded">
                            {occ.lunarDateStr || 'Âm lịch'}
                          </span>
                        )}
                        <span>• Phụ trách: <strong className="text-slate-700">{occ.assignedStaff || 'Chưa gán'}</strong></span>
                      </div>

                      {/* Gift / Perk specs */}
                      <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-1.5">
                        {occ.giftName && (
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-slate-600 font-medium">
                              <Gift className="w-3.5 h-3.5 text-purple-600" />
                              {occ.giftName}
                            </span>
                            <button
                              onClick={() => handleCycleGiftStatus(occ)}
                              className={`text-[10px] font-bold px-2 py-0.5 rounded cursor-pointer transition-colors ${
                                occ.giftStatus === 'delivered'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : occ.giftStatus === 'delivering'
                                  ? 'bg-blue-100 text-blue-800'
                                  : occ.giftStatus === 'prepared'
                                  ? 'bg-purple-100 text-purple-800'
                                  : 'bg-slate-200 text-slate-700 hover:bg-slate-300'
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
                            </button>
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px]">
                          <span className="flex items-center gap-1 text-amber-700 font-bold">
                            <Award className="w-3.5 h-3.5 text-amber-500" />
                            +{occ.bonusPoints || 500} điểm thưởng
                          </span>
                          {occ.discountPercent && (
                            <span className="font-bold text-rose-700 bg-rose-50 px-1.5 py-0.2 rounded border border-rose-200">
                              Ưu đãi -{occ.discountPercent}%
                            </span>
                          )}
                        </div>
                      </div>

                      {occ.notes && (
                        <p className="mt-2 text-[11px] text-slate-500 italic line-clamp-2">
                          "{occ.notes}"
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setOccasionToEdit(occ);
                            setIsOccasionModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Sửa dịp đặc biệt"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteOccasion(occ.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Xóa dịp"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        {onOpenCreateTask && (
                          <button
                            onClick={() => onOpenCreateTask(occ.customerName, `Chuẩn bị quà & Chúc mừng: ${occ.title}`)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Tạo Task CRM giao việc"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleFastBonus(occ)}
                          className="px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1"
                          title="Tặng điểm thưởng ngay"
                        >
                          <Award className="w-3.5 h-3.5 text-amber-600" />
                          <span>+Thưởng điểm</span>
                        </button>

                        <button
                          onClick={() => handleOpenSendGreeting(occ)}
                          className={`px-3 py-1.5 font-bold rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer ${
                            isToday
                              ? 'bg-rose-600 hover:bg-rose-700 text-white'
                              : 'bg-blue-600 hover:bg-blue-700 text-white'
                          }`}
                        >
                          <Send className="w-3.5 h-3.5" />
                          <span>Gửi Lời Chúc</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===================== TAB 2: LOYALTY POINTS & TIERS ===================== */}
      {activeTab === 'loyalty' && (
        <div className="space-y-4 text-xs">
          {/* Tier Matrix Showcase */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            {Object.values(LOYALTY_TIER_CONFIG).map((cfg) => (
              <div
                key={cfg.tier}
                className={`p-4 rounded-2xl border bg-white shadow-xs flex flex-col justify-between space-y-3 ${cfg.badgeBorder}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl">{cfg.icon}</span>
                    <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${cfg.badgeBg} ${cfg.badgeText}`}>
                      &gt;= {cfg.minPoints.toLocaleString('vi-VN')} điểm
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">{cfg.label}</h4>
                  <div className="mt-2 space-y-1 text-slate-600 text-[11px]">
                    {cfg.perks.map((perk, idx) => (
                      <div key={idx} className="flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold">
                  <span className="text-amber-700">Tích lũy x{cfg.pointsMultiplier}</span>
                  <span className="text-rose-700">Sinh nhật -{cfg.birthdayDiscount}%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Customers Loyalty Points Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row items-center justify-between gap-3">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-500" />
                <span>Bảng Xếp Hạng & Điểm Tích Lũy Khách Hàng</span>
              </h3>
              <span className="text-slate-500 text-xs">
                Tổng cộng {customers.length} khách hàng trong hệ thống
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">Khách Hàng / Đối Tác</th>
                    <th className="p-3.5">Hạng Thành Viên</th>
                    <th className="p-3.5">Điểm Tích Lũy</th>
                    <th className="p-3.5">Tổng Mua Hàng</th>
                    <th className="p-3.5">Dịp Kỷ Niệm Gần Nhất</th>
                    <th className="p-3.5 text-right">Thao Tác</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customers.map((c) => {
                    const tier = c.loyaltyTier || 'standard';
                    const tierMeta = LOYALTY_TIER_CONFIG[tier];
                    const pts = c.loyaltyPoints || 0;
                    const custOccs = specialOccasions.filter((o) => o.customerId === c.id);

                    return (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="p-3.5">
                          <div className="font-bold text-slate-900 text-xs">{c.name}</div>
                          <div className="text-slate-400 font-mono text-[11px] flex items-center gap-2">
                            <span>{c.code}</span>
                            <span>• {c.phone}</span>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full border ${tierMeta.badgeBg} ${tierMeta.badgeBorder} ${tierMeta.badgeText}`}>
                            <span>{tierMeta.icon}</span>
                            <span>{tierMeta.label}</span>
                          </span>
                        </td>
                        <td className="p-3.5 font-bold text-amber-700 text-sm">
                          {pts.toLocaleString('vi-VN')} <span className="text-[11px] font-normal text-slate-400">điểm</span>
                        </td>
                        <td className="p-3.5 font-semibold text-slate-700">
                          {formatVnd(c.totalSpent)}
                        </td>
                        <td className="p-3.5">
                          {custOccs.length > 0 ? (
                            <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                              {custOccs[0].title} ({custOccs[0].date})
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Chưa cài đặt</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedCustomerForLoyalty(c);
                              setIsLoyaltyModalOpen(true);
                            }}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 font-bold rounded-xl transition-colors cursor-pointer inline-flex items-center gap-1"
                          >
                            <Award className="w-3.5 h-3.5 text-amber-600" />
                            <span>Cập Nhật Điểm</span>
                          </button>
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

      {/* ===================== TAB 3: GIFTS & BUDGET TRACKER ===================== */}
      {activeTab === 'gifts' && (
        <div className="space-y-4 text-xs">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Danh Mục Quà Tặng & Tiến Độ Trao Tặng Khách Hàng
              </h3>
              <p className="text-slate-500 text-xs">
                Theo dõi chuẩn bị hoa tươi, bánh trung thu, quà Tết và kỷ niệm chương cho đối tác
              </p>
            </div>
            <div className="text-right">
              <span className="text-slate-500 text-xs">Tổng ngân sách dự kiến:</span>
              <div className="text-base font-black text-rose-600">{formatVnd(totalGiftBudget)}</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {specialOccasions.map((occ) => (
              <div
                key={occ.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3 flex flex-col justify-between hover:border-purple-300 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full border border-purple-200">
                      🎁 Quà Tri Ân
                    </span>
                    <span className="text-slate-500 font-mono text-[11px]">{occ.date}</span>
                  </div>

                  <h4 className="font-bold text-slate-900 text-sm mt-2">{occ.customerName}</h4>
                  <p className="text-slate-600 text-xs mt-0.5">{occ.title}</p>

                  <div className="mt-3 p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-1.5">
                    <div className="font-bold text-purple-900 flex items-center gap-1.5">
                      <Gift className="w-4 h-4 text-purple-600 shrink-0" />
                      <span>{occ.giftName || 'Chưa chọn món quà'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1 border-t border-purple-100">
                      <span>Ngân sách: <strong className="text-emerald-700">{formatVnd(occ.giftBudget)}</strong></span>
                      <span>Sales: <strong className="text-slate-800">{occ.assignedStaff}</strong></span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-slate-500">Trạng thái:</span>
                  <button
                    onClick={() => handleCycleGiftStatus(occ)}
                    className={`font-bold px-3 py-1 rounded-xl text-xs cursor-pointer transition-colors ${
                      occ.giftStatus === 'delivered'
                        ? 'bg-emerald-100 text-emerald-800'
                        : occ.giftStatus === 'delivering'
                        ? 'bg-blue-100 text-blue-800'
                        : occ.giftStatus === 'prepared'
                        ? 'bg-purple-100 text-purple-800'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {occ.giftStatus === 'delivered'
                      ? '✓ Đã trao tận tay'
                      : occ.giftStatus === 'delivering'
                      ? 'Đang vận chuyển'
                      : occ.giftStatus === 'prepared'
                      ? 'Đã chuẩn bị xong'
                      : 'Chưa chuẩn bị'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===================== TAB 4: GREETING TEMPLATES & AUTOMATION ===================== */}
      {activeTab === 'templates' && (
        <div className="space-y-4 text-xs">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-rose-500" />
                <span>Kho Mẫu Lời Chúc Mừng & Tự Động Điền Thông Tin</span>
              </h3>
              <p className="text-slate-500 text-xs">
                Tự động thay thế các biến: <code>&#123;&#123;CUSTOMER_NAME&#125;&#125;</code>, <code>&#123;&#123;REPRESENTATIVE_NAME&#125;&#125;</code>, <code>&#123;&#123;POINTS&#125;&#125;</code>, <code>&#123;&#123;DISCOUNT&#125;&#125;</code>, <code>&#123;&#123;STAFF_NAME&#125;&#125;</code>
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {DEFAULT_GREETING_TEMPLATES.map((tmpl) => {
              const cfg = OCCASION_TYPE_CONFIG[tmpl.occasionType];
              const isCopied = copiedTemplateId === tmpl.id;

              return (
                <div
                  key={tmpl.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.badgeBg}`}>
                        {cfg.icon} {cfg.shortLabel}
                      </span>
                      <span className="font-bold text-slate-400 uppercase text-[10px] bg-slate-100 px-2 py-0.5 rounded">
                        Kênh {tmpl.channel.toUpperCase()}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm">{tmpl.title}</h4>

                    <div className="mt-2.5 p-3.5 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 whitespace-pre-line leading-relaxed font-mono text-[11px]">
                      {tmpl.content}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      onClick={() => handleCopyTemplate(tmpl)}
                      className="px-3.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold rounded-xl border border-blue-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{isCopied ? 'Đã sao chép!' : 'Sao chép mẫu'}</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODALS */}
      <SpecialOccasionModal
        isOpen={isOccasionModalOpen}
        onClose={() => setIsOccasionModalOpen(false)}
        onSave={onSaveOccasion}
        occasionToEdit={occasionToEdit}
        customers={customers}
      />

      <SendGreetingModal
        isOpen={isSendGreetingModalOpen}
        onClose={() => setIsSendGreetingModalOpen(false)}
        occasion={occasionForGreeting}
        customer={customers.find((c) => c.id === occasionForGreeting?.customerId)}
        onConfirmSend={handleConfirmSendGreeting}
      />

      <LoyaltyPointsModal
        isOpen={isLoyaltyModalOpen}
        onClose={() => setIsLoyaltyModalOpen(false)}
        customer={selectedCustomerForLoyalty}
        onSavePoints={({ customerId, pointsChange, transactionType, description, newTier }) => {
          onGrantBonusPoints(customerId, pointsChange, description);
          if (newTier) {
            // Update tier in customer
            const cust = customers.find((c) => c.id === customerId);
            if (cust) {
              cust.loyaltyTier = newTier;
            }
          }
          onSaveLoyaltyTransaction({
            id: `lt-${Date.now()}`,
            customerId,
            customerName: selectedCustomerForLoyalty?.name || '',
            points: pointsChange,
            type: transactionType,
            description,
            date: new Date().toISOString().substring(0, 10),
            createdBy: 'Quản trị viên'
          });
        }}
      />
    </div>
  );
};
