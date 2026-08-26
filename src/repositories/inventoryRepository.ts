import {
  InventoryLayer,
  StockTransaction,
  Stocktake,
  StockTransfer,
  CanonicalTransactionType,
  Product
} from '../types';

export interface InventoryFilterOptions {
  tenantId?: string;
  branchId?: string;
  warehouseId?: string;
  sku?: string;
  lotId?: string;
  startDate?: string;
  endDate?: string;
}

export class InventoryRepository {
  private static layers: Map<string, InventoryLayer> = new Map();
  private static transactions: StockTransaction[] = [];
  private static stocktakes: Stocktake[] = [];
  private static stockTransfers: StockTransfer[] = [];

  // Idempotency Tracking: Map of idempotencyKey -> transactionId / response
  private static idempotencyRecords: Map<string, { transactionIds: string[]; timestamp: string }> = new Map();

  /**
   * Seed / Initialize with initial layers & transactions
   */
  static initialize(layers: InventoryLayer[], transactions: StockTransaction[] = []): void {
    this.layers.clear();
    for (const l of layers) {
      const key = l.id || `${l.tenantId || 'DEFAULT'}:${l.warehouseId}:${l.layerId || l.sku}`;
      this.layers.set(key, { ...l });
    }
    this.transactions = transactions.map((t) => ({ ...t }));
  }

  // --- LAYER OPERATIONS ---

  static findLayerById(id: string): InventoryLayer | null {
    const layer = this.layers.get(id);
    if (!layer) return null;
    return { ...layer };
  }

  static getAllLayers(filter?: InventoryFilterOptions): InventoryLayer[] {
    let result = Array.from(this.layers.values()).map((l) => ({ ...l }));
    if (!filter) return result;

    if (filter.tenantId && filter.tenantId !== 'all') {
      result = result.filter((l) => !l.tenantId || l.tenantId === filter.tenantId);
    }
    if (filter.branchId && filter.branchId !== 'all') {
      result = result.filter((l) => l.branchId === filter.branchId);
    }
    if (filter.warehouseId && filter.warehouseId !== 'all') {
      result = result.filter((l) => l.warehouseId === filter.warehouseId);
    }
    if (filter.sku) {
      result = result.filter((l) => l.sku.toLowerCase() === filter.sku!.toLowerCase());
    }
    return result;
  }

  static saveLayer(layer: InventoryLayer): InventoryLayer {
    const key = layer.id || `LAYER-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const saved = { ...layer, id: key };
    this.layers.set(key, saved);
    return { ...saved };
  }

  static saveLayers(layers: InventoryLayer[]): InventoryLayer[] {
    return layers.map((l) => this.saveLayer(l));
  }

  static updateLayer(id: string, updates: Partial<InventoryLayer>): InventoryLayer | null {
    const existing = this.layers.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates };
    this.layers.set(id, updated);
    return { ...updated };
  }

  // --- TRANSACTION OPERATIONS ---

  static recordTransaction(tx: StockTransaction, idempotencyKey?: string): StockTransaction {
    if (idempotencyKey) {
      const existing = this.idempotencyRecords.get(idempotencyKey);
      if (existing) {
        const found = this.transactions.find((t) => existing.transactionIds.includes(t.id));
        if (found) return { ...found };
      }
    }

    const savedTx: StockTransaction = {
      ...tx,
      id: tx.id || `TX-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: tx.date || new Date().toISOString().replace('T', ' ').substring(0, 16)
    };

    this.transactions.unshift(savedTx);

    if (idempotencyKey) {
      this.idempotencyRecords.set(idempotencyKey, {
        transactionIds: [savedTx.id],
        timestamp: new Date().toISOString()
      });
    }

