import React, { useState } from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  Clock,
  KeyRound,
  Users,
  ChevronRight,
  Sparkles,
  RefreshCw,
  X,
  CreditCard
} from 'lucide-react';
import { UserAccount, SaaSPlan } from '../../types';
import { SaaSService } from '../../services/saasService';

interface TenantLicenseBannerProps {
  currentUser: UserAccount | null;
  activeUsersCount?: number;
  onOpenSaaSAdmin?: () => void;
}

export const TenantLicenseBanner: React.FC<TenantLicenseBannerProps> = ({
  currentUser,
  activeUsersCount = 2,
  onOpenSaaSAdmin
}) => {
  const isSuperAdmin = currentUser?.role === 'super_admin';
  const tenantId = currentUser?.tenant === 'demo' ? 'demo' : 'tenant_enterprise_01';
  const licenseInfo = SaaSService.checkLicense(tenantId);
  const plans = SaaSService.getPlans();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanCode, setSelectedPlanCode] = useState<SaaSPlan['code']>('ANNUAL');
  const [toastText, setToastText] = useState<string | null>(null);

  const handleRenew = () => {
    const res = SaaSService.renewSubscription(tenantId, selectedPlanCode, currentUser?.name || 'Tenant Admin');
    if (res.success) {
      setToastText(res.message);
      setTimeout(() => {
        setToastText(null);
        setIsModalOpen(false);
      }, 2500);
    }
  };

  return (
    <>
      {/* Top Banner if expiring soon or in grace period */}
      {licenseInfo.daysRemaining <= 15 && (
        <div className="bg-amber-500/10 dark:bg-amber-950/40 border-b border-amber-500/20 px-4 py-1.5 flex items-center justify-between text-xs text-amber-800 dark:text-amber-300">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
            <span>
              Gói dịch vụ <strong>{licenseInfo.planName}</strong> của Quý khách còn <strong>{licenseInfo.daysRemaining} ngày</strong> sử dụng.
              (Giới hạn tối đa: 3 User).
            </span>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[11px] transition-colors"
          >
            Gia hạn ngay
          </button>
        </div>
      )}

      {/* License Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <KeyRound className="w-5 h-5 text-amber-300" />
                <h3 className="text-base font-bold">Thông Tin Bản Quyền & Gia Hạn BizOne ERP</h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-5 text-xs text-slate-600 dark:text-slate-300">
              {toastText && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-xl text-emerald-700 dark:text-emerald-300 font-semibold text-center">
                  {toastText}
                </div>
              )}

              {/* Status card */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 dark:text-white text-sm">
                    {licenseInfo.planName}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 font-bold text-[10px]">
                    {licenseInfo.status === 'ACTIVE' ? 'Đang kích hoạt' : 'Hết hạn'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <span className="text-slate-400">Số User sử dụng:</span>
                    <p className="font-bold text-slate-800 dark:text-white">
                      {activeUsersCount} / 3 Users (Tối đa)
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400">Thời gian còn lại:</span>
                    <p className="font-bold text-blue-600 dark:text-blue-400">
                      {licenseInfo.daysRemaining} ngày
                    </p>
                  </div>
                </div>
              </div>

              {/* Select Plan to renew */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Chọn gói dịch vụ gia hạn (Tất cả Full tính năng, tối đa 3 User):
                </label>
                <div className="space-y-2">
                  {plans.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPlanCode(p.code)}
                      className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                        selectedPlanCode === p.code
                          ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40 ring-1 ring-blue-500'
                          : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                      }`}
                    >
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-900 dark:text-white">{p.name}</span>
                          {p.badge && (
                            <span className="px-1.5 py-0.2 text-[9px] font-bold bg-amber-500 text-white rounded">
                              {p.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          {p.durationDays} ngày • Full tính năng • 3 User
                        </p>
                      </div>
                      <span className="font-mono font-extrabold text-blue-600 dark:text-blue-400">
                        {p.price.toLocaleString('vi-VN')} đ
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-200 dark:border-slate-800">
                {isSuperAdmin && onOpenSaaSAdmin && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsModalOpen(false);
                      onOpenSaaSAdmin();
                    }}
                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                  >
                    Vào Portal Quản Trị BizOne <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="flex items-center gap-2 ml-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-semibold"
                  >
                    Đóng
                  </button>
                  <button
                    type="button"
                    onClick={handleRenew}
                    className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold shadow-md shadow-blue-500/20"
                  >
                    Xác nhận Gia hạn
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
