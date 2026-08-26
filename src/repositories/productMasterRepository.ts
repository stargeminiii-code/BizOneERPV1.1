import {
  Product,
  Variant,
  SKU,
  Barcode,
  Unit,
  Category,
  Brand,
  PriceList,
  PriceListItem,
  SKUChannelMapping,
  ComboComponent,
  ProductAggregate,
  ProductType,
  ProductStatus,
  BarcodeType
} from '../types';

export class ProductMasterRepository {
  // In-memory tenant stores: Map<tenantId, Map<entityId, Entity>>
  private static products: Map<string, Map<string, Product>> = new Map();
  private static variants: Map<string, Map<string, Variant>> = new Map();
  private static skus: Map<string, Map<string, SKU>> = new Map();
  private static barcodes: Map<string, Map<string, Barcode>> = new Map();
  private static units: Map<string, Map<string, Unit>> = new Map();
  private static categories: Map<string, Map<string, Category>> = new Map();
  private static brands: Map<string, Map<string, Brand>> = new Map();
  private static priceLists: Map<string, Map<string, PriceList>> = new Map();
  private static priceListItems: Map<string, Map<string, PriceListItem>> = new Map();
  private static channelMappings: Map<string, Map<string, SKUChannelMapping>> = new Map();
  private static comboComponents: Map<string, Map<string, ComboComponent>> = new Map();

  private static initialized: boolean = false;

  private static getTenantMap<T>(store: Map<string, Map<string, T>>, tenantId: string): Map<string, T> {
    if (!store.has(tenantId)) {
      store.set(tenantId, new Map());
    }
    return store.get(tenantId)!;
  }

  // =========================================================================
  // INITIALIZATION & MIGRATION SEED
  // =========================================================================

  static initialize(): void {
    if (this.initialized) return;
    this.seedDefaultTenant('tenant-001');
    this.initialized = true;
  }

  static resetToDefault(tenantId?: string): void {
    if (tenantId) {
      this.products.delete(tenantId);
      this.variants.delete(tenantId);
      this.skus.delete(tenantId);
      this.barcodes.delete(tenantId);
      this.units.delete(tenantId);
      this.categories.delete(tenantId);
      this.brands.delete(tenantId);
      this.priceLists.delete(tenantId);
      this.priceListItems.delete(tenantId);
      this.channelMappings.delete(tenantId);
      this.comboComponents.delete(tenantId);
      this.seedDefaultTenant(tenantId);
    } else {
      this.products.clear();
      this.variants.clear();
      this.skus.clear();
      this.barcodes.clear();
      this.units.clear();
      this.categories.clear();
      this.brands.clear();
      this.priceLists.clear();
      this.priceListItems.clear();
      this.channelMappings.clear();
      this.comboComponents.clear();
      this.initialized = false;
      this.initialize();
    }
  }

