import {
  SellingPriceVersion,
  RecipeVersion,
  PurchaseCostRecord,
  InventoryLayer,
  PreparationBatch,
  OrderTransactionSnapshot
} from '../types';

export const INITIAL_SELLING_PRICE_VERSIONS: SellingPriceVersion[] = [
  // 1. Cafe Sữa Đá (DU-CF-SUA)
  {
    versionId: 'PRCV-CFSUA-V1',
    version: 1,
    productId: 'P-DU-CF-SUA',
    sku: 'DU-CF-SUA',
    productName: 'Cà Phê Sữa Đá Sài Gòn (Size L)',
    price: 35000,
    currency: 'VND',
    channel: 'ALL',
    priceListId: 'DEFAULT',
    effectiveFrom: '2026-08-01T00:00:00Z',
    effectiveTo: '2026-08-15T00:00:00Z',
    status: 'SUPERSEDED',
    createdAt: '2026-08-01T00:00:00Z',
    createdBy: 'Trần Văn Quản Trị',
    tenantId: 'TENANT-DEFAULT',
    note: 'Bảng giá khai trương V1'
  },
  {
    versionId: 'PRCV-CFSUA-V2',
    version: 2,
    productId: 'P-DU-CF-SUA',
    sku: 'DU-CF-SUA',
    productName: 'Cà Phê Sữa Đá Sài Gòn (Size L)',
    price: 39000,
    currency: 'VND',
    channel: 'ALL',
    priceListId: 'DEFAULT',
    effectiveFrom: '2026-08-15T00:00:00Z',
    effectiveTo: '2026-09-01T00:00:00Z',
    status: 'SUPERSEDED',
    supersedesVersionId: 'PRCV-CFSUA-V1',
    createdAt: '2026-08-15T00:00:00Z',
    createdBy: 'Trần Văn Quản Trị',
    tenantId: 'TENANT-DEFAULT',
    note: 'Bảng giá điều chỉnh mùa cao điểm V2'
  },
  {
    versionId: 'PRCV-CFSUA-V3',
    version: 3,
    productId: 'P-DU-CF-SUA',
    sku: 'DU-CF-SUA',
    productName: 'Cà Phê Sữa Đá Sài Gòn (Size L)',
    price: 42000,
    currency: 'VND',
    channel: 'ALL',
    priceListId: 'DEFAULT',
    effectiveFrom: '2026-09-01T00:00:00Z',
    effectiveTo: null,
    status: 'ACTIVE',
    supersedesVersionId: 'PRCV-CFSUA-V2',
    createdAt: '2026-09-01T00:00:00Z',
    createdBy: 'Trần Văn Quản Trị',
    tenantId: 'TENANT-DEFAULT',
    note: 'Bảng giá niêm yết hiện hành V3'
  },

  // 2. Cà Phê Muối Biển Đắk Lắk (DU-CF-MUOI)
  {
    versionId: 'PRCV-CFMUOI-V1',
    version: 1,
    productId: 'P-DU-CF-MUOI',
    sku: 'DU-CF-MUOI',
    productName: 'Cà Phê Muối Biển Đắk Lắk (Signature)',
    price: 38000,
    currency: 'VND',
    channel: 'ALL',
    priceListId: 'DEFAULT',
    effectiveFrom: '2026-08-01T00:00:00Z',
    effectiveTo: '2026-08-20T00:00:00Z',
    status: 'SUPERSEDED',
    createdAt: '2026-08-01T00:00:00Z',
    createdBy: 'Trần Văn Quản Trị',
    tenantId: 'TENANT-DEFAULT'
  },
  {
    versionId: 'PRCV-CFMUOI-V2',
    version: 2,
    productId: 'P-DU-CF-MUOI',
    sku: 'DU-CF-MUOI',
    productName: 'Cà Phê Muối Biển Đắk Lắk (Signature)',
    price: 45000,
    currency: 'VND',
    channel: 'ALL',
    priceListId: 'DEFAULT',
    effectiveFrom: '2026-08-20T00:00:00Z',
    effectiveTo: null,
    status: 'ACTIVE',
    supersedesVersionId: 'PRCV-CFMUOI-V1',
    createdAt: '2026-08-20T00:00:00Z',
    createdBy: 'Trần Văn Quản Trị',
    tenantId: 'TENANT-DEFAULT'
  },

  // 3. Trà Matcha Latte Uji (DU-MATCHA-LATTE)
  {
    versionId: 'PRCV-MATCHA-V1',
    version: 1,
    productId: 'P-DU-MATCHA-LATTE',
    sku: 'DU-MATCHA-LATTE',
    productName: 'Trà Matcha Latte Uji Kyoto',
    price: 48000,
    currency: 'VND',
    channel: 'ALL',
    priceListId: 'DEFAULT',
    effectiveFrom: '2026-08-01T00:00:00Z',
    effectiveTo: null,
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    createdBy: 'Trần Văn Quản Trị',
    tenantId: 'TENANT-DEFAULT'
  },

  // 4. Bán thành phẩm: Cà phê cốt pha phin (BTP-CF-COT)
  {
    versionId: 'PRCV-BTP-COT-V1',
    version: 1,
    productId: 'P-BTP-CF-COT',
    sku: 'BTP-CF-COT',
    productName: 'Cốt Cà Phê Phin Đậm Đặc (400ml)',
    price: 85000,
    currency: 'VND',
    channel: 'ALL',
    priceListId: 'DEFAULT',
    effectiveFrom: '2026-08-01T00:00:00Z',
    effectiveTo: null,
    status: 'ACTIVE',
    createdAt: '2026-08-01T00:00:00Z',
    createdBy: 'Trần Văn Quản Trị',
    tenantId: 'TENANT-DEFAULT'
  }
];

