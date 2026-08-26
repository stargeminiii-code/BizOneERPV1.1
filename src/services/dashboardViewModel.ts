import {
  Order,
  Product,
  InventoryLayer,
  Customer,
  CashTransaction,
  PurchaseOrder,
  Warehouse,
  Supplier,
  UserAccount,
  DashboardViewModel,
  ExecutivePrimaryKpi,
  RevenueOrdersChartPoint,
  ChannelPerformanceMetric,
  ProductPerformanceMetric,
  InventorySnapshotData,
  InventoryAgingBucketData,
  FinanceSnapshotData,
  MarketplaceFinanceItem,
  CrmSnapshotData,
  ExecutiveAlertItem,
  InventoryAgingBucket,
  BizOneSalesChannel
} from '../types';

export interface DashboardFilterOptions {
  timePeriod: 'today' | '7days' | 'month' | 'quarter' | 'year' | 'custom';
  customStartDate?: string;
  customEndDate?: string;
  branchId?: string; // 'ALL' or specific ID
  warehouseId?: string; // 'ALL' or specific ID
  chartGranularity?: 'day' | 'week' | 'month';
}

export interface DashboardCalculationParams {
  orders: Order[];
  products: Product[];
  inventoryLots: InventoryLayer[];
  customers: Customer[];
  cashTransactions: CashTransaction[];
  purchaseOrders?: PurchaseOrder[];
  warehouses?: Warehouse[];
  suppliers?: Supplier[];
  currentUser?: UserAccount | null;
  filters: DashboardFilterOptions;
}

// Canonical List of 14 Channels in BizOne ERP V1.1
export const BIZONE_CHANNELS: Array<{
  id: string;
  canonicalChannel: BizOneSalesChannel;
  name: string;
  category: 'offline_pos' | 'direct_online' | 'marketplace' | 'food_delivery' | 'b2b_wholesale';
  aliases: string[];
  estimatedPlatformFeeRate: number; // DEFAULT ESTIMATION CONFIGURATION (Shopee 9.5%, TikTok 8.5%, Grab 20%, etc.)
}> = [
  { id: 'pos', canonicalChannel: 'POS', name: 'POS / Tại quầy', category: 'offline_pos', aliases: ['pos', 'offline', 'cửa hàng', 'tại quầy', 'counter'], estimatedPlatformFeeRate: 0.01 },
  { id: 'take_away', canonicalChannel: 'TAKE_AWAY', name: 'Take Away / Mang đi', category: 'offline_pos', aliases: ['take away', 'takeaway', 'mang đi', 'mang ve'], estimatedPlatformFeeRate: 0.01 },
  { id: 'website', canonicalChannel: 'WEBSITE', name: 'Website', category: 'direct_online', aliases: ['web', 'website', 'online shop', 'store'], estimatedPlatformFeeRate: 0.02 },
  { id: 'facebook', canonicalChannel: 'FACEBOOK', name: 'Facebook', category: 'direct_online', aliases: ['facebook', 'fb', 'fanpage', 'messenger'], estimatedPlatformFeeRate: 0.02 },
  { id: 'zalo', canonicalChannel: 'ZALO', name: 'Zalo', category: 'direct_online', aliases: ['zalo', 'zalo oa', 'zalo shop'], estimatedPlatformFeeRate: 0.02 },
  { id: 'shopee', canonicalChannel: 'SHOPEE', name: 'Shopee', category: 'marketplace', aliases: ['shopee', 'shopee mall'], estimatedPlatformFeeRate: 0.095 },
  { id: 'tiktok', canonicalChannel: 'TIKTOK_SHOP', name: 'TikTok Shop', category: 'marketplace', aliases: ['tiktok', 'tiktok shop', 'tts'], estimatedPlatformFeeRate: 0.085 },
  { id: 'lazada', canonicalChannel: 'LAZADA', name: 'Lazada', category: 'marketplace', aliases: ['lazada', 'lazmall'], estimatedPlatformFeeRate: 0.08 },
  { id: 'tiki', canonicalChannel: 'TIKI', name: 'Tiki', category: 'marketplace', aliases: ['tiki', 'tikifast'], estimatedPlatformFeeRate: 0.075 },
  { id: 'grabfood', canonicalChannel: 'GRABFOOD', name: 'GrabFood', category: 'food_delivery', aliases: ['grab', 'grabfood', 'grab food'], estimatedPlatformFeeRate: 0.20 },
  { id: 'shopeefood', canonicalChannel: 'SHOPEEFOOD', name: 'ShopeeFood', category: 'food_delivery', aliases: ['shopeefood', 'shopee food', 'now'], estimatedPlatformFeeRate: 0.20 },
  { id: 'befood', canonicalChannel: 'BEFOOD', name: 'BeFood', category: 'food_delivery', aliases: ['befood', 'be food', 'be'], estimatedPlatformFeeRate: 0.18 },
  { id: 'agency', canonicalChannel: 'AGENCY', name: 'Đại lý / Bán buôn', category: 'b2b_wholesale', aliases: ['đại lý', 'wholesale', 'bán sỉ', 'sỉ', 'agency'], estimatedPlatformFeeRate: 0.01 },
  { id: 'b2b', canonicalChannel: 'B2B', name: 'B2B / Xuất khẩu', category: 'b2b_wholesale', aliases: ['b2b', 'doanh nghiệp', 'xuất khẩu', 'export'], estimatedPlatformFeeRate: 0.005 }
];

export function formatVND(value: number): string {
  const v = Math.round(Number(value) || 0);
  return new Intl.NumberFormat('vi-VN').format(v) + ' đ';
}

