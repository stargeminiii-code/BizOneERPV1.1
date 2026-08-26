import {
  RecipeVersion,
  RecipeComponent,
  RecipePackaging,
  TemporalResolutionResult,
  EffectiveDatedEntity
} from '../../types';
import { EffectiveDateResolver } from '../temporal/effectiveDateResolver';

export class RecipeVersionService {
  private static recipeVersions: Map<string, RecipeVersion[]> = new Map(); // key = `${tenantId}:${productSku}`

  /**
   * Reset / clear all state
   */
  static clear(): void {
    this.recipeVersions.clear();
  }

  /**
   * Seed / initialize recipes
   */
  static initialize(recipes: RecipeVersion[] = []): void {
    this.clear();
    for (const r of recipes) {
      const key = `${r.tenantId || 'DEFAULT'}:${r.productSku}`;
      const list = this.recipeVersions.get(key) || [];
      list.push({ ...r });
      this.recipeVersions.set(key, list);
    }
  }

  /**
   * Resolves the exact recipe version applicable at a specific historical or current timestamp.
   * If no recipe is effective at that time, returns explicit NOT_AVAILABLE.
   */
  static resolveRecipe(
    tenantId: string,
    productSku: string,
    effectiveAt: string | Date | number
  ): TemporalResolutionResult<RecipeVersion> {
    const key = `${tenantId || 'DEFAULT'}:${productSku}`;
    const versions = this.recipeVersions.get(key) || [];
    return EffectiveDateResolver.resolveVersion(versions, effectiveAt);
  }

  /**
   * Retrieves all recipe versions for an SKU.
   */
  static getRecipeVersions(tenantId: string, productSku: string): RecipeVersion[] {
    const key = `${tenantId || 'DEFAULT'}:${productSku}`;
    const list = this.recipeVersions.get(key) || [];
    return [...list].sort(
      (a, b) =>
        EffectiveDateResolver.normalizeTimestamp(a.effectiveFrom) -
        EffectiveDateResolver.normalizeTimestamp(b.effectiveFrom)
    );
  }

  /**
   * Gets a specific recipe version by its versionId.
   */
  static getRecipeVersionById(tenantId: string, versionId: string): RecipeVersion | null {
    for (const [key, versions] of this.recipeVersions.entries()) {
      if (key.startsWith(`${tenantId || 'DEFAULT'}:`)) {
        const found = versions.find((v) => v.versionId === versionId);
        if (found) return { ...found };
      }
    }
    return null;
  }

  /**
   * Marks a recipe version as referenced by a completed transaction.
   * Once referenced, it can NEVER be modified in place.
   */
  static markAsReferenced(tenantId: string, versionId: string): void {
    for (const [key, versions] of this.recipeVersions.entries()) {
      if (key.startsWith(`${tenantId || 'DEFAULT'}:`)) {
        for (const v of versions) {
          if (v.versionId === versionId) {
            v.isReferencedByTransactions = true;
          }
        }
      }
    }
  }