export const INITIAL_RECIPE_VERSIONS: RecipeVersion[] = [
  // 1. Cafe Sữa Đá (DU-CF-SUA) - V1
  {
    versionId: 'RECV-CFSUA-V1',
    version: 1,
    recipeId: 'REC-ID-DU-CF-SUA',
    productSku: 'DU-CF-SUA',
    productId: 'P-DU-CF-SUA',
    productName: 'Cà Phê Sữa Đá Sài Gòn (Size L)',
    recipeCode: 'REC-CFSUA-01',
    name: 'Công thức Cafe Sữa Truyền Thống V1',
    description: 'Công thức chuẩn đậm đà 80ml cốt phin + 30ml sữa đặc',
    effectiveFrom: '2026-08-01T00:00:00Z',
    effectiveTo: '2026-09-01T00:00:00Z',
    status: 'SUPERSEDED',
    yieldQuantity: 1,
    yieldUnit: 'ly',
    estimatedStandardCost: 9550,
    isReferencedByTransactions: true,
    createdAt: '2026-08-01T00:00:00Z',
    createdBy: 'Lê Hoàng Nam (Barista Master)',
    tenantId: 'TENANT-DEFAULT',
    components: [
      {
        componentId: 'CMP-CFSUA-V1-1',
        componentSku: 'BTP-CF-COT',
        componentName: 'Cốt Cà Phê Phin Đậm Đặc',
        componentType: 'SEMI_FINISHED',
        quantity: 80,
        unit: 'ml',
        standardCost: 140, // 140đ/ml -> 11,200đ
        lossPercent: 2,
        consumptionPolicy: 'PER_TRANSACTION'
      },
      {
        componentId: 'CMP-CFSUA-V1-2',
        componentSku: 'NL-SUA-DAC',
        componentName: 'Sữa Đặc Có Đường Ngôi Sao Phương Nam',
        componentType: 'RAW_MATERIAL',
        quantity: 30,
        unit: 'ml',
        standardCost: 25, // 25đ/ml -> 750đ
        lossPercent: 0,
        consumptionPolicy: 'ACCUMULATED_THRESHOLD',
        consumptionThreshold: 500
      }
    ],
    packaging: [
      {
        packagingSku: 'BB-LY-500',
        packagingName: 'Ly Nhựa PP 500ml In Logo',
        quantity: 1,
        unit: 'cái',
        standardCost: 650,
        consumptionPolicy: 'PER_TRANSACTION'
      },
      {
        packagingSku: 'BB-NAP-95',
        packagingName: 'Nắp Cầu Phi 95 Trong Suốt',
        quantity: 1,
        unit: 'cái',
        standardCost: 250,
        consumptionPolicy: 'PER_TRANSACTION'
      },
      {
        packagingSku: 'BB-ONG-HUT',
        packagingName: 'Ống Hút Giấy Kraft Phi 6 Bọc Màng',
        quantity: 1,
        unit: 'cái',
        standardCost: 120,
        consumptionPolicy: 'PER_TRANSACTION'
      }
    ],
    preparationSteps: [
      'Cho 30ml sữa đặc vào đáy ly',
      'Rót 80ml cốt cà phê phin đậm đặc lên trên',
      'Đầy đá viên bi 80% ly, khuấy nhẹ và đậy nắp kèm ống hút'
    ]
  },

  // 1b. Cafe Sữa Đá (DU-CF-SUA) - V2 (Effective from 2026-09-01)
  {
    versionId: 'RECV-CFSUA-V2',
    version: 2,
    recipeId: 'REC-ID-DU-CF-SUA',
    productSku: 'DU-CF-SUA',
    productId: 'P-DU-CF-SUA',
    productName: 'Cà Phê Sữa Đá Sài Gòn (Size L)',
    recipeCode: 'REC-CFSUA-02',
    name: 'Công thức Cafe Sữa Tươi Cải Tiến V2',
    description: 'Điều chỉnh lượng cốt 70ml + 25ml sữa đặc + 10ml sữa tươi Dalatmilk thanh béo dịu',
    effectiveFrom: '2026-09-01T00:00:00Z',
    effectiveTo: null,
    status: 'ACTIVE',
    supersedesVersionId: 'RECV-CFSUA-V1',
    yieldQuantity: 1,
    yieldUnit: 'ly',
    estimatedStandardCost: 9850,
    isReferencedByTransactions: false,
    createdAt: '2026-09-01T00:00:00Z',
    createdBy: 'Lê Hoàng Nam (Barista Master)',
    tenantId: 'TENANT-DEFAULT',
    components: [
      {
        componentId: 'CMP-CFSUA-V2-1',
        componentSku: 'BTP-CF-COT',
        componentName: 'Cốt Cà Phê Phin Đậm Đặc',
        componentType: 'SEMI_FINISHED',
        quantity: 70,
        unit: 'ml',
        standardCost: 140,
        lossPercent: 2,
        consumptionPolicy: 'PER_TRANSACTION'
      },
      {
        componentId: 'CMP-CFSUA-V2-2',
        componentSku: 'NL-SUA-DAC',
        componentName: 'Sữa Đặc Có Đường Ngôi Sao Phương Nam',
        componentType: 'RAW_MATERIAL',
        quantity: 25,
        unit: 'ml',
        standardCost: 25,
        lossPercent: 0,
        consumptionPolicy: 'ACCUMULATED_THRESHOLD',
        consumptionThreshold: 500
      },
      {
        componentId: 'CMP-CFSUA-V2-3',
        componentSku: 'NL-SUA-TUOI-THANHTRUNG',
        componentName: 'Sữa Tươi Thanh Trùng Nguyên Chất Dalatmilk',
        componentType: 'RAW_MATERIAL',
        quantity: 10,
        unit: 'ml',
        standardCost: 38,
        lossPercent: 1,
        consumptionPolicy: 'PER_TRANSACTION'
      }
    ],
    packaging: [
      {
        packagingSku: 'BB-LY-500',
        packagingName: 'Ly Nhựa PP 500ml In Logo',
        quantity: 1,
        unit: 'cái',
        standardCost: 650,
        consumptionPolicy: 'PER_TRANSACTION'
      },
      {
        packagingSku: 'BB-NAP-95',
        packagingName: 'Nắp Cầu Phi 95 Trong Suốt',
        quantity: 1,
        unit: 'cái',
        standardCost: 250,
        consumptionPolicy: 'PER_TRANSACTION'
      },
      {
        packagingSku: 'BB-ONG-HUT',
        packagingName: 'Ống Hút Giấy Kraft Phi 6 Bọc Màng',
        quantity: 1,
        unit: 'cái',
        standardCost: 120,
        consumptionPolicy: 'PER_TRANSACTION'
      }
    ],
    preparationSteps: [
      'Cho 25ml sữa đặc + 10ml sữa tươi Dalatmilk vào đáy ly khuấy đều',
      'Rót 70ml cốt cà phê phin',
      'Đầy đá bi, đánh bọt nhẹ bề mặt'
    ]
  },

  // 2. Semi-Finished Batch: Cốt Cà Phê Phin (BTP-CF-COT)
  {
    versionId: 'RECV-BTP-COT-V1',
    version: 1,
    recipeId: 'REC-ID-BTP-CF-COT',
    productSku: 'BTP-CF-COT',
    productId: 'P-BTP-CF-COT',
    productName: 'Cốt Cà Phê Phin Đậm Đặc (400ml)',
    recipeCode: 'REC-BTP-COT-01',
    name: 'Công thức Ủ Cốt Cà Phê Phin Lớn 400ml V1',
    description: 'Ủ 200g bột Robusta mộc chiết xuất 400ml cốt sánh quyện',
    effectiveFrom: '2026-08-01T00:00:00Z',
    effectiveTo: null,
    status: 'ACTIVE',
    yieldQuantity: 400,
    yieldUnit: 'ml',
    estimatedStandardCost: 56000, // 56,000 / 400ml = 140đ/ml
    isReferencedByTransactions: true,
    createdAt: '2026-08-01T00:00:00Z',
    createdBy: 'Lê Hoàng Nam (Barista Master)',
    tenantId: 'TENANT-DEFAULT',
    components: [
      {
        componentId: 'CMP-BTP-COT-1',
        componentSku: 'NL-CF-ROB',
        componentName: 'Hạt Cà Phê Robusta Mộc Đắk Lắk (Rang Vừa)',
        componentType: 'RAW_MATERIAL',
        quantity: 200,
        unit: 'gam',
        standardCost: 280, // 280đ/g -> 56,000đ
        lossPercent: 0,
        consumptionPolicy: 'PER_TRANSACTION'
      }
    ],
    preparationSteps: [
      'Xay 200g hạt Robusta độ mịn trung bình',
      'Châm 100ml nước sôi 94°C ủ nở 3 phút',
      'Châm tiếp 350ml nước sôi chiết xuất chậm thu 400ml cốt',
      'Bảo quản mát 4-8°C dùng trong 24h'
    ]
  },

  // 3. Cà Phê Muối Biển Đắk Lắk (DU-CF-MUOI) - V1
  {
    versionId: 'RECV-CFMUOI-V1',
    version: 1,
    recipeId: 'REC-ID-DU-CF-MUOI',
    productSku: 'DU-CF-MUOI',
    productId: 'P-DU-CF-MUOI',
    productName: 'Cà Phê Muối Biển Đắk Lắk (Signature)',
    recipeCode: 'REC-CFMUOI-01',
    name: 'Công thức Cà Phê Muối Signature V1',
    description: 'Cốt phin 80ml + Sữa đặc 25ml + Kem béo muối hồng 30ml',
    effectiveFrom: '2026-08-01T00:00:00Z',
    effectiveTo: null,
    status: 'ACTIVE',
    yieldQuantity: 1,
    yieldUnit: 'ly',
    estimatedStandardCost: 13350,
    isReferencedByTransactions: true,
    createdAt: '2026-08-01T00:00:00Z',
    createdBy: 'Lê Hoàng Nam (Barista Master)',
    tenantId: 'TENANT-DEFAULT',
    components: [
      {
        componentId: 'CMP-CFMUOI-1',
        componentSku: 'BTP-CF-COT',
        componentName: 'Cốt Cà Phê Phin Đậm Đặc',
        componentType: 'SEMI_FINISHED',
        quantity: 80,
        unit: 'ml',
        standardCost: 140,
        lossPercent: 2,
        consumptionPolicy: 'PER_TRANSACTION'
      },
      {
        componentId: 'CMP-CFMUOI-2',
        componentSku: 'NL-SUA-DAC',
        componentName: 'Sữa Đặc Có Đường Ngôi Sao Phương Nam',
        componentType: 'RAW_MATERIAL',
        quantity: 25,
        unit: 'ml',
        standardCost: 25,
        lossPercent: 0,
        consumptionPolicy: 'ACCUMULATED_THRESHOLD',
        consumptionThreshold: 500
      },
      {
        componentId: 'CMP-CFMUOI-3',
        componentSku: 'NL-KEM-BEO-MUOI',
        componentName: 'Kem Béo Thực Vật & Muối Hồng Himalaya Pha Chế',
        componentType: 'RAW_MATERIAL',
        quantity: 30,
        unit: 'ml',
        standardCost: 75, // 75đ/ml -> 2,250đ
        lossPercent: 2,
        consumptionPolicy: 'PER_TRANSACTION'
      }
    ],
    packaging: [
      {
        packagingSku: 'BB-LY-500',
        packagingName: 'Ly Nhựa PP 500ml In Logo',
        quantity: 1,
        unit: 'cái',
        standardCost: 650,
        consumptionPolicy: 'PER_TRANSACTION'
      },
      {
        packagingSku: 'BB-NAP-95',
        packagingName: 'Nắp Cầu Phi 95 Trong Suốt',
        quantity: 1,
        unit: 'cái',
        standardCost: 250,
        consumptionPolicy: 'PER_TRANSACTION'
      },
      {
        packagingSku: 'BB-ONG-HUT',
        packagingName: 'Ống Hút Giấy Kraft Phi 6 Bọc Màng',
        quantity: 1,
        unit: 'cái',
        standardCost: 120,
        consumptionPolicy: 'PER_TRANSACTION'
      }
    ]
  }
];