export function formatCompactVND(value: number): string {
  const v = Math.round(Number(value) || 0);
  const abs = Math.abs(v);
  if (abs >= 1_000_000_000) {
    return (v / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (abs >= 1_000_000) {
    return (v / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (abs >= 1_000) {
    return (v / 1_000).toFixed(0) + 'K';
  }
  return String(v);
}

/**
 * Normalizes an order to one of the 13 BizOne channels
 */
export function resolveOrderChannel(order: Order): string {
  if (order.channel) {
    const raw = order.channel.toLowerCase();
    for (const ch of BIZONE_CHANNELS) {
      if (ch.aliases.some((alias) => raw.includes(alias))) {
        return ch.id;
      }
    }
  }

  // Check creator string (e.g. "Nguyễn Thu Thảo (POS)")
  const creator = (order.creator || '').toLowerCase();
  for (const ch of BIZONE_CHANNELS) {
    if (ch.aliases.some((alias) => creator.includes(alias))) {
      return ch.id;
    }
  }

  // Check note
  const note = (order.note || '').toLowerCase();
  for (const ch of BIZONE_CHANNELS) {
    if (ch.aliases.some((alias) => note.includes(alias))) {
      return ch.id;
    }
  }

  // Default to POS
  return 'pos';
}

/**
 * Parse Order/Layer/Transaction Date to normalized Date object
 */
function parseDate(dateStr?: string): Date {
  if (!dateStr) return new Date('2026-08-16');
  // Handle "YYYY-MM-DD HH:mm" or ISO
  const clean = dateStr.includes(' ') ? dateStr.replace(' ', 'T') : dateStr;
  const d = new Date(clean);
  if (isNaN(d.getTime())) return new Date('2026-08-16');
  return d;
}

function formatDateKey(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getDateRangeForPeriod(
  period: 'today' | '7days' | 'month' | 'quarter' | 'year' | 'custom',
  customStart?: string,
  customEnd?: string,
  referenceDate: Date = new Date('2026-08-16')
): { currentStart: Date; currentEnd: Date; prevStart: Date; prevEnd: Date; label: string } {
  const ref = new Date(referenceDate);
  ref.setHours(23, 59, 59, 999);

  let currentStart = new Date(ref);
  let currentEnd = new Date(ref);
  let prevStart = new Date(ref);
  let prevEnd = new Date(ref);
  let label = 'Hôm nay';

  switch (period) {
    case 'today': {
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);
      prevStart.setDate(prevStart.getDate() - 1);
      prevStart.setHours(0, 0, 0, 0);
      prevEnd.setDate(prevEnd.getDate() - 1);
      prevEnd.setHours(23, 59, 59, 999);
      label = `Hôm nay (${formatDateKey(ref)})`;
      break;
    }
    case '7days': {
      currentStart.setDate(currentStart.getDate() - 6);
      currentStart.setHours(0, 0, 0, 0);
      currentEnd.setHours(23, 59, 59, 999);

      prevEnd = new Date(currentStart);
      prevEnd.setMilliseconds(prevEnd.getMilliseconds() - 1);
      prevStart = new Date(prevEnd);
      prevStart.setDate(prevStart.getDate() - 6);
      prevStart.setHours(0, 0, 0, 0);
      label = '7 ngày qua';
      break;
    }
    case 'month': {
      currentStart = new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
      currentEnd = new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);

      prevStart = new Date(ref.getFullYear(), ref.getMonth() - 1, 1, 0, 0, 0, 0);
      prevEnd = new Date(ref.getFullYear(), ref.getMonth(), 0, 23, 59, 59, 999);
      label = `Tháng ${ref.getMonth() + 1}/${ref.getFullYear()}`;
      break;
    }
    case 'quarter': {
      const q = Math.floor(ref.getMonth() / 3);
      currentStart = new Date(ref.getFullYear(), q * 3, 1, 0, 0, 0, 0);
      currentEnd = new Date(ref.getFullYear(), (q + 1) * 3, 0, 23, 59, 59, 999);

      prevStart = new Date(ref.getFullYear(), (q - 1) * 3, 1, 0, 0, 0, 0);
      prevEnd = new Date(ref.getFullYear(), q * 3, 0, 23, 59, 59, 999);
      label = `Quý ${q + 1}/${ref.getFullYear()}`;
      break;
    }
    case 'year': {
      currentStart = new Date(ref.getFullYear(), 0, 1, 0, 0, 0, 0);
      currentEnd = new Date(ref.getFullYear(), 11, 31, 23, 59, 59, 999);

      prevStart = new Date(ref.getFullYear() - 1, 0, 1, 0, 0, 0, 0);
      prevEnd = new Date(ref.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
      label = `Năm ${ref.getFullYear()}`;
      break;
    }
    case 'custom': {
      if (customStart && customEnd) {
        currentStart = new Date(customStart + 'T00:00:00');
        currentEnd = new Date(customEnd + 'T23:59:59');
        const diffMs = currentEnd.getTime() - currentStart.getTime();
        prevEnd = new Date(currentStart.getTime() - 1);
        prevStart = new Date(prevEnd.getTime() - diffMs);
        label = `${customStart} → ${customEnd}`;
      } else {
        currentStart.setDate(currentStart.getDate() - 30);
        currentStart.setHours(0, 0, 0, 0);
        prevStart.setDate(prevStart.getDate() - 60);
        prevEnd.setDate(prevEnd.getDate() - 31);
        label = 'Tùy chọn';
      }
      break;
    }
  }

  return { currentStart, currentEnd, prevStart, prevEnd, label };
}

/**
 * Main Single Source of Truth Calculator
 */
export function calculateDashboardViewModel(params: DashboardCalculationParams): DashboardViewModel {
  const {
    orders = [],
    products = [],
    inventoryLots = [],
    customers = [],
    cashTransactions = [],
    purchaseOrders = [],
    currentUser,
    filters
  } = params;

  const referenceDate = new Date('2026-08-16T23:59:59');

  // =========================================================================
  // 1. RBAC & DATA SCOPE FILTERING
  // =========================================================================
  const isSuperAdminOrCeo =
    !currentUser ||
    currentUser.role === 'super_admin' ||
    currentUser.role === 'admin' ||
    currentUser.role === 'ceo' ||
    currentUser.dataScope === 'company_wide';

  const userBranchId = currentUser?.branchId;
  const isIndividualScope = currentUser?.dataScope === 'individual';
  const userName = currentUser?.name || '';
  const userUsername = currentUser?.username || '';

  // Filter Orders
  let scopedOrders = orders;
  if (!isSuperAdminOrCeo) {
    if (currentUser?.dataScope === 'division' && userBranchId) {
      scopedOrders = scopedOrders.filter((o) => !o.branchId || o.branchId === userBranchId || o.branchId === 'ALL');
    } else if (isIndividualScope) {
      scopedOrders = scopedOrders.filter((o) => {
        return (
          (o.creator && (o.creator.includes(userName) || (userUsername && o.creator.includes(userUsername)))) ||
          !o.creator
        );
      });
    }
  }

  // Filter by User Selected Branch & Warehouse Filters (SuperAdmin can filter any, Branch user can only filter own)
  if (filters.branchId && filters.branchId !== 'ALL') {
    if (isSuperAdminOrCeo || filters.branchId === userBranchId) {
      scopedOrders = scopedOrders.filter((o) => o.branchId === filters.branchId || !o.branchId);
    }
  }
  if (filters.warehouseId && filters.warehouseId !== 'ALL') {
    scopedOrders = scopedOrders.filter((o) => o.warehouseId === filters.warehouseId || !o.warehouseId);
  }

  // Filter Inventory Lots
  let scopedLots = inventoryLots;
  if (!isSuperAdminOrCeo) {
    if (currentUser?.dataScope === 'division' && userBranchId) {
      scopedLots = scopedLots.filter((l) => !l.branchId || l.branchId === userBranchId || l.branchId === 'ALL');
    }
    if (currentUser?.assignedWarehouseIds && currentUser.assignedWarehouseIds.length > 0) {
      if (!currentUser.assignedWarehouseIds.includes('ALL')) {
        scopedLots = scopedLots.filter((l) => currentUser.assignedWarehouseIds?.includes(l.warehouseId));
      }
    }
  }
  if (filters.warehouseId && filters.warehouseId !== 'ALL') {
    scopedLots = scopedLots.filter((l) => l.warehouseId === filters.warehouseId);
  }
  if (filters.branchId && filters.branchId !== 'ALL') {
    if (isSuperAdminOrCeo || filters.branchId === userBranchId) {
      scopedLots = scopedLots.filter((l) => l.branchId === filters.branchId || !l.branchId);
    }
  }

  // Filter Customers
  let scopedCustomers = customers;
  if (!isSuperAdminOrCeo) {
    if (currentUser?.dataScope === 'division' && userBranchId) {
      scopedCustomers = scopedCustomers.filter((c) => !c.branchId || c.branchId === userBranchId || c.branchId === 'ALL');
    } else if (isIndividualScope) {
      scopedCustomers = scopedCustomers.filter((c) => {
        const isAssigned = c.assignedStaff && (c.assignedStaff.includes(userName) || (userUsername && c.assignedStaff.includes(userUsername)));
        const isCreator = c.creator && (c.creator.includes(userName) || (userUsername && c.creator.includes(userUsername)));
        return isAssigned || isCreator || !c.assignedStaff;
      });
    }
  }

  // Filter Cash Transactions
  let scopedCash = cashTransactions;
  if (!isSuperAdminOrCeo && currentUser?.dataScope === 'division' && userBranchId) {
    scopedCash = scopedCash.filter((c) => !c.branchId || c.branchId === userBranchId || c.branchId === 'ALL');
  }
  if (filters.branchId && filters.branchId !== 'ALL') {
    if (isSuperAdminOrCeo || filters.branchId === userBranchId) {
      scopedCash = scopedCash.filter((c) => c.branchId === filters.branchId || !c.branchId);
    }
  }

  // =========================================================================
  // 2. TIME PERIOD FILTERING (Current Period vs Previous Period)
  // =========================================================================
  const { currentStart, currentEnd, prevStart, prevEnd, label: periodLabel } = getDateRangeForPeriod(
    filters.timePeriod,
    filters.customStartDate,
    filters.customEndDate,
    referenceDate
  );

  const currentPeriodOrders = scopedOrders.filter((o) => {
    const d = parseDate(o.createdAt);
    return d >= currentStart && d <= currentEnd;
  });

  const prevPeriodOrders = scopedOrders.filter((o) => {
    const d = parseDate(o.createdAt);
    return d >= prevStart && d <= prevEnd;
  });

  // Helper functions for V1.1 KPI Semantics
  // Gross Revenue = Tổng giá trị hàng hóa/dịch vụ trước discount/refund
  // Discount = Tổng discount/promotion/voucher do BizOne ghi nhận
  // Refund = Giá trị hoàn trả hợp lệ
  // Net Revenue = Gross Revenue - Discount - Refund
  // COGS = Giá vốn thực tế của hàng đã bán (FIFO issue cost cho Inventory / Recipe consumption cost cho BOM)
  // Gross Profit = Net Revenue - COGS
  // Gross Margin % = Gross Profit / Net Revenue * 100
  // AOV = Net Revenue / Valid Orders
  const getOrderGrossRevenue = (o: Order): number => {
    if (o.subtotal !== undefined && o.subtotal !== null && Number(o.subtotal) > 0) {
      return Number(o.subtotal);
    }
    if (o.items && Array.isArray(o.items) && o.items.length > 0) {
      return o.items.reduce(
        (s, it) => s + (Number(it.totalPrice) || (Number(it.unitPrice) || 0) * (Number(it.quantity) || 0)),
        0
      );
    }
    const ref = Number((o as any).refundAmount) || 0;
    return (Number(o.totalAmount) || 0) + (Number(o.discount) || 0) + ref;
  };

  const getOrderDiscount = (o: Order): number => Number(o.discount) || 0;
  const getOrderRefund = (o: Order): number => Number((o as any).refundAmount) || 0;

  const getOrderNetRevenue = (o: Order): number => {
    const gross = getOrderGrossRevenue(o);
    const disc = getOrderDiscount(o);
    const ref = getOrderRefund(o);
    return Math.max(0, gross - disc - ref);
  };

  const getOrderCogs = (o: Order): number => {
    if (o.cogs !== undefined && o.cogs !== null && Number(o.cogs) > 0) {
      return Number(o.cogs);
    }
    if (o.items && Array.isArray(o.items) && o.items.length > 0) {
      return o.items.reduce((s, it) => s + (Number(it.fifoCost) || 0), 0);
    }
    return 0;
  };

  // Calculate Revenue (Valid non-cancelled orders)
  const isCountableOrder = (o: Order) => o.status !== 'cancelled';

  const currentValidOrders = currentPeriodOrders.filter(isCountableOrder);
  const prevValidOrders = prevPeriodOrders.filter(isCountableOrder);

  // Current period metrics
  const currentGrossRevenue = currentValidOrders.reduce((sum, o) => sum + getOrderGrossRevenue(o), 0);
  const currentDiscount = currentValidOrders.reduce((sum, o) => sum + getOrderDiscount(o), 0);
  const currentRefund = currentValidOrders.reduce((sum, o) => sum + getOrderRefund(o), 0);
  const currentRevenue = Math.max(0, currentGrossRevenue - currentDiscount - currentRefund); // Net Revenue

  // Previous period metrics
  const prevGrossRevenue = prevValidOrders.reduce((sum, o) => sum + getOrderGrossRevenue(o), 0);
  const prevDiscount = prevValidOrders.reduce((sum, o) => sum + getOrderDiscount(o), 0);
  const prevRefund = prevValidOrders.reduce((sum, o) => sum + getOrderRefund(o), 0);
  const prevRevenue = Math.max(0, prevGrossRevenue - prevDiscount - prevRefund); // Net Revenue

  const currentOrderCount = currentValidOrders.length;
  const prevOrderCount = prevValidOrders.length;

  const currentCogs = currentValidOrders.reduce((sum, o) => sum + getOrderCogs(o), 0);
  const prevCogs = prevValidOrders.reduce((sum, o) => sum + getOrderCogs(o), 0);

  const currentGrossProfit = currentRevenue - currentCogs;
  const prevGrossProfit = prevRevenue - prevCogs;

  // Cash / Liquidity calculation in period (Tiền mặt & giao dịch ghi nhận)
  const currentCashIn = scopedCash
    .filter((c) => {
      const d = parseDate(c.createdAt);
      return c.type === 'thu' && d >= currentStart && d <= currentEnd;
    })
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const currentCashOut = scopedCash
    .filter((c) => {
      const d = parseDate(c.createdAt);
      return c.type === 'chi' && d >= currentStart && d <= currentEnd;
    })
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  const netCashFlow = currentCashIn - currentCashOut;

  // Total cash balance across all recorded cash transactions
  const totalCashBalance = scopedCash.reduce((sum, c) => {
    return c.type === 'thu' ? sum + (Number(c.amount) || 0) : sum - (Number(c.amount) || 0);
  }, 0);

  const prevCashIn = scopedCash
    .filter((c) => {
      const d = parseDate(c.createdAt);
      return c.type === 'thu' && d >= prevStart && d <= prevEnd;
    })
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const prevCashOut = scopedCash
    .filter((c) => {
      const d = parseDate(c.createdAt);
      return c.type === 'chi' && d >= prevStart && d <= prevEnd;
    })
    .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const prevNetCashFlow = prevCashIn - prevCashOut;

  // Helper for KPI change percent and trend
  const calcChange = (curr: number, prev: number) => {
    if (prev === 0) {
      if (curr === 0) return { changePercent: 0, trend: 'neutral' as const };
      return { changePercent: 100, trend: 'up' as const };
    }
    const percent = ((curr - prev) / Math.abs(prev)) * 100;
    return {
      changePercent: Math.round(percent * 10) / 10,
      trend: percent > 0.05 ? ('up' as const) : percent < -0.05 ? ('down' as const) : ('neutral' as const)
    };
  };

  const revChange = calcChange(currentRevenue, prevRevenue);
  const ordChange = calcChange(currentOrderCount, prevOrderCount);
  const gpChange = calcChange(currentGrossProfit, prevGrossProfit);
  const cashChange = calcChange(netCashFlow, prevNetCashFlow);

  // =========================================================================
  // 3. 4 PRIMARY KPIS
  // =========================================================================
  const kpis: DashboardViewModel['kpis'] = {
    revenue: {
      id: 'revenue',
      title: 'DOANH THU THUẦN',
      actual: currentRevenue,
      previous: prevRevenue,
      changePercent: revChange.changePercent,
      trend: revChange.trend,
      formattedActual: formatCompactVND(currentRevenue),
      formattedPrevious: formatCompactVND(prevRevenue),
      subtitle: `Gross: ${formatCompactVND(currentGrossRevenue)} | So kỳ trước: ${formatCompactVND(prevRevenue)}`
    },
    orders: {
      id: 'orders',
      title: 'ĐƠN HÀNG HỢP LỆ',
      actual: currentOrderCount,
      previous: prevOrderCount,
      changePercent: ordChange.changePercent,
      trend: ordChange.trend,
      formattedActual: new Intl.NumberFormat('vi-VN').format(currentOrderCount),
      formattedPrevious: new Intl.NumberFormat('vi-VN').format(prevOrderCount),
      subtitle: `So kỳ trước: ${prevOrderCount} đơn`
    },
    grossProfit: {
      id: 'gross_profit',
      title: 'LỢI NHUẬN GỘP',
      actual: currentGrossProfit,
      previous: prevGrossProfit,
      changePercent: gpChange.changePercent,
      trend: gpChange.trend,
      formattedActual: formatCompactVND(currentGrossProfit),
      formattedPrevious: formatCompactVND(prevGrossProfit),
      subtitle: currentRevenue > 0 ? `Margin: ${((currentGrossProfit / currentRevenue) * 100).toFixed(1)}%` : 'Margin: 0%'
    },
    cash: {
      id: 'cash',
      title: 'TIỀN MẶT & GD GHI NHẬN',
      actual: totalCashBalance,
      previous: prevNetCashFlow,
      changePercent: cashChange.changePercent,
      trend: cashChange.trend,
      formattedActual: formatCompactVND(totalCashBalance),
      formattedPrevious: formatCompactVND(prevNetCashFlow),
      subtitle: `Dòng tiền kỳ: ${netCashFlow >= 0 ? '+' : ''}${formatCompactVND(netCashFlow)} (Thu - Chi)`
    }
  };

  // =========================================================================
  // 4. REVENUE & ORDERS CHART (DAY / WEEK / MONTH)
  // =========================================================================
  const granularity = filters.chartGranularity || (filters.timePeriod === 'today' ? 'day' : filters.timePeriod === '7days' ? 'day' : 'day');

  const chartMap = new Map<string, { label: string; fullDate: string; revenue: number; orders: number }>();

  // If granularity is day, populate days in range
  const iterDate = new Date(currentStart);
  iterDate.setHours(0, 0, 0, 0);
  const endLimit = new Date(currentEnd);

  // Safeguard: max 60 buckets
  let dayCount = 0;
  while (iterDate <= endLimit && dayCount < 60) {
    const key = formatDateKey(iterDate);
    const dayLabel = `${iterDate.getDate()}/${iterDate.getMonth() + 1}`;
    chartMap.set(key, { label: dayLabel, fullDate: key, revenue: 0, orders: 0 });
    iterDate.setDate(iterDate.getDate() + 1);
    dayCount++;
  }

  // Populate from valid orders
  currentValidOrders.forEach((o) => {
    const d = parseDate(o.createdAt);
    const key = formatDateKey(d);
    const netRev = getOrderNetRevenue(o);
    const existing = chartMap.get(key);
    if (existing) {
      existing.revenue += netRev;
      existing.orders += 1;
    } else {
      // If outside pre-populated window (e.g. today)
      const dayLabel = `${d.getDate()}/${d.getMonth() + 1}`;
      chartMap.set(key, {
        label: dayLabel,
        fullDate: key,
        revenue: netRev,
        orders: 1
      });
    }
  });

  const chartData: RevenueOrdersChartPoint[] = Array.from(chartMap.values()).map((pt) => ({
    label: pt.label,
    fullDate: pt.fullDate,
    revenue: pt.revenue,
    orders: pt.orders,
    aov: pt.orders > 0 ? Math.round(pt.revenue / pt.orders) : 0
  }));

  const totalAov = currentOrderCount > 0 ? Math.round(currentRevenue / currentOrderCount) : 0;

  // =========================================================================
  // 5. 14-CHANNEL PERFORMANCE BREAKDOWN
  // =========================================================================
  const channelDataMap = new Map<string, { revenue: number; orders: number }>();
  BIZONE_CHANNELS.forEach((ch) => channelDataMap.set(ch.id, { revenue: 0, orders: 0 }));

  currentValidOrders.forEach((o) => {
    const chId = resolveOrderChannel(o);
    const curr = channelDataMap.get(chId) || { revenue: 0, orders: 0 };
    curr.revenue += getOrderNetRevenue(o);
    curr.orders += 1;
    channelDataMap.set(chId, curr);
  });

  const channelPerformance: ChannelPerformanceMetric[] = BIZONE_CHANNELS.map((ch) => {
    const data = channelDataMap.get(ch.id) || { revenue: 0, orders: 0 };
    const contribution = currentRevenue > 0 ? Math.round((data.revenue / currentRevenue) * 1000) / 10 : 0;
    const aov = data.orders > 0 ? Math.round(data.revenue / data.orders) : 0;

    return {
      channelId: ch.id,
      name: ch.name,
      category: ch.category,
      revenue: data.revenue,
      orders: data.orders,
      contributionPercent: contribution,
      avgOrderValue: aov
    };
  }).sort((a, b) => b.revenue - a.revenue);

  // =========================================================================
  // 6. PRODUCT PERFORMANCE (TOP 5 BÁN CHẠY, DOANH THU, LỢI NHUẬN)
  // =========================================================================
  const productAggMap = new Map<string, ProductPerformanceMetric>();

  currentValidOrders.forEach((order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        const prodId = item.productId || item.sku || 'unknown';
        const existing = productAggMap.get(prodId) || {
          productId: prodId,
          sku: item.sku || '',
          name: item.productName || item.sku || 'Sản phẩm',
          category: 'Nông sản & Thực phẩm',
          quantitySold: 0,
          revenue: 0,
          grossProfit: 0,
          unit: item.unit || 'cái'
        };

        const qty = Number(item.quantity) || 0;
        const rev = Number(item.totalPrice) || (Number(item.unitPrice) || 0) * qty;
        const cost = Number(item.fifoCost) || 0;
        const profit = rev - cost;

        existing.quantitySold += qty;
        existing.revenue += rev;
        existing.grossProfit += profit;

        productAggMap.set(prodId, existing);
      });
    }
  });

  // Supplement category name from products list
  productAggMap.forEach((metric) => {
    const p = products.find((prod) => prod.productId === metric.productId || prod.sku === metric.sku);
    if (p) {
      metric.name = p.name || metric.name;
      metric.category = p.category || metric.category;
      metric.unit = p.unit || metric.unit;
    }
  });

  const allProductMetrics = Array.from(productAggMap.values());

  const topSelling = [...allProductMetrics].sort((a, b) => b.quantitySold - a.quantitySold).slice(0, 5);
  const topRevenue = [...allProductMetrics].sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  const topProfit = [...allProductMetrics].sort((a, b) => b.grossProfit - a.grossProfit).slice(0, 5);

  // =========================================================================
  // 7. INVENTORY SNAPSHOT & 7-BUCKET AGING (FIFO Engine Reuse)
  // =========================================================================
  const activeLots = scopedLots.filter((l) => (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0) > 0);

  let totalStockQuantity = 0;
  let totalStockValue = 0;
  let totalFifoValue = 0;
  let agedStockCount = 0;

  // Initialize 7 standard aging buckets
  const bucketDefs: Array<{
    key: InventoryAgingBucket;
    label: string;
    daysRange: string;
    minDays: number;
    maxDays: number;
  }> = [
    { key: 'under_7d', label: '< 7 ngày', daysRange: '0 – 6 ngày', minDays: 0, maxDays: 6 },
    { key: '7_30d', label: '7 – 30 ngày', daysRange: '7 – 30 ngày', minDays: 7, maxDays: 30 },
    { key: '30_90d', label: '30 – 90 ngày', daysRange: '31 – 90 ngày', minDays: 31, maxDays: 90 },
    { key: '90_180d', label: '90 – 180 ngày', daysRange: '91 – 180 ngày', minDays: 91, maxDays: 180 },
    { key: '180_360d', label: '180 – 360 ngày', daysRange: '181 – 360 ngày', minDays: 181, maxDays: 360 },
    { key: '1_2y', label: '1 – 2 năm', daysRange: '361 – 720 ngày', minDays: 361, maxDays: 720 },
    { key: 'over_2y', label: '> 2 năm', daysRange: '> 720 ngày', minDays: 721, maxDays: 99999 }
  ];

  const bucketLotsMap = new Map<InventoryAgingBucket, InventoryLayer[]>();
  bucketDefs.forEach((b) => bucketLotsMap.set(b.key, []));

  activeLots.forEach((lot) => {
    const qty = Number(lot.quantityRemaining ?? lot.remainingQuantity ?? 0) || 0;
    const unitCost = Number(lot.purchasePrice ?? lot.costPrice ?? 0) || 0;
    const fifoVal = qty * unitCost;

    totalStockQuantity += qty;
    totalStockValue += fifoVal;
    totalFifoValue += fifoVal;

    // Stock Age (Tuổi tồn kho lưu bãi = Reference Date - Received Date)
    const intakeDateStr = lot.receivedAt || lot.intakeDate || lot.createdAt || '2026-08-01';
    const intakeTime = parseDate(intakeDateStr).getTime();
    const stockAgeDays = Math.max(0, Math.floor((referenceDate.getTime() - intakeTime) / (1000 * 3600 * 24)));

    if (stockAgeDays > 90) {
      agedStockCount++;
    }

    // Match bucket
    for (const b of bucketDefs) {
      if (stockAgeDays >= b.minDays && stockAgeDays <= b.maxDays) {
        bucketLotsMap.get(b.key)?.push(lot);
        break;
      }
    }
  });

  // Calculate low stock items count from products
  const lowStockCount = products.filter((p) => {
    const stock = Number(p.stock) || 0;
    const minStock = Number(p.minStock) || 10;
    return p.isLowStock || stock <= minStock;
  }).length;

  const agingBucketsData: InventoryAgingBucketData[] = bucketDefs.map((b) => {
    const lots = bucketLotsMap.get(b.key) || [];
    const lotCount = lots.length;
    const skuSet = new Set(lots.map((l) => l.sku));
    const qty = lots.reduce((sum, l) => sum + (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0), 0);
    const fifoVal = lots.reduce((sum, l) => {
      const q = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) || 0;
      const c = Number(l.purchasePrice ?? l.costPrice ?? 0) || 0;
      return sum + q * c;
    }, 0);
    const pct = totalFifoValue > 0 ? Math.round((fifoVal / totalFifoValue) * 1000) / 10 : 0;

    return {
      bucketKey: b.key,
      label: b.label,
      daysRange: b.daysRange,
      lotCount,
      skuCount: skuSet.size,
      quantity: qty,
      fifoValue: fifoVal,
      percentage: pct,
      lots
    };
  });

  const inventorySnapshot: InventorySnapshotData = {
    totalQuantity: totalStockQuantity,
    totalValue: totalStockValue,
    fifoValue: totalFifoValue,
    lowStockCount,
    agedStockCount,
    agingBuckets: agingBucketsData
  };

  // =========================================================================
  // 8. FINANCE SNAPSHOT
  // =========================================================================
  const netRevenue = currentRevenue;
  const grossMarginPercent = netRevenue > 0 ? Math.round((currentGrossProfit / netRevenue) * 1000) / 10 : 0;

  // Receivables from Customers
  const totalReceivables = scopedCustomers.reduce((sum, c) => sum + (Number(c.debt) || 0), 0);

  // Payables to Suppliers
  const totalPayables = purchaseOrders.reduce((sum, po) => sum + (Number(po.debtAmount) || 0), 0);

  const financeSnapshot: FinanceSnapshotData = {
    grossRevenue: currentGrossRevenue,
    discount: currentDiscount,
    refund: currentRefund,
    netRevenue,
    cogs: currentCogs,
    grossProfit: currentGrossProfit,
    grossMarginPercent,
    receivable: totalReceivables,
    payable: totalPayables,
    isDataSufficient: true
  };

  // =========================================================================
  // 9. MARKETPLACE FINANCE (ĐỐI SOÁT SÀN)
  // =========================================================================
  const marketplaceChannels = BIZONE_CHANNELS.filter(
    (ch) => ch.category === 'marketplace' || ch.category === 'food_delivery'
  );

  const marketplaceFinance: MarketplaceFinanceItem[] = marketplaceChannels.map((ch) => {
    // Filter valid orders belonging to this channel in current period
    const channelOrders = currentValidOrders.filter((o) => resolveOrderChannel(o) === ch.id);
    const grossSales = channelOrders.reduce((sum, o) => sum + getOrderGrossRevenue(o), 0);
    const channelNetSales = channelOrders.reduce((sum, o) => sum + getOrderNetRevenue(o), 0);
    const channelCogs = channelOrders.reduce((sum, o) => sum + getOrderCogs(o), 0);

    const feeRate = ch.estimatedPlatformFeeRate || 0.08;

    // Check if real platform fees or statements exist on the orders
    const hasActualFee = channelOrders.length > 0 && channelOrders.some((o: any) => o.platformFee !== undefined && o.platformFee !== null);
    const hasReconciliation = channelOrders.length > 0 && channelOrders.every((o: any) => o.isReconciled === true || o.marketplaceStatementId);

    let marketplaceCost = 0;
    let netSettlement = 0;
    let realizedGrossProfit = 0;
    let status: 'ACTUAL' | 'ESTIMATED' | 'RECONCILED' | 'NOT_AVAILABLE' = 'NOT_AVAILABLE';
    let reconciliationNote = 'Chưa phát sinh giao dịch trong kỳ';

    if (grossSales === 0) {
      status = 'NOT_AVAILABLE';
      reconciliationNote = 'Chưa có dữ liệu đối soát thực tế';
      marketplaceCost = 0;
      netSettlement = 0;
      realizedGrossProfit = 0;
    } else if (hasReconciliation) {
      status = 'RECONCILED';
      marketplaceCost = channelOrders.reduce((sum: number, o: any) => sum + (Number(o.platformFee) || 0), 0);
      netSettlement = channelNetSales - marketplaceCost;
      realizedGrossProfit = netSettlement - channelCogs;
      reconciliationNote = 'Đã khớp đối soát với sao kê sàn';
    } else if (hasActualFee) {
      status = 'ACTUAL';
      marketplaceCost = channelOrders.reduce((sum: number, o: any) => sum + (Number(o.platformFee) || 0), 0);
      netSettlement = channelNetSales - marketplaceCost;
      realizedGrossProfit = netSettlement - channelCogs;
      reconciliationNote = 'Khấu trừ phí thực tế theo hóa đơn sàn';
    } else {
      status = 'ESTIMATED';
      marketplaceCost = Math.round(grossSales * feeRate);
      netSettlement = channelNetSales - marketplaceCost;
      realizedGrossProfit = netSettlement - channelCogs;
      reconciliationNote = `Tạm tính theo biểu phí hợp đồng (${(feeRate * 100).toFixed(1)}%)`;
    }

    return {
      channelId: ch.id,
      channelName: ch.name,
      grossSales,
      marketplaceCost,
      netSettlement,
      cogs: channelCogs,
      realizedGrossProfit,
      status,
      reconciliationNote,
      estimatedPlatformFeeRate: feeRate
    };
  }).filter((item) => item.grossSales > 0 || ['shopee', 'tiktok', 'grabfood', 'shopeefood'].includes(item.channelId));

  // =========================================================================
  // 10. CRM SNAPSHOT
  // =========================================================================
  // Count customer orders to detect new vs returning
  const customerOrderCountMap = new Map<string, number>();
  const customerSpendMap = new Map<string, { totalSpent: number; orderCount: number; name: string; phone?: string; id: string }>();

  scopedOrders.forEach((o) => {
    const cName = o.customerName || 'Khách vãng lai';
    const cCount = customerOrderCountMap.get(cName) || 0;
    customerOrderCountMap.set(cName, cCount + 1);

    const spend = customerSpendMap.get(cName) || {
      id: o.id,
      name: cName,
      phone: o.customerPhone,
      totalSpent: 0,
      orderCount: 0
    };
    spend.totalSpent += getOrderNetRevenue(o);
    spend.orderCount += 1;
    customerSpendMap.set(cName, spend);
  });

  // Current period new customers vs returning
  let periodReturningOrdersCount = 0;
  currentValidOrders.forEach((o) => {
    const cName = o.customerName || '';
    const totalLifetime = customerOrderCountMap.get(cName) || 0;
    if (totalLifetime >= 2) {
      periodReturningOrdersCount++;
    }
  });

  const periodReturningPercent = currentOrderCount > 0
    ? Math.round((periodReturningOrdersCount / currentOrderCount) * 1000) / 10
    : 0;

  const newCustCount = scopedCustomers.filter((c) => {
    const created = parseDate(c.createdAt);
    return created >= currentStart && created <= currentEnd;
  }).length;

  const returningCustCount = Array.from(customerOrderCountMap.values()).filter((cnt) => cnt >= 2).length;

  const topCustEntry = Array.from(customerSpendMap.values()).sort((a, b) => b.totalSpent - a.totalSpent)[0];

  const crmSnapshot: CrmSnapshotData = {
    newCustomersCount: newCustCount,
    returningCustomersCount: returningCustCount,
    returningOrdersPercent: periodReturningPercent,
    returningOrdersCount: periodReturningOrdersCount,
    aov: totalAov,
    topCustomer: topCustEntry
  };

  // =========================================================================
  // 11. ACTIONABLE ALERT CENTER
  // =========================================================================
  const alerts: ExecutiveAlertItem[] = [];

  // 1. Low stock alert
  if (lowStockCount > 0) {
    alerts.push({
      id: 'alert-low-stock',
      type: 'low_stock',
      severity: 'critical',
      title: 'Tồn kho dưới định mức an toàn',
      description: `Có ${lowStockCount} mặt hàng đang chạm hoặc dưới ngưỡng tồn tối thiểu cần bổ sung PO ngay`,
      countOrValue: `${lowStockCount} SKU`,
      targetModule: 'inventory'
    });
  }

  // 2. Aged stock alert (Tuổi tồn kho lưu bãi > 90 ngày)
  if (agedStockCount > 0) {
    alerts.push({
      id: 'alert-aged-stock',
      type: 'aged_stock',
      severity: 'warning',
      title: 'Hàng tồn kho lưu bãi trên 90 ngày',
      description: `Có ${agedStockCount} lô hàng có tuổi lưu kho vượt quá 90 ngày cần kích hoạt thanh lý/khuyến mãi`,
      countOrValue: `${agedStockCount} Lô`,
      targetModule: 'warehouse-fifo-lots'
    });
  }

  // 3. Expiring soon lots (Shelf life remaining <= 30 days)
  const expiringLotsCount = activeLots.filter((l) => {
    if (!l.expiryDate) return false;
    const exp = parseDate(l.expiryDate).getTime();
    const daysLeft = Math.floor((exp - referenceDate.getTime()) / (1000 * 3600 * 24));
    return daysLeft > 0 && daysLeft <= 30;
  }).length;

  if (expiringLotsCount > 0) {
    alerts.push({
      id: 'alert-expiring-soon',
      type: 'expiring_soon',
      severity: 'critical',
      title: 'Hàng hóa cận date sắp hết hạn',
      description: `Có ${expiringLotsCount} lô sản phẩm có hạn sử dụng còn lại ≤ 30 ngày cần xả kho gấp`,
      countOrValue: `${expiringLotsCount} Lô`,
      targetModule: 'warehouse-fifo-lots'
    });
  }

  // 4. Overdue Debt
  const overdueCustomers = scopedCustomers.filter((c) => {
    const debt = Number(c.debt) || 0;
    const limit = Number(c.creditLimit) || 50000000;
    return debt > 0 && (debt > limit || debt > 20000000);
  });

  if (overdueCustomers.length > 0) {
    const totalOverdueDebt = overdueCustomers.reduce((sum, c) => sum + (Number(c.debt) || 0), 0);
    alerts.push({
      id: 'alert-overdue-debt',
      type: 'overdue_debt',
      severity: 'warning',
      title: 'Công nợ khách hàng cần thu hồi',
      description: `Có ${overdueCustomers.length} khách hàng có dư nợ cao hoặc quá hạn thanh toán`,
      countOrValue: formatCompactVND(totalOverdueDebt),
      targetModule: 'crm'
    });
  }

  // 5. Unprocessed orders
  const unprocessedOrders = scopedOrders.filter((o) => o.status === 'processing');
  if (unprocessedOrders.length > 0) {
    alerts.push({
      id: 'alert-unprocessed-orders',
      type: 'unprocessed_order',
      severity: 'warning',
      title: 'Đơn hàng đang chờ xử lý & xuất kho',
      description: `Có ${unprocessedOrders.length} đơn hàng đang trong trạng thái processing cần chuẩn bị hàng`,
      countOrValue: `${unprocessedOrders.length} Đơn`,
      targetModule: 'orders'
    });
  }

  return {
    period: filters.timePeriod,
    periodLabel,
    kpis,
    revenueChart: {
      granularity,
      data: chartData,
      totalRevenue: currentRevenue,
      totalOrders: currentOrderCount,
      averageOrderValue: totalAov
    },
    channels: channelPerformance,
    products: {
      topSelling,
      topRevenue,
      topProfit
    },
    inventory: inventorySnapshot,
    finance: financeSnapshot,
    marketplaceFinance,
    crm: crmSnapshot,
    alerts
  };
}
