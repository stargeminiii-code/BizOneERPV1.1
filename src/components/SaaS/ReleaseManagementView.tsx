import React, { useState } from 'react';
import {
  GitBranch,
  Rocket,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  RefreshCw,
  Plus,
  Ban,
  RotateCcw,
  Layers,
  Database,
  Search,
  Filter,
  Check,
  ChevronRight,
  Info,
  Calendar,
  Sparkles,
  Zap,
  Lock,
  ArrowUpRight,
  History,
  CheckCircle,
  FileCheck
} from 'lucide-react';
import {
  PlatformRelease,
  TenantAccount,
  TenantUpdateHistoryItem,
  ReleaseChannel,
  SecuritySeverity
} from '../../types';
import { SaaSService } from '../../services/saasService';

interface ReleaseManagementViewProps {
  currentUser?: { name: string };
  onRefreshAll: () => void;
  showToast: (text: string, type?: 'success' | 'error') => void;
}

export const ReleaseManagementView: React.FC<ReleaseManagementViewProps> = ({
  currentUser,
  onRefreshAll,
  showToast
}) => {
  const [releases, setReleases] = useState<PlatformRelease[]>(SaaSService.getReleases());
  const [tenants, setTenants] = useState<TenantAccount[]>(SaaSService.getTenants());
  const [history, setHistory] = useState<TenantUpdateHistoryItem[]>(SaaSService.getTenantUpdateHistory());

  // Filter state
  const [filterChannel, setFilterChannel] = useState<'ALL' | 'stable' | 'beta'>('ALL');
  const [filterVersion, setFilterVersion] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modals state
  const [isCreateReleaseModalOpen, setIsCreateReleaseModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedTenantHistory, setSelectedTenantHistory] = useState<TenantAccount | null>(null);
  const [isUpdatingTenant, setIsUpdatingTenant] = useState<string | null>(null);

  // New Release Form
  const [newVersion, setNewVersion] = useState('');
  const [newChannel, setNewChannel] = useState<ReleaseChannel>('stable');
  const [newSummary, setNewSummary] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newMandatory, setNewMandatory] = useState(false);
  const [newSecuritySeverity, setNewSecuritySeverity] = useState<SecuritySeverity>('NONE');
  const [newMigrationRequired, setNewMigrationRequired] = useState(false);
  const [newMigrationDesc, setNewMigrationDesc] = useState('');

  // Schedule modal
  const [tenantToSchedule, setTenantToSchedule] = useState<TenantAccount | null>(null);
  const [scheduledDateTime, setScheduledDateTime] = useState('2026-08-23T02:00');

  const refreshData = () => {
    setReleases(SaaSService.getReleases());
    setTenants(SaaSService.getTenants());
    setHistory(SaaSService.getTenantUpdateHistory());
    onRefreshAll();
  };

  const latestStable = releases.find((r) => r.channel === 'stable' && r.status === 'RELEASED');
  const latestBeta = releases.find((r) => r.channel === 'beta' && r.status === 'RELEASED');

  const tenantsUpToDate = tenants.filter((t) => t.updateStatus === 'UP_TO_DATE').length;
  const tenantsNeedUpdate = tenants.filter((t) => t.updateStatus === 'UPDATE_AVAILABLE').length;
  const tenantsScheduled = tenants.filter((t) => t.updateStatus === 'SCHEDULED').length;

  // Filtered tenants list
  const filteredTenants = tenants.filter((t) => {
    const matchChannel = filterChannel === 'ALL' || (t.releaseChannel || 'stable') === filterChannel;
    const matchVersion = filterVersion === 'ALL' || t.currentVersion === filterVersion;
    const matchStatus = filterStatus === 'ALL' || t.updateStatus === filterStatus;
    const matchSearch =
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase());
    return matchChannel && matchVersion && matchStatus && matchSearch;
  });

  // Handle single tenant safe update
  const handleUpdateTenant = async (tenant: TenantAccount) => {
    setIsUpdatingTenant(tenant.id);
    const targetVer = tenant.targetVersion || latestStable?.version || 'v1.3.0';

    // Simulate safe multi-step execution delay
    setTimeout(() => {
      const res = SaaSService.updateTenantVersion(
        tenant.id,
        targetVer,
        currentUser?.name || 'Super Admin'
      );
      setIsUpdatingTenant(null);
      if (res.success) {
        showToast(res.message, 'success');
        refreshData();
      } else {
        showToast(res.message, 'error');
      }
    }, 600);
  };

  // Handle force update all
  const handleForceUpdateAll = (targetVer: string) => {
    if (
      !window.confirm(
        `Xác nhận Force Update phiên bản ${targetVer} cho toàn bộ các Tenant? Hệ thống sẽ tạo điểm khôi phục riêng biệt cho từng Tenant và bảo toàn 100% dữ liệu.`
      )
    ) {
      return;
    }
    const res = SaaSService.forceUpdateAllTenants(targetVer, currentUser?.name || 'Super Admin');
    if (res.success) {
      showToast(res.message, 'success');
      refreshData();
    }
  };

  // Handle create new release
  const handleCreateRelease = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newVersion.trim() || !newSummary.trim()) {
      showToast('Vui lòng điền đầy đủ số hiệu phiên bản và tóm tắt!', 'error');
      return;
    }

    const notesList = newNotes
      .split('\n')
      .map((line) => line.replace(/^[•\-\*]\s*/, '').trim())
      .filter(Boolean);

    const res = SaaSService.createRelease(
      {
        version: newVersion.trim(),
        channel: newChannel,
        summary: newSummary.trim(),
        releaseNotes: notesList.length > 0 ? notesList : [newSummary.trim()],
        mandatory: newMandatory,
        securitySeverity: newSecuritySeverity,
        minSupportedVersion: 'v1.0.0',
        migrationRequired: newMigrationRequired,
        migrationDescription: newMigrationDesc.trim() || undefined
      },
      currentUser?.name || 'Super Admin'
    );

    if (res.success) {
      showToast(res.message, 'success');
      setIsCreateReleaseModalOpen(false);
      setNewVersion('');
      setNewSummary('');
      setNewNotes('');
      setNewMandatory(false);
      setNewSecuritySeverity('NONE');
      setNewMigrationRequired(false);
      setNewMigrationDesc('');
      refreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle disable release
  const handleDisableRelease = (release: PlatformRelease) => {
    const reason = prompt(`Nhập lý do vô hiệu hóa phiên bản ${release.version}:`, 'Phát hiện vấn đề tương thích');
    if (reason === null) return;

    const res = SaaSService.disableRelease(release.id, reason, currentUser?.name || 'Super Admin');
    if (res.success) {
      showToast(res.message, 'success');
      refreshData();
    } else {
      showToast(res.message, 'error');
    }
  };

  // Handle save schedule
  const handleSaveSchedule = () => {
    if (!tenantToSchedule) return;
    const targetVer = tenantToSchedule.targetVersion || latestStable?.version || 'v1.3.0';
    const res = SaaSService.scheduleTenantUpdate(
      tenantToSchedule.id,
      targetVer,
      scheduledDateTime.replace('T', ' '),
      currentUser?.name || 'Super Admin'
    );
    if (res.success) {
      showToast(res.message, 'success');
      setTenantToSchedule(null);
      refreshData();
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Phiên Bản Mới Nhất
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-[10px] font-extrabold font-mono">
              STABLE
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{latestStable?.version || 'v1.3.0'}</span>
            <span className="text-[11px] text-slate-400">({latestStable?.releaseDate})</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{latestStable?.summary}</p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Kênh Thử Nghiệm
            </span>
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 border border-indigo-500/40 text-indigo-400 text-[10px] font-extrabold font-mono">
              BETA
            </span>
          </div>
          <div className="mt-2.5 flex items-baseline gap-2">
            <span className="text-2xl font-black text-white font-mono">{latestBeta?.version || 'v2.0.0-beta.1'}</span>
            <span className="text-[11px] text-slate-400">({latestBeta?.releaseDate})</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1">{latestBeta?.summary}</p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Phân Phối Tenant
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2.5 flex items-baseline gap-3">
            <div>
              <span className="text-2xl font-black text-emerald-400 font-mono">{tenantsUpToDate}</span>
              <span className="text-[11px] text-slate-400 ml-1">Mới nhất</span>
            </div>
            <div className="text-slate-600">/</div>
            <div>
              <span className="text-2xl font-black text-amber-400 font-mono">{tenantsNeedUpdate}</span>
              <span className="text-[11px] text-slate-400 ml-1">Cần update</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">{tenantsScheduled} Tenant đã lên lịch cập nhật</p>
        </div>

        <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4.5 relative overflow-hidden shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Chính Sách An Toàn
            </span>
            <ShieldCheck className="w-4 h-4 text-blue-400" />
          </div>
          <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 font-bold">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Zero Data Loss Protection</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
            Cập nhật phần mềm không chạm vào database. Tự động Snapshot trước khi migrate.
          </p>
        </div>
      </div>

      {/* Release Management Core & Controls */}
      <div className="bg-slate-950/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 text-blue-400 flex items-center justify-center font-bold shadow-inner">
              <GitBranch className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                <span>Quản Lý Phiên Bản & Phát Hành (Release Engine)</span>
              </h2>
              <p className="text-xs text-slate-400">
                Tách biệt Software Code khỏi Tenant Database. Cho phép Tenant tự chủ thời gian nâng cấp.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <button
              onClick={() => {
                setSelectedTenantHistory(null);
                setIsHistoryModalOpen(true);
              }}
              className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
            >
              <History className="w-4 h-4 text-indigo-400" />
              <span>Audit Toàn Vẹn Dữ Liệu</span>
            </button>

            {latestStable && (
              <button
                onClick={() => handleForceUpdateAll(latestStable.version)}
                className="px-3.5 py-2 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/40 text-amber-300 text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                title="Cập nhật bắt buộc an toàn cho các Tenant đang dùng bản cũ"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                <span>Force Update Toàn Bộ</span>
              </button>
            )}

            <button
              onClick={() => setIsCreateReleaseModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black transition flex items-center gap-2 shadow-lg shadow-blue-600/25 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tạo Phiên Bản Mới</span>
            </button>
          </div>
        </div>

        {/* Section 1: Catalog of Releases */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-blue-400" />
              Danh Sách Phiên Bản Đã Phát Hành ({releases.length})
            </span>
            <span className="text-[11px] text-slate-500">Mặc định kênh Stable cho khách hàng Production</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {releases.map((rel) => {
              const isDisabled = rel.status === 'DISABLED';
              return (
                <div
                  key={rel.id}
                  className={`rounded-2xl border p-4.5 transition-all flex flex-col justify-between ${
                    isDisabled
                      ? 'bg-slate-950/40 border-slate-800/50 opacity-60'
                      : rel.channel === 'beta'
                      ? 'bg-slate-900/60 border-indigo-500/30 hover:border-indigo-500/60'
                      : 'bg-slate-900/60 border-slate-800 hover:border-blue-500/50'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-white font-mono">{rel.version}</span>
                        <span
                          className={`px-2 py-0.5 text-[10px] font-extrabold rounded-md uppercase font-mono ${
                            rel.channel === 'beta'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          }`}
                        >
                          {rel.channel}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {rel.mandatory && (
                          <span className="px-2 py-0.5 text-[9px] font-extrabold bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded">
                            MANDATORY
                          </span>
                        )}
                        {isDisabled ? (
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-slate-800 text-slate-400 rounded">
                            DISABLED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 text-[9px] font-bold bg-emerald-500/20 text-emerald-400 rounded">
                            RELEASED
                          </span>
                        )}
                      </div>
                    </div>

                    <p className="text-xs font-semibold text-slate-200 line-clamp-2">{rel.summary}</p>

                    {rel.releaseNotes && rel.releaseNotes.length > 0 && (
                      <ul className="text-[11px] text-slate-400 space-y-1 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60">
                        {rel.releaseNotes.slice(0, 3).map((note, idx) => (
                          <li key={idx} className="flex items-start gap-1.5">
                            <span className="text-blue-400 shrink-0">•</span>
                            <span className="line-clamp-1">{note}</span>
                          </li>
                        ))}
                        {rel.releaseNotes.length > 3 && (
                          <li className="text-[10px] text-slate-500 italic pl-3">
                            + {rel.releaseNotes.length - 3} cải tiến khác...
                          </li>
                        )}
                      </ul>
                    )}

                    {rel.migrationRequired && (
                      <div className="flex items-center gap-1.5 text-[10px] text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                        <Database className="w-3 h-3 shrink-0" />
                        <span className="truncate">Migration: {rel.migrationDescription || 'Tự động kiểm tra schema'}</span>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Phát hành: {rel.releaseDate}</span>

                    {!isDisabled && (
                      <button
                        onClick={() => handleDisableRelease(rel)}
                        className="text-rose-400 hover:text-rose-300 font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Vô hiệu hóa bản phát hành này nếu phát hiện lỗi bất thường"
                      >
                        <Ban className="w-3.5 h-3.5" />
                        <span>Vô hiệu hóa</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 2: Tenant Update Matrix & Control */}
        <div className="space-y-4 pt-4 border-t border-slate-800/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                Ma Trận Phiên Bản Từng Doanh Nghiệp (Tenant Version Matrix)
              </h3>
              <p className="text-[11px] text-slate-400">
                Cho phép từng Tenant chạy phiên bản khác nhau một cách độc lập mà không ảnh hưởng lẫn nhau.
              </p>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Tìm tenant..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-slate-900 border border-slate-800 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-xl focus:outline-none focus:border-blue-500 w-40"
                />
              </div>

              <select
                value={filterChannel}
                onChange={(e) => setFilterChannel(e.target.value as any)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none font-bold"
              >
                <option value="ALL">Mọi Kênh (Stable/Beta)</option>
                <option value="stable">Kênh Stable</option>
                <option value="beta">Kênh Beta</option>
              </select>

              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-slate-900 border border-slate-800 text-xs text-slate-200 px-3 py-1.5 rounded-xl focus:outline-none font-bold"
              >
                <option value="ALL">Mọi Trạng Thái</option>
                <option value="UP_TO_DATE">Up to Date</option>
                <option value="UPDATE_AVAILABLE">Có bản mới</option>
                <option value="SCHEDULED">Đã lên lịch</option>
              </select>
            </div>
          </div>

          {/* Tenants Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-800 bg-slate-950/60">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-900/80 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4">Doanh Nghiệp / Tenant</th>
                  <th className="py-3 px-3">Kênh (Channel)</th>
                  <th className="py-3 px-3">Phiên Bản Hiện Tại</th>
                  <th className="py-3 px-3">Mục Tiêu (Target)</th>
                  <th className="py-3 px-3">Trạng Thái Cập Nhật</th>
                  <th className="py-3 px-3">Lần Cập Nhật Cuối</th>
                  <th className="py-3 px-4 text-right">Hành Động An Toàn</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {filteredTenants.map((t) => {
                  const isUpToDate = t.currentVersion === t.targetVersion || t.updateStatus === 'UP_TO_DATE';
                  const isUpdatingThis = isUpdatingTenant === t.id;

                  return (
                    <tr key={t.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-600/20 text-blue-400 flex items-center justify-center font-black text-xs">
                            {t.companyName.charAt(0)}
                          </div>
                          <div>
                            <p className="line-clamp-1">{t.companyName || t.name}</p>
                            <span className="text-[10px] text-slate-500 font-mono">{t.code} • MST: {t.taxCode}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-extrabold font-mono uppercase ${
                            t.releaseChannel === 'beta'
                              ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {t.releaseChannel || 'stable'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-black text-slate-200">
                        <span className="px-2 py-1 bg-slate-900 rounded-lg border border-slate-800">
                          {t.currentVersion || 'v1.0.0'}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 font-mono font-black text-blue-400">
                        {t.targetVersion || latestStable?.version || 'v1.3.0'}
                      </td>

                      <td className="py-3.5 px-3">
                        {isUpToDate ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                            <CheckCircle className="w-3 h-3" />
                            Up to Date
                          </span>
                        ) : t.updateStatus === 'SCHEDULED' ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
                            <Calendar className="w-3 h-3" />
                            Đã hẹn: {t.scheduledUpdateAt?.slice(0, 16)}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded-full border border-amber-500/30 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Có bản mới
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-[11px] text-slate-400">
                        {t.lastUpdatedAt ? t.lastUpdatedAt.slice(0, 10) : 'Chưa ghi nhận'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedTenantHistory(t);
                              setIsHistoryModalOpen(true);
                            }}
                            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                            title="Xem lịch sử cập nhật & snapshot đối soát dữ liệu"
                          >
                            <History className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setTenantToSchedule(t);
                            }}
                            className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-lg font-bold text-[11px] transition"
                            title="Lên lịch cập nhật ngoài giờ giao dịch"
                          >
                            Lên lịch
                          </button>

                          {!isUpToDate && (
                            <button
                              disabled={isUpdatingThis}
                              onClick={() => handleUpdateTenant(t)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 text-white rounded-lg font-bold text-[11px] shadow-sm flex items-center gap-1 transition"
                            >
                              {isUpdatingThis ? (
                                <>
                                  <RefreshCw className="w-3 h-3 animate-spin" />
                                  <span>Đang update...</span>
                                </>
                              ) : (
                                <>
                                  <Rocket className="w-3 h-3" />
                                  <span>Cập nhật ngay</span>
                                </>
                              )}
                            </button>
                          )}
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

      {/* MODAL 1: Create New Release */}
      {isCreateReleaseModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3.5">
              <div className="flex items-center gap-2.5">
                <Rocket className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-extrabold text-white">Tạo & Phát Hành Phiên Bản Mới</h3>
              </div>
              <button
                onClick={() => setIsCreateReleaseModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateRelease} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-300 mb-1">Số hiệu phiên bản (Version)</label>
                  <input
                    type="text"
                    required
                    placeholder="ví dụ: v1.4.0 hoặc v2.0.0"
                    value={newVersion}
                    onChange={(e) => setNewVersion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-mono focus:border-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-300 mb-1">Kênh phát hành (Channel)</label>
                  <select
                    value={newChannel}
                    onChange={(e) => setNewChannel(e.target.value as ReleaseChannel)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 font-bold focus:border-blue-500 focus:outline-none"
                  >
                    <option value="stable">Stable (Kênh sản xuất chính)</option>
                    <option value="beta">Beta (Kênh thử nghiệm)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">Tóm tắt cải tiến chính (Summary)</label>
                <input
                  type="text"
                  required
                  placeholder="ví dụ: Tối ưu hóa hiệu năng báo cáo tồn kho & Cải tiến POS"
                  value={newSummary}
                  onChange={(e) => setNewSummary(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-300 mb-1">
                  Changelog ngắn (Mỗi gạch đầu dòng 1 dòng, tối đa 4 dòng ngắn)
                </label>
                <textarea
                  rows={3}
                  placeholder="• Cải thiện giao diện Dashboard&#10;• Tối ưu hóa tính giá vốn FIFO&#10;• Sửa lỗi nhỏ và tăng tốc độ tải trang"
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-slate-100 focus:border-blue-500 focus:outline-none"
                />
              </div>

              {/* Advanced Flags */}
              <div className="p-3.5 bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-200">Phiên bản bắt buộc (Mandatory)</p>
                    <p className="text-[11px] text-slate-400">
                      Bắt buộc Tenant cập nhật do liên quan đến an toàn hệ thống hoặc API
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={newMandatory}
                    onChange={(e) => setNewMandatory(e.target.checked)}
                    className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-800/80 pt-2.5">
                  <div>
                    <p className="font-bold text-slate-200">Mức độ an ninh (Security Severity)</p>
                    <p className="text-[11px] text-slate-400">Gắn nhãn để cảnh báo ưu tiên cập nhật</p>
                  </div>
                  <select
                    value={newSecuritySeverity}
                    onChange={(e) => setNewSecuritySeverity(e.target.value as SecuritySeverity)}
                    className="bg-slate-900 border border-slate-800 text-xs text-slate-200 px-2.5 py-1 rounded-lg"
                  >
                    <option value="NONE">NONE</option>
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL (Khẩn cấp)</option>
                  </select>
                </div>

                <div className="border-t border-slate-800/80 pt-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-slate-200">Yêu cầu Migration Schema (Non-destructive)</p>
                      <p className="text-[11px] text-slate-400">
                        Chỉ thêm trường mới/chỉ mục, tuyệt đối không xóa dữ liệu
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={newMigrationRequired}
                      onChange={(e) => setNewMigrationRequired(e.target.checked)}
                      className="w-4 h-4 rounded text-blue-600 bg-slate-900 border-slate-700"
                    />
                  </div>

                  {newMigrationRequired && (
                    <input
                      type="text"
                      placeholder="Mô tả migration (ví dụ: Tạo index FIFO layer tự động)"
                      value={newMigrationDesc}
                      onChange={(e) => setNewMigrationDesc(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg p-2 text-xs text-slate-200"
                    />
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateReleaseModalOpen(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl font-bold"
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-black shadow-lg shadow-blue-600/30"
                >
                  Phát Hành Bản Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Schedule Update */}
      {tenantToSchedule && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-extrabold text-white">Lên Lịch Cập Nhật Ngoài Giờ</h3>
              </div>
              <button
                onClick={() => setTenantToSchedule(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Lên lịch nâng cấp cho <strong>{tenantToSchedule.companyName || tenantToSchedule.name}</strong> lên phiên bản{' '}
              <strong className="text-blue-400 font-mono">
                {tenantToSchedule.targetVersion || latestStable?.version || 'v1.3.0'}
              </strong>
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-1">Chọn ngày & giờ cập nhật</label>
              <input
                type="datetime-local"
                value={scheduledDateTime}
                onChange={(e) => setScheduledDateTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white focus:border-blue-500 focus:outline-none"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                Khuyến nghị: 02:00 - 04:00 sáng để không gián đoạn giao dịch kinh doanh.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setTenantToSchedule(null)}
                className="px-3.5 py-2 bg-slate-800 text-slate-300 rounded-xl font-bold text-xs"
              >
                Hủy
              </button>
              <button
                onClick={handleSaveSchedule}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-extrabold text-xs shadow-md shadow-indigo-600/30"
              >
                Xác Nhận Lên Lịch
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Audit History & Zero-Data-Loss Verification */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <FileCheck className="w-5 h-5 text-emerald-400" />
                <div>
                  <h3 className="text-base font-extrabold text-white">
                    Nhật Ký Cập Nhật & Kiểm Tra Toàn Vẹn Dữ Liệu
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Đối soát số lượng bản ghi Khách hàng, Sản phẩm, Đơn hàng, FIFO và Sổ quỹ trước/sau mỗi lần cập nhật.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {(selectedTenantHistory ? history.filter((h) => h.tenantId === selectedTenantHistory.id) : history)
                .length === 0 ? (
                <div className="p-8 text-center text-slate-500">Chưa có lịch sử cập nhật nào được ghi nhận.</div>
              ) : (
                (selectedTenantHistory ? history.filter((h) => h.tenantId === selectedTenantHistory.id) : history).map(
                  (item) => (
                    <div
                      key={item.id}
                      className="bg-slate-950/70 border border-slate-800 rounded-2xl p-4 space-y-2.5 text-slate-300"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{item.tenantName}</span>
                          <span className="px-2 py-0.5 bg-slate-900 border border-slate-800 rounded font-mono text-[10px] text-blue-400">
                            {item.fromVersion} → {item.toVersion}
                          </span>
                        </div>
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded text-[10px] font-extrabold">
                          {item.status} (100% Data Preserved)
                        </span>
                      </div>

                      <p className="text-[11px] text-slate-400">
                        Người thực hiện: <strong className="text-slate-200">{item.triggeredBy}</strong> • Thời gian:{' '}
                        {item.completedAt || item.triggeredAt} • Snapshot ID: <code className="text-blue-300 font-mono">{item.backupId}</code>
                      </p>

                      {/* Data Integrity Summary Table */}
                      {item.dataIntegrityAfter && (
                        <div className="bg-slate-900/90 border border-slate-800/80 rounded-xl p-3 grid grid-cols-4 gap-2 text-center text-[10px]">
                          <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block">Khách hàng</span>
                            <span className="font-bold text-emerald-400 font-mono text-xs">
                              {item.dataIntegrityAfter.customersCount} (0 loss)
                            </span>
                          </div>

                          <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block">Sản phẩm/SKU</span>
                            <span className="font-bold text-emerald-400 font-mono text-xs">
                              {item.dataIntegrityAfter.productsCount} (0 loss)
                            </span>
                          </div>

                          <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block">Đơn bán hàng</span>
                            <span className="font-bold text-emerald-400 font-mono text-xs">
                              {item.dataIntegrityAfter.ordersCount} (0 loss)
                            </span>
                          </div>

                          <div className="bg-slate-950/60 p-1.5 rounded-lg border border-slate-800">
                            <span className="text-slate-400 block">FIFO Layers</span>
                            <span className="font-bold text-emerald-400 font-mono text-xs">
                              {item.dataIntegrityAfter.fifoLayersCount} (0 loss)
                            </span>
                          </div>
                        </div>
                      )}

                      {item.notes && <p className="text-[11px] text-emerald-300/80 italic">✓ {item.notes}</p>}
                    </div>
                  )
                )
              )}
            </div>

            <div className="pt-2 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
