import React from 'react';
import {
  ShoppingCart,
  Store,
  Truck,
  Boxes,
  UserPlus
} from 'lucide-react';
import { UserAccount } from '../../types';
import { hasPermission } from '../../utils/rbacUtils';
import { useLanguage } from '../../i18n';

interface ExecutiveQuickActionsProps {
  currentUser?: UserAccount | null;
  onOpenCreateOrder: () => void;
  onOpenPos: () => void;
  onOpenCreatePO: () => void;
  onNavigateToInventory: () => void;
  onNavigateToCrm: () => void;
}

export const ExecutiveQuickActions: React.FC<ExecutiveQuickActionsProps> = ({
  currentUser,
  onOpenCreateOrder,
  onOpenPos,
  onOpenCreatePO,
  onNavigateToInventory,
  onNavigateToCrm
}) => {
  const { t } = useLanguage();

  const actions: Array<{
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    allowed: boolean;
    primary?: boolean;
  }> = [
    {
      id: 'qa-create-order',
      label: t('dashboard.quickActions.createOrder'),
      icon: ShoppingCart,
      onClick: onOpenCreateOrder,
      allowed: hasPermission(currentUser, 'orders', 'create') || !currentUser,
      primary: true
    },
    {
      id: 'qa-open-pos',
      label: t('dashboard.quickActions.pos'),
      icon: Store,
      onClick: onOpenPos,
      allowed: hasPermission(currentUser, 'orders', 'view') || !currentUser
    },
    {
      id: 'qa-create-po',
      label: t('dashboard.quickActions.createPo'),
      icon: Truck,
      onClick: onOpenCreatePO,
      allowed: hasPermission(currentUser, 'purchasing', 'create') || hasPermission(currentUser, 'purchase_orders', 'create') || !currentUser
    },
    {
      id: 'qa-inventory',
      label: t('dashboard.quickActions.inventory'),
      icon: Boxes,
      onClick: onNavigateToInventory,
      allowed: hasPermission(currentUser, 'inventory', 'view') || !currentUser
    },
    {
      id: 'qa-crm',
      label: t('dashboard.quickActions.crm'),
      icon: UserPlus,
      onClick: onNavigateToCrm,
      allowed: hasPermission(currentUser, 'customers', 'create') || hasPermission(currentUser, 'crm', 'view') || !currentUser
    }
  ];

  const visibleActions = actions.filter((a) => a.allowed);

  return (
    <div id="executive-quick-actions" className="flex items-center gap-2 overflow-x-auto py-1 max-w-full">
      <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider shrink-0 mr-1 hidden sm:inline">
        {t('dashboard.quickActions.title')}
      </span>
      {visibleActions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            id={action.id}
            onClick={action.onClick}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition whitespace-nowrap cursor-pointer min-h-[36px] ${
              action.primary
                ? 'bg-slate-900 hover:bg-slate-800 text-white shadow-xs'
                : 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 shadow-2xs'
            }`}
          >
            <Icon className={`w-3.5 h-3.5 ${action.primary ? 'text-white' : 'text-slate-500'}`} />
            <span>{action.label}</span>
          </button>
        );
      })}
    </div>
  );
};
