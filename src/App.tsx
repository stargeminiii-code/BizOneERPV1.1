import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { PosView } from './components/PosView';
import { OrdersView } from './components/OrdersView';
import { InventoryView } from './components/InventoryView';
import { StockCardView } from './components/StockCardView';
import { CrmView } from './components/CrmView';
import { SupplierView } from './components/SupplierView';
import { PurchasingView } from './components/PurchasingView';
import { CashflowView } from './components/CashflowView';
import { PnlView } from './components/PnlView';
import { AiAssistantView } from './components/AiAssistantView';
import { SettingsView } from './components/SettingsView';
import { BankingView } from './components/BankingView';
import { UsersRolesView } from './components/UsersRolesView';
import { EnterprisePlanningView } from './components/EnterprisePlanningView';
import { BeveragesView } from './components/BeveragesView';
import { MarketingView } from './components/MarketingView';
import { ApiIntegrationsView } from './components/ApiIntegrationsView';

import { WarehouseDashboardView } from './components/WarehouseDashboardView';
import { StockIssuesView } from './components/StockIssuesView';
import { StockTransferView } from './components/StockTransferView';
import { StocktakeView } from './components/StocktakeView';
import { FifoLotsView } from './components/FifoLotsView';
import { WarehouseReportsView } from './components/WarehouseReportsView';
import { VariantSkuMasterView } from './components/VariantSkuMasterView';

import { VietQrModal } from './components/Modals/VietQrModal';
import { CreateOrderModal } from './components/Modals/CreateOrderModal';
import { CreatePurchaseModal } from './components/Modals/CreatePurchaseModal';
import { CrmTaskModal } from './components/Modals/CrmTaskModal';
import { CustomerModal } from './components/Modals/CustomerModal';
import { CustomerDetailModal } from './components/Modals/CustomerDetailModal';
import { CustomerImportModal } from './components/Modals/CustomerImportModal';
import { CommandPalette } from './components/Modals/CommandPalette';
import { OrderDetailModal } from './components/OrderDetailModal';
import { StockAdjustmentModal } from './components/Modals/StockAdjustmentModal';
import { CreateIssueModal } from './components/Modals/CreateIssueModal';
import { StockTransferModal } from './components/Modals/StockTransferModal';
import { StocktakeModal } from './components/Modals/StocktakeModal';
import { ProductModal } from './components/Modals/ProductModal';
import { ProductImportModal } from './components/Modals/ProductImportModal';
import { SyncEInvoiceModal } from './components/Modals/SyncEInvoiceModal';
import { EInvoiceEntryModal } from './components/Modals/EInvoiceEntryModal';
import { DeleteConfirmModal } from './components/Modals/DeleteConfirmModal';
import { InvoiceExtractionModal } from './components/Modals/InvoiceExtractionModal';
import { LoginView } from './components/Auth/LoginView';
import { ProtectedViewGuard } from './components/Auth/ProtectedViewGuard';
import { PlatformAdminView } from './components/SaaS/PlatformAdminView';
import { AuthService } from './services/authService';
import { SaaSService } from './services/saasService';
import {
  filterCustomersByScope,
  filterOrdersByScope,
  filterTasksByScope,
  filterCashTransactionsByScope
} from './utils/dataScopeUtils';
import { eInvoiceService } from './services/eInvoiceService';

import {
  Customer,
  DashboardMetrics,
  DiagnosisInsight,
  Order,
  Product,
  PurchaseOrder,
  CashTransaction,
  Supplier,
  ViewMode,
  InventoryLayer,
  StockTransaction,
  Branch,
  Warehouse,
  StockIssue,
  StockTransfer,
  Stocktake,
  AuditLog,
  CrmTask,
  SupplierTask,
  SupplierPaymentVoucher,
  EInvoiceData,
  JournalEntry,
  CustomerSpecialOccasion,
  LoyaltyTransaction,
  EnterprisePlan,
  KpiDefinition,
  KpiActionPlan,
  WorkCategoryHierarchy,
  EnterpriseSystemAlert,
  EnterpriseForecastItem,
  PerformanceScorecard
} from './types';

import {
  initialCustomers,
  initialInsights,
  initialMetrics,
  initialOrders,
  initialProducts,
  initialPurchaseOrders,
  initialCashTransactions,
  initialSuppliers,
  initialInventoryLots,
  initialStockTransactions,
  initialBranches,
  initialWarehouses,
  initialStockIssues,
  initialStockTransfers,
  initialStocktakes,
  initialAuditLogs,
  initialCrmTasks,
  initialSupplierTasks,
  initialSupplierPayments
} from './data/mockData';
import { INITIAL_USERS } from './data/userData';
import { INITIAL_BANK_ACCOUNTS } from './data/infrastructureData';
import { INITIAL_SPECIAL_OCCASIONS, INITIAL_LOYALTY_TRANSACTIONS } from './data/specialOccasionsData';
import {
  INITIAL_ENTERPRISE_PLANS,
  INITIAL_KPI_DEFINITIONS,
  INITIAL_ACTION_PLANS,
  INITIAL_WORK_CATEGORIES,
  INITIAL_ENTERPRISE_FORECASTS,
  INITIAL_PERFORMANCE_SCORECARDS,
  INITIAL_ENTERPRISE_ALERTS
} from './data/enterprisePlanningData';
import { UserAccount, BankAccount } from './types';
import { fifoEngine } from './services/fifoEngine';

