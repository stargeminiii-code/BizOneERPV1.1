import {
  Product,
  Customer,
  InventoryLayer,
  Order,
  PaymentMethod,
  SalesChannel,
  UserAccount,
  StockTransaction,
  CashTransaction,
  AuditLog
} from '../types';
import { SalesTransactionEngine, SalesOrderResult } from './sales/salesTransactionEngine';
import { TemporalBusinessEngine } from './temporal/temporalService';
import { AuditLogRepository } from '../repositories/auditLogRepository';

export interface PosCartItem {
  product: Product;
  quantity: number;
  unitPrice: number;
  priceVersionId?: string;
  recipeVersionId?: string;
  note?: string;
}

export interface PosTransactionParams {
  tenantId: string;
  branchId?: string;
  branchName?: string;
  warehouseId?: string;
  warehouseName?: string;
  channel?: SalesChannel;
  tableOrArea?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: PosCartItem[];
  discountAmount?: number;
  taxAmount?: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  actorName?: string;
  actorId?: string;
  currentUser?: UserAccount;
  existingLayers: InventoryLayer[];
  existingCustomers?: Customer[];
  products: Product[];
  note?: string;
  createdAt?: string;
}

export interface PosTransactionResult {
  success: boolean;
  order?: Order;
  updatedLayers?: InventoryLayer[];
  updatedCustomers?: Customer[];
  generatedStockTransactions?: StockTransaction[];
  cashTransaction?: CashTransaction;
  auditLogs?: AuditLog[];
  errorMessage?: string;
}

/**
 * POS Orchestration Service
 * Connects POS UI with Product Master, Temporal Price & Recipe Engine,
 * FIFO Inventory, Order Transaction Snapshot, and Finance.
 */
export class PosService {
  /**
   * Validates POS operation permissions against current user roles & permissions
   */
  static validatePosPermission(
    currentUser?: UserAccount,
    action: 'view' | 'create' | 'cancel' = 'create'
  ): { allowed: boolean; reason?: string } {
    if (!currentUser) {
      return { allowed: true }; // Allow system default if no user passed
    }

    // Full access for ADMIN, OWNER, MANAGER
    const role = (currentUser.role || '').toUpperCase();
    if (role === 'ADMIN' || role === 'SUPERADMIN' || role === 'OWNER' || role === 'MANAGER') {
      return { allowed: true };
    }

    const perms: any = currentUser.permissions;
    if (!perms) return { allowed: true };

    if (Array.isArray(perms)) {
      const requiredPermission = action === 'view' ? 'pos.view' : action === 'create' ? 'pos.create' : 'order.cancel';
      if (
        perms.includes(requiredPermission) ||
        perms.includes('order.create') ||
        perms.includes('all') ||
        perms.includes('*')
      ) {
        return { allowed: true };
      }
    } else if (typeof perms === 'object') {
      const bevPerms = perms.beverages || [];
      const issuesPerms = perms.issues || [];
      const reqAction = action === 'view' ? 'view' : 'create';
      if (bevPerms.includes(reqAction) || issuesPerms.includes(reqAction)) {
        return { allowed: true };
      }
    }

    return {
      allowed: false,
      reason: `Tài khoản [${currentUser.name}] không có quyền thực hiện thao tác này`
    };
  }

  /**
   * Dynamically extracts categories from tenant's Product Master (Never hardcoded)
   */
  static extractCategories(products: Product[]): Array<{ id: string; name: string; count: number }> {
    const categoryMap = new Map<string, number>();

    products.forEach((p) => {
      const cat = p.category?.trim() || (p.productType === 'COMBO' ? 'Combo' : 'Khác');
      categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
    });

    const result: Array<{ id: string; name: string; count: number }> = [
      { id: 'all', name: 'Tất cả', count: products.length }
    ];

    categoryMap.forEach((count, cat) => {
      result.push({ id: cat, name: cat, count });
    });

    return result;
  }

  /**
   * Resolves active selling price for an SKU at current or specified timestamp
   */
  static resolveCurrentPrice(
    tenantId: string,
    sku: string,
    channel: SalesChannel = 'POS',
    effectiveAt?: string | Date
  ): { price: number; priceVersionId?: string; isVersionResolved: boolean } {
    const timestamp = effectiveAt || new Date().toISOString();
    const res = TemporalBusinessEngine.resolveSellingPrice(tenantId, sku, timestamp, channel);

    if (res.status === 'SUCCESS' && res.version) {
      return {
        price: res.version.price,
        priceVersionId: res.version.versionId,
        isVersionResolved: true
      };
    }

    return {
      price: 0,
      isVersionResolved: false
    };
  }

  /**
   * Resolves active Recipe/BOM version for an SKU at current timestamp
   */
  static resolveCurrentRecipe(
    tenantId: string,
    sku: string,
    effectiveAt?: string | Date
  ) {
    const timestamp = effectiveAt || new Date().toISOString();
    return TemporalBusinessEngine.resolveRecipe(tenantId, sku, timestamp);
  }

