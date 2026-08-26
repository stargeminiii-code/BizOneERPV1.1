import {
  ConsumptionEvent,
  AccumulatedConsumptionState,
  StockTransaction,
  Order,
  AuditLog,
  ConsumptionPolicy
} from '../../types';
import { InventoryRepository } from '../../repositories/inventoryRepository';
import { fifoEngine } from '../fifoEngine';
import { RecipeVersionService } from '../recipe/recipeVersionService';

export class ConsumptionService {
  // Append-only Ledger
  private static ledger: ConsumptionEvent[] = [];
  // Accumulation State Map: key = `${tenantId}:${warehouseId}:${sku}`
  private static accumulationStates: Map<string, AccumulatedConsumptionState> = new Map();
  // Configurable thresholds: key = `${tenantId}:${sku}` -> number
  private static configuredThresholds: Map<string, number> = new Map();
  // Processed order set for idempotency
  private static processedOrderIds: Set<string> = new Set();

  static clear(): void {
    this.ledger = [];
    this.accumulationStates.clear();
    this.configuredThresholds.clear();
    this.processedOrderIds.clear();
  }

  static initialize(
    events: ConsumptionEvent[] = [],
    states: AccumulatedConsumptionState[] = []
  ): void {
    this.clear();
    this.ledger = events.map((e) => ({ ...e }));
    for (const s of states) {
      const key = `${s.tenantId || 'DEFAULT'}:${s.warehouseId}:${s.sku}`;
      this.accumulationStates.set(key, { ...s });
    }
    for (const e of events) {
      if (e.orderId) {
        this.processedOrderIds.add(e.orderId);
      }
    }
  }

  /**
   * Configure threshold for a material/ingredient (e.g. 500g, 1000g, 1000ml)
   */
  static setThreshold(tenantId: string, sku: string, thresholdQty: number): void {
    const key = `${tenantId || 'DEFAULT'}:${sku}`;
    this.configuredThresholds.set(key, thresholdQty);
  }

  static getThreshold(tenantId: string, sku: string, defaultFallback = 500): number {
    const key = `${tenantId || 'DEFAULT'}:${sku}`;
    return this.configuredThresholds.get(key) || defaultFallback;
  }

  static getLedger(tenantId?: string, orderId?: string): ConsumptionEvent[] {
    let list = this.ledger;
    if (tenantId && tenantId !== 'all') {
      list = list.filter((e) => !e.tenantId || e.tenantId === tenantId);
    }
    if (orderId) {
      list = list.filter((e) => e.orderId === orderId);
    }
    return list.map((e) => ({ ...e }));
  }

  static getAccumulationState(
    tenantId: string,
    warehouseId: string,
    sku: string
  ): AccumulatedConsumptionState | null {
    const key = `${tenantId || 'DEFAULT'}:${warehouseId}:${sku}`;
    const state = this.accumulationStates.get(key);
    return state ? { ...state } : null;
  }

  static getAllAccumulationStates(tenantId?: string): AccumulatedConsumptionState[] {
    const list = Array.from(this.accumulationStates.values());
    if (!tenantId || tenantId === 'all') return list;
    return list.filter((s) => !s.tenantId || s.tenantId === tenantId);
  }

