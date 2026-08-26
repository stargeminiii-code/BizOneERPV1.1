import {
  Order,
  OrderTransactionSnapshot,
  OrderItemSnapshot,
  RecipeComponent,
  FIFOAllocation
} from '../../types';
import { PriceVersionService } from '../pricing/priceVersionService';
import { RecipeVersionService } from '../recipe/recipeVersionService';
import { RecipeCostService } from '../recipe/recipeCostService';
import { InventoryRepository } from '../../repositories/inventoryRepository';
import { fifoEngine } from '../fifoEngine';

export class TransactionSnapshotService {
  private static snapshots: Map<string, OrderTransactionSnapshot> = new Map();

  static clear(): void {
    this.snapshots.clear();
  }

  static initialize(snapshots: OrderTransactionSnapshot[] = []): void {
    this.clear();
    for (const s of snapshots) {
      this.snapshots.set(s.orderId, { ...s });
    }
  }

  static getSnapshot(orderId: string): OrderTransactionSnapshot | null {
    const found = this.snapshots.get(orderId);
    return found ? { ...found } : null;
  }

  static saveSnapshot(snapshot: OrderTransactionSnapshot): void {
    this.snapshots.set(snapshot.orderId, { ...snapshot });
  }

  /**
   * Builds an immutable, self-contained transaction snapshot for an order.
   * Resolves exact selling price, recipe version, expected cost, and actual FIFO cost at the order timestamp.
   * NEVER depends on mutable Product Master afterwards.
   */
  static createOrderSnapshot(
    order: Order,
    transactionDate?: string | Date
  ): OrderTransactionSnapshot {
    const tenantId = (order as any).tenantId || 'DEFAULT';
    const effectiveAt = transactionDate || order.orderDate || order.createdAt || new Date().toISOString();
    const warehouseId = order.warehouseId || 'WH01';
    const branchId = order.branchId || 'BR01';

    let totalRevenue = 0;
    let totalActualCogs = 0;
    let totalStandardCogs = 0;
    const itemSnapshots: OrderItemSnapshot[] = [];

    const existingLayers = InventoryRepository.getAllLayers({
      tenantId,
      warehouseId
    });

    order.items.forEach((item, index) => {
      const itemQty = item.quantity;
      const unitPrice = item.unitPrice ?? (item as any).price ?? 0;
      const itemTotal = item.totalPrice || itemQty * unitPrice;
      totalRevenue += itemTotal;

      // 1. Resolve price version at order time
      const priceRes = PriceVersionService.resolveSellingPrice(
        tenantId,
        item.sku,
        effectiveAt
      );

      // 2. Resolve recipe at order time
      const recipeRes = RecipeVersionService.resolveRecipe(
        tenantId,
        item.sku,
        effectiveAt
      );

      let recipeSnapshot:
        | {
            recipeId: string;
            version: number;
            recipeCode: string;
            components: RecipeComponent[];
          }
        | undefined;

      let expectedCost = 0;
      let actualFifoCost = 0;
      let fifoAllocations: FIFOAllocation[] = [];

      if (recipeRes.status === 'SUCCESS' && recipeRes.version) {
        const r = recipeRes.version;
        recipeSnapshot = {
          recipeId: r.recipeId,
          version: r.version,
          recipeCode: r.recipeCode,
          components: r.components.map((c) => ({ ...c }))
        };

        // Calculate recipe cost
        const costRes = RecipeCostService.calculateRecipeCost(
          tenantId,
          item.sku,
          itemQty,
          warehouseId,
          effectiveAt
        );

        expectedCost = costRes.totalExpectedCost;
        actualFifoCost = costRes.totalActualFifoCost;
        fifoAllocations = costRes.items.flatMap((i) => i.allocations);
      } else {
        // Direct standard good (no recipe) -> standard FIFO deduction preview
        const fifoRes = fifoEngine.previewFifoAllocation(
          item.sku,
          itemQty,
          existingLayers,
          {
            issueCode: order.code,
            productName: item.productName || item.sku
          }
        );

        actualFifoCost = fifoRes.totalCost;
        expectedCost = actualFifoCost; // Default expected = actual if no recipe
        fifoAllocations = fifoRes.allocations;
      }

      totalActualCogs += actualFifoCost;
      totalStandardCogs += expectedCost;

      const itemGrossProfit = itemTotal - actualFifoCost;
      const itemGrossMargin = itemTotal > 0 ? (itemGrossProfit / itemTotal) * 100 : 0;

      itemSnapshots.push({
        itemIndex: index,
        productId: (item as any).productId || `P-${item.sku}`,
        sku: item.sku,
        productName: item.productName,
        unit: (item as any).unit || 'ly',
        quantity: itemQty,
        unitPrice,
        totalPrice: itemTotal,
        discountAmount: (item as any).discountAmount || 0,
        priceVersionId: priceRes.status === 'SUCCESS' ? priceRes.version?.versionId : undefined,
        recipeVersionId: recipeRes.status === 'SUCCESS' ? recipeRes.version?.versionId : undefined,
        recipeSnapshot,
        fifoAllocations,
        actualFifoCost,
        expectedStandardCost: expectedCost,
        costVariance: actualFifoCost - expectedCost,
        grossProfit: itemGrossProfit,
        grossMarginPercent: itemGrossMargin
      });
    });

    const totalCogsVariance = totalActualCogs - totalStandardCogs;
    const grossProfit = totalRevenue - totalActualCogs;
    const grossMarginPercent = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    const snapshot: OrderTransactionSnapshot = {
      orderId: order.id,
      orderCode: order.code,
      snapshotTimestamp: typeof effectiveAt === 'string' ? effectiveAt : new Date(effectiveAt).toISOString(),
      tenantId,
      branchId,
      warehouseId,
      totalRevenue,
      totalActualCogs,
      totalStandardCogs,
      cogsVariance: totalCogsVariance,
      grossProfit,
      grossMarginPercent,
      items: itemSnapshots,
      isFinalized: true
    };

    this.snapshots.set(order.id, snapshot);
    return snapshot;
  }

  /**
   * Retrieves all order transaction snapshots.
   */
  static getAllSnapshots(): OrderTransactionSnapshot[] {
    return Array.from(this.snapshots.values());
  }
}
