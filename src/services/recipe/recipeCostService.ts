import { FIFOAllocation, InventoryLayer } from '../../types';
import { InventoryRepository } from '../../repositories/inventoryRepository';
import { fifoEngine } from '../fifoEngine';
import { RecipeVersionService } from './recipeVersionService';

export interface RecipeCostBreakdownItem {
  sku: string;
  name: string;
  type: string;
  requiredQuantity: number;
  unit: string;
  standardUnitCost: number;
  expectedCost: number;
  actualFifoUnitCost: number;
  actualFifoCost: number;
  costVariance: number; // actualFifoCost - expectedCost
  isSufficientStock: boolean;
  allocations: FIFOAllocation[];
}

export interface RecipeCostCalculationResult {
  success: boolean;
  productSku: string;
  recipeVersionId: string;
  recipeVersionNumber: number;
  orderQuantity: number;
  totalExpectedCost: number;
  totalActualFifoCost: number;
  totalCostVariance: number;
  costStatus: 'ACTUAL_FIFO' | 'ESTIMATED' | 'NOT_AVAILABLE';
  isFullyAllocated: boolean;
  items: RecipeCostBreakdownItem[];
  errorMessage?: string;
}

export class RecipeCostService {
  /**
   * Calculates both Standard Expected Cost and Actual FIFO Cost for a product at a given time and warehouse.
   */
  static calculateRecipeCost(
    tenantId: string,
    productSku: string,
    quantity: number,
    warehouseId: string,
    effectiveAt: string | Date | number = new Date()
  ): RecipeCostCalculationResult {
    const bomResult = RecipeVersionService.expandMultiLevelBOM(
      tenantId,
      productSku,
      quantity,
      effectiveAt
    );

    if (!bomResult.success || !bomResult.rootRecipe) {
      return {
        success: false,
        productSku,
        recipeVersionId: '',
        recipeVersionNumber: 0,
        orderQuantity: quantity,
        totalExpectedCost: 0,
        totalActualFifoCost: 0,
        totalCostVariance: 0,
        costStatus: 'NOT_AVAILABLE',
        isFullyAllocated: false,
        items: [],
        errorMessage: bomResult.errorMessage || 'No recipe found'
      };
    }

    const rootRecipe = bomResult.rootRecipe;
    const workingLayers = InventoryRepository.getAllLayers({
      tenantId,
      warehouseId
    });

    let totalExpectedCost = 0;
    let totalActualFifoCost = 0;
    let isFullyAllocated = true;
    const breakdownItems: RecipeCostBreakdownItem[] = [];

    for (const comp of bomResult.expandedComponents) {
      const expectedItemCost = comp.totalRequiredQuantity * comp.standardCost;
      totalExpectedCost += expectedItemCost;

      // Preview FIFO allocation for this ingredient
      const fifoResult = fifoEngine.previewFifoAllocation(
        comp.sku,
        comp.totalRequiredQuantity,
        workingLayers,
        {
          issueCode: `PREVIEW-REC-${productSku}`
        }
      );

      const actualCost = fifoResult.totalCost;
      const actualUnitCost =
        comp.totalRequiredQuantity > 0 ? actualCost / comp.totalRequiredQuantity : 0;
      const variance = actualCost - expectedItemCost;

      if (!fifoResult.isSufficientStock) {
        isFullyAllocated = false;
      }

      totalActualFifoCost += actualCost;

      breakdownItems.push({
        sku: comp.sku,
        name: comp.name,
        type: comp.type,
        requiredQuantity: comp.totalRequiredQuantity,
        unit: comp.unit,
        standardUnitCost: comp.standardCost,
        expectedCost: expectedItemCost,
        actualFifoUnitCost: actualUnitCost,
        actualFifoCost: actualCost,
        costVariance: variance,
        isSufficientStock: fifoResult.isSufficientStock,
        allocations: fifoResult.allocations
      });
    }

    const totalCostVariance = totalActualFifoCost - totalExpectedCost;
    const costStatus: 'ACTUAL_FIFO' | 'ESTIMATED' | 'NOT_AVAILABLE' = isFullyAllocated
      ? 'ACTUAL_FIFO'
      : totalActualFifoCost > 0
        ? 'ESTIMATED'
        : 'ESTIMATED';

    return {
      success: true,
      productSku,
      recipeVersionId: rootRecipe.versionId,
      recipeVersionNumber: rootRecipe.version,
      orderQuantity: quantity,
      totalExpectedCost,
      totalActualFifoCost,
      totalCostVariance,
      costStatus,
      isFullyAllocated,
      items: breakdownItems
    };
  }
}