export const INITIAL_FNB_INVENTORY_LAYERS: InventoryLayer[] = [
  // 1. Hạt Cà Phê Robusta (NL-CF-ROB) in WH01
  {
    id: 'layer-nl-cf-1',
    layerId: 'LOT-CF-20260720-01',
    lotNumber: 'LOT-CF-20260720-01',
    layerType: 'RECEIPT',
    sku: 'NL-CF-ROB',
    productId: 'P-NL-CF-ROB',
    productCode: 'NL-CF-ROB',
    productName: 'Hạt Cà Phê Robusta Mộc Đắk Lắk (Rang Vừa)',
    unit: 'gam',
    branchId: 'BR01',
    branchName: 'Chi nhánh Trụ sở Hà Nội',
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    supplierId: 'sup-cf-daklak',
    supplierName: 'Hợp tác xã Cà phê Ea H’leo Đắk Lắk',
    receiptCode: 'PO-2026-CF01',
    receivedAt: '2026-07-20',
    createdAt: '2026-07-20 08:00',
    expiryDate: '2026-11-20',
    quantityReceived: 30000,
    quantityIssued: 12000,
    quantityRemaining: 18000,
    purchasePrice: 280, // 280đ/gam = 280,000đ/kg
    unitCost: 280,
    salePrice: 0,
    status: 'active',
    tenantId: 'TENANT-DEFAULT'
  },
  {
    id: 'layer-nl-cf-2',
    layerId: 'LOT-CF-20260810-02',
    lotNumber: 'LOT-CF-20260810-02',
    layerType: 'RECEIPT',
    sku: 'NL-CF-ROB',
    productId: 'P-NL-CF-ROB',
    productCode: 'NL-CF-ROB',
    productName: 'Hạt Cà Phê Robusta Mộc Đắk Lắk (Rang Vừa)',
    unit: 'gam',
    branchId: 'BR01',
    branchName: 'Chi nhánh Trụ sở Hà Nội',
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    supplierId: 'sup-cf-daklak',
    supplierName: 'Hợp tác xã Cà phê Ea H’leo Đắk Lắk',
    receiptCode: 'PO-2026-CF02',
    receivedAt: '2026-08-10',
    createdAt: '2026-08-10 09:30',
    expiryDate: '2026-12-10',
    quantityReceived: 50000,
    quantityIssued: 5000,
    quantityRemaining: 45000,
    purchasePrice: 300, // Giá nhập đợt 2 tăng lên 300đ/gam
    unitCost: 300,
    salePrice: 0,
    status: 'active',
    tenantId: 'TENANT-DEFAULT'
  },

  // 2. Sữa đặc (NL-SUA-DAC)
  {
    id: 'layer-nl-sd-1',
    layerId: 'LOT-SD-20260725-01',
    lotNumber: 'LOT-SD-20260725-01',
    layerType: 'RECEIPT',
    sku: 'NL-SUA-DAC',
    productId: 'P-NL-SUA-DAC',
    productCode: 'NL-SUA-DAC',
    productName: 'Sữa Đặc Có Đường Ngôi Sao Phương Nam',
    unit: 'ml',
    branchId: 'BR01',
    branchName: 'Chi nhánh Trụ sở Hà Nội',
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    supplierId: 'sup-vinamilk',
    supplierName: 'Công ty Cổ phần Sữa Việt Nam (Vinamilk)',
    receiptCode: 'PO-2026-VM01',
    receivedAt: '2026-07-25',
    createdAt: '2026-07-25 10:00',
    expiryDate: '2027-01-25',
    quantityReceived: 40000,
    quantityIssued: 8000,
    quantityRemaining: 32000,
    purchasePrice: 25,
    unitCost: 25,
    salePrice: 0,
    status: 'active',
    tenantId: 'TENANT-DEFAULT'
  },

  // 3. Sữa tươi thanh trùng (NL-SUA-TUOI-THANHTRUNG)
  {
    id: 'layer-nl-st-1',
    layerId: 'LOT-ST-20260815-01',
    lotNumber: 'LOT-ST-20260815-01',
    layerType: 'RECEIPT',
    sku: 'NL-SUA-TUOI-THANHTRUNG',
    productId: 'P-NL-SUA-TUOI',
    productCode: 'NL-SUA-TUOI-THANHTRUNG',
    productName: 'Sữa Tươi Thanh Trùng Nguyên Chất Dalatmilk',
    unit: 'ml',
    branchId: 'BR01',
    branchName: 'Chi nhánh Trụ sở Hà Nội',
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    supplierId: 'sup-dalatmilk',
    supplierName: 'Công ty Cổ phần Sữa Đà Lạt (Dalatmilk)',
    receiptCode: 'PO-2026-DM01',
    receivedAt: '2026-08-15',
    createdAt: '2026-08-15 08:30',
    expiryDate: '2026-09-15',
    quantityReceived: 60000,
    quantityIssued: 12000,
    quantityRemaining: 48000,
    purchasePrice: 38,
    unitCost: 38,
    salePrice: 0,
    status: 'active',
    tenantId: 'TENANT-DEFAULT'
  },

  // 4. Kem béo thực vật muối hồng (NL-KEM-BEO-MUOI)
  {
    id: 'layer-nl-kem-1',
    layerId: 'LOT-KEM-20260805-01',
    lotNumber: 'LOT-KEM-20260805-01',
    layerType: 'RECEIPT',
    sku: 'NL-KEM-BEO-MUOI',
    productId: 'P-NL-KEM-BEO',
    productCode: 'NL-KEM-BEO-MUOI',
    productName: 'Kem Béo Thực Vật & Muối Hồng Himalaya Pha Chế',
    unit: 'ml',
    branchId: 'BR01',
    branchName: 'Chi nhánh Trụ sở Hà Nội',
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    supplierId: 'sup-rich',
    supplierName: 'Rich Products Vietnam',
    receiptCode: 'PO-2026-RICH01',
    receivedAt: '2026-08-05',
    createdAt: '2026-08-05 11:00',
    expiryDate: '2026-11-05',
    quantityReceived: 20000,
    quantityIssued: 4500,
    quantityRemaining: 15500,
    purchasePrice: 75,
    unitCost: 75,
    salePrice: 0,
    status: 'active',
    tenantId: 'TENANT-DEFAULT'
  },

  // 5. Cà phê cốt đã sơ chế (BTP-CF-COT) in WH01
  {
    id: 'layer-btp-cot-1',
    layerId: 'LOT-PROD-COT-20260824-01',
    lotNumber: 'BATCH-20260824-COT01',
    layerType: 'PRODUCTION_IN',
    sku: 'BTP-CF-COT',
    productId: 'P-BTP-CF-COT',
    productCode: 'BTP-CF-COT',
    productName: 'Cốt Cà Phê Phin Đậm Đặc (400ml)',
    unit: 'ml',
    branchId: 'BR01',
    branchName: 'Chi nhánh Trụ sở Hà Nội',
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    supplierName: 'Nội bộ - Tự sản xuất',
    receiptCode: 'BATCH-20260824-COT01',
    receivedAt: '2026-08-24',
    createdAt: '2026-08-24 07:00',
    expiryDate: '2026-08-26',
    quantityReceived: 1200,
    quantityIssued: 400,
    quantityRemaining: 800,
    purchasePrice: 140, // 140đ/ml
    unitCost: 140,
    salePrice: 0,
    status: 'active',
    tenantId: 'TENANT-DEFAULT'
  },

  // 6. Packaging items
  {
    id: 'layer-bb-ly-1',
    layerId: 'LOT-LY-20260715-01',
    lotNumber: 'LOT-LY-20260715-01',
    layerType: 'RECEIPT',
    sku: 'BB-LY-500',
    productId: 'P-BB-LY-500',
    productCode: 'BB-LY-500',
    productName: 'Ly Nhựa PP 500ml In Logo',
    unit: 'cái',
    branchId: 'BR01',
    branchName: 'Chi nhánh Trụ sở Hà Nội',
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    supplierName: 'Bao bì Tân Tiến',
    receiptCode: 'PO-2026-BB01',
    receivedAt: '2026-07-15',
    createdAt: '2026-07-15 08:00',
    quantityReceived: 5000,
    quantityIssued: 1200,
    quantityRemaining: 3800,
    purchasePrice: 650,
    unitCost: 650,
    salePrice: 0,
    status: 'active',
    tenantId: 'TENANT-DEFAULT'
  },
  {
    id: 'layer-bb-nap-1',
    layerId: 'LOT-NAP-20260715-01',
    lotNumber: 'LOT-NAP-20260715-01',
    layerType: 'RECEIPT',
    sku: 'BB-NAP-95',
    productId: 'P-BB-NAP-95',
    productCode: 'BB-NAP-95',
    productName: 'Nắp Cầu Phi 95 Trong Suốt',
    unit: 'cái',
    branchId: 'BR01',
    branchName: 'Chi nhánh Trụ sở Hà Nội',
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    supplierName: 'Bao bì Tân Tiến',
    receiptCode: 'PO-2026-BB01',
    receivedAt: '2026-07-15',
    createdAt: '2026-07-15 08:00',
    quantityReceived: 5000,
    quantityIssued: 1200,
    quantityRemaining: 3800,
    purchasePrice: 250,
    unitCost: 250,
    salePrice: 0,
    status: 'active',
    tenantId: 'TENANT-DEFAULT'
  },
  {
    id: 'layer-bb-ong-1',
    layerId: 'LOT-ONG-20260715-01',
    lotNumber: 'LOT-ONG-20260715-01',
    layerType: 'RECEIPT',
    sku: 'BB-ONG-HUT',
    productId: 'P-BB-ONG-HUT',
    productCode: 'BB-ONG-HUT',
    productName: 'Ống Hút Giấy Kraft Phi 6 Bọc Màng',
    unit: 'cái',
    branchId: 'BR01',
    branchName: 'Chi nhánh Trụ sở Hà Nội',
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    supplierName: 'Bao bì Tân Tiến',
    receiptCode: 'PO-2026-BB01',
    receivedAt: '2026-07-15',
    createdAt: '2026-07-15 08:00',
    quantityReceived: 5000,
    quantityIssued: 1200,
    quantityRemaining: 3800,
    purchasePrice: 120,
    unitCost: 120,
    salePrice: 0,
    status: 'active',
    tenantId: 'TENANT-DEFAULT'
  }
];

