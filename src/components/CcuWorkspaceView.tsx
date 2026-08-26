import React, { useState, useEffect } from 'react';
import {
  Boxes,
  Package,
  Warehouse as WarehouseIcon,
  Truck,
  Coffee,
  ScrollText,
  Layers,
  ArrowRightLeft,
  ClipboardCheck,
  Building2,
  Tag,
  ShieldCheck
} from 'lucide-react';
import {
  Product,
  InventoryLayer,
  StockTransaction,
  Warehouse,
  Branch,
  Supplier,
  PurchaseOrder,
  StockIssue,
  StockTransfer,
  Stocktake,
  UserAccount,
  SupplierTask,
  SupplierPaymentVoucher,
  Order
} from '../types';
import { VariantSkuMasterView } from './VariantSkuMasterView';
import { InventoryView } from './InventoryView';
import { WarehouseDashboardView } from './WarehouseDashboardView';
import { PurchasingView } from './PurchasingView';
import { SupplierView } from './SupplierView';
import { BeveragesView } from './BeveragesView';
import { StockCardView } from './StockCardView';
import { FifoLotsView } from './FifoLotsView';
import { SalesReturnsView } from './Sales/SalesReturnsView';
import { RotateCcw, FileSpreadsheet } from 'lucide-react';
import { SalesReturn } from '../types';

export type CcuSubTab = 'products' | 'inventory' | 'warehouses' | 'purchasing' | 'suppliers' | 'recipes' | 'returns' | 'fifo_lots' | 'stockcards';

interface CcuWorkspaceViewProps {
  initialTab?: CcuSubTab;
  products: Product[];
  inventoryLots: InventoryLayer[];
  stockTransactions: StockTransaction[];
  warehouses: Warehouse[];
  branches: Branch[];
  suppliers: Supplier[];
  purchaseOrders: PurchaseOrder[];
  stockIssues: StockIssue[];
  stockTransfers: StockTransfer[];
  stocktakes: Stocktake[];
  supplierTasks: SupplierTask[];
  supplierPayments: SupplierPaymentVoucher[];
  orders: Order[];
  salesReturns?: SalesReturn[];
  currentUser?: UserAccount;
  onOpenCreatePO: (productName?: string) => void;
  onOpenStockAdjustment: () => void;
  onOpenCreateProduct: () => void;
  onOpenEditProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onSaveProduct: (product: Partial<Product>) => void;
  onOpenImportProducts: () => void;
  onOpenSyncEInvoice: () => void;
  onOpenEInvoiceEntry: () => void;
  onOpenInvoiceExtraction: () => void;
  onDeletePurchaseOrder: (id: string) => void;
  onEditPurchaseOrder: (po: PurchaseOrder) => void;
  onAddSupplier: (s: Partial<Supplier>) => void;
  onUpdateSupplier: (s: Supplier) => void;
  onDeleteSupplier: (id: string) => void;
  onToggleSupplierStatus: (id: string) => void;
  onSaveSupplierTask: (task: SupplierTask) => void;
  onToggleSupplierTask: (taskId: string) => void;
  onDeleteSupplierTask: (taskId: string) => void;
  onSaveSupplierPayment: (payment: SupplierPaymentVoucher) => void;
  onImportSuppliers: (list: Partial<Supplier>[]) => void;
  onAddOrder: (order: Order) => void;
  onProcessReturn?: (
    salesReturn: SalesReturn,
    updatedOrder: Order,
    updatedLayers: InventoryLayer[],
    transactions: StockTransaction[],
    cashTx?: any
  ) => void;
  onOpenCreateIssue: () => void;
  onOpenCreateTransfer: () => void;
  onOpenStocktake: () => void;
}

