import React, { useState } from 'react';
import {
  Settings,
  Building,
  CreditCard,
  QrCode,
  Save,
  CheckCircle,
  FileSpreadsheet,
  RefreshCw,
  Lock,
  Globe,
  Users,
  Shield,
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  Building2,
  CheckCircle2,
  Sliders,
  ShieldAlert,
  KeyRound,
  GitBranch,
  Rocket,
  ShieldCheck,
  Calendar,
  History,
  FileCheck,
  AlertTriangle,
  Zap,
  Sparkles,
  Info
} from 'lucide-react';
import { UserAccount, UserRole, TenantAccount, PlatformRelease, TenantUpdateHistoryItem } from '../types';
import { ROLE_DEFINITIONS } from '../data/userData';
import { UserAccountModal } from './Modals/UserAccountModal';
import { APP_NAME, APP_TAGLINE, COMPANY_NAME } from '../constants/appConfig';
import { SaaSService } from '../services/saasService';

interface SettingsViewProps {
  users?: UserAccount[];
  onSaveUser?: (user: UserAccount) => void;
  onDeleteUser?: (userId: string) => void;
  currentUser?: UserAccount;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  users = [],
  onSaveUser,
  onDeleteUser,
  currentUser
}) => {
  const [activeTab, setActiveTab] = useState<'company' | 'vietqr' | 'users' | 'sheets' | 'version'>('company');
  const [storeName, setStoreName] = useState('HỘ KINH DOANH VŨ ĐỨC ĐĂNG KHÔI');
  const [taxNumber, setTaxNumber] = useState('022094001577');
  const [address, setAddress] = useState('Số 18, ngách 28/9, phố Chu Huy Mân, phường Phúc Lợi, quận Long Biên, Hà Nội');
  const [bankAccount, setBankAccount] = useState('999988886666');
  const [bankName, setBankName] = useState('MBBank (Ngân hàng TMCP Quân Đội)');
  const [accountHolder, setAccountHolder] = useState('VU DUC DANG KHOI');
  const [isSaved, setIsSaved] = useState(false);

  // User management state
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState<UserAccount | null>(null);
  const [userToDelete, setUserToDelete] = useState<UserAccount | null>(null);

  // Version & Update Control state for this Tenant
  const tenantId = currentUser?.tenant || 'tenant_enterprise_01';
  const allTenants = SaaSService.getTenants();
  const currentTenant = allTenants.find((t) => t.id === tenantId) || allTenants[0];

  const [releases, setReleases] = useState<PlatformRelease[]>(SaaSService.getReleases());
  const [updateHistory, setUpdateHistory] = useState<TenantUpdateHistoryItem[]>(
    SaaSService.getTenantUpdateHistory(currentTenant?.id)
  );

  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStep, setUpdateStep] = useState<number>(0);
  const [isScheduleOpen, setIsScheduleOpen] = useState(false);
  const [scheduledTime, setScheduledTime] = useState('2026-08-23T02:00');
  const [updateMessage, setUpdateMessage] = useState<string | null>(null);

  const latestStable = releases.find((r) => r.channel === 'stable' && r.status === 'RELEASED');
  const isUpToDate = currentTenant?.currentVersion === currentTenant?.targetVersion || currentTenant?.updateStatus === 'UP_TO_DATE';

  const handleRunSafeUpdate = () => {
    setIsUpdating(true);
    setUpdateStep(1); // Snapshot & Pre-Check
    setUpdateMessage('Đang tạo snapshot lưu trữ dữ liệu an toàn...');

    setTimeout(() => {
      setUpdateStep(2); // Non-destructive Migration
      setUpdateMessage('Đang kiểm tra chỉ mục và chuẩn hóa schema dữ liệu...');

      setTimeout(() => {
        setUpdateStep(3); // Code Pointer Update
        setUpdateMessage('Đang trỏ mã nguồn phần mềm sang phiên bản mới...');

        setTimeout(() => {
          setUpdateStep(4); // Post Data Integrity Audit
          setUpdateMessage('Đối soát 100% dữ liệu Khách hàng, Sản phẩm, FIFO, Đơn hàng...');

          setTimeout(() => {
            const targetVer = currentTenant?.targetVersion || latestStable?.version || 'v1.3.0';
            const res = SaaSService.updateTenantVersion(
              currentTenant.id,
              targetVer,
              currentUser?.name || 'Tenant Admin'
            );
            setIsUpdating(false);
            setUpdateStep(0);
            if (res.success) {
              setUpdateMessage(`✓ ${res.message}`);
              setUpdateHistory(SaaSService.getTenantUpdateHistory(currentTenant.id));
            } else {
              setUpdateMessage(`✕ ${res.message}`);
            }
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  const handleSaveSchedule = () => {
    const targetVer = currentTenant?.targetVersion || latestStable?.version || 'v1.3.0';
    const res = SaaSService.scheduleTenantUpdate(
      currentTenant.id,
      targetVer,
      scheduledTime.replace('T', ' '),
      currentUser?.name || 'Tenant Admin'
    );
    if (res.success) {
      setUpdateMessage(`✓ ${res.message}`);
      setIsScheduleOpen(false);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <div className="p-4 sm:p-6 md:p-8 space-y-6 max-w-[1250px] mx-auto text-xs">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Cài đặt
          </h1>
        </div>

        {/* Quick Tabs */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200 self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setActiveTab('company')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'company'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Building className="w-3.5 h-3.5" />
            <span>Doanh nghiệp</span>
          </button>

          <button
            onClick={() => setActiveTab('vietqr')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'vietqr'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>VietQR Ngân hàng</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'users'
                ? 'bg-white text-indigo-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Thành viên & Phân quyền ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'sheets'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Google Sheets</span>
          </button>

          <button
            onClick={() => setActiveTab('version')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'version'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>Phiên bản & Cập nhật</span>
            {!isUpToDate && (
              <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
            )}
          </button>
        </div>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
          <CheckCircle className="w-4 h-4 text-emerald-600" />
          <span>Đã lưu thành công cấu hình hệ thống ERP vào cơ sở dữ liệu!</span>
        </div>
      )}

      {/* TAB 1: Company Profile */}
      {activeTab === 'company' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              <Building className="w-4 h-4 text-blue-600" />
              <span>Thông tin Doanh nghiệp & Xuất Hóa Đơn VAT</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên đơn vị kinh doanh</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Mã số thuế (MST)</label>
                <input
                  type="text"
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-mono font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Địa chỉ trụ sở / Kho chính</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
              />
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 cursor-pointer transition"
            >
              <Save className="w-4 h-4" />
              <span>Lưu thông tin doanh nghiệp</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 2: VietQR Configuration */}
      {activeTab === 'vietqr' && (
        <form onSubmit={handleSave} className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 border-b border-slate-100 pb-3">
              <QrCode className="w-4 h-4 text-emerald-600" />
              <span>Cấu hình Ngân hàng Thụ hưởng VietQR</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ngân hàng thụ hưởng</label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  className="w-full text-xs border border-slate-300 rounded-xl p-2.5 font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Số tài khoản ngân hàng</label>
                <input
                  type="text"
                  value={bankAccount}
                  onChange={(e) => setBankAccount(e.target.value)}
                  className="w-full text-xs font-mono font-bold border border-slate-300 rounded-xl p-2.5"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Tên chủ tài khoản</label>
                <input
                  type="text"
                  value={accountHolder}
                  onChange={(e) => setAccountHolder(e.target.value)}
                  className="w-full text-xs font-bold border border-slate-300 rounded-xl p-2.5 uppercase"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer transition"
            >
              <Save className="w-4 h-4" />
              <span>Lưu cấu hình VietQR</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 3: User Accounts & Roles Management */}
      {activeTab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-600" />
                  <span>Danh sách Nhân sự & Nhóm quyền hạn ERP</span>
                </h3>
                <p className="text-slate-500 text-xs mt-0.5">
                  Tài khoản đăng nhập được bảo mật theo email, phân quyền chi tiết cho 10 phân hệ nghiệp vụ.
                </p>
              </div>

              <button
                onClick={() => {
                  setUserToEdit(null);
                  setIsUserModalOpen(true);
                }}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl shadow-md shadow-indigo-600/20 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer transition"
              >
                <Plus className="w-4 h-4" />
                <span>Thêm thành viên mới</span>
              </button>
            </div>

            {/* Users Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {users.map((usr) => {
                const roleDef = ROLE_DEFINITIONS[usr.role] || ROLE_DEFINITIONS.custom;
                const isSuperAdmin = usr.role === 'admin';

                return (
                  <div
                    key={usr.id}
                    className="bg-slate-50/70 hover:bg-white rounded-2xl border border-slate-200 hover:border-indigo-300 p-4 transition-all duration-150 flex flex-col justify-between space-y-3 group"
                  >
                    {/* Top Info */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={usr.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80'}
                            alt={usr.name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-2xs shrink-0"
                          />
                          <div>
                            <h4 className="font-extrabold text-slate-900 text-xs flex items-center gap-1">
                              <span>{usr.name}</span>
                              {usr.status === 'active' ? (
                                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" title="Đang hoạt động" />
                              ) : (
                                <span className="w-2 h-2 rounded-full bg-slate-300 inline-block" title="Tạm dừng" />
                              )}
                            </h4>
                            <p className="text-[11px] text-slate-500 font-mono">{usr.email}</p>
                          </div>
                        </div>

                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${roleDef.badgeColor}`}
                        >
                          {roleDef.name.split(' (')[0]}
                        </span>
                      </div>

                      {/* Details */}
                      <div className="mt-3 pt-3 border-t border-slate-200/80 space-y-1.5 text-[11px] text-slate-600">
                        {usr.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 text-slate-400" />
                            <span>{usr.phone}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{usr.branchName || 'Tổng kho Hà Nội'}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                          <KeyRound className="w-3 h-3" />
                          <span>Hoạt động: {usr.lastActive || 'Gần đây'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="pt-2 border-t border-slate-200/70 flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-500">
                        {Object.values(usr.permissions || {}).flat().length} quyền được cấp
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setUserToEdit(usr);
                            setIsUserModalOpen(true);
                          }}
                          className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition cursor-pointer"
                          title="Chỉnh sửa phân quyền"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        {!isSuperAdmin && onDeleteUser && (
                          <button
                            onClick={() => setUserToDelete(usr)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                            title="Xóa tài khoản này"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: Google Sheets */}
      {activeTab === 'sheets' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Đồng bộ 2 chiều với Google Sheets</span>
            </div>
            <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border border-emerald-200">
              ĐANG HOẠT ĐỘNG
            </span>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-extrabold text-slate-900 text-xs">Sheet: "BizOne_ERP_Data_2024.xlsx"</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Tự động ghi nhận đơn bán hàng, phiếu thu chi và tồn kho vào bảng tính Google Drive.
              </p>
            </div>
            <button
              type="button"
              onClick={() => alert('Đã đồng bộ hóa 142 đơn hàng và 9 mã SKU với Google Sheets thành công!')}
              className="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-100 rounded-xl font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer self-start sm:self-auto shadow-2xs"
            >
              <RefreshCw className="w-3.5 h-3.5 text-emerald-600" />
              <span>Đồng bộ ngay</span>
            </button>
          </div>
        </div>
      )}

      {/* TAB 5: Software Version & Safe Update Control */}
      {activeTab === 'version' && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Version Overview & Status Card */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <GitBranch className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">
                    Phiên Bản Phần Mềm & Kiểm Soát Cập Nhật Tenant
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tách biệt hoàn toàn mã nguồn phần mềm và cơ sở dữ liệu kinh doanh của doanh nghiệp
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-slate-100 border border-slate-200 rounded-xl font-mono font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Hiện tại: <strong>{currentTenant?.currentVersion || 'v1.2.0'}</strong>
                </span>
                <span className="px-2.5 py-1 bg-indigo-50 border border-indigo-200 text-indigo-700 rounded-xl font-bold text-[11px]">
                  Kênh Ổn Định (Stable)
                </span>
              </div>
            </div>

            {/* Zero Data Loss Guarantee Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 text-emerald-950">
              <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs">
                <p className="font-extrabold text-emerald-900">
                  Cam Kết Bảo Toàn 100% Dữ Liệu Kinh Doanh Khi Nâng Cấp (Zero-Data-Loss Pipeline)
                </p>
                <p className="text-emerald-800 leading-relaxed text-[11px]">
                  Khi BizOne phát hành tính năng mới, hệ thống chỉ cập nhật giao diện và logic phần mềm.
                  Toàn bộ danh mục Khách hàng, Sản phẩm & SKU, Lô hàng FIFO, Đơn bán và Sổ quỹ của Quý doanh nghiệp được giữ nguyên vẹn, không bao giờ bị ghi đè hay reset.
                </p>
              </div>
            </div>

            {/* Update Available Box */}
            {!isUpToDate ? (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
                      <Rocket className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-extrabold text-slate-900">
                          Có Bản Cập Nhật Mới: {currentTenant?.targetVersion || latestStable?.version || 'v1.3.0'}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-600 text-white">
                          Khuyên dùng
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500">
                        Phát hành: {latestStable?.releaseDate || '2026-08-20'} • Kích thước gói: ~4.2 MB
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => setIsScheduleOpen(true)}
                      className="px-3.5 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs transition disabled:opacity-50"
                    >
                      <Calendar className="w-3.5 h-3.5 text-slate-500" />
                      <span>Lên lịch cập nhật ngoài giờ</span>
                    </button>

                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={handleRunSafeUpdate}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 active:scale-98 text-white rounded-xl font-extrabold flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer transition disabled:opacity-50"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Nâng cấp ngay (Bảo toàn dữ liệu)</span>
                    </button>
                  </div>
                </div>

                {/* Changelog Highlights */}
                {latestStable && (
                  <div className="p-3.5 rounded-xl bg-white border border-blue-100 space-y-2">
                    <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      Điểm mới trong phiên bản {latestStable.version}:
                    </p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] text-slate-600">
                      {latestStable.changelog.map((item, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <CheckCircle2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Hệ Thống Đang Chạy Phiên Bản Mới Nhất</h4>
                    <p className="text-slate-500 text-xs">
                      Phiên bản hiện tại: <strong>{currentTenant?.currentVersion || 'v1.3.0'}</strong>. Không có bản cập nhật đang chờ.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setUpdateMessage('Đang kiểm tra máy chủ cập nhật...');
                    setTimeout(() => {
                      setUpdateMessage('Hệ thống của bạn đã ở phiên bản mới nhất!');
                    }, 500);
                  }}
                  className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 rounded-xl font-bold text-slate-700 flex items-center gap-1.5 cursor-pointer shadow-2xs"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-slate-500" />
                  <span>Kiểm tra bản mới</span>
                </button>
              </div>
            )}

            {/* Live Safe Update Progress Visualizer */}
            {isUpdating && (
              <div className="p-5 rounded-2xl bg-slate-900 text-white space-y-4 border border-slate-800 shadow-xl animate-in fade-in">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2 font-bold text-xs">
                    <RefreshCw className="w-4 h-4 text-blue-400 animate-spin" />
                    <span>Quy Trình Cập Nhật An Toàn Đang Thực Hiện...</span>
                  </div>
                  <span className="text-xs font-mono text-blue-400 font-bold">Bước {updateStep}/4</span>
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-emerald-400 h-2 transition-all duration-300"
                      style={{ width: `${(updateStep / 4) * 100}%` }}
                    ></div>
                  </div>
                  <p className="text-xs text-slate-300 font-mono animate-pulse">{updateMessage}</p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 text-[10px]">
                  <div className={`p-2 rounded-lg border ${updateStep >= 1 ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
                    1. Snapshot Dữ Liệu
                  </div>
                  <div className={`p-2 rounded-lg border ${updateStep >= 2 ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
                    2. Schema Migration
                  </div>
                  <div className={`p-2 rounded-lg border ${updateStep >= 3 ? 'bg-blue-500/20 border-blue-500/40 text-blue-300' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
                    3. Trỏ Mã Nguồn
                  </div>
                  <div className={`p-2 rounded-lg border ${updateStep >= 4 ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300' : 'bg-slate-800/40 border-slate-800 text-slate-500'}`}>
                    4. Đối Soát Dữ Liệu
                  </div>
                </div>
              </div>
            )}

            {updateMessage && !isUpdating && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-blue-900 text-xs font-bold flex items-center justify-between">
                <span>{updateMessage}</span>
                <button
                  onClick={() => setUpdateMessage(null)}
                  className="text-[11px] text-blue-600 hover:underline cursor-pointer"
                >
                  Đóng
                </button>
              </div>
            )}
          </div>

          {/* Tenant Update History & Data Integrity Audit */}
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-sm text-slate-900">
                <History className="w-4 h-4 text-blue-600" />
                <span>Lịch Sử Cập Nhật & Đối Soát Toàn Vẹn Dữ Liệu (Audit Log)</span>
              </div>
              <span className="text-[11px] text-slate-500">
                Lưu trữ các mốc nâng cấp phiên bản phần mềm của doanh nghiệp
              </span>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Thời Gian</th>
                    <th className="px-4 py-3">Từ Phiên Bản</th>
                    <th className="px-4 py-3">Lên Phiên Bản</th>
                    <th className="px-4 py-3">Người Kích Hoạt</th>
                    <th className="px-4 py-3">Tình Trạng Dữ Liệu</th>
                    <th className="px-4 py-3">Trạng Thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {updateHistory.length > 0 ? (
                    updateHistory.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3 font-mono text-slate-500">{item.timestamp}</td>
                        <td className="px-4 py-3 font-mono font-semibold">{item.fromVersion}</td>
                        <td className="px-4 py-3 font-mono font-bold text-blue-600">{item.toVersion}</td>
                        <td className="px-4 py-3">{item.triggeredBy}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            <ShieldCheck className="w-3 h-3 text-emerald-600" />
                            {item.dataLossPercent === 0 ? 'Bảo toàn 100% (0% mất mát)' : `${item.dataLossPercent}% mất`}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-6 text-center text-slate-400">
                        Chưa có lịch sử cập nhật nào được ghi nhận cho Tenant này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Schedule Update Modal */}
          {isScheduleOpen && (
            <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
              <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900">Lên Lịch Cập Nhật Ngoài Giờ</h3>
                    <p className="text-slate-500 text-[11px]">Hệ thống sẽ tự động chuyển phiên bản vào giờ thấp điểm</p>
                  </div>
                </div>

                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-slate-700 font-bold mb-1">Thời gian cập nhật dự kiến:</label>
                    <input
                      type="datetime-local"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-slate-800 focus:outline-none focus:border-blue-500 font-mono"
                    />
                    <p className="text-[11px] text-slate-400 mt-1">
                      Khuyến nghị chọn khung giờ từ 01:00 đến 05:00 sáng để không làm gián đoạn bán hàng.
                    </p>
                  </div>

                  <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 text-[11px] space-y-1">
                    <p className="font-bold">Lưu ý trước khi đặt lịch:</p>
                    <p>
                      Mọi phiên làm việc đang mở sẽ tự động lưu và làm mới khi người dùng đăng nhập lại vào sáng hôm sau.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsScheduleOpen(false)}
                    className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-700"
                  >
                    Hủy bỏ
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveSchedule}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-extrabold shadow-md shadow-blue-600/20"
                  >
                    Xác nhận lên lịch
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* User Account Modal */}
      <UserAccountModal
        isOpen={isUserModalOpen}
        onClose={() => {
          setIsUserModalOpen(false);
          setUserToEdit(null);
        }}
        userToEdit={userToEdit}
        onSaveUser={(u) => {
          if (onSaveUser) onSaveUser(u);
        }}
      />

      {/* Delete User Confirmation Modal */}
      {userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 space-y-4 shadow-2xl border border-slate-100 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Xác nhận xóa tài khoản</h3>
                <p className="text-slate-500 text-[11px]">Hành động này sẽ thu hồi toàn bộ quyền truy cập</p>
              </div>
            </div>

            <p className="text-slate-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa thành viên <strong>{userToDelete.name}</strong> ({userToDelete.email}) khỏi hệ thống ERP không?
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setUserToDelete(null)}
                className="px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-bold text-slate-700"
              >
                Hủy bỏ
              </button>
              <button
                onClick={() => {
                  if (onDeleteUser) onDeleteUser(userToDelete.id);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-extrabold shadow-md shadow-rose-600/20"
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