export default function App() {
  // Portal Routing State ('super-admin' vs 'erp')
  const [portal, setPortal] = useState<'super-admin' | 'erp'>(() => {
    if (typeof window !== 'undefined') {
      const path = window.location.pathname;
      if (path.startsWith('/super-admin')) {
        return 'super-admin';
      }
    }
    return 'erp';
  });

  // Sync portal state with browser URL navigation (back/forward)
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path.startsWith('/super-admin')) {
        setPortal('super-admin');
      } else {
        setPortal('erp');
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const switchPortal = (target: 'super-admin' | 'erp') => {
    setPortal(target);
    const targetPath = target === 'super-admin' ? '/super-admin' : '/erp';
    if (typeof window !== 'undefined' && window.location.pathname !== targetPath) {
      window.history.pushState(null, '', targetPath);
    }
  };

  // Navigation State
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Core Data State with FIFO Architecture
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [inventoryLots, setInventoryLots] = useState<InventoryLayer[]>(initialInventoryLots);
  const [stockTransactions, setStockTransactions] = useState<StockTransaction[]>(initialStockTransactions);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [suppliers, setSuppliers] = useState<Supplier[]>(initialSuppliers);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>(initialPurchaseOrders);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>(initialCashTransactions);
  const [branches, setBranches] = useState<Branch[]>(initialBranches);
  const [warehouses, setWarehouses] = useState<Warehouse[]>(initialWarehouses);
  const [stockIssues, setStockIssues] = useState<StockIssue[]>(initialStockIssues);
  const [stockTransfers, setStockTransfers] = useState<StockTransfer[]>(initialStockTransfers);
  const [stocktakes, setStocktakes] = useState<Stocktake[]>(initialStocktakes);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(initialAuditLogs);
  const [crmTasks, setCrmTasks] = useState<CrmTask[]>(initialCrmTasks);
  const [specialOccasions, setSpecialOccasions] = useState<CustomerSpecialOccasion[]>(INITIAL_SPECIAL_OCCASIONS);
  const [loyaltyTransactions, setLoyaltyTransactions] = useState<LoyaltyTransaction[]>(INITIAL_LOYALTY_TRANSACTIONS);
  const [supplierTasks, setSupplierTasks] = useState<SupplierTask[]>(initialSupplierTasks);

  // Enterprise Planning & KPI Engine States
  const [plans, setPlans] = useState<EnterprisePlan[]>(INITIAL_ENTERPRISE_PLANS);
  const [kpis, setKpis] = useState<KpiDefinition[]>(INITIAL_KPI_DEFINITIONS);
  const [actionPlans, setActionPlans] = useState<KpiActionPlan[]>(INITIAL_ACTION_PLANS);
  const [workCategories, setWorkCategories] = useState<WorkCategoryHierarchy[]>(INITIAL_WORK_CATEGORIES);
  const [enterpriseAlerts, setEnterpriseAlerts] = useState<EnterpriseSystemAlert[]>(INITIAL_ENTERPRISE_ALERTS);
  const [enterpriseForecasts, setEnterpriseForecasts] = useState<EnterpriseForecastItem[]>(INITIAL_ENTERPRISE_FORECASTS);
  const [scorecards, setScorecards] = useState<PerformanceScorecard[]>(INITIAL_PERFORMANCE_SCORECARDS);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPaymentVoucher[]>(initialSupplierPayments);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [users, setUsers] = useState<UserAccount[]>(() => AuthService.getUsers());
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(() => {
    return AuthService.getCurrentUser();
  });
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(AuthService.getCurrentUser());
  });
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(INITIAL_BANK_ACCOUNTS);

  // Sync and verify session with server on startup
  useEffect(() => {
    AuthService.verifySessionWithServer().then((isValid) => {
      if (!isValid) {
        setCurrentUser(null);
        setIsAuthenticated(false);
      } else {
        const fresh = AuthService.getCurrentUser();
        if (fresh) {
          setCurrentUser(fresh);
          setIsAuthenticated(true);
        }
      }
    });
  }, []);

  // Scoped Data Engine for multi-tenant and role-based data isolation
  const scopedCustomers = React.useMemo(() => filterCustomersByScope(customers, currentUser), [customers, currentUser]);
  const scopedOrders = React.useMemo(() => filterOrdersByScope(orders, currentUser), [orders, currentUser]);
  const scopedCrmTasks = React.useMemo(() => filterTasksByScope(crmTasks, currentUser), [crmTasks, currentUser]);
  const scopedCashTransactions = React.useMemo(() => filterCashTransactionsByScope(cashTransactions, currentUser), [cashTransactions, currentUser]);

  const [selectedBranchId, setSelectedBranchId] = useState<string>('BR01');
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [insights, setInsights] = useState<DiagnosisInsight[]>(initialInsights);
  const [isDiagnosing, setIsDiagnosing] = useState(false);

  // Modals and selection state
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOrderOpen, setIsCreateOrderOpen] = useState(false);
  const [isCreatePOOpen, setIsCreatePOOpen] = useState(false);
  const [targetProductForPO, setTargetProductForPO] = useState<string | undefined>();
  const [poToEdit, setPoToEdit] = useState<PurchaseOrder | null>(null);
  const [isCrmTaskOpen, setIsCrmTaskOpen] = useState(false);
  const [targetCustomerForCRM, setTargetCustomerForCRM] = useState<string | undefined>();
  const [taskToEdit, setTaskToEdit] = useState<CrmTask | null>(null);

  // Customer Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [customerToEdit, setCustomerToEdit] = useState<Customer | null>(null);
  const [selectedCustomerDetail, setSelectedCustomerDetail] = useState<Customer | null>(null);
  const [isCustomerImportOpen, setIsCustomerImportOpen] = useState(false);

  const [isVietQrOpen, setIsVietQrOpen] = useState(false);
  const [selectedOrderForVietQr, setSelectedOrderForVietQr] = useState<Order | null>(null);
  const [isOrderDetailOpen, setIsOrderDetailOpen] = useState(false);
  const [selectedOrderForDetail, setSelectedOrderForDetail] = useState<Order | null>(null);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isStockAdjustmentOpen, setIsStockAdjustmentOpen] = useState(false);
  const [isCreateIssueOpen, setIsCreateIssueOpen] = useState(false);
  const [isStockTransferOpen, setIsStockTransferOpen] = useState(false);
  const [isStocktakeOpen, setIsStocktakeOpen] = useState(false);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isProductImportOpen, setIsProductImportOpen] = useState(false);
  const [productToEdit, setProductToEdit] = useState<Product | null>(null);
  const [isSyncEInvoiceOpen, setIsSyncEInvoiceOpen] = useState(false);
  const [isEInvoiceEntryOpen, setIsEInvoiceEntryOpen] = useState(false);
  const [isInvoiceExtractionOpen, setIsInvoiceExtractionOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);

  // Listen for Ctrl+K / Cmd+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handlers for business actions
  const handleOpenVietQrModal = (order: Order) => {
    setSelectedOrderForVietQr(order);
    setIsVietQrOpen(true);
  };

  const handleOpenOrderDetail = (order: Order) => {
    setSelectedOrderForDetail(order);
    setIsOrderDetailOpen(true);
  };

  const handleOpenCreatePO = (productOrSupplierName?: string) => {
    setTargetProductForPO(productOrSupplierName);
    setIsCreatePOOpen(true);
  };

  const handleOpenCrmTask = (customerName?: string) => {
    setTargetCustomerForCRM(customerName);
    setTaskToEdit(null);
    setIsCrmTaskOpen(true);
  };

  const handleConfirmVietQrPayment = (orderId: string) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === orderId ? { ...o, status: 'completed', paymentStatus: 'paid' } : o
      )
    );

    const paidOrder = orders.find((o) => o.id === orderId) || selectedOrderForVietQr;
    if (paidOrder) {
      const newTx: CashTransaction = {
        id: `tx-${Date.now()}`,
        code: `PT-2026-0${Math.floor(100 + Math.random() * 900)}`,
        type: 'thu',
        category: 'Thu tiền bán hàng qua VietQR',
        amount: paidOrder.totalAmount,
        description: `Thanh toán thành công đơn hàng ${paidOrder.code}`,
        paymentMethod: 'vietqr',
        payerOrPayee: paidOrder.customerName,
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
        referenceCode: paidOrder.code
      };
      setCashTransactions((prev) => [newTx, ...prev]);
    }
  };

  // 1. FIFO Sales Deduction Handler
  const handleAddOrder = (orderInput: Order) => {
    const itemsToDeduct = orderInput.items.map((it) => ({
      sku: it.sku,
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      salePrice: it.unitPrice,
      unit: it.unit
    }));

    const result = fifoEngine.executeFifoIssue(itemsToDeduct, inventoryLots, {
      issueId: `iss-ord-${orderInput.id}`,
      docCode: orderInput.code,
      docType: 'Xuất bán',
      branchId: 'BR01',
      warehouseId: 'WH01',
      actor: orderInput.creator || 'Lê Hoàng Nam (Sales KV1)',
      note: `Xuất kho tự động cho đơn bán hàng ${orderInput.code}`
    });

    if (!result.success) {
      alert(`Không thể lập đơn: ${result.errorMessage || 'Lỗi không đủ tồn kho FIFO'}`);
      return;
    }

    setInventoryLots(result.updatedLayers);
    setStockTransactions((prev) => [...result.generatedTransactions, ...prev]);
    setAuditLogs((prev) => [...result.auditLogs, ...prev]);
    setProducts((prev) => fifoEngine.syncProductsWithLayers(prev, result.updatedLayers));

    const completeOrder: Order = {
      ...orderInput,
      cogs: result.totalCogs,
      grossProfit: orderInput.totalAmount - result.totalCogs
    };

    setOrders((prev) => [completeOrder, ...prev]);

    // Update Customer debt & total spent
    if (orderInput.customerName) {
      setCustomers((prev) =>
        prev.map((c) => {
          if (c.name.toLowerCase() === orderInput.customerName.toLowerCase()) {
            const addedDebt = orderInput.paymentStatus === 'paid' ? 0 : orderInput.totalAmount;
            return {
              ...c,
              totalSpent: (c.totalSpent || 0) + orderInput.totalAmount,
              debt: (c.debt || 0) + addedDebt
            };
          }
          return c;
        })
      );
    }

    if (orderInput.paymentStatus === 'paid') {
      const newTx: CashTransaction = {
        id: `tx-${Date.now()}`,
        code: `PT-2026-0${Math.floor(100 + Math.random() * 900)}`,
        type: 'thu',
        category: 'Thu tiền bán hàng',
        amount: orderInput.totalAmount,
        description: `Thu tiền đơn hàng ${orderInput.code}`,
        paymentMethod: orderInput.paymentMethod,
        payerOrPayee: orderInput.customerName,
        createdAt: orderInput.createdAt,
        referenceCode: orderInput.code
      };
      setCashTransactions((prev) => [newTx, ...prev]);
    }
  };

  // 2. FIFO Purchase Order (PO) Handler
  const handleAddPurchaseOrder = (newPO: PurchaseOrder) => {
    setPurchaseOrders((prev) => [newPO, ...prev]);

    const { newLayers, transactions, auditLogs: newAuditLogs } = fifoEngine.createLayersFromPurchaseOrder(
      newPO,
      'Trần Văn Hùng (Thu Mua)'
    );

    const updatedLayers = [...newLayers, ...inventoryLots];
    setInventoryLots(updatedLayers);
    setStockTransactions((prev) => [...transactions, ...prev]);
    setAuditLogs((prev) => [...newAuditLogs, ...prev]);
    setProducts((prev) => fifoEngine.syncProductsWithLayers(prev, updatedLayers));

    // Update Supplier debt & stats
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.name.toLowerCase() === newPO.supplierName.toLowerCase() || (newPO.supplierId && s.id === newPO.supplierId)) {
          const unpaidAmount = newPO.status === 'received' && newPO.paymentStatus === 'unpaid' ? newPO.totalAmount : 0;
          return {
            ...s,
            debt: (s.debt || 0) + unpaidAmount,
            totalPurchased: (s.totalPurchased || 0) + newPO.totalAmount,
            purchaseOrderCount: (s.purchaseOrderCount || 0) + 1
          };
        }
        return s;
      })
    );

    if (newPO.paymentStatus === 'paid') {
      const newTx: CashTransaction = {
        id: `tx-po-${Date.now()}`,
        code: `PC-2026-0${Math.floor(100 + Math.random() * 900)}`,
        type: 'chi',
        category: 'Chi tiền nhập hàng (PO)',
        amount: newPO.totalAmount,
        description: `Thanh toán phiếu nhập hàng ${newPO.code} từ NCC ${newPO.supplierName}`,
        paymentMethod: 'bank_transfer',
        payerOrPayee: newPO.supplierName,
        createdAt: newPO.createdAt,
        referenceCode: newPO.code
      };
      setCashTransactions((prev) => [newTx, ...prev]);
    }
  };

  const handleUpdatePurchaseOrder = (updatedPO: PurchaseOrder) => {
    setPurchaseOrders((prev) => prev.map((po) => (po.id === updatedPO.id ? updatedPO : po)));

    // Re-sync supplier debt
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.name.toLowerCase() === updatedPO.supplierName.toLowerCase() || (updatedPO.supplierId && s.id === updatedPO.supplierId)) {
          return {
            ...s,
            debt: (s.debt || 0) + (updatedPO.debtAmount || 0)
          };
        }
        return s;
      })
    );
  };

  // 3. Stock Adjustment Handler
  const handleStockAdjustment = (adjustment: {
    sku: string;
    productName: string;
    lotId?: string;
    brand?: string;
    type: 'Điều chỉnh tăng' | 'Điều chỉnh giảm';
    quantity: number;
    unitCost?: number;
    reason: string;
    actor: string;
  }) => {
    const updatedLots = [...inventoryLots];
    const targetLot = updatedLots.find((l) => (l.layerId || l.lotId) === adjustment.lotId);
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 16);

    let unitCost = adjustment.unitCost || 0;
    if (targetLot) {
      unitCost = adjustment.unitCost || targetLot.purchasePrice || targetLot.costPrice || 0;
      if (adjustment.type === 'Điều chỉnh tăng') {
        targetLot.quantityRemaining += adjustment.quantity;
        targetLot.status = 'active';
      } else {
        targetLot.quantityRemaining = Math.max(0, targetLot.quantityRemaining - adjustment.quantity);
        targetLot.quantityIssued += adjustment.quantity;
        if (targetLot.quantityRemaining === 0) targetLot.status = 'exhausted';
      }
    } else if (adjustment.type === 'Điều chỉnh tăng') {
      // Create new adjustment lot if none selected
      const prod = products.find((p) => p.sku === adjustment.sku);
      const newAdjLot: InventoryLayer = {
        id: `LAYER-ADJ-${Date.now()}`,
        layerId: `LOT-ADJ-${Date.now().toString().slice(-6)}`,
        layerType: 'RECEIPT',
        sku: adjustment.sku,
        productId: prod?.productId || 'P000001',
        productCode: prod?.code || adjustment.sku,
        productName: adjustment.productName,
        unit: prod?.unit || 'Hộp',
        packSize: String(prod?.packSize || '1'),
        branchId: prod?.branchId || 'BR01',
        branchName: 'Chi nhánh Chính - Hà Nội',
        warehouseId: prod?.warehouseId || 'WH01',
        warehouseName: 'Kho Tổng Hà Nội',
        supplierName: adjustment.brand ? `Thương hiệu ${adjustment.brand}` : 'Kho Điều Chỉnh',
        receiptCode: `ADJ-${Date.now().toString().slice(-6)}`,
        receivedAt: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        quantityReceived: adjustment.quantity,
        quantityIssued: 0,
        quantityRemaining: adjustment.quantity,
        purchasePrice: unitCost || prod?.costPrice || 15000,
        salePrice: prod?.sellingPrice || 25000,
        status: 'active',
        notes: `Điều chỉnh tồn: ${adjustment.reason}`
      };
      updatedLots.unshift(newAdjLot);
    }

    const currentSkuBalance = updatedLots
      .filter((l) => l.sku === adjustment.sku)
      .reduce((sum, l) => sum + l.quantityRemaining, 0);

    const newTx: StockTransaction = {
      id: `stk-adj-${Date.now()}`,
      date: nowTime,
      type: adjustment.type,
      docCode: `ADJ-${Date.now().toString().slice(-6)}`,
      sku: adjustment.sku,
      productId: targetLot?.productId || 'P000000',
      productName: adjustment.productName,
      lotId: adjustment.lotId || `LOT-ADJ-${Date.now().toString().slice(-6)}`,
      qtyIn: adjustment.type === 'Điều chỉnh tăng' ? adjustment.quantity : 0,
      qtyOut: adjustment.type === 'Điều chỉnh giảm' ? adjustment.quantity : 0,
      balance: currentSkuBalance,
      unitCost,
      totalValue: adjustment.quantity * unitCost,
      actor: adjustment.actor,
      note: `${adjustment.reason}${adjustment.brand ? ` (Thương hiệu: ${adjustment.brand})` : ''}`
    };

    setInventoryLots(updatedLots);
    setStockTransactions((prev) => [newTx, ...prev]);
    setProducts((prev) => {
      const synced = fifoEngine.syncProductsWithLayers(prev, updatedLots);
      if (adjustment.brand) {
        return synced.map((p) => (p.sku === adjustment.sku ? { ...p, brand: adjustment.brand } : p));
      }
      return synced;
    });
  };

  // 4. Warehouse Issue Handler
  const handleSaveStockIssue = (newIssue: StockIssue) => {
    setStockIssues((prev) => [newIssue, ...prev]);

    const itemsToDeduct = newIssue.items.map((it) => ({
      sku: it.sku,
      productId: it.productId,
      productName: it.productName,
      quantity: it.quantity,
      salePrice: it.salePrice,
      unit: it.unit
    }));

    const result = fifoEngine.executeFifoIssue(itemsToDeduct, inventoryLots, {
      issueId: newIssue.id,
      docCode: newIssue.code,
      docType: newIssue.issueType === 'Bán hàng' ? 'Xuất bán' : 'Xuất nội bộ',
      branchId: newIssue.branchId,
      warehouseId: newIssue.warehouseId,
      actor: newIssue.createdBy || 'Nguyễn Văn An (Kho)',
      note: newIssue.note
    });

    if (result.success) {
      setInventoryLots(result.updatedLayers);
      setStockTransactions((prev) => [...result.generatedTransactions, ...prev]);
      setAuditLogs((prev) => [...result.auditLogs, ...prev]);
      setProducts((prev) => fifoEngine.syncProductsWithLayers(prev, result.updatedLayers));
    }
  };

  // 5. Stock Transfer Handler
  const handleSaveStockTransfer = (transfer: StockTransfer) => {
    setStockTransfers((prev) => [transfer, ...prev]);

    const result = fifoEngine.executeFifoTransfer(
      transfer,
      inventoryLots,
      transfer.createdBy || 'Nguyễn Văn An (Kho)'
    );

    if (result.success) {
      setInventoryLots(result.updatedLayers);
      setStockTransactions((prev) => [...result.generatedTransactions, ...prev]);
      setAuditLogs((prev) => [...result.auditLogs, ...prev]);
      setProducts((prev) => fifoEngine.syncProductsWithLayers(prev, result.updatedLayers));
    }
  };

  // 6. Stocktake Handler
  const handleSaveStocktake = (stocktake: Stocktake) => {
    setStocktakes((prev) => [stocktake, ...prev]);

    const result = fifoEngine.executeStocktake(
      stocktake,
      inventoryLots,
      stocktake.createdBy || 'Lê Hoàng Nam (Kiểm kê viên)'
    );

    if (result.success) {
      setInventoryLots(result.updatedLayers);
      setStockTransactions((prev) => [...result.generatedTransactions, ...prev]);
      setAuditLogs((prev) => [...result.auditLogs, ...prev]);
      setProducts((prev) => fifoEngine.syncProductsWithLayers(prev, result.updatedLayers));
    }
  };

  // Supplier & Customer Management Handlers
  const handleAddSupplier = (newSup: Supplier) => {
    setSuppliers((prev) => [newSup, ...prev]);
  };

  const handleUpdateSupplier = (updatedSup: Supplier) => {
    setSuppliers((prev) => prev.map((s) => (s.id === updatedSup.id ? updatedSup : s)));
  };

  const handleDeleteSupplier = (supplierId: string) => {
    const target = suppliers.find((s) => s.id === supplierId);
    if (!target) return;

    setSuppliers((prev) => prev.filter((s) => s.id !== supplierId));

    const newAudit: AuditLog = {
      id: `AUDIT-DEL-SUP-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'USR-01',
      userName: 'Quản trị viên',
      action: 'cancelled',
      referenceType: 'PO',
      referenceId: target.id,
      description: `Đã xóa nhà cung cấp ${target.name} (${target.code}) khỏi danh mục.`
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  const handleDeletePurchaseOrder = (poId: string, revertInventoryLots = true) => {
    const target = purchaseOrders.find((po) => po.id === poId);
    if (!target) return;

    // 1. Remove PO
    setPurchaseOrders((prev) => prev.filter((po) => po.id !== poId));

    // 2. If requested, revert / remove inventory lots generated by this PO
    if (revertInventoryLots) {
      setInventoryLots((prevLots) => {
        const updated = prevLots.filter(
          (l) => l.receiptCode !== target.code && l.receiptCode !== target.id
        );
        setProducts((currProds) => fifoEngine.syncProductsWithLayers(currProds, updated));
        return updated;
      });
      setStockTransactions((prev) => prev.filter((tx) => tx.docCode !== target.code));
    }

    // 3. Revert supplier debt / stats if applicable
    const debtToReduce = target.debtAmount || (target.paymentStatus === 'unpaid' ? target.totalAmount : 0);
    if (debtToReduce > 0) {
      setSuppliers((prev) =>
        prev.map((s) => {
          if (s.id === target.supplierId || (target.supplierName && s.name.toLowerCase() === target.supplierName.toLowerCase())) {
            return {
              ...s,
              debt: Math.max(0, (s.debt || 0) - debtToReduce),
              totalPurchased: Math.max(0, (s.totalPurchased || 0) - target.totalAmount),
              purchaseOrderCount: Math.max(0, (s.purchaseOrderCount || 1) - 1)
            };
          }
          return s;
        })
      );
    }

    // 4. Audit log
    const newAudit: AuditLog = {
      id: `AUDIT-DEL-PO-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'USR-01',
      userName: 'Quản trị viên',
      action: 'cancelled',
      referenceType: 'PO',
      referenceId: target.id,
      description: `Đã hủy / xóa đơn mua hàng ${target.code} từ NCC ${target.supplierName}.`
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  const handleToggleSupplierStatus = (supplierId: string) => {
    setSuppliers((prev) =>
      prev.map((s) =>
        s.id === supplierId ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
      )
    );
  };

  const handleImportSuppliers = (imported: Supplier[]) => {
    setSuppliers((prev) => [...imported, ...prev]);
  };

  // Product Management Handlers - Official Interface is Phương Án 2 (E-Invoice Entry & Inventory Classification)
  const handleOpenCreateProduct = () => {
    setProductToEdit(null);
    setIsEInvoiceEntryOpen(true);
  };

  const handleOpenEditProduct = (prod: Product) => {
    setProductToEdit(prod);
    setIsProductModalOpen(true);
  };

  const handleSaveProduct = (
    prod: Product,
    openingStock?: {
      quantity: number;
      costPrice: number;
      warehouseId: string;
      branchId: string;
    }
  ) => {
    setProducts((prev) => {
      const exists = prev.some((p) => p.id === prod.id);
      if (exists) {
        return prev.map((p) => (p.id === prod.id ? prod : p));
      }
      return [prod, ...prev];
    });

    // If product or its variants have opening stock, generate OPENING_BALANCE FIFO Layers
    const lotsToCreate: InventoryLayer[] = [];
    const txsToCreate: StockTransaction[] = [];
    const targetBranchId = openingStock?.branchId || prod.branchId || branches[0]?.id || 'BR01';
    const targetWarehouseId = openingStock?.warehouseId || prod.warehouseId || warehouses[0]?.id || 'WH01';
    const branchObj = branches.find((b) => b.id === targetBranchId);
    const whObj = warehouses.find((w) => w.id === targetWarehouseId);

    // 1. Base product opening lot
    if (openingStock && openingStock.quantity > 0) {
      const newLot: InventoryLayer = {
        id: `LAYER-OPEN-${Date.now()}-0`,
        layerId: `LOT-OPEN-${prod.code}-${Math.floor(100 + Math.random() * 900)}`,
        layerType: 'OPENING_BALANCE',
        sku: prod.sku,
        productId: prod.productId,
        productCode: prod.code,
        productName: prod.name,
        variantName: prod.variant,
        unit: prod.unit,
        packSize: String(prod.packSize || '1'),
        branchId: targetBranchId,
        branchName: branchObj?.name || 'Tổng kho Miền Bắc',
        warehouseId: targetWarehouseId,
        warehouseName: whObj?.name || 'Kho Thép & Kim Khí',
        supplierName: prod.supplierName || 'Tồn đầu kỳ',
        supplierId: prod.supplierId,
        receiptCode: 'OPEN-BAL',
        receivedAt: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        quantityReceived: openingStock.quantity,
        quantityIssued: 0,
        quantityRemaining: openingStock.quantity,
        purchasePrice: openingStock.costPrice,
        salePrice: prod.sellingPrice,
        status: 'active',
        notes: 'Khởi tạo số dư tồn kho đầu kỳ'
      };

      const newTx: StockTransaction = {
        id: `TX-OPEN-${Date.now()}-0`,
        date: new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: 'Điều chỉnh tăng',
        docCode: 'OPEN-BAL',
        sku: prod.sku,
        productId: prod.productId,
        productName: prod.name,
        lotId: newLot.layerId,
        branchId: targetBranchId,
        warehouseId: targetWarehouseId,
        qtyIn: openingStock.quantity,
        qtyOut: 0,
        balance: openingStock.quantity,
        unitCost: openingStock.costPrice,
        totalValue: openingStock.quantity * openingStock.costPrice,
        actor: 'Quản trị viên',
        note: `Khởi tạo số dư ban đầu cho [${prod.sku}]`
      };

      lotsToCreate.push(newLot);
      txsToCreate.push(newTx);
    }

    // 2. Variant opening lots
    if (prod.variants && prod.variants.length > 0) {
      prod.variants.forEach((v, idx) => {
        const vQty = Number(v.importQuantity) || 0;
        if (vQty > 0) {
          const vSku = (v.sku || v.variantSku || `${prod.code}-VAR${idx + 1}`).toUpperCase();
          const vCost = Number(v.costPrice) || Number(prod.costPrice) || 0;
          const vLot: InventoryLayer = {
            id: `LAYER-OPEN-VAR-${Date.now()}-${idx + 1}`,
            layerId: `LOT-OPEN-${vSku}-${Math.floor(100 + Math.random() * 900)}`,
            layerType: 'OPENING_BALANCE',
            sku: vSku,
            productId: prod.productId,
            productCode: prod.code,
            productName: `${prod.name} (${v.variantName})`,
            variantName: v.variantName,
            variantSku: vSku,
            unit: v.unit || prod.unit,
            packSize: String(v.packSize || '1'),
            branchId: targetBranchId,
            branchName: branchObj?.name || 'Tổng kho Miền Bắc',
            warehouseId: targetWarehouseId,
            warehouseName: whObj?.name || 'Kho Thép & Kim Khí',
            supplierName: prod.supplierName || 'Tồn đầu kỳ',
            supplierId: prod.supplierId,
            receiptCode: 'OPEN-BAL',
            receivedAt: new Date().toISOString().split('T')[0],
            createdAt: new Date().toISOString(),
            quantityReceived: vQty,
            quantityIssued: 0,
            quantityRemaining: vQty,
            purchasePrice: vCost,
            salePrice: Number(v.sellingPrice) || prod.sellingPrice,
            status: 'active',
            notes: `Khởi tạo số dư ban đầu biến thể ${v.variantName}`
          };

          const vTx: StockTransaction = {
            id: `TX-OPEN-VAR-${Date.now()}-${idx + 1}`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            type: 'Điều chỉnh tăng',
            docCode: 'OPEN-BAL',
            sku: vSku,
            productId: prod.productId,
            productName: `${prod.name} (${v.variantName})`,
            lotId: vLot.layerId,
            branchId: targetBranchId,
            warehouseId: targetWarehouseId,
            qtyIn: vQty,
            qtyOut: 0,
            balance: vQty,
            unitCost: vCost,
            totalValue: vQty * vCost,
            actor: 'Quản trị viên',
            note: `Khởi tạo số dư ban đầu biến thể [${vSku}]`
          };

          lotsToCreate.push(vLot);
          txsToCreate.push(vTx);
        }
      });
    }

    if (lotsToCreate.length > 0) {
      setInventoryLots((prevLots) => {
        const updated = [...lotsToCreate, ...prevLots];
        setProducts((currentProds) => fifoEngine.syncProductsWithLayers(currentProds, updated));
        return updated;
      });
      setStockTransactions((prev) => [...txsToCreate, ...prev]);
    }
  };

  const handleDeleteProduct = (productId: string) => {
    const target = products.find((p) => p.id === productId);
    if (target) {
      setProductToDelete(target);
    }
  };

  const handleConfirmDeleteProduct = (productId: string, cleanUpEmptyLots = true) => {
    const target = products.find((p) => p.id === productId);
    if (!target) return;

    setProducts((prev) => prev.filter((p) => p.id !== productId));

    if (cleanUpEmptyLots) {
      setInventoryLots((prev) =>
        prev.filter(
          (l) =>
            !(
              (l.sku === target.sku || l.sku === target.variantSku || l.productId === target.productId) &&
              (l.quantityRemaining ?? l.remainingQuantity ?? 0) <= 0
            )
        )
      );
    }

    const newAudit: AuditLog = {
      id: `AUDIT-DEL-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'USR-01',
      userName: 'Quản trị viên',
      action: 'cancelled',
      referenceType: 'ADJUSTMENT',
      referenceId: target.id,
      description: `Đã xóa sản phẩm ${target.name} (${target.sku || target.variantSku}) khỏi danh mục hệ thống.`
    };
    setAuditLogs((prev) => [newAudit, ...prev]);
  };

  const handleSyncEInvoiceSuccess = (
    eInvoice: EInvoiceData,
    options: {
      branchId: string;
      branchName: string;
      warehouseId: string;
      warehouseName: string;
      costBasis: 'before_vat' | 'with_vat';
      createPurchaseOrder: boolean;
      actor: string;
      autoCreateMissingProducts?: boolean;
    }
  ) => {
    // 1. If requested, auto-register missing products in catalog
    if (options.autoCreateMissingProducts) {
      setProducts((prevProds) => {
        const newProds: Product[] = [];
        eInvoice.items.forEach((item, idx) => {
          const matched = prevProds.find(
            (p) => p.sku === item.matchedSku || p.code === item.itemCode || p.name.toLowerCase() === item.itemName.toLowerCase()
          );
          if (!matched) {
            const prodCode = (item.itemCode || `SP-HD-${Date.now().toString().slice(-4)}-${idx + 1}`).toUpperCase();
            const prodSku = (item.matchedSku || prodCode).toUpperCase();
            const brand = eInvoice.sellerName.includes('MediPlus') ? 'MediPlus' : eInvoice.sellerName.includes('Vietcoco') ? 'Vietcoco' : 'Khác';
            const cat = eInvoice.sellerName.includes('MediPlus') ? 'Vật tư phụ kiện' : 'Khác';
            
            newProds.push({
              id: `prod-hd-${Date.now()}-${idx + 1}`,
              productId: `P${String(prevProds.length + newProds.length + 1).padStart(6, '0')}`,
              code: prodCode,
              sku: prodSku,
              variantSku: prodSku,
              name: item.itemName,
              brand,
              category: cat,
              unit: item.unit,
              costPrice: item.unitPrice,
              sellingPrice: Math.round(item.unitPrice * 1.25),
              stock: 0,
              minStock: 10,
              maxStock: 500,
              location: 'Khu A - Kệ 01',
              supplierName: eInvoice.sellerName,
              supplierId: eInvoice.sellerTaxCode,
              branchId: options.branchId,
              warehouseId: options.warehouseId,
              variants: []
            });
          }
        });
        return [...newProds, ...prevProds];
      });
    }

    // 2. Also register supplier if not present
    setSuppliers((prevSups) => {
      const supExists = prevSups.some((s) => s.taxCode === eInvoice.sellerTaxCode);
      if (!supExists) {
        const newSup: Supplier = {
          id: `sup-${Date.now()}`,
          code: `NCC-${eInvoice.sellerTaxCode.slice(-4) || 'HDDT'}`,
          name: eInvoice.sellerName,
          legalName: eInvoice.sellerLegalName || eInvoice.sellerName,
          taxCode: eInvoice.sellerTaxCode,
          address: eInvoice.sellerAddress || 'Hà Nội, Việt Nam',
          phone: '024 3987 6543',
          email: 'contact@partner-supplier.com',
          debt: eInvoice.totalAmountWithVat,
          totalPurchased: eInvoice.totalAmountWithVat,
          purchaseOrderCount: 1,
          suppliedProducts: eInvoice.items.map((i) => i.itemName),
          type: 'company'
        };
        return [newSup, ...prevSups];
      } else {
        return prevSups.map((s) => {
          if (s.taxCode === eInvoice.sellerTaxCode) {
            return {
              ...s,
              debt: (s.debt || 0) + eInvoice.totalAmountWithVat,
              totalPurchased: (s.totalPurchased || 0) + eInvoice.totalAmountWithVat,
              purchaseOrderCount: (s.purchaseOrderCount || 0) + 1
            };
          }
          return s;
        });
      }
    });

    // 3. Create FIFO Layers & PO
    const { newLayers, purchaseOrder, transactions, auditLogs: newAudits } =
      eInvoiceService.createFifoLotsFromEInvoice(eInvoice, options);

    setInventoryLots((prevLots) => {
      const updatedLots = [...newLayers, ...prevLots];
      setProducts((currProds) => fifoEngine.syncProductsWithLayers(currProds, updatedLots));
      return updatedLots;
    });

    if (transactions && transactions.length > 0) {
      setStockTransactions((prev) => [...transactions, ...prev]);
    }

    if (purchaseOrder) {
      setPurchaseOrders((prev) => [purchaseOrder, ...prev]);
    }

    if (newAudits && newAudits.length > 0) {
      setAuditLogs((prev) => [...newAudits, ...prev]);
    }
  };

  const handleProcessEInvoiceEntry = (data: {
    invoiceData?: EInvoiceData;
    eInvoice?: EInvoiceData;
    createdProducts: Product[];
    createdLots: InventoryLayer[];
    createdPO?: PurchaseOrder;
    purchaseOrder?: PurchaseOrder;
    transactions: StockTransaction[];
    debtRecord?: {
      supplierId: string;
      supplierName: string;
      taxCode: string;
      debtIncrease: number;
    };
  }) => {
    const inv = data.invoiceData || data.eInvoice;
    const po = data.createdPO || data.purchaseOrder;

    // 1. Process and merge products
    if (data.createdProducts.length > 0) {
      setProducts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const existingSkus = new Set(prev.map((p) => p.sku));
        const newProductsToAdd = data.createdProducts.filter(
          (p) => !existingIds.has(p.id) && !existingSkus.has(p.sku)
        );

        const updatedProducts = prev.map((p) => {
          const matched = data.createdProducts.find((cp) => cp.id === p.id || cp.sku === p.sku);
          return matched ? { ...p, ...matched } : p;
        });

        const combined = [...newProductsToAdd, ...updatedProducts];
        const allLots = [...data.createdLots, ...inventoryLots];
        return fifoEngine.syncProductsWithLayers(combined, allLots);
      });
    }

    // 2. Add inventory lots
    if (data.createdLots.length > 0) {
      setInventoryLots((prevLots) => {
        const updatedLots = [...data.createdLots, ...prevLots];
        setProducts((currentProducts) => fifoEngine.syncProductsWithLayers(currentProducts, updatedLots));
        return updatedLots;
      });
    }

    // 3. Add PO & update Supplier
    if (po) {
      setPurchaseOrders((prev) => [po, ...prev]);
    }

    if (inv) {
      setSuppliers((prevSups) => {
        const supExists = prevSups.some((s) => s.taxCode === inv.sellerTaxCode);
        if (!supExists) {
          const newSup: Supplier = {
            id: `sup-${Date.now()}`,
            code: `NCC-${inv.sellerTaxCode.slice(-4) || 'HDDT'}`,
            name: inv.sellerName,
            legalName: inv.sellerLegalName || inv.sellerName,
            taxCode: inv.sellerTaxCode,
            address: inv.sellerAddress || 'Việt Nam',
            phone: '024 3987 6543',
            email: 'supplier@einvoice.vn',
            debt: inv.totalAmountWithVat || 0,
            totalPurchased: inv.totalAmountWithVat || 0,
            purchaseOrderCount: 1,
            suppliedProducts: data.createdProducts.map((p) => p.name),
            type: 'company'
          };
          return [newSup, ...prevSups];
        } else {
          return prevSups.map((s) => {
            if (s.taxCode === inv.sellerTaxCode) {
              return {
                ...s,
                debt: (s.debt || 0) + (inv.totalAmountWithVat || 0),
                totalPurchased: (s.totalPurchased || 0) + (inv.totalAmountWithVat || 0),
                purchaseOrderCount: (s.purchaseOrderCount || 0) + 1
              };
            }
            return s;
          });
        }
      });
    }

    // 4. Record stock transactions
    if (data.transactions && data.transactions.length > 0) {
      setStockTransactions((prev) => [...data.transactions, ...prev]);
    }

    // 5. Audit Log
    if (inv) {
      const newAudit: AuditLog = {
        id: `audit-hd-${Date.now()}`,
        timestamp: new Date().toISOString().replace('T', ' ').substring(0, 16),
        userId: 'admin-01',
        userName: 'Quản trị viên',
        action: 'created',
        referenceType: 'PO',
        referenceId: inv.invoiceNumber,
        description: `Nhập thành công HĐĐT #${inv.invoiceNumber} (Ký hiệu ${inv.invoiceSerial}) - MST ${inv.sellerTaxCode}, đã tạo ${data.createdProducts.length} mặt hàng & ${data.createdLots.length} lô kho FIFO`
      };
      setAuditLogs((prev) => [newAudit, ...prev]);
    }
  };

  const handleInvoiceExtractionSuccess = (result: {
    updatedProducts: Product[];
    updatedLayers: InventoryLayer[];
    updatedPOs: PurchaseOrder[];
    updatedOrders: Order[];
    updatedTransactions: StockTransaction[];
    updatedAuditLogs: AuditLog[];
    updatedJournalEntries: JournalEntry[];
  }) => {
    if (result.updatedProducts) setProducts(result.updatedProducts);
    if (result.updatedLayers) setInventoryLots(result.updatedLayers);
    if (result.updatedPOs) setPurchaseOrders(result.updatedPOs);
    if (result.updatedOrders) setOrders(result.updatedOrders);
    if (result.updatedTransactions) setStockTransactions(result.updatedTransactions);
    if (result.updatedAuditLogs) setAuditLogs(result.updatedAuditLogs);
    if (result.updatedJournalEntries) setJournalEntries(result.updatedJournalEntries);
  };

  const handleImportProducts = (importedProducts: Product[]) => {
    setProducts((prev) => [...importedProducts, ...prev]);

    // Automatically create initial FIFO inventory lots for imported products that have stock
    const newLots: InventoryLayer[] = importedProducts
      .filter((p) => (p.stock || 0) > 0)
      .map((p, idx) => ({
        id: `lot-import-${Date.now()}-${idx}`,
        layerId: `LOT-IMP-${p.sku}-${idx + 1}`,
        layerType: 'RECEIPT',
        sku: p.sku,
        variantSku: p.variantSku || p.sku,
        productId: p.productId,
        productCode: p.code,
        productName: p.name,
        variant: p.variant,
        variantName: p.variantName || p.variant,
        packSize: String(p.packSize || '1'),
        unit: p.unit,
        branchId: 'BR01',
        branchName: 'Chi nhánh Chính - Hà Nội',
        warehouseId: 'WH01',
        warehouseName: 'Kho Tổng Hà Nội',
        supplierName: p.brand ? `Thương hiệu ${p.brand}` : 'Vietcoco',
        receiptCode: 'IMP-EXCEL',
        receivedAt: new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        quantityReceived: p.stock || 100,
        initialQuantity: p.stock || 100,
        quantityIssued: 0,
        quantityRemaining: p.stock || 100,
        remainingQuantity: p.stock || 100,
        purchasePrice: p.costPrice || 25000,
        costPrice: p.costPrice || 25000,
        salePrice: p.sellingPrice || 35000,
        status: 'active'
      }));

    if (newLots.length > 0) {
      setInventoryLots((prev) => [...newLots, ...prev]);
    }
  };

  const handleSaveSupplierTask = (task: SupplierTask) => {
    setSupplierTasks((prev) => {
      const exists = prev.find((t) => t.id === task.id);
      if (exists) {
        return prev.map((t) => (t.id === task.id ? task : t));
      }
      return [task, ...prev];
    });
  };

  const handleToggleSupplierTask = (taskId: string) => {
    setSupplierTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
          : t
      )
    );
  };

  const handleDeleteSupplierTask = (taskId: string) => {
    setSupplierTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const handleSaveSupplierPayment = (payment: SupplierPaymentVoucher) => {
    setSupplierPayments((prev) => [payment, ...prev]);

    // Decrease Supplier debt
    setSuppliers((prev) =>
      prev.map((s) => {
        if (s.id === payment.supplierId || s.name.toLowerCase() === payment.supplierName.toLowerCase()) {
          const newDebt = Math.max(0, (s.debt || 0) - payment.amount);
          return { ...s, debt: newDebt };
        }
        return s;
      })
    );

    // Record cashflow out
    const newTx: CashTransaction = {
      id: `tx-sup-pay-${Date.now()}`,
      code: payment.code,
      type: 'chi',
      category: 'Chi trả nợ nhà cung cấp',
      amount: payment.amount,
      description: `Thanh toán tiền hàng cho NCC ${payment.supplierName} (${payment.note || 'Phiếu chi'})`,
      paymentMethod: payment.paymentMethod,
      payerOrPayee: payment.supplierName,
      createdAt: payment.paymentDate,
      referenceCode: payment.referencePoCode || payment.code
    };
    setCashTransactions((prev) => [newTx, ...prev]);
  };

  // Customer Management Handlers
  const handleSaveCustomer = (customer: Customer) => {
    setCustomers((prev) => {
      const index = prev.findIndex((c) => c.id === customer.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = customer;
        return next;
      }
      return [customer, ...prev];
    });
  };

  const handleDeleteCustomer = (customerId: string) => {
    setCustomers((prev) => prev.filter((c) => c.id !== customerId));
  };

  const handleImportCustomers = (importedList: Customer[]) => {
    setCustomers((prev) => [...importedList, ...prev]);
  };

  // CRM Task Handlers
  const handleSaveCrmTask = (task: CrmTask) => {
    setCrmTasks((prev) => {
      const exists = prev.find((t) => t.id === task.id);
      if (exists) {
        return prev.map((t) => (t.id === task.id ? task : t));
      }
      return [task, ...prev];
    });
  };

  const handleToggleCrmTask = (taskId: string) => {
    setCrmTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? { ...t, status: t.status === 'completed' ? 'pending' : 'completed' }
          : t
      )
    );
  };

  const handleCheckinTask = (taskId: string, note = 'Vẫn đang làm') => {
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setCrmTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              lastCheckinDate: nowTime,
              lastCheckinNote: note,
              updatedAt: nowTime,
              status: t.status === 'pending' ? 'in_progress' : t.status
            }
          : t
      )
    );
  };

  const handleBatchCheckinTasks = (taskIds: string[]) => {
    const nowTime = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const targetSet = new Set(taskIds);
    setCrmTasks((prev) =>
      prev.map((t) =>
        targetSet.has(t.id)
          ? {
              ...t,
              lastCheckinDate: nowTime,
              lastCheckinNote: 'Check-in hàng loạt: Vẫn đang làm',
              updatedAt: nowTime,
              status: t.status === 'pending' ? 'in_progress' : t.status
            }
          : t
      )
    );
  };

  const handleDeleteCrmTask = (taskId: string) => {
    setCrmTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  // Special Occasion and Loyalty Handlers
  const handleSaveSpecialOccasion = (occasion: CustomerSpecialOccasion) => {
    setSpecialOccasions((prev) => {
      const exists = prev.some((o) => o.id === occasion.id);
      if (exists) {
        return prev.map((o) => (o.id === occasion.id ? occasion : o));
      }
      return [occasion, ...prev];
    });
  };

  const handleDeleteSpecialOccasion = (occasionId: string) => {
    setSpecialOccasions((prev) => prev.filter((o) => o.id !== occasionId));
  };

  const handleUpdateOccasionStatus = (occasionId: string, updates: Partial<CustomerSpecialOccasion>) => {
    setSpecialOccasions((prev) =>
      prev.map((o) => (o.id === occasionId ? { ...o, ...updates } : o))
    );
  };

  const handleGrantBonusPoints = (customerId: string, points: number, reason: string) => {
    setCustomers((prev) =>
      prev.map((c) => {
        if (c.id === customerId) {
          const newPoints = (c.loyaltyPoints || 0) + points;
          let newTier = c.loyaltyTier || 'standard';
          if (newPoints >= 20000) newTier = 'diamond';
          else if (newPoints >= 10000) newTier = 'platinum';
          else if (newPoints >= 5000) newTier = 'gold';
          else if (newPoints >= 2000) newTier = 'silver';
          else if (newPoints >= 500) newTier = 'bronze';
          return {
            ...c,
            loyaltyPoints: newPoints,
            loyaltyTier: newTier
          };
        }
        return c;
      })
    );

    const targetCust = customers.find((c) => c.id === customerId);
    const newTx: LoyaltyTransaction = {
      id: `lt-${Date.now()}`,
      customerId,
      customerName: targetCust?.name || 'Khách hàng',
      points,
      type: points >= 0 ? 'birthday_bonus' : 'redeem_gift',
      description: reason,
      date: new Date().toISOString().substring(0, 10),
      createdBy: 'Quản trị viên / CSKH'
    };
    setLoyaltyTransactions((prev) => [newTx, ...prev]);
  };

  const handleSaveLoyaltyTransaction = (tx: LoyaltyTransaction) => {
    setLoyaltyTransactions((prev) => [tx, ...prev]);
  };

  const handleAddCashTransaction = (tx: CashTransaction) => {
    setCashTransactions((prev) => [tx, ...prev]);
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
  };

  const handleSaveBankAccount = (account: BankAccount) => {
    setBankAccounts((prev) => {
      const idx = prev.findIndex((b) => b.id === account.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = account;
        return next;
      }
      return [account, ...prev];
    });
  };

  const handleSetDefaultBankAccount = (accountId: string) => {
    setBankAccounts((prev) =>
      prev.map((b) => ({
        ...b,
        isDefault: b.id === accountId
      }))
    );
  };

  const handleToggleBankStatus = (accountId: string) => {
    setBankAccounts((prev) =>
      prev.map((b) =>
        b.id === accountId ? { ...b, status: b.status === 'active' ? 'inactive' : 'active' } : b
      )
    );
  };

  const handleRefreshDiagnosis = async () => {
    setIsDiagnosing(true);
    try {
      const token = AuthService.getActiveToken();
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          metrics,
          inventory: products.map((p) => ({ name: p.name, stock: p.stock, isLow: p.isLowStock })),
          customers: customers.map((c) => ({ name: c.name, debt: c.debt, group: c.group }))
        })
      });
      const data = await response.json();
      if (data.insights && Array.isArray(data.insights)) {
        setInsights(data.insights);
      }
    } catch (err) {
      console.warn('Using local diagnosis engine', err);
    } finally {
      setIsDiagnosing(false);
    }
  };

  // User Management & Auth Session Handlers
  const handleLoginSuccess = (user: UserAccount) => {
    setCurrentUser(user);
    setIsAuthenticated(true);
    setUsers(AuthService.getUsers());
  };

  const handleLogout = () => {
    AuthService.logout(currentUser);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const handleChangeCurrentUser = (user: UserAccount) => {
    AuthService.setCurrentUser(user);
    setCurrentUser(user);
    setIsAuthenticated(true);
  };

  const handleSaveUser = (user: UserAccount) => {
    // Check if adding a new user and tenant has user limit reached
    const isNew = !users.some((u) => u.id === user.id);
    if (isNew && currentUser?.tenantId) {
      const check = SaaSService.canAddUserToTenant(currentUser.tenantId);
      if (!check.allowed) {
        alert(check.message);
        return;
      }
    }

    setUsers((prev) => {
      const exists = prev.some((u) => u.id === user.id);
      const updated = exists ? prev.map((u) => (u.id === user.id ? user : u)) : [user, ...prev];
      AuthService.saveUsers(updated);
      return updated;
    });

    if (currentUser && currentUser.id === user.id) {
      setCurrentUser(user);
      AuthService.setCurrentUser(user);
    }
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => {
      const updated = prev.filter((u) => u.id !== userId);
      AuthService.saveUsers(updated);
      return updated;
    });

    if (currentUser && currentUser.id === userId) {
      handleLogout();
    }
  };

  const lowStockCount = products.filter((p) => p.isLowStock).length;

  // Render LoginView when not authenticated
  if (!isAuthenticated || !currentUser) {
    return (
      <LoginView
        portalMode={portal}
        onSwitchPortal={switchPortal}
        onLoginSuccess={handleLoginSuccess}
        availableUsers={users}
      />
    );
  }

  // BIZONE SUPER ADMIN PORTAL (Accessible ONLY to SUPER_ADMIN role)
  if (portal === 'super-admin') {
    if (currentUser.role !== 'super_admin') {
      return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6 text-white font-['Plus_Jakarta_Sans',sans-serif]">
          <div className="max-w-md w-full bg-slate-800/90 border border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-md">
            <div className="w-16 h-16 bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mx-auto border border-rose-500/20">
              <ShieldAlert className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Truy Cập Bị Từ Chối</h2>
              <p className="text-sm text-slate-400 mt-2">
                Cổng Quản Trị Hệ Thống BizOne Super Admin chỉ dành riêng cho tài khoản SUPER_ADMIN của nhà cung cấp. Tài khoản <strong>{currentUser.email}</strong> ({currentUser.roleTitle || currentUser.role}) không có quyền truy cập.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-3">
              <button
                onClick={() => switchPortal('erp')}
                className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl font-bold transition shadow-lg shadow-blue-500/20 cursor-pointer"
              >
                Về Cổng Doanh Nghiệp (BizOne ERP)
              </button>
              <button
                onClick={handleLogout}
                className="w-full py-2.5 px-4 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-xl font-semibold transition cursor-pointer"
              >
                Đăng xuất
              </button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <PlatformAdminView
        currentUser={currentUser}
        onBackToERP={() => switchPortal('erp')}
      />
    );
  }

  // BIZONE ERP PORTAL (For Customer Tenant Admins and Users)

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex text-slate-800 font-['Plus_Jakarta_Sans',sans-serif] overflow-x-hidden">
      {/* Sticky Left Sidebar / Mobile Drawer */}
      <Sidebar
        currentView={currentView}
        onSelectView={setCurrentView}
        lowStockCount={lowStockCount}
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen overflow-x-hidden">
        {/* Top Header */}
        <Header
          onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          unreadAlertsCount={lowStockCount > 0 ? 2 : 0}
          onToggleMobileMenu={() => setIsMobileMenuOpen((prev) => !prev)}
          currentUser={currentUser}
          users={users}
          onChangeCurrentUser={handleChangeCurrentUser}
          onLogout={handleLogout}
          onNavigateToSettings={() => setCurrentView('settings')}
        />

        {/* View Routing */}
        <main className="flex-1 overflow-y-auto pb-12">
          <ProtectedViewGuard
            view={currentView}
            currentUser={currentUser}
            onNavigateHome={() => setCurrentView('dashboard')}
            onSwitchUser={() => setIsAuthenticated(false)}
          >
            {currentView === 'enterprise-planning' && (
            <div className="p-4 sm:p-6 max-w-7xl mx-auto">
              <EnterprisePlanningView
                plans={plans}
                setPlans={setPlans}
                kpis={kpis}
                setKpis={setKpis}
                actionPlans={actionPlans}
                setActionPlans={setActionPlans}
                workCategories={workCategories}
                setWorkCategories={setWorkCategories}
                alerts={enterpriseAlerts}
                forecasts={enterpriseForecasts}
                scorecards={scorecards}
                orders={orders}
                customers={customers}
                crmTasks={crmTasks}
                cashTransactions={cashTransactions}
                inventoryLayers={inventoryLots}
                purchaseOrders={purchaseOrders}
                users={users}
                currentUser={currentUser}
                onNavigateToTask={(taskId) => {
                  setCurrentView('crm');
                  const t = crmTasks.find((item) => item.id === taskId);
                  if (t) setTaskToEdit(t);
                }}
                onNavigateToCustomer={(custId) => {
                  const c = customers.find((item) => item.id === custId);
                  if (c) {
                    setSelectedCustomerDetail(c);
                  }
                }}
              />
            </div>
          )}

          {currentView === 'dashboard' && (
            <DashboardView
              metrics={metrics}
              insights={insights}
              orders={orders}
              products={products}
              inventoryLots={inventoryLots}
              stockTransactions={stockTransactions}
              warehouses={warehouses}
              branches={branches}
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              customers={customers}
              crmTasks={crmTasks}
              cashTransactions={cashTransactions}
              users={users}
              currentUser={currentUser}
              onNavigateToView={(view, filter) => {
                setCurrentView(view as any);
                if (filter) setSearchTerm(filter);
              }}
              onOpenCreatePO={handleOpenCreatePO}
              onOpenCrmTask={handleOpenCrmTask}
              onViewAllOrders={() => setCurrentView('orders')}
              onSelectOrder={handleOpenOrderDetail}
              onRefreshDiagnosis={handleRefreshDiagnosis}
              isDiagnosing={isDiagnosing}
              onOpenVietQrModal={handleOpenVietQrModal}
              onEditProduct={handleOpenEditProduct}
            />
          )}

          {currentView === 'pos' && (
            <PosView
              products={products}
              customers={customers}
              inventoryLots={inventoryLots}
              onCompleteSale={handleAddOrder}
              onOpenVietQr={handleOpenVietQrModal}
            />
          )}

          {currentView === 'orders' && (
            <OrdersView
              orders={scopedOrders}
              onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
              onSelectOrder={handleOpenOrderDetail}
              onOpenVietQr={handleOpenVietQrModal}
            />
          )}

          {currentView === 'inventory' && (
            <InventoryView
              products={products}
              inventoryLots={inventoryLots}
              stockTransactions={stockTransactions}
              onOpenCreatePO={handleOpenCreatePO}
              onOpenStockAdjustment={() => setIsStockAdjustmentOpen(true)}
              onNavigateToStockCards={() => setCurrentView('stockcards')}
              onNavigateToFifoLots={() => setCurrentView('warehouse-fifo-lots')}
              onOpenCreateProduct={handleOpenCreateProduct}
              onOpenEditProduct={handleOpenEditProduct}
              onDeleteProduct={handleDeleteProduct}
              onOpenImportProducts={() => setIsProductImportOpen(true)}
              onOpenSyncEInvoice={() => setIsSyncEInvoiceOpen(true)}
              onOpenEInvoiceEntry={() => setIsEInvoiceEntryOpen(true)}
            />
          )}

          {currentView === 'variant-definitions' && (
            <VariantSkuMasterView
              products={products}
              inventoryLots={inventoryLots}
              onAddProduct={(prod) => handleSaveProduct(prod)}
              onUpdateProduct={(prod) => handleSaveProduct(prod)}
              onDeleteProduct={handleDeleteProduct}
              onOpenCreatePO={handleOpenCreatePO}
              onOpenEInvoiceEntry={() => setIsEInvoiceEntryOpen(true)}
            />
          )}

          {currentView === 'warehouse-dashboard' && (
            <WarehouseDashboardView
              products={products}
              inventoryLots={inventoryLots}
              stockTransactions={stockTransactions}
              branches={branches}
              warehouses={warehouses}
              stockIssues={stockIssues}
              stockTransfers={stockTransfers}
              stocktakes={stocktakes}
              selectedBranchId={selectedBranchId}
              onSelectBranch={setSelectedBranchId}
              onNavigateToTab={(v) => setCurrentView(v as ViewMode)}
              onOpenCreatePO={() => setIsCreatePOOpen(true)}
              onOpenCreateIssue={() => setIsCreateIssueOpen(true)}
              onOpenCreateTransfer={() => setIsStockTransferOpen(true)}
              onOpenStocktake={() => setIsStocktakeOpen(true)}
            />
          )}

          {currentView === 'warehouse-issues' && (
            <StockIssuesView
              stockIssues={stockIssues}
              branches={branches}
              warehouses={warehouses}
              products={products}
              onOpenCreateIssue={() => setIsCreateIssueOpen(true)}
            />
          )}

          {currentView === 'warehouse-transfers' && (
            <StockTransferView
              stockTransfers={stockTransfers}
              warehouses={warehouses}
              branches={branches}
              products={products}
              onOpenCreateTransfer={() => setIsStockTransferOpen(true)}
            />
          )}

          {currentView === 'warehouse-stocktakes' && (
            <StocktakeView
              stocktakes={stocktakes}
              warehouses={warehouses}
              branches={branches}
              products={products}
              onOpenStocktake={() => setIsStocktakeOpen(true)}
            />
          )}

          {currentView === 'warehouse-fifo-lots' && (
            <FifoLotsView
              inventoryLots={inventoryLots}
              products={products}
              warehouses={warehouses}
              branches={branches}
              onOpenStockCard={(sku) => {
                setSearchTerm(sku);
                setCurrentView('stockcards');
              }}
              onOpenSyncEInvoice={() => setIsSyncEInvoiceOpen(true)}
            />
          )}

          {currentView === 'warehouse-reports' && (
            <WarehouseReportsView
              products={products}
              inventoryLots={inventoryLots}
              stockTransactions={stockTransactions}
              stockIssues={stockIssues}
              branches={branches}
              warehouses={warehouses}
            />
          )}

          {(currentView === 'stockcards' || (currentView as string) === 'stock-cards') && (
            <StockCardView
              products={products}
              inventoryLots={inventoryLots}
              stockTransactions={stockTransactions}
              onOpenCreatePO={handleOpenCreatePO}
              onOpenStockAdjustment={() => setIsStockAdjustmentOpen(true)}
            />
          )}

          {currentView === 'crm' && (
            <CrmView
              customers={scopedCustomers}
              crmTasks={scopedCrmTasks}
              specialOccasions={specialOccasions}
              loyaltyTransactions={loyaltyTransactions}
              users={users}
              onOpenCreateCustomer={() => {
                setCustomerToEdit(null);
                setIsCustomerModalOpen(true);
              }}
              onOpenEditCustomer={(cust) => {
                setCustomerToEdit(cust);
                setIsCustomerModalOpen(true);
              }}
              onOpenCustomerDetail={(cust) => setSelectedCustomerDetail(cust)}
              onDeleteCustomer={handleDeleteCustomer}
              onOpenCrmTask={handleOpenCrmTask}
              onOpenImportCustomers={() => setIsCustomerImportOpen(true)}
              onOpenCreateOrder={(customerName) => {
                setTargetCustomerForCRM(customerName);
                setIsCreateOrderOpen(true);
              }}
              onToggleTaskComplete={handleToggleCrmTask}
              onDeleteTask={handleDeleteCrmTask}
              onCheckinTask={handleCheckinTask}
              onBatchCheckin={handleBatchCheckinTasks}
              onSaveUser={handleSaveUser}
              onSaveOccasion={handleSaveSpecialOccasion}
              onDeleteOccasion={handleDeleteSpecialOccasion}
              onUpdateOccasionStatus={handleUpdateOccasionStatus}
              onGrantBonusPoints={handleGrantBonusPoints}
              onSaveLoyaltyTransaction={handleSaveLoyaltyTransaction}
            />
          )}

          {currentView === 'suppliers' && (
            <SupplierView
              suppliers={suppliers}
              purchaseOrders={purchaseOrders}
              products={products}
              inventoryLayers={inventoryLots}
              branches={branches}
              warehouses={warehouses}
              supplierTasks={supplierTasks}
              supplierPayments={supplierPayments}
              onAddSupplier={handleAddSupplier}
              onUpdateSupplier={handleUpdateSupplier}
              onDeleteSupplier={handleDeleteSupplier}
              onToggleStatus={handleToggleSupplierStatus}
              onOpenCreatePO={handleOpenCreatePO}
              onSaveSupplierTask={handleSaveSupplierTask}
              onToggleSupplierTask={handleToggleSupplierTask}
              onDeleteSupplierTask={handleDeleteSupplierTask}
              onSaveSupplierPayment={handleSaveSupplierPayment}
              onImportSuppliers={handleImportSuppliers}
            />
          )}

          {currentView === 'purchasing' && (
            <PurchasingView
              purchaseOrders={purchaseOrders}
              suppliers={suppliers}
              products={products}
              inventoryLots={inventoryLots}
              onOpenCreatePO={handleOpenCreatePO}
              onOpenSyncEInvoice={() => setIsSyncEInvoiceOpen(true)}
              onOpenEInvoiceEntry={() => setIsEInvoiceEntryOpen(true)}
              onOpenInvoiceExtraction={() => setIsInvoiceExtractionOpen(true)}
              onDeletePurchaseOrder={handleDeletePurchaseOrder}
              onEditPurchaseOrder={(po) => {
                setPoToEdit(po);
                setIsCreatePOOpen(true);
              }}
            />
          )}

          {currentView === 'cashflow' && (
            <CashflowView
              transactions={scopedCashTransactions}
              onAddTransaction={handleAddCashTransaction}
            />
          )}

          {currentView === 'banking' && (
            <BankingView
              bankAccounts={bankAccounts}
              onSaveBankAccount={handleSaveBankAccount}
              onSetDefaultAccount={handleSetDefaultBankAccount}
              onToggleStatus={handleToggleBankStatus}
            />
          )}

          {currentView === 'pnl' && <PnlView />}

          {currentView === 'users-roles' && (
            <UsersRolesView
              users={users}
              warehouses={warehouses}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              currentUser={currentUser || users[0]}
            />
          )}

          {currentView === 'ai-assistant' && (
            <AiAssistantView
              metrics={metrics}
              insights={insights}
              products={products}
              customers={customers}
              onOpenCreatePO={handleOpenCreatePO}
              onOpenCrmTask={handleOpenCrmTask}
              onRefreshDiagnosis={handleRefreshDiagnosis}
              isDiagnosing={isDiagnosing}
            />
          )}

          {currentView === 'beverages' && <BeveragesView />}

          {currentView === 'marketing' && <MarketingView />}

          {currentView === 'api-integrations' && <ApiIntegrationsView />}

          {currentView === 'settings' && (
            <SettingsView
              users={users}
              onSaveUser={handleSaveUser}
              onDeleteUser={handleDeleteUser}
              currentUser={currentUser || users[0]}
            />
          )}
          </ProtectedViewGuard>
        </main>
      </div>

      {/* Global Modals */}
      <CreateOrderModal
        isOpen={isCreateOrderOpen}
        onClose={() => setIsCreateOrderOpen(false)}
        products={products}
        customers={customers}
        inventoryLots={inventoryLots}
        suppliers={suppliers}
        warehouses={warehouses}
        branches={branches}
        onAddOrder={handleAddOrder}
        onQuickAddCustomer={handleSaveCustomer}
        onQuickAddSupplier={handleAddSupplier}
        onQuickAddProduct={handleSaveProduct}
      />

      <CreatePurchaseModal
        isOpen={isCreatePOOpen}
        onClose={() => {
          setIsCreatePOOpen(false);
          setPoToEdit(null);
        }}
        poToEdit={poToEdit}
        defaultProductName={targetProductForPO}
        products={products}
        suppliers={suppliers}
        branches={branches}
        warehouses={warehouses}
        onAddPurchaseOrder={handleAddPurchaseOrder}
        onUpdatePurchaseOrder={handleUpdatePurchaseOrder}
        onQuickAddSupplier={handleAddSupplier}
      />

      <StockAdjustmentModal
        isOpen={isStockAdjustmentOpen}
        onClose={() => setIsStockAdjustmentOpen(false)}
        products={products}
        inventoryLots={inventoryLots}
        onPerformAdjustment={handleStockAdjustment}
      />

      <CreateIssueModal
        isOpen={isCreateIssueOpen}
        onClose={() => setIsCreateIssueOpen(false)}
        products={products}
        inventoryLots={inventoryLots}
        warehouses={warehouses}
        branches={branches}
        customers={customers}
        onSaveIssue={handleSaveStockIssue}
      />

      <StockTransferModal
        isOpen={isStockTransferOpen}
        onClose={() => setIsStockTransferOpen(false)}
        products={products}
        inventoryLots={inventoryLots}
        warehouses={warehouses}
        branches={branches}
        onSaveTransfer={handleSaveStockTransfer}
      />

      <StocktakeModal
        isOpen={isStocktakeOpen}
        onClose={() => setIsStocktakeOpen(false)}
        products={products}
        inventoryLots={inventoryLots}
        warehouses={warehouses}
        branches={branches}
        onSaveStocktake={handleSaveStocktake}
      />

      {/* CRM Task Modal */}
      <CrmTaskModal
        isOpen={isCrmTaskOpen}
        onClose={() => {
          setIsCrmTaskOpen(false);
          setTaskToEdit(null);
        }}
        defaultCustomerName={targetCustomerForCRM}
        customers={customers}
        taskToEdit={taskToEdit}
        onSaveTask={handleSaveCrmTask}
      />

      {/* Customer Modals */}
      <CustomerModal
        isOpen={isCustomerModalOpen}
        onClose={() => {
          setIsCustomerModalOpen(false);
          setCustomerToEdit(null);
        }}
        customerToEdit={customerToEdit}
        existingCustomers={customers}
        onSaveCustomer={handleSaveCustomer}
      />

      <CustomerDetailModal
        isOpen={Boolean(selectedCustomerDetail)}
        onClose={() => setSelectedCustomerDetail(null)}
        customer={selectedCustomerDetail}
        orders={orders}
        crmTasks={crmTasks}
        specialOccasions={specialOccasions}
        loyaltyTransactions={loyaltyTransactions}
        onOpenEditCustomer={(cust) => {
          setSelectedCustomerDetail(null);
          setCustomerToEdit(cust);
          setIsCustomerModalOpen(true);
        }}
        onOpenCreateOrder={(custName) => {
          setSelectedCustomerDetail(null);
          setTargetCustomerForCRM(custName);
          setIsCreateOrderOpen(true);
        }}
        onOpenCreateTask={(custName, title) => {
          setSelectedCustomerDetail(null);
          handleOpenCrmTask(custName);
        }}
        onSaveOccasion={handleSaveSpecialOccasion}
        onDeleteOccasion={handleDeleteSpecialOccasion}
        onUpdateOccasionStatus={handleUpdateOccasionStatus}
        onGrantBonusPoints={handleGrantBonusPoints}
        onSaveLoyaltyTransaction={handleSaveLoyaltyTransaction}
      />

      <CustomerImportModal
        isOpen={isCustomerImportOpen}
        onClose={() => setIsCustomerImportOpen(false)}
        onImportCustomers={handleImportCustomers}
        existingCustomers={customers}
      />

      <VietQrModal
        isOpen={isVietQrOpen}
        order={selectedOrderForVietQr}
        onClose={() => {
          setIsVietQrOpen(false);
          setSelectedOrderForVietQr(null);
        }}
        onConfirmPayment={handleConfirmVietQrPayment}
      />

      <OrderDetailModal
        isOpen={isOrderDetailOpen}
        order={selectedOrderForDetail}
        onClose={() => {
          setIsOrderDetailOpen(false);
          setSelectedOrderForDetail(null);
        }}
        onOpenVietQr={handleOpenVietQrModal}
        onUpdateStatus={handleUpdateOrderStatus}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        orders={orders}
        products={products}
        customers={customers}
        onSelectView={setCurrentView}
        onSelectOrder={handleOpenOrderDetail}
        onOpenCreateOrder={() => setIsCreateOrderOpen(true)}
      />

      {/* Product Modal for Add / Edit Product & Opening FIFO Balance */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => {
          setIsProductModalOpen(false);
          setProductToEdit(null);
        }}
        productToEdit={productToEdit}
        existingProducts={products}
        suppliers={suppliers}
        warehouses={warehouses}
        branches={branches}
        onSaveProduct={handleSaveProduct}
        onOpenEInvoiceEntry={() => {
          setIsProductModalOpen(false);
          setIsEInvoiceEntryOpen(true);
        }}
      />

      {/* Product Import Modal from Excel/CSV */}
      <ProductImportModal
        isOpen={isProductImportOpen}
        onClose={() => setIsProductImportOpen(false)}
        onImportProducts={handleImportProducts}
        existingProducts={products}
      />

      {/* Sync Electronic Invoice (HĐĐT) Modal */}
      <SyncEInvoiceModal
        isOpen={isSyncEInvoiceOpen}
        onClose={() => setIsSyncEInvoiceOpen(false)}
        products={products}
        suppliers={suppliers}
        branches={branches}
        warehouses={warehouses}
        onSyncSuccess={handleSyncEInvoiceSuccess}
      />

      {/* E-Invoice Direct Entry Modal (Phương Án 2 - Nhập Toàn Diện HĐĐT) */}
      <EInvoiceEntryModal
        isOpen={isEInvoiceEntryOpen}
        onClose={() => setIsEInvoiceEntryOpen(false)}
        existingProducts={products}
        existingSuppliers={suppliers}
        branches={branches}
        warehouses={warehouses}
        onProcessEInvoice={handleProcessEInvoiceEntry}
      />

      {/* AI e-Invoice PDF Extraction & Accounting Modal */}
      <InvoiceExtractionModal
        isOpen={isInvoiceExtractionOpen}
        onClose={() => setIsInvoiceExtractionOpen(false)}
        products={products}
        inventoryLayers={inventoryLots}
        purchaseOrders={purchaseOrders}
        orders={orders}
        stockTransactions={stockTransactions}
        auditLogs={auditLogs}
        journalEntries={journalEntries}
        currentUser={{ name: currentUser?.name || 'Kế toán trưởng / Admin', email: currentUser?.email || 'admin@wiup.vn' }}
        onPostingSuccess={handleInvoiceExtractionSuccess}
        onQuickAddProduct={(draft) => {
          setIsInvoiceExtractionOpen(false);
          setIsProductModalOpen(true);
        }}
      />

      {/* Safe Delete Product Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(productToDelete)}
        onClose={() => setProductToDelete(null)}
        product={productToDelete}
        inventoryLots={inventoryLots}
        onConfirmDelete={handleConfirmDeleteProduct}
      />
    </div>
  );
}
