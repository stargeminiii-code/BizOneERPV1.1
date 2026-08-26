import { describe, it, expect, beforeEach } from 'vitest';
import { EffectiveDateResolver } from './effectiveDateResolver';
import { PriceVersionService } from '../pricing/priceVersionService';
import { RecipeVersionService } from '../recipe/recipeVersionService';
import { RecipeCostService } from '../recipe/recipeCostService';
import { PreparationBatchService } from '../fnb/preparationBatchService';
import { ConsumptionService } from '../fnb/consumptionService';
import { TransactionSnapshotService } from '../transaction/transactionSnapshotService';
import { TemporalBusinessEngine } from './temporalService';
import { InventoryRepository } from '../../repositories/inventoryRepository';
import {
  SellingPriceVersion,
  RecipeVersion,
  InventoryLayer,
  Order
} from '../../types';

describe('Phase 2.4 — Temporal Business Engine & F&B Operation Tests', () => {
  const TENANT_A = 'TENANT-ALPHA';
  const TENANT_B = 'TENANT-BETA';

  beforeEach(() => {
    // Fresh isolated reset for each test
    PriceVersionService.clear();
    RecipeVersionService.clear();
    PreparationBatchService.clear();
    ConsumptionService.clear();
    TransactionSnapshotService.clear();
    InventoryRepository.initialize([]);
  });

  // TEST 1: Temporal Resolution with valid open & closed intervals
  it('TEST 1: EffectiveDateResolver correctly resolves applicable version for timestamp', () => {
    const versions: SellingPriceVersion[] = [
      {
        versionId: 'V1',
        version: 1,
        productId: 'P-1',
        sku: 'SKU-01',
        price: 35000,
        currency: 'VND',
        effectiveFrom: '2026-08-01T00:00:00Z',
        effectiveTo: '2026-08-15T00:00:00Z',
        status: 'SUPERSEDED',
        createdAt: '2026-08-01',
        createdBy: 'Admin',
        tenantId: TENANT_A
      },
      {
        versionId: 'V2',
        version: 2,
        productId: 'P-1',
        sku: 'SKU-01',
        price: 39000,
        currency: 'VND',
        effectiveFrom: '2026-08-15T00:00:00Z',
        effectiveTo: '2026-09-01T00:00:00Z',
        status: 'SUPERSEDED',
        createdAt: '2026-08-15',
        createdBy: 'Admin',
        tenantId: TENANT_A
      },
      {
        versionId: 'V3',
        version: 3,
        productId: 'P-1',
        sku: 'SKU-01',
        price: 42000,
        currency: 'VND',
        effectiveFrom: '2026-09-01T00:00:00Z',
        effectiveTo: null,
        status: 'ACTIVE',
        createdAt: '2026-09-01',
        createdBy: 'Admin',
        tenantId: TENANT_A
      }
    ];

    // Check exact points
    const res1 = EffectiveDateResolver.resolveVersion(versions, '2026-08-10T12:00:00Z');
    expect(res1.status).toBe('SUCCESS');
    expect(res1.version?.versionId).toBe('V1');
    expect(res1.version?.price).toBe(35000);

    const res2 = EffectiveDateResolver.resolveVersion(versions, '2026-08-20T12:00:00Z');
    expect(res2.status).toBe('SUCCESS');
    expect(res2.version?.versionId).toBe('V2');
    expect(res2.version?.price).toBe(39000);

    const res3 = EffectiveDateResolver.resolveVersion(versions, '2026-09-05T12:00:00Z');
    expect(res3.status).toBe('SUCCESS');
    expect(res3.version?.versionId).toBe('V3');
    expect(res3.version?.price).toBe(42000);
  });

  // TEST 2: Temporal Resolution Boundary Conditions [effectiveFrom, effectiveTo)
  it('TEST 2: Boundary test - effectiveFrom is inclusive, effectiveTo is exclusive', () => {
    const versions: SellingPriceVersion[] = [
      {
        versionId: 'V1',
        version: 1,
        productId: 'P-1',
        sku: 'SKU-01',
        price: 100,
        currency: 'VND',
        effectiveFrom: '2026-08-01T00:00:00Z',
        effectiveTo: '2026-08-15T00:00:00Z',
        status: 'SUPERSEDED',
        createdAt: '2026-08-01',
        createdBy: 'Admin',
        tenantId: TENANT_A
      },
      {
        versionId: 'V2',
        version: 2,
        productId: 'P-1',
        sku: 'SKU-01',
        price: 200,
        currency: 'VND',
        effectiveFrom: '2026-08-15T00:00:00Z',
        effectiveTo: null,
        status: 'ACTIVE',
        createdAt: '2026-08-15',
        createdBy: 'Admin',
        tenantId: TENANT_A
      }
    ];

    // At exact start 2026-08-01T00:00:00Z -> V1
    const resStart = EffectiveDateResolver.resolveVersion(versions, '2026-08-01T00:00:00Z');
    expect(resStart.status).toBe('SUCCESS');
    expect(resStart.version?.versionId).toBe('V1');

    // At transition exact boundary 2026-08-15T00:00:00Z -> V2 starts
    const resBoundary = EffectiveDateResolver.resolveVersion(versions, '2026-08-15T00:00:00Z');
    expect(resBoundary.status).toBe('SUCCESS');
    expect(resBoundary.version?.versionId).toBe('V2');
  });

  // TEST 3: Multiple overlapping versions detected as INTEGRITY_VIOLATION
  it('TEST 3: Multiple overlapping versions fail safely with INTEGRITY_VIOLATION', () => {
    const overlapping: SellingPriceVersion[] = [
      {
        versionId: 'V1',
        version: 1,
        productId: 'P-1',
        sku: 'SKU-01',
        price: 100,
        currency: 'VND',
        effectiveFrom: '2026-08-01T00:00:00Z',
        effectiveTo: '2026-08-20T00:00:00Z',
        status: 'ACTIVE',
        createdAt: '2026-08-01',
        createdBy: 'Admin',
        tenantId: TENANT_A
      },
      {
        versionId: 'V2',
        version: 2,
        productId: 'P-1',
        sku: 'SKU-01',
        price: 200,
        currency: 'VND',
        effectiveFrom: '2026-08-10T00:00:00Z', // Overlaps with V1
        effectiveTo: null,
        status: 'ACTIVE',
        createdAt: '2026-08-10',
        createdBy: 'Admin',
        tenantId: TENANT_A
      }
    ];

    const res = EffectiveDateResolver.resolveVersion(overlapping, '2026-08-15T00:00:00Z');
    expect(res.status).toBe('INTEGRITY_VIOLATION');
    expect(res.version).toBeNull();
    expect(res.errorMessage).toContain('Data integrity violation');
  });

  // TEST 4: No version exists returns NOT_AVAILABLE
  it('TEST 4: Resolving timestamp prior to any effective version returns NOT_AVAILABLE', () => {
    const versions: SellingPriceVersion[] = [
      {
        versionId: 'V1',
        version: 1,
        productId: 'P-1',
        sku: 'SKU-01',
        price: 100,
        currency: 'VND',
        effectiveFrom: '2026-08-01T00:00:00Z',
        effectiveTo: null,
        status: 'ACTIVE',
        createdAt: '2026-08-01',
        createdBy: 'Admin',
        tenantId: TENANT_A
      }
    ];

    const res = EffectiveDateResolver.resolveVersion(versions, '2026-07-15T00:00:00Z');
    expect(res.status).toBe('NOT_AVAILABLE');
    expect(res.version).toBeNull();
  });

  // TEST 5: Creating new version automatically closes previous version without overlap
  it('TEST 5: EffectiveDateResolver.createNextVersion closes prior version cleanly', () => {
    const existing: SellingPriceVersion[] = [
      {
        versionId: 'V1',
        version: 1,
        productId: 'P-1',
        sku: 'SKU-01',
        price: 35000,
        currency: 'VND',
        effectiveFrom: '2026-08-01T00:00:00Z',
        effectiveTo: null,
        status: 'ACTIVE',
        createdAt: '2026-08-01',
        createdBy: 'Admin',
        tenantId: TENANT_A
      }
    ];

    const creation = EffectiveDateResolver.createNextVersion<SellingPriceVersion>(
      existing,
      {
        tenantId: TENANT_A,
        productId: 'P-1',
        sku: 'SKU-01',
        price: 40000,
        currency: 'VND',
        effectiveFrom: '2026-08-15T00:00:00Z',
        effectiveTo: null,
        createdBy: 'Manager'
      }
    );

    expect(creation.success).toBe(true);
    expect(creation.newVersion?.version).toBe(2);
    expect(creation.newVersion?.price).toBe(40000);
    expect(creation.newVersion?.status).toBe('ACTIVE');

    const v1Updated = creation.updatedVersions?.find((v) => v.versionId === 'V1');
    expect(v1Updated?.effectiveTo).toBe('2026-08-15T00:00:00Z');
    expect(v1Updated?.status).toBe('SUPERSEDED');
  });

  // TEST 6: Selling Price resolution across multiple dates
  it('TEST 6: PriceVersionService resolves chronological prices for SKU', () => {
    PriceVersionService.createPriceVersion(
      {
        tenantId: TENANT_A,
        productId: 'P-CF',
        sku: 'DU-CF-SUA',
        price: 35000,
        effectiveFrom: '2026-08-01T00:00:00Z'
      },
      'Admin'
    );

    PriceVersionService.createPriceVersion(
      {
        tenantId: TENANT_A,
        productId: 'P-CF',
        sku: 'DU-CF-SUA',
        price: 39000,
        effectiveFrom: '2026-08-15T00:00:00Z'
      },
      'Admin'
    );

    PriceVersionService.createPriceVersion(
      {
        tenantId: TENANT_A,
        productId: 'P-CF',
        sku: 'DU-CF-SUA',
        price: 42000,
        effectiveFrom: '2026-09-01T00:00:00Z'
      },
      'Admin'
    );

    expect(
      PriceVersionService.resolveSellingPrice(TENANT_A, 'DU-CF-SUA', '2026-08-10').version?.price
    ).toBe(35000);
    expect(
      PriceVersionService.resolveSellingPrice(TENANT_A, 'DU-CF-SUA', '2026-08-20').version?.price
    ).toBe(39000);
    expect(
      PriceVersionService.resolveSellingPrice(TENANT_A, 'DU-CF-SUA', '2026-09-05').version?.price
    ).toBe(42000);
  });

  // TEST 7: CRITICAL REGRESSION TEST — Modifying current Master Data NEVER changes historical transaction
  it('TEST 7 (CRITICAL REGRESSION): Changing master price or recipe DOES NOT alter historical order snapshot, COGS or Gross Profit', () => {
    // 1. Setup price V1 on 01/08
    PriceVersionService.createPriceVersion(
      {
        tenantId: TENANT_A,
        productId: 'P-CF',
        sku: 'DU-CF-SUA',
        price: 35000,
        effectiveFrom: '2026-08-01T00:00:00Z'
      },
      'Admin'
    );

    // 2. Setup recipe V1 on 01/08
    RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'DU-CF-SUA',
        productId: 'P-CF',
        productName: 'Cà phê sữa',
        recipeCode: 'REC-CF-01',
        name: 'Công thức V1',
        effectiveFrom: '2026-08-01T00:00:00Z',
        yieldQuantity: 1,
        yieldUnit: 'ly',
        components: [
          {
            componentId: 'C1',
            componentSku: 'NL-SUA-DAC',
            componentName: 'Sữa đặc',
            componentType: 'RAW_MATERIAL',
            quantity: 30,
            unit: 'ml',
            standardCost: 25
          }
        ]
      },
      'Barista'
    );

    // Setup inventory layer with 25đ/ml
    InventoryRepository.saveLayer({
      id: 'L-SD-1',
      tenantId: TENANT_A,
      layerId: 'LOT-SD-1',
      layerType: 'RECEIPT',
      sku: 'NL-SUA-DAC',
      productName: 'Sữa đặc',
      unit: 'ml',
      warehouseId: 'WH01',
      quantityReceived: 1000,
      quantityIssued: 0,
      quantityRemaining: 1000,
      purchasePrice: 25,
      unitCost: 25,
      salePrice: 0,
      status: 'active'
    } as any);

    // 3. Create historical order on 2026-08-10
    const historicalOrder: Order = {
      id: 'ORD-HIST-001',
      code: 'DH-20260810-01',
      customerName: 'Nguyễn Văn A',
      customerPhone: '0901234567',
      orderDate: '2026-08-10T10:00:00Z',
      warehouseId: 'WH01',
      branchId: 'BR01',
      totalAmount: 35000,
      discount: 0,
      tax: 0,
      status: 'completed',
      paymentMethod: 'vietqr',
      paymentStatus: 'paid',
      items: [
        {
          productId: 'P-CF',
          sku: 'DU-CF-SUA',
          productName: 'Cà phê sữa',
          unit: 'Ly',
          unitPrice: 35000,
          quantity: 1,
          totalPrice: 35000
        }
      ]
    };
    (historicalOrder as any).tenantId = TENANT_A;

    // Create immutable snapshot
    const initialSnapshot = TransactionSnapshotService.createOrderSnapshot(
      historicalOrder,
      '2026-08-10T10:00:00Z'
    );

    expect(initialSnapshot.totalRevenue).toBe(35000);
    expect(initialSnapshot.items[0].unitPrice).toBe(35000);
    expect(initialSnapshot.items[0].expectedStandardCost).toBe(750); // 30ml * 25
    expect(initialSnapshot.items[0].grossProfit).toBe(35000 - 750); // 34,250
    const initialGrossProfit = initialSnapshot.grossProfit;

    // 4. NOW MODIFY MASTER DATA MULTIPLE TIMES LATER:
    // a. Increase selling price to 42,000 on 2026-09-01
    PriceVersionService.createPriceVersion(
      {
        tenantId: TENANT_A,
        productId: 'P-CF',
        sku: 'DU-CF-SUA',
        price: 42000,
        effectiveFrom: '2026-09-01T00:00:00Z'
      },
      'Admin'
    );

    // b. Create new recipe V2 with double quantity of ingredients on 2026-09-01
    RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'DU-CF-SUA',
        productId: 'P-CF',
        productName: 'Cà phê sữa',
        recipeCode: 'REC-CF-02',
        name: 'Công thức V2',
        effectiveFrom: '2026-09-01T00:00:00Z',
        yieldQuantity: 1,
        yieldUnit: 'ly',
        components: [
          {
            componentId: 'C1',
            componentSku: 'NL-SUA-DAC',
            componentName: 'Sữa đặc',
            componentType: 'RAW_MATERIAL',
            quantity: 60, // doubled
            unit: 'ml',
            standardCost: 50 // doubled cost
          }
        ]
      },
      'Barista'
    );

    // 5. Verify the historical snapshot in repository REMAINED 100% UNCHANGED
    const retrievedSnapshot = TransactionSnapshotService.getSnapshot('ORD-HIST-001');
    expect(retrievedSnapshot).not.toBeNull();
    expect(retrievedSnapshot?.totalRevenue).toBe(35000);
    expect(retrievedSnapshot?.grossProfit).toBe(initialGrossProfit);
    expect(retrievedSnapshot?.items[0].unitPrice).toBe(35000);
    expect(retrievedSnapshot?.items[0].expectedStandardCost).toBe(750);
  });

  // TEST 8: Multi-Level BOM Resolution (Beverage -> Semi-finished -> Raw materials)
  it('TEST 8: Multi-Level BOM expands semi-finished ingredients into raw materials', () => {
    // 1. Semi-finished recipe: 200g beans yields 400ml concentrate
    RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'BTP-CF-COT',
        productId: 'P-BTP-COT',
        productName: 'Cốt cà phê phin 400ml',
        name: 'Công thức Cốt V1',
        effectiveFrom: '2026-08-01T00:00:00Z',
        yieldQuantity: 400,
        yieldUnit: 'ml',
        components: [
          {
            componentId: 'B1',
            componentSku: 'NL-CF-ROB',
            componentName: 'Hạt Robusta',
            componentType: 'RAW_MATERIAL',
            quantity: 200,
            unit: 'gam',
            standardCost: 280
          }
        ]
      },
      'Master'
    );

    // 2. Finished drink recipe: 80ml concentrate + 30ml condensed milk + packaging
    RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'DU-CF-SUA',
        productId: 'P-CF-SUA',
        productName: 'Cà phê sữa',
        name: 'Cà phê sữa V1',
        effectiveFrom: '2026-08-01T00:00:00Z',
        yieldQuantity: 1,
        yieldUnit: 'ly',
        components: [
          {
            componentId: 'D1',
            componentSku: 'BTP-CF-COT',
            componentName: 'Cốt cà phê',
            componentType: 'SEMI_FINISHED',
            quantity: 80,
            unit: 'ml',
            standardCost: 140
          },
          {
            componentId: 'D2',
            componentSku: 'NL-SUA-DAC',
            componentName: 'Sữa đặc',
            componentType: 'RAW_MATERIAL',
            quantity: 30,
            unit: 'ml',
            standardCost: 25
          }
        ],
        packaging: [
          {
            packagingSku: 'BB-LY-500',
            packagingName: 'Ly 500ml',
            quantity: 1,
            unit: 'cái',
            standardCost: 650
          }
        ]
      },
      'Master'
    );

    // Expand for 2 cups of Cafe Sua
    const expansion = RecipeVersionService.expandMultiLevelBOM(
      TENANT_A,
      'DU-CF-SUA',
      2,
      '2026-08-10'
    );

    expect(expansion.success).toBe(true);
    expect(expansion.expandedComponents.length).toBe(3);

    // Beans required: 2 cups * 80ml = 160ml concentrate. Ratio = 200g/400ml = 0.5. 160 * 0.5 = 80g beans.
    const beansComp = expansion.expandedComponents.find((c) => c.sku === 'NL-CF-ROB');
    expect(beansComp).toBeDefined();
    expect(beansComp?.totalRequiredQuantity).toBe(80);
    expect(beansComp?.unit).toBe('gam');

    // Condensed milk: 2 cups * 30ml = 60ml
    const milkComp = expansion.expandedComponents.find((c) => c.sku === 'NL-SUA-DAC');
    expect(milkComp?.totalRequiredQuantity).toBe(60);

    // Packaging: 2 cups * 1 ly = 2 ly
    const lyComp = expansion.expandedComponents.find((c) => c.sku === 'BB-LY-500');
    expect(lyComp?.totalRequiredQuantity).toBe(2);
  });

  // TEST 9: Recipe V1 immutability once referenced
  it('TEST 9: Recipe version referenced by transaction is marked as referenced and cannot be overwritten', () => {
    const created = RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'DU-CF-SUA',
        productId: 'P-1',
        productName: 'Cà phê sữa',
        name: 'V1',
        effectiveFrom: '2026-08-01T00:00:00Z',
        yieldQuantity: 1,
        yieldUnit: 'ly',
        components: []
      },
      'Admin'
    );

    const versionId = created.newVersion!.versionId;
    RecipeVersionService.markAsReferenced(TENANT_A, versionId);

    const retrieved = RecipeVersionService.getRecipeVersionById(TENANT_A, versionId);
    expect(retrieved?.isReferencedByTransactions).toBe(true);
  });

  // TEST 10: Preparation Batch Execution
  it('TEST 10: PreparationBatchService issues raw materials from FIFO and creates semi-finished layer with exact unit cost', () => {
    // 1. Setup raw material inventory layer: 1000g Robusta @ 280đ/g
    InventoryRepository.saveLayer({
      id: 'L-ROB-1',
      tenantId: TENANT_A,
      layerId: 'LOT-ROB-1',
      layerType: 'RECEIPT',
      sku: 'NL-CF-ROB',
      productName: 'Hạt Robusta',
      unit: 'gam',
      warehouseId: 'WH01',
      quantityReceived: 1000,
      quantityIssued: 0,
      quantityRemaining: 1000,
      purchasePrice: 280,
      unitCost: 280,
      salePrice: 0,
      status: 'active'
    } as any);

    // 2. Setup recipe for Cốt: 200g beans produces 400ml concentrate
    RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'BTP-CF-COT',
        productId: 'P-COT',
        productName: 'Cốt cà phê',
        name: 'Công thức cốt',
        effectiveFrom: '2026-08-01T00:00:00Z',
        yieldQuantity: 400,
        yieldUnit: 'ml',
        components: [
          {
            componentId: 'C1',
            componentSku: 'NL-CF-ROB',
            componentName: 'Hạt Robusta',
            componentType: 'RAW_MATERIAL',
            quantity: 200,
            unit: 'gam',
            standardCost: 280
          }
        ]
      },
      'Master'
    );

    // 3. Execute batch to produce 800ml Cốt cà phê (needs 400g beans = 400 * 280 = 112,000đ)
    const result = PreparationBatchService.executePreparationBatch(
      {
        tenantId: TENANT_A,
        branchId: 'BR01',
        warehouseId: 'WH01',
        outputSku: 'BTP-CF-COT',
        outputProductName: 'Cốt cà phê',
        plannedOutputQty: 800,
        actualOutputQty: 800,
        outputUnit: 'ml',
        operator: 'Lê Nam'
      },
      'Lê Nam'
    );

    expect(result.success).toBe(true);
    expect(result.batch?.totalBatchCost).toBe(112000);
    expect(result.batch?.unitBatchCost).toBe(140); // 112,000 / 800ml = 140đ/ml

    // Check that raw material inventory layer was reduced from 1000g to 600g
    const robLayer = InventoryRepository.findLayerById('L-ROB-1');
    expect(robLayer?.quantityRemaining).toBe(600);

    // Check that new semi-finished inventory layer was created in repository
    const allLayers = InventoryRepository.getAllLayers({ tenantId: TENANT_A });
    const prodLayer = allLayers.find((l) => l.sku === 'BTP-CF-COT');
    expect(prodLayer).toBeDefined();
    expect(prodLayer?.quantityRemaining).toBe(800);
    expect(prodLayer?.unitCost).toBe(140);
  });

  // TEST 11: Preparation Batch fails safely on insufficient inventory
  it('TEST 11: Preparation Batch fails cleanly when raw material stock is insufficient', () => {
    // 0 stock in repo
    RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'BTP-CF-COT',
        productId: 'P-COT',
        productName: 'Cốt cà phê',
        name: 'Công thức',
        effectiveFrom: '2026-08-01T00:00:00Z',
        yieldQuantity: 400,
        yieldUnit: 'ml',
        components: [
          {
            componentId: 'C1',
            componentSku: 'NL-CF-ROB',
            componentName: 'Hạt Robusta',
            componentType: 'RAW_MATERIAL',
            quantity: 200,
            unit: 'gam',
            standardCost: 280
          }
        ]
      },
      'Master'
    );

    const result = PreparationBatchService.executePreparationBatch(
      {
        tenantId: TENANT_A,
        branchId: 'BR01',
        warehouseId: 'WH01',
        outputSku: 'BTP-CF-COT',
        outputProductName: 'Cốt cà phê',
        plannedOutputQty: 400,
        actualOutputQty: 400,
        outputUnit: 'ml',
        operator: 'Lê Nam'
      },
      'Lê Nam'
    );

    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('Không đủ tồn kho');
  });

  // TEST 12: Consumption Engine ACCUMULATED_THRESHOLD (500g threshold, remainder tracking)
  it('TEST 12: Accumulated consumption issues threshold in chunks without losing remainder', () => {
    // Setup recipe: 1 cup consumes 40g ingredient with threshold = 500g
    RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'DU-DRINK',
        productId: 'P-D',
        productName: 'Món nước',
        name: 'Công thức',
        effectiveFrom: '2026-08-01T00:00:00Z',
        yieldQuantity: 1,
        yieldUnit: 'ly',
        components: [
          {
            componentId: 'C1',
            componentSku: 'NL-BOT',
            componentName: 'Bột pha chế',
            componentType: 'RAW_MATERIAL',
            quantity: 40,
            unit: 'gam',
            standardCost: 100,
            consumptionPolicy: 'ACCUMULATED_THRESHOLD',
            consumptionThreshold: 500
          }
        ]
      },
      'Master'
    );

    // Setup inventory layer of 2000g
    InventoryRepository.saveLayer({
      id: 'L-BOT-1',
      tenantId: TENANT_A,
      layerId: 'LOT-BOT-1',
      layerType: 'RECEIPT',
      sku: 'NL-BOT',
      productName: 'Bột pha chế',
      unit: 'gam',
      warehouseId: 'WH01',
      quantityReceived: 2000,
      quantityIssued: 0,
      quantityRemaining: 2000,
      purchasePrice: 100,
      unitCost: 100,
      salePrice: 0,
      status: 'active'
    } as any);

    // 1. Order 1: 10 cups -> 400g consumed. (400 < 500 -> no stock issue yet, pending = 400g)
    const order1: Order = {
      id: 'ORD-1',
      code: 'DH-01',
      customerName: 'A',
      customerPhone: '090',
      warehouseId: 'WH01',
      branchId: 'BR01',
      totalAmount: 200000,
      discount: 0,
      tax: 0,
      status: 'completed',
      paymentMethod: 'vietqr',
      paymentStatus: 'paid',
      items: [{ productId: 'P-D', sku: 'DU-DRINK', productName: 'Món nước', unit: 'Ly', unitPrice: 20000, quantity: 10, totalPrice: 200000 }]
    };
    (order1 as any).tenantId = TENANT_A;

    const res1 = ConsumptionService.processOrderConsumption(order1, 'POS');
    expect(res1.success).toBe(true);
    expect(res1.generatedTransactions.length).toBe(0); // Not triggered yet

    let state = ConsumptionService.getAccumulationState(TENANT_A, 'WH01', 'NL-BOT');
    expect(state?.accumulatedQuantity).toBe(400);
    expect(state?.pendingQuantity).toBe(400);

    // 2. Order 2: 5 cups -> 200g consumed. Total pending = 400 + 200 = 600g (>= 500g).
    // Should trigger 1 stock issue of 500g. Remainder pending = 100g.
    const order2: Order = {
      id: 'ORD-2',
      code: 'DH-02',
      customerName: 'B',
      customerPhone: '090',
      warehouseId: 'WH01',
      branchId: 'BR01',
      totalAmount: 100000,
      discount: 0,
      tax: 0,
      status: 'completed',
      paymentMethod: 'vietqr',
      paymentStatus: 'paid',
      items: [{ productId: 'P-D', sku: 'DU-DRINK', productName: 'Món nước', unit: 'Ly', unitPrice: 20000, quantity: 5, totalPrice: 100000 }]
    };
    (order2 as any).tenantId = TENANT_A;

    const res2 = ConsumptionService.processOrderConsumption(order2, 'POS');
    expect(res2.success).toBe(true);
    expect(res2.generatedTransactions.length).toBe(1);
    expect(res2.generatedTransactions[0].qtyOut).toBe(500);

    state = ConsumptionService.getAccumulationState(TENANT_A, 'WH01', 'NL-BOT');
    expect(state?.accumulatedQuantity).toBe(600);
    expect(state?.pendingQuantity).toBe(100); // 100g remainder preserved!
    expect(state?.totalIssuedQuantity).toBe(500);

    // Inventory layer reduced by 500g (from 2000 to 1500)
    const layerAfter = InventoryRepository.findLayerById('L-BOT-1');
    expect(layerAfter?.quantityRemaining).toBe(1500);

    // 3. Order 3: 10 cups -> 400g consumed. Total pending = 100 + 400 = 500g.
    // Triggers another 500g stock issue, leaving 0g pending.
    const order3: Order = {
      id: 'ORD-3',
      code: 'DH-03',
      customerName: 'C',
      customerPhone: '090',
      warehouseId: 'WH01',
      branchId: 'BR01',
      totalAmount: 200000,
      discount: 0,
      tax: 0,
      status: 'completed',
      paymentMethod: 'vietqr',
      paymentStatus: 'paid',
      items: [{ productId: 'P-D', sku: 'DU-DRINK', productName: 'Món nước', unit: 'Ly', unitPrice: 20000, quantity: 10, totalPrice: 200000 }]
    };
    (order3 as any).tenantId = TENANT_A;

    const res3 = ConsumptionService.processOrderConsumption(order3, 'POS');
    expect(res3.success).toBe(true);
    expect(res3.generatedTransactions.length).toBe(1);
    expect(res3.generatedTransactions[0].qtyOut).toBe(500);

    state = ConsumptionService.getAccumulationState(TENANT_A, 'WH01', 'NL-BOT');
    expect(state?.accumulatedQuantity).toBe(1000);
    expect(state?.pendingQuantity).toBe(0);
    expect(state?.totalIssuedQuantity).toBe(1000);

    const layerFinal = InventoryRepository.findLayerById('L-BOT-1');
    expect(layerFinal?.quantityRemaining).toBe(1000);
  });

  // TEST 13: Idempotency of Consumption Service
  it('TEST 13: Processing the same order twice does not double-deduct consumption or transactions', () => {
    RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'DU-DRINK',
        productId: 'P-D',
        productName: 'Món nước',
        name: 'Công thức',
        effectiveFrom: '2026-08-01T00:00:00Z',
        yieldQuantity: 1,
        yieldUnit: 'ly',
        components: [
          {
            componentId: 'C1',
            componentSku: 'NL-BOT',
            componentName: 'Bột pha chế',
            componentType: 'RAW_MATERIAL',
            quantity: 50,
            unit: 'gam',
            standardCost: 100,
            consumptionPolicy: 'PER_TRANSACTION'
          }
        ]
      },
      'Master'
    );

    InventoryRepository.saveLayer({
      id: 'L-BOT-2',
      tenantId: TENANT_A,
      layerId: 'LOT-BOT-2',
      layerType: 'RECEIPT',
      sku: 'NL-BOT',
      productName: 'Bột pha chế',
      unit: 'gam',
      warehouseId: 'WH01',
      quantityReceived: 1000,
      quantityIssued: 0,
      quantityRemaining: 1000,
      purchasePrice: 100,
      unitCost: 100,
      salePrice: 0,
      status: 'active'
    } as any);

    const order: Order = {
      id: 'ORD-IDEMPOTENT-01',
      code: 'DH-IDEMP-01',
      customerName: 'A',
      customerPhone: '090',
      warehouseId: 'WH01',
      branchId: 'BR01',
      totalAmount: 50000,
      discount: 0,
      tax: 0,
      status: 'completed',
      paymentMethod: 'vietqr',
      paymentStatus: 'paid',
      items: [{ productId: 'P-D', sku: 'DU-DRINK', productName: 'Món nước', unit: 'Ly', unitPrice: 50000, quantity: 1, totalPrice: 50000 }]
    };
    (order as any).tenantId = TENANT_A;

    // First call
    const res1 = ConsumptionService.processOrderConsumption(order, 'POS');
    expect(res1.success).toBe(true);
    expect(res1.generatedTransactions.length).toBe(1);

    // Second call with same order
    const res2 = ConsumptionService.processOrderConsumption(order, 'POS');
    expect(res2.success).toBe(true);
    expect(res2.alreadyProcessed).toBe(true);
    expect(res2.generatedTransactions.length).toBe(0); // Zero additional transactions

    const layer = InventoryRepository.findLayerById('L-BOT-2');
    expect(layer?.quantityRemaining).toBe(950); // Deducted exactly once (50g)
  });

  // TEST 14: Tenant Isolation
  it('TEST 14: Tenant A and Tenant B maintain strictly isolated price and recipe versions', () => {
    PriceVersionService.createPriceVersion(
      {
        tenantId: TENANT_A,
        productId: 'P-1',
        sku: 'SKU-COMMON',
        price: 50000,
        effectiveFrom: '2026-08-01T00:00:00Z'
      },
      'Admin A'
    );

    PriceVersionService.createPriceVersion(
      {
        tenantId: TENANT_B,
        productId: 'P-1',
        sku: 'SKU-COMMON',
        price: 80000,
        effectiveFrom: '2026-08-01T00:00:00Z'
      },
      'Admin B'
    );

    const priceA = PriceVersionService.resolveSellingPrice(TENANT_A, 'SKU-COMMON', '2026-08-10');
    const priceB = PriceVersionService.resolveSellingPrice(TENANT_B, 'SKU-COMMON', '2026-08-10');

    expect(priceA.version?.price).toBe(50000);
    expect(priceB.version?.price).toBe(80000);
  });

  // TEST 15: Purchase Cost Record & Inward Historical Tracking
  it('TEST 15: Purchase cost history records inward supplier unit cost, tax and landed costs', () => {
    const costRecord = PriceVersionService.recordPurchaseCost({
      tenantId: TENANT_A,
      sku: 'NL-CF-ROB',
      productId: 'P-CF-ROB',
      productName: 'Cà phê Robusta',
      supplierId: 'SUP-DAKLAK',
      supplierName: 'HTX Đắk Lắk',
      purchaseDocId: 'PO-001',
      purchaseDocCode: 'PO-2026-001',
      purchaseDate: '2026-08-01',
      receivedDate: '2026-08-02',
      unitCost: 280,
      quantity: 50000,
      unit: 'gam',
      currency: 'VND',
      vatRate: 8,
      vatAmount: 1120000,
      landedCost: 500000
    });

    expect(costRecord.recordId).toBeDefined();
    const history = PriceVersionService.getPurchaseCostHistory(TENANT_A, 'NL-CF-ROB');
    expect(history.length).toBe(1);
    expect(history[0].unitCost).toBe(280);
    expect(history[0].landedCost).toBe(500000);
  });

  // TEST 16: FIFO Historical Cost vs Standard Cost Variance
  it('TEST 16: RecipeCostService computes expected standard cost vs actual FIFO layer cost and variance', () => {
    RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'DU-LATTE',
        productId: 'P-LATTE',
        productName: 'Latte',
        name: 'Công thức Latte',
        effectiveFrom: '2026-08-01T00:00:00Z',
        yieldQuantity: 1,
        yieldUnit: 'ly',
        components: [
          {
            componentId: 'C1',
            componentSku: 'NL-SUA-TUOI',
            componentName: 'Sữa tươi',
            componentType: 'RAW_MATERIAL',
            quantity: 200,
            unit: 'ml',
            standardCost: 35 // Expected unit cost 35đ -> 7000đ
          }
        ]
      },
      'Admin'
    );

    // Actual inventory layer was received at 40đ/ml (higher than standard 35đ)
    InventoryRepository.saveLayer({
      id: 'L-SUA-1',
      tenantId: TENANT_A,
      layerId: 'LOT-SUA-1',
      layerType: 'RECEIPT',
      sku: 'NL-SUA-TUOI',
      productName: 'Sữa tươi',
      unit: 'ml',
      warehouseId: 'WH01',
      quantityReceived: 1000,
      quantityIssued: 0,
      quantityRemaining: 1000,
      purchasePrice: 40,
      unitCost: 40,
      salePrice: 0,
      status: 'active'
    } as any);

    const costRes = RecipeCostService.calculateRecipeCost(
      TENANT_A,
      'DU-LATTE',
      1,
      'WH01',
      '2026-08-10'
    );

    expect(costRes.success).toBe(true);
    expect(costRes.totalExpectedCost).toBe(7000); // 200ml * 35đ
    expect(costRes.totalActualFifoCost).toBe(8000); // 200ml * 40đ
    expect(costRes.totalCostVariance).toBe(1000); // 8000 - 7000 = +1000đ variance
    expect(costRes.costStatus).toBe('ACTUAL_FIFO');
  });

  // TEST 17: Multi-Level Circular Dependency Prevention
  it('TEST 17: Multi-level BOM expansion detects and prevents circular dependency loops', () => {
    // Recipe A requires B
    RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'SKU-A',
        productId: 'P-A',
        productName: 'Product A',
        name: 'Recipe A',
        effectiveFrom: '2026-08-01T00:00:00Z',
        yieldQuantity: 1,
        yieldUnit: 'cái',
        components: [
          {
            componentId: 'CA',
            componentSku: 'SKU-B',
            componentName: 'Product B',
            componentType: 'SEMI_FINISHED',
            quantity: 1,
            unit: 'cái'
          }
        ]
      },
      'Admin'
    );

    // Recipe B requires A (circular)
    RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'SKU-B',
        productId: 'P-B',
        productName: 'Product B',
        name: 'Recipe B',
        effectiveFrom: '2026-08-01T00:00:00Z',
        yieldQuantity: 1,
        yieldUnit: 'cái',
        components: [
          {
            componentId: 'CB',
            componentSku: 'SKU-A',
            componentName: 'Product A',
            componentType: 'SEMI_FINISHED',
            quantity: 1,
            unit: 'cái'
          }
        ]
      },
      'Admin'
    );

    const result = RecipeVersionService.expandMultiLevelBOM(TENANT_A, 'SKU-A', 1, '2026-08-10');
    expect(result.success).toBe(false);
    expect(result.errorMessage).toContain('Circular dependency');
  });

  // TEST 18: Consumption Ledger Append-Only Integrity
  it('TEST 18: Consumption Ledger appends every consumption event with full order tracking', () => {
    RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'DU-TEA',
        productId: 'P-TEA',
        productName: 'Trà đào',
        name: 'Recipe Tea',
        effectiveFrom: '2026-08-01T00:00:00Z',
        yieldQuantity: 1,
        yieldUnit: 'ly',
        components: [
          {
            componentId: 'T1',
            componentSku: 'NL-TRA-DEN',
            componentName: 'Trà đen',
            componentType: 'RAW_MATERIAL',
            quantity: 10,
            unit: 'gam',
            standardCost: 50,
            consumptionPolicy: 'PER_TRANSACTION'
          }
        ]
      },
      'Admin'
    );

    InventoryRepository.saveLayer({
      id: 'L-TRA-1',
      tenantId: TENANT_A,
      layerId: 'LOT-TRA-1',
      layerType: 'RECEIPT',
      sku: 'NL-TRA-DEN',
      productName: 'Trà đen',
      unit: 'gam',
      warehouseId: 'WH01',
      quantityReceived: 500,
      quantityIssued: 0,
      quantityRemaining: 500,
      purchasePrice: 50,
      unitCost: 50,
      salePrice: 0,
      status: 'active'
    } as any);

    const order: Order = {
      id: 'ORD-TEA-001',
      code: 'DH-TEA-001',
      customerName: 'Khách',
      customerPhone: '0912',
      warehouseId: 'WH01',
      branchId: 'BR01',
      totalAmount: 30000,
      discount: 0,
      tax: 0,
      status: 'completed',
      paymentMethod: 'vietqr',
      paymentStatus: 'paid',
      items: [{ productId: 'P-TEA', sku: 'DU-TEA', productName: 'Trà đào', unit: 'Ly', unitPrice: 30000, quantity: 2, totalPrice: 30000 }]
    };
    (order as any).tenantId = TENANT_A;

    ConsumptionService.processOrderConsumption(order, 'Staff');

    const ledger = ConsumptionService.getLedger(TENANT_A, 'ORD-TEA-001');
    expect(ledger.length).toBe(1);
    expect(ledger[0].componentSku).toBe('NL-TRA-DEN');
    expect(ledger[0].quantity).toBe(20); // 2 ly * 10g
    expect(ledger[0].status).toBe('ISSUED');
  });

  // TEST 19: Price List & Channel Specific Pricing
  it('TEST 19: PriceVersionService supports channel-specific and price-list specific versions', () => {
    // Standard price 35k
    PriceVersionService.createPriceVersion(
      {
        tenantId: TENANT_A,
        productId: 'P-1',
        sku: 'DU-CF-SUA',
        price: 35000,
        channel: 'ALL',
        priceListId: 'DEFAULT',
        effectiveFrom: '2026-08-01T00:00:00Z'
      },
      'Admin'
    );

    // GrabFood delivery channel price 42k
    PriceVersionService.createPriceVersion(
      {
        tenantId: TENANT_A,
        productId: 'P-1',
        sku: 'DU-CF-SUA',
        price: 42000,
        channel: 'Shopee' as any,
        priceListId: 'DEFAULT',
        effectiveFrom: '2026-08-01T00:00:00Z'
      },
      'Admin'
    );

    const defaultPrice = PriceVersionService.resolveSellingPrice(TENANT_A, 'DU-CF-SUA', '2026-08-10');
    const shopeePrice = PriceVersionService.resolveSellingPrice(TENANT_A, 'DU-CF-SUA', '2026-08-10', 'Shopee' as any);

    expect(defaultPrice.version?.price).toBe(35000);
    expect(shopeePrice.version?.price).toBe(42000);
  });

  // TEST 20: Temporal Engine Facade Integration
  it('TEST 20: TemporalBusinessEngine facade provides single point of access for all temporal domains', () => {
    TemporalBusinessEngine.initialize({ force: true });

    const priceRes = TemporalBusinessEngine.resolveSellingPrice('TENANT-DEFAULT', 'DU-CF-SUA', '2026-08-10');
    expect(priceRes.status).toBe('SUCCESS');
    expect(priceRes.version?.price).toBe(35000);

    const recipeRes = TemporalBusinessEngine.resolveRecipe('TENANT-DEFAULT', 'DU-CF-SUA', '2026-08-10');
    expect(recipeRes.status).toBe('SUCCESS');
    expect(recipeRes.version?.recipeCode).toBe('REC-CFSUA-01');
  });

  // TEST 21: Historical Gross Margin % Stability
  it('TEST 21: Gross margin percentage remains stable for historical snapshots', () => {
    const order: Order = {
      id: 'ORD-MARGIN-01',
      code: 'DH-M01',
      customerName: 'Khách',
      customerPhone: '0912',
      warehouseId: 'WH01',
      branchId: 'BR01',
      totalAmount: 100000,
      discount: 0,
      tax: 0,
      status: 'completed',
      paymentMethod: 'vietqr',
      paymentStatus: 'paid',
      items: [{ productId: 'P-1', sku: 'SKU-M', productName: 'Món', unit: 'Cái', unitPrice: 100000, quantity: 1, totalPrice: 100000 }]
    };
    (order as any).tenantId = TENANT_A;

    InventoryRepository.saveLayer({
      id: 'L-M-1',
      tenantId: TENANT_A,
      layerId: 'LOT-M-1',
      layerType: 'RECEIPT',
      sku: 'SKU-M',
      productName: 'Món',
      unit: 'cái',
      warehouseId: 'WH01',
      quantityReceived: 10,
      quantityIssued: 0,
      quantityRemaining: 10,
      purchasePrice: 60000,
      unitCost: 60000,
      salePrice: 0,
      status: 'active'
    } as any);

    const snapshot = TransactionSnapshotService.createOrderSnapshot(order, '2026-08-10');
    expect(snapshot.totalRevenue).toBe(100000);
    expect(snapshot.totalActualCogs).toBe(60000);
    expect(snapshot.grossProfit).toBe(40000);
    expect(snapshot.grossMarginPercent).toBe(40);
  });

  // TEST 22: Rejection of retroactive version starting before prior version
  it('TEST 22: Creating a new version with an effectiveFrom date before existing future version is rejected', () => {
    const existing: SellingPriceVersion[] = [
      {
        versionId: 'V1',
        version: 1,
        productId: 'P-1',
        sku: 'SKU-01',
        price: 35000,
        currency: 'VND',
        effectiveFrom: '2026-09-01T00:00:00Z',
        effectiveTo: null,
        status: 'ACTIVE',
        createdAt: '2026-09-01',
        createdBy: 'Admin',
        tenantId: TENANT_A
      }
    ];

    const creation = EffectiveDateResolver.createNextVersion<SellingPriceVersion>(
      existing,
      {
        tenantId: TENANT_A,
        productId: 'P-1',
        sku: 'SKU-01',
        price: 30000,
        effectiveFrom: '2026-08-01T00:00:00Z', // Starts before existing version
        createdBy: 'Admin'
      }
    );

    expect(creation.success).toBe(false);
    expect(creation.errorMessage).toContain('Future versions must not be retroactively superseded');
  });

  // TEST 23: Packaging consumption policy inclusion in order consumption
  it('TEST 23: Packaging items defined in recipes are consumed per transaction', () => {
    RecipeVersionService.createRecipeVersion(
      {
        tenantId: TENANT_A,
        productSku: 'DU-DRINK-PACK',
        productId: 'P-DP',
        productName: 'Đồ uống đóng ly',
        name: 'Recipe with cup',
        effectiveFrom: '2026-08-01T00:00:00Z',
        yieldQuantity: 1,
        yieldUnit: 'ly',
        components: [],
        packaging: [
          {
            packagingSku: 'BB-LY-500',
            packagingName: 'Ly 500ml',
            quantity: 1,
            unit: 'cái',
            standardCost: 650,
            consumptionPolicy: 'PER_TRANSACTION'
          }
        ]
      },
      'Admin'
    );

    InventoryRepository.saveLayer({
      id: 'L-LY-1',
      tenantId: TENANT_A,
      layerId: 'LOT-LY-1',
      layerType: 'RECEIPT',
      sku: 'BB-LY-500',
      productName: 'Ly 500ml',
      unit: 'cái',
      warehouseId: 'WH01',
      quantityReceived: 100,
      quantityIssued: 0,
      quantityRemaining: 100,
      purchasePrice: 650,
      unitCost: 650,
      salePrice: 0,
      status: 'active'
    } as any);

    const order: Order = {
      id: 'ORD-PACK-01',
      code: 'DH-PACK-01',
      customerName: 'Khách',
      customerPhone: '0912',
      warehouseId: 'WH01',
      branchId: 'BR01',
      totalAmount: 30000,
      discount: 0,
      tax: 0,
      status: 'completed',
      paymentMethod: 'vietqr',
      paymentStatus: 'paid',
      items: [{ productId: 'P-DP', sku: 'DU-DRINK-PACK', productName: 'Đồ uống đóng ly', unit: 'Ly', unitPrice: 30000, quantity: 3, totalPrice: 30000 }]
    };
    (order as any).tenantId = TENANT_A;

    const res = ConsumptionService.processOrderConsumption(order, 'Staff');
    expect(res.success).toBe(true);
    expect(res.generatedTransactions.length).toBe(1);
    expect(res.generatedTransactions[0].sku).toBe('BB-LY-500');
    expect(res.generatedTransactions[0].qtyOut).toBe(3);

    const lyLayer = InventoryRepository.findLayerById('L-LY-1');
    expect(lyLayer?.quantityRemaining).toBe(97); // 100 - 3 = 97
  });
});