  /**
   * Creates a new recipe version.
   * Enforces immutability: if a version is referenced by a transaction or closed,
   * a new version must be created with a new effectiveFrom date.
   */
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
      components: RecipeComponent[];
      packaging?: RecipePackaging[];
      preparationSteps?: string[];
      estimatedStandardCost?: number;
    },
    actor: string
  ): {
    success: boolean;
    newVersion?: RecipeVersion;
    errorMessage?: string;
  } {
    const key = `${draft.tenantId || 'DEFAULT'}:${draft.productSku}`;
    const existing = this.recipeVersions.get(key) || [];

    // Calculate estimated standard cost if not explicitly provided
    let calculatedCost = draft.estimatedStandardCost || 0;
    if (!draft.estimatedStandardCost && draft.components) {
      calculatedCost = draft.components.reduce((sum, c) => {
        const cost = c.standardCost || 0;
        const loss = (c.lossPercent || 0) / 100;
        return sum + c.quantity * cost * (1 + loss);
      }, 0);

      if (draft.packaging) {
        calculatedCost += draft.packaging.reduce(
          (sum, p) => sum + p.quantity * (p.standardCost || 0),
          0
        );
      }
    }

    const recipeCode = draft.recipeCode || `REC-${draft.productSku}`;

    const result = EffectiveDateResolver.createNextVersion<RecipeVersion>(
      existing,
      {
        tenantId: draft.tenantId || 'DEFAULT',
        recipeId: `REC-ID-${draft.productSku}`,
        productSku: draft.productSku,
        productId: draft.productId,
        productName: draft.productName,
        recipeCode,
        name: draft.name,
        description: draft.description,
        yieldQuantity: draft.yieldQuantity,
        yieldUnit: draft.yieldUnit,
        components: draft.components,
        packaging: draft.packaging || [],
        preparationSteps: draft.preparationSteps || [],
        estimatedStandardCost: calculatedCost,
        isReferencedByTransactions: false,
        effectiveFrom: draft.effectiveFrom,
        effectiveTo: draft.effectiveTo,
        createdBy: actor
      },
      'RECV'
    );

    if (!result.success || !result.newVersion) {
      return {
        success: false,
        errorMessage: result.errorMessage
      };
    }

    this.recipeVersions.set(key, result.updatedVersions || []);
    return {
      success: true,
      newVersion: result.newVersion
    };
  }

  /**
   * Multi-Level BOM Resolution:
   * Recursively expands finished drink / item components to find bottom-level raw materials & packaging.
   *
   * Example:
   * CAFE SUA (1 ly)
   * -> 80ml CAFE COT (Semi-finished)
   *    -> 200g coffee beans produces 400ml CAFE COT (Ratio: 200/400 = 0.5g beans per ml)
   *    -> 80ml * 0.5 = 40g coffee beans
   * -> 30ml SUA DAC (Raw Material)
   * -> 1 Ly, 1 Nap, 1 Ong hut (Packaging)
   */
  static expandMultiLevelBOM(
    tenantId: string,
    productSku: string,
    orderQuantity: number,
    effectiveAt: string | Date | number,
    visitedSkus: Set<string> = new Set()
  ): {
    success: boolean;
    rootRecipe?: RecipeVersion;
    expandedComponents: Array<{
      sku: string;
      name: string;
      type: string;
      totalRequiredQuantity: number;
      unit: string;
      consumptionPolicy: 'PER_TRANSACTION' | 'ACCUMULATED_THRESHOLD';
      consumptionThreshold?: number;
      standardCost: number;
      sourceRecipeVersionId: string;
      level: number;
    }>;
    errorMessage?: string;
  } {
    if (visitedSkus.has(productSku)) {
      return {
        success: false,
        expandedComponents: [],
        errorMessage: `Circular dependency detected in Multi-Level BOM for SKU: ${productSku}`
      };
    }

    const recipeRes = this.resolveRecipe(tenantId, productSku, effectiveAt);
    if (recipeRes.status !== 'SUCCESS' || !recipeRes.version) {
      return {
        success: false,
        expandedComponents: [],
        errorMessage: `No active recipe found for ${productSku} at ${effectiveAt}`
      };
    }

    const rootRecipe = recipeRes.version;
    const expandedComponents: Array<{
      sku: string;
      name: string;
      type: string;
      totalRequiredQuantity: number;
      unit: string;
      consumptionPolicy: 'PER_TRANSACTION' | 'ACCUMULATED_THRESHOLD';
      consumptionThreshold?: number;
      standardCost: number;
      sourceRecipeVersionId: string;
      level: number;
    }> = [];

    const newVisited = new Set(visitedSkus);
    newVisited.add(productSku);

    // Yield ratio (e.g. if recipe produces 1 ly and order is 2, factor = 2)
    const factor = orderQuantity / (rootRecipe.yieldQuantity || 1);

    for (const comp of rootRecipe.components) {
      const requiredQty = comp.quantity * factor * (1 + (comp.lossPercent || 0) / 100);

      // Check if component is a semi-finished product with its own sub-recipe
      if (comp.componentType === 'SEMI_FINISHED') {
        const subRecipeRes = this.resolveRecipe(tenantId, comp.componentSku, effectiveAt);
        if (subRecipeRes.status === 'SUCCESS' && subRecipeRes.version) {
          // Recursively expand sub-recipe
          const subExpansion = this.expandMultiLevelBOM(
            tenantId,
            comp.componentSku,
            requiredQty,
            effectiveAt,
            newVisited
          );
          if (subExpansion.success) {
            for (const subComp of subExpansion.expandedComponents) {
              expandedComponents.push({
                ...subComp,
                level: subComp.level + 1
              });
            }
            continue;
          } else {
            return {
              success: false,
              expandedComponents: [],
              errorMessage: subExpansion.errorMessage
            };
          }
        }
      }

      // Normal raw material or F&B ingredient
      expandedComponents.push({
        sku: comp.componentSku,
        name: comp.componentName,
        type: comp.componentType,
        totalRequiredQuantity: requiredQty,
        unit: comp.unit,
        consumptionPolicy: comp.consumptionPolicy || 'PER_TRANSACTION',
        consumptionThreshold: comp.consumptionThreshold,
        standardCost: comp.standardCost || 0,
        sourceRecipeVersionId: rootRecipe.versionId,
        level: 1
      });
    }

    // Packaging components
    if (rootRecipe.packaging) {
      for (const pack of rootRecipe.packaging) {
        expandedComponents.push({
          sku: pack.packagingSku,
          name: pack.packagingName,
          type: 'PACKAGING',
          totalRequiredQuantity: pack.quantity * factor,
          unit: pack.unit,
          consumptionPolicy: pack.consumptionPolicy || 'PER_TRANSACTION',
          standardCost: pack.standardCost || 0,
          sourceRecipeVersionId: rootRecipe.versionId,
          level: 1
        });
      }
    }

    return {
      success: true,
      rootRecipe,
      expandedComponents
    };
  }

  /**
   * Retrieves all recipe versions for a tenant.
   */
  static getAllRecipes(tenantId: string): RecipeVersion[] {
    const all: RecipeVersion[] = [];
    for (const [key, versions] of this.recipeVersions.entries()) {
      if (key.startsWith(`${tenantId}:`)) {
        all.push(...versions);
      }
    }
    return all;
  }
}