  /**
   * Process order consumption:
   * 1. Check idempotency: If order was already processed, return cached/noop
   * 2. Expand multi-level recipe for all beverage/food items in order
   * 3. For PER_TRANSACTION items: deduct immediately from inventory layers via FIFO
   * 4. For ACCUMULATED_THRESHOLD items:
   *    - Append consumption event to ledger
   *    - Add quantity to accumulation state
   *    - If accumulated >= threshold:
   *        deduct full threshold chunks via FIFO, leaving remainder (e.g. 620g with 500g threshold -> deduct 500g, pending = 120g)
   * 5. Return generated transactions & updated states
   */
  static processOrderConsumption(
    order: Order,
    actor: string,
    idempotencyKey?: string
  ): {
    success: boolean;
    alreadyProcessed?: boolean;
    consumptionEvents: ConsumptionEvent[];
    generatedTransactions: StockTransaction[];
    auditLogs: AuditLog[];
    errorMessage?: string;
  } {
    const tenantId = (order as any).tenantId || 'DEFAULT';
    const warehouseId = order.warehouseId || 'WH01';
    const branchId = order.branchId || 'BR01';
    const orderKey = idempotencyKey || order.id || order.code;

    // Idempotency check
    if (this.processedOrderIds.has(orderKey)) {
      const existingEvents = this.ledger.filter((e) => e.orderId === order.id || e.orderCode === order.code);
      return {
        success: true,
        alreadyProcessed: true,
        consumptionEvents: existingEvents,
        generatedTransactions: [],
        auditLogs: []
      };
    }

    const orderDate = order.orderDate || order.createdAt || new Date().toISOString();
    const createdEvents: ConsumptionEvent[] = [];
    const generatedTransactions: StockTransaction[] = [];
    const auditLogs: AuditLog[] = [];

    const existingLayers = InventoryRepository.getAllLayers({
      tenantId,
      warehouseId
    });
    let currentLayers = [...existingLayers];

    for (const item of order.items) {
      // Expand recipe for item
      const bomRes = RecipeVersionService.expandMultiLevelBOM(
        tenantId,
        item.sku,
        item.quantity,
        orderDate
      );

      if (!bomRes.success || !bomRes.expandedComponents || bomRes.expandedComponents.length === 0) {
        // If not a recipe item (e.g. standard trading good), standard issue is handled by InventoryService
        continue;
      }

      // Mark recipe as referenced
      if (bomRes.rootRecipe) {
        RecipeVersionService.markAsReferenced(tenantId, bomRes.rootRecipe.versionId);
      }

      for (const comp of bomRes.expandedComponents) {
        const policy = comp.consumptionPolicy || 'PER_TRANSACTION';
        const eventId = `EVT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

        const event: ConsumptionEvent = {
          eventId,
          tenantId,
          orderId: order.id,
          orderCode: order.code,
          orderItemId: (item as any).id || `${order.id}-${item.sku}`,
          productSku: item.sku,
          productName: item.productName,
          recipeVersionId: comp.sourceRecipeVersionId,
          componentSku: comp.sku,
          componentName: comp.name,
          quantity: comp.totalRequiredQuantity,
          unit: comp.unit,
          branchId,
          warehouseId,
          occurredAt: orderDate,
          consumptionPolicy: policy,
          status: 'RECORDED',
          idempotencyKey: `${orderKey}:${comp.sku}`,
          createdAt: new Date().toISOString()
        };

        if (policy === 'PER_TRANSACTION') {
          // Direct FIFO Deduction
          const fifoRes = fifoEngine.previewFifoAllocation(
            comp.sku,
            comp.totalRequiredQuantity,
            currentLayers,
            {
              issueCode: order.code,
              productName: comp.name
            }
          );

          if (fifoRes.isSufficientStock) {
            currentLayers = fifoRes.updatedLayers;
            event.status = 'ISSUED';

            const tx: StockTransaction = {
              id: `TX-CONS-${order.id}-${comp.sku}`,
              tenantId,
              date: orderDate,
              type: 'Xuất bán',
              canonicalType: 'ISSUE',
              docCode: order.code,
              referenceType: 'ORDER_CONSUMPTION',
              referenceId: order.id,
              sku: comp.sku,
              productName: comp.name,
              branchId,
              warehouseId,
              qtyIn: 0,
              qtyOut: comp.totalRequiredQuantity,
              quantity: -comp.totalRequiredQuantity,
              balance: 0,
              unitCost: comp.totalRequiredQuantity > 0 ? fifoRes.totalCost / comp.totalRequiredQuantity : 0,
              totalValue: fifoRes.totalCost,
              totalCost: fifoRes.totalCost,
              actor,
              note: `Xuất hao hụt/nguyên liệu pha chế cho đơn ${order.code} (${item.productName})`
            };

            generatedTransactions.push(tx);
            event.stockTransactionId = tx.id;
          } else {
            event.status = 'PROCESSED'; // Recorded even if stock low (to be reconciled)
          }
        } else {
          // ACCUMULATED_THRESHOLD mode
          const threshold =
            comp.consumptionThreshold || this.getThreshold(tenantId, comp.sku, 500);

          const stateKey = `${tenantId}:${warehouseId}:${comp.sku}`;
          let state = this.accumulationStates.get(stateKey);

          if (!state) {
            state = {
              id: `ACC-${tenantId}-${comp.sku}`,
              tenantId,
              warehouseId,
              sku: comp.sku,
              unit: comp.unit,
              thresholdQuantity: threshold,
              accumulatedQuantity: 0,
              pendingQuantity: 0,
              totalIssuedQuantity: 0,
              updatedAt: new Date().toISOString()
            };
          }

          state.thresholdQuantity = threshold;
          state.accumulatedQuantity += comp.totalRequiredQuantity;
          state.pendingQuantity += comp.totalRequiredQuantity;
          state.updatedAt = new Date().toISOString();

          // Check if pending remainder has crossed threshold
          if (state.pendingQuantity >= state.thresholdQuantity) {
            // Calculate how many threshold batches to issue (e.g. 620g with 500g threshold -> 1 batch of 500g, remainder 120g)
            const batchesToIssue = Math.floor(state.pendingQuantity / state.thresholdQuantity);
            const totalQtyToIssue = batchesToIssue * state.thresholdQuantity;

            // Deduct via FIFO
            const fifoRes = fifoEngine.previewFifoAllocation(
              comp.sku,
              totalQtyToIssue,
              currentLayers,
              {
                issueCode: `PX-ACC-${order.code}`,
                productName: comp.name
              }
            );

            if (fifoRes.isSufficientStock) {
              currentLayers = fifoRes.updatedLayers;
              state.pendingQuantity = state.pendingQuantity - totalQtyToIssue;
              state.totalIssuedQuantity += totalQtyToIssue;
              state.lastIssuedAt = new Date().toISOString();

              const tx: StockTransaction = {
                id: `TX-ACC-${Date.now()}-${comp.sku}`,
                tenantId,
                date: orderDate,
                type: 'Xuất bán',
                canonicalType: 'ISSUE',
                docCode: `PX-ACC-${order.code}`,
                referenceType: 'ACCUMULATED_CONSUMPTION',
                referenceId: order.id,
                sku: comp.sku,
                productName: comp.name,
                branchId,
                warehouseId,
                qtyIn: 0,
                qtyOut: totalQtyToIssue,
                quantity: -totalQtyToIssue,
                balance: 0,
                unitCost: totalQtyToIssue > 0 ? fifoRes.totalCost / totalQtyToIssue : 0,
                totalValue: fifoRes.totalCost,
                totalCost: fifoRes.totalCost,
                actor,
                note: `Xuất kho tích lũy đạt ngưỡng ${threshold} ${comp.unit} (Tổng tích lũy: ${state.accumulatedQuantity} ${comp.unit}, còn dư chờ: ${state.pendingQuantity} ${comp.unit})`
              };

              generatedTransactions.push(tx);
              event.status = 'ISSUED';
              event.stockTransactionId = tx.id;
            } else {
              event.status = 'ACCUMULATED';
            }
          } else {
            event.status = 'ACCUMULATED';
          }

          this.accumulationStates.set(stateKey, state);
        }

        createdEvents.push(event);
        this.ledger.push(event);
      }
    }

    // Save updated layers and stock transactions
    if (generatedTransactions.length > 0) {
      InventoryRepository.saveLayers(currentLayers);
      InventoryRepository.recordTransactions(generatedTransactions);
    }

    this.processedOrderIds.add(orderKey);

    return {
      success: true,
      consumptionEvents: createdEvents,
      generatedTransactions,
      auditLogs
    };
  }

  /**
   * Manually flushes pending accumulation (e.g. at end of shift/day reconciliation).
   */
  static flushPendingAccumulation(
    tenantId: string,
    warehouseId: string,
    sku: string,
    actor = 'Quản lý quầy bar'
  ): {
    success: boolean;
    flushedQuantity: number;
    generatedTransaction?: StockTransaction;
    errorMessage?: string;
  } {
    const stateKey = `${tenantId}:${warehouseId}:${sku}`;
    const state = this.accumulationStates.get(stateKey);

    if (!state || state.pendingQuantity <= 0) {
      return {
        success: false,
        flushedQuantity: 0,
        errorMessage: 'Không có số lượng tích lũy đang chờ xuất kho'
      };
    }

    const qtyToFlush = state.pendingQuantity;
    const currentLayers = InventoryRepository.getAllLayers({ tenantId, warehouseId });
    const fifoRes = fifoEngine.previewFifoAllocation(sku, qtyToFlush, currentLayers, {
      issueCode: `PX-FLUSH-${Date.now()}`,
      productName: `Xả tích lũy tồn quầy (${sku})`
    });

    if (!fifoRes.isSufficientStock) {
      return {
        success: false,
        flushedQuantity: 0,
        errorMessage: `Tồn kho không đủ để xuất chốt ca (${fifoRes.totalAllocatedQty}/${qtyToFlush})`
      };
    }

    InventoryRepository.saveLayers(fifoRes.updatedLayers);

    const tx: StockTransaction = {
      id: `TX-FLUSH-${Date.now()}-${sku}`,
      tenantId,
      date: new Date().toISOString(),
      type: 'Điều chỉnh giảm',
      canonicalType: 'ISSUE',
      docCode: `PX-FLUSH-${Date.now()}`,
      referenceType: 'ACCUMULATED_CONSUMPTION',
      referenceId: state.id,
      sku,
      productName: `Xả tích lũy tồn quầy (${sku})`,
      branchId: 'BR01',
      warehouseId,
      qtyIn: 0,
      qtyOut: qtyToFlush,
      quantity: -qtyToFlush,
      balance: 0,
      unitCost: qtyToFlush > 0 ? fifoRes.totalCost / qtyToFlush : 0,
      totalValue: fifoRes.totalCost,
      totalCost: fifoRes.totalCost,
      actor,
      note: `Xuất chốt sổ ca / kiểm kê hao hụt quầy bar: ${qtyToFlush} ${state.unit}`
    };

    InventoryRepository.recordTransactions([tx]);

    state.pendingQuantity = 0;
    state.totalIssuedQuantity += qtyToFlush;
    state.lastIssuedAt = new Date().toISOString();
    state.updatedAt = new Date().toISOString();
    this.accumulationStates.set(stateKey, state);

    return {
      success: true,
      flushedQuantity: qtyToFlush,
      generatedTransaction: tx
    };
  }
}
