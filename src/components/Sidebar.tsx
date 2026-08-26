import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard,
  Target,
  Calculator,
  FileText,
  Package,
  Users,
  BookOpen,
  BarChart3,
  Bot,
  Settings,
  LogOut,
  X,
  ChevronDown,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Boxes,
  ScrollText,
  Truck,
  ArrowUpRight,
  ArrowRightLeft,
  ClipboardCheck,
  Layers,
  Layers3,
  FileSpreadsheet,
  Building2,
  Warehouse as WarehouseIcon,
  QrCode,
  ShieldCheck,
  Coffee,
  Megaphone,
  Globe,
  Briefcase,
  TrendingUp,
  Tag,
  RotateCcw,
  ShieldAlert,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { ViewMode, UserAccount } from '../types';
import { APP_NAME } from '../constants/appConfig';
import { useLanguage } from '../i18n';

interface SidebarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  lowStockCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  currentUser?: UserAccount;
  onLogout?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onSelectView,
  lowStockCount = 5,
  isOpen = false,
  onClose,
  currentUser,
  onLogout
}) => {
  const { language, t } = useLanguage();

  // Collapsible state for individual menu groups in User App
  const [collapsedGroups, setCollapsedGroups] = useState<{
    sales: boolean;
    crm: boolean;
    finance: boolean;
    ccu: boolean;
    marketing: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('bizone_sidebar_groups_v3');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      sales: false,
      crm: true,
      finance: false,
      ccu: false,
      marketing: true
    };
  });

  // State for collapsing entire sidebar on desktop (compact mode)
  const [isCompact, setIsCompact] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('bizone_sidebar_compact');
      return saved === 'true';
    } catch {}
    return false;
  });

  useEffect(() => {
    try {
      localStorage.setItem('bizone_sidebar_groups_v3', JSON.stringify(collapsedGroups));
    } catch {}
  }, [collapsedGroups]);

  useEffect(() => {
    try {
      localStorage.setItem('bizone_sidebar_compact', isCompact.toString());
    } catch {}
  }, [isCompact]);

  const toggleGroup = (group: keyof typeof collapsedGroups) => {
    setCollapsedGroups((prev) => ({
      ...prev,
      [group]: !prev[group]
    }));
  };

  const handleNavClick = (view: ViewMode) => {
    onSelectView(view);
    if (onClose) {
      onClose();
    }
  };

  const isOwnerView = currentView === 'saas-platform-admin';
  const isSalesActive = [
    'orders',
    'pos'
  ].includes(currentView);

  const isFinanceActive = [
    'finance',
    'cashflow',
    'pnl',
    'banking',
    'sales-channels',
    'sales-reconciliation',
    'sales-reports'
  ].includes(currentView);

  const isCcuActive = [
    'ccu',
    'inventory',
    'variant-definitions',
    'warehouse-dashboard',
    'warehouse-issues',
    'warehouse-transfers',
    'warehouse-stocktakes',
    'warehouse-fifo-lots',
    'warehouse-reports',
    'stockcards',
    'purchasing',
    'suppliers',
    'beverages',
    'sales-returns'
  ].includes(currentView);

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          id="sidebar-backdrop"
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-40 md:hidden transition-opacity duration-300"
          aria-hidden="true"
        />
      )}

      {/* Sidebar / Mobile Drawer */}
      <aside
        id="app-sidebar"
        className={`fixed inset-y-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col justify-between h-full select-none transform transition-all duration-300 ease-in-out md:static md:translate-x-0 md:h-screen md:sticky md:top-0 md:z-30 shrink-0 ${
          isOpen ? 'translate-x-0 shadow-2xl w-72 max-w-[85vw]' : '-translate-x-full md:shadow-none'
        } ${isCompact ? 'md:w-20' : 'md:w-64'}`}
      >
        {/* Brand Header */}
        <div className="p-3.5 sm:p-4 border-b border-slate-100 flex items-center justify-between">
          <div
            className={`flex items-center gap-3 cursor-pointer text-left ${isCompact ? 'md:justify-center md:w-full' : ''}`}
            onClick={() => handleNavClick(isOwnerView ? 'saas-platform-admin' : 'dashboard')}
            title={APP_NAME}
          >
            <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md tracking-tighter shrink-0 hover:opacity-95 transition-opacity ${
              isOwnerView
                ? 'bg-gradient-to-tr from-purple-700 via-indigo-700 to-purple-600 shadow-purple-500/20'
                : 'bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 shadow-blue-500/20'
            }`}>
              {isOwnerView ? '🛡️' : 'B'}
            </div>
            {!isCompact && (
              <div className="overflow-hidden text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 leading-tight">
                    {APP_NAME}
                  </span>
                  <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded font-mono ${
                    isOwnerView ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                  }`}>
                    {isOwnerView ? 'OWNER' : 'ERP'}
                  </span>
                </div>
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none mt-0.5 truncate">
                  {isOwnerView ? 'Platform Control Center' : 'V1.1 Enterprise'}
                </div>
              </div>
            )}
          </div>

          {/* Desktop Toggle Compact */}
          {!isCompact && (
            <button
              id="btn-toggle-compact-desktop"
              onClick={() => setIsCompact(true)}
              className="hidden md:flex p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              title={language === 'vi' ? 'Thu gọn' : 'Collapse'}
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}

          {/* Close button for mobile drawer */}
          <button
            id="btn-close-sidebar-mobile"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg md:hidden transition-colors"
            title={t('common.close')}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* OWNER APP NAVIGATION MODE */}
        {isOwnerView ? (
          <div className="flex-1 overflow-y-auto px-2.5 sm:px-3 py-3 space-y-2 custom-scrollbar text-left">
            <div className="px-2 py-1 bg-purple-50 border border-purple-200 rounded-xl text-purple-900 text-xs font-bold flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                {!isCompact && <span>Owner App</span>}
              </span>
              {!isCompact && <span className="text-[10px] bg-purple-200 text-purple-800 px-1.5 py-0.5 rounded font-mono">ROOT</span>}
            </div>

            <button
              id="btn-switch-to-user-app"
              onClick={() => handleNavClick('dashboard')}
              className="w-full flex items-center gap-2.5 px-3 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition cursor-pointer shadow-xs"
            >
              <ArrowLeft className="w-4 h-4 text-slate-300" />
              {!isCompact && <span>Quay lại Doanh nghiệp</span>}
            </button>

            <div className="pt-2">
              <button
                onClick={() => handleNavClick('saas-platform-admin')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs bg-purple-600 text-white shadow-xs text-left"
              >
                <LayoutDashboard className="w-4 h-4 shrink-0" />
                {!isCompact && <span>Quản trị nền tảng SaaS</span>}
              </button>
            </div>
          </div>
        ) : (
          /* USER APP NAVIGATION (6 LEVEL 1 MODULES) */
          <div className="flex-1 overflow-y-auto px-2.5 sm:px-3 py-2 space-y-1.5 custom-scrollbar text-left">
            {/* 1. DASHBOARD */}
            <button
              id="nav-dashboard"
              onClick={() => handleNavClick('dashboard')}
              title="Dashboard"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left ${
                isCompact ? 'md:justify-center md:px-0' : ''
              } ${
                currentView === 'dashboard'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 shrink-0" />
              {!isCompact && <span>{t('nav.dashboard', 'Dashboard')}</span>}
            </button>

            {/* 2. BÁN HÀNG (Unified Sales Workspace) */}
            <div>
              <button
                id="nav-orders-main"
                onClick={() => handleNavClick('orders')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left ${
                  isCompact ? 'md:justify-center md:px-0' : ''
                } ${
                  isSalesActive
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Bán hàng"
              >
                <Briefcase className="w-4 h-4 shrink-0" />
                {!isCompact && <span>Bán hàng</span>}
              </button>
            </div>

            {/* 3. CRM & KHÁCH HÀNG */}
            <div>
              <button
                id="nav-crm"
                onClick={() => handleNavClick('crm')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left ${
                  isCompact ? 'md:justify-center md:px-0' : ''
                } ${
                  currentView === 'crm'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="CRM & Khách hàng"
              >
                <Users className="w-4 h-4 shrink-0" />
                {!isCompact && <span>CRM & Khách hàng</span>}
              </button>
            </div>

            {/* 4. TÀI CHÍNH & KẾ TOÁN */}
            <div>
              {!isCompact ? (
                <div className="flex items-center justify-between rounded-xl hover:bg-slate-50 transition-colors">
                  <button
                    id="nav-finance-main"
                    onClick={() => handleNavClick('finance')}
                    className={`flex-1 flex items-center gap-3 px-3 py-2 font-bold text-xs transition-all text-left ${
                      isFinanceActive
                        ? 'text-blue-700'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <BookOpen className="w-4 h-4 shrink-0" />
                    <span>Tài chính & Kế toán</span>
                  </button>
                  <button
                    onClick={() => toggleGroup('finance')}
                    className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Mở rộng / Thu gọn"
                  >
                    {collapsedGroups.finance ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick('finance')}
                  className={`w-full flex items-center justify-center p-2 rounded-xl text-xs font-bold ${
                    isFinanceActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="Tài chính & Kế toán"
                >
                  <BookOpen className="w-4 h-4" />
                </button>
              )}

              {(!collapsedGroups.finance && !isCompact) && (
                <div className="pl-4 space-y-0.5 mt-0.5 border-l border-slate-100 ml-3.5">
                  <button
                    id="nav-sub-cashflow"
                    onClick={() => handleNavClick('cashflow')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'cashflow'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Thu & Chi</span>
                  </button>

                  <button
                    id="nav-sub-pnl"
                    onClick={() => handleNavClick('pnl')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'pnl'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <TrendingUp className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Lãi & Lỗ (P&L)</span>
                  </button>

                  <button
                    id="nav-sub-banking"
                    onClick={() => handleNavClick('banking')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'banking'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <QrCode className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Ngân hàng & VietQR</span>
                  </button>

                  <button
                    id="nav-sub-channels"
                    onClick={() => handleNavClick('sales-channels')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'sales-channels'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Doanh thu & Kênh bán</span>
                  </button>

                  <button
                    id="nav-sub-reconciliation"
                    onClick={() => handleNavClick('sales-reconciliation')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'sales-reconciliation'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Đối soát</span>
                  </button>

                  <button
                    id="nav-sub-reports"
                    onClick={() => handleNavClick('sales-reports')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'sales-reports'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Báo cáo tài chính</span>
                  </button>
                </div>
              )}
            </div>

            {/* 5. CCU (VẬN HÀNH LÕI & CHUỖI CUNG ỨNG) */}
            <div>
              {!isCompact ? (
                <div className="flex items-center justify-between rounded-xl hover:bg-slate-50 transition-colors">
                  <button
                    id="nav-ccu-main"
                    onClick={() => handleNavClick('ccu')}
                    className={`flex-1 flex items-center gap-3 px-3 py-2 font-bold text-xs transition-all text-left ${
                      isCcuActive
                        ? 'text-blue-700'
                        : 'text-slate-700 hover:text-slate-900'
                    }`}
                  >
                    <Boxes className="w-4 h-4 shrink-0" />
                    <span>CCU (Vận hành)</span>
                  </button>
                  <button
                    onClick={() => toggleGroup('ccu')}
                    className="p-2 text-slate-400 hover:text-slate-700 cursor-pointer"
                    title="Mở rộng / Thu gọn"
                  >
                    {collapsedGroups.ccu ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleNavClick('ccu')}
                  className={`w-full flex items-center justify-center p-2 rounded-xl text-xs font-bold ${
                    isCcuActive ? 'bg-blue-50 text-blue-700' : 'text-slate-700 hover:bg-slate-100'
                  }`}
                  title="CCU Vận hành"
                >
                  <Boxes className="w-4 h-4" />
                </button>
              )}

              {(!collapsedGroups.ccu && !isCompact) && (
                <div className="pl-4 space-y-0.5 mt-0.5 border-l border-slate-100 ml-3.5">
                  <button
                    id="nav-sub-products"
                    onClick={() => handleNavClick('variant-definitions')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'variant-definitions'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Layers3 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Sản phẩm & SKU</span>
                  </button>

                  <button
                    id="nav-sub-inventory"
                    onClick={() => handleNavClick('inventory')}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'inventory'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Package className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                      <span>Kho & Tồn kho</span>
                    </span>
                    {lowStockCount > 0 && (
                      <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                        {lowStockCount}
                      </span>
                    )}
                  </button>

                  <button
                    id="nav-sub-warehouse"
                    onClick={() => handleNavClick('warehouse-dashboard')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'warehouse-dashboard'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <WarehouseIcon className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Điều phối kho</span>
                  </button>

                  <button
                    id="nav-sub-purchasing"
                    onClick={() => handleNavClick('purchasing')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'purchasing'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Truck className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Mua hàng & PO</span>
                  </button>

                  <button
                    id="nav-sub-suppliers"
                    onClick={() => handleNavClick('suppliers')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'suppliers'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Building2 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Nhà cung cấp</span>
                  </button>

                  <button
                    id="nav-sub-recipes"
                    onClick={() => handleNavClick('beverages')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'beverages'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Coffee className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Công thức & BOM</span>
                  </button>

                  <button
                    id="nav-sub-returns"
                    onClick={() => handleNavClick('sales-returns')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'sales-returns'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <RotateCcw className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Trả hàng & Nhập lại</span>
                  </button>

                  <button
                    id="nav-sub-fifo-lots"
                    onClick={() => handleNavClick('warehouse-fifo-lots')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'warehouse-fifo-lots'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Lô FIFO & HSD</span>
                  </button>

                  <button
                    id="nav-sub-stockcards"
                    onClick={() => handleNavClick('stockcards')}
                    className={`w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition text-left ${
                      currentView === 'stockcards'
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                    }`}
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                    <span>Thẻ kho</span>
                  </button>
                </div>
              )}
            </div>

            {/* 6. MARKETING */}
            <div>
              <button
                id="nav-marketing"
                onClick={() => handleNavClick('marketing')}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left ${
                  isCompact ? 'md:justify-center md:px-0' : ''
                } ${
                  currentView === 'marketing'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                }`}
                title="Marketing"
              >
                <Megaphone className="w-4 h-4 shrink-0" />
                {!isCompact && <span>Marketing</span>}
              </button>
            </div>

            {/* BIZONE AI ASSISTANT */}
            <div className="pt-1.5">
              <button
                id="nav-ai-assistant"
                onClick={() => handleNavClick('ai-assistant')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-left ${
                  isCompact ? 'md:justify-center md:px-0' : ''
                } ${
                  currentView === 'ai-assistant'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                }`}
                title="BizOne AI Assistant"
              >
                <div className="flex items-center gap-3">
                  <Bot className="w-4 h-4 text-emerald-600 shrink-0" />
                  {!isCompact && <span>BizOne AI</span>}
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Bottom Footer Actions (Left-Aligned) */}
        <div className="p-3 border-t border-slate-100 space-y-1 text-left">
          {isCompact && (
            <button
              id="btn-expand-sidebar-desktop"
              onClick={() => setIsCompact(false)}
              className="hidden md:flex w-full items-center justify-center p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all mb-1 cursor-pointer"
              title={language === 'vi' ? 'Mở rộng' : 'Expand'}
            >
              <PanelLeftOpen className="w-4 h-4" />
            </button>
          )}

          {/* Switch to Owner App Toggle */}
          {!isOwnerView && (
            <button
              id="nav-owner-platform"
              onClick={() => handleNavClick('saas-platform-admin')}
              className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl text-[11px] font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 transition-all cursor-pointer text-left ${
                isCompact ? 'md:justify-center md:px-0' : ''
              }`}
              title="Quản trị nền tảng (Owner App)"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-purple-600 shrink-0" />
              {!isCompact && <span>Chủ nền tảng (Owner)</span>}
            </button>
          )}

          {/* TÀI KHOẢN & QUYỀN */}
          <button
            id="nav-users-roles"
            onClick={() => handleNavClick('users-roles')}
            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all text-left ${
              isCompact ? 'md:justify-center md:px-0' : ''
            } ${
              currentView === 'users-roles'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-slate-500" />
            {!isCompact && <span>Tài khoản & Quyền</span>}
          </button>

          {/* CÀI ĐẶT */}
          <button
            id="nav-settings"
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all text-left ${
              isCompact ? 'md:justify-center md:px-0' : ''
            } ${
              currentView === 'settings'
                ? 'bg-slate-100 text-slate-900 font-bold'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Settings className="w-4 h-4 text-slate-500 shrink-0" />
            {!isCompact && <span>{t('nav.settings', 'Cài đặt')}</span>}
          </button>

          {/* ĐĂNG XUẤT */}
          <button
            id="nav-logout"
            onClick={() => onLogout?.()}
            className={`w-full flex items-center gap-3 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer text-left ${
              isCompact ? 'md:justify-center md:px-0' : ''
            }`}
          >
            <LogOut className="w-4 h-4 text-rose-500 shrink-0" />
            {!isCompact && <span>{language === 'vi' ? 'Đăng xuất' : 'Log out'}</span>}
          </button>
        </div>
      </aside>
    </>
  );
};