  private static seedDefaultTenant(tenantId: string): void {
    const now = '2026-08-01 08:00:00';

    // 1. Seed Units
    const defaultUnits: Unit[] = [
      { unitId: 'u-chai', tenantId, name: 'Chai', symbol: 'chai', type: 'COUNT', createdAt: now, updatedAt: now },
      { unitId: 'u-hop', tenantId, name: 'Hộp', symbol: 'hộp', type: 'COUNT', createdAt: now, updatedAt: now },
      { unitId: 'u-thung', tenantId, name: 'Thùng', symbol: 'thùng', type: 'COUNT', baseUnitId: 'u-hop', conversionFactor: 24, createdAt: now, updatedAt: now },
      { unitId: 'u-kg', tenantId, name: 'Kilogram', symbol: 'kg', type: 'WEIGHT', createdAt: now, updatedAt: now },
      { unitId: 'u-gram', tenantId, name: 'Gram', symbol: 'g', type: 'WEIGHT', baseUnitId: 'u-kg', conversionFactor: 0.001, createdAt: now, updatedAt: now },
      { unitId: 'u-lon', tenantId, name: 'Lon', symbol: 'lon', type: 'COUNT', createdAt: now, updatedAt: now },
      { unitId: 'u-ly', tenantId, name: 'Ly', symbol: 'ly', type: 'COUNT', createdAt: now, updatedAt: now },
      { unitId: 'u-cuon', tenantId, name: 'Cuộn', symbol: 'cuộn', type: 'COUNT', createdAt: now, updatedAt: now },
      { unitId: 'u-tam', tenantId, name: 'Tấm', symbol: 'tấm', type: 'COUNT', createdAt: now, updatedAt: now },
      { unitId: 'u-cay', tenantId, name: 'Cây', symbol: 'cây', type: 'COUNT', createdAt: now, updatedAt: now },
      { unitId: 'u-bo', tenantId, name: 'Bộ', symbol: 'bộ', type: 'COUNT', createdAt: now, updatedAt: now },
      { unitId: 'u-set', tenantId, name: 'Set', symbol: 'set', type: 'COUNT', createdAt: now, updatedAt: now }
    ];
    const unitMap = this.getTenantMap(this.units, tenantId);
    defaultUnits.forEach((u) => unitMap.set(u.unitId, u));

    // 2. Seed Categories (hierarchical)
    const defaultCategories: Category[] = [
      { categoryId: 'cat-root-agri', tenantId, parentId: null, name: 'Nông sản & Đặc sản OCOP', code: 'CAT-AGRI', description: 'Nông sản, trái cây, gạo đặc sản và OCOP 3-5 sao', status: 'ACTIVE', createdAt: now, updatedAt: now },
      { categoryId: 'cat-ocop-fruit', tenantId, parentId: 'cat-root-agri', name: 'Trái cây OCOP', code: 'CAT-OCOP-FRUIT', status: 'ACTIVE', createdAt: now, updatedAt: now },
      { categoryId: 'cat-ocop-rice', tenantId, parentId: 'cat-root-agri', name: 'Gạo & Ngũ cốc OCOP', code: 'CAT-OCOP-RICE', status: 'ACTIVE', createdAt: now, updatedAt: now },
      
      { categoryId: 'cat-root-fnb', tenantId, parentId: null, name: 'F&B & Đồ uống', code: 'CAT-FNB', description: 'Cafe, trà, nước giải khát, sữa hạt & nguyên liệu', status: 'ACTIVE', createdAt: now, updatedAt: now },
      { categoryId: 'cat-beverages', tenantId, parentId: 'cat-root-fnb', name: 'Sữa dừa & Nước đóng chai', code: 'CAT-BEV', status: 'ACTIVE', createdAt: now, updatedAt: now },
      { categoryId: 'cat-coffee', tenantId, parentId: 'cat-root-fnb', name: 'Cà phê & Trà pha chế', code: 'CAT-COFFEE', status: 'ACTIVE', createdAt: now, updatedAt: now },
      { categoryId: 'cat-fnb-ingr', tenantId, parentId: 'cat-root-fnb', name: 'Nguyên liệu F&B', code: 'CAT-FNB-INGR', status: 'ACTIVE', createdAt: now, updatedAt: now },

      { categoryId: 'cat-root-metal', tenantId, parentId: null, name: 'Thép & Vật liệu xây dựng', code: 'CAT-METAL', description: 'Thép xây dựng, tôn cuộn, que hàn, bulong', status: 'ACTIVE', createdAt: now, updatedAt: now },
      { categoryId: 'cat-combos', tenantId, parentId: null, name: 'Combo & Quà tặng', code: 'CAT-COMBO', description: 'Gói combo đa kênh, set quà biếu', status: 'ACTIVE', createdAt: now, updatedAt: now }
    ];
    const catMap = this.getTenantMap(this.categories, tenantId);
    defaultCategories.forEach((c) => catMap.set(c.categoryId, c));

    // 3. Seed Brands
    const defaultBrands: Brand[] = [
      { brandId: 'brd-vietcoco', tenantId, name: 'Vietcoco', code: 'BRD-VC', status: 'ACTIVE', createdAt: now, updatedAt: now },
      { brandId: 'brd-hoaphat', tenantId, name: 'Tập đoàn Hòa Phát', code: 'BRD-HP', status: 'ACTIVE', createdAt: now, updatedAt: now },
      { brandId: 'brd-hoasen', tenantId, name: 'Tập đoàn Hoa Sen', code: 'BRD-HS', status: 'ACTIVE', createdAt: now, updatedAt: now },
      { brandId: 'brd-bentre-farm', tenantId, name: 'Nông sản Bến Tre', code: 'BRD-BTF', status: 'ACTIVE', createdAt: now, updatedAt: now },
      { brandId: 'brd-st25', tenantId, name: 'Gạo Ông Cua ST25', code: 'BRD-ST25', status: 'ACTIVE', createdAt: now, updatedAt: now },
      { brandId: 'brd-caudat', tenantId, name: 'Cầu Đất Farm', code: 'BRD-CDF', status: 'ACTIVE', createdAt: now, updatedAt: now },
      { brandId: 'brd-kimtin', tenantId, name: 'Kim Tín', code: 'BRD-KT', status: 'ACTIVE', createdAt: now, updatedAt: now }
    ];
    const brandMap = this.getTenantMap(this.brands, tenantId);
    defaultBrands.forEach((b) => brandMap.set(b.brandId, b));

    // 4. Seed Price Lists
    const defaultPriceLists: PriceList[] = [
      { priceListId: 'pl-retail', tenantId, name: 'Bảng giá Bán lẻ Niêm yết', code: 'PL-RETAIL', type: 'RETAIL', currency: 'VND', isDefault: true, status: 'ACTIVE', createdAt: now, updatedAt: now },
      { priceListId: 'pl-wholesale', tenantId, name: 'Bảng giá Bán buôn / Đại lý', code: 'PL-WHOLESALE', type: 'WHOLESALE', currency: 'VND', isDefault: false, status: 'ACTIVE', createdAt: now, updatedAt: now },
      { priceListId: 'pl-b2b', tenantId, name: 'Bảng giá Hợp đồng B2B Doanh nghiệp', code: 'PL-B2B', type: 'B2B', currency: 'VND', isDefault: false, status: 'ACTIVE', createdAt: now, updatedAt: now },
      { priceListId: 'pl-pos', tenantId, name: 'Bảng giá Bán lẻ POS Quầy & Mang đi', code: 'PL-POS', type: 'POS', currency: 'VND', isDefault: false, status: 'ACTIVE', createdAt: now, updatedAt: now },
      { priceListId: 'pl-marketplace', tenantId, name: 'Bảng giá Sàn TMĐT (Shopee/TikTok)', code: 'PL-MKT', type: 'MARKETPLACE', currency: 'VND', isDefault: false, status: 'ACTIVE', createdAt: now, updatedAt: now }
    ];
    const plMap = this.getTenantMap(this.priceLists, tenantId);
    defaultPriceLists.forEach((p) => plMap.set(p.priceListId, p));

    // 5. Seed Products, Variants, SKUs, Barcodes, Channel Mappings, Combos
    const seedData: Array<{
      product: Product;
      variants: Array<{
        variantName: string;
        sku: string;
        unitId: string;
        conversionFactor?: number;
        costPrice: number;
        sellingPrice: number;
        barcodes?: string[];
        channels?: Array<{ channel: any; extSku: string }>;
      }>;
      combos?: Array<{ componentSku: string; quantity: number }>;
    }> = [
      // Product 1: Sữa dừa UHT Vietcoco 330ml (BEVERAGE)
      {
        product: {
          id: 'vc-1',
          productId: 'P000001',
          tenantId,
          code: 'VCCCM330-UHT',
          productCode: 'VCCCM330-UHT',
          sku: 'VCCCM330-UHT-C02',
          variantSku: 'VCCCM330-UHT-C02',
          name: 'Sữa dừa UHT Vietcoco 330ml',
          productName: 'Sữa dừa UHT Vietcoco 330ml',
          shortName: 'Sữa dừa Vietcoco 330ml',
          description: 'Sữa dừa tiệt trùng UHT thơm béo tự nhiên, không cholesterol, không chất bảo quản.',
          productType: 'BEVERAGE',
          categoryId: 'cat-beverages',
          brandId: 'brd-vietcoco',
          category: 'Đồ uống',
          brand: 'Vietcoco',
          unit: 'Hộp',
          status: 'ACTIVE',
          tags: ['Sữa dừa', 'UHT', 'Vietcoco', 'Ăn chay'],
          trackLot: true,
          trackExpiry: true,
          shelfLifeDays: 365,
          costPrice: 28000,
          sellingPrice: 36000,
          minStock: 50,
          location: 'KHO-DU-01',
          supplierName: 'Công ty TNHH Chế Biến Dừa Lương Quới (Vietcoco)',
          supplierId: 'sup-vc',
          attributes: [
            { key: 'origin', value: 'Bến Tre, Việt Nam', label: 'Xuất xứ' },
            { key: 'shelf_life', value: '12 tháng', label: 'Hạn dùng' },
            { key: 'allergens', value: 'Dừa tự nhiên', label: 'Thành phần gây dị ứng' }
          ],
          createdAt: now,
          updatedAt: now
        },
        variants: [
          { variantName: 'Combo 2 Hộp', sku: 'VCCCM330-UHT-C02', unitId: 'u-hop', costPrice: 28000, sellingPrice: 36000, barcodes: ['8936034120011'], channels: [{ channel: 'SHOPEE', extSku: 'SHP-VCC-02' }, { channel: 'TIKTOK_SHOP', extSku: 'TT-VCC-02' }] },
          { variantName: 'Combo 6 Hộp', sku: 'VCCCM330-UHT-C06', unitId: 'u-hop', costPrice: 84000, sellingPrice: 105000, barcodes: ['8936034120028'], channels: [{ channel: 'SHOPEE', extSku: 'SHP-VCC-06' }, { channel: 'LAZADA', extSku: 'LAZ-VCC-06' }] },
          { variantName: 'Combo 10 Hộp', sku: 'VCCCM330-UHT-C10', unitId: 'u-hop', costPrice: 140000, sellingPrice: 170000, barcodes: ['8936034120035'], channels: [{ channel: 'TIKI', extSku: 'TIKI-VCC-10' }] },
          { variantName: '1/2 Thùng (12 Hộp)', sku: 'VCCCM330-UHT-C12', unitId: 'u-thung', conversionFactor: 12, costPrice: 168000, sellingPrice: 200000, barcodes: ['8936034120042'] },
          { variantName: 'Thùng 24 Hộp', sku: 'VCCCM330-UHT-C24', unitId: 'u-thung', conversionFactor: 24, costPrice: 330000, sellingPrice: 395000, barcodes: ['8936034120059'], channels: [{ channel: 'B2B', extSku: 'B2B-VCC-24' }, { channel: 'AGENCY', extSku: 'DL-VCC-24' }] }
        ]
      },

      // Product 2: Sầu riêng Ri6 Bến Tre Chín Tự Nhiên OCOP 5 Sao (FINISHED_GOOD / NÔNG SẢN)
      {
        product: {
          id: 'ocop-sr-01',
          productId: 'P000002',
          tenantId,
          code: 'OCOP-SR-RI6',
          productCode: 'OCOP-SR-RI6',
          sku: 'SR-RI6-NGUYENTRAI',
          variantSku: 'SR-RI6-NGUYENTRAI',
          name: 'Sầu riêng Ri6 Bến Tre Chín Cây (OCOP 5 Sao)',
          productName: 'Sầu riêng Ri6 Bến Tre Chín Cây (OCOP 5 Sao)',
          shortName: 'Sầu riêng Ri6 OCOP',
          description: 'Sầu riêng Ri6 giống thuần Bến Tre, cơm vàng hạt lép, chín cây tự nhiên đạt chuẩn OCOP 5 sao quốc gia.',
          productType: 'FINISHED_GOOD',
          categoryId: 'cat-ocop-fruit',
          brandId: 'brd-bentre-farm',
          category: 'Nông sản & Đặc sản OCOP',
          brand: 'Nông sản Bến Tre',
          unit: 'Kg',
          status: 'ACTIVE',
          tags: ['OCOP 5 sao', 'Nông sản', 'VietGAP', 'Trái cây xuất khẩu'],
          trackLot: true,
          trackExpiry: true,
          shelfLifeDays: 7,
          costPrice: 95000,
          sellingPrice: 135000,
          minStock: 20,
          location: 'KHO-LANH-01',
          supplierName: 'Hợp tác xã Nông nghiệp Bến Tre',
          supplierId: 'sup-btf',
          attributes: [
            { key: 'ocop_rank', value: '5 SAO', label: 'Xếp hạng OCOP' },
            { key: 'certification', value: 'VietGAP & GlobalGAP', label: 'Chứng nhận chất lượng' },
            { key: 'origin_province', value: 'Bến Tre', label: 'Tỉnh thành xuất xứ' },
            { key: 'traceability_url', value: 'https://ocop.gov.vn/ri6-bentre', label: 'Truy xuất nguồn gốc' }
          ],
          createdAt: now,
          updatedAt: now
        },
        variants: [
          { variantName: 'Nguyên trái (2.5 - 3.5kg)', sku: 'SR-RI6-NGUYENTRAI', unitId: 'u-kg', costPrice: 95000, sellingPrice: 135000, barcodes: ['8938501230018'], channels: [{ channel: 'WEBSITE', extSku: 'WEB-SR-01' }, { channel: 'POS', extSku: 'POS-SR-01' }, { channel: 'GRABFOOD', extSku: 'GF-SR-01' }] },
          { variantName: 'Tách múi đóng hộp (Hộp 500g)', sku: 'SR-RI6-MUI-500G', unitId: 'u-hop', costPrice: 120000, sellingPrice: 165000, barcodes: ['8938501230025'], channels: [{ channel: 'SHOPEEFOOD', extSku: 'SPF-SR-500' }, { channel: 'BEFOOD', extSku: 'BE-SR-500' }] }
        ]
      },

      // Product 3: Gạo ST25 Ông Cua Túi 5kg (FINISHED_GOOD / OCOP)
      {
        product: {
          id: 'ocop-gao-01',
          productId: 'P000003',
          tenantId,
          code: 'OCOP-GAO-ST25',
          productCode: 'OCOP-GAO-ST25',
          sku: 'ST25-TUI-5KG',
          variantSku: 'ST25-TUI-5KG',
          name: 'Gạo Thơm ST25 Ông Cua (Gạo ngon nhất thế giới)',
          productName: 'Gạo Thơm ST25 Ông Cua (Gạo ngon nhất thế giới)',
          shortName: 'Gạo ST25 Ông Cua 5kg',
          description: 'Gạo đặc sản Sóc Trăng hạt dài, trắng trong, dẻo thơm mùi lá dứa tự nhiên, chuẩn OCOP 5 sao.',
          productType: 'FINISHED_GOOD',
          categoryId: 'cat-ocop-rice',
          brandId: 'brd-st25',
          category: 'Nông sản & Đặc sản OCOP',
          brand: 'Gạo Ông Cua ST25',
          unit: 'Hộp',
          status: 'ACTIVE',
          tags: ['OCOP 5 sao', 'Gạo ST25', 'Gạo sạch', 'Sóc Trăng'],
          trackLot: true,
          trackExpiry: true,
          shelfLifeDays: 180,
          costPrice: 180000,
          sellingPrice: 225000,
          minStock: 30,
          location: 'KHO-AGRI-01',
          supplierName: 'DNTN Hồ Quang Trí (Gạo Ông Cua)',
          supplierId: 'sup-st25',
          attributes: [
            { key: 'ocop_rank', value: '5 SAO', label: 'Xếp hạng OCOP' },
            { key: 'origin_province', value: 'Sóc Trăng', label: 'Xuất xứ' },
            { key: 'standard', value: 'HACCP, ISO 22000', label: 'Tiêu chuẩn SX' }
          ],
          createdAt: now,
          updatedAt: now
        },
        variants: [
          { variantName: 'Túi 5kg', sku: 'ST25-TUI-5KG', unitId: 'u-hop', costPrice: 180000, sellingPrice: 225000, barcodes: ['8936098765012'], channels: [{ channel: 'SHOPEE', extSku: 'SHP-ST25-5K' }, { channel: 'TIKTOK_SHOP', extSku: 'TT-ST25-5K' }, { channel: 'WEBSITE', extSku: 'WEB-ST25-5K' }] },
          { variantName: 'Bao 25kg', sku: 'ST25-BAO-25KG', unitId: 'u-thung', conversionFactor: 5, costPrice: 850000, sellingPrice: 1050000, barcodes: ['8936098765029'], channels: [{ channel: 'B2B', extSku: 'B2B-ST25-25' }, { channel: 'AGENCY', extSku: 'DL-ST25-25' }] }
        ]
      },

      // Product 4: Cà phê Robusta Honey Cầu Đất (F&B / BEVERAGE)
      {
        product: {
          id: 'fnb-cf-01',
          productId: 'P000004',
          tenantId,
          code: 'FNB-CF-ROBUSTA',
          productCode: 'FNB-CF-ROBUSTA',
          sku: 'CF-ROB-HONEY-500G',
          variantSku: 'CF-ROB-HONEY-500G',
          name: 'Cà phê Hạt Robusta Honey Cầu Đất Đà Lạt',
          productName: 'Cà phê Hạt Robusta Honey Cầu Đất Đà Lạt',
          shortName: 'Cafe Robusta Honey 500g',
          description: 'Hạt cà phê Robusta sơ chế Honey tại độ cao 1500m Cầu Đất, vị ngọt hậu sâu, hương caramel và sô-cô-la.',
          productType: 'BEVERAGE',
          categoryId: 'cat-coffee',
          brandId: 'brd-caudat',
          category: 'F&B & Đồ uống',
          brand: 'Cầu Đất Farm',
          unit: 'Hộp',
          status: 'ACTIVE',
          tags: ['Cafe Cầu Đất', 'Robusta Honey', 'F&B Specialty'],
          trackLot: true,
          trackExpiry: true,
          shelfLifeDays: 365,
          costPrice: 90000,
          sellingPrice: 140000,
          minStock: 25,
          location: 'KHO-CF-01',
          supplierName: 'Công ty Cổ phần Cầu Đất Farm',
          supplierId: 'sup-cdf',
          attributes: [
            { key: 'roast_level', value: 'Medium Dark', label: 'Mức độ rang' },
            { key: 'altitude', value: '1,500m Cầu Đất', label: 'Độ cao vùng trồng' }
          ],
          createdAt: now,
          updatedAt: now
        },
        variants: [
          { variantName: 'Gói 250g Nguyên hạt', sku: 'CF-ROB-HONEY-250G', unitId: 'u-hop', costPrice: 50000, sellingPrice: 75000, barcodes: ['8935201112201'] },
          { variantName: 'Gói 500g Nguyên hạt', sku: 'CF-ROB-HONEY-500G', unitId: 'u-hop', costPrice: 90000, sellingPrice: 140000, barcodes: ['8935201112218'], channels: [{ channel: 'POS', extSku: 'POS-CF-500' }, { channel: 'SHOPEE', extSku: 'SHP-CF-500' }] },
          { variantName: 'Bao 5kg Pha máy Quán', sku: 'CF-ROB-HONEY-5KG', unitId: 'u-thung', conversionFactor: 10, costPrice: 800000, sellingPrice: 1200000, barcodes: ['8935201112225'], channels: [{ channel: 'B2B', extSku: 'B2B-CF-5KG' }] }
        ]
      },

      // Product 5: Thép cuộn mạ kẽm Ø6 Hòa Phát (TRADING_GOOD / METAL)
      {
        product: {
          id: 'thep-hp-01',
          productId: 'P000005',
          tenantId,
          code: 'THEP-MK-06',
          productCode: 'THEP-MK-06',
          sku: 'THEP-MK-06-HP',
          variantSku: 'THEP-MK-06-HP',
          name: 'Thép cuộn mạ kẽm Ø6 Hòa Phát',
          productName: 'Thép cuộn mạ kẽm Ø6 Hòa Phát',
          shortName: 'Thép cuộn Ø6 Hòa Phát',
          description: 'Thép cuộn mạ kẽm nhúng nóng Ø6mm tiêu chuẩn ASTM A123 / JIS G3505.',
          productType: 'TRADING_GOOD',
          categoryId: 'cat-root-metal',
          brandId: 'brd-hoaphat',
          category: 'Thép & Kim loại',
          brand: 'Tập đoàn Hòa Phát',
          unit: 'kg',
          status: 'ACTIVE',
          tags: ['Thép xây dựng', 'Hòa Phát', 'Mạ kẽm'],
          trackLot: true,
          trackExpiry: false,
          costPrice: 15000,
          sellingPrice: 18000,
          minStock: 1000,
          location: 'KHO-THEP-A1',
          supplierName: 'Tập đoàn Hòa Phát',
          supplierId: 'sup-1',
          attributes: [
            { key: 'standard', value: 'JIS G3505 / ASTM A123', label: 'Tiêu chuẩn kỹ thuật' },
            { key: 'coating', value: 'Mạ kẽm 80g/m2', label: 'Lớp mạ kẽm' }
          ],
          createdAt: now,
          updatedAt: now
        },
        variants: [
          { variantName: 'Cuộn Ø6 tiêu chuẩn (kg)', sku: 'THEP-MK-06-HP', unitId: 'u-kg', costPrice: 15000, sellingPrice: 18000, barcodes: ['8935001100062'], channels: [{ channel: 'B2B', extSku: 'B2B-THEP-06' }, { channel: 'AGENCY', extSku: 'DL-THEP-06' }] }
        ]
      },

      // Product 6: Combo Set Quà Tết Nông Sản OCOP Thượng Hạng (COMBO)
      {
        product: {
          id: 'combo-tet-01',
          productId: 'P000006',
          tenantId,
          code: 'COMBO-TET-OCOP',
          productCode: 'COMBO-TET-OCOP',
          sku: 'SET-TET-OCOP-VIP',
          variantSku: 'SET-TET-OCOP-VIP',
          name: 'Set Quà Tết Đặc Sản OCOP Thượng Hạng',
          productName: 'Set Quà Tết Đặc Sản OCOP Thượng Hạng',
          shortName: 'Set Quà Tết OCOP',
          description: 'Hộp quà cao cấp sơn mài truyền thống gồm Sầu riêng Ri6 tách múi, Gạo ST25 Ông Cua 5kg và Cà phê Robusta Honey.',
          productType: 'COMBO',
          categoryId: 'cat-combos',
          brandId: 'brd-bentre-farm',
          category: 'Combo & Quà tặng',
          brand: 'Nông sản Bến Tre',
          unit: 'Set',
          status: 'ACTIVE',
          tags: ['Quà Tết', 'Combo OCOP', 'Doanh nghiệp biếu tặng'],
          trackLot: true,
          trackExpiry: true,
          shelfLifeDays: 90,
          costPrice: 420000,
          sellingPrice: 590000,
          minStock: 10,
          location: 'KHO-COMBO-01',
          supplierName: 'Nội bộ BizOne Pack',
          attributes: [
            { key: 'packaging_type', value: 'Hộp sơn mài ép kim', label: 'Quy cách bao bì' },
            { key: 'target', value: 'Quà biếu Tết đối tác', label: 'Mục đích sử dụng' }
          ],
          createdAt: now,
          updatedAt: now
        },
        variants: [
          { variantName: 'Set VIP Hộp Sơn Mài', sku: 'SET-TET-OCOP-VIP', unitId: 'u-set', costPrice: 420000, sellingPrice: 590000, barcodes: ['8938999000123'], channels: [{ channel: 'WEBSITE', extSku: 'WEB-SET-TET' }, { channel: 'SHOPEE', extSku: 'SHP-SET-TET' }, { channel: 'B2B', extSku: 'B2B-SET-TET' }] }
        ],
        combos: [
          { componentSku: 'SR-RI6-MUI-500G', quantity: 1 },
          { componentSku: 'ST25-TUI-5KG', quantity: 1 },
          { componentSku: 'CF-ROB-HONEY-500G', quantity: 1 }
        ]
      }
    ];

    const prodMap = this.getTenantMap(this.products, tenantId);
    const varMap = this.getTenantMap(this.variants, tenantId);
    const skuMap = this.getTenantMap(this.skus, tenantId);
    const barcodeMap = this.getTenantMap(this.barcodes, tenantId);
    const plItemMap = this.getTenantMap(this.priceListItems, tenantId);
    const chMap = this.getTenantMap(this.channelMappings, tenantId);
    const comboMap = this.getTenantMap(this.comboComponents, tenantId);

    seedData.forEach((item, pIdx) => {
      // Set Product
      prodMap.set(item.product.productId, item.product);

      // Create Variants & SKUs
      const createdVariants: any[] = [];

      item.variants.forEach((v, vIdx) => {
        const variantId = `var-${item.product.productId}-${vIdx + 1}`;
        const skuId = `sku-${item.product.productId}-${vIdx + 1}`;

        const variantObj: Variant = {
          variantId,
          tenantId,
          productId: item.product.productId,
          name: v.variantName,
          attributes: { packSize: v.variantName },
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now
        };
        varMap.set(variantId, variantObj);

        const skuObj: SKU = {
          skuId,
          tenantId,
          productId: item.product.productId,
          variantId,
          sku: v.sku,
          unitId: v.unitId,
          conversionFactor: v.conversionFactor || 1,
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now
        };
        skuMap.set(skuId, skuObj);

        // Barcodes
        if (v.barcodes) {
          v.barcodes.forEach((bCode, bIdx) => {
            const barcodeId = `bc-${skuId}-${bIdx + 1}`;
            const bcObj: Barcode = {
              barcodeId,
              tenantId,
              skuId,
              code: bCode,
              type: 'EAN',
              createdAt: now,
              updatedAt: now
            };
            barcodeMap.set(barcodeId, bcObj);
          });
        }

        // Price List Items
        const pliId = `pli-${skuId}-retail`;
        const pliObj: PriceListItem = {
          id: pliId,
          tenantId,
          priceListId: 'pl-retail',
          skuId,
          price: v.sellingPrice,
          costPrice: v.costPrice,
          status: 'ACTIVE',
          createdAt: now,
          updatedAt: now
        };
        plItemMap.set(pliId, pliObj);

        // Channel Mappings
        if (v.channels) {
          v.channels.forEach((ch, chIdx) => {
            const chId = `ch-${skuId}-${chIdx + 1}`;
            const chObj: SKUChannelMapping = {
              id: chId,
              tenantId,
              skuId,
              channel: ch.channel,
              externalSkuId: ch.extSku,
              status: 'SYNCED',
              createdAt: now,
              updatedAt: now
            };
            chMap.set(chId, chObj);
          });
        }

        // Backward compatibility embedded variant
        createdVariants.push({
          id: variantId,
          variantName: v.variantName,
          sku: v.sku,
          variantSku: v.sku,
          packSize: v.conversionFactor || 1,
          unit: item.product.unit,
          sellingPrice: v.sellingPrice,
          costPrice: v.costPrice,
          barcode: v.barcodes?.[0]
        });
      });

      // Update product embedded variants
      item.product.variants = createdVariants;

      // Combo components
      if (item.combos) {
        item.combos.forEach((c, cIdx) => {
          const comboCompId = `combo-${item.product.productId}-${cIdx + 1}`;
          const comboObj: ComboComponent = {
            comboId: comboCompId,
            tenantId,
            skuId: item.variants[0].sku, // Combo SKU
            componentSkuId: c.componentSku,
            quantity: c.quantity,
            createdAt: now,
            updatedAt: now
          };
          comboMap.set(comboCompId, comboObj);
        });
      }
    });
  }

