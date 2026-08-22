import React, { useState, useMemo } from 'react';
import {
  CreditCard,
  TrendingUp,
  AlertTriangle,
  Clock,
  CheckCircle2,
  Users,
  Building2,
  Send,
  Mail,
  MessageSquare,
  Phone,
  Calendar,
  DollarSign,
  ChevronRight,
  Filter,
  Search,
  FileText,
  Sparkles,
  ArrowUpRight,
  UserCheck,
  Check,
  AlertCircle
} from 'lucide-react';
import {
  Customer,
  Supplier,
  PurchaseOrder,
  Order,
  DebtAgingBucket,
  DebtReminderLog,
  ReminderChannel
} from '../../types';

interface DashboardDebtSectionProps {
  customers: Customer[];
  suppliers: Supplier[];
  orders: Order[];
  purchaseOrders: PurchaseOrder[];
  reminderLogs: DebtReminderLog[];
  onAddReminderLog: (log: DebtReminderLog) => void;
  onDrilldownDebtBucket?: (bucket: DebtAgingBucket, type: 'ar' | 'ap') => void;
  onDrilldownCustomer?: (customer: Customer) => void;
  onDrilldownSupplier?: (supplier: Supplier) => void;
}

export const DashboardDebtSection: React.FC<DashboardDebtSectionProps> = ({
  customers,
  suppliers,
  orders,
  purchaseOrders,
  reminderLogs,
  onAddReminderLog,
  onDrilldownDebtBucket,
  onDrilldownCustomer,
  onDrilldownSupplier
}) => {
  const [activeTab, setActiveTab] = useState<'ar' | 'ap' | 'sales' | 'logs'>('ar');
  const [selectedAgingFilter, setSelectedAgingFilter] = useState<DebtAgingBucket | 'ALL'>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<{
    type: 'customer' | 'supplier';
    id: string;
    code: string;
    name: string;
    phone?: string;
    email?: string;
    debt: number;
    dueDate: string;
    assignedStaff: string;
  } | null>(null);
  const [reminderChannel, setReminderChannel] = useState<ReminderChannel>('zalo_oa');
  const [customMessage, setCustomMessage] = useState('');
  const [reminderSuccessToast, setReminderSuccessToast] = useState<string | null>(null);

  const formatVND = (v: number) => {
    const val = Number(v) || 0;
    return new Intl.NumberFormat('vi-VN').format(isNaN(val) ? 0 : val) + ' đ';
  };

  // 1. Calculate 11 Debt KPIs
  const totalReceivables = useMemo(() => {
    return customers.reduce((sum, c) => sum + (Number(c.debt) || 0), 0);
  }, [customers]);

  const totalPayables = useMemo(() => {
    return suppliers.reduce((sum, s) => sum + (Number(s.debt) || 0), 0);
  }, [suppliers]);

  const debtorCustomerCount = useMemo(() => {
    return customers.filter((c) => (Number(c.debt) || 0) > 0).length;
  }, [customers]);

  const debtorSupplierCount = useMemo(() => {
    return suppliers.filter((s) => (Number(s.debt) || 0) > 0).length;
  }, [suppliers]);

  const totalCollected = useMemo(() => {
    // Total spent/paid from orders
    return orders
      .filter((o) => o.paymentStatus === 'paid')
      .reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);
  }, [orders]);

  const totalPaid = useMemo(() => {
    return purchaseOrders.reduce((sum, po) => sum + (Number(po.paidAmount) || 0), 0);
  }, [purchaseOrders]);

  // Mock due dates and categorize customers into 7 Aging Buckets
  const customerAgingData = useMemo(() => {
    const today = new Date('2026-08-16').getTime();

    return customers.map((c, idx) => {
      const debtVal = Number(c.debt) || 0;
      // Assign realistic due dates based on index
      let dueDateStr = '2026-08-20';
      let overdueDays = 0;

      if (idx === 0) {
        dueDateStr = '2026-08-25'; // Chưa đến hạn
        overdueDays = 0;
      } else if (idx === 1) {
        dueDateStr = '2026-08-16'; // Đến hạn hôm nay
        overdueDays = 0;
      } else if (idx === 2) {
        dueDateStr = '2026-08-12'; // Quá hạn 4 ngày (1-7d)
        overdueDays = 4;
      } else if (idx === 3) {
        dueDateStr = '2026-08-05'; // Quá hạn 11 ngày (8-30d)
        overdueDays = 11;
      } else if (idx === 4) {
        dueDateStr = '2026-07-01'; // Quá hạn 46 ngày (31-90d)
        overdueDays = 46;
      } else {
        dueDateStr = '2026-08-22';
        overdueDays = 0;
      }

      let bucket: DebtAgingBucket = 'current';
      if (overdueDays === 0) {
        if (dueDateStr === '2026-08-16') bucket = 'due_today';
        else bucket = 'current';
      } else if (overdueDays >= 1 && overdueDays <= 7) {
        bucket = 'overdue_1_7';
      } else if (overdueDays >= 8 && overdueDays <= 30) {
        bucket = 'overdue_8_30';
      } else if (overdueDays >= 31 && overdueDays <= 90) {
        bucket = 'overdue_31_90';
      } else if (overdueDays >= 91 && overdueDays <= 180) {
        bucket = 'overdue_91_180';
      } else {
        bucket = 'overdue_over_180';
      }

      const assignedStaff = idx % 2 === 0 ? 'Nguyễn Văn A (Sales)' : 'Trần Thị Mai (Sales)';

      return {
        ...c,
        debt: debtVal,
        dueDate: dueDateStr,
        overdueDays,
        bucket,
        assignedStaff
      };
    });
  }, [customers]);

  // Aggregate 7 Debt Aging Buckets for AR
  const agingBucketsSummary = useMemo(() => {
    const buckets: Record<
      DebtAgingBucket,
      { label: string; amount: number; count: number; badgeColor: string }
    > = {
      current: { label: 'Chưa đến hạn', amount: 0, count: 0, badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
      due_today: { label: 'Đến hạn hôm nay', amount: 0, count: 0, badgeColor: 'bg-amber-50 text-amber-700 border-amber-200' },
      overdue_1_7: { label: 'Quá hạn 1–7 ngày', amount: 0, count: 0, badgeColor: 'bg-orange-50 text-orange-700 border-orange-200' },
      overdue_8_30: { label: 'Quá hạn 8–30 ngày', amount: 0, count: 0, badgeColor: 'bg-rose-50 text-rose-700 border-rose-200' },
      overdue_31_90: { label: 'Quá hạn 31–90 ngày', amount: 0, count: 0, badgeColor: 'bg-red-50 text-red-700 border-red-200' },
      overdue_91_180: { label: 'Quá hạn 91–180 ngày', amount: 0, count: 0, badgeColor: 'bg-purple-50 text-purple-700 border-purple-200' },
      overdue_over_180: { label: 'Quá hạn >180 ngày', amount: 0, count: 0, badgeColor: 'bg-slate-100 text-slate-800 border-slate-300' }
    };

    customerAgingData.forEach((item) => {
      if (item.debt > 0) {
        buckets[item.bucket].amount += item.debt;
        buckets[item.bucket].count += 1;
      }
    });

    return buckets;
  }, [customerAgingData]);

  // Overdue total vs Due soon total
  const overdueTotalAR = useMemo(() => {
    return customerAgingData
      .filter((c) => c.overdueDays > 0)
      .reduce((sum, c) => sum + c.debt, 0);
  }, [customerAgingData]);

  const dueSoonTotalAR = useMemo(() => {
    return customerAgingData
      .filter((c) => c.bucket === 'due_today' || c.bucket === 'current')
      .reduce((sum, c) => sum + c.debt, 0);
  }, [customerAgingData]);

  // Open reminder modal
  const handleOpenReminderModal = (item: any, type: 'customer' | 'supplier') => {
    setSelectedTarget({
      type,
      id: item.id,
      code: item.code,
      name: item.name,
      phone: item.phone,
      email: item.email,
      debt: item.debt,
      dueDate: item.dueDate || '2026-08-20',
      assignedStaff: item.assignedStaff || 'Phụ trách kế toán'
    });

    const defaultMsg =
      type === 'customer'
        ? `[BIZONE ERP - THÔNG BÁO CÔNG NỢ]\nKính gửi Quý khách ${item.name},\nKhoản công nợ trị giá ${formatVND(
            item.debt
          )} (Hạn thanh toán: ${item.dueDate || '2026-08-20'}) hiện ${
            item.overdueDays > 0 ? `đã quá hạn ${item.overdueDays} ngày` : 'sắp đến hạn'
          }. Quý khách vui lòng chuyển khoản thanh toán theo STK công ty hoặc quét mã VietQR.`
        : `[BIZONE ERP - ĐỐI CHIẾU CÔNG NỢ NCC]\nKính gửi ${item.name},\nBizOne ERP xác nhận số dư công nợ phải trả là ${formatVND(
            item.debt
          )}. Đề nghị gửi đối chiếu hóa đơn GTGT trước ngày ${item.dueDate || '2026-08-30'}.`;

    setCustomMessage(defaultMsg);
    setShowReminderModal(true);
  };

  // Submit reminder
  const handleSendReminder = () => {
    if (!selectedTarget) return;

    const newLog: DebtReminderLog = {
      id: `remind-${Date.now()}`,
      timestamp: '2026-08-16 08:45',
      targetType: selectedTarget.type,
      targetId: selectedTarget.id,
      targetCode: selectedTarget.code,
      targetName: selectedTarget.name,
      invoiceCode: 'HD-' + selectedTarget.code,
      debtAmount: selectedTarget.debt,
      channel: reminderChannel,
      recipientName: selectedTarget.name,
      recipientContact:
        reminderChannel === 'email'
          ? selectedTarget.email || 'ketoan@company.com'
          : selectedTarget.phone || '0901234567',
      assignedStaff: selectedTarget.assignedStaff,
      messageContent: customMessage,
      status: 'sent',
      sentAt: '2026-08-16 08:45',
      dueDate: selectedTarget.dueDate,
      overdueDays: 0,
      reminderCount: 1
    };

    onAddReminderLog(newLog);
    setShowReminderModal(false);
    setReminderSuccessToast(`Đã gửi thông báo nhắc nợ thành công qua ${reminderChannel.toUpperCase()} tới ${selectedTarget.name}!`);
    setTimeout(() => setReminderSuccessToast(null), 4000);
  };

  // Sales group AR
  const salesArGroup = useMemo(() => {
    const map = new Map<string, { staff: string; count: number; totalDebt: number; overdueCount: number; customers: typeof customerAgingData }>();

    customerAgingData.forEach((c) => {
      if (c.debt > 0) {
        const staff = c.assignedStaff;
        if (!map.has(staff)) {
          map.set(staff, { staff, count: 0, totalDebt: 0, overdueCount: 0, customers: [] });
        }
        const g = map.get(staff)!;
        g.count += 1;
        g.totalDebt += c.debt;
        if (c.overdueDays > 0) g.overdueCount += 1;
        g.customers.push(c);
      }
    });

    return Array.from(map.values());
  }, [customerAgingData]);

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    let list = customerAgingData.filter((c) => c.debt > 0);
    if (selectedAgingFilter !== 'ALL') {
      list = list.filter((c) => c.bucket === selectedAgingFilter);
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.code.toLowerCase().includes(q) ||
          (c.phone && c.phone.includes(q))
      );
    }
    return list;
  }, [customerAgingData, selectedAgingFilter, searchTerm]);

  return (
    <div id="dashboard-debt-command-center" className="space-y-6">
      {/* Toast Notification */}
      {reminderSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-emerald-900 text-emerald-100 px-4 py-3 rounded-2xl shadow-2xl border border-emerald-700 flex items-center gap-3 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-xs font-bold">{reminderSuccessToast}</span>
        </div>
      )}

      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white p-5 rounded-2xl shadow-sm border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-indigo-600/40 border border-indigo-400/30 text-indigo-300">
              <CreditCard className="w-5 h-5" />
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
              Quản Trị Công Nợ & Nhắc Nợ Tự Động
            </h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Tổng hợp Realtime công nợ Phải thu (AR), Phải trả (AP), 7 nhóm tuổi nợ và gửi nhắc nợ qua Email / Zalo / Zalo OA.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-indigo-900/80 border border-indigo-700 text-indigo-200">
            📊 {debtorCustomerCount} Khách nợ • {debtorSupplierCount} NCC nợ
          </span>
        </div>
      </div>

      {/* 11 KPI Cards for Debt */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {/* KPI 1: Phải thu */}
        <div
          onClick={() => {
            setActiveTab('ar');
            setSelectedAgingFilter('ALL');
          }}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-blue-400 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-blue-600 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phải Thu (AR)</span>
            <Users className="w-4 h-4" />
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900">{formatVND(totalReceivables)}</div>
          <div className="text-[10px] text-blue-600 font-semibold mt-1">{debtorCustomerCount} khách hàng nợ</div>
        </div>

        {/* KPI 2: Phải trả */}
        <div
          onClick={() => setActiveTab('ap')}
          className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs hover:border-purple-400 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-purple-600 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Phải Trả (AP)</span>
            <Building2 className="w-4 h-4" />
          </div>
          <div className="text-base sm:text-lg font-black text-slate-900">{formatVND(totalPayables)}</div>
          <div className="text-[10px] text-purple-600 font-semibold mt-1">{debtorSupplierCount} NCC nợ</div>
        </div>

        {/* KPI 3: Quá hạn */}
        <div
          onClick={() => {
            setActiveTab('ar');
            setSelectedAgingFilter('overdue_8_30');
          }}
          className="bg-white p-4 rounded-2xl border border-rose-200/80 shadow-xs hover:border-rose-400 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-rose-600 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Nợ Quá Hạn</span>
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="text-base sm:text-lg font-black text-rose-700">{formatVND(overdueTotalAR)}</div>
          <div className="text-[10px] text-rose-600 font-semibold mt-1">Cần đôn đốc ngay</div>
        </div>

        {/* KPI 4: Sắp đến hạn */}
        <div
          onClick={() => {
            setActiveTab('ar');
            setSelectedAgingFilter('due_today');
          }}
          className="bg-white p-4 rounded-2xl border border-amber-200/80 shadow-xs hover:border-amber-400 hover:shadow-md transition cursor-pointer"
        >
          <div className="flex items-center justify-between text-amber-600 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Sắp Đến Hạn</span>
            <Clock className="w-4 h-4" />
          </div>
          <div className="text-base sm:text-lg font-black text-amber-700">{formatVND(dueSoonTotalAR)}</div>
          <div className="text-[10px] text-amber-600 font-semibold mt-1">Hôm nay & 7 ngày tới</div>
        </div>

        {/* KPI 5: Giá trị đã thu */}
        <div className="bg-white p-4 rounded-2xl border border-emerald-200/80 shadow-xs">
          <div className="flex items-center justify-between text-emerald-600 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Đã Thu (Kỳ này)</span>
            <TrendingUp className="w-4 h-4" />
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-700">{formatVND(totalCollected)}</div>
          <div className="text-[10px] text-emerald-600 font-semibold mt-1">Giao dịch thành công</div>
        </div>

        {/* KPI 6: Giá trị đã trả */}
        <div className="bg-white p-4 rounded-2xl border border-indigo-200/80 shadow-xs">
          <div className="flex items-center justify-between text-indigo-600 mb-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Đã Trả (Kỳ này)</span>
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div className="text-base sm:text-lg font-black text-indigo-700">{formatVND(totalPaid)}</div>
          <div className="text-[10px] text-indigo-600 font-semibold mt-1">Đã tất toán NCC</div>
        </div>
      </div>

      {/* 7 Debt Aging Buckets Visual Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-sm space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Phân Tích 7 Nhóm Tuổi Công Nợ Phải Thu (AR Aging Buckets)
            </h3>
            <p className="text-xs text-slate-500">
              Nhấp vào bất kỳ nhóm nào để lọc nhanh danh sách khách hàng và gửi thông báo nhắc nợ.
            </p>
          </div>

          {selectedAgingFilter !== 'ALL' && (
            <button
              onClick={() => setSelectedAgingFilter('ALL')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 px-2.5 py-1 rounded-lg transition"
            >
              ✕ Bỏ lọc nhóm tuổi nợ
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {(Object.keys(agingBucketsSummary) as DebtAgingBucket[]).map((bucketKey) => {
            const b = agingBucketsSummary[bucketKey];
            const isSelected = selectedAgingFilter === bucketKey;
            return (
              <div
                key={bucketKey}
                onClick={() => {
                  setSelectedAgingFilter(isSelected ? 'ALL' : bucketKey);
                  if (onDrilldownDebtBucket) onDrilldownDebtBucket(bucketKey, 'ar');
                }}
                className={`p-3 rounded-xl border transition cursor-pointer text-left flex flex-col justify-between ${
                  isSelected
                    ? 'ring-2 ring-blue-600 border-blue-600 bg-blue-50/50 shadow-sm'
                    : 'border-slate-200 hover:border-blue-300 hover:bg-slate-50/80'
                }`}
              >
                <div>
                  <span className={`inline-block text-[10px] font-extrabold px-1.5 py-0.5 rounded-md border ${b.badgeColor} mb-1.5`}>
                    {b.label}
                  </span>
                  <div className="text-xs sm:text-sm font-black text-slate-900">{formatVND(b.amount)}</div>
                </div>
                <div className="text-[10px] font-bold text-slate-500 mt-2 flex items-center justify-between">
                  <span>{b.count} khách</span>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Tabbed Area: AR vs AP vs Sales vs Reminder Logs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        {/* Tabs Bar */}
        <div className="flex flex-wrap items-center justify-between border-b border-slate-200 bg-slate-50/70 px-4 pt-3">
          <div className="flex items-center gap-2 overflow-x-auto pb-3">
            <button
              onClick={() => setActiveTab('ar')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ar'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              Công Nợ Phải Thu ({debtorCustomerCount})
            </button>
            <button
              onClick={() => setActiveTab('ap')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'ap'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Building2 className="w-3.5 h-3.5" />
              Công Nợ Phải Trả ({debtorSupplierCount})
            </button>
            <button
              onClick={() => setActiveTab('sales')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'sales'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Công Nợ Theo Sale ({salesArGroup.length})
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'logs'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              Lịch Sử Nhắc Nợ ({reminderLogs.length})
            </button>
          </div>

          <div className="pb-3 w-full sm:w-64">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm khách hàng / NCC / SĐT..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Tab 1: Phải thu (AR) Table */}
        {activeTab === 'ar' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                  <th className="py-3 px-3">STT</th>
                  <th className="py-3 px-3">MÃ KH</th>
                  <th className="py-3 px-3">KHÁCH HÀNG</th>
                  <th className="py-3 px-3">SỐ ĐIỆN THOẠI</th>
                  <th className="py-3 px-3">HẠN THANH TOÁN</th>
                  <th className="py-3 px-3 text-right">DƯ NỢ CÒN LẠI</th>
                  <th className="py-3 px-3 text-center">TUỔI NỢ / TRẠNG THÁI</th>
                  <th className="py-3 px-3">SALE PHỤ TRÁCH</th>
                  <th className="py-3 px-3 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredCustomers.map((c, idx) => (
                  <tr key={c.id} className="hover:bg-blue-50/40 transition">
                    <td className="py-3 px-3 font-medium text-slate-400">{idx + 1}</td>
                    <td
                      onClick={() => onDrilldownCustomer && onDrilldownCustomer(c)}
                      className="py-3 px-3 font-mono font-bold text-blue-700 cursor-pointer hover:underline"
                    >
                      {c.code}
                    </td>
                    <td className="py-3 px-3 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-3 text-slate-600">{c.phone || 'Chưa cập nhật'}</td>
                    <td className="py-3 px-3 text-slate-700 font-semibold">{c.dueDate}</td>
                    <td className="py-3 px-3 text-right font-mono font-black text-rose-700">{formatVND(c.debt)}</td>
                    <td className="py-3 px-3 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          agingBucketsSummary[c.bucket].badgeColor
                        }`}
                      >
                        {c.overdueDays > 0 ? `Quá hạn ${c.overdueDays} ngày` : 'Trong hạn'}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-slate-600">{c.assignedStaff}</td>
                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => handleOpenReminderModal(c, 'customer')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs transition cursor-pointer border border-indigo-200"
                      >
                        <Send className="w-3 h-3" />
                        Nhắc nợ
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredCustomers.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-slate-400">
                      Không có khách hàng nợ nào trong nhóm tuổi này.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: Phải trả (AP) Table */}
        {activeTab === 'ap' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                  <th className="py-3 px-3">STT</th>
                  <th className="py-3 px-3">MÃ NCC</th>
                  <th className="py-3 px-3">NHÀ CUNG CẤP</th>
                  <th className="py-3 px-3">MST / SĐT</th>
                  <th className="py-3 px-3 text-right">HẠN MỨC NỢ</th>
                  <th className="py-3 px-3 text-right">NỢ PHẢI TRẢ HIỆN TẠI</th>
                  <th className="py-3 px-3">ĐIỀU KHOẢN</th>
                  <th className="py-3 px-3 text-right">THAO TÁC</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {suppliers
                  .filter((s) => (Number(s.debt) || 0) > 0)
                  .map((s, idx) => (
                    <tr key={s.id} className="hover:bg-purple-50/40 transition">
                      <td className="py-3 px-3 font-medium text-slate-400">{idx + 1}</td>
                      <td
                        onClick={() => onDrilldownSupplier && onDrilldownSupplier(s)}
                        className="py-3 px-3 font-mono font-bold text-purple-700 cursor-pointer hover:underline"
                      >
                        {s.code}
                      </td>
                      <td className="py-3 px-3 font-bold text-slate-900">{s.name}</td>
                      <td className="py-3 px-3 text-slate-600">{s.phone}</td>
                      <td className="py-3 px-3 text-right font-mono text-slate-600">{formatVND(s.creditLimit || 0)}</td>
                      <td className="py-3 px-3 text-right font-mono font-black text-rose-700">{formatVND(s.debt || 0)}</td>
                      <td className="py-3 px-3 text-slate-600 text-[11px]">{s.paymentTerms || 'Net 30'}</td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleOpenReminderModal(s, 'supplier')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition cursor-pointer border border-purple-200"
                        >
                          <Send className="w-3 h-3" />
                          Đối chiếu
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Sales AR Follow-up Group */}
        {activeTab === 'sales' && (
          <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
            {salesArGroup.map((sg, idx) => (
              <div key={idx} className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-800 font-bold flex items-center justify-center text-xs">
                      {sg.staff.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xs font-extrabold text-slate-900">{sg.staff}</h4>
                      <p className="text-[10px] text-slate-500">{sg.count} khách hàng cần thu hồi nợ</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Tổng nợ phụ trách</span>
                    <div className="text-sm font-black text-rose-700">{formatVND(sg.totalDebt)}</div>
                  </div>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sg.customers.map((c) => (
                    <div key={c.id} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 text-xs">
                      <div>
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[10px] text-slate-500">
                          Hạn: {c.dueDate} •{' '}
                          {c.overdueDays > 0 ? (
                            <span className="text-rose-600 font-bold">Quá hạn {c.overdueDays} ngày</span>
                          ) : (
                            <span className="text-emerald-600">Trong hạn</span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-bold text-rose-700">{formatVND(c.debt)}</div>
                        <button
                          onClick={() => handleOpenReminderModal(c, 'customer')}
                          className="text-[10px] font-bold text-blue-600 hover:underline cursor-pointer"
                        >
                          Nhắc nợ →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Reminder Logs History */}
        {activeTab === 'logs' && (
          <div className="p-4 overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[750px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] font-extrabold text-slate-600 uppercase border-b border-slate-200">
                  <th className="py-2.5 px-3">THỜI GIAN</th>
                  <th className="py-2.5 px-3">ĐỐI TƯỢNG</th>
                  <th className="py-2.5 px-3">KHOẢN NỢ</th>
                  <th className="py-2.5 px-3">KÊNH</th>
                  <th className="py-2.5 px-3">NGƯỜI NHẬN</th>
                  <th className="py-2.5 px-3">NỘI DUNG</th>
                  <th className="py-2.5 px-3 text-center">TRẠNG THÁI</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {reminderLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70">
                    <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">{log.timestamp}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">{log.targetName}</td>
                    <td className="py-2.5 px-3 font-mono font-bold text-rose-700">{formatVND(log.debtAmount)}</td>
                    <td className="py-2.5 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-800">
                        {log.channel}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div>{log.recipientName}</div>
                      <div className="text-[10px] text-slate-400">{log.recipientContact}</div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate text-[11px]">{log.messageContent}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {log.status === 'sent'
                          ? 'Đã gửi'
                          : log.status === 'confirmed'
                          ? 'Đã xác nhận'
                          : 'Chờ gửi'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal: Gửi Nhắc Nợ Đa Kênh (Email / Zalo / Zalo OA) */}
      {showReminderModal && selectedTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-100 text-indigo-700">
                  <Send className="w-4 h-4" />
                </span>
                <h3 className="text-sm font-extrabold text-slate-900">
                  Gửi Nhắc Nợ Tự Động: {selectedTarget.name}
                </h3>
              </div>
              <button
                onClick={() => setShowReminderModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl text-xs">
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Khoản nợ:</span>
                <div className="text-sm font-black text-rose-700">{formatVND(selectedTarget.debt)}</div>
              </div>
              <div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">Hạn thanh toán:</span>
                <div className="font-semibold text-slate-800">{selectedTarget.dueDate}</div>
              </div>
            </div>

            {/* Select Channel */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Chọn kênh gửi thông báo:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReminderChannel('zalo_oa')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    reminderChannel === 'zalo_oa'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                  Zalo OA
                </button>
                <button
                  type="button"
                  onClick={() => setReminderChannel('zalo')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    reminderChannel === 'zalo'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5 text-blue-500" />
                  Zalo Cá Nhân
                </button>
                <button
                  type="button"
                  onClick={() => setReminderChannel('email')}
                  className={`p-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    reminderChannel === 'email'
                      ? 'border-blue-600 bg-blue-50 text-blue-700 ring-2 ring-blue-500/20'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-purple-600" />
                  Email
                </button>
              </div>
            </div>

            {/* Custom Message Content */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Nội dung thông điệp nhắc nợ:</label>
              <textarea
                rows={4}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full border border-slate-200 rounded-xl p-3 text-xs text-slate-800 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowReminderModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition cursor-pointer"
              >
                Hủy
              </button>
              <button
                onClick={handleSendReminder}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition cursor-pointer"
              >
                <Send className="w-3.5 h-3.5" />
                Gửi thông báo ngay
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
