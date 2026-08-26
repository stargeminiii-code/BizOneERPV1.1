import React from 'react';
import { X, LayoutDashboard, ShoppingCart, Package, Layers, TrendingUp, Users, DollarSign, RotateCcw, BarChart3, Store } from 'lucide-react';
import { WorkspaceTab, ViewMode } from '../../types';

interface WorkspaceTabBarProps {
  tabs: WorkspaceTab[];
  activeTabId: string;
  onSelectTab: (tabId: string) => void;
  onCloseTab: (tabId: string) => void;
}

export const WorkspaceTabBar: React.FC<WorkspaceTabBarProps> = ({
  tabs,
  activeTabId,
  onSelectTab,
  onCloseTab
}) => {
  const getTabIcon = (viewMode: ViewMode, tabId: string) => {
    if (tabId === 'dashboard') return <LayoutDashboard className="w-3.5 h-3.5" />;
    if (tabId.includes('pos')) return <Store className="w-3.5 h-3.5" />;
    if (tabId.includes('order')) return <ShoppingCart className="w-3.5 h-3.5" />;
    if (tabId.includes('inventory') || tabId.includes('aging')) return <Layers className="w-3.5 h-3.5" />;
    if (tabId.includes('product')) return <Package className="w-3.5 h-3.5" />;
    if (tabId.includes('debt') || tabId.includes('crm') || tabId.includes('customer')) return <Users className="w-3.5 h-3.5" />;
    if (tabId.includes('return')) return <RotateCcw className="w-3.5 h-3.5" />;
    if (tabId.includes('report')) return <BarChart3 className="w-3.5 h-3.5" />;
    return <Package className="w-3.5 h-3.5" />;
  };

  return (
    <div id="workspace-tab-bar" className="bg-slate-100/90 border-b border-slate-200 px-3 pt-2 flex items-center gap-1.5 overflow-x-auto select-none custom-scrollbar shrink-0">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTabId;
        return (
          <div
            key={tab.id}
            onClick={() => onSelectTab(tab.id)}
            className={`group relative flex items-center gap-2 px-3.5 py-1.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-t border-x ${
              isActive
                ? 'bg-white border-slate-200 text-blue-600 shadow-2xs font-extrabold -mb-[1px] pb-2'
                : 'bg-slate-200/60 border-transparent text-slate-600 hover:bg-slate-200 hover:text-slate-900'
            }`}
          >
            <span className={isActive ? 'text-blue-600' : 'text-slate-500 group-hover:text-slate-700'}>
              {getTabIcon(tab.viewMode, tab.id)}
            </span>
            <span className="truncate max-w-[140px]">{tab.title}</span>
            {tab.badge && (
              <span className="text-[10px] px-1.5 py-0.2 bg-blue-100 text-blue-700 rounded-full font-extrabold">
                {tab.badge}
              </span>
            )}
            {tab.closable && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onCloseTab(tab.id);
                }}
                className="p-0.5 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors ml-1"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
};
