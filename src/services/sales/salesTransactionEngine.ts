import {
  Order,
  OrderItem,
  InventoryLayer,
  StockTransaction,
  AuditLog,
  CashTransaction,
  Product,
  Customer,
  SalesChannel,
  PaymentMethod,
  OrderStatus,
  OrderTransactionSnapshot,
  SalesReturn,
  SalesRefundItem
} from '../../types';
import { fifoEngine } from '../fifoEngine';
import { TemporalBusinessEngine } from '../temporal/temporalService';
import { ConsumptionService } from '../fnb/consumptionService';
import { TransactionSnapshotService } from '../transaction/transactionSnapshotService';
import { InventoryRepository } from '../../repositories/inventoryRepository';

export interface CreateSalesOrderParams {
  tenantId?: string;
  orderCode?: string;
  channel?: SalesChannel | string;
  branchId?: string;
  branchName?: string;
  warehouseId?: string;
  warehouseName?: string;
  customerId?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  items: Array<{
    productId?: string;
    sku: string;
    productName?: string;
    quantity: number;
    unit?: string;
    salePrice?: number;
    unitPrice?: number;
    totalPrice?: number;
  }>;
  discount?: number | { type: string; value: number; reason?: string };
  tax?: number;
  paymentMethod: PaymentMethod;
  paymentStatus?: 'paid' | 'partial' | 'unpaid';
  amountPaid?: number;
  actor?: string;
  creator?: string;
  createdAt?: string;
  note?: string;
  existingLayers: InventoryLayer[];
  existingCustomers?: Customer[];
  existingProducts?: Product[];
  products?: Product[];
}

export interface SalesOrderResult {
  success: boolean;
  order: Order;
  updatedLayers: InventoryLayer[];
  updatedCustomers: Customer[];
  generatedStockTransactions: StockTransaction[];
  auditLogs: AuditLog[];
  cashTransaction?: CashTransaction;
  errorMessage?: string;
}

export interface ProcessSalesReturnParams {
  tenantId?: string;
  orderId?: string;
  order?: Order;
  branchId?: string;
  warehouseId?: string;
  items?: Array<{
    orderItemId?: string;
    sku: string;
    productId?: string;
    productName?: string;
    unit?: string;
    quantity: number;
    returnPrice?: number;
    refundUnitPrice?: number;
    restockToWarehouse?: boolean;
    restockToInventory?: boolean;
    reason?: string;
  }>;
  itemsToRefund?: Array<{
    sku: string;
    productId?: string;
    productName: string;
    unit: string;
    quantity: number;
    refundUnitPrice: number;
    restockToInventory: boolean;
    reason?: string;
  }>;
  refundAmount?: number;
  refundMethod?: 'cash' | 'bank_transfer' | 'customer_balance' | PaymentMethod;
  paymentMethod?: PaymentMethod;
  restockToWarehouse?: boolean;
  reason?: string;
  actor?: string;
  existingOrders?: Order[];
  existingLayers: InventoryLayer[];
  existingCustomers?: Customer[];
  createdAt?: string;
  notes?: string;
}

export interface SalesReturnResult {
  success: boolean;
  salesReturn: SalesReturn;
  updatedOrder: Order;
  updatedOrders: Order[];
  updatedLayers: InventoryLayer[];
  updatedCustomers: Customer[];
  generatedStockTransactions: StockTransaction[];
  cashTransaction?: CashTransaction;
  auditLogs: AuditLog[];
  errorMessage?: string;
}

export class SalesTransactionEngine {
  private static sequence = 2000;

  private static getNextSequence(): number {
    this.sequence = (this.sequence + 1) % 900000 + 1000;
    return this.sequence;
  }

  /**
   * Generates a standardized sales order code
   */
  static generateOrderCode(channel: SalesChannel | string = 'POS'): string {
    const prefix = channel === 'POS' ? 'POS' : channel.startsWith('SHOPEE') ? 'SP' : channel.startsWith('TIKTOK') ? 'TT' : 'ORD';
    const seq = this.getNextSequence();
    return `${prefix}-${Date.now().toString().slice(-4)}${seq.toString().slice(-4)}`;
  }

