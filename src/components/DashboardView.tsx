import React, { useState } from 'react';
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
import { DashboardDataSummaryPanel, DashboardSummaryData, DashboardSummaryKey } from './Dashboard/DashboardDataSummaryPanel';
import { DashboardInventoryDataFlow, InventoryFlowNodeKey } from './Dashboard/DashboardInventoryDataFlow';

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

const KPI_KEYS: Array<{ key: DashboardSummaryKey; vi: string; en: string }> = [
  { key: 'kpi-rev', vi: 'DOANH THU THUẦN', en: 'NET REVENUE' },
  { key: 'kpi-profit', vi: 'LỢI NHUẬN GỘP', en: 'GROSS PROFIT' },
  { key: 'kpi-cash', vi: 'THANH KHOẢN TIỀN MẶT', en: 'CASH LIQUIDITY' },
  { key: 'kpi-debt', vi: 'CÔNG NỢ PHẢI THU', en: 'ACCOUNTS RECEIVABLE' },
  { key: 'kpi-inv', vi: 'TỒN KHO & FIFO', en: 'INVENTORY & FIFO' },
  { key: 'kpi-order', vi: 'TỔNG ĐƠN HÀNG', en: 'TOTAL ORDERS' },
  { key: 'kpi-cust', vi: 'KHÁCH HÀNG MỚI', en: 'NEW CUSTOMERS' },
  { key: 'kpi-prod', vi: 'SẢN LƯỢNG NHÀ MÁY', en: 'FACTORY OUTPUT' },
  { key: 'kpi-otif', vi: 'GIAO HÀNG OTIF', en: 'OTIF DELIVERY' },
  { key: 'kpi-cskh', vi: 'HÀI LÒNG CSAT', en: 'CSAT SCORE' },
  { key: 'kpi-cost', vi: 'TIẾT KIỆM CHI PHÍ', en: 'COST SAVING' },
  { key: 'kpi-overall', vi: 'KPI TỔNG THỂ', en: 'COMPANY KPI' }
];

const findKpiKey = (text: string): DashboardSummaryKey | null => {
  const normalized = text.replace(/\s+/g, ' ').trim().toUpperCase();
  const match = KPI_KEYS.find((item) => normalized.includes(item.vi) || normalized.includes(item.en));
  return match?.key || null;
};

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
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);

  const buildFlowSummary = (key: InventoryFlowNodeKey): DashboardSummaryData => {
    const labels: Record<InventoryFlowNodeKey, { title: string; description: string; summaryKey: DashboardSummaryKey }> = {
      'product-master': { title: 'Product Master', description: 'Danh mục gốc cung cấp thông tin sản phẩm cho SKU và các nghiệp vụ phía sau.', summaryKey: 'kpi-inv' },
      sku: { title: 'SKU', description: 'SKU là đơn vị quản trị tồn kho, giá vốn và giao dịch bán/mua.', summaryKey: 'kpi-inv' },
      warehouse: { title: 'Warehouse', description: `Dữ liệu tồn đang được tổng hợp theo ${warehouses.length.toLocaleString('vi-VN')} kho/địa điểm hiện có.`, summaryKey: 'kpi-inv' },
      ledger: { title: 'Inventory Ledger', description: `Sổ giao dịch là lớp nguồn cho biến động tồn kho. ${stockTransactions.length.toLocaleString('vi-VN')} giao dịch hiện có trong dữ liệu Dashboard.`, summaryKey: 'kpi-inv' },
      fifo: { title: 'FIFO Layers', description: 'Các lớp FIFO hiện hữu là nguồn xác định giá trị tồn và giá vốn theo nguyên tắc nhập trước – xuất trước.', summaryKey: 'kpi-inv' },
      stock: { title: 'Stock Balance', description: 'Tồn hiện tại được trình bày từ các lớp tồn còn lại; Summary không ghi trực tiếp vào số dư.', summaryKey: 'kpi-inv' },
      cogs: { title: 'COGS', description: 'Giá vốn hàng bán được liên kết với FIFO để phục vụ phân tích lợi nhuận gộp.', summaryKey: 'kpi-profit' },
      profit: { title: 'Gross Profit', description: 'Lợi nhuận gộp = Doanh thu thuần − COGS. Đây là lớp kết quả cuối của chuỗi Inventory → Profit.', summaryKey: 'kpi-profit' }
    };
    const item = labels[key];
    return {
      key: item.summaryKey,
      title: item.title,
      actual: 'Theo dữ liệu hiện tại',
      plan: 'Theo kỳ đã chọn',
      gap: 'Xem theo kỳ đã chọn',
      achievementRate: 0,
      status: 'good',
      description: item.description
    };
  };

  const handleDashboardClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    const target = event.target as HTMLElement | null;
    const button = target?.closest('button');
    if (!button || !button.closest('#enterprise-executive-control-tower')) return;

    const key = findKpiKey(button.textContent || '');
    if (!key) return;

    const title = KPI_KEYS.find((item) => item.key === key)?.vi || key;
    const inventoryValue = inventoryLots.reduce((sum, lot) => {
      const qty = Number(lot.quantityRemaining ?? lot.remainingQuantity ?? 0) || 0;
      const cost = Number(lot.purchasePrice ?? lot.costPrice ?? 0) || 0;
      return sum + qty * cost;
    }, 0);

    const kpiActual = button.querySelector('.text-base, .sm\\:text-lg')?.textContent?.trim() || '—';
    const achievement = button.textContent?.match(/(\d+(?:\.\d+)?)%/)?.[1];

    const data: DashboardSummaryData = {
      key,
      title,
      actual: key === 'kpi-inv' ? `${inventoryValue.toLocaleString('vi-VN')} đ` : kpiActual,
      plan: 'Theo KPI hiện hành',
      gap: 'Xem theo kỳ đã chọn',
      achievementRate: Number(achievement || 0),
      status: button.className.includes('rose') ? 'critical' : button.className.includes('amber') ? 'warning' : 'good',
      description:
        key === 'kpi-inv'
          ? 'Tóm tắt trực tiếp từ dữ liệu tồn kho hiện tại. Click chỉ mở Summary tại Dashboard; không chuyển tab.'
          : 'Tóm tắt KPI tại Dashboard. Chi tiết sâu chỉ mở khi người dùng chủ động chọn “Xem chi tiết”.'
    };

    event.preventDefault();
    event.stopPropagation();
    setSummary(data);
  };

  return (
    <div
      className="p-3.5 sm:p-5 md:p-6 lg:p-8 space-y-4 max-w-[1680px] mx-auto"
      onClickCapture={handleDashboardClickCapture}
    >
      {summary && (
        <DashboardDataSummaryPanel
          data={summary}
          products={products}
          inventoryLots={inventoryLots}
          onClose={() => setSummary(null)}
          onViewDetail={(key) => {
            setSummary(null);
            if (key === 'kpi-inv') onNavigateToView?.('warehouse-dashboard');
            if (key === 'kpi-profit') onNavigateToView?.('finance-dashboard');
          }}
        />
      )}

      <DashboardInventoryDataFlow onSelect={(key) => setSummary(buildFlowSummary(key))} />

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