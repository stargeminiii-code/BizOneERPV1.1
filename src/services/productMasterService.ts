import {
  Product,
  ProductAggregate,
  ProductType,
  ProductStatus,
  SKU,
  Variant,
  Barcode,
  BarcodeType,
  Unit,
  Category,
  Brand,
  PriceList,
  PriceListItem,
  SKUChannelMapping,
  ComboComponent,
  SecurityUserContext,
  InventoryLayer
} from '../types';
import { ProductMasterRepository } from '../repositories/productMasterRepository';
import { AuditLogService } from './audit/auditLogService';
import { DataScopeEngine } from './dataScope/dataScopeEngine';
import { RoleService } from './roles/roleService';
import { RoleRepository } from '../repositories/roleRepository';

export class ProductMasterService {
  /**
   * Helper to verify if security context has required permission
   */
  private static enforcePermission(context: SecurityUserContext, requiredPermission: string): void {
    const role = RoleRepository.findById(context.roleId, context.tenantId) || RoleRepository.findByCode(context.roleCode, context.tenantId);
    
    // Check permission from role or permissions set
    const hasPerm =
      context.permissions.has('*') ||
      context.permissions.has(requiredPermission) ||
      (role ? RoleService.hasPermission(role, requiredPermission) : false);

    if (!hasPerm) {
      throw new Error(
        `Từ chối truy cập: Người dùng [${context.name}] (Vai trò: ${context.roleCode}) không có quyền [${requiredPermission}].`
      );
    }
  }

  /**
   * Helper to enforce tenant isolation
   */
  private static enforceTenant(context: SecurityUserContext, targetTenantId: string): void {
    if (context.tenantId !== targetTenantId) {
      throw new Error(
        `Vi phạm cách ly Tenant: Người dùng thuộc Tenant [${context.tenantId}] không thể truy cập tài nguyên của Tenant [${targetTenantId}].`
      );
    }
  }

  // =========================================================================
  // PRODUCT OPERATIONS
  // =========================================================================

  static getProducts(
    context: SecurityUserContext,
    filter?: {
      search?: string;
      categoryId?: string;
      brandId?: string;
      productType?: ProductType;
      status?: ProductStatus;
    }
  ): Product[] {
    this.enforcePermission(context, 'product.view');
    const items = ProductMasterRepository.findAllProducts(context.tenantId, filter);

    // Apply data scope
    return DataScopeEngine.filterList(items, context, (p) => ({
      tenantId: context.tenantId,
      branchId: p.branchId,
      warehouseId: p.warehouseId
    }));
  }

  static getProductById(context: SecurityUserContext, productId: string): Product | null {
    this.enforcePermission(context, 'product.view');
    const product = ProductMasterRepository.findProductById(context.tenantId, productId);
    if (!product) return null;

    const access = DataScopeEngine.canAccess(context, {
      tenantId: context.tenantId,
      branchId: product.branchId,
      warehouseId: product.warehouseId
    });

    if (!access.allowed) {
      throw new Error(access.reason || 'Không có quyền truy cập sản phẩm');
    }

    return product;
  }

  static getProductAggregate(context: SecurityUserContext, productId: string): ProductAggregate | null {
    this.enforcePermission(context, 'product.view');
    const agg = ProductMasterRepository.getProductAggregate(context.tenantId, productId);
    if (!agg) return null;

    const access = DataScopeEngine.canAccess(context, {
      tenantId: context.tenantId,
      branchId: agg.product.branchId,
      warehouseId: agg.product.warehouseId
    });

    if (!access.allowed) {
      throw new Error(access.reason || 'Không có quyền truy cập sản phẩm');
    }

    return agg;
  }

  static getAllProductAggregates(
    context: SecurityUserContext,
    filter?: {
      search?: string;
      categoryId?: string;
      brandId?: string;
      productType?: ProductType;
      status?: ProductStatus;
    }
  ): ProductAggregate[] {
    this.enforcePermission(context, 'product.view');
    const aggs = ProductMasterRepository.getAllProductAggregates(context.tenantId, filter);

    return aggs.filter((agg) => {
      const access = DataScopeEngine.canAccess(context, {
        tenantId: context.tenantId,
        branchId: agg.product.branchId,
        warehouseId: agg.product.warehouseId
      });
      return access.allowed;
    });
  }