  /**
   * Executes a complete sales order transaction across all sales channels:
   * 1. Resolves effective Selling Price & Recipe BOM at transaction timestamp
   * 2. Executes FIFO deductions for standard items or recipe ingredients
   * 3. Records Consumption Ledger entries for F&B policies (Direct vs Accumulated)
   * 4. Calculates exact FIFO COGS and Gross Margin
   * 5. Creates immutable OrderTransactionSnapshot
   * 6. Generates Cash flow transaction, Stock transactions, and updates customer accounts
   */
  static processSalesOrder(params: CreateSalesOrderParams): SalesOrderResult {
    const tenantId = params.tenantId || 'TENANT-DEFAULT';
    const createdAt = params.createdAt || new Date().toISOString();
    const branchId = params.branchId || 'BR01';
    const warehouseId = params.warehouseId || 'WH01';
    const orderCode = params.orderCode || this.generateOrderCode(params.channel);
    const orderSeq = this.getNextSequence();
    const orderId = `ORD-${Date.now()}-${orderSeq}`;
    const creator = params.actor || params.creator || 'Nhân viên bán hàng';
    const allProducts = params.products || params.existingProducts || [];

    let runningLayers = [...params.existingLayers];
    const generatedStockTransactions: StockTransaction[] = [];
    const auditLogs: AuditLog[] = [];

    // 1. Build and validate Order Items
    const finalItems: OrderItem[] = [];
    let calculatedSubtotal = 0;

    for (const rawItem of params.items) {
      const matchedProduct = allProducts.find((p) => p.sku === rawItem.sku || p.productId === rawItem.productId);
      const productName = rawItem.productName || matchedProduct?.name || rawItem.sku;
      const productId = rawItem.productId || matchedProduct?.productId || `P-${rawItem.sku}`;
      const unit = rawItem.unit || matchedProduct?.unit || 'Ly';

      // Check price resolution at order timestamp
      let unitPrice = rawItem.salePrice ?? rawItem.unitPrice;
      if (unitPrice === undefined || unitPrice === null) {
        const priceRes = TemporalBusinessEngine.resolveSellingPrice(tenantId, rawItem.sku, createdAt);
        if (priceRes.status === 'SUCCESS' && priceRes.version) {
          unitPrice = priceRes.version.price;
        } else {
          unitPrice = matchedProduct?.sellingPrice || matchedProduct?.costPrice || 0;
        }
      }

      const itemTotal = rawItem.totalPrice ?? (rawItem.quantity * unitPrice);
      calculatedSubtotal += itemTotal;

      finalItems.push({
        productId,
        sku: rawItem.sku,
        productName,
        quantity: rawItem.quantity,
        unit,
        unitPrice,
        totalPrice: itemTotal
      });
    }

    let discountAmount = 0;
    if (typeof params.discount === 'number') {
      discountAmount = params.discount;
    } else if (params.discount && typeof params.discount === 'object') {
      discountAmount = params.discount.value || 0;
    }
    const tax = params.tax || 0;
    const totalAmount = Math.max(0, calculatedSubtotal - discountAmount + tax);

    // 2. Draft initial Order
    const draftOrder: Order = {
      id: orderId,
      code: orderCode,
      customerName: params.customerName || 'Khách lẻ',
      customerPhone: params.customerPhone || '',
      customerAddress: params.customerAddress || '',
      branchId,
      branchName: params.branchName || 'Chi nhánh mặc định',
      warehouseId,
      warehouseName: params.warehouseName || 'Kho tổng',
      items: finalItems,
      subtotal: calculatedSubtotal,
      discount: discountAmount,
      tax,
      totalAmount,
      finalAmount: totalAmount,
      status: 'completed',
      paymentMethod: params.paymentMethod || 'cash',
      paymentStatus: params.paymentStatus || 'paid',
      createdAt,
      orderDate: createdAt,
      creator,
      channel: (params.channel as any) || 'POS',
      source: (params.channel as any) || 'POS',
      note: params.note || `Đơn hàng qua kênh ${params.channel || 'POS'}`
    };
    (draftOrder as any).tenantId = tenantId;

    // 3. FIFO and Recipe Consumption Handling
    let totalCogs = 0;

    // Seed repository layers for the tenant/warehouse
    InventoryRepository.initialize(runningLayers);

    // Check each item for Recipe Version at transaction date
    for (const item of finalItems) {
      const recipeRes = TemporalBusinessEngine.resolveRecipe(tenantId, item.sku, createdAt);

      if (recipeRes.status === 'SUCCESS' && recipeRes.version) {
        // F&B Recipe Item: Expand and deduct components via FIFO & Consumption Ledger
        const recipe = recipeRes.version;
        for (const comp of recipe.components) {
          const compRequiredQty = comp.quantity * item.quantity;
          const policy = comp.consumptionPolicy || 'PER_TRANSACTION';

          if (policy === 'PER_TRANSACTION') {
            // Direct immediate deduction from FIFO inventory
            const fifoRes = fifoEngine.executeFifoIssue(
              [
                {
                  sku: comp.componentSku,
                  productName: comp.componentName,
                  quantity: compRequiredQty,
                  unit: comp.unit
                }
              ],
              runningLayers,
              {
                issueId: `iss-${orderId}-${comp.componentSku}`,
                docCode: orderCode,
                docType: 'Xuất bán',
                branchId,
                warehouseId,
                actor: creator,
                note: `Xuất nguyên liệu [${comp.componentName}] cho đơn ${orderCode}`
              }
            );

            if (fifoRes.success) {
              runningLayers = fifoRes.updatedLayers;
              generatedStockTransactions.push(...fifoRes.generatedTransactions);
              auditLogs.push(...fifoRes.auditLogs);
              totalCogs += fifoRes.totalCogs;
            }
          }
        }
      } else {
        // Standard Direct Product (No Recipe): Deduct item directly via FIFO
        const fifoRes = fifoEngine.executeFifoIssue(
          [
            {
              sku: item.sku,
              productName: item.productName,
              quantity: item.quantity,
              unit: item.unit,
              salePrice: item.unitPrice
            }
          ],
          runningLayers,
          {
            issueId: `iss-${orderId}-${item.sku}`,
            docCode: orderCode,
            docType: 'Xuất bán',
            branchId,
            warehouseId,
            actor: creator,
            note: `Xuất kho bán hàng đơn ${orderCode}`
          }
        );

        if (!fifoRes.success) {
          return {
            success: false,
            order: draftOrder,
            updatedLayers: params.existingLayers,
            updatedCustomers: params.existingCustomers || [],
            generatedStockTransactions: [],
            auditLogs: [],
            errorMessage: `Không đủ tồn kho khả dụng cho sản phẩm ${item.productName} (${fifoRes.errorMessage})`
          };
        }

        runningLayers = fifoRes.updatedLayers;
        generatedStockTransactions.push(...fifoRes.generatedTransactions);
        auditLogs.push(...fifoRes.auditLogs);
        totalCogs += fifoRes.totalCogs;
        item.fifoCost = fifoRes.totalCogs;
      }
    }

    // 4. Record consumption events in Consumption Service
    try {
      ConsumptionService.processOrderConsumption(draftOrder, creator);
    } catch (e) {
      console.warn('[SalesTransactionEngine] Consumption service warning:', e);
    }

    // 5. Finalize Order COGS & Profit
    const finalGrossProfit = totalAmount - totalCogs;
    const finalOrder: Order = {
      ...draftOrder,
      cogs: totalCogs,
      grossProfit: finalGrossProfit
    };

    // 6. Create immutable Transaction Snapshot
    const snapshot = TransactionSnapshotService.createOrderSnapshot(finalOrder, createdAt);
    finalOrder.snapshot = snapshot;

    // 7. Update Customer debt and total spent if customer provided
    let updatedCustomers = params.existingCustomers ? [...params.existingCustomers] : [];
    if (params.customerName && updatedCustomers.length > 0) {
      const addedDebt = finalOrder.paymentStatus === 'paid' ? 0 : totalAmount;
      updatedCustomers = updatedCustomers.map((c) => {
        if (
          (params.customerId && c.id === params.customerId) ||
          c.name.toLowerCase() === params.customerName!.toLowerCase() ||
          (params.customerPhone && c.phone === params.customerPhone)
        ) {
          return {
            ...c,
            totalSpent: (c.totalSpent || 0) + totalAmount,
            debt: (c.debt || 0) + addedDebt,
            lastPurchaseDate: createdAt.substring(0, 10)
          };
        }
        return c;
      });
    }

    // 8. Generate Cash Flow Transaction if payment is paid
    let cashTx: CashTransaction | undefined;
    if (finalOrder.paymentStatus === 'paid') {
      const txSeq = this.getNextSequence();
      cashTx = {
        id: `tx-${Date.now()}-${txSeq}`,
        code: `PT-2026-${txSeq}`,
        type: 'thu',
        category: 'Thu tiền bán hàng',
        amount: totalAmount,
        description: `Thu tiền đơn hàng ${orderCode} qua kênh ${finalOrder.channel}`,
        paymentMethod: finalOrder.paymentMethod,
        payerOrPayee: finalOrder.customerName,
        createdAt,
        referenceCode: orderCode
      };
    }

    // 9. Add top-level audit log
    auditLogs.push({
      id: `AUDIT-ORD-${Date.now()}`,
      timestamp: createdAt,
      userId: (creator || 'system').toLowerCase().replace(/\s+/g, '-'),
      userName: creator,
      action: 'created',
      referenceType: 'ORDER',
      referenceId: orderId,
      description: `Tạo thành công đơn ${orderCode} (Kênh: ${finalOrder.channel}, Giá trị: ${totalAmount.toLocaleString('vi-VN')} đ, Giá vốn FIFO: ${totalCogs.toLocaleString('vi-VN')} đ)`
    });

    return {
      success: true,
      order: finalOrder,
      updatedLayers: runningLayers,
      updatedCustomers,
      generatedStockTransactions,
      auditLogs,
      cashTransaction: cashTx
    };
  }

