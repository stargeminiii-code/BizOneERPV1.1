import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Building2,
  Users,
  CreditCard,
  KeyRound,
  FileCheck2,
  Headphones,
  History,
  Package,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Filter,
  Plus,
  RefreshCw,
  Eye,
  Lock,
  Unlock,
  ChevronRight,
  TrendingUp,
  Sparkles,
  Smartphone,
  Globe,
  Download,
  Share2,
  Calendar,
  DollarSign,
  ShieldCheck,
  Check,
  X,
  FileText,
  GitBranch
} from 'lucide-react';
import {
  SaaSPlan,
  CustomerRegistration,
  TenantAccount,
  SaaSSubscription,
  SaaSLicense,
  SaaSBillingTransaction,
  SaaSContract,
  SaaSSupportTicket,
  SaaSAuditLog,
  PlatformMetrics,
  UserAccount
} from '../../types';
import { SaaSService } from '../../services/saasService';
import { ReleaseManagementView } from './ReleaseManagementView';
import { PaymentHubView } from './PaymentHubView';
import { SecurityAdminView } from './SecurityAdminView';

interface PlatformAdminViewProps {
  currentUser: UserAccount | null;
  onBackToERP: () => void;
}

type PlatformTab =
  | 'overview'
  | 'customers'
  | 'approvals'
  | 'plans-licenses'
  | 'releases'
  | 'payment-hub'
  | 'billing'
  | 'contracts'
  | 'support'
  | 'packaging'
  | 'security'
  | 'audit';

