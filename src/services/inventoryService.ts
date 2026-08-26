import {
  InventoryLayer,
  StockTransaction,
  Stocktake,
  StockTransfer,
  Order,
  PurchaseOrder,
  AuditLog,
  FIFOAllocation,
  FifoAllocationResult,
  FifoIssueExecutionResult,
  StockIssueRequestItem,
  UserAccount
} from '../types';
import { fifoEngine } from './fifoEngine';
import { InventoryRepository } from '../repositories/inventoryRepository';
import { WarehouseRepository } from '../repositories/warehouseRepository';
import { DataScopeEngine } from './dataScope/dataScopeEngine';
import { RoleService } from './roles/roleService';

export interface AllocateFifoInput {
  tenantId: string;
  branchId?: string;
  warehouseId: string;
  sku: string;
  quantity: number;
  referenceType: string;
  referenceId: string;
  allowNegativeStock?: boolean;
  actor?: string;
  salePrice?: number;
}

export interface AllocateFifoOutput {
  success: boolean;
  status: 'SUCCESS' | 'INSUFFICIENT_STOCK' | 'NEGATIVE_STOCK' | 'UNAUTHORIZED';
  allocatedLayers: FIFOAllocation[];
  totalCOGS: number;
  remainingQuantity: number;
  warnings: string[];
  errorMessage?: string;
  updatedLayers?: InventoryLayer[];
}

export class InventoryService {
  /**
   * Allocate FIFO for an SKU in a specific warehouse
   * Canonical FIFO Allocation Engine
   */
  static allocateFIFO(
    input: AllocateFifoInput,
    user?: UserAccount
  ): AllocateFifoOutput {
    // 1. RBAC & DataScope Validation
    if (user) {
      const isAllowed = DataScopeEngine.canAccess(
        {
          userId: user.id,
          name: user.fullName || user.name || user.username || user.email,
          email: user.email,
          roleId: user.role,
          roleCode: (user.role || 'STAFF').toUpperCase(),
          dataScope: (user.dataScope?.toUpperCase() as any) || 'WAREHOUSE',
          tenantId: user.tenantId || 'DEFAULT',
          permissions: new Set<string>(),
          branchIds: user.assignedBranchIds || (user.branchId ? [user.branchId] : []),
          warehouseIds: user.assignedWarehouseIds || []
        },
        {
          tenantId: input.tenantId,
          branchId: input.branchId,
          warehouseId: input.warehouseId
        }
      ).allowed;

      if (!isAllowed) {
        return {
          success: false,
          status: 'UNAUTHORIZED',
          allocatedLayers: [],
          totalCOGS: 0,
          remainingQuantity: input.quantity,
          warnings: ['Truy cập kho bị từ chối do chính sách phân quyền DataScope'],
          errorMessage: 'UNAUTHORIZED_WAREHOUSE_ACCESS'
        };
      }
    }

    const allLayers = InventoryRepository.getAllLayers({
      tenantId: input.tenantId,
      branchId: input.branchId,
      warehouseId: input.warehouseId,
      sku: input.sku
    });

    const totalAvailable = fifoEngine.getTotalAvailableStock(allLayers, input.sku, {
      branchId: input.branchId,
      warehouseId: input.warehouseId
    });

    if (totalAvailable < input.quantity) {
      if (!input.allowNegativeStock) {
        return {
          success: false,
          status: 'INSUFFICIENT_STOCK',
          allocatedLayers: [],
          totalCOGS: 0,
          remainingQuantity: input.quantity - totalAvailable,
          warnings: [
            `Tồn kho không đủ để xuất (Yêu cầu: ${input.quantity}, Khả dụng: ${totalAvailable})`
          ],
          errorMessage: 'INSUFFICIENT_STOCK'
        };
      }
    }

    const allocationResult: FifoAllocationResult = fifoEngine.previewFifoAllocation(
      input.sku,
      input.quantity,
      allLayers,
      {
        issueId: input.referenceId,
        issueCode: input.referenceId,
        branchId: input.branchId,
        warehouseId: input.warehouseId,
        salePrice: input.salePrice
      }
    );

    if (!allocationResult.isSufficientStock && !input.allowNegativeStock) {
      return {
        success: false,
        status: 'INSUFFICIENT_STOCK',
        allocatedLayers: allocationResult.allocations,
        totalCOGS: allocationResult.totalCost,
        remainingQuantity: allocationResult.remainingUnallocated,
        warnings: [`Không đủ số lượng lớp FIFO cho SKU ${input.sku}`],
        errorMessage: 'INSUFFICIENT_STOCK'
      };
    }

    return {
      success: true,
      status: allocationResult.isSufficientStock ? 'SUCCESS' : 'NEGATIVE_STOCK',
      allocatedLayers: allocationResult.allocations,
      totalCOGS: allocationResult.totalCost,
      remainingQuantity: allocationResult.remainingUnallocated,
      warnings: allocationResult.isSufficientStock
        ? []
        : ['Xuất hàng vượt quá tồn kho khả dụng (NEGATIVE_STOCK)'],
      updatedLayers: allocationResult.updatedLayers
    };
  }

  /**
   * Process Goods Receipt from Purchase Order (Increments stock & creates FIFO layers)
   */
  static processGoodsReceipt(
    po: PurchaseOrder,
    actor: string,
    idempotencyKey?: string
  ): {
    success: boolean;
    newLayers: InventoryLayer[];
    transactions: StockTransaction[];
    auditLogs: AuditLog[];
    errorMessage?: string;
  } {
    const result = fifoEngine.createLayersFromPurchaseOrder(po, actor);

    // Save to repository
    InventoryRepository.saveLayers(result.newLayers);
    InventoryRepository.recordTransactions(result.transactions, idempotencyKey);

    return {
      success: true,
      newLayers: result.newLayers,
      transactions: result.transactions,
      auditLogs: result.auditLogs
    };
  }

