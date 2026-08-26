import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  CreditCard,
  Building2,
  FileCheck2,
  PieChart,
  ArrowRightLeft,
  QrCode,
  Download,
  Calendar,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ShieldCheck,
  FileText,
  Globe,
  BarChart3
} from 'lucide-react';
import {
  CashTransaction,
  BankAccount,
  Order,
  UserAccount
} from '../types';
import { CashflowView } from './CashflowView';
import { PnlView } from './PnlView';
import { BankingView } from './BankingView';
import { SalesReconciliationView } from './Sales/SalesReconciliationView';
import { SalesChannelsView } from './Sales/SalesChannelsView';
import { SalesReportsView } from './Sales/SalesReportsView';
import { OrdersListView } from './Finance/OrdersListView';
import { useLanguage } from '../i18n';

export type FinanceSubTab = 'orders' | 'cashflow' | 'pnl' | 'banking' | 'channels' | 'reconciliation' | 'reports';

interface FinanceWorkspaceViewProps {
  initialTab?: FinanceSubTab;
  cashTransactions: CashTransaction[];
  bankAccounts: BankAccount[];
  orders: Order[];
  currentUser?: UserAccount;
  onAddCashTransaction: (tx: Omit<CashTransaction, 'id' | 'createdAt'>) => void;
  onSaveBankAccount: (account: Partial<BankAccount>) => void;
  onSetDefaultBankAccount: (id: string) => void;
  onToggleBankStatus: (id: string) => void;
  onNavigateToOrders?: (channelId?: string) => void;
  onSelectOrder?: (order: Order) => void;
  onOpenVietQr?: (order: Order) => void;
}

export const FinanceWorkspaceView: React.FC<FinanceWorkspaceViewProps> = ({
  initialTab = 'orders',
  cashTransactions = [],
  bankAccounts = [],
  orders = [],
  currentUser,
  onAddCashTransaction,
  onSaveBankAccount,
  onSetDefaultBankAccount,
  onToggleBankStatus,
  onNavigateToOrders,
  onSelectOrder,
  onOpenVietQr
}) => {
  const { t } = useLanguage();
  const [activeTab, setActiveTab] = useState<FinanceSubTab>(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div id="finance-workspace-container" className="space-y-4 p-3 sm:p-5 max-w-[1600px] mx-auto">
      {/* Top Workspace Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            id="tab-finance-orders"
            onClick={() => setActiveTab('orders')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'orders'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Danh sách đơn hàng</span>
          </button>

          <button
            id="tab-finance-cashflow"
            onClick={() => setActiveTab('cashflow')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'cashflow'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Thu & Chi</span>
          </button>

          <button
            id="tab-finance-pnl"
            onClick={() => setActiveTab('pnl')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'pnl'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Lãi & Lỗ (P&L)</span>
          </button>

          <button
            id="tab-finance-banking"
            onClick={() => setActiveTab('banking')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'banking'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" />
            <span>Ngân hàng & VietQR</span>
          </button>

          <button
            id="tab-finance-channels"
            onClick={() => setActiveTab('channels')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'channels'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Doanh thu & Kênh bán</span>
          </button>

          <button
            id="tab-finance-reconciliation"
            onClick={() => setActiveTab('reconciliation')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'reconciliation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Đối soát sàn</span>
          </button>

          <button
            id="tab-finance-reports"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Báo cáo tài chính</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
          <DollarSign className="w-4 h-4 text-slate-600" />
          <span>Tài chính & Kế toán</span>
        </div>
      </div>

      {/* Sub-views */}
      {activeTab === 'orders' && (
        <OrdersListView
          orders={orders}
          onSelectOrder={onSelectOrder}
          onOpenVietQr={onOpenVietQr}
        />
      )}

      {activeTab === 'cashflow' && (
        <CashflowView
          transactions={cashTransactions}
          onAddTransaction={onAddCashTransaction}
        />
      )}

      {activeTab === 'pnl' && <PnlView />}

      {activeTab === 'banking' && (
        <BankingView
          bankAccounts={bankAccounts}
          onSaveBankAccount={onSaveBankAccount}
          onSetDefaultAccount={onSetDefaultBankAccount}
          onToggleStatus={onToggleBankStatus}
        />
      )}

      {activeTab === 'channels' && (
        <SalesChannelsView
          orders={orders}
          currentUser={currentUser}
          onNavigateToOrders={onNavigateToOrders}
        />
      )}

      {activeTab === 'reconciliation' && (
        <SalesReconciliationView
          orders={orders}
          currentUser={currentUser}
        />
      )}

      {activeTab === 'reports' && (
        <SalesReportsView
          orders={orders}
        />
      )}
    </div>
  );
};