export const CcuWorkspaceView: React.FC<CcuWorkspaceViewProps> = ({
  initialTab = 'products',
  products = [],
  inventoryLots = [],
  stockTransactions = [],
  warehouses = [],
  branches = [],
  suppliers = [],
  purchaseOrders = [],
  stockIssues = [],
  stockTransfers = [],
  stocktakes = [],
  supplierTasks = [],
  supplierPayments = [],
  orders = [],
  salesReturns = [],
  currentUser,
  onOpenCreatePO,
  onOpenStockAdjustment,
  onOpenCreateProduct,
  onOpenEditProduct,
  onDeleteProduct,
  onSaveProduct,
  onOpenImportProducts,
  onOpenSyncEInvoice,
  onOpenEInvoiceEntry,
  onOpenInvoiceExtraction,
  onDeletePurchaseOrder,
  onEditPurchaseOrder,
  onAddSupplier,
  onUpdateSupplier,
  onDeleteSupplier,
  onToggleSupplierStatus,
  onSaveSupplierTask,
  onToggleSupplierTask,
  onDeleteSupplierTask,
  onSaveSupplierPayment,
  onImportSuppliers,
  onAddOrder,
  onProcessReturn,
  onOpenCreateIssue,
  onOpenCreateTransfer,
  onOpenStocktake
}) => {
  const [activeTab, setActiveTab] = useState<CcuSubTab>(initialTab);
  const [selectedBranchId, setSelectedBranchId] = useState<string>('ALL');

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  return (
    <div id="ccu-workspace-container" className="space-y-4 p-3 sm:p-5 max-w-[1600px] mx-auto">
      {/* Top Workspace Tab Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          <button
            id="tab-ccu-products"
            onClick={() => setActiveTab('products')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'products'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            <span>Sản phẩm & SKU</span>
          </button>

          <button
            id="tab-ccu-inventory"
            onClick={() => setActiveTab('inventory')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'inventory'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Kho & Tồn kho</span>
          </button>

          <button
            id="tab-ccu-warehouses"
            onClick={() => setActiveTab('warehouses')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'warehouses'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <WarehouseIcon className="w-3.5 h-3.5" />
            <span>Điều phối kho</span>
          </button>

          <button
            id="tab-ccu-purchasing"
            onClick={() => setActiveTab('purchasing')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'purchasing'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Mua hàng & PO</span>
          </button>

          <button
            id="tab-ccu-suppliers"
            onClick={() => setActiveTab('suppliers')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Nhà cung cấp</span>
          </button>

          <button
            id="tab-ccu-recipes"
            onClick={() => setActiveTab('recipes')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'recipes'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Công thức & BOM</span>
          </button>

          <button
            id="tab-ccu-returns"
            onClick={() => setActiveTab('returns')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'returns'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Trả hàng & Nhập lại</span>
          </button>

          <button
            id="tab-ccu-fifo"
            onClick={() => setActiveTab('fifo_lots')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'fifo_lots'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Lô FIFO & HSD</span>
          </button>

          <button
            id="tab-ccu-stockcards"
            onClick={() => setActiveTab('stockcards')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
              activeTab === 'stockcards'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Thẻ kho</span>
          </button>
        </div>

        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 shrink-0">
          <Layers className="w-4 h-4 text-slate-600" />
          <span>Vận hành & CCU</span>
        </div>
      </div>

      {/* Sub-view Routing */}
      {activeTab === 'products' && (
        <VariantSkuMasterView
          products={products}
          tenantId={currentUser?.tenant || 'tenant-001'}
          inventoryLots={inventoryLots}
          orders={orders}
          purchaseOrders={purchaseOrders}
          stockTransactions={stockTransactions}
          onAddProduct={onSaveProduct}
          onUpdateProduct={onSaveProduct}
          onDeleteProduct={onDeleteProduct}
          onOpenCreatePO={onOpenCreatePO}
          onOpenEInvoiceEntry={onOpenEInvoiceEntry}
        />
      )}

      {activeTab === 'inventory' && (
        <InventoryView
          products={products}
          inventoryLots={inventoryLots}
          stockTransactions={stockTransactions}
          onOpenCreatePO={onOpenCreatePO}
          onOpenStockAdjustment={onOpenStockAdjustment}
          onNavigateToStockCards={() => setActiveTab('stockcards')}
          onNavigateToFifoLots={() => setActiveTab('fifo_lots')}
          onOpenCreateProduct={onOpenCreateProduct}
          onOpenEditProduct={onOpenEditProduct}
          onDeleteProduct={onDeleteProduct}
          onOpenImportProducts={onOpenImportProducts}
          onOpenSyncEInvoice={onOpenSyncEInvoice}
          onOpenEInvoiceEntry={onOpenEInvoiceEntry}
        />
      )}

      {activeTab === 'warehouses' && (
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
          onNavigateToTab={(v) => {
            if (v === 'warehouse-fifo-lots') setActiveTab('fifo_lots');
            else if (v === 'stockcards') setActiveTab('stockcards');
          }}
          onOpenCreatePO={() => onOpenCreatePO()}
          onOpenCreateIssue={onOpenCreateIssue}
          onOpenCreateTransfer={onOpenCreateTransfer}
          onOpenStocktake={onOpenStocktake}
        />
      )}

      {activeTab === 'purchasing' && (
        <PurchasingView
          purchaseOrders={purchaseOrders}
          suppliers={suppliers}
          products={products}
          inventoryLots={inventoryLots}
          onOpenCreatePO={onOpenCreatePO}
          onOpenSyncEInvoice={onOpenSyncEInvoice}
          onOpenEInvoiceEntry={onOpenEInvoiceEntry}
          onOpenInvoiceExtraction={onOpenInvoiceExtraction}
          onDeletePurchaseOrder={onDeletePurchaseOrder}
          onEditPurchaseOrder={onEditPurchaseOrder}
        />
      )}

      {activeTab === 'suppliers' && (
        <SupplierView
          suppliers={suppliers}
          purchaseOrders={purchaseOrders}
          products={products}
          inventoryLayers={inventoryLots}
          branches={branches}
          warehouses={warehouses}
          supplierTasks={supplierTasks}
          supplierPayments={supplierPayments}
          onAddSupplier={onAddSupplier}
          onUpdateSupplier={onUpdateSupplier}
          onDeleteSupplier={onDeleteSupplier}
          onToggleStatus={onToggleSupplierStatus}
          onOpenCreatePO={onOpenCreatePO}
          onSaveSupplierTask={onSaveSupplierTask}
          onToggleSupplierTask={onToggleSupplierTask}
          onDeleteSupplierTask={onDeleteSupplierTask}
          onSaveSupplierPayment={onSaveSupplierPayment}
          onImportSuppliers={onImportSuppliers}
        />
      )}

      {activeTab === 'recipes' && (
        <BeveragesView
          onAddOrder={onAddOrder}
          tenantId={currentUser?.tenant || 'TENANT-DEFAULT'}
          actorName={currentUser?.name || 'Quản trị viên'}
        />
      )}

      {activeTab === 'returns' && (
        <SalesReturnsView
          orders={orders}
          returns={salesReturns}
          inventoryLots={inventoryLots}
          onProcessReturn={onProcessReturn || (() => {})}
          actorName={currentUser?.name || 'Quản trị viên'}
        />
      )}

      {activeTab === 'fifo_lots' && (
        <FifoLotsView
          inventoryLots={inventoryLots}
          products={products}
          warehouses={warehouses}
          branches={branches}
          onOpenStockCard={() => setActiveTab('stockcards')}
          onOpenSyncEInvoice={onOpenSyncEInvoice}
        />
      )}

      {activeTab === 'stockcards' && (
        <StockCardView
          products={products}
          inventoryLots={inventoryLots}
          stockTransactions={stockTransactions}
          onOpenCreatePO={onOpenCreatePO}
          onOpenStockAdjustment={onOpenStockAdjustment}
        />
      )}

      {activeTab === 'stockcards' && (
        <StockCardView
          products={products}
          inventoryLots={inventoryLots}
          stockTransactions={stockTransactions}
          onOpenCreatePO={onOpenCreatePO}
          onOpenStockAdjustment={onOpenStockAdjustment}
        />
      )}
    </div>
  );
};
