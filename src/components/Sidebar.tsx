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
  Tag
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

  // Collapsible state for individual menu groups
  const [collapsedGroups, setCollapsedGroups] = useState<{
    business: boolean;
    warehouse: boolean;
    products: boolean;
    finance: boolean;
    marketing: boolean;
    crm: boolean;
    purchasing: boolean;
    fnb: boolean;
  }>(() => {
    try {
      const saved = localStorage.getItem('bizone_sidebar_groups');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      business: false,
      warehouse: false,
      products: false,
      finance: false,
      marketing: false,
      crm: false,
      purchasing: false,
      fnb: false
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
      localStorage.setItem('bizone_sidebar_groups', JSON.stringify(collapsedGroups));
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
            onClick={() => handleNavClick('dashboard')}
            title={APP_NAME}
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-blue-500 text-white flex items-center justify-center font-black text-lg sm:text-xl shadow-md shadow-blue-500/20 tracking-tighter shrink-0 hover:opacity-95 transition-opacity">
              B
            </div>
            {!isCompact && (
              <div className="overflow-hidden text-left">
                <div className="flex items-center gap-1.5">
                  <span className="font-black text-base sm:text-lg tracking-tight text-slate-900 leading-tight">
                    {APP_NAME}
                  </span>
                  <span className="text-[9px] font-extrabold uppercase bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-mono">
                    ERP
                  </span>
                </div>
                <div className="text-[10px] font-bold tracking-wider text-slate-400 uppercase leading-none mt-0.5 truncate">
                  Enterprise System
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

        {/* Navigation Items (All strictly Left-Aligned) */}
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

          {/* 2. KINH DOANH */}
          <div>
            {!isCompact && (
              <button
                onClick={() => toggleGroup('business')}
                className="w-full px-3 py-1 flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('nav.business', 'Kinh doanh')}</span>
                </span>
                <span className="text-slate-400">
                  {collapsedGroups.business ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>
            )}

            {(!collapsedGroups.business || isCompact) && (
              <div className={`space-y-0.5 ${!isCompact ? 'pl-4' : ''}`}>
                <button
                  id="nav-pos"
                  onClick={() => handleNavClick('pos')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'pos'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Calculator className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && (
                    <div className="flex items-center justify-between w-full">
                      <span>{t('nav.pos', 'POS')}</span>
                      <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                        FIFO
                      </span>
                    </div>
                  )}
                </button>

                <button
                  id="nav-orders"
                  onClick={() => handleNavClick('orders')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'orders'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && <span>{t('nav.orders', 'Đơn hàng')}</span>}
                </button>
              </div>
            )}
          </div>

          {/* 3. Marketing */}
          <div>
            <button
              id="nav-marketing"
              onClick={() => handleNavClick('marketing')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left ${
                isCompact ? 'md:justify-center md:px-0' : ''
              } ${
                currentView === 'marketing'
                  ? 'bg-purple-700 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Megaphone className="w-4 h-4 shrink-0 text-purple-500" />
              {!isCompact && (
                <div className="flex items-center justify-between w-full">
                  <span>{t('nav.marketing', 'Marketing')}</span>
                  <span className="text-[9px] bg-purple-100 text-purple-800 font-bold px-1.5 py-0.2 rounded">
                    ROAS
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* 4. CRM */}
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
            >
              <Users className="w-4 h-4 shrink-0" />
              {!isCompact && <span>{t('nav.crm', 'CRM')}</span>}
            </button>
          </div>

          {/* 5. MUA HÀNG */}
          <div>
            <button
              id="nav-suppliers"
              onClick={() => handleNavClick('suppliers')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left ${
                isCompact ? 'md:justify-center md:px-0' : ''
              } ${
                currentView === 'suppliers'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-4 h-4 shrink-0" />
              {!isCompact && (
                <div className="flex items-center justify-between w-full">
                  <span>{t('nav.purchasing', 'Mua hàng')}</span>
                  <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded">
                    NCC
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* 6. KHO & FIFO */}
          <div>
            {!isCompact && (
              <button
                onClick={() => toggleGroup('warehouse')}
                className="w-full px-3 py-1 flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <WarehouseIcon className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('nav.inventory', 'Kho & FIFO')}</span>
                </span>
                <span className="text-slate-400">
                  {collapsedGroups.warehouse ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>
            )}

            {(!collapsedGroups.warehouse || isCompact) && (
              <div className={`space-y-0.5 ${!isCompact ? 'pl-4' : ''}`}>
                <button
                  id="nav-warehouse-dashboard"
                  onClick={() => handleNavClick('warehouse-dashboard')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'warehouse-dashboard'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Boxes className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && <span>{t('nav.warehouseDashboard', 'Tổng quan Kho')}</span>}
                </button>

                <button
                  id="nav-purchasing"
                  onClick={() => handleNavClick('purchasing')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'purchasing'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Truck className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && <span>{language === 'vi' ? 'Nhập kho (PO)' : 'Goods Receipt (PO)'}</span>}
                </button>

                <button
                  id="nav-warehouse-issues"
                  onClick={() => handleNavClick('warehouse-issues')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'warehouse-issues'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <ArrowUpRight className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && <span>{t('nav.warehouseIssues', 'Xuất kho')}</span>}
                </button>

                <button
                  id="nav-warehouse-transfers"
                  onClick={() => handleNavClick('warehouse-transfers')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'warehouse-transfers'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && <span>{t('nav.warehouseTransfers', 'Chuyển kho')}</span>}
                </button>

                <button
                  id="nav-warehouse-stocktakes"
                  onClick={() => handleNavClick('warehouse-stocktakes')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'warehouse-stocktakes'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <ClipboardCheck className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && <span>{t('nav.warehouseStocktakes', 'Kiểm kê')}</span>}
                </button>

                <button
                  id="nav-warehouse-fifo-lots"
                  onClick={() => handleNavClick('warehouse-fifo-lots')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'warehouse-fifo-lots'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && <span>{t('nav.warehouseFifoLots', 'Lô & FIFO')}</span>}
                </button>

                <button
                  id="nav-stockcards"
                  onClick={() => handleNavClick('stockcards')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'stockcards'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <ScrollText className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && <span>{t('nav.stockcards', 'Thẻ kho')}</span>}
                </button>

                <button
                  id="nav-warehouse-reports"
                  onClick={() => handleNavClick('warehouse-reports')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'warehouse-reports'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && <span>{t('nav.warehouseReports', 'Báo cáo kho')}</span>}
                </button>
              </div>
            )}
          </div>

          {/* 7. SẢN PHẨM */}
          <div>
            {!isCompact && (
              <button
                onClick={() => toggleGroup('products')}
                className="w-full px-3 py-1 flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('nav.products', 'Sản phẩm')}</span>
                </span>
                <span className="text-slate-400">
                  {collapsedGroups.products ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>
            )}

            {(!collapsedGroups.products || isCompact) && (
              <div className={`space-y-0.5 ${!isCompact ? 'pl-4' : ''}`}>
                <button
                  id="nav-inventory"
                  onClick={() => handleNavClick('inventory')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'inventory'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Package className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && (
                    <div className="flex items-center justify-between w-full">
                      <span>{t('nav.productsSub', 'Danh mục SP & Tồn kho')}</span>
                      {lowStockCount > 0 && (
                        <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.2 rounded-full">
                          {lowStockCount}
                        </span>
                      )}
                    </div>
                  )}
                </button>

                <button
                  id="nav-variant-definitions"
                  onClick={() => handleNavClick('variant-definitions')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'variant-definitions'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <Layers3 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && (
                    <div className="flex items-center justify-between w-full">
                      <span>{t('nav.variantDefinitions', 'Variant SKU')}</span>
                      <span className="text-[9px] bg-purple-100 text-purple-700 font-bold px-1.5 py-0.2 rounded">
                        Master
                      </span>
                    </div>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* 8. F&B */}
          <div>
            <button
              id="nav-beverages"
              onClick={() => handleNavClick('beverages')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left ${
                isCompact ? 'md:justify-center md:px-0' : ''
              } ${
                currentView === 'beverages'
                  ? 'bg-amber-800 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Coffee className="w-4 h-4 shrink-0 text-amber-500" />
              {!isCompact && (
                <div className="flex items-center justify-between w-full">
                  <span>{t('nav.beveragesSub', 'F&B & Recipe')}</span>
                  <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.2 rounded">
                    BOM
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* 9. TC-KT */}
          <div>
            {!isCompact && (
              <button
                onClick={() => toggleGroup('finance')}
                className="w-full px-3 py-1 flex items-center justify-between text-[11px] font-bold text-slate-500 hover:text-slate-800 transition-colors text-left"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-blue-600" />
                  <span>{t('nav.finance', 'TC-KT')}</span>
                </span>
                <span className="text-slate-400">
                  {collapsedGroups.finance ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </span>
              </button>
            )}

            {(!collapsedGroups.finance || isCompact) && (
              <div className={`space-y-0.5 ${!isCompact ? 'pl-4' : ''}`}>
                <button
                  id="nav-cashflow"
                  onClick={() => handleNavClick('cashflow')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'cashflow'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && <span>{t('nav.cashflow', 'Quỹ & Dòng tiền')}</span>}
                </button>

                <button
                  id="nav-banking"
                  onClick={() => handleNavClick('banking')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'banking'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && (
                    <div className="flex items-center justify-between w-full">
                      <span>{t('nav.banking', 'Ngân hàng & VietQR')}</span>
                      <span className="text-[9px] bg-blue-100 text-blue-700 font-bold px-1.5 py-0.2 rounded">
                        24/7
                      </span>
                    </div>
                  )}
                </button>

                <button
                  id="nav-pnl"
                  onClick={() => handleNavClick('pnl')}
                  className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-xl font-medium text-xs transition-all text-left ${
                    isCompact ? 'md:justify-center md:px-0' : ''
                  } ${
                    currentView === 'pnl'
                      ? 'bg-blue-50 text-blue-700 font-bold'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  {!isCompact && <span>{t('nav.pnl', 'Báo cáo P&L')}</span>}
                </button>
              </div>
            )}
          </div>

          {/* 10. TMĐT & API */}
          <div>
            <button
              id="nav-api-integrations"
              onClick={() => handleNavClick('api-integrations')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left ${
                isCompact ? 'md:justify-center md:px-0' : ''
              } ${
                currentView === 'api-integrations'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0 text-blue-500" />
              {!isCompact && (
                <div className="flex items-center justify-between w-full">
                  <span>{t('nav.ecommerce', 'TMĐT & API')}</span>
                  <span className="text-[9px] bg-blue-100 text-blue-800 font-bold px-1.5 py-0.2 rounded">
                    Live
                  </span>
                </div>
              )}
            </button>
          </div>

          {/* 11. KH & KPI */}
          <div>
            <button
              id="nav-enterprise-planning"
              onClick={() => handleNavClick('enterprise-planning')}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl font-bold text-xs transition-all text-left ${
                isCompact ? 'md:justify-center md:px-0' : ''
              } ${
                currentView === 'enterprise-planning'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Target className="w-4 h-4 shrink-0 text-amber-500" />
              {!isCompact && <span>{t('nav.planning', 'KH & KPI')}</span>}
            </button>
          </div>

          {/* 12. BizOne AI */}
          <div>
            <button
              id="nav-ai-assistant"
              onClick={() => handleNavClick('ai-assistant')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-bold text-xs transition-all text-left ${
                isCompact ? 'md:justify-center md:px-0' : ''
              } ${
                currentView === 'ai-assistant'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bot className="w-4 h-4 text-emerald-600 shrink-0" />
                {!isCompact && <span>BizOne AI</span>}
              </div>
              {!isCompact && (
                <span className="text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white px-1.5 py-0.2 rounded">
                  Beta
                </span>
              )}
            </button>
          </div>
        </div>

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

          {/* 13. TÀI KHOẢN & QUYỀN */}
          <button
            id="nav-users-roles"
            onClick={() => handleNavClick('users-roles')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
              isCompact ? 'md:justify-center md:px-0' : ''
            } ${
              currentView === 'users-roles'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-4 h-4 shrink-0 text-slate-500" />
            {!isCompact && <span>{t('nav.usersRoles', 'Tài khoản & Quyền')}</span>}
          </button>

          {/* 14. CÀI ĐẶT */}
          <button
            id="nav-settings"
            onClick={() => handleNavClick('settings')}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left ${
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
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-all cursor-pointer text-left ${
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