  /**
   * Process Sales Issue from Order (Allocates FIFO layers & creates StockTransactions)
   */
  static processOrderIssue(
    order: Order,
    itemsToDeduct: StockIssueRequestItem[],
    actor: string,
    idempotencyKey?: string
  ): {
    success: boolean;
    cogs: number;
    updatedLayers: InventoryLayer[];
    transactions: StockTransaction[];
    auditLogs: AuditLog[];
    errorMessage?: string;
  } {
    const currentLayers = InventoryRepository.getAllLayers();
    const issueResult = fifoEngine.executeFifoIssue(itemsToDeduct, currentLayers, {
      issueId: order.id,
      docCode: order.code,
      docType: 'Xuất bán',
      branchId: order.branchId,
      warehouseId: (order as any).warehouseId,
      actor,
      note: `Xuất kho giao đơn hàng ${order.code} (${order.channel || 'POS'})`
    });

    if (!issueResult.success) {
      return {
        success: false,
        cogs: 0,
        updatedLayers: currentLayers,
        transactions: [],
        auditLogs: [],
        errorMessage: issueResult.errorMessage
      };
    }

    // Save updated layers and transactions
    InventoryRepository.saveLayers(issueResult.updatedLayers);
    InventoryRepository.recordTransactions(issueResult.generatedTransactions, idempotencyKey);

    return {
      success: true,
      cogs: issueResult.totalCogs,
      updatedLayers: issueResult.updatedLayers,
      transactions: issueResult.generatedTransactions,
      auditLogs: issueResult.auditLogs
    };
  }

  /**
   * Reverse a Sales Issue (e.g. Order cancellation or return)
   * Restores FIFO layers and creates reverse audit trail
   */
  static reverseOrderIssue(
    order: Order,
    reason: string,
    actor: string
  ): {
    success: boolean;
    restoredLayers: InventoryLayer[];
    transactions: StockTransaction[];
    auditLogs: AuditLog[];
    errorMessage?: string;
  } {
    const currentLayers = InventoryRepository.getAllLayers();
    const orderTransactions = InventoryRepository.getTransactions({
      sku: undefined
    }).filter((t) => t.docCode === order.code);

    const reversedTransactions: StockTransaction[] = [];
    const restoredLayers = currentLayers.map((l) => ({ ...l }));
    const auditLogs: AuditLog[] = [];

    for (const tx of orderTransactions) {
      if (tx.qtyOut > 0) {
        // Reverse transaction
        const revTx = InventoryRepository.createReversalTransaction(tx.id, reason, actor);
        if (revTx) reversedTransactions.push(revTx);

        // Restore FIFO Layer
        const matchedLayer = restoredLayers.find((l) => l.layerId === tx.lotId || l.id === tx.lotId);
        if (matchedLayer) {
          matchedLayer.quantityIssued = Math.max(0, matchedLayer.quantityIssued - tx.qtyOut);
          matchedLayer.quantityRemaining += tx.qtyOut;
          if (matchedLayer.quantityRemaining > 0 && matchedLayer.status === 'exhausted') {
            matchedLayer.status = 'active';
          }
        }
      }
    }

    InventoryRepository.saveLayers(restoredLayers);

    auditLogs.push({
      id: `AUDIT-REV-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userId: 'USR-SYS',
      userName: actor,
      action: 'returned',
      referenceType: 'ORDER_RETURN',
      referenceId: order.code,
      description: `Hoàn tác xuất kho đơn hàng ${order.code}: ${reason}`
    });

    return {
      success: true,
      restoredLayers,
      transactions: reversedTransactions,
      auditLogs
    };
  }

  /**
   * Process Stock Transfer between Warehouses
   */
  static processStockTransfer(
    transfer: StockTransfer,
    actor: string
  ): {
    success: boolean;
    updatedLayers: InventoryLayer[];
    transactions: StockTransaction[];
    auditLogs: AuditLog[];
    errorMessage?: string;
  } {
    const currentLayers = InventoryRepository.getAllLayers();
    const result = fifoEngine.executeFifoTransfer(transfer, currentLayers, actor);

    if (!result.success) {
      return {
        success: false,
        updatedLayers: currentLayers,
        transactions: [],
        auditLogs: [],
        errorMessage: result.errorMessage
      };
    }

    InventoryRepository.saveLayers(result.updatedLayers);
    InventoryRepository.recordTransactions(result.generatedTransactions);

    return {
      success: true,
      updatedLayers: result.updatedLayers,
      transactions: result.generatedTransactions,
      auditLogs: result.auditLogs
    };
  }

  /**
   * Process Stocktake Discrepancy Adjustments
   */
  static processStocktake(
    stocktake: Stocktake,
    actor: string
  ): {
    success: boolean;
    updatedLayers: InventoryLayer[];
    transactions: StockTransaction[];
    generatedTransactions?: StockTransaction[];
    auditLogs: AuditLog[];
    errorMessage?: string;
  } {
    const currentLayers = InventoryRepository.getAllLayers();
    const result = fifoEngine.executeStocktake(stocktake, currentLayers, actor);

    if (!result.success) {
      return {
        success: false,
        updatedLayers: currentLayers,
        transactions: [],
        generatedTransactions: [],
        auditLogs: [],
        errorMessage: result.errorMessage
      };
    }

    InventoryRepository.saveLayers(result.updatedLayers);
    InventoryRepository.recordTransactions(result.generatedTransactions);

    return {
      success: true,
      updatedLayers: result.updatedLayers,
      transactions: result.generatedTransactions,
      generatedTransactions: result.generatedTransactions,
      auditLogs: result.auditLogs
    };
  }
}