  // =========================================================================
  // PRODUCT OPERATIONS
  // =========================================================================

  static findProductById(tenantId: string, productId: string): Product | null {
    this.initialize();
    const map = this.getTenantMap(this.products, tenantId);
    const item = map.get(productId);
    return item ? { ...item } : null;
  }

  static findProductByCode(tenantId: string, code: string): Product | null {
    this.initialize();
    const map = this.getTenantMap(this.products, tenantId);
    for (const p of map.values()) {
      if (p.code === code || p.productCode === code) {
        return { ...p };
      }
    }
    return null;
  }

  static findAllProducts(
    tenantId: string,
    filter?: {
      search?: string;
      categoryId?: string;
      brandId?: string;
      productType?: ProductType;
      status?: ProductStatus;
    }
  ): Product[] {
    this.initialize();
    const map = this.getTenantMap(this.products, tenantId);
    let list = Array.from(map.values()).map((p) => ({ ...p }));

    if (filter) {
      if (filter.status) {
        list = list.filter((p) => (p.status || 'ACTIVE') === filter.status);
      }
      if (filter.categoryId && filter.categoryId !== 'all') {
        list = list.filter((p) => p.categoryId === filter.categoryId);
      }
      if (filter.brandId && filter.brandId !== 'all') {
        list = list.filter((p) => p.brandId === filter.brandId);
      }
      if (filter.productType && filter.productType !== ('all' as any)) {
        list = list.filter((p) => p.productType === filter.productType);
      }
      if (filter.search && filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        list = list.filter(
          (p) =>
            p.name.toLowerCase().includes(q) ||
            (p.code && p.code.toLowerCase().includes(q)) ||
            (p.sku && p.sku.toLowerCase().includes(q)) ||
            (p.shortName && p.shortName.toLowerCase().includes(q)) ||
            (p.tags && p.tags.some((t) => t.toLowerCase().includes(q)))
        );
      }
    }

    return list;
  }