  /**
   * Alias for processSalesOrder
   */
  static createSalesOrder(params: CreateSalesOrderParams): SalesOrderResult {
    return this.processSalesOrder(params);
  }

  /**
   * Processes a Sales Return & Refund
   */
  static processSalesReturn(params: ProcessSalesReturnParams): SalesReturnResult {
    const existingOrders = params.existingOrders || [];
    let order: Order | undefined = params.order;

    if (!order && params.orderId) {
      order = existingOrders.find((o) => o.id === params.orderId || o.code === params.orderId);
    }

    if (!order) {
      const dummyOrder: Order = {
        id: params.orderId || 'UNKNOWN',
        code: params.orderId || 'UNKNOWN',
        customerName: 'Khách hàng',
        branchId: params.branchId || 'BR01',
        warehouseId: params.warehouseId || 'WH01',
        items: [],
        subtotal: 0,
        discount: 0,
        tax: 0,
        totalAmount: params.refundAmount || 0,
        status: 'refunded',
        paymentMethod: 'cash',
        paymentStatus: 'paid'
      };
      return {
        success: false,
        salesReturn: {} as any,
        updatedOrder: dummyOrder,
        updatedOrders: existingOrders,
        updatedLayers: params.existingLayers,
        updatedCustomers: params.existingCustomers || [],
        generatedStockTransactions: [],
        auditLogs: [],
        errorMessage: `Không tìm thấy thông tin đơn hàng gốc (#${params.orderId})`
      };
    }

    const tenantId = params.tenantId || (order as any).tenantId || 'TENANT-DEFAULT';
    const now = params.createdAt || new Date().toISOString();
    const retSeq = this.getNextSequence();
    const returnId = `RET-${Date.now()}-${retSeq}`;
    const returnCode = `TH-2026-${retSeq}`;
    const actor = params.actor || 'Quản trị viên';
    const paymentMethod: PaymentMethod = (params.paymentMethod as PaymentMethod) || (params.refundMethod === 'bank_transfer' ? 'bank_transfer' : 'cash');
    const reason = params.reason || 'Khách yêu cầu trả hàng / đổi trả';

    let updatedLayers = [...params.existingLayers];
    const generatedStockTransactions: StockTransaction[] = [];
    const auditLogs: AuditLog[] = [];
    const restockedLayerIds: string[] = [];

    const refundItems: SalesRefundItem[] = [];
    let totalRefundAmount = 0;

    const rawItems = params.items || params.itemsToRefund || [];

    for (const item of rawItems) {
      const refundUnitPrice = (item as any).refundUnitPrice ?? (item as any).returnPrice ?? 0;
      const itemRefundTotal = item.quantity * refundUnitPrice;
      totalRefundAmount += itemRefundTotal;

      const restock = (item as any).restockToInventory ?? (item as any).restockToWarehouse ?? params.restockToWarehouse ?? true;

      refundItems.push({
        sku: item.sku,
        productId: item.productId || `P-${item.sku}`,
        productName: item.productName || item.sku,
        unit: item.unit || 'Cái',
        quantity: item.quantity,
        refundUnitPrice,
        totalRefund: itemRefundTotal,
        restockToInventory: restock,
        warehouseId: order.warehouseId || params.warehouseId || 'WH01',
        condition: 'good',
        reason: item.reason || reason
      });

      // If restock requested, create RETURN_IN FIFO layer
      if (restock) {
        const layerId = `LOT-RET-${Date.now().toString().slice(-6)}-${item.sku}`;
        const newReturnLayer: InventoryLayer = {
          id: `LAYER-RET-${Date.now()}-${item.sku}`,
          layerId,
          layerType: 'RETURN_IN',
          sku: item.sku,
          productId: item.productId || `P-${item.sku}`,
          productCode: item.sku,
          productName: item.productName || item.sku,
          unit: item.unit || 'Cái',
          packSize: '1',
          warehouseId: order.warehouseId || params.warehouseId || 'WH01',
          warehouseName: order.warehouseName || 'Kho chính',
          branchId: order.branchId || params.branchId || 'BR01',
          quantityReceived: item.quantity,
          quantityIssued: 0,
          quantityRemaining: item.quantity,
          purchasePrice: refundUnitPrice * 0.6,
          unitCost: refundUnitPrice * 0.6,
          salePrice: refundUnitPrice,
          supplierName: 'Khách hàng trả hàng',
          receivedAt: now,
          createdAt: now,
          status: 'active'
        };

        updatedLayers.unshift(newReturnLayer);
        restockedLayerIds.push(layerId);

        generatedStockTransactions.push({
          id: `ST-RET-${Date.now()}-${item.sku}`,
          tenantId,
          date: now,
          type: 'Nhập chuyển kho',
          canonicalType: 'RECEIPT',
          docCode: returnCode,
          referenceType: 'SALES_RETURN',
          referenceId: returnId,
          sku: item.sku,
          productName: item.productName || item.sku,
          quantity: item.quantity,
          qtyIn: item.quantity,
          qtyOut: 0,
          balance: item.quantity,
          unitCost: refundUnitPrice * 0.6,
          totalValue: item.quantity * refundUnitPrice * 0.6,
          totalCost: item.quantity * refundUnitPrice * 0.6,
          warehouseId: order.warehouseId || params.warehouseId || 'WH01',
          branchId: order.branchId || params.branchId || 'BR01',
          actor,
          note: `Nhập kho trả hàng đơn ${order.code} (Phiếu ${returnCode})`
        });
      }
    }

    if (params.refundAmount && params.refundAmount > 0 && totalRefundAmount === 0) {
      totalRefundAmount = params.refundAmount;
    }

    const salesReturn: SalesReturn = {
      id: returnId,
      returnCode,
      orderId: order.id,
      orderCode: order.code,
      tenantId,
      branchId: order.branchId || params.branchId,
      branchName: order.branchName,
      warehouseId: order.warehouseId || params.warehouseId,
      warehouseName: order.warehouseName,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      refundAmount: totalRefundAmount,
      paymentMethod,
      refundStatus: 'completed',
      reason,
      items: refundItems,
      createdAt: now,
      creator: actor,
      notes: params.notes,
      restockedLayerIds
    };

    // Cash refund payout transaction if payment is cash/bank
    let cashTx: CashTransaction | undefined;
    if (totalRefundAmount > 0) {
      cashTx = {
        id: `tx-ret-${Date.now()}`,
        code: `PC-TH-${Math.floor(1000 + Math.random() * 9000)}`,
        type: 'chi',
        category: 'Chi trả hàng & Hoàn tiền',
        amount: totalRefundAmount,
        description: `Chi hoàn tiền phiếu trả hàng ${returnCode} cho đơn ${order.code}`,
        paymentMethod,
        payerOrPayee: order.customerName,
        createdAt: now,
        referenceCode: returnCode
      };
    }

    const isFullRefund = totalRefundAmount >= order.totalAmount;
    const updatedOrder: Order = {
      ...order,
      status: isFullRefund ? 'refunded' : 'partially_refunded',
      note: `${order.note || ''} | Đã hoàn tiền ${totalRefundAmount.toLocaleString('vi-VN')} đ (Phiếu ${returnCode})`
    };

    const updatedOrders = existingOrders.map((o) => (o.id === updatedOrder.id ? updatedOrder : o));

    // Update customer debt if refund decreases customer debt
    let updatedCustomers = params.existingCustomers ? [...params.existingCustomers] : [];
    if (order.customerName && updatedCustomers.length > 0) {
      updatedCustomers = updatedCustomers.map((c) => {
        if (c.name.toLowerCase() === order!.customerName.toLowerCase()) {
          return {
            ...c,
            debt: Math.max(0, (c.debt || 0) - totalRefundAmount)
          };
        }
        return c;
      });
    }

    auditLogs.push({
      id: `AUDIT-RET-${Date.now()}`,
      timestamp: now,
      userId: (actor || 'system').toLowerCase().replace(/\s+/g, '-'),
      userName: actor,
      action: 'returned',
      referenceType: 'ORDER_RETURN',
      referenceId: returnId,
      description: `Lập phiếu trả hàng ${returnCode} cho đơn ${order.code}. Số tiền hoàn: ${totalRefundAmount.toLocaleString('vi-VN')} đ.`
    });

    return {
      success: true,
      salesReturn,
      updatedOrder,
      updatedOrders,
      updatedLayers,
      updatedCustomers,
      generatedStockTransactions,
      cashTransaction: cashTx,
      auditLogs
    };
  }
}