export const INITIAL_PREPARATION_BATCHES: PreparationBatch[] = [
  {
    batchId: 'PB-20260824-001',
    code: 'BATCH-20260824-COT01',
    tenantId: 'TENANT-DEFAULT',
    branchId: 'BR01',
    branchName: 'Chi nhánh Trụ sở Hà Nội',
    warehouseId: 'WH01',
    warehouseName: 'Kho Tổng Hà Nội',
    recipeVersionId: 'RECV-BTP-COT-V1',
    recipeCode: 'REC-BTP-COT-01',
    outputSku: 'BTP-CF-COT',
    outputProductName: 'Cốt Cà Phê Phin Đậm Đặc (400ml)',
    plannedOutputQty: 1200,
    actualOutputQty: 1200,
    outputUnit: 'ml',
    inputMaterials: [
      {
        sku: 'NL-CF-ROB',
        productName: 'Hạt Cà Phê Robusta Mộc Đắk Lắk (Rang Vừa)',
        quantity: 600,
        unit: 'gam',
        unitCost: 280,
        totalCost: 168000
      }
    ],
    totalBatchCost: 168000,
    unitBatchCost: 140,
    producedAt: '2026-08-24T07:00:00Z',
    expiryDate: '2026-08-26T23:59:59Z',
    operator: 'Lê Hoàng Nam (Barista Master)',
    operatorId: 'u-nam',
    status: 'COMPLETED',
    notes: 'Mẻ sơ chế cà phê cốt phin sáng phục vụ quầy bar',
    createdAt: '2026-08-24T07:05:00Z'
  }
];