  /**
   * Executes a fast POS sale order transaction
   */
  static executeSale(params: PosTransactionParams): PosTransactionResult {
    // 1. Permission Validation
    const permCheck = this.validatePosPermission(params.currentUser, 'create');
    if (!permCheck.allowed) {
      return {
        success: false,
        errorMessage: permCheck.reason || 'Quyền hạn không đủ để thực hiện thanh toán POS'
      };
    }

    // 2. Tenant Isolation Validation
    const tenantId = params.tenantId || params.currentUser?.tenantId || 'TENANT-DEFAULT';
    if (params.currentUser?.tenantId && params.currentUser.tenantId !== tenantId) {
      return {
        success: false,
        errorMessage: `Vi phạm cách ly dữ liệu Tenant: Người dùng [${params.currentUser.tenantId}] không thể lập đơn tại Tenant [${tenantId}]`
      };
    }

    if (!params.items || params.items.length === 0) {
      return {
        success: false,
        errorMessage: 'Giỏ hàng đang trống, không thể tạo đơn'
      };
    }

    const now = params.createdAt || new Date().toISOString();
    const channel: SalesChannel = params.channel || 'POS';

    // 3. Resolve price & recipe snapshots for each cart item
    const orderItems = params.items.map((cartItem) => {
      const p = cartItem.product;
      const sku = p.sku;

      // Price resolution
      let unitPrice = cartItem.unitPrice;
      let priceVersionId = cartItem.priceVersionId;

      if (!unitPrice || unitPrice <= 0) {
        const priceResolved = this.resolveCurrentPrice(tenantId, sku, channel, now);
        if (priceResolved.isVersionResolved && priceResolved.price > 0) {
          unitPrice = priceResolved.price;
          priceVersionId = priceResolved.priceVersionId;
        } else {
          unitPrice = p.sellingPrice || p.costPrice || 0;
        }
      }

      // Recipe resolution
      const recipeRes = this.resolveCurrentRecipe(tenantId, sku, now);
      const recipeVersionId = recipeRes.status === 'SUCCESS' ? recipeRes.version?.versionId : undefined;

      return {
        productId: p.productId || p.id,
        sku: p.sku,
        productName: p.name,
        quantity: cartItem.quantity,
        unit: p.unit || 'Ly',
        unitPrice,
        totalPrice: cartItem.quantity * unitPrice,
        priceVersionId,
        recipeVersionId
      };
    });

    const note = [
      params.note,
      params.tableOrArea ? `[${params.tableOrArea}]` : '',
      `Kênh: ${channel}`
    ]
      .filter(Boolean)
      .join(' - ');

    // 4. Delegate to SalesTransactionEngine
    const result: SalesOrderResult = SalesTransactionEngine.processSalesOrder({
      tenantId,
      channel,
      branchId: params.branchId || 'BR01',
      branchName: params.branchName || 'Chi nhánh mặc định',
      warehouseId: params.warehouseId || 'WH01',
      warehouseName: params.warehouseName || 'Kho quầy POS',
      customerId: params.customerId,
      customerName: params.customerName || 'Khách lẻ',
      customerPhone: params.customerPhone || '',
      customerAddress: params.customerAddress || '',
      items: orderItems,
      discount: params.discountAmount || 0,
      tax: params.taxAmount || 0,
      paymentMethod: params.paymentMethod,
      paymentStatus: params.paymentStatus || (params.paymentMethod === 'credit' ? 'unpaid' : 'paid'),
      actor: params.actorName || params.currentUser?.name || 'Nhân viên thu ngân',
      creator: params.actorName || params.currentUser?.name || 'Nhân viên thu ngân',
      createdAt: now,
      note,
      existingLayers: params.existingLayers,
      existingCustomers: params.existingCustomers,
      products: params.products
    });

    if (!result.success || !result.order) {
      return {
        success: false,
        errorMessage: result.errorMessage || 'Lỗi khi xử lý đơn bán hàng tại POS'
      };
    }

    // 5. Append Canonical Audit Log entry
    AuditLogRepository.record({
      tenantId,
      userId: params.actorId || params.currentUser?.id || 'pos-operator',
      action: 'ORDER_CREATE',
      module: 'POS',
      entityType: 'ORDER',
      entityId: result.order.id,
      metadata: {
        userName: params.actorName || params.currentUser?.name || 'Thu ngân',
        userRole: params.currentUser?.role || 'CASHIER',
        entityCode: result.order.code,
        channel,
        totalAmount: result.order.totalAmount,
        cogs: result.order.cogs,
        grossProfit: result.order.grossProfit,
        paymentMethod: params.paymentMethod,
        itemCount: result.order.items.length
      }
    });

    return {
      success: true,
      order: result.order,
      updatedLayers: result.updatedLayers,
      updatedCustomers: result.updatedCustomers,
      generatedStockTransactions: result.generatedStockTransactions,
      cashTransaction: result.cashTransaction,
      auditLogs: result.auditLogs
    };
  }
}