  static createProduct(
    context: SecurityUserContext,
    payload: {
      product: Partial<Product>;
      variants?: Array<{
        variantName: string;
        sku: string;
        unitId: string;
        baseUnitId?: string;
        conversionFactor?: number;
        costPrice?: number;
        sellingPrice?: number;
        barcodes?: string[];
        channels?: Array<{ channel: any; extSku: string }>;
      }>;
      combos?: Array<{ componentSkuId: string; quantity: number }>;
    }
  ): ProductAggregate {
    this.enforcePermission(context, 'product.create');

    const mutationCheck = DataScopeEngine.validateMutation(context, {
      tenantId: context.tenantId,
      branchId: payload.product.branchId,
      warehouseId: payload.product.warehouseId
    });
    if (!mutationCheck.valid) {
      throw new Error(mutationCheck.error);
    }

    // 1. Create Product
    const createdProduct = ProductMasterRepository.createProduct(context.tenantId, {
      ...payload.product,
      tenantId: context.tenantId
    });

    // 2. Create Variants & SKUs if provided
    if (payload.variants && payload.variants.length > 0) {
      payload.variants.forEach((v, idx) => {
        const variantObj = ProductMasterRepository.createVariant(context.tenantId, {
          productId: createdProduct.productId,
          name: v.variantName,
          attributes: { packSize: v.variantName },
          status: 'ACTIVE'
        });

        const skuObj = ProductMasterRepository.createSku(context.tenantId, {
          productId: createdProduct.productId,
          variantId: variantObj.variantId,
          sku: v.sku,
          unitId: v.unitId,
          baseUnitId: v.baseUnitId,
          conversionFactor: v.conversionFactor || 1,
          status: 'ACTIVE'
        });

        // Add Barcodes
        if (v.barcodes) {
          v.barcodes.forEach((bCode) => {
            if (bCode && bCode.trim()) {
              ProductMasterRepository.addBarcode(context.tenantId, {
                skuId: skuObj.skuId,
                code: bCode.trim(),
                type: 'EAN'
              });
            }
          });
        }

        // Set Retail Price
        if (v.sellingPrice !== undefined) {
          ProductMasterRepository.setPriceListItem(context.tenantId, {
            priceListId: 'pl-retail',
            skuId: skuObj.skuId,
            price: v.sellingPrice,
            costPrice: v.costPrice
          });
        }

        // Set Channels
        if (v.channels) {
          v.channels.forEach((ch) => {
            ProductMasterRepository.setChannelMapping(context.tenantId, {
              skuId: skuObj.skuId,
              channel: ch.channel,
              externalSkuId: ch.extSku,
              status: 'SYNCED'
            });
          });
        }
      });
    }

    // 3. Set Combo Components if applicable
    if (payload.combos && payload.combos.length > 0 && createdProduct.sku) {
      ProductMasterRepository.setComboComponents(context.tenantId, createdProduct.sku, payload.combos);
    }

    // 4. Audit Log
    AuditLogService.log(
      context.tenantId,
      context.userId,
      'PRODUCT_CREATE',
      'product',
      'Product',
      createdProduct.productId,
      {
        productName: createdProduct.name,
        productCode: createdProduct.code,
        productType: createdProduct.productType,
        variantsCount: payload.variants?.length || 0
      }
    );

    const agg = ProductMasterRepository.getProductAggregate(context.tenantId, createdProduct.productId);
    return agg!;
  }

  static updateProduct(
    context: SecurityUserContext,
    productId: string,
    updateData: Partial<Product>
  ): Product {
    this.enforcePermission(context, 'product.update');

    const existing = ProductMasterRepository.findProductById(context.tenantId, productId);
    if (!existing) {
      throw new Error(`Sản phẩm [${productId}] không tồn tại.`);
    }

    const mutationCheck = DataScopeEngine.validateMutation(context, {
      tenantId: context.tenantId,
      branchId: updateData.branchId || existing.branchId,
      warehouseId: updateData.warehouseId || existing.warehouseId
    });
    if (!mutationCheck.valid) {
      throw new Error(mutationCheck.error);
    }

    const updated = ProductMasterRepository.updateProduct(context.tenantId, productId, updateData);
    if (!updated) {
      throw new Error(`Không thể cập nhật sản phẩm [${productId}].`);
    }

    AuditLogService.log(
      context.tenantId,
      context.userId,
      'PRODUCT_UPDATE',
      'product',
      'Product',
      productId,
      {
        productName: updated.name,
        productCode: updated.code,
        changes: updateData
      }
    );

    return updated;
  }

  static archiveProduct(context: SecurityUserContext, productId: string): Product {
    this.enforcePermission(context, 'product.archive');

    const existing = ProductMasterRepository.findProductById(context.tenantId, productId);
    if (!existing) {
      throw new Error(`Sản phẩm [${productId}] không tồn tại.`);
    }

    const archived = ProductMasterRepository.archiveProduct(context.tenantId, productId);
    if (!archived) {
      throw new Error(`Không thể lưu trữ sản phẩm [${productId}].`);
    }

    AuditLogService.log(
      context.tenantId,
      context.userId,
      'PRODUCT_ARCHIVE',
      'product',
      'Product',
      productId,
      {
        productName: existing.name,
        productCode: existing.code
      }
    );

    return archived;
  }