    return { ...savedTx };
  }

  static recordTransactions(txs: StockTransaction[], idempotencyKey?: string): StockTransaction[] {
    if (idempotencyKey) {
      const existing = this.idempotencyRecords.get(idempotencyKey);
      if (existing) {
        return this.transactions.filter((t) => existing.transactionIds.includes(t.id)).map((t) => ({ ...t }));
      }
    }

    const savedList = txs.map((tx) => ({
      ...tx,
      id: tx.id || `TX-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      date: tx.date || new Date().toISOString().replace('T', ' ').substring(0, 16)
    }));

    this.transactions = [...savedList, ...this.transactions];

    if (idempotencyKey) {
      this.idempotencyRecords.set(idempotencyKey, {
        transactionIds: savedList.map((s) => s.id),
        timestamp: new Date().toISOString()
      });
    }

    return savedList.map((s) => ({ ...s }));
  }

  static getTransactions(filter?: InventoryFilterOptions): StockTransaction[] {
    let result = this.transactions.map((t) => ({ ...t }));
    if (!filter) return result;

    if (filter.tenantId && filter.tenantId !== 'all') {
      result = result.filter((t) => !t.tenantId || t.tenantId === filter.tenantId);
    }
    if (filter.branchId && filter.branchId !== 'all') {
      result = result.filter((t) => t.branchId === filter.branchId);
    }
    if (filter.warehouseId && filter.warehouseId !== 'all') {
      result = result.filter((t) => t.warehouseId === filter.warehouseId);
    }
    if (filter.sku) {
      result = result.filter((t) => t.sku.toLowerCase() === filter.sku!.toLowerCase());
    }
    if (filter.lotId) {
      result = result.filter((t) => t.lotId === filter.lotId);
    }
    if (filter.startDate) {
      result = result.filter((t) => t.date >= filter.startDate!);
    }
    if (filter.endDate) {
      result = result.filter((t) => t.date <= filter.endDate!);
    }
    return result;
  }

  // --- REVERSAL OF TRANSACTION ---
  static createReversalTransaction(
    originalTransactionId: string,
    reason: string,
    actor: string
  ): StockTransaction | null {
    const orig = this.transactions.find((t) => t.id === originalTransactionId);
    if (!orig || orig.status === 'REVERSED') return null;

    // Mark original as REVERSED
    orig.status = 'REVERSED';

    // Create opposite transaction
    const reversalTx: StockTransaction = {
      id: `TX-${Date.now()}-REV-${Math.random().toString(36).substring(2, 6)}`,
      tenantId: orig.tenantId,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: orig.qtyIn > 0 ? 'Điều chỉnh giảm' : 'Điều chỉnh tăng',
      canonicalType: 'REVERSAL',
      docCode: `REV-${orig.docCode}`,
      referenceType: 'REVERSAL',
      referenceId: orig.id,
      sku: orig.sku,
      productId: orig.productId,
      productName: orig.productName,
      lotId: orig.lotId,
      branchId: orig.branchId,
      warehouseId: orig.warehouseId,
      qtyIn: orig.qtyOut, // Flip qty
      qtyOut: orig.qtyIn,
      balance: orig.balance + (orig.qtyOut - orig.qtyIn),
      unitCost: orig.unitCost,
      totalValue: orig.totalValue,
      actor,
      reason,
      reversalOfTransactionId: orig.id,
      status: 'POSTED',
      note: `Hoàn tác giao dịch ${orig.id} (${orig.docCode}): ${reason}`
    };

    this.transactions.unshift(reversalTx);
    return { ...reversalTx };
  }

  // --- STOCK BALANCES FROM LEDGER ---

  static getStockBalance(tenantId: string, warehouseId: string, sku: string): number {
    const matchingLayers = Array.from(this.layers.values()).filter((l) => {
      const matchTenant = !tenantId || tenantId === 'all' || !l.tenantId || l.tenantId === tenantId;
      const matchWh = !warehouseId || warehouseId === 'all' || l.warehouseId === warehouseId;
      const matchSku = l.sku.toLowerCase() === sku.toLowerCase();
      return matchTenant && matchWh && matchSku;
    });

    return matchingLayers.reduce((sum, l) => {
      const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0);
      return sum + (isNaN(qty) ? 0 : qty);
    }, 0);
  }

  static clear(): void {
    this.layers.clear();
    this.transactions = [];
    this.stocktakes = [];
    this.stockTransfers = [];
    this.idempotencyRecords.clear();
  }
}