  static createProduct(tenantId: string, data: Partial<Product>): Product {
    this.initialize();
    const map = this.getTenantMap(this.products, tenantId);

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const productId = data.productId || `P${String(map.size + 1).padStart(6, '0')}`;
    const code = data.code || data.productCode || `PRD-${Date.now().toString().slice(-4)}`;

    const newProduct: Product = {
      id: data.id || productId,
      productId,
      tenantId,
      code,
      productCode: code,
      name: data.name || 'Sản phẩm mới',
      productName: data.name || 'Sản phẩm mới',
      shortName: data.shortName,
      description: data.description,
      productType: data.productType || 'TRADING_GOOD',
      categoryId: data.categoryId,
      brandId: data.brandId,
      category: data.category || 'Mặc định',
      brand: data.brand || '',
      unit: data.unit || 'Cái',
      status: data.status || 'ACTIVE',
      image: data.image || data.imageUrl,
      imageUrl: data.imageUrl || data.image,
      tags: data.tags || [],
      trackLot: data.trackLot !== undefined ? data.trackLot : true,
      trackExpiry: data.trackExpiry !== undefined ? data.trackExpiry : false,
      shelfLifeDays: data.shelfLifeDays,
      costPrice: data.costPrice || 0,
      sellingPrice: data.sellingPrice || 0,
      minStock: data.minStock || 0,
      maxStock: data.maxStock,
      location: data.location || 'KHO-01',
      supplierName: data.supplierName || '',
      supplierId: data.supplierId,
      sku: data.sku || `${code}-STD`,
      variantSku: data.variantSku || data.sku || `${code}-STD`,
      variant: data.variant || 'Tiêu chuẩn',
      variantName: data.variantName || data.variant || 'Tiêu chuẩn',
      attributes: data.attributes || [],
      variants: data.variants || [],
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    map.set(productId, newProduct);
    return { ...newProduct };
  }

  static updateProduct(tenantId: string, productId: string, data: Partial<Product>): Product | null {
    this.initialize();
    const map = this.getTenantMap(this.products, tenantId);
    const existing = map.get(productId);
    if (!existing) return null;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated: Product = {
      ...existing,
      ...data,
      productId,
      tenantId,
      updatedAt: now
    };

    if (data.name) {
      updated.productName = data.name;
    }
    if (data.code) {
      updated.productCode = data.code;
    }

    map.set(productId, updated);
    return { ...updated };
  }

  static archiveProduct(tenantId: string, productId: string): Product | null {
    return this.updateProduct(tenantId, productId, { status: 'ARCHIVED' });
  }

  // =========================================================================
  // SKU OPERATIONS
  // =========================================================================

  static findSkuById(tenantId: string, skuId: string): SKU | null {
    this.initialize();
    const map = this.getTenantMap(this.skus, tenantId);
    const item = map.get(skuId);
    return item ? { ...item } : null;
  }

  static findSkuByCode(tenantId: string, skuCode: string): SKU | null {
    this.initialize();
    const map = this.getTenantMap(this.skus, tenantId);
    for (const s of map.values()) {
      if (s.sku.toUpperCase() === skuCode.toUpperCase()) {
        return { ...s };
      }
    }
    return null;
  }

  static findSkusByProductId(tenantId: string, productId: string): SKU[] {
    this.initialize();
    const map = this.getTenantMap(this.skus, tenantId);
    return Array.from(map.values())
      .filter((s) => s.productId === productId)
      .map((s) => ({ ...s }));
  }

  static createSku(tenantId: string, data: Partial<SKU>): SKU {
    this.initialize();
    const map = this.getTenantMap(this.skus, tenantId);

    // Enforce SKU uniqueness per tenant
    if (data.sku) {
      const existing = this.findSkuByCode(tenantId, data.sku);
      if (existing) {
        throw new Error(`Mã SKU [${data.sku}] đã tồn tại trong Doanh nghiệp (Tenant ${tenantId})`);
      }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const skuId = data.skuId || `sku-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newSku: SKU = {
      skuId,
      tenantId,
      productId: data.productId!,
      variantId: data.variantId,
      sku: data.sku || `SKU-${Date.now()}`,
      unitId: data.unitId || 'u-hop',
      baseUnitId: data.baseUnitId,
      conversionFactor: data.conversionFactor || 1,
      weight: data.weight,
      dimensions: data.dimensions,
      status: data.status || 'ACTIVE',
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    map.set(skuId, newSku);
    return { ...newSku };
  }

  static updateSku(tenantId: string, skuId: string, data: Partial<SKU>): SKU | null {
    this.initialize();
    const map = this.getTenantMap(this.skus, tenantId);
    const existing = map.get(skuId);
    if (!existing) return null;

    if (data.sku && data.sku.toUpperCase() !== existing.sku.toUpperCase()) {
      const dup = this.findSkuByCode(tenantId, data.sku);
      if (dup && dup.skuId !== skuId) {
        throw new Error(`Mã SKU [${data.sku}] đã tồn tại trong Doanh nghiệp`);
      }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated: SKU = {
      ...existing,
      ...data,
      skuId,
      tenantId,
      updatedAt: now
    };

    map.set(skuId, updated);
    return { ...updated };
  }

  // =========================================================================
  // VARIANT OPERATIONS
  // =========================================================================

  static findVariantsByProductId(tenantId: string, productId: string): Variant[] {
    this.initialize();
    const map = this.getTenantMap(this.variants, tenantId);
    return Array.from(map.values())
      .filter((v) => v.productId === productId)
      .map((v) => ({ ...v }));
  }

  static createVariant(tenantId: string, data: Partial<Variant>): Variant {
    this.initialize();
    const map = this.getTenantMap(this.variants, tenantId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const variantId = data.variantId || `var-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newVar: Variant = {
      variantId,
      tenantId,
      productId: data.productId!,
      name: data.name || 'Biến thể mới',
      attributes: data.attributes || {},
      status: data.status || 'ACTIVE',
      createdAt: data.createdAt || now,
      updatedAt: now
    };

    map.set(variantId, newVar);
    return { ...newVar };
  }

  static updateVariant(tenantId: string, variantId: string, data: Partial<Variant>): Variant | null {
    this.initialize();
    const map = this.getTenantMap(this.variants, tenantId);
    const existing = map.get(variantId);
    if (!existing) return null;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated: Variant = {
      ...existing,
      ...data,
      variantId,
      tenantId,
      updatedAt: now
    };

    map.set(variantId, updated);
    return { ...updated };
  }

  // =========================================================================
  // BARCODE OPERATIONS
  // =========================================================================

  static findBarcodesBySkuId(tenantId: string, skuId: string): Barcode[] {
    this.initialize();
    const map = this.getTenantMap(this.barcodes, tenantId);
    return Array.from(map.values())
      .filter((b) => b.skuId === skuId)
      .map((b) => ({ ...b }));
  }

  static findBarcodeByCode(tenantId: string, code: string): Barcode | null {
    this.initialize();
    const map = this.getTenantMap(this.barcodes, tenantId);
    for (const b of map.values()) {
      if (b.code.toUpperCase() === code.toUpperCase()) {
        return { ...b };
      }
    }
    return null;
  }

  static addBarcode(tenantId: string, data: { skuId: string; code: string; type?: BarcodeType }): Barcode {
    this.initialize();
    const map = this.getTenantMap(this.barcodes, tenantId);

    // Uniqueness check per tenant
    const existing = this.findBarcodeByCode(tenantId, data.code);
    if (existing) {
      throw new Error(`Mã vạch Barcode [${data.code}] đã được gán cho SKU khác trong hệ thống`);
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const barcodeId = `bc-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const newBc: Barcode = {
      barcodeId,
      tenantId,
      skuId: data.skuId,
      code: data.code,
      type: data.type || 'EAN',
      createdAt: now,
      updatedAt: now
    };

    map.set(barcodeId, newBc);
    return { ...newBc };
  }

  static removeBarcode(tenantId: string, barcodeId: string): boolean {
    this.initialize();
    const map = this.getTenantMap(this.barcodes, tenantId);
    return map.delete(barcodeId);
  }

  // =========================================================================
  // UNIT OPERATIONS
  // =========================================================================

  static findUnits(tenantId: string): Unit[] {
    this.initialize();
    const map = this.getTenantMap(this.units, tenantId);
    return Array.from(map.values()).map((u) => ({ ...u }));
  }

  static findUnitById(tenantId: string, unitId: string): Unit | null {
    this.initialize();
    const map = this.getTenantMap(this.units, tenantId);
    const item = map.get(unitId);
    return item ? { ...item } : null;
  }

  static createUnit(tenantId: string, data: Partial<Unit>): Unit {
    this.initialize();
    const map = this.getTenantMap(this.units, tenantId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const unitId = data.unitId || `u-${Date.now()}`;

    const newUnit: Unit = {
      unitId,
      tenantId,
      name: data.name || 'Đơn vị',
      symbol: data.symbol || data.name || 'đv',
      type: data.type || 'COUNT',
      baseUnitId: data.baseUnitId,
      conversionFactor: data.conversionFactor || 1,
      createdAt: now,
      updatedAt: now
    };

    map.set(unitId, newUnit);
    return { ...newUnit };
  }

  // =========================================================================
  // CATEGORY OPERATIONS
  // =========================================================================

  static findCategories(tenantId: string): Category[] {
    this.initialize();
    const map = this.getTenantMap(this.categories, tenantId);
    return Array.from(map.values()).map((c) => ({ ...c }));
  }

  static findCategoryById(tenantId: string, categoryId: string): Category | null {
    this.initialize();
    const map = this.getTenantMap(this.categories, tenantId);
    const item = map.get(categoryId);
    return item ? { ...item } : null;
  }

  static createCategory(tenantId: string, data: Partial<Category>): Category {
    this.initialize();
    const map = this.getTenantMap(this.categories, tenantId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const categoryId = data.categoryId || `cat-${Date.now()}`;

    const newCat: Category = {
      categoryId,
      tenantId,
      parentId: data.parentId !== undefined ? data.parentId : null,
      name: data.name || 'Danh mục mới',
      code: data.code || `CAT-${Date.now().toString().slice(-4)}`,
      description: data.description,
      status: data.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    map.set(categoryId, newCat);
    return { ...newCat };
  }

  static updateCategory(tenantId: string, categoryId: string, data: Partial<Category>): Category | null {
    this.initialize();
    const map = this.getTenantMap(this.categories, tenantId);
    const existing = map.get(categoryId);
    if (!existing) return null;

    // Prevent circular reference
    if (data.parentId && data.parentId === categoryId) {
      throw new Error('Danh mục không thể làm danh mục cha của chính nó');
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated: Category = {
      ...existing,
      ...data,
      categoryId,
      tenantId,
      updatedAt: now
    };

    map.set(categoryId, updated);
    return { ...updated };
  }

  // =========================================================================
  // BRAND OPERATIONS
  // =========================================================================

  static findBrands(tenantId: string): Brand[] {
    this.initialize();
    const map = this.getTenantMap(this.brands, tenantId);
    return Array.from(map.values()).map((b) => ({ ...b }));
  }

  static findBrandById(tenantId: string, brandId: string): Brand | null {
    this.initialize();
    const map = this.getTenantMap(this.brands, tenantId);
    const item = map.get(brandId);
    return item ? { ...item } : null;
  }

  static createBrand(tenantId: string, data: Partial<Brand>): Brand {
    this.initialize();
    const map = this.getTenantMap(this.brands, tenantId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const brandId = data.brandId || `brd-${Date.now()}`;

    const newBrand: Brand = {
      brandId,
      tenantId,
      name: data.name || 'Thương hiệu mới',
      code: data.code || `BRD-${Date.now().toString().slice(-4)}`,
      logo: data.logo,
      status: data.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    map.set(brandId, newBrand);
    return { ...newBrand };
  }

  static updateBrand(tenantId: string, brandId: string, data: Partial<Brand>): Brand | null {
    this.initialize();
    const map = this.getTenantMap(this.brands, tenantId);
    const existing = map.get(brandId);
    if (!existing) return null;

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const updated: Brand = {
      ...existing,
      ...data,
      brandId,
      tenantId,
      updatedAt: now
    };

    map.set(brandId, updated);
    return { ...updated };
  }

  // =========================================================================
  // PRICE LIST & ITEM OPERATIONS
  // =========================================================================

  static findPriceLists(tenantId: string): PriceList[] {
    this.initialize();
    const map = this.getTenantMap(this.priceLists, tenantId);
    return Array.from(map.values()).map((p) => ({ ...p }));
  }

  static createPriceList(tenantId: string, data: Partial<PriceList>): PriceList {
    this.initialize();
    const map = this.getTenantMap(this.priceLists, tenantId);
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const priceListId = data.priceListId || `pl-${Date.now()}`;

    const newPl: PriceList = {
      priceListId,
      tenantId,
      name: data.name || 'Bảng giá mới',
      code: data.code || `PL-${Date.now().toString().slice(-4)}`,
      type: data.type || 'RETAIL',
      currency: data.currency || 'VND',
      isDefault: data.isDefault || false,
      status: data.status || 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    map.set(priceListId, newPl);
    return { ...newPl };
  }

  static findPriceListItems(tenantId: string, skuId?: string): PriceListItem[] {
    this.initialize();
    const map = this.getTenantMap(this.priceListItems, tenantId);
    let list = Array.from(map.values());
    if (skuId) {
      list = list.filter((i) => i.skuId === skuId);
    }
    return list.map((i) => ({ ...i }));
  }

  static setPriceListItem(tenantId: string, data: { priceListId: string; skuId: string; price: number; costPrice?: number }): PriceListItem {
    this.initialize();
    const map = this.getTenantMap(this.priceListItems, tenantId);
    const id = `pli-${data.skuId}-${data.priceListId}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const item: PriceListItem = {
      id,
      tenantId,
      priceListId: data.priceListId,
      skuId: data.skuId,
      price: data.price,
      costPrice: data.costPrice,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now
    };

    map.set(id, item);
    return { ...item };
  }

  // =========================================================================
  // CHANNEL MAPPING OPERATIONS
  // =========================================================================

  static findChannelMappings(tenantId: string, skuId?: string): SKUChannelMapping[] {
    this.initialize();
    const map = this.getTenantMap(this.channelMappings, tenantId);
    let list = Array.from(map.values());
    if (skuId) {
      list = list.filter((m) => m.skuId === skuId);
    }
    return list.map((m) => ({ ...m }));
  }

  static setChannelMapping(
    tenantId: string,
    data: {
      skuId: string;
      channel: any;
      externalProductId?: string;
      externalSkuId?: string;
      status?: 'ACTIVE' | 'INACTIVE' | 'SYNCED' | 'FAILED';
    }
  ): SKUChannelMapping {
    this.initialize();
    const map = this.getTenantMap(this.channelMappings, tenantId);
    const id = `ch-${data.skuId}-${data.channel}`;
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

    const mapping: SKUChannelMapping = {
      id,
      tenantId,
      skuId: data.skuId,
      channel: data.channel,
      externalProductId: data.externalProductId,
      externalSkuId: data.externalSkuId,
      status: data.status || 'SYNCED',
      createdAt: now,
      updatedAt: now
    };

    map.set(id, mapping);
    return { ...mapping };
  }

  // =========================================================================
  // COMBO COMPONENT OPERATIONS
  // =========================================================================

  static findComboComponents(tenantId: string, skuId: string): ComboComponent[] {
    this.initialize();
    const map = this.getTenantMap(this.comboComponents, tenantId);
    return Array.from(map.values())
      .filter((c) => c.skuId === skuId)
      .map((c) => ({ ...c }));
  }

  static setComboComponents(
    tenantId: string,
    skuId: string,
    components: Array<{ componentSkuId: string; quantity: number }>
  ): ComboComponent[] {
    this.initialize();
    const map = this.getTenantMap(this.comboComponents, tenantId);

    // Remove existing components for this combo SKU
    for (const [id, c] of map.entries()) {
      if (c.skuId === skuId) {
        map.delete(id);
      }
    }

    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    const savedList: ComboComponent[] = [];

    components.forEach((c, idx) => {
      const comboId = `combo-${skuId}-${idx + 1}`;
      const item: ComboComponent = {
        comboId,
        tenantId,
        skuId,
        componentSkuId: c.componentSkuId,
        quantity: c.quantity,
        createdAt: now,
        updatedAt: now
      };
      map.set(comboId, item);
      savedList.push(item);
    });

    return savedList;
  }

  // =========================================================================
  // AGGREGATE OPERATIONS
  // =========================================================================

  static getProductAggregate(tenantId: string, productId: string): ProductAggregate | null {
    this.initialize();
    const product = this.findProductById(tenantId, productId);
    if (!product) return null;

    const category = product.categoryId ? this.findCategoryById(tenantId, product.categoryId) || undefined : undefined;
    const brand = product.brandId ? this.findBrandById(tenantId, product.brandId) || undefined : undefined;
    const variants = this.findVariantsByProductId(tenantId, productId);
    const skus = this.findSkusByProductId(tenantId, productId);

    const skuIds = new Set(skus.map((s) => s.skuId));
    const allBarcodes = this.getTenantMap(this.barcodes, tenantId);
    const barcodes = Array.from(allBarcodes.values()).filter((b) => skuIds.has(b.skuId));

    const allPli = this.getTenantMap(this.priceListItems, tenantId);
    const priceListItems = Array.from(allPli.values()).filter((pli) => skuIds.has(pli.skuId));

    const allCh = this.getTenantMap(this.channelMappings, tenantId);
    const channelMappings = Array.from(allCh.values()).filter((ch) => skuIds.has(ch.skuId));

    const skuCodes = new Set(skus.map((s) => s.sku));
    const allCombos = this.getTenantMap(this.comboComponents, tenantId);
    const comboComponents = Array.from(allCombos.values()).filter((c) => skuCodes.has(c.skuId));

    const units = this.findUnits(tenantId);

    return {
      product,
      category,
      brand,
      variants,
      skus,
      barcodes,
      units,
      priceListItems,
      channelMappings,
      comboComponents
    };
  }

  static getAllProductAggregates(
    tenantId: string,
    filter?: {
      search?: string;
      categoryId?: string;
      brandId?: string;
      productType?: ProductType;
      status?: ProductStatus;
    }
  ): ProductAggregate[] {
    this.initialize();
    const products = this.findAllProducts(tenantId, filter);
    return products
      .map((p) => this.getProductAggregate(tenantId, p.productId))
      .filter((agg): agg is ProductAggregate => agg !== null);
  }
}