export const PlatformAdminView: React.FC<PlatformAdminViewProps> = ({
  currentUser,
  onBackToERP
}) => {
  const [activeTab, setActiveTab] = useState<PlatformTab>('overview');

  // Datasets state
  const [metrics, setMetrics] = useState<PlatformMetrics>(SaaSService.getMetrics());
  const [tenants, setTenants] = useState<TenantAccount[]>(SaaSService.getTenants());
  const [registrations, setRegistrations] = useState<CustomerRegistration[]>(SaaSService.getRegistrations());
  const [plans, setPlans] = useState<SaaSPlan[]>(SaaSService.getPlans());
  const [subscriptions, setSubscriptions] = useState<SaaSSubscription[]>(SaaSService.getSubscriptions());
  const [licenses, setLicenses] = useState<SaaSLicense[]>(SaaSService.getLicenses());
  const [billing, setBilling] = useState<SaaSBillingTransaction[]>(SaaSService.getBillingTransactions());
  const [contracts, setContracts] = useState<SaaSContract[]>(SaaSService.getContracts());
  const [tickets, setTickets] = useState<SaaSSupportTicket[]>(SaaSService.getSupportTickets());
  const [auditLogs, setAuditLogs] = useState<SaaSAuditLog[]>(SaaSService.getAuditLogs());

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Modals & Drawers
  const [selectedTenant, setSelectedTenant] = useState<TenantAccount | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<CustomerRegistration | null>(null);
  const [isRenewModalOpen, setIsRenewModalOpen] = useState(false);
  const [tenantToRenew, setTenantToRenew] = useState<TenantAccount | null>(null);
  const [renewPlanCode, setRenewPlanCode] = useState<SaaSPlan['code']>('ANNUAL');

  // Rejection modal
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [regToReject, setRegToReject] = useState<CustomerRegistration | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  // Toast & Loading
  const [toastMsg, setToastMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isApprovingId, setIsApprovingId] = useState<string | null>(null);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMsg({ text, type });
    setTimeout(() => setToastMsg(null), 4000);
  };

  const refreshAllData = async () => {
    try {
      const serverRegs = await SaaSService.syncRegistrationsFromServer();
      setRegistrations(serverRegs);
    } catch {
      setRegistrations(SaaSService.getRegistrations());
    }
    setMetrics(SaaSService.getMetrics());
    setTenants(SaaSService.getTenants());
    setPlans(SaaSService.getPlans());
    setSubscriptions(SaaSService.getSubscriptions());
    setLicenses(SaaSService.getLicenses());
    setBilling(SaaSService.getBillingTransactions());
    setContracts(SaaSService.getContracts());
    setTickets(SaaSService.getSupportTickets());
    setAuditLogs(SaaSService.getAuditLogs());
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  const handleApproveRegistration = async (reg: CustomerRegistration) => {
    setIsApprovingId(reg.id);
    try {
      const res = await SaaSService.approveRegistration(reg.id, currentUser?.name || 'Super Admin');
      if (res.success) {
        showToast(res.message);
        await refreshAllData();
        setSelectedRegistration(null);
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi phê duyệt hồ sơ', 'error');
    } finally {
      setIsApprovingId(null);
    }
  };

  const handleRepairAccount = async (regId: string) => {
    setIsApprovingId(regId);
    try {
      const res = await SaaSService.repairApprovedCustomerAccount(regId);
      if (res.success) {
        showToast(res.message);
        await refreshAllData();
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Lỗi khi đồng bộ tài khoản', 'error');
    } finally {
      setIsApprovingId(null);
    }
  };

  const handleOpenReject = (reg: CustomerRegistration) => {
    setRegToReject(reg);
    setRejectReason('');
    setIsRejectModalOpen(true);
  };

  const handleConfirmReject = () => {
    if (!regToReject) return;
    if (!rejectReason.trim()) {
      showToast('Vui lòng nhập lý do từ chối hồ sơ.', 'error');
      return;
    }
    const success = SaaSService.rejectRegistration(regToReject.id, rejectReason, currentUser?.name || 'Super Admin');
    if (success) {
      showToast(`Đã từ chối hồ sơ ${regToReject.companyName}.`);
      refreshAllData();
      setIsRejectModalOpen(false);
      setRegToReject(null);
      setSelectedRegistration(null);
    }
  };

  const handleToggleTenantLock = (tenant: TenantAccount) => {
    const newStatus = tenant.status === 'SUSPENDED' ? 'ACTIVE' : 'SUSPENDED';
    const ok = SaaSService.updateTenantStatus(tenant.id, newStatus, currentUser?.name || 'Super Admin');
    if (ok) {
      showToast(
        newStatus === 'SUSPENDED'
          ? `Đã khóa tạm ngưng Tenant ${tenant.name}`
          : `Đã mở khóa kích hoạt Tenant ${tenant.name}`
      );
      refreshAllData();
      if (selectedTenant && selectedTenant.id === tenant.id) {
        setSelectedTenant({ ...selectedTenant, status: newStatus });
      }
    }
  };

  const handleOpenRenew = (tenant: TenantAccount) => {
    setTenantToRenew(tenant);
    setRenewPlanCode(tenant.planCode || 'ANNUAL');
    setIsRenewModalOpen(true);
  };

  const handleConfirmRenew = () => {
    if (!tenantToRenew) return;
    const res = SaaSService.renewSubscription(tenantToRenew.id, renewPlanCode, currentUser?.name || 'Super Admin');
    if (res.success) {
      showToast(res.message);
      refreshAllData();
      setIsRenewModalOpen(false);
      setTenantToRenew(null);
      if (selectedTenant && selectedTenant.id === tenantToRenew.id && res.newExpiryDate) {
        setSelectedTenant({ ...selectedTenant, expiryDate: res.newExpiryDate, status: 'ACTIVE' });
      }
    } else {
      showToast(res.message, 'error');
    }
  };

  const handleTicketStatusChange = (ticketId: string, status: SaaSSupportTicket['status']) => {
    SaaSService.updateTicketStatus(ticketId, status);
    showToast('Đã cập nhật trạng thái phiếu hỗ trợ.');
    refreshAllData();
  };

  // Filtered tenants
  const filteredTenants = tenants.filter((t) => {
    const matchSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.taxCode.includes(searchTerm) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.adminEmail.toLowerCase().includes(searchTerm.toLowerCase());
    const matchStatus = statusFilter === 'ALL' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  // Filtered registrations
  const pendingRegistrations = registrations.filter((r) => r.status === 'PENDING_APPROVAL');

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast */}
      {toastMsg && (
        <div
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl shadow-2xl border text-sm font-semibold flex items-center gap-2 animate-in slide-in-from-top-2 duration-200 ${
            toastMsg.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300 border-emerald-700/60'
              : 'bg-rose-950/90 text-rose-300 border-rose-700/60'
          }`}
        >
          {toastMsg.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <XCircle className="w-5 h-5 text-rose-400" />}
          <span>{toastMsg.text}</span>
        </div>
      )}

      {/* Top Navigation Bar */}
      <header className="h-16 bg-slate-950 border-b border-slate-800 px-6 flex items-center justify-between shrink-0 sticky top-0 z-40">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-lg shadow-lg shadow-blue-500/25">
              B
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-white">BizOne SaaS Platform</span>
                <span className="px-2 py-0.5 text-[10px] font-extrabold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-md">
                  SUPER ADMIN PORTAL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">Hệ Thống Quản Trị Khách Hàng & Nền Tảng Thương Mại</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Admin: <strong className="text-white">{currentUser?.name || 'Đức Tăng'}</strong></span>
          </div>

          <button
            onClick={onBackToERP}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/20 flex items-center gap-1.5"
          >
            <span>Quay lại BizOne ERP</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Sub-header Navigation Tabs */}
      <div className="bg-slate-950/80 border-b border-slate-800/80 px-6 flex items-center gap-1 overflow-x-auto shrink-0 sticky top-16 z-30">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          Tổng Quan Platform
        </button>

        <button
          onClick={() => setActiveTab('customers')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'customers'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Khách Hàng (Customer 360)
          <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded-full font-mono">
            {tenants.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('approvals')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'approvals'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          Duyệt Đăng Ký
          {pendingRegistrations.length > 0 && (
            <span className="px-1.5 py-0.5 text-[10px] bg-amber-500 text-slate-950 rounded-full font-bold">
              {pendingRegistrations.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('plans-licenses')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'plans-licenses'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          Gói & Bản Quyền (Licenses)
        </button>

        <button
          onClick={() => setActiveTab('releases')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'releases'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Phiên Bản & Cập Nhật (Releases)
        </button>

        <button
          onClick={() => setActiveTab('payment-hub')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'payment-hub'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4 text-emerald-400" />
          Payment Hub & Đối Soát
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'billing'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Thanh Toán & Hóa Đơn
        </button>

        <button
          onClick={() => setActiveTab('contracts')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'contracts'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Hợp Đồng
        </button>

        <button
          onClick={() => setActiveTab('support')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'support'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Headphones className="w-4 h-4" />
          Hỗ Trợ (Tickets)
        </button>

        <button
          onClick={() => setActiveTab('packaging')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'packaging'
              ? 'border-indigo-500 text-indigo-400 bg-indigo-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Package className="w-4 h-4" />
          Đóng Gói PWA & Mobile
        </button>

        <button
          onClick={() => setActiveTab('security')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'security'
              ? 'border-rose-500 text-rose-400 bg-rose-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <ShieldCheck className="w-4 h-4 text-rose-400" />
          Bảo Mật & 2FA
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`px-4 py-3 text-xs font-bold border-b-2 whitespace-nowrap transition-colors flex items-center gap-2 ${
            activeTab === 'audit'
              ? 'border-blue-500 text-blue-400 bg-blue-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          Audit Log
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 p-6 overflow-y-auto max-w-7xl w-full mx-auto space-y-6">
        {/* =========================================================================
            TAB 1: PLATFORM OVERVIEW (KPI DASHBOARD)
            ========================================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-lg">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Tổng Doanh Nghiệp</span>
                  <Building2 className="w-5 h-5 text-blue-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-white font-mono">{metrics.totalCustomers}</span>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center gap-0.5">
                    +{metrics.newCustomersThisMonth} tháng này
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  {metrics.activeTenants} đang hoạt động • {metrics.pendingApproval} chờ duyệt
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-lg">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">MRR (Doanh Thu Tháng)</span>
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-2xl font-extrabold text-emerald-400 font-mono">
                    {metrics.mrr.toLocaleString('vi-VN')} đ
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">
                  ARR ước tính: {(metrics.arr).toLocaleString('vi-VN')} đ
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-lg">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Hồ Sơ Chờ Duyệt</span>
                  <FileCheck2 className="w-5 h-5 text-amber-400" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-3xl font-extrabold text-amber-400 font-mono">{metrics.pendingApproval}</span>
                  <span className="text-xs text-amber-300 font-semibold">Cần xử lý</span>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">Khách đăng ký qua cổng Web & PWA</p>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-lg">
                <div className="flex items-center justify-between text-slate-400">
                  <span className="text-xs font-semibold uppercase tracking-wider">Sức Khỏe Khách Hàng</span>
                  <ShieldAlert className="w-5 h-5 text-indigo-400" />
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-1 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="font-bold text-white">{metrics.healthDistribution.good} Tốt</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span className="font-bold text-amber-400">{metrics.healthDistribution.attention} Chú ý</span>
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                    <span className="font-bold text-rose-400">{metrics.healthDistribution.risk} Rủi ro</span>
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-2">{metrics.expiringSoon} khách sắp hết hạn</p>
              </div>
            </div>

            {/* Quick Actions & Registrations Alert */}
            {pendingRegistrations.length > 0 && (
              <div className="p-4 rounded-2xl bg-amber-950/40 border border-amber-800/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-300">
                      Có {pendingRegistrations.length} hồ sơ đăng ký doanh nghiệp mới đang chờ duyệt
                    </h4>
                    <p className="text-xs text-amber-200/70">
                      Vui lòng kiểm tra thông tin MST và kích hoạt Tenant cấp License cho khách hàng.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('approvals')}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all shrink-0"
                >
                  Xử lý ngay ({pendingRegistrations.length})
                </button>
              </div>
            )}

            {/* Customer List Overview & Recent Registrations */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Active Tenants List */}
              <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-blue-400" />
                    Doanh Nghiệp Đang Hoạt Động Gần Đây
                  </h3>
                  <button
                    onClick={() => setActiveTab('customers')}
                    className="text-xs text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                  >
                    Xem tất cả <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="divide-y divide-slate-700/50">
                  {tenants.slice(0, 4).map((t) => (
                    <div key={t.id} className="py-3 flex items-center justify-between">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-white">{t.name}</span>
                          <span className="px-1.5 py-0.2 text-[10px] font-mono bg-slate-700 text-slate-300 rounded">
                            {t.code}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400">
                          {t.planName} • Hết hạn: {t.expiryDate} • Users: {t.activeUsersCount}/{t.maxUsers}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                            t.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : t.status === 'EXPIRING_SOON'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                          }`}
                        >
                          {t.status === 'ACTIVE' ? 'Hoạt động' : t.status === 'EXPIRING_SOON' ? 'Sắp hết hạn' : t.status}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedTenant(t);
                            setActiveTab('customers');
                          }}
                          className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-300"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Plans Overview Card */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-400" />
                  Gói Dịch Vụ Chuẩn
                </h3>
                <div className="space-y-2.5">
                  {plans.map((p) => (
                    <div key={p.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-700/50 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-white">{p.name}</span>
                          {p.badge && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400">Full tính năng • Max 3 Users</p>
                      </div>
                      <span className="text-xs font-bold text-blue-400 font-mono">
                        {p.price.toLocaleString('vi-VN')} đ
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 2: CUSTOMER 360 & TENANT MANAGEMENT
            ========================================================================= */}
        {activeTab === 'customers' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Header & Filter */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">Quản Trị Khách Hàng (Customer 360)</h2>
                <p className="text-xs text-slate-400">
                  Quản lý danh sách doanh nghiệp, phân quyền Tenant, hạn bản quyền & giới hạn 3 User
                </p>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên DN, MST, mã..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="ALL">Tất cả trạng thái</option>
                  <option value="ACTIVE">Đang hoạt động</option>
                  <option value="EXPIRING_SOON">Sắp hết hạn</option>
                  <option value="EXPIRED">Đã hết hạn</option>
                  <option value="SUSPENDED">Tạm ngưng / Khóa</option>
                </select>
              </div>
            </div>

            {/* Customers Table */}
            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-700/60">
                    <tr>
                      <th className="px-4 py-3">Mã & Doanh Nghiệp</th>
                      <th className="px-4 py-3">Mã Số Thuế</th>
                      <th className="px-4 py-3">Quản Trị Viên (Admin)</th>
                      <th className="px-4 py-3">Gói Dịch Vụ</th>
                      <th className="px-4 py-3">Số Users</th>
                      <th className="px-4 py-3">Ngày Hết Hạn</th>
                      <th className="px-4 py-3">Sức Khỏe</th>
                      <th className="px-4 py-3">Trạng Thái</th>
                      <th className="px-4 py-3 text-right">Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40 text-slate-300">
                    {filteredTenants.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-bold text-white">{t.name}</span>
                            <div className="text-[11px] text-slate-400 font-mono">{t.code}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-mono">{t.taxCode || '—'}</td>
                        <td className="px-4 py-3">
                          <div>
                            <span className="font-medium text-slate-200">{t.adminName}</span>
                            <div className="text-[11px] text-slate-400">{t.adminEmail}</div>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-semibold text-blue-400">{t.planName}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-700 font-mono font-bold text-slate-200">
                            {t.activeUsersCount} / {t.maxUsers} Users
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono">{t.expiryDate}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 font-semibold ${
                              t.healthStatus === 'GOOD'
                                ? 'text-emerald-400'
                                : t.healthStatus === 'ATTENTION'
                                ? 'text-amber-400'
                                : 'text-rose-400'
                            }`}
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                t.healthStatus === 'GOOD'
                                  ? 'bg-emerald-500'
                                  : t.healthStatus === 'ATTENTION'
                                  ? 'bg-amber-500'
                                  : 'bg-rose-500'
                              }`}
                            />
                            {t.healthStatus === 'GOOD' ? 'Tốt' : t.healthStatus === 'ATTENTION' ? 'Chú ý' : 'Rủi ro'}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              t.status === 'ACTIVE'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : t.status === 'EXPIRING_SOON'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                : t.status === 'SUSPENDED'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                            }`}
                          >
                            {t.status === 'ACTIVE'
                              ? 'Đang hoạt động'
                              : t.status === 'EXPIRING_SOON'
                              ? 'Sắp hết hạn'
                              : t.status === 'SUSPENDED'
                              ? 'Tạm ngưng / Khóa'
                              : t.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => setSelectedTenant(t)}
                              className="p-1.5 rounded-lg bg-slate-700/60 hover:bg-slate-700 text-slate-200 transition-colors"
                              title="Xem chi tiết Customer 360"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleOpenRenew(t)}
                              className="px-2 py-1 rounded-lg bg-blue-600/80 hover:bg-blue-600 text-white font-bold text-[11px] transition-colors"
                            >
                              Gia hạn
                            </button>
                            <button
                              onClick={() => handleToggleTenantLock(t)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                t.status === 'SUSPENDED'
                                  ? 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
                                  : 'bg-rose-600/60 hover:bg-rose-600 text-white'
                              }`}
                              title={t.status === 'SUSPENDED' ? 'Mở khóa Tenant' : 'Khóa Tenant'}
                            >
                              {t.status === 'SUSPENDED' ? <Unlock className="w-3.5 h-3.5" /> : <Lock className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Customer 360 Detail Modal */}
            {selectedTenant && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
                <div className="relative w-full max-w-3xl bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
                  {/* Modal Header */}
                  <div className="bg-slate-950 px-6 py-4 border-b border-slate-800 flex items-center justify-between">
                    <div>
                      <h3 className="text-base font-bold text-white flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-400" />
                        Customer 360: {selectedTenant.name}
                      </h3>
                      <p className="text-xs text-slate-400">Mã Tenant: {selectedTenant.id} ({selectedTenant.code})</p>
                    </div>
                    <button
                      onClick={() => setSelectedTenant(null)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Modal Body */}
                  <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
                    {/* Grid Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-2">
                        <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                          Thông Tin Pháp Lý & Trụ Sở
                        </h4>
                        <p><span className="text-slate-400">Tên công ty:</span> <strong className="text-white">{selectedTenant.companyName}</strong></p>
                        <p><span className="text-slate-400">Mã số thuế:</span> <span className="font-mono text-white">{selectedTenant.taxCode || '—'}</span></p>
                        <p><span className="text-slate-400">Đại diện pháp luật:</span> <span className="text-white">{selectedTenant.representative || '—'}</span></p>
                        <p><span className="text-slate-400">Địa chỉ:</span> <span className="text-slate-300">{selectedTenant.address || '—'}</span></p>
                      </div>

                      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-2">
                        <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px]">
                          Quản Trị Viên & Liên Hệ
                        </h4>
                        <p><span className="text-slate-400">Tenant Admin:</span> <strong className="text-white">{selectedTenant.adminName}</strong></p>
                        <p><span className="text-slate-400">Email:</span> <span className="text-blue-400">{selectedTenant.adminEmail}</span></p>
                        <p><span className="text-slate-400">Điện thoại:</span> <span className="text-slate-300">{selectedTenant.adminPhone || '—'}</span></p>
                        <p><span className="text-slate-400">Hoạt động gần nhất:</span> <span className="text-emerald-400">{selectedTenant.lastActive || 'Chưa rõ'}</span></p>
                      </div>
                    </div>

                    {/* Subscription & License Info */}
                    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="font-bold text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <KeyRound className="w-4 h-4 text-amber-400" />
                          Gói Dịch Vụ & License Key
                        </h4>
                        <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                          {selectedTenant.planName}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
                        <div>
                          <span className="text-slate-400">Giới hạn tài khoản:</span>
                          <p className="font-bold text-white text-sm">{selectedTenant.activeUsersCount} / {selectedTenant.maxUsers} Users</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Ngày bắt đầu:</span>
                          <p className="font-mono text-white text-sm">{selectedTenant.startDate}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Ngày hết hạn:</span>
                          <p className="font-mono font-bold text-amber-400 text-sm">{selectedTenant.expiryDate}</p>
                        </div>
                      </div>
                    </div>

                    {/* Action Bar */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                      <button
                        onClick={() => handleOpenRenew(selectedTenant)}
                        className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs"
                      >
                        Gia hạn gói dịch vụ
                      </button>
                      <button
                        onClick={() => handleToggleTenantLock(selectedTenant)}
                        className={`px-4 py-2 rounded-xl text-white font-bold text-xs ${
                          selectedTenant.status === 'SUSPENDED' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'
                        }`}
                      >
                        {selectedTenant.status === 'SUSPENDED' ? 'Mở khóa Tenant' : 'Tạm ngưng / Khóa Tenant'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 3: APPROVALS HUB (REGISTRATIONS)
            ========================================================================= */}
        {activeTab === 'approvals' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">Xét Duyệt Đăng Ký Khách Hàng</h2>
                <p className="text-xs text-slate-400">
                  Phê duyệt hồ sơ đăng ký doanh nghiệp, tự động khởi tạo Tenant, Subscription và cấp License Key
                </p>
              </div>
            </div>

            {registrations.length === 0 ? (
              <div className="p-8 text-center bg-slate-800/40 rounded-2xl border border-slate-700/60">
                <p className="text-slate-400 text-sm">Chưa có hồ sơ đăng ký nào trong hệ thống.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {registrations.map((reg) => (
                  <div
                    key={reg.id}
                    className={`p-5 rounded-2xl border transition-all ${
                      reg.status === 'PENDING_APPROVAL'
                        ? 'bg-slate-800/80 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : reg.status === 'APPROVED'
                        ? 'bg-slate-800/40 border-slate-700/60'
                        : 'bg-slate-800/20 border-rose-900/40 opacity-70'
                    }`}
                  >
                    <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2.5">
                          <span className="font-mono text-xs text-blue-400 font-bold">{reg.registrationCode}</span>
                          <span className="text-sm font-bold text-white">{reg.companyName}</span>
                          <span
                            className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                              reg.status === 'PENDING_APPROVAL'
                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                : reg.status === 'APPROVED'
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            }`}
                          >
                            {reg.status === 'PENDING_APPROVAL'
                              ? 'Chờ duyệt'
                              : reg.status === 'APPROVED'
                              ? 'Đã duyệt & Kích hoạt'
                              : 'Đã từ chối'}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 flex flex-wrap items-center gap-x-4 gap-y-1 pt-1">
                          <span>MST: <strong className="text-slate-300">{reg.taxCode || '—'}</strong></span>
                          <span>Người đại diện: <strong className="text-slate-300">{reg.representative}</strong></span>
                          <span>ID Đăng nhập: <strong className="text-amber-400 font-mono">{reg.adminUsername || reg.adminPhone || (reg.adminEmail ? reg.adminEmail.split('@')[0] : 'admin')}</strong></span>
                          <span>Admin Email: <strong className="text-blue-400">{reg.adminEmail}</strong></span>
                          <span>SĐT: <strong className="text-slate-300">{reg.adminPhone || reg.phone}</strong></span>
                          <span>Gói chọn: <strong className="text-emerald-400">{reg.planName}</strong></span>
                        </div>
                        {reg.notes && (
                          <p className="text-[11px] text-slate-400 bg-slate-900/60 p-2 rounded-lg mt-2 border border-slate-700/40">
                            <strong>Ghi chú:</strong> {reg.notes}
                          </p>
                        )}
                        {reg.rejectionReason && (
                          <p className="text-[11px] text-rose-300 bg-rose-950/40 p-2 rounded-lg mt-2 border border-rose-800/40">
                            <strong>Lý do từ chối:</strong> {reg.rejectionReason}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 shrink-0">
                        {reg.status === 'PENDING_APPROVAL' ? (
                          <>
                            <button
                              disabled={isApprovingId === reg.id}
                              onClick={() => handleOpenReject(reg)}
                              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-900/40 text-rose-300 border border-slate-700 text-xs font-semibold transition-colors disabled:opacity-50"
                            >
                              Từ chối
                            </button>
                            <button
                              disabled={isApprovingId === reg.id}
                              onClick={() => handleApproveRegistration(reg)}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                            >
                              {isApprovingId === reg.id ? (
                                <>
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                  <span>Đang kích hoạt...</span>
                                </>
                              ) : (
                                <>
                                  <Check className="w-4 h-4" />
                                  <span>Phê Duyệt & Cấp License</span>
                                </>
                              )}
                            </button>
                          </>
                        ) : reg.status === 'APPROVED' ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] text-emerald-400 font-medium">
                              {reg.approvedAt ? `Duyệt: ${reg.approvedAt.slice(0, 10)}` : 'Đã duyệt'}
                            </span>
                            <button
                              disabled={isApprovingId === reg.id}
                              onClick={() => handleRepairAccount(reg.id)}
                              title="Đồng bộ lại tài khoản quản trị khách hàng vào hệ thống xác thực backend"
                              className="px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-blue-300 border border-slate-600 text-[11px] font-medium flex items-center gap-1 transition-all disabled:opacity-50"
                            >
                              <RefreshCw className={`w-3.5 h-3.5 ${isApprovingId === reg.id ? 'animate-spin' : ''}`} />
                              <span>Đồng bộ tài khoản</span>
                            </button>
                          </div>
                        ) : (
                          <span className="text-[11px] text-slate-500 italic">
                            {reg.approvedAt ? `Duyệt lúc: ${reg.approvedAt.slice(0, 16).replace('T', ' ')}` : 'Đã từ chối'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Rejection Modal */}
            {isRejectModalOpen && regToReject && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-6 space-y-4 animate-in zoom-in-95">
                  <h3 className="text-base font-bold text-white">Từ Chối Hồ Sơ Đăng Ký</h3>
                  <p className="text-xs text-slate-400">
                    Bạn đang từ chối hồ sơ của <strong className="text-white">{regToReject.companyName}</strong>. Vui lòng nhập lý do cụ thể:
                  </p>
                  <textarea
                    rows={3}
                    placeholder="VD: Thông tin mã số thuế không hợp lệ hoặc thông tin liên hệ không chính xác..."
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full p-3 text-xs rounded-xl bg-slate-800 border border-slate-700 text-white focus:outline-none focus:border-rose-500"
                  />
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setIsRejectModalOpen(false)}
                      className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
                    >
                      Hủy
                    </button>
                    <button
                      onClick={handleConfirmReject}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold"
                    >
                      Xác nhận từ chối
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* =========================================================================
            TAB 4: PLANS & LICENSES CATALOG
            ========================================================================= */}
        {activeTab === 'plans-licenses' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-white">Danh Mục Gói Dịch Vụ & License Keys</h2>
              <p className="text-xs text-slate-400">
                Toàn bộ các gói dịch vụ đều Full tính năng (Gói Dùng thử 1 User, các gói trả phí tối đa 3 User/Tenant)
              </p>
            </div>

            {/* Plans Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
              {plans.map((p) => (
                <div
                  key={p.id}
                  className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 shadow-lg flex flex-col justify-between relative overflow-hidden"
                >
                  {p.badge && (
                    <div className="absolute top-3 right-3 px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-slate-950 rounded-full">
                      {p.badge}
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-bold text-slate-400">{p.code}</span>
                    <h3 className="text-base font-extrabold text-white mt-1">{p.name}</h3>
                    <p className="text-2xl font-black text-blue-400 mt-2 font-mono">
                      {p.price.toLocaleString('vi-VN')} đ
                    </p>
                    <p className="text-xs text-slate-400 mt-1">Thời hạn: {p.durationDays} ngày</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-700/50 space-y-1.5 text-xs text-slate-300">
                    <div className="flex items-center gap-1.5 text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Full toàn bộ tính năng
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <Users className="w-3.5 h-3.5 text-slate-400" /> Tối đa {p.maxUsers || (p.code === 'TRIAL_7_DAYS' ? 1 : 3)} User
                    </div>
                    <div className="flex items-center gap-1.5 text-slate-300">
                      <ShieldCheck className="w-3.5 h-3.5 text-slate-400" /> Bản quyền riêng biệt
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Active Licenses Table */}
            <div className="space-y-3 pt-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-blue-400" />
                Danh Sách Bản Quyền License Đã Phát Hành
              </h3>

              <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden shadow-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-700/60">
                    <tr>
                      <th className="px-4 py-3">License Key</th>
                      <th className="px-4 py-3">Tenant Doanh Nghiệp</th>
                      <th className="px-4 py-3">Gói Áp Dụng</th>
                      <th className="px-4 py-3">Ngày Kích Hoạt</th>
                      <th className="px-4 py-3">Ngày Hết Hạn</th>
                      <th className="px-4 py-3">Giới Hạn</th>
                      <th className="px-4 py-3">Trạng Thái</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/40 text-slate-300">
                    {licenses.map((lic) => (
                      <tr key={lic.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3 font-mono font-bold text-blue-400">{lic.licenseKey}</td>
                        <td className="px-4 py-3 font-semibold text-white">{lic.tenantName}</td>
                        <td className="px-4 py-3 text-slate-300">{lic.planName}</td>
                        <td className="px-4 py-3 font-mono text-slate-400">{lic.activatedAt.slice(0, 10)}</td>
                        <td className="px-4 py-3 font-mono font-bold text-amber-400">{lic.expiresAt.slice(0, 10)}</td>
                        <td className="px-4 py-3 font-mono">{lic.maxUsers} Users</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            {lic.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB: RELEASES & TENANT VERSION UPDATE CONTROL
            ========================================================================= */}
        {activeTab === 'releases' && (
          <div className="animate-in fade-in duration-200">
            <ReleaseManagementView
              currentUser={currentUser || undefined}
              onRefreshAll={refreshAllData}
              showToast={showToast}
            />
          </div>
        )}

        {/* =========================================================================
            TAB: PAYMENT GATEWAY HUB & RECONCILIATION
            ========================================================================= */}
        {activeTab === 'payment-hub' && (
          <div className="animate-in fade-in duration-200">
            <PaymentHubView />
          </div>
        )}

        {/* =========================================================================
            TAB 5: BILLING & TRANSACTIONS
            ========================================================================= */}
        {activeTab === 'billing' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-white">Quản Lý Giao Dịch & Thanh Toán</h2>
              <p className="text-xs text-slate-400">
                Theo dõi các khoản thanh toán kích hoạt, gia hạn gói dịch vụ qua VietQR / Chuyển khoản
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-700/60">
                  <tr>
                    <th className="px-4 py-3">Mã Giao Dịch</th>
                    <th className="px-4 py-3">Doanh Nghiệp / Tenant</th>
                    <th className="px-4 py-3">Gói Dịch Vụ</th>
                    <th className="px-4 py-3">Số Tiền</th>
                    <th className="px-4 py-3">Phương Thức</th>
                    <th className="px-4 py-3">Ngày Thanh Toán</th>
                    <th className="px-4 py-3">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40 text-slate-300">
                  {billing.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-mono font-bold text-blue-400">{b.transactionCode}</td>
                      <td className="px-4 py-3 font-semibold text-white">{b.tenantName}</td>
                      <td className="px-4 py-3">{b.planName}</td>
                      <td className="px-4 py-3 font-mono font-extrabold text-emerald-400">
                        {b.amount.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-4 py-3 uppercase text-slate-400 font-mono text-[11px]">
                        {b.paymentMethod}
                      </td>
                      <td className="px-4 py-3 font-mono">{b.paymentDate}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 6: CONTRACTS
            ========================================================================= */}
        {activeTab === 'contracts' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-white">Quản Lý Hợp Đồng Dịch Vụ</h2>
              <p className="text-xs text-slate-400">
                Lưu trữ hợp đồng khung cung cấp dịch vụ SaaS BizOne ERP với các đối tác
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-700/60">
                  <tr>
                    <th className="px-4 py-3">Số Hợp Đồng</th>
                    <th className="px-4 py-3">Khách Hàng / Đối Tác</th>
                    <th className="px-4 py-3">Gói Dịch Vụ</th>
                    <th className="px-4 py-3">Giá Trị</th>
                    <th className="px-4 py-3">Hiệu Lực</th>
                    <th className="px-4 py-3">Phụ Trách (PIC)</th>
                    <th className="px-4 py-3">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40 text-slate-300">
                  {contracts.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-mono font-bold text-blue-400">{c.contractNumber}</td>
                      <td className="px-4 py-3 font-semibold text-white">{c.customerName}</td>
                      <td className="px-4 py-3">{c.planName}</td>
                      <td className="px-4 py-3 font-mono font-bold text-emerald-400">
                        {c.value.toLocaleString('vi-VN')} đ
                      </td>
                      <td className="px-4 py-3 font-mono text-slate-400">
                        {c.startDate} → {c.endDate}
                      </td>
                      <td className="px-4 py-3 text-slate-300">{c.salesPic}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {c.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 7: SUPPORT TICKETS
            ========================================================================= */}
        {activeTab === 'support' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-white">Trung Tâm Hỗ Trợ & Yêu Cầu Kỹ Thuật (SLA)</h2>
              <p className="text-xs text-slate-400">
                Tiếp nhận và xử lý yêu cầu cấu hình, chuyển giao hoặc hỗ trợ nghiệp vụ cho các Tenant
              </p>
            </div>

            <div className="space-y-3">
              {tickets.map((tkt) => (
                <div key={tkt.id} className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-xs text-blue-400">{tkt.ticketCode}</span>
                      <span className="font-bold text-white text-sm">{tkt.title}</span>
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-slate-700 text-slate-300">
                        {tkt.category}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{tkt.description}</p>
                    <div className="text-[11px] text-slate-400 flex items-center gap-4 pt-1">
                      <span>Khách hàng: <strong className="text-slate-300">{tkt.customerName}</strong></span>
                      <span>PIC: <strong className="text-blue-400">{tkt.pic}</strong></span>
                      <span>SLA: <strong className="text-amber-400">{tkt.slaHours} giờ</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <select
                      value={tkt.status}
                      onChange={(e) => handleTicketStatusChange(tkt.id, e.target.value as any)}
                      className="px-3 py-1.5 text-xs rounded-xl bg-slate-900 border border-slate-700 text-white focus:outline-none focus:border-blue-500 font-semibold"
                    >
                      <option value="NEW">Mới tiếp nhận</option>
                      <option value="PROCESSING">Đang xử lý</option>
                      <option value="WAITING_CUSTOMER">Chờ khách hàng</option>
                      <option value="RESOLVED">Đã giải quyết</option>
                      <option value="CLOSED">Đã đóng</option>
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 8: PRODUCT PACKAGING (WEB / PWA / MOBILE)
            ========================================================================= */}
        {activeTab === 'packaging' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-white">Đóng Gói & Phân Phối Sản Phẩm (Web / PWA / Mobile)</h2>
              <p className="text-xs text-slate-400">
                Thông tin triển khai PWA, bản quyền thương mại và đóng gói ứng dụng di động cho khách hàng
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Web Platform */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                    <Globe className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Web Platform</h3>
                    <p className="text-xs text-slate-400">Đơn vị chủ quản: wiup.vn</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-700/50">
                  <p><span className="text-slate-400">Domain chính thức:</span> <strong className="text-blue-400">https://wiup.vn</strong></p>
                  <p><span className="text-slate-400">Kiến trúc:</span> Single Multi-tenant Codebase</p>
                  <p><span className="text-slate-400">Bảo mật:</span> JWT Token + Bcrypt + RBAC Isolation</p>
                  <p><span className="text-slate-400">Tình trạng:</span> <span className="text-emerald-400 font-bold">Hoạt động ổn định</span></p>
                </div>
              </div>

              {/* Progressive Web App (PWA) */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Progressive Web App</h3>
                    <p className="text-xs text-slate-400">Cài đặt trực tiếp từ trình duyệt</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-700/50">
                  <p><span className="text-slate-400">Manifest:</span> <span className="font-mono text-emerald-400">/manifest.webmanifest</span></p>
                  <p><span className="text-slate-400">Service Worker:</span> <span className="font-mono text-emerald-400">/sw.js (Active)</span></p>
                  <p><span className="text-slate-400">Caching:</span> Static Assets & App Shell only</p>
                  <p><span className="text-slate-400">Hỗ trợ:</span> iOS Safari, Android Chrome, Desktop</p>
                </div>
              </div>

              {/* Mobile App (Capacitor Package) */}
              <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Mobile Package</h3>
                    <p className="text-xs text-slate-400">Đóng gói iOS / Android</p>
                  </div>
                </div>
                <div className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-700/50">
                  <p><span className="text-slate-400">Package ID:</span> <span className="font-mono text-amber-400">vn.wiup.bizone</span></p>
                  <p><span className="text-slate-400">App Name:</span> BizOne ERP</p>
                  <p><span className="text-slate-400">Build Version:</span> 1.0.0 (Release 2026)</p>
                  <p><span className="text-slate-400">Chính sách:</span> Không phân phối source code</p>
                </div>
              </div>
            </div>

            {/* Versioning & Release Notes */}
            <div className="p-5 rounded-2xl bg-slate-800/60 border border-slate-700/60 space-y-3">
              <h3 className="text-sm font-bold text-white">Lịch Sử Phiên Bản & Bản Phát Hành (Release Notes)</h3>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-700/50 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">BizOne ERP Commercial SaaS v1.0.0</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono font-bold">
                    Official Production
                  </span>
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  <li>Chuyển đổi hoàn thiện nền tảng SaaS thương mại: Tách bạch Platform Super Admin và Tenant Admin.</li>
                  <li>Tất cả các gói dịch vụ (1 tháng, 3 tháng, 6 tháng, 1 năm, 2 năm) đều Full tính năng, tối đa 3 User/Tenant.</li>
                  <li>Quy trình đăng ký và duyệt khách hàng tập trung với cơ chế bảo mật cấp phép License Key tự động.</li>
                  <li>Đóng gói PWA Manifest chuẩn hóa, hỗ trợ cài đặt trên thiết bị di động & máy tính để bàn.</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            TAB 10: SECURITY & 2FA MANAGEMENT (SUPER ADMIN)
            ========================================================================= */}
        {activeTab === 'security' && (
          <SecurityAdminView
            currentUser={currentUser}
            tenants={tenants}
            onShowToast={showToast}
          />
        )}

        {/* =========================================================================
            TAB 11: AUDIT LOGS
            ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div>
              <h2 className="text-lg font-bold text-white">Nhật Ký Thao Tác Platform (SaaS Audit Trail)</h2>
              <p className="text-xs text-slate-400">
                Ghi nhận chi tiết mọi hành vi kích hoạt, duyệt đăng ký, gia hạn, khóa/mở khóa Tenant và cấp License
              </p>
            </div>

            <div className="rounded-2xl bg-slate-800/60 border border-slate-700/60 overflow-hidden shadow-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-700/60">
                  <tr>
                    <th className="px-4 py-3">Thời Gian</th>
                    <th className="px-4 py-3">Người Thực Hiện</th>
                    <th className="px-4 py-3">Hành Động</th>
                    <th className="px-4 py-3">Đối Tượng (Tenant)</th>
                    <th className="px-4 py-3">Chi Tiết Hành Động</th>
                    <th className="px-4 py-3">Địa Chỉ IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40 text-slate-300">
                  {auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-700/30">
                      <td className="px-4 py-3 font-mono text-slate-400 whitespace-nowrap">{log.timestamp}</td>
                      <td className="px-4 py-3">
                        <span className="font-bold text-white">{log.actorName}</span>
                        <div className="text-[10px] text-slate-400">{log.actorRole}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-200">{log.targetTenantName || '—'}</td>
                      <td className="px-4 py-3 text-slate-300">{log.details}</td>
                      <td className="px-4 py-3 font-mono text-slate-400">{log.ipAddress}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Renewal Modal */}
      {isRenewModalOpen && tenantToRenew && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 rounded-2xl shadow-2xl border border-slate-800 p-6 space-y-4 animate-in zoom-in-95">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-blue-400" />
              Gia Hạn Gói Dịch Vụ
            </h3>
            <p className="text-xs text-slate-400">
              Gia hạn cho doanh nghiệp: <strong className="text-white">{tenantToRenew.name}</strong>
            </p>

            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-300">Chọn Gói Dịch Vụ Gia Hạn:</label>
              <div className="space-y-2">
                {plans.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setRenewPlanCode(p.code)}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                      renewPlanCode === p.code
                        ? 'border-blue-500 bg-blue-500/10 text-white ring-1 ring-blue-500'
                        : 'border-slate-700 bg-slate-800/40 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div>
                      <span className="font-bold text-xs">{p.name}</span>
                      <p className="text-[11px] text-slate-400">{p.durationDays} ngày • Full tính năng • Max 3 Users</p>
                    </div>
                    <span className="font-mono font-bold text-blue-400 text-xs">
                      {p.price.toLocaleString('vi-VN')} đ
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setIsRenewModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-semibold"
              >
                Hủy
              </button>
              <button
                onClick={handleConfirmRenew}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md shadow-blue-600/20"
              >
                Xác nhận Gia Hạn
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