  // =========================================================================
  // SKU & BARCODE OPERATIONS
  // =========================================================================

  static createSku(context: SecurityUserContext, data: Partial<SKU>): SKU {
    this.enforcePermission(context, 'sku.create');
    const sku = ProductMasterRepository.createSku(context.tenantId, data);

    AuditLogService.log(
      context.tenantId,
      context.userId,
      'SKU_CREATE',
      'product',
      'SKU',
      sku.skuId,
      { sku: sku.sku, productId: sku.productId }
    );

    return sku;
  }

  static updateSku(context: SecurityUserContext, skuId: string, data: Partial<SKU>): SKU {
    this.enforcePermission(context, 'sku.update');
    const updated = ProductMasterRepository.updateSku(context.tenantId, skuId, data);
    if (!updated) {
      throw new Error(`Mã SKU [${skuId}] không tồn tại.`);
    }

    AuditLogService.log(
      context.tenantId,
      context.userId,
      'SKU_UPDATE',
      'product',
      'SKU',
      skuId,
      { sku: updated.sku, changes: data }
    );

    return updated;
  }

  static addBarcode(
    context: SecurityUserContext,
    data: { skuId: string; code: string; type?: BarcodeType }
  ): Barcode {
    this.enforcePermission(context, 'barcode.create');
    const bc = ProductMasterRepository.addBarcode(context.tenantId, data);

    AuditLogService.log(
      context.tenantId,
      context.userId,
      'BARCODE_ADD',
      'product',
      'Barcode',
      bc.barcodeId,
      { barcode: bc.code, skuId: data.skuId, type: bc.type }
    );

    return bc;
  }

  static removeBarcode(context: SecurityUserContext, barcodeId: string): boolean {
    this.enforcePermission(context, 'barcode.delete');
    const removed = ProductMasterRepository.removeBarcode(context.tenantId, barcodeId);

    if (removed) {
      AuditLogService.log(
        context.tenantId,
        context.userId,
        'BARCODE_REMOVE',
        'product',
        'Barcode',
        barcodeId,
        { barcodeId }
      );
    }

    return removed;
  }

  // =========================================================================
  // PRICE LIST & PRICING OPERATIONS
  // =========================================================================

  static getPriceLists(context: SecurityUserContext): PriceList[] {
    this.enforcePermission(context, 'price.view');
    return ProductMasterRepository.findPriceLists(context.tenantId);
  }

  static createPriceList(context: SecurityUserContext, data: Partial<PriceList>): PriceList {
    this.enforcePermission(context, 'price.create');
    return ProductMasterRepository.createPriceList(context.tenantId, data);
  }

  static setPriceListItem(
    context: SecurityUserContext,
    data: { priceListId: string; skuId: string; price: number; costPrice?: number }
  ): PriceListItem {
    this.enforcePermission(context, 'price.update');
    const item = ProductMasterRepository.setPriceListItem(context.tenantId, data);

    AuditLogService.log(
      context.tenantId,
      context.userId,
      'PRICE_UPDATE',
      'product',
      'PriceListItem',
      item.id,
      { priceListId: data.priceListId, skuId: data.skuId, price: data.price }
    );

    return item;
  }

  // =========================================================================
  // CHANNEL MAPPING OPERATIONS
  // =========================================================================

  static getChannelMappings(context: SecurityUserContext, skuId?: string): SKUChannelMapping[] {
    this.enforcePermission(context, 'product.channel_mapping.view');
    return ProductMasterRepository.findChannelMappings(context.tenantId, skuId);
  }

  static setChannelMapping(
    context: SecurityUserContext,
    data: {
      skuId: string;
      channel: any;
      externalProductId?: string;
      externalSkuId?: string;
      status?: 'ACTIVE' | 'INACTIVE' | 'SYNCED' | 'FAILED';
    }
  ): SKUChannelMapping {
    this.enforcePermission(context, 'product.channel_mapping.update');
    const mapping = ProductMasterRepository.setChannelMapping(context.tenantId, data);

    AuditLogService.log(
      context.tenantId,
      context.userId,
      'CHANNEL_MAPPING_UPDATE',
      'product',
      'SKUChannelMapping',
      mapping.id,
      { skuId: data.skuId, channel: data.channel, externalSkuId: data.externalSkuId }
    );

    return mapping;
  }

