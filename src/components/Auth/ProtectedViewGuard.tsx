import React from 'react';
import {
  ShieldAlert,
  Lock,
  ArrowLeft,
  UserCheck,
  Building,
  KeyRound,
  HelpCircle,
  ExternalLink,
  ShieldCheck,
  Users
} from 'lucide-react';
import { UserAccount, ViewMode } from '../../types';
import { canAccessView, getRequiredPermissionForView } from '../../utils/permissionMiddleware';

interface ProtectedViewGuardProps {
  view: ViewMode;
  currentUser: UserAccount | null;
  onNavigateHome: () => void;
  onSwitchUser?: () => void;
  children: React.ReactNode;
}

export const ProtectedViewGuard: React.FC<ProtectedViewGuardProps> = ({
  view,
  currentUser,
  onNavigateHome,
  onSwitchUser,
  children
}) => {
  const isAllowed = canAccessView(currentUser, view);

  if (isAllowed) {
    return <>{children}</>;
  }

  const req = getRequiredPermissionForView(view);

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto my-6 animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl border border-rose-200/80 shadow-xl overflow-hidden">
        {/* Top Header Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 p-6 sm:p-8 text-white relative overflow-hidden">
          <div className="absolute right-[-20px] top-[-20px] w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex items-start gap-4 relative z-10">
            <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-lg">
              <ShieldAlert className="w-8 h-8 text-white animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-black uppercase tracking-wider mb-2 backdrop-blur-md">
                <Lock className="w-3.5 h-3.5" />
                Truy Cập Bị Giới Hạn (Access Denied)
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                Bạn Chưa Được Cấp Quyền Vào Phân Hệ Này
              </h2>
              <p className="text-sm text-rose-100 mt-1 font-medium max-w-2xl">
                Hệ thống bảo vệ phân quyền đa tầng (RBAC) đã chặn yêu cầu truy cập màn hình <strong>"{req.label}"</strong> để bảo đảm an toàn dữ liệu nội bộ.
              </p>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 space-y-6">
          {/* User Context & Missing Permission Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Current User Info */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 mb-3">
                <UserCheck className="w-4 h-4 text-blue-600" />
                Thông Tin Tài Khoản Hiện Tại
              </div>
              <div className="flex items-center gap-3">
                <img
                  src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                  alt=""
                  referrerPolicy="no-referrer"
                  className="w-11 h-11 rounded-xl object-cover ring-2 ring-slate-200 shrink-0"
                />
                <div>
                  <div className="font-bold text-slate-900 text-sm">{currentUser?.name || 'Chưa đăng nhập'}</div>
                  <div className="text-xs text-slate-500 font-medium">
                    {currentUser?.roleTitle || currentUser?.role} • {currentUser?.department || 'Khối vận hành'}
                  </div>
                  <div className="mt-1 flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                      Mã NV: {currentUser?.employeeCode || 'N/A'}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 text-[10px] font-mono">
                      Scope: {currentUser?.dataScope || 'individual'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Required Permission Info */}
            <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-200/60">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-rose-700 mb-3">
                <KeyRound className="w-4 h-4 text-rose-600" />
                Quyền Hạn Bắt Buộc Cần Có
              </div>
              <div className="space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Phân hệ (Module):</span>
                  <span className="font-mono font-bold text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-200">
                    {req.module}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Hành động yêu cầu:</span>
                  <span className="font-mono font-bold text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded border border-rose-200 uppercase">
                    {req.action}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Nhóm chức năng:</span>
                  <span className="font-semibold text-slate-900">{req.category}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Module Description & Security Policy */}
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 text-xs leading-relaxed space-y-2 border border-slate-800">
            <div className="font-bold text-amber-400 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              Chính Sách An Toàn & Phân Tách Trách Nhiệm (SoD)
            </div>
            <p>
              Hệ thống ERP tuân thủ chuẩn bảo mật ISO/IEC 27001 và kiểm soát nội bộ. Nếu công việc của bạn cần truy cập phân hệ <strong>"{req.label}"</strong>, vui lòng liên hệ trực tiếp Quản trị viên tối cao để được cấp quyền hoặc gán vai trò tương ứng.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onNavigateHome}
                className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-md"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Về Bảng Điều Khiển Dashboard</span>
              </button>

              {onSwitchUser && (
                <button
                  type="button"
                  onClick={onSwitchUser}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Users className="w-4 h-4 text-slate-600" />
                  <span>Đổi Tài Khoản / Chuyển Vai Trò</span>
                </button>
              )}
            </div>

            {/* System support notice */}
            <div className="text-xs text-slate-500 text-right">
              <div>Hỗ trợ kỹ thuật: <strong className="text-slate-800 font-medium">Ban Quản Trị Hệ Thống</strong></div>
              <div className="text-[11px] text-blue-600">Liên hệ Quản trị viên Doanh nghiệp của bạn</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
