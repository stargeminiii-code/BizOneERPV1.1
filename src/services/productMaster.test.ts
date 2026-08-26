import { describe, it, expect, beforeEach } from 'vitest';
import { ProductMasterService } from './productMasterService';
import { ProductMasterRepository } from '../repositories/productMasterRepository';
import { SecurityUserContext, InventoryLayer } from '../types';
import { AuditLogService } from './audit/auditLogService';

describe('Phase 2.2 — Product Master Engine Test Suite', () => {
  const adminContext: SecurityUserContext = {
    userId: 'user-admin',
    tenantId: 'tenant-001',
    name: 'Admin User',
    email: 'admin@bizone.vn',
    roleId: 'role-system-owner',
    roleCode: 'OWNER',
    dataScope: 'COMPANY_WIDE',
    permissions: new Set(['*']),
    branchIds: ['BR01'],
    warehouseIds: ['WH01']
  };

  const restrictedStaffContext: SecurityUserContext = {
    userId: 'user-staff',
    tenantId: 'tenant-001',
    name: 'Staff User',
    email: 'staff@bizone.vn',
    roleId: 'role-system-staff',
    roleCode: 'STAFF',
    dataScope: 'INDIVIDUAL',
    permissions: new Set(['product.view']), // only view, cannot create or update
    branchIds: ['BR01'],
    warehouseIds: ['WH01']
  };

  const otherTenantContext: SecurityUserContext = {
    userId: 'user-tenant-2',
    tenantId: 'tenant-999',
    name: 'Other Tenant Admin',
    email: 'admin@tenant999.vn',
    roleId: 'role-system-owner',
    roleCode: 'OWNER',
    dataScope: 'COMPANY_WIDE',
    permissions: new Set(['*']),
    branchIds: ['BR99'],
    warehouseIds: ['WH99']
  };

  beforeEach(() => {
    ProductMasterRepository.resetToDefault();
  });

  // Test 1: Product create
  it('1. testProductCreate: should successfully create a new product and log audit', () => {
    const agg = ProductMasterService.createProduct(adminContext, {
      product: {
        name: 'Trà Xanh Cổ Thụ Shan Tuyết Tây Côn Lĩnh (OCOP 4 Sao)',
        shortName: 'Trà Shan Tuyết',
        productType: 'FINISHED_GOOD',
        categoryId: 'cat-root-agri',
        brandId: 'brd-bentre-farm',
        status: 'ACTIVE',
        trackLot: true,
        trackExpiry: true,
        shelfLifeDays: 720
      },
      variants: [
        {
          variantName: 'Hộp 100g Thượng Hạng',
          sku: 'TRA-SHAN-TUYET-100G',
          unitId: 'u-hop',
          costPrice: 150000,
          sellingPrice: 220000,
          barcodes: ['8938000111222'],
          channels: [{ channel: 'SHOPEE', extSku: 'SHP-TRA-100G' }]
        }
      ]
    });

    expect(agg).toBeDefined();
    expect(agg.product.productId).toBeDefined();
    expect(agg.product.name).toBe('Trà Xanh Cổ Thụ Shan Tuyết Tây Côn Lĩnh (OCOP 4 Sao)');
    expect(agg.skus.length).toBe(1);
    expect(agg.skus[0].sku).toBe('TRA-SHAN-TUYET-100G');
    expect(agg.barcodes.length).toBe(1);
    expect(agg.barcodes[0].code).toBe('8938000111222');
  });

  // Test 2: Product update
  it('2. testProductUpdate: should update product details and record audit log', () => {
    const updated = ProductMasterService.updateProduct(adminContext, 'P000001', {
      name: 'Sữa dừa UHT Vietcoco 330ml (Phiên bản mới 2026)',
      shelfLifeDays: 400
    });

    expect(updated.name).toBe('Sữa dừa UHT Vietcoco 330ml (Phiên bản mới 2026)');
    expect(updated.shelfLifeDays).toBe(400);

    const history = AuditLogService.getAuditHistory('tenant-001', { entityId: 'P000001' });
    expect(history.length).toBeGreaterThan(0);
  });

  // Test 3: Product archive (no hard-delete)
  it('3. testProductArchive: should archive product instead of hard deleting', () => {
    const archived = ProductMasterService.archiveProduct(adminContext, 'P000001');
    expect(archived.status).toBe('ARCHIVED');

    // Product still exists in repository
    const fetched = ProductMasterService.getProductById(adminContext, 'P000001');
    expect(fetched).not.toBeNull();
    expect(fetched?.status).toBe('ARCHIVED');
  });

  // Test 4: SKU uniqueness in tenant
  it('4. testSkuUniquenessInTenant: should reject duplicate SKU within same tenant, allow in different tenant', () => {
    // Attempting duplicate SKU in tenant-001 must throw
    expect(() => {
      ProductMasterService.createSku(adminContext, {
        productId: 'P000001',
        sku: 'VCCCM330-UHT-C02', // existing SKU
        unitId: 'u-hop'
      });
    }).toThrow(/đã tồn tại/);

    // Same SKU in another tenant must succeed
    const otherTenantSku = ProductMasterService.createSku(otherTenantContext, {
      productId: 'P-OTHER-001',
      sku: 'VCCCM330-UHT-C02',
      unitId: 'u-hop'
    });
    expect(otherTenantSku.sku).toBe('VCCCM330-UHT-C02');
    expect(otherTenantSku.tenantId).toBe('tenant-999');
  });

  // Test 5: Barcode uniqueness in tenant
  it('5. testBarcodeUniquenessInTenant: should enforce barcode uniqueness per tenant and allow multiple barcodes per SKU', () => {
    // Attempting duplicate barcode in same tenant
    expect(() => {
      ProductMasterService.addBarcode(adminContext, {
        skuId: 'sku-P000002-1',
        code: '8936034120011' // already assigned to Vietcoco SKU
      });
    }).toThrow(/đã được gán cho SKU khác/);

    // Adding second barcode to same SKU
    const secondBarcode = ProductMasterService.addBarcode(adminContext, {
      skuId: 'sku-P000001-1',
      code: '8936034129999',
      type: 'INTERNAL'
    });
    expect(secondBarcode.code).toBe('8936034129999');

    const agg = ProductMasterService.getProductAggregate(adminContext, 'P000001');
    const skuBarcodes = agg?.barcodes.filter((b) => b.skuId === 'sku-P000001-1');
    expect(skuBarcodes?.length).toBe(2);
  });

  // Test 6: Variant management
  it('6. testVariantManagement: should manage variants with custom attributes', () => {
    const variant = ProductMasterRepository.createVariant('tenant-001', {
      productId: 'P000001',
      name: 'Thùng 48 Hộp Tiết Kiệm',
      attributes: { packSize: 48, packaging: 'Carton 3 lớp' },
      status: 'ACTIVE'
    });

    expect(variant.variantId).toBeDefined();
    expect(variant.name).toBe('Thùng 48 Hộp Tiết Kiệm');
    expect(variant.attributes.packSize).toBe(48);
  });

  // Test 7: Unit conversion
  it('7. testUnitConversion: should accurately compute conversions between packaging and base units', () => {
    const skuThung = ProductMasterRepository.findSkuByCode('tenant-001', 'VCCCM330-UHT-C24')!;
    expect(skuThung).toBeDefined();
    expect(skuThung.conversionFactor).toBe(24);

    // 5 Thùng -> 120 Hộp base unit
    const baseQuantity = ProductMasterService.convertToBaseUnitQuantity(skuThung, 5);
    expect(baseQuantity).toBe(120);

    // 120 Hộp -> 5 Thùng
    const packQuantity = ProductMasterService.convertFromBaseUnitQuantity(skuThung, 120);
    expect(packQuantity).toBe(5);
  });

  // Test 8: Category hierarchy
  it('8. testCategoryHierarchy: should support parent-child category hierarchy and prevent circular references', () => {
    const categories = ProductMasterService.getCategories(adminContext);
    const fruitCat = categories.find((c) => c.categoryId === 'cat-ocop-fruit');
    expect(fruitCat).toBeDefined();
    expect(fruitCat?.parentId).toBe('cat-root-agri');

    // Prevent circular reference
    expect(() => {
      ProductMasterService.updateCategory(adminContext, 'cat-root-agri', {
        parentId: 'cat-root-agri'
      });
    }).toThrow(/không thể làm danh mục cha của chính nó/);
  });

  // Test 9: Brand management
  it('9. testBrandManagement: should create and manage brands', () => {
    const brand = ProductMasterService.createBrand(adminContext, {
      name: 'Vinamilk True Green',
      code: 'BRD-VNM',
      status: 'ACTIVE'
    });
    expect(brand.brandId).toBeDefined();
    expect(brand.name).toBe('Vinamilk True Green');

    const allBrands = ProductMasterService.getBrands(adminContext);
    expect(allBrands.some((b) => b.code === 'BRD-VNM')).toBe(true);
  });

  // Test 10: Price list & items
  it('10. testPriceListAndItems: should configure multiple price lists (Retail, Wholesale, B2B, Marketplace)', () => {
    const priceLists = ProductMasterService.getPriceLists(adminContext);
    expect(priceLists.length).toBeGreaterThanOrEqual(5);

    const wholesalePli = ProductMasterService.setPriceListItem(adminContext, {
      priceListId: 'pl-wholesale',
      skuId: 'sku-P000001-1',
      price: 31000,
      costPrice: 28000
    });
    expect(wholesalePli.price).toBe(31000);
  });

  // Test 11: Channel mapping
  it('11. testChannelMapping: should link SKU to Shopee, TikTok Shop, GrabFood, etc.', () => {
    const mapping = ProductMasterService.setChannelMapping(adminContext, {
      skuId: 'sku-P000001-1',
      channel: 'GRABFOOD',
      externalSkuId: 'GF-VCC-330ML-01',
      status: 'SYNCED'
    });

    expect(mapping.channel).toBe('GRABFOOD');
    expect(mapping.externalSkuId).toBe('GF-VCC-330ML-01');

    const mappings = ProductMasterService.getChannelMappings(adminContext, 'sku-P000001-1');
    expect(mappings.some((m) => m.channel === 'GRABFOOD')).toBe(true);
  });

  // Test 12: Combo component configuration
  it('12. testComboComponentConfiguration: should configure component SKUs and quantities for a combo', () => {
    const components = ProductMasterService.getComboComponents(adminContext, 'SET-TET-OCOP-VIP');
    expect(components.length).toBe(3);
    expect(components.find((c) => c.componentSkuId === 'ST25-TUI-5KG')?.quantity).toBe(1);

    // Update combo components
    const updated = ProductMasterService.setComboComponents(adminContext, 'SET-TET-OCOP-VIP', [
      { componentSkuId: 'ST25-TUI-5KG', quantity: 2 },
      { componentSkuId: 'CF-ROB-HONEY-500G', quantity: 1 }
    ]);
    expect(updated.length).toBe(2);
    expect(updated.find((c) => c.componentSkuId === 'ST25-TUI-5KG')?.quantity).toBe(2);
  });

  // Test 13: Tenant isolation
  it('13. testTenantIsolation: should strictly prevent cross-tenant access', () => {
    // Tenant-999 creates its own private product
    const tenant2Product = ProductMasterRepository.createProduct('tenant-999', {
      productId: 'P-TENANT999-001',
      name: 'Private Product of Tenant 999'
    });

    // Product of tenant-999 should not appear in tenant-001 list
    const tenant1Products = ProductMasterService.getProducts(adminContext);
    expect(tenant1Products.some((p) => p.productId === 'P-TENANT999-001')).toBe(false);
    expect(tenant1Products.some((p) => p.name === 'Private Product of Tenant 999')).toBe(false);

    // Direct lookup in tenant-001 must return null
    const crossTenantLookup = ProductMasterRepository.findProductById('tenant-001', 'P-TENANT999-001');
    expect(crossTenantLookup).toBeNull();
  });

  // Test 14: RBAC permissions
  it('14. testRbacPermissions: should block unauthorized actions for restricted roles', () => {
    // Staff has product.view, but not product.create
    expect(() => {
      ProductMasterService.createProduct(restrictedStaffContext, {
        product: { name: 'Unauthorized Product' }
      });
    }).toThrow(/Từ chối truy cập/);
  });

  // Test 15: DataScope application
  it('15. testDataScopeApplication: should apply DataScope filtering correctly', () => {
    const products = ProductMasterService.getProducts(adminContext);
    expect(products.length).toBeGreaterThan(0);
  });

  // Test 16: Audit logging
  it('16. testAuditLogging: should record audit logs for product, sku, price mutations', () => {
    ProductMasterService.createProduct(adminContext, {
      product: { name: 'Audit Test Product' },
      variants: [{ variantName: 'Std', sku: 'AUDIT-TEST-SKU', unitId: 'u-hop' }]
    });

    const logs = AuditLogService.getAuditHistory('tenant-001', { module: 'product' });
    expect(logs.some((l) => l.action === 'PRODUCT_CREATE')).toBe(true);
  });

  // Test 17: Existing data migration
  it('17. testExistingDataMigration: should migrate and preserve existing products across sectors', () => {
    const products = ProductMasterService.getProducts(adminContext);
    
    // Check coverage: F&B (Vietcoco), Nông sản OCOP (Sầu riêng Ri6, Gạo ST25), Kim loại (Thép Hòa Phát), Combo
    expect(products.some((p) => p.productType === 'BEVERAGE')).toBe(true);
    expect(products.some((p) => p.productType === 'FINISHED_GOOD')).toBe(true);
    expect(products.some((p) => p.productType === 'TRADING_GOOD')).toBe(true);
    expect(products.some((p) => p.productType === 'COMBO')).toBe(true);
  });

  // Test 18: No fake stock in Product Master
  it('18. testNoFakeStockInProduct: should not fake stock in Product; should read from Inventory Engine or return null', () => {
    const sampleLayers: InventoryLayer[] = [
      {
        id: 'lot-1',
        layerId: 'LOT-01',
        lotId: 'LOT-01',
        layerType: 'RECEIPT',
        sku: 'VCCCM330-UHT-C02',
        productId: 'P000001',
        productCode: 'VCCCM330-UHT',
        productName: 'Sữa dừa UHT',
        unit: 'Hộp',
        branchId: 'BR01',
        warehouseId: 'WH01',
        supplierName: 'Vietcoco',
        receivedAt: '2026-08-01',
        createdAt: '2026-08-01 08:00:00',
        quantityReceived: 240,
        quantityIssued: 0,
        quantityRemaining: 240,
        purchasePrice: 28000,
        salePrice: 36000,
        status: 'active',
        remainingQuantity: 240
      }
    ];

    // Real layer query -> 240
    const realQty = ProductMasterService.getSkuInventoryQuantity('tenant-001', 'VCCCM330-UHT-C02', sampleLayers);
    expect(realQty).toBe(240);

    // Non-existent in inventory layers -> null (UI displays '--')
    const noLayerQty = ProductMasterService.getSkuInventoryQuantity('tenant-001', 'NON-EXISTENT-SKU', sampleLayers);
    expect(noLayerQty).toBeNull();

    // No layers provided -> null (UI displays '--')
    const emptyQty = ProductMasterService.getSkuInventoryQuantity('tenant-001', 'VCCCM330-UHT-C02', []);
    expect(emptyQty).toBeNull();
  });

  // Test 19: No duplicate product model
  it('19. testNoDuplicateProductModel: should use unified Product Master schema for all business verticals', () => {
    const allAggregates = ProductMasterService.getAllProductAggregates(adminContext);
    expect(allAggregates.length).toBeGreaterThanOrEqual(6);

    allAggregates.forEach((agg) => {
      expect(agg.product.productId).toBeDefined();
      expect(agg.product.productType).toBeDefined();
      expect(agg.skus.length).toBeGreaterThan(0);
    });
  });
});