  // =========================================================================
  // COMBO OPERATIONS
  // =========================================================================

  static getComboComponents(context: SecurityUserContext, skuId: string): ComboComponent[] {
    this.enforcePermission(context, 'combo.view');
    return ProductMasterRepository.findComboComponents(context.tenantId, skuId);
  }

  static setComboComponents(
    context: SecurityUserContext,
    skuId: string,
    components: Array<{ componentSkuId: string; quantity: number }>
  ): ComboComponent[] {
    this.enforcePermission(context, 'combo.update');
    const saved = ProductMasterRepository.setComboComponents(context.tenantId, skuId, components);

    AuditLogService.log(
      context.tenantId,
      context.userId,
      'COMBO_UPDATE',
      'product',
      'ComboComponent',
      skuId,
      { skuId, componentsCount: components.length, components }
    );

    return saved;
  }

  // =========================================================================
  // CATEGORIES & BRANDS & UNITS
  // =========================================================================

  static getCategories(context: SecurityUserContext): Category[] {
    this.enforcePermission(context, 'category.view');
    return ProductMasterRepository.findCategories(context.tenantId);
  }

  static createCategory(context: SecurityUserContext, data: Partial<Category>): Category {
    this.enforcePermission(context, 'category.create');
    return ProductMasterRepository.createCategory(context.tenantId, data);
  }

  static updateCategory(context: SecurityUserContext, categoryId: string, data: Partial<Category>): Category {
    this.enforcePermission(context, 'category.update');
    const updated = ProductMasterRepository.updateCategory(context.tenantId, categoryId, data);
    if (!updated) {
      throw new Error(`Danh mục [${categoryId}] không tồn tại.`);
    }
    return updated;
  }

  static getBrands(context: SecurityUserContext): Brand[] {
    this.enforcePermission(context, 'brand.view');
    return ProductMasterRepository.findBrands(context.tenantId);
  }

  static createBrand(context: SecurityUserContext, data: Partial<Brand>): Brand {
    this.enforcePermission(context, 'brand.create');
    return ProductMasterRepository.createBrand(context.tenantId, data);
  }

  static updateBrand(context: SecurityUserContext, brandId: string, data: Partial<Brand>): Brand {
    this.enforcePermission(context, 'brand.update');
    const updated = ProductMasterRepository.updateBrand(context.tenantId, brandId, data);
    if (!updated) {
      throw new Error(`Thương hiệu [${brandId}] không tồn tại.`);
    }
    return updated;
  }

  static getUnits(context: SecurityUserContext): Unit[] {
    return ProductMasterRepository.findUnits(context.tenantId);
  }

  static createUnit(context: SecurityUserContext, data: Partial<Unit>): Unit {
    return ProductMasterRepository.createUnit(context.tenantId, data);
  }

  // =========================================================================
  // UNIT CONVERSION ENGINE
  // =========================================================================

  /**
   * Calculates converted quantity from a specific SKU/Unit to base unit
   */
  static convertToBaseUnitQuantity(sku: SKU, quantity: number): number {
    const factor = sku.conversionFactor && sku.conversionFactor > 0 ? sku.conversionFactor : 1;
    return quantity * factor;
  }

  /**
   * Calculates converted quantity from base unit to a specific SKU/Unit
   */
  static convertFromBaseUnitQuantity(sku: SKU, baseQuantity: number): number {
    const factor = sku.conversionFactor && sku.conversionFactor > 0 ? sku.conversionFactor : 1;
    return baseQuantity / factor;
  }

  // =========================================================================
  // RULE C: INVENTORY READ-MODEL ADAPTER
  // (Strict Rule: Product Master does NOT store inventory stock quantity)
  // =========================================================================

  /**
   * Queries real inventory layers from Inventory Engine.
   * If inventory engine or layers are not provided / found -> returns null (displayed as '--' in UI).
   * NO fake stock, NO Math.random().
   */
  static getSkuInventoryQuantity(
    tenantId: string,
    skuCode: string,
    inventoryLayers?: InventoryLayer[]
  ): number | null {
    if (!inventoryLayers || !Array.isArray(inventoryLayers) || inventoryLayers.length === 0) {
      return null;
    }

    const matchedLayers = inventoryLayers.filter((l) => {
      const matchSku = l.sku && l.sku.toUpperCase() === skuCode.toUpperCase();
      return matchSku && l.status === 'active';
    });

    if (matchedLayers.length === 0) {
      return null;
    }

    return matchedLayers.reduce((sum, layer) => {
      const qty = layer.remainingQuantity !== undefined ? layer.remainingQuantity : (layer.quantityRemaining || 0);
      return sum + qty;
    }, 0);
  }
}
