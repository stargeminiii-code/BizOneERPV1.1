import React, { useState } from 'react';
import {
  Menu,
  Search,
  Bell,
  HelpCircle,
  Plus,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  LogOut,
  Layers,
  Globe,
  GitBranch,
  Rocket,
  ShieldCheck
} from 'lucide-react';

import { UserAccount } from '../types';
import { useLanguage } from '../i18n';
import { SaaSService } from '../services/saasService';

interface HeaderProps {
  onOpenCreateOrder: () => void;
  onOpenCommandPalette: () => void;
  searchTerm: string;
  onSearchChange: (value: string) => void;
  unreadAlertsCount?: number;
  onToggleMobileMenu?: () => void;
  currentUser?: UserAccount;
  users?: UserAccount[];
  onChangeCurrentUser?: (user: UserAccount) => void;
  onLogout?: () => void;
  onNavigateToSettings?: () => void;
  onOpenDesignSystem?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenCreateOrder,
  onOpenCommandPalette,
  searchTerm,
  onSearchChange,
  unreadAlertsCount = 2,
  onToggleMobileMenu,
  currentUser,
  users = [],
  onChangeCurrentUser,
  onLogout,
  onNavigateToSettings,
  onOpenDesignSystem
}) => {
  const { language, setLanguage, t } = useLanguage();
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Tenant Version State
  const tenantId = currentUser?.tenant || 'tenant_enterprise_01';
  const allTenants = SaaSService.getTenants();
  const currentTenant = allTenants.find((t) => t.id === tenantId) || allTenants[0];
  const releases = SaaSService.getReleases();
  const latestStable = releases.find((r) => r.channel === 'stable' && r.status === 'RELEASED');
  const hasUpdate = currentTenant && (currentTenant.updateStatus === 'UPDATE_AVAILABLE' || (latestStable && currentTenant.currentVersion !== latestStable.version));

  return (
    <header className="h-14 sm:h-16 bg-white border-b border-slate-200 px-3 sm:px-6 flex items-center justify-between sticky top-0 z-20 shadow-xs gap-2 sm:gap-4">
      {/* Left: Mobile Hamburger Menu & Search Bar */}
      <div className="flex items-center gap-2 sm:gap-3 flex-1 max-w-xl">
        {/* Hamburger button for mobile screens */}
        <button
          id="btn-hamburger-menu"
          onClick={onToggleMobileMenu}
          className="p-2 -ml-1 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl md:hidden transition-colors focus:outline-none shrink-0"
          aria-label={t('common.search')}
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Search Bar */}
        <div
          onClick={onOpenCommandPalette}
          className="relative flex items-center cursor-pointer group flex-1"
        >
          <Search className="w-4 h-4 text-slate-400 absolute left-3 sm:left-3.5 pointer-events-none group-hover:text-blue-500 transition-colors" />
          <input
            type="text"
            readOnly
            value={searchTerm}
            placeholder={t('common.search', 'Tìm kiếm...')}
            className="w-full bg-slate-50 hover:bg-slate-100/80 text-xs sm:text-sm rounded-xl pl-8 sm:pl-10 pr-10 sm:pr-14 py-1.5 sm:py-2 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-700 placeholder-slate-400 cursor-pointer transition-all"
          />
          <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 text-[10px] font-semibold text-slate-400 bg-white border border-slate-200 rounded shadow-xs">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1.5 sm:gap-3 shrink-0">
        {/* Language Switcher VI | EN */}
        <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200">
          <button
            type="button"
            onClick={() => setLanguage('vi')}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
              language === 'vi'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Tiếng Việt"
          >
            VI
          </button>
          <button
            type="button"
            onClick={() => setLanguage('en')}
            className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${
              language === 'en'
                ? 'bg-white text-blue-700 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="English"
          >
            EN
          </button>
        </div>

        {/* Environment Isolation Indicator */}
        {currentUser?.tenant === 'demo' || currentUser?.role === 'demo' ? (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg text-xs text-amber-800 font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
            <span className="text-amber-900 uppercase font-black text-[11px] tracking-wide">{t('brand.demo', 'DEMO SANDBOX')}</span>
          </div>
        ) : (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-300 rounded-lg text-xs text-emerald-800 font-bold shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span className="text-emerald-900 uppercase font-black text-[11px] tracking-wide">{t('brand.enterprise', 'DOANH NGHIỆP')}</span>
          </div>
        )}

        {/* Software Version Indicator & Update CTA */}
        <div className="hidden lg:flex items-center gap-1.5">
          <span className="px-2 py-1 bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-mono font-bold text-slate-700 flex items-center gap-1">
            <GitBranch className="w-3 h-3 text-slate-500" />
            {currentTenant?.currentVersion || 'v1.2.0'}
          </span>

          {hasUpdate && (
            <button
              onClick={onNavigateToSettings}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-95 text-white rounded-lg text-[11px] font-bold shadow-xs cursor-pointer animate-pulse transition"
              title="Có phiên bản phần mềm mới. Dữ liệu được bảo toàn 100% khi nâng cấp."
            >
              <Rocket className="w-3 h-3" />
              <span>Bản mới: {currentTenant?.targetVersion || latestStable?.version || 'v1.3.0'}</span>
            </button>
          )}
        </div>

        <div className="h-5 w-px bg-slate-200 hidden sm:block"></div>

        {/* UI Foundation & Design System Showcase */}
        {onOpenDesignSystem && (
          <button
            id="btn-design-system-header"
            onClick={onOpenDesignSystem}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg border border-slate-200/80 transition-colors cursor-pointer"
            title="UI Foundation & Design System Guidelines"
          >
            <Layers className="w-3.5 h-3.5 text-slate-600" />
            <span className="hidden md:inline">Design System</span>
          </button>
        )}

        {/* Notifications with Backdrop Overlay */}
        <div className="relative">
          <button
            id="btn-notifications"
            onClick={() => setShowNotificationDropdown(!showNotificationDropdown)}
            className="p-1.5 sm:p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-xl relative transition-all z-50"
            title={t('common.details', 'Thông báo')}
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadAlertsCount > 0 && (
              <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
            )}
          </button>

          {showNotificationDropdown && (
            <>
              {/* Fullscreen Backdrop Overlay with Blur */}
              <div
                onClick={() => setShowNotificationDropdown(false)}
                className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 animate-in fade-in duration-150"
              />

              <div className="absolute right-0 mt-2 w-72 sm:w-84 bg-white rounded-2xl shadow-2xl border border-slate-100 p-4 z-50 animate-in fade-in slide-in-from-top-2">
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 px-1">
                  <div className="flex items-center gap-1.5">
                    <Bell className="w-4 h-4 text-indigo-600" />
                    <span className="font-bold text-sm text-slate-800">{language === 'vi' ? 'Thông báo hệ thống' : 'System Notifications'}</span>
                  </div>
                  <button
                    onClick={() => setShowNotificationDropdown(false)}
                    className="text-[11px] text-blue-600 hover:underline cursor-pointer font-bold"
                  >
                    {language === 'vi' ? 'Đánh dấu đã đọc' : 'Mark as read'}
                  </button>
                </div>

                <div className="space-y-2 mt-2.5 max-h-80 overflow-y-auto pr-0.5">
                  {hasUpdate && (
                    <div
                      onClick={() => {
                        setShowNotificationDropdown(false);
                        if (onNavigateToSettings) onNavigateToSettings();
                      }}
                      className="p-2.5 rounded-xl bg-blue-50/90 border border-blue-200 text-xs space-y-1 cursor-pointer hover:bg-blue-100/80 transition"
                    >
                      <div className="flex items-center justify-between font-bold text-blue-950">
                        <div className="flex items-center gap-1.5">
                          <Rocket className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span>Bản cập nhật {currentTenant?.targetVersion || latestStable?.version || 'v1.3.0'} sẵn sàng</span>
                        </div>
                        <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                      </div>
                      <p className="text-blue-900 text-[11px] leading-relaxed">
                        Phiên bản mới giúp tối ưu giao diện và bảo toàn 100% dữ liệu kinh doanh. Bấm để xem chi tiết.
                      </p>
                      <div className="text-[10px] text-blue-600 font-mono font-semibold">Vừa phát hành</div>
                    </div>
                  )}

                  <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-100 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-amber-900">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{language === 'vi' ? 'Cảnh báo tồn kho' : 'Stock Alert'}</span>
                    </div>
                    <p className="text-amber-800 text-[11px]">{language === 'vi' ? 'Hạt cà phê Arabica Cầu Đất chỉ còn 12kg.' : 'Arabica Coffee beans stock is under minimum.'}</p>
                    <div className="text-[10px] text-amber-600 font-mono">10m ago</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-100 text-xs space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{language === 'vi' ? 'Đơn hàng mới đã thanh toán' : 'New Order Paid'}</span>
                    </div>
                    <p className="text-emerald-800 text-[11px]">{language === 'vi' ? 'Đã thanh toán thành công qua VietQR.' : 'Paid successfully via VietQR.'}</p>
                    <div className="text-[10px] text-emerald-600 font-mono">35m ago</div>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-100 text-center">
                  <button
                    onClick={() => setShowNotificationDropdown(false)}
                    className="text-xs text-slate-500 hover:text-slate-800 font-bold"
                  >
                    {t('common.close', 'Đóng')} (Esc)
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Primary Action: Tạo đơn mới */}
        <button
          id="btn-create-order-header"
          onClick={onOpenCreateOrder}
          className="flex items-center gap-1.5 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#0F172A] hover:bg-slate-800 active:scale-98 text-white rounded-xl font-semibold text-xs sm:text-sm shadow-sm transition-all"
        >
          <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
          <span className="hidden sm:inline">{t('business.createOrder', 'Tạo đơn mới')}</span>
          <span className="sm:hidden">{t('common.create', 'Tạo')}</span>
        </button>

        {/* User Profile Avatar & Switcher */}
        <div className="relative">
          <button
            onClick={() => setShowProfileDropdown(!showProfileDropdown)}
            className="flex items-center gap-2 focus:outline-none cursor-pointer group"
          >
            <div className="relative">
              <img
                src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                alt="User Avatar"
                referrerPolicy="no-referrer"
                className="w-8 h-8 sm:w-9 sm:h-9 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-blue-400 transition-all shadow-xs"
              />
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full ring-2 ring-white"></span>
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-bold text-slate-800 leading-none truncate max-w-[130px]">
                {currentUser?.name || 'Đức Tăng'}
              </div>
              <div className="text-[10px] text-blue-600 font-semibold leading-tight mt-0.5 truncate max-w-[130px]">
                {currentUser?.roleTitle || 'Super Admin'}
              </div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden lg:block group-hover:text-slate-700" />
          </button>

          {showProfileDropdown && (
            <>
              {/* Fullscreen Backdrop */}
              <div
                onClick={() => setShowProfileDropdown(false)}
                className="fixed inset-0 bg-slate-900/20 backdrop-blur-2xs z-40"
              />

              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-2xl border border-slate-100 p-2.5 z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="px-3 py-2.5 border-b border-slate-100 bg-slate-50/80 rounded-xl mb-2">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={currentUser?.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80"}
                      alt=""
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 shrink-0"
                    />
                    <div className="overflow-hidden">
                      <p className="font-bold text-xs sm:text-sm text-slate-900 truncate">{currentUser?.name || 'Đức Tăng'}</p>
                      <p className="text-[11px] text-blue-700 font-bold truncate">{currentUser?.roleTitle || 'Super Admin'}</p>
                    </div>
                  </div>
                </div>

                {/* Switcher (Visible ONLY for Super Admin in development mode) */}
                {currentUser?.role === 'super_admin' && (
                  <div className="py-1">
                    <div className="px-2 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-blue-500" />
                      <span>{language === 'vi' ? 'Chuyển đổi tài khoản (Super Admin):' : 'Switch Account:'}</span>
                    </div>
                    <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar">
                      {users.map((u) => {
                        const isCurrent = u.id === currentUser?.id;
                        return (
                          <button
                            key={u.id}
                            type="button"
                            onClick={() => {
                              onChangeCurrentUser?.(u);
                              setShowProfileDropdown(false);
                            }}
                            className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs flex items-center justify-between transition-colors cursor-pointer ${
                              isCurrent
                                ? 'bg-blue-50 text-blue-700 font-bold'
                                : 'hover:bg-slate-50 text-slate-700'
                            }`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <img
                                src={u.avatar}
                                alt=""
                                referrerPolicy="no-referrer"
                                className="w-5 h-5 rounded-full object-cover shrink-0"
                              />
                              <span className="truncate">{u.name}</span>
                            </div>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono ${
                              isCurrent ? 'bg-blue-200/60 text-blue-900' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {u.role}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Logout Button */}
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowProfileDropdown(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{language === 'vi' ? 'Đăng xuất' : 'Log out'}</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
