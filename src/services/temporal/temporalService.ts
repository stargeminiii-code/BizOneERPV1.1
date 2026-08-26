import {
  SellingPriceVersion,
  RecipeVersion,
  PurchaseCostRecord,
  PreparationBatch,
  ConsumptionEvent,
  AccumulatedConsumptionState,
  OrderTransactionSnapshot,
  Order,
  SalesChannel,
  TemporalResolutionResult
} from '../../types';
import { PriceVersionService } from '../pricing/priceVersionService';
import { RecipeVersionService } from '../recipe/recipeVersionService';
import { RecipeCostService, RecipeCostCalculationResult } from '../recipe/recipeCostService';
import { PreparationBatchService } from '../fnb/preparationBatchService';
import { ConsumptionService } from '../fnb/consumptionService';
import { TransactionSnapshotService } from '../transaction/transactionSnapshotService';
import {
  INITIAL_SELLING_PRICE_VERSIONS,
  INITIAL_RECIPE_VERSIONS,
  INITIAL_PREPARATION_BATCHES
} from '../../data/temporalData';

export class TemporalBusinessEngine {
  private static isInitialized = false;

  /**
   * Initializes all temporal services with seed data
   */
  static initialize(options?: {
    prices?: SellingPriceVersion[];
    recipes?: RecipeVersion[];
    batches?: PreparationBatch[];
    force?: boolean;
  }): void {
    if (this.isInitialized && !options?.force) return;

    PriceVersionService.initialize(options?.prices || INITIAL_SELLING_PRICE_VERSIONS);
    RecipeVersionService.initialize(options?.recipes || INITIAL_RECIPE_VERSIONS);
    PreparationBatchService.initialize(options?.batches || INITIAL_PREPARATION_BATCHES);
    ConsumptionService.initialize();
    TransactionSnapshotService.initialize();

    this.isInitialized = true;
  }

  // --- SELLING PRICE ---
  static resolveSellingPrice(
    tenantId: string,
    sku: string,
    effectiveAt: string | Date | number,
    channel: SalesChannel | 'ALL' = 'ALL',
    priceListId = 'DEFAULT'
  ): TemporalResolutionResult<SellingPriceVersion> {
    this.ensureInitialized();
    return PriceVersionService.resolveSellingPrice(
      tenantId,
      sku,
      effectiveAt,
      channel,
      priceListId
    );
  }

  static createPriceVersion(
    draft: {
      tenantId: string;
      productId: string;
      sku: string;
      productName?: string;
      price: number;
      currency?: string;
      effectiveFrom: string;
      effectiveTo?: string | null;
      channel?: SalesChannel | 'ALL';
      priceListId?: string;
      minQuantity?: number;
      note?: string;
    },
    actor: string
  ) {
    this.ensureInitialized();
    return PriceVersionService.createPriceVersion(draft, actor);
  }

  static getPriceHistory(tenantId: string, sku: string) {
    this.ensureInitialized();
    return PriceVersionService.getPriceHistory(tenantId, sku);
  }

  // --- PURCHASE COST ---
  static recordPurchaseCost(record: Omit<PurchaseCostRecord, 'recordId' | 'createdAt'>) {
    this.ensureInitialized();
    return PriceVersionService.recordPurchaseCost(record);
  }

  static getPurchaseCostHistory(tenantId: string, sku: string) {
    this.ensureInitialized();
    return PriceVersionService.getPurchaseCostHistory(tenantId, sku);
  }

  // --- RECIPE / BOM ---
  static resolveRecipe(
    tenantId: string,
    productSku: string,
    effectiveAt: string | Date | number
  ): TemporalResolutionResult<RecipeVersion> {
    this.ensureInitialized();
    return RecipeVersionService.resolveRecipe(tenantId, productSku, effectiveAt);
  }

  static createRecipeVersion(
    draft: {
      tenantId: string;
      productSku: string;
      productId: string;
      productName: string;
      recipeCode?: string;
      name: string;
      description?: string;
      effectiveFrom: string;
      effectiveTo?: string | null;
      yieldQuantity: number;
      yieldUnit: string;
      components: any[];
      packaging?: any[];
      preparationSteps?: string[];
      estimatedStandardCost?: number;
    },
    actor: string
  ) {
    this.ensureInitialized();
    return RecipeVersionService.createRecipeVersion(draft, actor);
  }

  static getRecipeVersions(tenantId: string, productSku: string) {
    this.ensureInitialized();
    return RecipeVersionService.getRecipeVersions(tenantId, productSku);
  }

  static expandRecipeBOM(
    tenantId: string,
    productSku: string,
    quantity: number,
    effectiveAt: string | Date | number
  ) {
    this.ensureInitialized();
    return RecipeVersionService.expandMultiLevelBOM(tenantId, productSku, quantity, effectiveAt);
  }

  static calculateRecipeCost(
    tenantId: string,
    productSku: string,
    quantity: number,
    warehouseId: string,
    effectiveAt: string | Date | number = new Date()
  ): RecipeCostCalculationResult {
    this.ensureInitialized();
    return RecipeCostService.calculateRecipeCost(
      tenantId,
      productSku,
      quantity,
      warehouseId,
      effectiveAt
    );
  }

  // --- PREPARATION BATCHES ---
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
  ) {
    this.ensureInitialized();
    return PreparationBatchService.executePreparationBatch(params, actor);
  }

  static getAllBatches(tenantId?: string) {
    this.ensureInitialized();
    return PreparationBatchService.getAllBatches(tenantId);
  }

  // --- CONSUMPTION ENGINE ---
  static processOrderConsumption(order: Order, actor: string, idempotencyKey?: string) {
    this.ensureInitialized();
    return ConsumptionService.processOrderConsumption(order, actor, idempotencyKey);
  }

  static getConsumptionLedger(tenantId?: string, orderId?: string) {
    this.ensureInitialized();
    return ConsumptionService.getLedger(tenantId, orderId);
  }

  static getAccumulationStates(tenantId?: string) {
    this.ensureInitialized();
    return ConsumptionService.getAllAccumulationStates(tenantId);
  }

  static setConsumptionThreshold(tenantId: string, sku: string, thresholdQty: number) {
    this.ensureInitialized();
    ConsumptionService.setThreshold(tenantId, sku, thresholdQty);
  }

  // --- TRANSACTION SNAPSHOTS & COGS ---
  static createOrderSnapshot(order: Order, effectiveAt?: string | Date): OrderTransactionSnapshot {
    this.ensureInitialized();
    return TransactionSnapshotService.createOrderSnapshot(order, effectiveAt);
  }

  static getOrderSnapshot(orderId: string): OrderTransactionSnapshot | null {
    this.ensureInitialized();
    return TransactionSnapshotService.getSnapshot(orderId);
  }

  private static ensureInitialized(): void {
    if (!this.isInitialized) {
      this.initialize();
    }
  }
}
