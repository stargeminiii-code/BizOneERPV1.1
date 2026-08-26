import {
  PreparationBatch,
  PreparationBatchInput,
  InventoryLayer,
  StockTransaction,
  AuditLog
} from '../../types';
import { InventoryRepository } from '../../repositories/inventoryRepository';
import { fifoEngine } from '../fifoEngine';
import { RecipeVersionService } from '../recipe/recipeVersionService';

export class PreparationBatchService {
  private static batches: Map<string, PreparationBatch> = new Map();

  static clear(): void {
    this.batches.clear();
  }

  static initialize(batches: PreparationBatch[] = []): void {
    this.clear();
    for (const b of batches) {
      this.batches.set(b.batchId, { ...b });
    }
  }

  static getAllBatches(tenantId?: string): PreparationBatch[] {
    const list = Array.from(this.batches.values());
    if (!tenantId || tenantId === 'all') return list;
    return list.filter((b) => !b.tenantId || b.tenantId === tenantId);
  }

  static getBatchById(batchId: string): PreparationBatch | null {
    const found = this.batches.get(batchId);
    return found ? { ...found } : null;
  }

  /**
   * Executes a preparation batch:
   * 1. Validates recipe version
   * 2. Issues input raw materials from inventory layers using strict FIFO
   * 3. Calculates total input cost
   * 4. Produces output semi-finished goods and adds new inventory layer (PRODUCTION_IN)
   * 5. Records immutable Batch record and stock transactions
   */
  static executePreparationBatch(
    params: {
      tenantId: string;
      branchId: string;
      branchName?: string;
      warehouseId: string;
      warehouseName?: string;
      outputSku: string;
      outputProductName: string;
      recipeVersionId?: string;
      plannedOutputQty: number;
      actualOutputQty: number;
      outputUnit: string;
      operator: string;
      operatorId?: string;
      notes?: string;
      producedAt?: string;
      expiryDate?: string;
    },
    actor: string
  ): {
    success: boolean;
    batch?: PreparationBatch;
    outputLayer?: InventoryLayer;
    transactions: StockTransaction[];
    auditLogs: AuditLog[];
    errorMessage?: string;
  } {
    const producedAt = params.producedAt || new Date().toISOString();
    const batchCode = `BATCH-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const batchId = `PB-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Resolve recipe
    let recipe = params.recipeVersionId
      ? RecipeVersionService.getRecipeVersionById(params.tenantId, params.recipeVersionId)
      : null;

    if (!recipe) {
      const res = RecipeVersionService.resolveRecipe(params.tenantId, params.outputSku, producedAt);
      if (res.status === 'SUCCESS' && res.version) {
        recipe = res.version;
      }
    }

    if (!recipe) {
      return {
        success: false,
        transactions: [],
        auditLogs: [],
        errorMessage: `Cannot execute batch: No valid recipe found for ${params.outputSku} at ${producedAt}`
      };
    }

    // Mark recipe as referenced
    RecipeVersionService.markAsReferenced(params.tenantId, recipe.versionId);

    // Calculate required input quantities
    const factor = params.actualOutputQty / (recipe.yieldQuantity || 1);
    const existingLayers = InventoryRepository.getAllLayers({
      tenantId: params.tenantId,
      warehouseId: params.warehouseId
    });

    let currentLayers = [...existingLayers];
    let totalBatchCost = 0;
    const inputMaterials: PreparationBatchInput[] = [];
    const generatedTransactions: StockTransaction[] = [];

    // Deduct each component from inventory
    for (const comp of recipe.components) {
      const requiredQty = comp.quantity * factor * (1 + (comp.lossPercent || 0) / 100);

      const fifoRes = fifoEngine.previewFifoAllocation(comp.componentSku, requiredQty, currentLayers, {
        issueCode: batchCode,
        productName: comp.componentName
      });

      if (!fifoRes.isSufficientStock) {
        return {
          success: false,
          transactions: [],
          auditLogs: [],
          errorMessage: `Không đủ tồn kho nguyên liệu '${comp.componentName}' (${comp.componentSku}). Cần: ${requiredQty} ${comp.unit}, khả dụng: ${fifoRes.totalAllocatedQty} ${comp.unit}.`
        };
      }

      currentLayers = fifoRes.updatedLayers;
      totalBatchCost += fifoRes.totalCost;

      inputMaterials.push({
        sku: comp.componentSku,
        productName: comp.componentName,
        quantity: requiredQty,
        unit: comp.unit,
        unitCost: requiredQty > 0 ? fifoRes.totalCost / requiredQty : 0,
        totalCost: fifoRes.totalCost,
        fifoAllocations: fifoRes.allocations
      });

      // Stock transaction for raw material consumption
      generatedTransactions.push({
        id: `TX-OUT-${batchId}-${comp.componentSku}`,
        tenantId: params.tenantId,
        date: producedAt,
        type: 'Xuất chuyển kho',
        canonicalType: 'PRODUCTION_OUT',
        docCode: batchCode,
        referenceType: 'PRODUCTION_BATCH',
        referenceId: batchId,
        sku: comp.componentSku,
        productName: comp.componentName,
        branchId: params.branchId,
        warehouseId: params.warehouseId,
        qtyIn: 0,
        qtyOut: requiredQty,
        quantity: -requiredQty,
        balance: 0,
        unitCost: requiredQty > 0 ? fifoRes.totalCost / requiredQty : 0,
        totalValue: fifoRes.totalCost,
        totalCost: fifoRes.totalCost,
        actor,
        note: `Xuất nguyên liệu phục vụ mẻ sơ chế/sản xuất ${params.outputProductName}`
      });
    }

    const unitBatchCost = params.actualOutputQty > 0 ? totalBatchCost / params.actualOutputQty : 0;

    // Create new Inventory Layer for the produced semi-finished good
    const layerId = `LOT-PROD-${batchCode}`;
    const outputLayer: InventoryLayer = {
      id: `LAYER-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      tenantId: params.tenantId,
      layerId,
      lotNumber: batchCode,
      layerType: 'PRODUCTION_IN',
      sku: params.outputSku,
      productId: recipe.productId || `P-${params.outputSku}`,
      productCode: params.outputSku,
      productName: params.outputProductName,
      unit: params.outputUnit,
      branchId: params.branchId,
      branchName: params.branchName,
      warehouseId: params.warehouseId,
      warehouseName: params.warehouseName,
      supplierName: 'Nội bộ - Tự sản xuất / Pha chế',
      receiptCode: batchCode,
      receivedAt: producedAt.slice(0, 10),
      createdAt: producedAt,
      expiryDate: params.expiryDate,
      quantityReceived: params.actualOutputQty,
      quantityIssued: 0,
      quantityRemaining: params.actualOutputQty,
      purchasePrice: unitBatchCost,
      unitCost: unitBatchCost,
      salePrice: 0,
      status: 'active',
      createdBy: actor,
      notes: `Mẻ sơ chế ${batchCode}`
    };

    currentLayers.push(outputLayer);

    // Stock transaction for produced semi-finished intake
    generatedTransactions.push({
      id: `TX-IN-${batchId}-${params.outputSku}`,
      tenantId: params.tenantId,
      date: producedAt,
      type: 'Nhập kho',
      canonicalType: 'PRODUCTION_IN',
      docCode: batchCode,
      referenceType: 'PRODUCTION_BATCH',
      referenceId: batchId,
      sku: params.outputSku,
      productName: params.outputProductName,
      branchId: params.branchId,
      warehouseId: params.warehouseId,
      qtyIn: params.actualOutputQty,
      qtyOut: 0,
      quantity: params.actualOutputQty,
      balance: 0,
      unitCost: unitBatchCost,
      totalValue: totalBatchCost,
      totalCost: totalBatchCost,
      actor,
      note: `Nhập kho thành phẩm mẻ sơ chế ${params.outputProductName}`
    });

    // Save updated layers and transactions to InventoryRepository
    InventoryRepository.saveLayers(currentLayers);
    InventoryRepository.recordTransactions(generatedTransactions);

    const batchRecord: PreparationBatch = {
      batchId,
      code: batchCode,
      tenantId: params.tenantId,
      branchId: params.branchId,
      branchName: params.branchName,
      warehouseId: params.warehouseId,
      warehouseName: params.warehouseName,
      recipeVersionId: recipe.versionId,
      recipeCode: recipe.recipeCode,
      outputSku: params.outputSku,
      outputProductName: params.outputProductName,
      plannedOutputQty: params.plannedOutputQty,
      actualOutputQty: params.actualOutputQty,
      outputUnit: params.outputUnit,
      inputMaterials,
      totalBatchCost,
      unitBatchCost,
      producedAt,
      expiryDate: params.expiryDate,
      operator: params.operator,
      operatorId: params.operatorId,
      status: 'COMPLETED',
      createdLayerId: outputLayer.id,
      notes: params.notes,
      createdAt: new Date().toISOString()
    };

    this.batches.set(batchId, batchRecord);

    const auditLog: AuditLog = {
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: new Date().toISOString(),
      userId: params.operatorId || 'system',
      userName: actor,
      action: 'created',
      referenceType: 'PO',
      referenceId: batchId,
      description: `Hoàn tất mẻ sơ chế ${batchCode} (${params.actualOutputQty} ${params.outputUnit} ${params.outputProductName}) với tổng chi phí ${totalBatchCost.toLocaleString('vi-VN')} đ`
    };

    return {
      success: true,
      batch: batchRecord,
      outputLayer,
      transactions: generatedTransactions,
      auditLogs: [auditLog]
    };
  }
}
