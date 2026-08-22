import React from 'react';
import {
  DashboardMetrics,
  DiagnosisInsight,
  Order,
  Product,
  Customer,
  InventoryLayer,
  StockTransaction,
  Warehouse,
  Branch,
  Supplier,
  PurchaseOrder,
  CrmTask,
  CashTransaction,
  UserAccount
} from '../types';
import { EnterpriseControlTower } from './ExecutiveControlTower/EnterpriseControlTower';

interface DashboardViewProps {
  metrics: DashboardMetrics;
  insights: DiagnosisInsight[];
  orders: Order[];
  products?: Product[];
  inventoryLots?: InventoryLayer[];
  stockTransactions?: StockTransaction[];
  warehouses?: Warehouse[];
  branches?: Branch[];
  suppliers?: Supplier[];
  purchaseOrders?: PurchaseOrder[];
  customers?: Customer[];
  crmTasks?: CrmTask[];
  cashTransactions?: CashTransaction[];
  users?: UserAccount[];
  currentUser?: UserAccount;
  onNavigateToView?: (view: string, filter?: string) => void;
  onOpenCreatePO: (productName?: string) => void;
  onOpenCrmTask: (customerName?: string) => void;
  onViewAllOrders: () => void;
  onSelectOrder: (order: Order) => void;
  onRefreshDiagnosis: () => void;
  isDiagnosing: boolean;
  onOpenVietQrModal: (order: Order) => void;
  onEditProduct?: (product: Product) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  orders = [],
  products = [],
  inventoryLots = [],
  warehouses = [],
  suppliers = [],
  purchaseOrders = [],
  customers = [],
  crmTasks = [],
  cashTransactions = [],
  users = [],
  currentUser,
  onNavigateToView,
  onSelectOrder,
  onOpenCrmTask,
  onOpenCreatePO,
  onViewAllOrders
}) => {
  return (
    <div className="p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-6 max-w-[1680px] mx-auto">
      <EnterpriseControlTower
        orders={orders}
        customers={customers}
        inventoryLots={inventoryLots}
        crmTasks={crmTasks}
        cashTransactions={cashTransactions}
        purchaseOrders={purchaseOrders}
        warehouses={warehouses}
        suppliers={suppliers}
        products={products}
        users={users}
        currentUser={currentUser}
        onNavigateToView={onNavigateToView}
        onSelectOrder={onSelectOrder}
        onSelectCustomer={(cust) => {
          if (onNavigateToView) onNavigateToView('crm', cust.name);
          else onOpenCrmTask(cust.name);
        }}
      />
    </div>
  );
};
