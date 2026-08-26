import {
  InventoryLayer,
  FIFOAllocation,
  StockTransaction,
  AuditLog,
  PurchaseOrder,
  PurchaseOrderItem,
  Product,
  StockTransfer,
  Stocktake
} from '../types';

export interface FifoAllocationResult {
  allocations: FIFOAllocation[];
  totalCost: number;
  totalAllocatedQty: number;
  remainingUnallocated: number;
  isSufficientStock: boolean;
  updatedLayers: InventoryLayer[];
}

export interface StockIssueRequestItem {
  sku: string;
  productId?: string;
  productName: string;
  quantity: number;
  salePrice?: number;
  unit?: string;
}

export interface FifoIssueExecutionResult {
  success: boolean;
  errorMessage?: string;
  allocations: FIFOAllocation[];
  itemAllocationsMap: Record<string, FIFOAllocation[]>;
  totalCogs: number;
  totalRevenue: number;
  updatedLayers: InventoryLayer[];
  generatedTransactions: StockTransaction[];
  auditLogs: AuditLog[];
}

/**
 * Core FIFO Engine Service
 * Guarantees First-In, First-Out inventory layer allocation and strict COGS accounting.
 */
export const fifoEngine = {
  /**
   * Sort layers by receivedAt ascending (earliest received first)
   */
  sortLayersFifo(layers: InventoryLayer[]): InventoryLayer[] {
    return [...layers].sort((a, b) => {
      const dateA = new Date(a.receivedAt || a.intakeDate || a.createdAt).getTime();
      const dateB = new Date(b.receivedAt || b.intakeDate || b.createdAt).getTime();
      if (dateA !== dateB) return dateA - dateB;
      // Secondary sort by ID/LayerID for stable ordering
      const idA = a.layerId || a.lotId || a.id;
      const idB = b.layerId || b.lotId || b.id;
      return idA.localeCompare(idB);
    });
  },

  /**
   * Filter active layers matching SKU (including variant pooling by parent product code/ID) and optional branch/warehouse constraints
   */
  getActiveLayersForSku(
    layers: InventoryLayer[],
    sku: string,
    filters?: { branchId?: string; warehouseId?: string; productId?: string; productCode?: string }
  ): InventoryLayer[] {
    const cleanSku = (sku || '').trim().toUpperCase();
    const basePrefix = cleanSku.split('-C')[0].split('-V')[0];

    return layers.filter((layer) => {
      if (layer.quantityRemaining <= 0) return false;
      if (layer.status === 'exhausted' || layer.status === 'locked') return false;
      if (filters?.branchId && layer.branchId && layer.branchId !== filters.branchId && filters.branchId !== 'all') {
        return false;
      }
      if (filters?.warehouseId && layer.warehouseId && layer.warehouseId !== filters.warehouseId && filters.warehouseId !== 'all') {
        return false;
      }

      const layerSku = (layer.sku || '').trim().toUpperCase();
      const layerVarSku = (layer.variantSku || '').trim().toUpperCase();
      const layerProdCode = (layer.productCode || '').trim().toUpperCase();

      // 1. Direct SKU or Variant SKU match
      if (layerSku === cleanSku || layerVarSku === cleanSku) return true;

      // 2. Product Code match
      if (filters?.productCode && (layerProdCode === filters.productCode || layerSku === filters.productCode)) return true;
      if (layerProdCode && (layerProdCode === cleanSku || cleanSku.startsWith(layerProdCode))) return true;

      // 3. Product ID match
      if (filters?.productId && (layer.productId === filters.productId || layer.productId === `PROD-${filters.productId}`)) return true;

      // 4. Variant Prefix match (e.g. VCCCM330-UHT matches VCCCM330-UHT-C01, VCCCM330-UHT-C02, etc.)
      if (basePrefix && basePrefix.length >= 3) {
        if (layerSku.startsWith(basePrefix) || layerProdCode.startsWith(basePrefix)) return true;
      }

      return false;
    });
  },

  /**
   * Get total available remaining stock for a SKU across active layers
   */
  getTotalAvailableStock(
    layers: InventoryLayer[],
    sku: string,
    filters?: { branchId?: string; warehouseId?: string; productId?: string; productCode?: string }
  ): number {
    const activeLayers = this.getActiveLayersForSku(layers, sku, filters);
    return activeLayers.reduce((sum, l) => {
      const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0);
      return sum + (isNaN(qty) ? 0 : qty);
    }, 0);
  },

  /**
   * Get the current next FIFO cost price for a SKU (price of the earliest active layer)
   */
  getNextFifoCost(
    layers: InventoryLayer[],
    sku: string,
    defaultFallbackCost: number = 0,
    filters?: { branchId?: string; warehouseId?: string; productId?: string; productCode?: string }
  ): number {
    const activeLayers = this.sortLayersFifo(this.getActiveLayersForSku(layers, sku, filters));
    if (activeLayers.length > 0) {
      return activeLayers[0].purchasePrice || activeLayers[0].costPrice || defaultFallbackCost;
    }
    return defaultFallbackCost;
  },

  /**
   * Compute FIFO Allocation without modifying state (Preview Mode)
   */
  previewFifoAllocation(
    sku: string,
    quantityNeeded: number,
    layers: InventoryLayer[],
    options?: {
      issueId?: string;
      issueCode?: string;
      productId?: string;
      productCode?: string;
      productName?: string;
      salePrice?: number;
      branchId?: string;
      warehouseId?: string;
    }
  ): FifoAllocationResult {
    if (quantityNeeded <= 0) {
      return {
        allocations: [],
        totalCost: 0,
        totalAllocatedQty: 0,
        remainingUnallocated: 0,
        isSufficientStock: true,
        updatedLayers: layers
      };
    }

    const matchingActiveLayers = this.sortLayersFifo(
      this.getActiveLayersForSku(layers, sku, {
        branchId: options?.branchId,
        warehouseId: options?.warehouseId,
        productId: options?.productId,
        productCode: options?.productCode
      })
    );

    let remainingToAllocate = quantityNeeded;
    let totalCost = 0;
    const allocations: FIFOAllocation[] = [];
    const updatedLayers = layers.map((l) => ({ ...l }));

    for (const layer of matchingActiveLayers) {
      if (remainingToAllocate <= 0) break;

      const layerInArray = updatedLayers.find((l) => l.id === layer.id);
      if (!layerInArray || layerInArray.quantityRemaining <= 0) continue;

      const allocateFromThisLayer = Math.min(remainingToAllocate, layerInArray.quantityRemaining);
      const unitCost = layerInArray.purchasePrice || layerInArray.costPrice || 0;
      const unitSale = options?.salePrice ?? (layerInArray.salePrice || 0);
      const costAmount = allocateFromThisLayer * unitCost;
      const revenueAmount = allocateFromThisLayer * unitSale;

      allocations.push({
        id: `ALLOC-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        issueId: options?.issueId || 'PREVIEW',
        issueCode: options?.issueCode || 'PREVIEW',
        sku,
        productName: options?.productName || layerInArray.productName,
        layerId: layerInArray.layerId || layerInArray.lotId || layerInArray.id,
        quantity: allocateFromThisLayer,
        purchasePrice: unitCost,
        salePrice: unitSale,
        costAmount,
        revenueAmount,
        allocatedAt: new Date().toISOString(),
        sourceReceiptCode: layerInArray.receiptCode || layerInArray.poCode,
        supplierName: layerInArray.supplierName
      });

      totalCost += costAmount;
      layerInArray.quantityIssued += allocateFromThisLayer;
      layerInArray.quantityRemaining -= allocateFromThisLayer;
      if (layerInArray.quantityRemaining === 0) {
        layerInArray.status = 'exhausted';
      }

      remainingToAllocate -= allocateFromThisLayer;
    }

    return {
      allocations,
      totalCost,
      totalAllocatedQty: quantityNeeded - remainingToAllocate,
      remainingUnallocated: remainingToAllocate,
      isSufficientStock: remainingToAllocate === 0,
      updatedLayers
    };
  },

  /**
   * Execute Multi-Item FIFO Issue (For POS Orders, Sales Orders, Outbound Issue Notes)
   */
  executeFifoIssue(
    items: StockIssueRequestItem[],
    currentLayers: InventoryLayer[],
    context: {
      issueId: string;
      docCode: string;
      docType: 'Xuất bán' | 'Xuất chuyển kho' | 'Xuất nội bộ' | 'Hủy hàng' | 'Hàng lỗi' | 'Điều chỉnh giảm';
      branchId?: string;
      warehouseId?: string;
      actor: string;
      note?: string;
    }
  ): FifoIssueExecutionResult {
    // 1. Validation Check: Ensure all items have sufficient stock
    for (const item of items) {
      const available = this.getTotalAvailableStock(currentLayers, item.sku, {
        branchId: context.branchId,
        warehouseId: context.warehouseId,
        productId: item.productId,
        productCode: item.sku.split('-C')[0].split('-V')[0]
      });
      if (available < item.quantity) {
        return {
          success: false,
          errorMessage: `Không đủ tồn kho cho mặt hàng [${item.sku} - ${item.productName}]. Tồn khả dụng: ${available.toLocaleString('vi-VN')}, Số lượng yêu cầu: ${item.quantity.toLocaleString('vi-VN')}, Thiếu: ${(item.quantity - available).toLocaleString('vi-VN')}.`,
          allocations: [],
          itemAllocationsMap: {},
          totalCogs: 0,
          totalRevenue: 0,
          updatedLayers: currentLayers,
          generatedTransactions: [],
          auditLogs: []
        };
      }
    }

    // 2. Perform sequential FIFO deductions
    let workingLayers = currentLayers.map((l) => ({ ...l }));
    const allAllocations: FIFOAllocation[] = [];
    const itemAllocationsMap: Record<string, FIFOAllocation[]> = {};
    const generatedTransactions: StockTransaction[] = [];
    const auditLogs: AuditLog[] = [];
    let totalCogs = 0;
    let totalRevenue = 0;

    for (const item of items) {
      const allocResult = this.previewFifoAllocation(item.sku, item.quantity, workingLayers, {
        issueId: context.issueId,
        issueCode: context.docCode,
        productId: item.productId,
        productCode: item.sku.split('-C')[0].split('-V')[0],
        productName: item.productName,
        salePrice: item.salePrice,
        branchId: context.branchId,
        warehouseId: context.warehouseId
      });

      if (!allocResult.isSufficientStock) {
        return {
          success: false,
          errorMessage: `Lỗi bất định khi phân bổ FIFO cho SKU: ${item.sku}.`,
          allocations: [],
          itemAllocationsMap: {},
          totalCogs: 0,
          totalRevenue: 0,
          updatedLayers: currentLayers,
          generatedTransactions: [],
          auditLogs: []
        };
      }

      workingLayers = allocResult.updatedLayers;
      allAllocations.push(...allocResult.allocations);
      itemAllocationsMap[item.sku] = allocResult.allocations;
      totalCogs += allocResult.totalCost;
      totalRevenue += (item.salePrice || 0) * item.quantity;

      // Generate Stock Transactions for each layer deduction
      for (const alloc of allocResult.allocations) {
        const remainingForSku = this.getTotalAvailableStock(workingLayers, item.sku, {
          branchId: context.branchId,
          warehouseId: context.warehouseId
        });

        generatedTransactions.push({
          id: `TX-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          type: context.docType === 'Xuất chuyển kho' ? 'Xuất chuyển kho' : (context.docType as any),
          docCode: context.docCode,
          sku: item.sku,
          productId: item.productId,
          productName: item.productName,
          lotId: alloc.layerId,
          branchId: context.branchId,
          warehouseId: context.warehouseId,
          qtyIn: 0,
          qtyOut: alloc.quantity,
          balance: remainingForSku,
          unitCost: alloc.purchasePrice,
          totalValue: alloc.costAmount,
          actor: context.actor,
          note: context.note || `Xuất FIFO [${alloc.layerId}] cho chứng từ ${context.docCode}`
        });
      }

      // Generate Audit Log
      auditLogs.push({
        id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        userId: 'USR-CURRENT',
        userName: context.actor,
        action: 'issued',
        referenceType: 'ISSUE',
        referenceId: context.docCode,
        description: `Xuất kho ${item.quantity} ${item.unit || 'đơn vị'} SKU [${item.sku}] qua ${allocResult.allocations.length} lớp FIFO. Giá vốn: ${allocResult.totalCost.toLocaleString('vi-VN')} đ`
      });
    }

    return {
      success: true,
      allocations: allAllocations,
      itemAllocationsMap,
      totalCogs,
      totalRevenue,
      updatedLayers: workingLayers,
      generatedTransactions,
      auditLogs
    };
  },

  /**
   * Execute Stock Transfer with FIFO layer preservation
   */
  executeFifoTransfer(
    transfer: StockTransfer,
    currentLayers: InventoryLayer[],
    actor: string
  ): {
    success: boolean;
    errorMessage?: string;
    updatedLayers: InventoryLayer[];
    generatedTransactions: StockTransaction[];
    auditLogs: AuditLog[];
  } {
    // 1. Validate source stock availability
    for (const item of transfer.items) {
      const available = this.getTotalAvailableStock(currentLayers, item.sku, {
        branchId: transfer.fromBranchId,
        warehouseId: transfer.fromWarehouseId
      });
      if (available < item.quantity) {
        return {
          success: false,
          errorMessage: `Không đủ tồn tại kho xuất [${transfer.fromWarehouseName}] cho SKU: ${item.sku}. Tồn: ${available}, Cần: ${item.quantity}`,
          updatedLayers: currentLayers,
          generatedTransactions: [],
          auditLogs: []
        };
      }
    }

    let workingLayers = currentLayers.map((l) => ({ ...l }));
    const generatedTransactions: StockTransaction[] = [];
    const auditLogs: AuditLog[] = [];
    const newDestinationLayers: InventoryLayer[] = [];

    for (const item of transfer.items) {
      // Allocate from source warehouse FIFO
      const allocResult = this.previewFifoAllocation(item.sku, item.quantity, workingLayers, {
        issueId: transfer.id,
        issueCode: transfer.code,
        productName: item.productName,
        branchId: transfer.fromBranchId,
        warehouseId: transfer.fromWarehouseId
      });

      workingLayers = allocResult.updatedLayers;

      // For each allocated layer from source, create corresponding destination layer in target warehouse
      for (const alloc of allocResult.allocations) {
        const sourceLayer = currentLayers.find(
          (l) => (l.layerId === alloc.layerId || l.lotId === alloc.layerId) && l.sku === alloc.sku
        );

        const newDestLayerId = `${alloc.layerId}-TR-${transfer.code}`;
        const newLayer: InventoryLayer = {
          id: `LAYER-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          layerId: newDestLayerId,
          layerType: 'TRANSFER_IN',
          sku: alloc.sku,
          productId: sourceLayer?.productId || item.productId,
          productCode: sourceLayer?.productCode || item.sku,
          productName: alloc.productName,
          variantName: sourceLayer?.variantName,
          packSize: sourceLayer?.packSize,
          unit: item.unit,
          branchId: transfer.toBranchId,
          branchName: transfer.toBranchName,
          warehouseId: transfer.toWarehouseId,
          warehouseName: transfer.toWarehouseName,
          supplierId: sourceLayer?.supplierId,
          supplierName: alloc.supplierName || sourceLayer?.supplierName || 'Chuyển kho nội bộ',
          receiptCode: transfer.code,
          receivedAt: sourceLayer?.receivedAt || new Date().toISOString().split('T')[0], // Preserve original intake date for FIFO order
          createdAt: new Date().toISOString(),
          expiryDate: sourceLayer?.expiryDate,
          manufacturingDate: sourceLayer?.manufacturingDate,
          quantityReceived: alloc.quantity,
          quantityIssued: 0,
          quantityRemaining: alloc.quantity,
          purchasePrice: alloc.purchasePrice, // Exact preserved cost
          salePrice: alloc.salePrice,
          status: 'active',
          notes: `Nhập chuyển kho từ [${transfer.fromWarehouseName}] theo phiếu ${transfer.code}`
        };

        newDestinationLayers.push(newLayer);

        // Transaction for Outbound
        generatedTransactions.push({
          id: `TX-${Date.now()}-OUT-${Math.random().toString(36).substring(2, 5)}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          type: 'Xuất chuyển kho',
          docCode: transfer.code,
          sku: item.sku,
          productId: item.productId,
          productName: item.productName,
          lotId: alloc.layerId,
          branchId: transfer.fromBranchId,
          warehouseId: transfer.fromWarehouseId,
          qtyIn: 0,
          qtyOut: alloc.quantity,
          balance: this.getTotalAvailableStock(workingLayers, item.sku, { warehouseId: transfer.fromWarehouseId }),
          unitCost: alloc.purchasePrice,
          totalValue: alloc.costAmount,
          actor,
          note: `Chuyển kho đến [${transfer.toWarehouseName}]`
        });

        // Transaction for Inbound
        generatedTransactions.push({
          id: `TX-${Date.now()}-IN-${Math.random().toString(36).substring(2, 5)}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          type: 'Nhập chuyển kho',
          docCode: transfer.code,
          sku: item.sku,
          productId: item.productId,
          productName: item.productName,
          lotId: newDestLayerId,
          branchId: transfer.toBranchId,
          warehouseId: transfer.toWarehouseId,
          qtyIn: alloc.quantity,
          qtyOut: 0,
          balance: this.getTotalAvailableStock(workingLayers, item.sku, { warehouseId: transfer.toWarehouseId }) + alloc.quantity,
          unitCost: alloc.purchasePrice,
          totalValue: alloc.costAmount,
          actor,
          note: `Nhập chuyển kho từ [${transfer.fromWarehouseName}]`
        });
      }

      auditLogs.push({
        id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        userId: 'USR-CURRENT',
        userName: actor,
        action: 'transferred',
        referenceType: 'TRANSFER',
        referenceId: transfer.code,
        description: `Chuyển ${item.quantity} ${item.unit} SKU [${item.sku}] từ [${transfer.fromWarehouseName}] sang [${transfer.toWarehouseName}] bảo toàn lớp FIFO`
      });
    }

    return {
      success: true,
      updatedLayers: [...workingLayers, ...newDestinationLayers],
      generatedTransactions,
      auditLogs
    };
  },

  /**
   * Execute Stocktake and generate necessary FIFO adjustment layers
   */
  executeStocktake(
    stocktake: Stocktake,
    currentLayers: InventoryLayer[],
    actor: string
  ): {
    success: boolean;
    errorMessage?: string;
    updatedLayers: InventoryLayer[];
    generatedTransactions: StockTransaction[];
    auditLogs: AuditLog[];
  } {
    let workingLayers = currentLayers.map((l) => ({ ...l }));
    const generatedTransactions: StockTransaction[] = [];
    const auditLogs: AuditLog[] = [];
    const newAdjustmentLayers: InventoryLayer[] = [];

    for (const item of stocktake.items) {
      const diff = Number(item.diffQty ?? item.diffQuantity ?? ((item.actualQty ?? item.actualQuantity ?? 0) - (item.systemQty ?? item.systemQuantity ?? 0)));
      if (diff === 0) continue;

      if (diff < 0) {
        // Discrepancy Deficit (Thiếu hàng -> Giảm FIFO)
        const qtyToReduce = Math.abs(diff);
        const allocResult = this.previewFifoAllocation(item.sku, qtyToReduce, workingLayers, {
          issueId: stocktake.id,
          issueCode: stocktake.code,
          productName: item.productName,
          branchId: stocktake.branchId,
          warehouseId: stocktake.warehouseId
        });

        workingLayers = allocResult.updatedLayers;

        for (const alloc of allocResult.allocations) {
          generatedTransactions.push({
            id: `TX-${Date.now()}-ADJ-DEC-${Math.random().toString(36).substring(2, 5)}`,
            date: new Date().toISOString().replace('T', ' ').substring(0, 16),
            type: 'Điều chỉnh giảm',
            docCode: stocktake.code,
            sku: item.sku,
            productId: item.productId,
            productName: item.productName,
            lotId: alloc.layerId,
            branchId: stocktake.branchId,
            warehouseId: stocktake.warehouseId,
            qtyIn: 0,
            qtyOut: alloc.quantity,
            balance: this.getTotalAvailableStock(workingLayers, item.sku, { warehouseId: stocktake.warehouseId }),
            unitCost: alloc.purchasePrice,
            totalValue: alloc.costAmount,
            actor,
            note: `Điều chỉnh giảm kiểm kê đợt ${stocktake.code}: ${item.reason || 'Thất thoát/Lệch kiểm đếm'}`
          });
        }
      } else {
        // Discrepancy Surplus (Thừa hàng -> Tạo Adjustment Layer mới)
        const surplusQty = diff;
        const layerId = `ADJ-INC-${stocktake.code}-${item.sku}`;
        const newAdjLayer: InventoryLayer = {
          id: `LAYER-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          layerId,
          layerType: 'ADJUSTMENT_IN',
          sku: item.sku,
          productId: item.productId,
          productCode: item.productCode || item.sku,
          productName: item.productName,
          unit: item.unit,
          branchId: stocktake.branchId,
          branchName: stocktake.branchName,
          warehouseId: stocktake.warehouseId,
          warehouseName: stocktake.warehouseName,
          supplierName: 'Điều chỉnh Kiểm kê',
          receiptCode: stocktake.code,
          receivedAt: stocktake.stocktakeDate || new Date().toISOString().split('T')[0],
          createdAt: new Date().toISOString(),
          quantityReceived: surplusQty,
          quantityIssued: 0,
          quantityRemaining: surplusQty,
          purchasePrice: item.unitCost,
          salePrice: item.unitCost * 1.25, // default markup
          status: 'active',
          notes: `Điều chỉnh tăng sau kiểm kê đợt ${stocktake.code}: ${item.reason || 'Dư thừa kiểm đếm'}`
        };

        newAdjustmentLayers.push(newAdjLayer);

        generatedTransactions.push({
          id: `TX-${Date.now()}-ADJ-INC-${Math.random().toString(36).substring(2, 5)}`,
          date: new Date().toISOString().replace('T', ' ').substring(0, 16),
          type: 'Điều chỉnh tăng',
          docCode: stocktake.code,
          sku: item.sku,
          productId: item.productId,
          productName: item.productName,
          lotId: layerId,
          branchId: stocktake.branchId,
          warehouseId: stocktake.warehouseId,
          qtyIn: surplusQty,
          qtyOut: 0,
          balance: this.getTotalAvailableStock(workingLayers, item.sku, { warehouseId: stocktake.warehouseId }) + surplusQty,
          unitCost: item.unitCost,
          totalValue: surplusQty * item.unitCost,
          actor,
          note: `Điều chỉnh tăng kiểm kê đợt ${stocktake.code}: ${item.reason || 'Dư thừa kiểm đếm'}`
        });
      }

      auditLogs.push({
        id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        userId: 'USR-CURRENT',
        userName: actor,
        action: 'adjusted',
        referenceType: 'STOCKTAKE',
        referenceId: stocktake.code,
        description: `Kiểm kê SKU [${item.sku}]: Hệ thống ${item.systemQty}, Thực tế ${item.actualQty} (Chênh lệch: ${item.diffQty > 0 ? '+' : ''}${item.diffQty} ${item.unit})`
      });
    }

    return {
      success: true,
      updatedLayers: [...workingLayers, ...newAdjustmentLayers],
      generatedTransactions,
      auditLogs
    };
  },

  /**
   * Create new InventoryLayer instances when receiving a Purchase Order
   */
  createLayersFromPurchaseOrder(
    po: PurchaseOrder,
    actor: string
  ): {
    newLayers: InventoryLayer[];
    transactions: StockTransaction[];
    auditLogs: AuditLog[];
  } {
    const newLayers: InventoryLayer[] = [];
    const transactions: StockTransaction[] = [];
    const auditLogs: AuditLog[] = [];

    po.items.forEach((item: any, idx: number) => {
      const layerId = item.lotId || `${po.code}-${String(idx + 1).padStart(2, '0')}`;
      const unitCost = Number(item.price ?? item.unitPrice ?? item.costPrice ?? 0);
      const unitSale = item.sellingPrice || item.salePrice || (unitCost > 0 ? unitCost * 1.25 : 0);

      const layer: InventoryLayer = {
        id: `LAYER-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        layerId,
        layerType: 'RECEIPT',
        sku: item.sku,
        productId: item.productId || `PROD-${item.sku}`,
        productCode: item.sku.split('-').slice(0, 2).join('-'),
        productName: item.productName,
        unit: item.unit,
        branchId: po.branchId || 'BR01',
        branchName: po.branchName || 'Chi nhánh Chính - TP.HCM',
        warehouseId: po.warehouseId || 'WH01',
        warehouseName: po.warehouse || 'Kho Tổng TP.HCM',
        supplierId: po.supplierId,
        supplierName: po.supplierName,
        receiptId: po.id,
        receiptCode: po.code,
        receivedAt: po.createdAt ? po.createdAt.split(' ')[0] : (po.orderDate || new Date().toISOString().split('T')[0]),
        createdAt: po.createdAt || new Date().toISOString(),
        expiryDate: item.expiryDate,
        manufacturingDate: item.manufacturingDate,
        quantityReceived: item.quantity,
        quantityIssued: 0,
        quantityRemaining: item.quantity,
        purchasePrice: unitCost,
        salePrice: unitSale,
        status: 'active',
        notes: po.note || `Nhập kho từ phiếu ${po.code}`
      };

      newLayers.push(layer);

      transactions.push({
        id: `TX-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
        date: po.createdAt || new Date().toISOString().replace('T', ' ').substring(0, 16),
        type: 'Nhập kho',
        docCode: po.code,
        sku: item.sku,
        productId: item.productId,
        productName: item.productName,
        lotId: layerId,
        branchId: po.branchId || 'BR01',
        warehouseId: po.warehouseId || 'WH01',
        qtyIn: item.quantity,
        qtyOut: 0,
        balance: item.quantity, // will be reconciled on full inventory sync
        unitCost,
        totalValue: item.quantity * unitCost,
        actor,
        note: `Nhập kho từ NCC: ${po.supplierName}`
      });
    });

    auditLogs.push({
      id: `AUDIT-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      userId: 'USR-CURRENT',
      userName: actor,
      action: 'received',
      referenceType: 'PO',
      referenceId: po.code,
      description: `Nhập kho thành công phiếu ${po.code} gồm ${po.items.length} mặt hàng, tạo ${newLayers.length} lớp FIFO mới.`
    });

    return {
      newLayers,
      transactions,
      auditLogs
    };
  },

  /**
   * Recalculate total product stocks and current FIFO cost from layers
   */
  syncProductsWithLayers(
    products: Product[],
    layers: InventoryLayer[],
    filters?: { branchId?: string; warehouseId?: string }
  ): Product[] {
    return products.map((prod) => {
      const activeLayers = this.getActiveLayersForSku(layers, prod.sku, {
        ...filters,
        productId: prod.id || prod.productId,
        productCode: prod.code || prod.productCode
      });
      const totalStock = activeLayers.reduce((sum, l) => {
        const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0);
        return sum + (isNaN(qty) ? 0 : qty);
      }, 0);
      const sortedLayers = this.sortLayersFifo(activeLayers);
      const nextCostPrice =
        sortedLayers.length > 0
          ? Number(sortedLayers[0].purchasePrice ?? sortedLayers[0].costPrice ?? prod.costPrice ?? 0) || 0
          : Number(prod.costPrice) || 0;

      // Update variant stocks if product has variants list
      const updatedVariants = prod.variants?.map((v) => {
        const pack = Number(v.packSize) || 1;
        const variantDirectLayers = this.getActiveLayersForSku(layers, v.sku, {
          ...filters,
          productId: prod.id || prod.productId,
          productCode: prod.code || prod.productCode
        });
        const vDirectStock = variantDirectLayers.reduce((sum, l) => {
          const qty = Number(l.quantityRemaining ?? l.remainingQuantity ?? 0);
          return sum + (isNaN(qty) ? 0 : qty);
        }, 0);
        return {
          ...v,
          stock: vDirectStock > 0 ? vDirectStock : Math.floor(totalStock / pack)
        };
      });

      return {
        ...prod,
        stock: totalStock,
        costPrice: nextCostPrice,
        isLowStock: totalStock <= (Number(prod.minStock) || 0),
        variants: updatedVariants || prod.variants
      };
    });
  },

  /**
   * Calculate overall inventory valuation using FIFO layer remaining quantities
   */
  calculateTotalInventoryValue(
    layers: InventoryLayer[],
    filters?: { branchId?: string; warehouseId?: string }
  ): number {
    let filteredLayers = layers.filter((l) => (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) > 0) && l.status !== 'exhausted');
    if (filters?.branchId && filters.branchId !== 'all') {
      filteredLayers = filteredLayers.filter((l) => l.branchId === filters.branchId);
    }
    if (filters?.warehouseId && filters.warehouseId !== 'all') {
      filteredLayers = filteredLayers.filter((l) => l.warehouseId === filters.warehouseId);
    }

    return filteredLayers.reduce((total, layer) => {
      const qty = Number(layer.quantityRemaining ?? layer.remainingQuantity ?? 0);
      const unitCost = Number(layer.purchasePrice ?? layer.costPrice ?? 0);
      const validQty = isNaN(qty) ? 0 : qty;
      const validCost = isNaN(unitCost) ? 0 : unitCost;
      return total + validQty * validCost;
    }, 0);
  },

  /**
   * Calculate 7 standard stock aging buckets for active inventory layers
   */
  calculateAgingBuckets(
    layers: InventoryLayer[],
    referenceDate: Date = new Date()
  ): Record<
    'under7d' | 'sevenTo30d' | 'thirtyTo90d' | 'ninetyTo180d' | 'oneEightyTo360d' | 'oneTo2y' | 'over2y',
    { label: string; totalQuantity: number; totalValue: number; layers: InventoryLayer[] }
  > {
    const buckets = {
      under7d: { label: '< 7 ngày', totalQuantity: 0, totalValue: 0, layers: [] as InventoryLayer[] },
      sevenTo30d: { label: '7–30 ngày', totalQuantity: 0, totalValue: 0, layers: [] as InventoryLayer[] },
      thirtyTo90d: { label: '30–90 ngày', totalQuantity: 0, totalValue: 0, layers: [] as InventoryLayer[] },
      ninetyTo180d: { label: '90–180 ngày', totalQuantity: 0, totalValue: 0, layers: [] as InventoryLayer[] },
      oneEightyTo360d: { label: '180–360 ngày', totalQuantity: 0, totalValue: 0, layers: [] as InventoryLayer[] },
      oneTo2y: { label: '1–2 năm', totalQuantity: 0, totalValue: 0, layers: [] as InventoryLayer[] },
      over2y: { label: '> 2 năm', totalQuantity: 0, totalValue: 0, layers: [] as InventoryLayer[] }
    };

    const activeLayers = layers.filter(
      (l) => (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) > 0) && l.status !== 'exhausted'
    );

    for (const layer of activeLayers) {
      const qty = Number(layer.quantityRemaining ?? layer.remainingQuantity ?? 0) || 0;
      const unitCost = Number(layer.purchasePrice ?? layer.costPrice ?? 0) || 0;
      const value = qty * unitCost;

      const dateStr = layer.receivedAt || layer.intakeDate || layer.createdAt || '2026-08-01';
      const intakeTime = new Date(dateStr).getTime();
      const ageDays = Math.max(0, Math.floor((referenceDate.getTime() - intakeTime) / (1000 * 3600 * 24)));

      let bucketKey: keyof typeof buckets = 'under7d';
      if (ageDays < 7) bucketKey = 'under7d';
      else if (ageDays <= 30) bucketKey = 'sevenTo30d';
      else if (ageDays <= 90) bucketKey = 'thirtyTo90d';
      else if (ageDays <= 180) bucketKey = 'ninetyTo180d';
      else if (ageDays <= 360) bucketKey = 'oneEightyTo360d';
      else if (ageDays <= 720) bucketKey = 'oneTo2y';
      else bucketKey = 'over2y';

      buckets[bucketKey].totalQuantity += qty;
      buckets[bucketKey].totalValue += value;
      buckets[bucketKey].layers.push(layer);
    }

    return buckets;
  },

  /**
   * Calculate 6 shelf life remaining buckets based on expiryDate
   */
  calculateShelfLifeBuckets(
    layers: InventoryLayer[],
    referenceDate: Date = new Date()
  ): Record<
    'expired' | 'under7d' | 'eightTo30d' | 'thirtyOneTo90d' | 'over90d' | 'noExpiryTracking',
    { label: string; totalQuantity: number; totalValue: number; layers: InventoryLayer[] }
  > {
    const buckets = {
      expired: { label: 'Đã hết hạn', totalQuantity: 0, totalValue: 0, layers: [] as InventoryLayer[] },
      under7d: { label: '≤ 7 ngày', totalQuantity: 0, totalValue: 0, layers: [] as InventoryLayer[] },
      eightTo30d: { label: '8–30 ngày', totalQuantity: 0, totalValue: 0, layers: [] as InventoryLayer[] },
      thirtyOneTo90d: { label: '31–90 ngày', totalQuantity: 0, totalValue: 0, layers: [] as InventoryLayer[] },
      over90d: { label: '> 90 ngày', totalQuantity: 0, totalValue: 0, layers: [] as InventoryLayer[] },
      noExpiryTracking: { label: 'Không quản lý date', totalQuantity: 0, totalValue: 0, layers: [] as InventoryLayer[] }
    };

    const activeLayers = layers.filter(
      (l) => (Number(l.quantityRemaining ?? l.remainingQuantity ?? 0) > 0) && l.status !== 'exhausted'
    );

    for (const layer of activeLayers) {
      const qty = Number(layer.quantityRemaining ?? layer.remainingQuantity ?? 0) || 0;
      const unitCost = Number(layer.purchasePrice ?? layer.costPrice ?? 0) || 0;
      const value = qty * unitCost;

      if (!layer.expiryDate) {
        buckets.noExpiryTracking.totalQuantity += qty;
        buckets.noExpiryTracking.totalValue += value;
        buckets.noExpiryTracking.layers.push(layer);
        continue;
      }

      const expiryTime = new Date(layer.expiryDate).getTime();
      const remainingDays = Math.floor((expiryTime - referenceDate.getTime()) / (1000 * 3600 * 24));

      let bucketKey: keyof typeof buckets = 'noExpiryTracking';
      if (remainingDays < 0) bucketKey = 'expired';
      else if (remainingDays <= 7) bucketKey = 'under7d';
      else if (remainingDays <= 30) bucketKey = 'eightTo30d';
      else if (remainingDays <= 90) bucketKey = 'thirtyOneTo90d';
      else bucketKey = 'over90d';

      buckets[bucketKey].totalQuantity += qty;
      buckets[bucketKey].totalValue += value;
      buckets[bucketKey].layers.push(layer);
    }

    return buckets;
  }
};
