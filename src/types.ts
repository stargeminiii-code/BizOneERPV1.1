export type ViewMode =
  | 'dashboard'
  | 'enterprise-planning'
  | 'pos'
  | 'orders'
  | 'sales-channels'
  | 'sales-reconciliation'
  | 'sales-returns'
  | 'sales-reports'
  | 'finance'
  | 'ccu'
  | 'beverages'
  | 'inventory'
  | 'variant-definitions'
  | 'stockcards'
  | 'crm'
  | 'marketing'
  | 'genseo'
  | 'purchasing'
  | 'suppliers'
  | 'cashflow'
  | 'pnl'
  | 'ai-assistant'
  | 'banking'
  | 'users-roles'
  | 'automation-notifications'
  | 'api-integrations'
  | 'settings'
  | 'warehouse-dashboard'
  | 'warehouse-issues'
  | 'warehouse-transfers'
  | 'warehouse-stocktakes'
  | 'warehouse-fifo-lots'
  | 'warehouse-reports'
  | 'saas-platform-admin';

export type OrderStatus = 'completed' | 'processing' | 'shipping' | 'cancelled' | 'refunded' | 'partially_refunded';

export type PaymentMethod = 'vietqr' | 'cash' | 'bank_transfer' | 'credit';

export interface Branch {
  id: string;
  code: string;
  name: string;
  address: string;
  phone: string;
  isMain?: boolean;
}

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  branchId: string;
  branchName: string;
  address: string;
  type: 'standard' | 'cold' | 'transit' | 'damaged';
  manager?: string;
}

export type LayerType =
  | 'RECEIPT'
  | 'OPENING_BALANCE'
  | 'TRANSFER_IN'
  | 'ADJUSTMENT_IN'
  | 'RETURN_IN'
  | 'PRODUCTION_IN'
  | 'STOCKTAKE_IN';

export type LayerStatus =
  | 'active'
  | 'exhausted'
  | 'expired'
  | 'locked'
  | 'quarantined'
  | 'blocked'
  | 'ACTIVE'
  | 'DEPLETED'
  | 'EXPIRED'
  | 'BLOCKED'
  | 'QUARANTINED';

export interface InventoryLayer {
  id: string; // Unique ID
  tenantId?: string;
  layerId: string; // e.g. LOT-20260801-001 or PN000001-01
  lotNumber?: string;
  layerType: LayerType;
  sku: string;
  productId: string;
  productCode: string;
  productName: string;
  variantName?: string;
  variantSku?: string;
  variant?: string;
  packSize?: string;
  unit: string;
  branchId: string;
  branchName?: string;
  warehouseId: string;
  warehouseName?: string;
  supplierId?: string;
  supplierName: string;
  receiptId?: string;
  receiptCode?: string; // e.g. PO-2026-089
  receivedAt: string; // YYYY-MM-DD or ISO (Used for FIFO ordering: earliest received date issued first)
  createdAt: string;
  expiryDate?: string;
  manufacturingDate?: string;
  quantityReceived: number;
  quantityIssued: number;
  quantityRemaining: number;
  purchasePrice: number; // Inward Cost
  unitCost?: number; // Alias for purchasePrice
  salePrice: number; // Standard Listed Sale Price
  status: LayerStatus;
  notes?: string;
  createdBy?: string;
  // Electronic Invoice (HĐĐT) synchronization fields
  eInvoiceNumber?: string; // Số hóa đơn điện tử e.g. 0002891
  eInvoiceSerial?: string; // Ký hiệu HĐ e.g. 1C26TMM, 1C26TAA
  eInvoiceLookupCode?: string; // Mã tra cứu HĐĐT / Mã CQT cấp
  eInvoiceDate?: string; // Ngày lập HĐĐT
  eInvoiceSupplierTaxCode?: string; // MST bên bán (NCC)
  eInvoiceVatRate?: number; // % Thuế GTGT (0, 5, 8, 10)
  eInvoiceVatAmount?: number; // Tiền thuế GTGT
  eInvoiceCostBeforeVat?: number; // Đơn giá chưa thuế
  eInvoiceCostWithVat?: number; // Đơn giá có thuế
  eInvoiceProvider?: string; // Tên nhà cung cấp giải pháp HĐĐT
  eInvoiceXml?: string; // Nội dung raw XML nếu có
  // Legacy compatibility fields
  lotId?: string;
  initialQuantity?: number;
  remainingQuantity?: number;
  costPrice?: number;
  warehouse?: string;
  poCode?: string;
  intakeDate?: string;
}

// Alias InventoryLot to InventoryLayer for backward compatibility
export type InventoryLot = InventoryLayer;

export interface FIFOAllocation {
  id: string;
  tenantId?: string;
  issueId: string; // Reference to Order ID, Issue Note ID, Transfer ID, or Adjustment ID
  issueCode: string;
  sku: string;
  productName: string;
  layerId: string;
  lotId?: string;
  quantity: number;
  purchasePrice: number;
  unitCost?: number;
  salePrice: number;
  costAmount: number; // quantity * purchasePrice
  revenueAmount: number; // quantity * salePrice
  allocatedAt: string;
  sourceReceiptCode?: string;
  supplierName?: string;
}

export interface OrderFifoDeduction {
  sku?: string;
  lotId: string;
  quantity: number;
  costPrice: number;
  purchasePrice?: number;
  salePrice?: number;
  costAmount?: number;
  supplierName?: string;
  receiptCode?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  totalPrice: number;
  fifoCost?: number;
  fifoDeductions?: OrderFifoDeduction[];
}

export interface Order {
  id: string;
  code: string; // e.g. ORD-2026-1024
  customerName: string;
  customerPhone?: string;
  customerAddress?: string;
  branchId?: string;
  branchName?: string;
  warehouseId?: string;
  warehouseName?: string;
  orderDate?: string;
  items: OrderItem[];
  subtotal?: number;
  discount: number;
  tax: number;
  totalAmount: number;
  finalAmount?: number;
  cogs?: number; // FIFO COGS (calculated from layer deductions)
  grossProfit?: number; // totalAmount - cogs
  expectedCogs?: number; // Standard / Recipe Expected Cost
  cogsVariance?: number; // cogs - expectedCogs
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  createdAt?: string;
  creator?: string;
  channel?: string;
  source?: string;
  note?: string;
  fifoDeductions?: OrderFifoDeduction[];
  snapshot?: OrderTransactionSnapshot;
}

export type StockIssueType =
  | 'Bán hàng'
  | 'Xuất chuyển kho'
  | 'Xuất nội bộ'
  | 'Hủy hàng'
  | 'Hàng lỗi'
  | 'Điều chỉnh'
  | 'Khác';

export interface StockIssueItem {
  sku: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  salePrice: number;
  fifoCost: number;
  fifoAllocations: FIFOAllocation[];
  note?: string;
}

export interface StockIssue {
  id: string;
  code: string; // e.g. PX-2026-001
  issueType: StockIssueType;
  receiverName: string;
  receiverPhone?: string;
  branchId: string;
  branchName: string;
  warehouseId: string;
  warehouseName: string;
  issueDate: string;
  status: 'draft' | 'approved' | 'completed' | 'cancelled';
  items: StockIssueItem[];
  totalQuantity: number;
  totalCostAmount: number; // FIFO COGS
  totalRevenueAmount: number;
  note?: string;
  createdBy: string;
  createdAt: string;
}

export interface StockTransferItem {
  sku: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  fifoCost?: number;
  fifoAllocations?: FIFOAllocation[];
  note?: string;
}

export interface StockTransfer {
  id: string;
  code: string; // e.g. CK-2026-001
  fromBranchId?: string;
  fromBranchName?: string;
  fromWarehouseId?: string;
  fromWarehouseName?: string;
  toBranchId?: string;
  toBranchName?: string;
  toWarehouseId?: string;
  toWarehouseName?: string;
  sourceBranchId?: string;
  sourceBranchName?: string;
  sourceWarehouseId?: string;
  sourceWarehouseName?: string;
  destBranchId?: string;
  destBranchName?: string;
  destWarehouseId?: string;
  destWarehouseName?: string;
  transferDate: string;
  status: 'draft' | 'in_transit' | 'completed' | 'cancelled';
  items: StockTransferItem[];
  totalQuantity: number;
  totalCostValue?: number;
  totalValue?: number;
  note?: string;
  createdBy: string;
  createdAt?: string;
}

export interface StocktakeItem {
  sku: string;
  productId: string;
  productCode?: string;
  productName: string;
  variant?: string;
  unit: string;
  systemQty?: number;
  actualQty?: number;
  diffQty?: number; // actualQty - systemQty
  systemQuantity?: number;
  actualQuantity?: number;
  diffQuantity?: number;
  unitCost: number;
  diffValue: number; // diffQty * unitCost
  differenceValue?: number;
  reason?: string;
  suggestedAction?: 'adjustment_increase' | 'adjustment_decrease' | 'none';
}

export interface Stocktake {
  id: string;
  code: string; // e.g. KK-2026-001
  branchId: string;
  branchName: string;
  warehouseId: string;
  warehouseName: string;
  stocktakeDate: string;
  status: 'in_progress' | 'completed' | 'cancelled';
  items: StocktakeItem[];
  totalSystemQty?: number;
  totalActualQty?: number;
  totalDiffQty?: number;
  totalSystemQuantity?: number;
  totalActualQuantity?: number;
  totalDiffQuantity?: number;
  totalDifferenceQuantity?: number;
  totalDiffValue?: number;
  totalDifferenceValue?: number;
  note?: string;
  createdBy: string;
  createdAt?: string;
}

export type CanonicalTransactionType =
  | 'RECEIPT'
  | 'ISSUE'
  | 'TRANSFER_IN'
  | 'TRANSFER_OUT'
  | 'ADJUSTMENT_IN'
  | 'ADJUSTMENT_OUT'
  | 'STOCKTAKE_IN'
  | 'STOCKTAKE_OUT'
  | 'PRODUCTION_IN'
  | 'PRODUCTION_OUT'
  | 'RETURN_IN'
  | 'RETURN_OUT'
  | 'REVERSAL';

export interface StockTransaction {
  id: string;
  tenantId?: string;
  date: string;
  type: 'Nhập kho' | 'Xuất bán' | 'Xuất chuyển kho' | 'Nhập chuyển kho' | 'Điều chỉnh tăng' | 'Điều chỉnh giảm' | 'Xuất hủy';
  canonicalType?: CanonicalTransactionType;
  docCode: string; // PO-..., ORD-..., PX-..., CK-..., KK-..., ADJ-...
  referenceType?: string;
  referenceId?: string;
  sku: string;
  productId?: string;
  productName: string;
  lotId?: string;
  branchId?: string;
  warehouseId?: string;
  qtyIn: number;
  qtyOut: number;
  quantity?: number;
  balance: number;
  unitCost: number;
  totalValue: number;
  totalCost?: number;
  unitId?: string;
  actor: string;
  createdBy?: string;
  approvedBy?: string;
  note?: string;
  reason?: string;
  reversalOfTransactionId?: string;
  status?: 'POSTED' | 'REVERSED' | 'DRAFT';
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action: 'created' | 'updated' | 'approved' | 'issued' | 'received' | 'transferred' | 'adjusted' | 'returned' | 'cancelled';
  referenceType: 'PO' | 'ORDER' | 'ISSUE' | 'TRANSFER' | 'STOCKTAKE' | 'ADJUSTMENT' | 'ORDER_RETURN' | 'REVERSAL' | 'SYSTEM';
  referenceId: string;
  description: string;
  oldValue?: string;
  newValue?: string;
}

// =========================================================================
// PHASE 2.2 — UNIFIED PRODUCT MASTER ENGINE TYPES & DATA MODELS
// =========================================================================

export type ProductStatus = 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';

export type ProductType =
  | 'RAW_MATERIAL'     // Nguyên liệu thô (Nông sản, hóa chất, thép thô)
  | 'FINISHED_GOOD'    // Thành phẩm (Đóng gói, chế biến, OCOP)
  | 'TRADING_GOOD'     // Hàng hóa thương mại (Bán lẻ)
  | 'FOOD'             // Thực phẩm chế biến / đồ ăn
  | 'BEVERAGE'         // Đồ uống / Sữa hạt / Nước giải khát / Cafe
  | 'FNB_INGREDIENT'   // Nguyên liệu F&B (Syrup, bột pha chế, sữa, trà)
  | 'PACKAGING'        // Bao bì / Ly nhựa / Hộp giấy / Tem nhãn
  | 'SEMI_FINISHED'    // Bán thành phẩm (Cà phê cốt, nước sốt nền, cốt trà ủ)
  | 'COMBO'            // Gói sản phẩm Combo / Set quà Tết / Menu set
  | 'SERVICE'          // Dịch vụ / Phí vận chuyển / Gia công
  | 'OTHER';           // Khác

export interface CustomAttribute {
  key: string;
  value: any;
  label?: string;
  type?: 'text' | 'number' | 'boolean' | 'date' | 'select' | 'array';
}

export interface ProductVariant {
  id?: string;
  variantId?: string;
  tenantId?: string;
  productId?: string;
  variantName: string; // e.g. "Combo 2 Hộp", "Combo 6 Hộp", "1/2 Thùng", "Thùng 24 Hộp"
  name?: string; // Alias for variantName
  variantSku?: string; // e.g. "VCCCM330-UHT-C02"
  sku: string; // SKU identifier
  packSize: number | string; // e.g. 2, 6, 10, 12, 24
  unit: string; // Hộp, Chai, Thùng...
  sellingPrice: number;
  costPrice?: number;
  stock?: number;
  minStock?: number;
  note?: string;
  barcode?: string;
  importQuantity?: number; // Số lượng sản phẩm nhập / tồn kho ban đầu
  attributes?: Record<string, any>;
  status?: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
}

export interface Variant {
  variantId: string;
  tenantId: string;
  productId: string;
  name: string;
  attributes: Record<string, any>;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt?: string;
  updatedAt?: string;
}

export interface SKU {
  skuId: string;
  tenantId: string;
  productId: string;
  variantId?: string;
  sku: string; // SKU unique per tenant
  unitId: string;
  baseUnitId?: string;
  conversionFactor?: number; // Default 1
  weight?: number; // In grams
  dimensions?: {
    length?: number;
    width?: number;
    height?: number;
    unit?: 'cm' | 'mm' | 'm';
  };
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt?: string;
  updatedAt?: string;
}

export type BarcodeType = 'EAN' | 'UPC' | 'CODE128' | 'INTERNAL';

export interface Barcode {
  barcodeId: string;
  tenantId: string;
  skuId: string;
  code: string; // Unique in tenant
  type: BarcodeType;
  createdAt?: string;
  updatedAt?: string;
}

export type UnitType = 'COUNT' | 'WEIGHT' | 'VOLUME' | 'LENGTH' | 'AREA' | 'OTHER';

export interface Unit {
  unitId: string;
  tenantId: string;
  name: string; // "Hộp", "Chai", "Thùng", "Kg", "Gram", "Lon", "Ly"
  symbol: string; // "hộp", "chai", "thùng", "kg", "g", "lon", "ly"
  type: UnitType;
  baseUnitId?: string;
  conversionFactor?: number; // Conversion factor relative to base unit (e.g. 1 thùng = 24 chai -> 24)
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  categoryId: string;
  tenantId: string;
  parentId?: string | null;
  name: string;
  code?: string;
  description?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface Brand {
  brandId: string;
  tenantId: string;
  name: string;
  code?: string;
  logo?: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export type PriceListType = 'RETAIL' | 'WHOLESALE' | 'B2B' | 'POS' | 'FNB' | 'MARKETPLACE';

export interface PriceList {
  priceListId: string;
  tenantId: string;
  name: string;
  code: string;
  type: PriceListType;
  currency: string;
  isDefault?: boolean;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export interface PriceListItem {
  id: string;
  tenantId: string;
  priceListId: string;
  skuId: string;
  price: number;
  minQuantity?: number;
  costPrice?: number;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt?: string;
  updatedAt?: string;
}

export type SalesChannel =
  | 'POS'
  | 'TAKE_AWAY'
  | 'WEBSITE'
  | 'FACEBOOK'
  | 'ZALO'
  | 'SHOPEE'
  | 'TIKTOK_SHOP'
  | 'LAZADA'
  | 'TIKI'
  | 'GRABFOOD'
  | 'SHOPEEFOOD'
  | 'BEFOOD'
  | 'AGENCY'
  | 'B2B'
  | 'WHOLESALE';

export interface SKUChannelMapping {
  id: string;
  tenantId: string;
  skuId: string;
  channel: SalesChannel;
  externalProductId?: string;
  externalSkuId?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SYNCED' | 'FAILED';
  createdAt?: string;
  updatedAt?: string;
}

export interface ComboComponent {
  comboId: string;
  tenantId: string;
  skuId: string; // SKU of the combo
  componentSkuId: string; // Component SKU
  quantity: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface Product {
  // Canonical Master fields
  productId: string; // e.g. P000001, P000002
  tenantId?: string; // Mandatory for tenant isolation
  name: string; // Product Name e.g. "Sữa dừa UHT Vietcoco 330ml"
  shortName?: string;
  description?: string;
  productType?: ProductType; // Canonical classification
  categoryId?: string;
  brandId?: string;
  status?: ProductStatus;
  image?: string;
  tags?: string[];
  trackLot?: boolean;
  trackExpiry?: boolean;
  shelfLifeDays?: number;
  attributes?: CustomAttribute[] | Record<string, any>;
  createdAt?: string;
  updatedAt?: string;

  // Backward compatibility fields for existing views & transaction modules:
  id: string;
  code: string; // Product Code e.g. VCCCM330-UHT, THEP-MK-06
  productCode?: string; // Alias for code
  sku: string; // Variant SKU e.g. VCCCM330-UHT-C02, THEP-MK-06-HP
  variantSku?: string; // Alias for sku
  productName?: string; // Alias for name
  variant?: string; // e.g. "Combo 2 Hộp"
  variantName?: string; // Alias for variant
  category: string; // e.g. "Đồ uống", "Thép & Kim loại"
  brand?: string; // e.g. "Vietcoco", "Hòa Phát", "Hoa Sen"
  unit: string; // kg, tấm, cuộn, cây, m, hộp, cái, thùng
  packSize?: number | string; // 1, 2, 6, 10, 12, 24...
  note?: string; // Ghi chú: e.g. "CM = Coconut Milk (Sữa dừa)"
  notes?: string;
  costPrice: number; // Next FIFO Layer cost price
  sellingPrice: number;
  stock?: number; // Sum of active layers' remainingQuantity
  minStock: number;
  maxStock?: number;
  location: string;
  branchId?: string;
  warehouseId?: string;
  isLowStock?: boolean;
  supplierName: string;
  supplierId?: string;
  imageUrl?: string;
  hasBom?: boolean;
  recipeVersionId?: string;
  variants?: ProductVariant[];
}

export interface ProductAggregate {
  product: Product;
  category?: Category;
  brand?: Brand;
  variants: Variant[];
  skus: SKU[];
  barcodes: Barcode[];
  units: Unit[];
  priceListItems: PriceListItem[];
  channelMappings: SKUChannelMapping[];
  comboComponents: ComboComponent[];
}

export type LoyaltyTier = 'standard' | 'silver' | 'gold' | 'diamond';

export type SpecialOccasionType =
  | 'birthday' // Sinh nhật cá nhân / Người đại diện
  | 'company_anniversary' // Ngày thành lập công ty / Khai trương
  | 'mid_autumn' // Tết Trung Thu (15/8 Âm lịch)
  | 'tet_holiday' // Tết Nguyên Đán
  | 'women_day_vn' // Ngày Phụ nữ Việt Nam 20/10
  | 'women_day_intl' // Quốc tế Phụ Nữ 8/3
  | 'business_day_vn' // Ngày Doanh nhân Việt Nam 13/10
  | 'new_year' // Tết Dương Lịch 1/1
  | 'christmas' // Giáng Sinh 25/12
  | 'first_order_anniversary' // Kỷ niệm ngày đầu hợp tác
  | 'custom'; // Dịp đặc biệt khác

export interface CustomerSpecialOccasion {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  customerGroup?: string;
  type: SpecialOccasionType;
  title: string; // VD: "Sinh nhật Giám đốc Nguyễn Văn A"
  date: string; // YYYY-MM-DD hoặc MM-DD
  isLunar?: boolean; // Lịch âm (VD: Tết Trung Thu 15/08 ÂL)
  lunarDateStr?: string; // e.g. "15/08 Âm lịch"
  reminderDaysBefore: number; // 1, 3, 7, 15 ngày
  giftBudget?: number; // Ngân sách quà tặng (VNĐ)
  giftName?: string; // Tên quà: Bánh trung thu, Hộp quà Tết cao cấp, Hoa tươi...
  giftStatus?: 'not_sent' | 'prepared' | 'delivering' | 'delivered';
  bonusPoints?: number; // Điểm thưởng tích lũy (VD: +500 điểm)
  discountPercent?: number; // % giảm giá đơn hàng sinh nhật (VD: 10%)
  customGreeting?: string; // Lời chúc mừng tự động
  assignedStaff?: string;
  status: 'upcoming' | 'today' | 'passed' | 'completed';
  actionTaken?: boolean; // Đã gửi lời chúc / quà tặng
  actionDate?: string;
  notes?: string;
}

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  customerName: string;
  points: number; // Điểm (+ hoặc -)
  type: 'purchase' | 'birthday_bonus' | 'holiday_bonus' | 'redeem_gift' | 'manual_adjust' | 'tier_upgrade';
  description: string;
  date: string;
  orderId?: string;
  createdBy?: string;
}

export interface Customer {
  id: string;
  code: string;
  name: string;
  phone: string;
  email?: string;
  address: string;
  city?: string;
  district?: string;
  country?: string; // 'Việt Nam' hoặc Tên Quốc Gia Nước Ngoài
  isInternational?: boolean; // Khách hàng quốc tế / xuất khẩu
  taxCode?: string;
  representative?: string;
  representativeTitle?: string;
  representativeBirthDate?: string; // Ngày sinh người đại diện (YYYY-MM-DD)
  representativeGender?: 'male' | 'female' | 'other';
  birthDate?: string; // Ngày sinh cá nhân (YYYY-MM-DD)
  foundingDate?: string; // Ngày thành lập công ty (YYYY-MM-DD)
  contactPerson?: string;
  debt: number; // Công nợ hiện tại
  creditLimit?: number; // Hạn mức công nợ tối đa
  paymentTermRatio?: '100_prepaid' | '70_30' | '50_50' | '30_70' | '100_postpaid' | 'custom'; // Tỷ lệ điều khoản công nợ
  prepaymentPercent?: number; // % Thanh toán trước (ví dụ 100%, 70%, 50%, 30%, 0%)
  creditPercent?: number; // % Cho phép công nợ (ví dụ 0%, 30%, 50%, 70%, 100%)
  creditTermDays?: number; // Thời hạn công nợ (số ngày: 15, 30, 45, 60...)
  creditTermsSummary?: string; // Tóm tắt điều khoản công nợ
  totalSpent: number;
  lastPurchaseDate: string;
  group: 'VIP' | 'Doanh nghiệp' | 'Đại lý' | 'Cá nhân';
  assignedStaff?: string; // Sales / Nhân sự phụ trách
  assignedStaffRole?: string; // Chức vụ / Phòng ban Sales
  assignedStaffPhone?: string; // SĐT Sales phụ trách
  branchId?: string;
  createdBy?: string;
  creator?: string;
  status?: 'active' | 'inactive';
  aiNotes?: string;
  notes?: string;
  createdAt?: string;
  // Loyalty & Special Occasions
  loyaltyPoints?: number; // Điểm tích lũy hiện có
  loyaltyTier?: LoyaltyTier; // Hạng thẻ: standard | silver | gold | diamond
  specialOccasions?: CustomerSpecialOccasion[];
  // Customer Journey Lifecycle & Sales Progress (PRE-SALES, DURING SALES, AFTER SALES)
  lifecyclePhase?: CustomerLifecyclePhase;
  journeyStage?: CustomerJourneyStage;
  journeyProgressPercent?: number; // 0 - 100%
  currentTaskTitle?: string;
  nextTaskTitle?: string;
  nextAction?: string;
  nextActionDeadline?: string;
  lastActivityNote?: string;
  lastActivityDate?: string;
  isAtRisk?: boolean; // Khách có nguy cơ mất
  potentialValue?: number; // Giá trị cơ hội / Tiềm năng
}

export type CrmTaskType =
  | 'call_upsell'
  | 'visit'
  | 'debt_reminder'
  | 'zalo_quote'
  | 'after_sales'
  | 'complaint_resolution'
  | 'contract_negotiation'
  | 'other';

export type CrmPipelineStage =
  | 'lead_approach' // Tiếp cận / Tìm kiếm cơ hội
  | 'care_evaluation' // Chăm sóc & Đánh giá nhu cầu
  | 'opportunity_quote' // Cơ hội & Lập báo giá
  | 'negotiation' // Đàm phán & Thương lượng
  | 'contract_signed' // Ký kết hợp đồng
  | 'order_delivery' // Thực hiện & Giao hàng
  | 'payment_collection' // Thu tiền & Quyết toán công nợ
  | 'post_sale_service' // Chăm sóc sau bán
  | 'upsell_cross'; // Tái ký / Bán thêm & Bán chéo

export type CrmTaskPriority = 'urgent' | 'high' | 'normal' | 'low';
export type CrmTaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'paused';

export interface CrmTask {
  id: string;
  customerId?: string;
  customerName: string;
  customerPhone?: string;
  customerCode?: string;
  opportunityId?: string;
  department?: string;
  field?: string; // Lĩnh vực (Kinh doanh, Kho bãi, Kế toán, SEO/Marketing, Nhân sự, Vận hành, R&D...)
  workField?: string; // Alias for field
  title: string;
  type: CrmTaskType;
  priority: CrmTaskPriority;
  dueDate: string;
  dueTime?: string;
  startDate?: string;
  progressPercent?: number; // 0 - 100%
  progress?: number; // Alias for progressPercent
  pipelineStage?: CrmPipelineStage;
  opportunityTitle?: string;
  contractId?: string;
  parentTaskId?: string;
  subtasks?: { id: string; title: string; completed: boolean }[];
  tags?: string[];
  recurrence?: 'none' | 'daily' | 'weekly' | 'monthly';
  assignedTo: string;
  assignedToEmail?: string;
  assignedToRole?: string;
  assignedBy?: string; // Người giao việc
  assignedById?: string;
  status: CrmTaskStatus;
  note?: string;
  notes?: string; // Alias for note
  resultNote?: string;
  completedAt?: string;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  lastCheckinDate?: string; // Thời gian check-in mới nhất (1-click 'Vẫn đang làm')
  lastCheckinNote?: string;
  relatedTaskId?: string;
  estimatedRevenue?: number;
  workCategoryId?: string;
  workCategoryName?: string;
  workGroupName?: string;
  relatedPlanId?: string;
  relatedKpiCode?: string;
  qualityScore?: number; // 0 - 100
  evidence?: string;
}

// =========================================================================
// MULTI-LEVEL MANAGEMENT HIERARCHY & BOTTOM-UP REPORTING ARCHITECTURE
// =========================================================================
export type OrgLevel = 'staff' | 'team_lead' | 'director' | 'deputy_ceo' | 'ceo_chairman';
export type OrgScope = 'individual' | 'department' | 'division' | 'company_wide';
export type ReportStatus = 'draft' | 'submitted' | 'reviewed' | 'returned' | 'approved' | 'locked';
export type ReportPeriodType = 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';

export interface ManagementKpiRecord {
  id: string;
  code: string; // 'REVENUE' | 'COLLECTION' | 'DEBT_RECOVERY' | 'NEW_CUSTOMERS' | 'PIPELINE_VALUE' | 'TASK_COMPLETION' | 'PROFIT'
  name: string;
  unit: string; // 'VNĐ' | 'Khách hàng' | '%' | 'Nhiệm vụ' | 'Hợp đồng'
  target: number;
  actual: number;
  achievementRate: number; // % hoàn thành = (actual / target) * 100
  gap: number; // Khoảng thiếu = target - actual
  status: 'achieved' | 'on_track' | 'at_risk' | 'failed';
  rootCause?: string; // Bắt buộc khi KPI không đạt (nguyên nhân cụ thể)
  proofData?: string; // Dữ liệu chứng minh (đơn hàng, công nợ, task...)
  correctiveAction?: string; // Biện pháp khắc phục
  recoveryAmount?: number; // Giá trị cần bù
  pic?: string; // Người chịu trách nhiệm khắc phục (PIC)
  deadline?: string; // Hạn chót khắc phục
}

export interface MultiLevelReport {
  id: string;
  title: string;
  level: OrgLevel;
  periodType: ReportPeriodType;
  periodLabel: string; // e.g. "Tháng 08/2026", "Tuần 33 (15/08 - 21/08)"
  scope: OrgScope;
  authorId: string;
  authorName: string;
  authorRole: string;
  department: string;
  division: string;
  status: ReportStatus;
  submittedAt?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  returnReason?: string;
  summaryMetrics: {
    revenue: number;
    collections: number;
    debt: number;
    completedTasks: number;
    openOpportunities: number;
    totalOrders: number;
  };
  kpis: ManagementKpiRecord[];
  childReportIds?: string[];
  notes?: string;
  isLocked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface ManagementAuditEntry {
  id: string;
  timestamp: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action:
    | 'SUBMIT_REPORT'
    | 'REVIEW_REPORT'
    | 'APPROVE_REPORT'
    | 'RETURN_REPORT'
    | 'LOCK_REPORT'
    | 'UPDATE_KPI'
    | 'CONFIG_DASHBOARD'
    | 'EXPORT_EXCEL'
    | 'IMPORT_EXCEL';
  targetType: 'REPORT' | 'KPI' | 'DASHBOARD' | 'DATA';
  targetId: string;
  details: string;
  beforeValue?: any;
  afterValue?: any;
}

export interface UserEmailNotificationConfig {
  enabled: boolean;
  overdueTasks: boolean; // Nhắc việc quá hạn
  upcomingDueTasks: boolean; // Nhắc việc sắp đến hạn (trước 3 ngày)
  unupdatedTasks: boolean; // Nhắc việc chưa cập nhật (> 3 ngày)
  dailyDigest: boolean; // Email tổng kết hàng ngày (7h sáng)
  restockAlerts?: boolean; // Cảnh báo tồn kho
  debtAlerts?: boolean; // Cảnh báo công nợ
}

export interface CustomerInteraction {
  id: string;
  customerId: string;
  customerName: string;
  type: 'call' | 'meeting' | 'zalo' | 'email' | 'note';
  title: string;
  content: string;
  resultOutcome?: string;
  createdAt: string;
  createdBy: string;
}

export type SupplierTaskType =
  | 'price_negotiation'
  | 'rfq_quote'
  | 'debt_reconciliation'
  | 'delivery_tracking'
  | 'quality_inspection'
  | 'contract_renewal'
  | 'other';

export interface SupplierTask {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCode?: string;
  supplierPhone?: string;
  title: string;
  type: SupplierTaskType;
  priority: 'urgent' | 'high' | 'normal' | 'low';
  dueDate: string;
  dueTime?: string;
  assignedTo: string;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  note?: string;
  resultNote?: string;
  completedAt?: string;
  createdAt: string;
  createdBy?: string;
}

export interface SupplierPaymentVoucher {
  id: string;
  code: string; // PC-NCC-2026-001
  supplierId: string;
  supplierName: string;
  supplierCode?: string;
  amount: number;
  paymentMethod: PaymentMethod;
  paymentDate: string;
  referencePoCode?: string;
  bankAccount?: string;
  note?: string;
  creator: string;
  status: 'completed' | 'cancelled';
}

export type SupplierType = 'company' | 'branch' | 'office' | 'household' | 'individual' | 'other';

export interface Supplier {
  id: string;
  code: string; // e.g. NCC000001
  name: string; // Tên hiển thị / Tên thương mại
  legalName?: string; // Tên doanh nghiệp pháp lý theo ĐKKD
  shortName?: string; // Tên giao dịch viết tắt
  taxCode?: string; // Mã số thuế (10 số hoặc 13 số nếu là chi nhánh)
  type?: SupplierType; // Loại đối tượng: Công ty, Chi nhánh, VPĐD, Hộ KD, Cá nhân, Khác
  parentSupplierId?: string; // Liên kết ID công ty mẹ (nếu là chi nhánh/VPĐD)
  parentTaxCode?: string; // MST công ty mẹ
  phone: string;
  email: string;
  address: string;
  city?: string;
  district?: string;
  representative?: string; // Người đại diện pháp luật
  contactPerson?: string; // Người liên hệ / Sale phụ trách
  contactTitle?: string; // Chức vụ người liên hệ
  contactPhone?: string;
  website?: string;
  zalo?: string;
  bankName?: string;
  bankAccount?: string;
  bankAccountName?: string; // Tên chủ tài khoản
  bankBranch?: string;
  branchId?: string; // Chi nhánh phụ trách trong ERP
  creditLimit?: number; // Hạn mức công nợ (VND)
  paymentTermDays?: number; // Thời hạn thanh toán (Số ngày)
  paymentTerms?: string; // Điều khoản thanh toán (COD, Net 30,...)
  defaultPriceList?: string; // Bảng giá áp dụng
  debt: number; // Tiền nợ NCC hiện tại
  totalPurchased?: number; // Tổng giá trị hàng đã mua lũy kế
  purchaseOrderCount?: number; // Tổng số phiếu nhập đã phát sinh
  lastPurchaseDate?: string; // Ngày nhập gần nhất
  suppliedProducts: string[];
  status?: 'active' | 'inactive';
  notes?: string;
  taxStatus?: string; // Trạng thái MST (Đang hoạt động...)
  taxAuthority?: string; // Cơ quan quản lý thuế
  establishedDate?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface PurchaseOrderItem {
  sku: string;
  productId?: string;
  productName: string;
  lotId: string;
  quantity: number;
  unit: string;
  price: number;
  sellingPrice?: number;
  vat?: number;
  discount?: number;
  totalAmount?: number;
  expiryDate?: string;
  manufacturingDate?: string;
  eInvoiceNumber?: string;
  eInvoiceSerial?: string;
  eInvoiceLookupCode?: string;
}

export interface PurchaseOrder {
  id: string;
  code: string; // PO-2026-089
  supplierId?: string;
  supplierName: string;
  supplierTaxCode?: string;
  branchId?: string;
  branchName?: string;
  warehouseId?: string;
  warehouse?: string;
  warehouseName?: string;
  orderDate?: string;
  deliveryDate?: string;
  expectedDate?: string;
  createdAt: string;
  createdBy?: string;
  totalAmount: number;
  paidAmount: number;
  debtAmount: number;
  overpaidAmount?: number;
  status: 'received' | 'pending' | 'draft' | 'cancelled';
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  items: PurchaseOrderItem[];
  note?: string;
  paymentMethod?: PaymentMethod;
  // Electronic Invoice attributes
  hasEInvoice?: boolean;
  eInvoiceNumber?: string;
  eInvoiceSerial?: string;
  eInvoiceLookupCode?: string;
  eInvoiceDate?: string;
  eInvoiceVatRate?: number;
  eInvoiceVatAmount?: number;
  eInvoiceTotalBeforeVat?: number;
  eInvoiceProvider?: string;
  eInvoiceStatus?: 'synced' | 'verified' | 'pending';
}

export interface EInvoiceItem {
  lineNumber: number;
  itemCode: string; // Mã hàng trên HĐĐT
  matchedSku?: string; // SKU được map trong hệ thống
  matchedProductId?: string; // ID sản phẩm trong hệ thống
  matchedProductName?: string; // Tên sản phẩm trong hệ thống
  itemName: string; // Tên hàng hóa theo HĐĐT
  unit: string; // Đơn vị tính (kg, hộp, tấn, m, cái,...)
  quantity: number; // Số lượng
  unitPrice: number; // Đơn giá chưa thuế
  totalBeforeVat: number; // Thành tiền chưa thuế
  vatRate: number; // Thuế suất (0%, 5%, 8%, 10%, -1 KHCT)
  vatAmount: number; // Tiền thuế GTGT
  totalWithVat: number; // Tổng tiền thanh toán
  suggestedLotId?: string; // Mã lô FIFO đề xuất (e.g. LOT-HD0002891-01)
  expiryDate?: string;
  manufacturingDate?: string;
}

export interface EInvoiceData {
  id: string;
  invoiceNumber: string; // Số hóa đơn e.g. 0002891
  invoiceSerial: string; // Ký hiệu hóa đơn e.g. 1C26TMM, 1C26TAA
  invoiceFormSymbol?: string; // Ký hiệu mẫu số e.g. 1/001
  invoiceDate: string; // Ngày lập HĐĐT (YYYY-MM-DD)
  lookupCode: string; // Mã tra cứu HĐĐT / Mã CQT cấp
  taxAuthorityCode?: string; // Mã của cơ quan thuế
  providerName: string; // VNPT, Viettel S-Invoice, MISA meInvoice, BKAV, EasyInvoice...
  
  // Seller (Supplier)
  sellerName: string; // Tên đơn vị bán
  sellerLegalName?: string;
  sellerTaxCode: string; // MST bên bán
  sellerAddress?: string;
  sellerPhone?: string;
  sellerBankAccount?: string;
  sellerBankName?: string;

  // Buyer (Company)
  buyerName: string; // Tên đơn vị mua
  buyerTaxCode?: string; // MST bên mua
  buyerAddress?: string;

  // Items & Financials
  items: EInvoiceItem[];
  totalBeforeVat: number; // Tổng tiền chưa thuế
  vatRate: number; // Thuế suất chủ đạo (8% hoặc 10%)
  totalVatAmount: number; // Tiền thuế GTGT
  totalAmountWithVat: number; // Tổng tiền thanh toán
  totalAmountInWords?: string; // Số tiền viết bằng chữ

  // Verification & Status
  isTaxAuthorityCertified?: boolean; // Cơ quan thuế đã cấp mã hợp lệ
  isDigitalSignatureValid?: boolean; // Chữ ký số NCC hợp lệ
  signedDate?: string; // Thời gian ký số
  signedBy?: string; // Người / Đơn vị ký số
  xmlContent?: string; // Dữ liệu XML gốc
  notes?: string;
}

export interface CashTransaction {
  id: string;
  code: string;
  type: 'thu' | 'chi';
  category: string;
  amount: number;
  description: string;
  paymentMethod: PaymentMethod;
  payerOrPayee: string;
  createdAt: string;
  createdBy?: string;
  branchId?: string;
  referenceCode?: string;
}

export interface DiagnosisInsight {
  id: string;
  type: 'warning' | 'opportunity' | 'info';
  category: string;
  title: string;
  description: string;
  actionLabel: string;
  actionType: 'create_po' | 'create_crm_task' | 'debt_reminder' | 'price_opt';
  targetItem?: string;
  targetCustomer?: string;
}

export interface DashboardMetrics {
  netRevenue: number;
  revenueGrowth: number;
  grossProfit: number;
  grossProfitGrowth: number;
  grossMargin: number;
  orderCount: number;
  orderCountGrowth: number;
  receivables: number;
  receivablesCustomerCount: number;
  inventoryValue: number;
  lowStockItemsCount: number;
}

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'ceo'
  | 'warehouse_manager'
  | 'warehouse_staff'
  | 'accountant'
  | 'sales'
  | 'purchasing'
  | 'marketing'
  | 'retail_staff'
  | 'online_staff'
  | 'demo'
  | 'custom';

export type PermissionAction =
  | 'view'
  | 'create'
  | 'edit'
  | 'delete'
  | 'approve'
  | 'export'
  | 'adjust_cost'
  | 'stocktake_approve';

export interface ModulePermission {
  moduleKey: string;
  moduleName: string;
  actions: PermissionAction[];
}

export type UserStatus = 'active' | 'inactive' | 'locked' | 'suspended' | 'pending';

export interface UserSession {
  id: string;
  userId: string;
  token?: string;
  tokenExpiry?: string;
  deviceName: string;
  deviceType: 'desktop' | 'mobile' | 'tablet';
  os: string;
  browser: string;
  ipAddress: string;
  location?: string;
  loginAt: string;
  lastActive: string;
  isCurrent: boolean;
}

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

export interface UserAccount {
  id: string;
  tenantId?: string;
  username?: string;
  email: string;
  name?: string;
  fullName?: string;
  phone?: string;
  passwordHash?: string;
  employeeCode?: string;
  tenant?: 'enterprise' | 'demo'; // Isolated Tenant separation (Enterprise vs Demo Sandbox)
  department?: string; // Ban Giám Đốc, Kho Vận, Kế Toán - Tài Chính, Kinh Doanh & CSKH, Thu Mua & Cung Ứng, CNTT & Hệ Thống
  position?: string;
  avatar?: string;
  role: UserRole;
  roleTitle?: string;
  status: UserStatus;
  branchId?: string;
  branchName?: string;
  assignedBranchIds?: string[];
  assignedWarehouseIds?: string[]; // e.g. ['ALL'] or ['WH01']
  directManagerId?: string; // ID người quản lý trực tiếp
  directManagerName?: string; // Tên người quản lý trực tiếp
  managementLevel?: OrgLevel; // 'staff' | 'team_lead' | 'director' | 'deputy_ceo' | 'ceo_chairman'
  dataScope?: OrgScope; // 'individual' | 'department' | 'division' | 'company_wide'
  division?: string; // Khối Kinh Doanh, Khối Vận Hành, Khối Tài Chính...
  forcePasswordChange?: boolean;
  twoFactorEnabled?: boolean;
  twoFactorType?: 'totp' | 'sms' | 'email';
  twoFactorSecret?: string;
  twoFactorRecoveryCodes?: string[];
  failedLoginAttempts?: number;
  isLocked?: boolean;
  telegramUsername?: string;
  telegramChatId?: string;
  telegramConnectedAt?: string;
  zaloPhone?: string;
  zaloUserId?: string;
  zaloConnectedAt?: string;
  emailNotificationSettings?: UserEmailNotificationConfig;
  permissions: {
    dashboard?: PermissionAction[];
    products?: PermissionAction[];
    purchasing?: PermissionAction[];
    issues?: PermissionAction[];
    transfers?: PermissionAction[];
    stocktakes?: PermissionAction[];
    fifo_lots?: PermissionAction[];
    customers?: PermissionAction[];
    suppliers?: PermissionAction[];
    debt_receivables?: PermissionAction[];
    debt_payables?: PermissionAction[];
    cashflow?: PermissionAction[];
    reports?: PermissionAction[];
    banking_vietqr?: PermissionAction[];
    user_management?: PermissionAction[];
    automation_engine?: PermissionAction[];
    api_integrations?: PermissionAction[];
    beverages?: PermissionAction[];
    marketing?: PermissionAction[];
    settings?: PermissionAction[];
  };
  sessions?: UserSession[];
  createdAt: string;
  lastActive?: string;
  notes?: string;
}

// =========================================================================
// BANK ACCOUNT MASTER DATA & VIETQR CONFIGURATION
// =========================================================================
export interface BankAccount {
  id: string;
  bankName: string;
  bankCode: string; // MB, VCB, TCB, BIDV, ACB, CTG, VPB, TPB, STB, HDB, VIB...
  accountHolder: string;
  accountNumber: string;
  branch: string;
  accountType: 'business' | 'personal' | 'escrow' | 'collection';
  status: 'active' | 'locked' | 'inactive'; // Không xóa vật lý khi đã phát sinh giao dịch, chuyển 'inactive'
  isDefault: boolean;
  qrTemplate: 'compact' | 'compact2' | 'qr_only' | 'print';
  defaultTransferMemo: string; // e.g. 'THANHTOAN [CODE]'
  createdAt: string;
  updatedAt?: string;
  notes?: string;
  totalTransactions?: number;
  totalReceived?: number;
  colorTheme?: string;
}

// =========================================================================
// API GATEWAY & INTEGRATION HUB MASTER DATA
// =========================================================================
export type IntegrationCategory =
  | 'email'
  | 'telegram'
  | 'zalo_oa'
  | 'vietqr'
  | 'banking'
  | 'ai'
  | 'storage'
  | 'ecommerce'
  | 'accounting';

export type IntegrationStatus = 'connected' | 'disconnected' | 'expiring' | 'error' | 'pending';

export interface IntegrationConnector {
  id: string;
  key: string; // 'email_smtp', 'telegram_bot', 'zalo_oa', 'vietqr_napas', 'mb_banking', 'gemini_ai', 'gcp_storage'
  name: string;
  category: IntegrationCategory;
  provider: string;
  description: string;
  icon: string;
  status: IntegrationStatus;
  environment: 'production' | 'staging' | 'development';
  accountIdentifier?: string; // Masked e.g. contact@freshdangkhoi.com, @BizOneBot, OA-8891238, 999988886666
  scopes: string[];
  allowedModules: string[];
  lastSyncAt?: string;
  lastError?: string;
  callCount24h: number;
  successRate: number; // e.g. 99.8
  latencyMs: number; // e.g. 120
  configFields: {
    key: string;
    label: string;
    type: 'text' | 'password' | 'select' | 'number';
    value?: string;
    masked?: boolean;
    required: boolean;
  }[];
  isSecretMasked: boolean;
}

export interface ApiClient {
  id: string;
  name: string; // 'Fresh Đăng Khôi Mobile App', 'E-Commerce Website', 'POS Long Biên'
  clientId: string;
  clientSecretMasked: string;
  scopes: string[];
  status: 'active' | 'revoked' | 'expired';
  createdAt: string;
  lastUsedAt?: string;
  expiresAt?: string;
  rateLimitPerMinute: number;
  totalCalls: number;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  endpoint: string;
  clientName: string;
  statusCode: number;
  responseTimeMs: number;
  ipAddress: string;
  status: 'success' | 'client_error' | 'server_error' | 'rate_limited';
  errorMessage?: string;
  idempotencyKey?: string;
}

export interface WebhookEndpoint {
  id: string;
  name: string;
  targetUrl: string;
  events: string[];
  secretMasked: string;
  status: 'active' | 'inactive' | 'failing';
  retryPolicy: 'immediate' | 'exponential_backoff';
  maxRetries: number;
  lastTriggeredAt?: string;
  successRate: number;
}

export interface SystemAuditEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: string;
  ipAddress: string;
  device: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'APPROVE' | 'CANCEL' | 'ADJUST_COST' | 'STOCK_ADJUST' | 'RESET_PWD' | 'PERMISSION_CHANGE' | 'LOGIN' | 'LOGOUT';
  module: string;
  recordId: string;
  recordCode?: string;
  description: string;
  isCritical: boolean;
  beforeData?: string;
  afterData?: string;
}

// =========================================================================
// WAREHOUSE LOCATION & BIN MAPPING (Kho -> Khu vực -> Kệ -> Tầng -> Ô)
// =========================================================================
export interface WarehouseLocation {
  id: string;
  warehouseId: string;
  warehouseCode: string;
  warehouseName: string;
  zone: string; // e.g. "Khu A - Hàng khô", "Khu B - Thực phẩm", "Khu C - Thép nặng"
  rack: string; // e.g. "Kệ A01", "Kệ A02", "Kệ B03", "Kệ C01"
  shelf: string; // e.g. "Tầng 1", "Tầng 2", "Tầng 3"
  bin: string; // e.g. "Ô A01-01", "Ô A01-02", "Ô 01"
  code: string; // Mã đầy đủ: e.g. "Kệ A01-T2-Ô02" hoặc "HCM-A-A01-02"
  capacity?: number;
  maxWeightKg?: number;
  status?: 'active' | 'full' | 'maintenance';
}

export interface SkuLocationAllocation {
  id: string;
  sku: string;
  productName: string;
  variant?: string;
  warehouseId: string;
  warehouseName: string;
  zone: string;
  rack: string;
  shelf: string;
  bin: string;
  locationCode: string; // e.g. "Kệ A01-T2-Ô01"
  lotId: string;
  quantity: number;
  unitCost: number;
  receivedAt: string;
}

// =========================================================================
// 7 NHÓM TUỔI CÔNG NỢ & NHẮC NỢ TỰ ĐỘNG
// =========================================================================
export type DebtAgingBucket =
  | 'current' // Chưa đến hạn
  | 'due_today' // Đến hạn hôm nay
  | 'overdue_1_7' // Quá hạn 1–7 ngày
  | 'overdue_8_30' // Quá hạn 8–30 ngày
  | 'overdue_31_90' // Quá hạn 31–90 ngày
  | 'overdue_91_180' // Quá hạn 91–180 ngày
  | 'overdue_over_180'; // Quá hạn trên 180 ngày

export type ReminderChannel = 'email' | 'zalo' | 'zalo_oa' | 'telegram';
export type ReminderStatus = 'pending' | 'sent' | 'failed' | 'confirmed' | 'unresponsive';

export interface DebtReminderLog {
  id: string;
  timestamp: string;
  targetType: 'customer' | 'supplier';
  targetId: string;
  targetCode: string;
  targetName: string;
  invoiceCode?: string;
  debtAmount: number;
  channel: ReminderChannel;
  recipientName: string;
  recipientContact: string; // email / phone / Zalo ID
  assignedStaff: string; // Sale / Người phụ trách
  messageContent: string;
  status: ReminderStatus;
  sentAt?: string;
  responseNote?: string;
  dueDate: string;
  overdueDays: number;
  reminderCount: number;
}

// =========================================================================
// 7 NHÓM TUỔI TỒN FIFO THEO KHUNG CHUẨN (STRICT BOUNDARIES)
// =========================================================================
export type InventoryAgingBucket =
  | 'under_7d' // < 7 ngày
  | '7_30d' // 7–30 ngày (≥ 7 và ≤ 30)
  | '30_90d' // 30–90 ngày (> 30 và ≤ 90)
  | '90_180d' // 90–180 ngày (> 90 và ≤ 180)
  | '180_360d' // 180–360 ngày (> 180 và ≤ 360)
  | '1_2y' // 1 năm – 2 năm (> 360 và ≤ 720)
  | 'over_2y'; // > 2 năm (> 720 ngày)

// =========================================================================
// CẢNH BÁO TỒN KHO & NHẮC BỔ SUNG HÀNG TỰ ĐỘNG (RESTOCK WARNING ENGINE)
// =========================================================================
export type RestockAlertLevel = 'normal' | 'warning' | 'urgent' | 'critical';

export interface RestockAlertItem {
  id: string;
  sku: string;
  productCode: string;
  productName: string;
  variant?: string;
  category?: string;
  brand?: string;
  unit: string;
  warehouseId: string;
  warehouseName: string;
  physicalStock: number;
  reservedStock: number; // Đã giữ / đã đặt
  availableStock: number; // Tồn khả dụng = physicalStock - reservedStock
  minStock: number; // Tồn tối thiểu
  warningThreshold: number; // Mức cảnh báo
  targetStock: number; // Mức tồn mục tiêu
  incomingStock: number; // Hàng đang về từ PO
  reorderQuantity: number; // max(0, targetStock - availableStock - incomingStock)
  alertLevel: RestockAlertLevel;
  preferredSupplierId?: string;
  preferredSupplierName: string;
  lastPurchasePrice: number;
  warehouseStaff: string;
  purchaserStaff: string;
  detectedAt: string;
  daysUnresolved: number;
  reminderCount: number;
  lastReminderSentAt?: string;
  status: 'alerting' | 'po_created' | 'partially_received' | 'resolved';
  resolvedAt?: string;
}

export interface RestockNotificationLog {
  id: string;
  alertId: string;
  sku: string;
  productName: string;
  warehouseName: string;
  recipientName: string;
  recipientRole: 'purchasing' | 'warehouse';
  channel: ReminderChannel;
  contact: string;
  sentAt: string;
  messageContent: string;
  status: 'sent' | 'pending' | 'failed';
}

// =========================================================================
// GLOBAL REALTIME DASHBOARD FILTERS
// =========================================================================
export type TimeFilterMode =
  | 'realtime'
  | 'today'
  | 'day'
  | 'week'
  | 'month'
  | 'quarter'
  | 'year'
  | 'custom';

export interface DashboardFilterState {
  timeMode?: TimeFilterMode;
  timeRange?: 'today' | '7days' | '30days' | 'custom' | string;
  selectedDate?: string; // YYYY-MM-DD for 'day'
  selectedMonth?: string; // YYYY-MM for 'month'
  selectedQuarter?: string; // 'Q1-2026' | 'Q2-2026' | 'Q3-2026' | 'Q4-2026'
  selectedYear?: string; // '2026'
  customStartDate?: string; // YYYY-MM-DD
  customEndDate?: string; // YYYY-MM-DD
  branchId?: string; // 'ALL' or specific branchId
  warehouseId: string; // 'ALL' or specific warehouseId
  categoryId?: string; // 'ALL' or category name
  brandId?: string; // 'ALL' or brand name
  sku: string; // 'ALL' or specific sku
  supplierId: string; // 'ALL' or supplierId
  customerId?: string; // 'ALL' or customerId
  locationZone?: string; // 'ALL' or zone/rack name
}

// =========================================================================
// HÓA ĐƠN ĐIỆN TỬ GTGT TRÍCH XUẤT TỪ PDF (AI EXTRACTION & ACCOUNTING)
// =========================================================================
export interface ExtractedInvoiceMeta {
  series: string | null;
  invoice_no: string | null;
  issue_date: string | null;
  tax_auth_code: string | null;
  lookup_code: string | null;
  lookup_url: string | null;
}

export interface ExtractedParty {
  name?: string | null;
  company_name?: string | null;
  tax_code: string | null;
  address: string | null;
}

export interface ExtractedLineItem {
  stt: number;
  description: string;
  unit: string | null;
  quantity: number | null;
  unit_price: number | null;
  amount_before_tax: number | null;
  vat_rate: number | string | null;
  vat_amount: number | null;
  amount_after_tax: number | null;
}

export interface VatRateBreakdown {
  before_tax: number | null;
  vat_amount: number | null;
}

export interface ExtractedTotals {
  amount_before_tax: number | null;
  vat_amount: number | null;
  amount_after_tax: number | null;
  breakdown_by_rate: {
    rate_0: VatRateBreakdown;
    rate_5: VatRateBreakdown;
    rate_8: VatRateBreakdown;
    rate_10: VatRateBreakdown;
    [key: string]: VatRateBreakdown;
  };
}

export interface ExtractedInvoiceSchema {
  invoice_meta: ExtractedInvoiceMeta;
  seller: ExtractedParty;
  buyer: ExtractedParty;
  line_items: ExtractedLineItem[];
  totals: ExtractedTotals;
}

export interface MappedInvoiceItem {
  stt: number;
  rawDescription: string;
  matchedSku: string | null;
  matchedProductId: string | null;
  matchedProductName: string | null;
  matchedUnit: string | null;
  matchConfidence: number; // 0 to 1
  matchType: 'exact' | 'fuzzy' | 'manual' | 'unmatched';
  needsManualReview: boolean;
  quantity: number;
  unitPrice: number;
  amountBeforeTax: number;
  vatRate: number; // 0, 5, 8, 10
  vatAmount: number;
  amountAfterTax: number;
  lineValidationStatus: 'valid' | 'warning' | 'error';
  validationMessage?: string;
}

export interface ValidationErrorDetail {
  code:
    | 'LINE_CALC_MISMATCH'
    | 'VAT_CALC_MISMATCH'
    | 'TOTAL_BEFORE_TAX_MISMATCH'
    | 'TOTAL_VAT_MISMATCH'
    | 'TOTAL_AFTER_TAX_MISMATCH'
    | 'RATE_BREAKDOWN_MISMATCH'
    | 'UNMATCHED_SKU';
  severity: 'error' | 'warning';
  message: string;
  lineNumber?: number;
  expectedValue?: number;
  actualValue?: number;
  diff?: number;
}

export interface RawExtractedInvoice {
  id: string;
  uploadedAt: string;
  uploadedBy: string;
  sourceFileName: string;
  sourceType: 'manual_upload' | 'tax_portal_sync' | 'webhook';
  invoiceDirection: 'inbound' | 'outbound'; // Inbound (Nhập kho/Chi phí) | Outbound (Xuất kho/Doanh thu)
  rawPdfUrl?: string;
  status:
    | 'pending_review'
    | 'validated'
    | 'discrepancy_warning'
    | 'posted'
    | 'rejected';
  extractedData: ExtractedInvoiceSchema;
  mappedItems: MappedInvoiceItem[];
  validationErrors: ValidationErrorDetail[];
  validationStatus: 'passed' | 'has_warnings' | 'has_errors';
  postedAt?: string;
  postedBy?: string;
  createdPoId?: string;
  createdOrderId?: string;
  createdJournalEntryId?: string;
  auditTrail: InvoiceAuditEntry[];
}

export interface InvoiceAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action:
    | 'uploaded'
    | 'extracted'
    | 'sku_mapped'
    | 'edited'
    | 'validated'
    | 'posted'
    | 'rejected';
  details: string;
}

export interface JournalEntryLine {
  id: string;
  accountCode: string; // 156, 1331, 331, 511, 3331, 131, 632...
  accountName: string;
  debitAmount: number; // Nợ
  creditAmount: number; // Có
  description: string;
  vatRate?: number;
  sku?: string;
}

export interface JournalEntry {
  id: string;
  entryCode: string; // PKT-20260821-001
  date: string;
  refDocType: 'EINVOICE_INBOUND' | 'EINVOICE_OUTBOUND' | 'PO' | 'SALES_ORDER';
  refDocCode: string;
  description: string;
  lines: JournalEntryLine[];
  totalDebit: number;
  totalCredit: number;
  isBalanced: boolean;
  status: 'draft' | 'posted' | 'cancelled';
  createdAt: string;
  createdBy: string;
}

// =========================================================================
// ENTERPRISE PLANNING ENGINE (Năm -> Quý -> Tháng -> Tuần -> Ngày -> Task)
// Phân rã: CÔNG TY -> KHỐI -> ĐƠN VỊ -> PHÒNG BAN -> TEAM -> NHÂN VIÊN
// =========================================================================

export type PlanType =
  | 'strategic'
  | 'business'
  | 'sales'
  | 'marketing'
  | 'customer_service'
  | 'production'
  | 'procurement'
  | 'supply_chain'
  | 'inventory'
  | 'logistics'
  | 'finance'
  | 'budget'
  | 'retail'
  | 'ecommerce'
  | 'rd'
  | 'project'
  | 'employee_work';

export type PlanPeriodGranularity = 'year' | 'quarter' | 'month' | 'week' | 'day';

export type PlanApprovalStatus =
  | 'draft'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'in_execution'
  | 'completed'
  | 'rejected'
  | 'adjusted';

export interface EnterprisePlan {
  id: string;
  planCode: string; // e.g. PLN-2026-KD-001
  planName: string;
  planType: PlanType;
  granularity: PlanPeriodGranularity;
  periodYear: number; // e.g. 2026
  periodQuarter?: number; // 1, 2, 3, 4
  periodMonth?: number; // 1 to 12
  periodWeek?: number; // 1 to 52
  periodDay?: string; // YYYY-MM-DD
  periodLabel: string; // e.g. "Kế hoạch Kinh doanh Năm 2026 - Q3"
  
  // Org Hierarchy
  companyId?: string;
  division: string; // Khối Kinh Doanh, Khối Cung Ứng, Khối Sản Xuất...
  unitName: string; // Đơn vị: Miền Bắc, Miền Nam, Nhà Máy 1...
  department: string; // Phòng Ban: Phòng Bán Hàng 1, Phòng Kế Toán...
  teamName?: string; // Nhóm: Team Telesales, Team Thị Trường...
  ownerName: string; // Người lập / Phụ trách chính
  ownerRole: string;
  picName: string; // PIC trực tiếp
  picEmail?: string;
  parentPlanId?: string; // Link kế hoạch cấp trên (Công ty -> Khối -> Phòng ban -> Nhân viên)
  
  // Objective & Work Category
  objective: string;
  workCategoryId?: string;
  workCategoryName?: string;
  workGroup?: string;
  
  // KPI & Financials
  kpiCode: string;
  kpiName: string;
  target: number;
  unit: string;
  weight: number; // Trọng số % (tổng 100%)
  formula?: string;
  budget: number; // Ngân sách cấp (VNĐ)
  actualCost?: number; // Chi phí thực tế đã giải ngân
  expectedResult: string;
  
  // Schedule
  startDate: string;
  endDate: string;
  
  // Execution & Quality metrics
  actual: number; // Thực hiện
  achievementRate: number; // % Hoàn thành = (actual / target) * 100
  qualityScore: number; // Điểm chất lượng (0 - 100)
  efficiencyRate?: number; // Hiệu suất sử dụng nguồn lực (0 - 100%)
  timelinessRate?: number; // Đúng hạn (0 - 100%)
  gap: number; // Khoảng cách còn thiếu = target - actual
  forecast: number; // Dự báo hoàn thành kỳ
  forecastStatus: 'on_track' | 'warning' | 'critical' | 'exceeded';
  
  // Root Cause & Actions if Gap > 0
  rootCauseCategory?: RootCauseCategory;
  rootCause?: string;
  evidence?: string;
  correctiveAction?: string;
  actionPic?: string;
  actionDeadline?: string;
  
  status: PlanApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  notes?: string;
  linkedTaskIds?: string[];
  createdAt: string;
  updatedAt?: string;
}

// =========================================================================
// KPI ENGINE (4 CHIỀU: QUANTITY, ACHIEVEMENT, QUALITY, EFFICIENCY + TIMELINESS, COST, OUTCOME)
// =========================================================================

export type KpiDivisionCategory =
  | 'sales'
  | 'marketing'
  | 'crm'
  | 'customer_service'
  | 'accounting'
  | 'finance'
  | 'procurement'
  | 'supply_chain'
  | 'warehouse'
  | 'logistics'
  | 'production'
  | 'rd'
  | 'qa_qc'
  | 'retail'
  | 'ecommerce'
  | 'agriculture'
  | 'hr'
  | 'it'
  | 'support';

export type KpiDataSource =
  | 'crm_customers'
  | 'crm_pipeline'
  | 'sales_orders'
  | 'order_items'
  | 'inventory_layers'
  | 'warehouse_issues'
  | 'procurement_pos'
  | 'cash_transactions'
  | 'tasks'
  | 'custom_formula';

export interface KpiDefinition {
  id: string;
  kpiCode: string; // e.g. 'KPI_REVENUE', 'KPI_NEW_CUSTOMERS', 'KPI_OVERDUE_DEBT', 'KPI_INVENTORY_TURNOVER'
  kpiName: string;
  description: string;
  category: KpiDivisionCategory;
  categoryLabel: string;
  dataSource: KpiDataSource;
  formula: string; // Công thức tính tự động từ ERP transactions
  unit: string;
  weight: number; // Trọng số mặc định
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  direction: 'higher_is_better' | 'lower_is_better';
  
  // Target & Thresholds
  defaultTarget: number;
  warningThreshold: number; // % đạt dưới mức này -> WARNING
  criticalThreshold: number; // % đạt dưới mức này -> CRITICAL
  
  // 4 Dimensions Config
  quantityCriteria: string;
  achievementCriteria: string;
  qualityCriteria: string;
  efficiencyCriteria: string;
  timelinessCriteria?: string;
  costCriteria?: string;
  outcomeCriteria?: string;
  
  // Responsible
  ownerRole: string;
  isSystem: boolean; // Hệ thống dựng sẵn vs Tự tạo
  status: 'active' | 'inactive';
}

// =========================================================================
// WORK CATEGORY & TASK HIERARCHY (Hạng mục -> Nhóm công việc -> Công việc -> Task -> Subtask)
// =========================================================================

export interface WorkSubtask {
  id: string;
  title: string;
  completed: boolean;
  completedAt?: string;
  completedBy?: string;
  qualityScore?: number;
}

export interface WorkCategoryHierarchy {
  id: string;
  code: string; // e.g. 'CAT_SALES_PROSPECT'
  name: string; // "TÌM KIẾM KHÁCH HÀNG"
  division: KpiDivisionCategory;
  description?: string;
  groups: WorkGroupItem[];
}

export interface WorkGroupItem {
  id: string;
  code: string; // e.g. 'GRP_TELESALES', 'GRP_FIELD_VISIT', 'GRP_EXPO', 'GRP_REFERRAL', 'GRP_DIGITAL'
  name: string; // "Telesales", "Đi thị trường", "Hội chợ / Sự kiện", "Referral", "Digital Lead"
  description?: string;
  taskTemplates: WorkTaskTemplateItem[];
}

export interface WorkTaskTemplateItem {
  id: string;
  title: string; // "Gọi khách hàng mới", "Follow-up khách hàng", "Ghé điểm bán", "Khảo sát đại lý"...
  defaultType: CrmTaskType;
  defaultPriority: CrmTaskPriority;
  suggestedKpiCode?: string;
  defaultDurationHours?: number;
  standardSubtasks?: string[];
}

// =========================================================================
// ROOT CAUSE ANALYSIS & ACTION MANAGEMENT (GIAO VIỆC / BÙ ĐẮP)
// =========================================================================

export type RootCauseCategory =
  | 'people'
  | 'process'
  | 'product'
  | 'price'
  | 'customer'
  | 'market'
  | 'marketing'
  | 'supply_chain'
  | 'production'
  | 'inventory'
  | 'logistics'
  | 'finance'
  | 'system'
  | 'other';

export interface KpiActionPlan {
  id: string;
  actionCode: string; // e.g. 'ACT-2026-089'
  planId?: string;
  kpiCode: string;
  kpiName: string;
  title: string; // Nội dung giao việc bù đắp
  rootCauseCategory: RootCauseCategory;
  rootCause: string;
  evidence: string;
  expectedResult: string; // e.g. "Gọi bổ sung 100 khách mới, chốt 10 đơn bù 50 triệu"
  recoveryTargetAmount?: number;
  picId: string;
  picName: string;
  picRole: string;
  supportingPerson?: string;
  deadline: string;
  priority: 'urgent' | 'high' | 'normal';
  progressPercent: number;
  status: 'assigned' | 'in_progress' | 'completed' | 'verified' | 'failed';
  resultNote?: string;
  assignedBy: string;
  assignedAt: string;
  completedAt?: string;
}

// =========================================================================
// CUSTOMER JOURNEY LIFECYCLE & SALES PROGRESS (PRE-SALES, DURING SALES, AFTER SALES)
// =========================================================================

export type CustomerLifecyclePhase = 'pre_sales' | 'during_sales' | 'after_sales';

export type CustomerJourneyStage =
  // PRE-SALES
  | 'lead_search' // Tìm kiếm & Thu thập thông tin
  | 'lead_qualification' // Qualification & Đánh giá nhu cầu
  | 'initial_consult' // Gọi điện / Hẹn gặp / Khảo sát
  // DURING SALES
  | 'demo_proposal' // Tư vấn sâu & Báo giá (Proposal/Quote)
  | 'negotiation_terms' // Đàm phán & Thương lượng điều khoản
  | 'contract_closing' // Xác nhận đơn & Ký hợp đồng / Đặt cọc
  // AFTER SALES
  | 'delivery_fulfillment' // Giao hàng & Nghiệm thu
  | 'cskh_care' // Chăm sóc sau bán & Đánh giá
  | 'retention_upsell'; // Mua lại, Cross-sell, Up-sell, Giới thiệu (Referral)

export interface CustomerProgressDetail {
  customerId: string;
  phase: CustomerLifecyclePhase;
  stage: CustomerJourneyStage;
  stageLabel: string;
  progressPercent: number; // 0% - 100%
  currentTaskTitle: string;
  currentTaskId?: string;
  nextTaskTitle: string;
  nextAction: string;
  picName: string;
  deadline: string;
  lastActivityDate: string;
  lastActivityNote: string;
  atRisk: boolean; // Nguy cơ mất khách (VD quá hạn chăm sóc, khiếu nại)
  potentialValue: number; // Giá trị tiềm năng / Doanh số kỳ vọng
}

export interface StageTaskAutomationConfig {
  stage: CustomerJourneyStage;
  phase: CustomerLifecyclePhase;
  autoTaskTitle: string;
  taskType: CrmTaskType;
  priority: CrmTaskPriority;
  dueDaysFromTransition: number;
  standardChecklist: string[];
}

// =========================================================================
// PERFORMANCE SCORECARD (Daily, Weekly, Monthly, Quarterly, Yearly)
// =========================================================================

export interface PerformanceScorecard {
  userId: string;
  userName: string;
  userRole: string;
  department: string;
  period: string; // "Tháng 08/2026"
  periodType: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  
  // 7 Pillars of Performance
  kpiScore: number; // 0 - 100 điểm KPI tổng hợp
  taskCompletionRate: number; // % Hoàn thành task
  taskQualityScore: number; // Điểm chất lượng trung bình các task (0 - 100)
  deadlineComplianceRate: number; // % Đúng hạn
  revenueGenerated: number; // Doanh thu đóng góp thực tế
  profitContribution?: number; // Lợi nhuận gộp đóng góp
  customerQualityScore: number; // Điểm đánh giá từ khách hàng / CSKH
  efficiencyScore: number; // Điểm hiệu suất vận hành (0 - 100)
  
  totalAssignedTasks: number;
  completedTasks: number;
  overdueTasks: number;
  openTasks: number;
  totalPlansOwned: number;
  achievedPlans: number;
  ranking: number; // Hạng trong phòng ban/toàn công ty
  grade: 'A_EXCELLENT' | 'B_GOOD' | 'C_AVERAGE' | 'D_NEEDS_IMPROVEMENT';
}

// =========================================================================
// ALERT ENGINE & FORECASTING MODEL
// =========================================================================

export type SystemAlertSeverity = 'info' | 'warning' | 'critical';

export interface EnterpriseSystemAlert {
  id: string;
  type:
    | 'kpi_below_target'
    | 'forecast_gap'
    | 'task_overdue'
    | 'customer_overdue'
    | 'contract_overdue'
    | 'collection_overdue'
    | 'inventory_low'
    | 'inventory_high'
    | 'production_delay'
    | 'delivery_delay'
    | 'customer_complaint'
    | 'sla_breach';
  title: string;
  description: string;
  severity: SystemAlertSeverity;
  module: string;
  metricGap?: string;
  relatedEntityId?: string;
  relatedEntityName?: string;
  picName: string;
  detectedAt: string;
  suggestedAction: string;
  isResolved: boolean;
}

export interface EnterpriseForecastItem {
  dimension: string; // 'Revenue', 'Gross Profit', 'New Customers', 'Production Units', 'Collections'
  unit: string;
  target: number;
  actualYtd: number; // Lũy kế thực tế
  pipelineWeight: number; // Giá trị từ phễu / cơ hội khả thi
  runRateEstimate: number; // Dự phóng theo tốc độ bình quân
  forecastTotal: number; // Dự báo kết thúc kỳ = actualYtd + pipelineWeight * conversionRate
  achievementForecastRate: number; // % Dự báo hoàn thành = (forecastTotal / target) * 100
  gap: number; // Khoảng cách dự kiến = target - forecastTotal
  status: 'on_track' | 'warning' | 'critical' | 'exceeded';
  mitigationAction?: string;
}

// =========================================================================
// GEN-SEO & KEYWORD PLANNING TYPES
// =========================================================================

export type KeywordNodeType = 'pillar' | 'cluster' | 'article' | 'variant';
export type KeywordIntent = 'informational' | 'transactional' | 'commercial' | 'navigational';
export type ArticleStage = 'research' | 'outline' | 'drafting' | 'review' | 'published';
export type ContentProductionStatus = 'not_started' | 'processing' | 'pending_review' | 'completed';

export interface KeywordNode {
  id: string;
  label: string;
  type: KeywordNodeType;
  parentId?: string;
  pillarId?: string;
  pillarName?: string;
  clusterName?: string;
  searchVolume: number;
  difficulty: number; // 0 - 100
  cpc: number; // VNĐ
  intent: KeywordIntent;
  dateCreated: string;
  daysAgo: number;
  lastUpdated: string;
  status: 'planned' | 'in_progress' | 'published' | 'archived' | ContentProductionStatus;
  aggregate_status?: ContentProductionStatus;
  channel?: string; // e.g. Website / Blog, Shopee, Facebook Fanpage, TikTok Shop...
  suggestedArticleTitle?: string;
  articleId?: string;
  contentTitle?: string;
  contentDraft?: string;
  currentStep?: string;
  progressPercent?: number;
  startedAt?: string;
  publishedUrl?: string;
  publishedAt?: string;
  ranking?: number;
  tags?: string[];
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
}

export interface KeywordEdge {
  id: string;
  source: string;
  target: string;
  relationType: 'pillar_to_cluster' | 'cluster_to_article' | 'article_to_variant' | 'internal_link';
}

export interface GenSeoArticle {
  id: string;
  title: string;
  slug: string;
  keywordId: string;
  keywordLabel: string;
  pillarName: string;
  clusterName: string;
  author: string;
  stage: ArticleStage;
  progressPercent: number; // 0 - 100
  wordCount: number;
  targetWordCount: number;
  seoScore: number; // 0 - 100
  readabilityScore: number; // 0 - 100
  focusKeywords: string[];
  secondaryKeywords: string[];
  internalLinksCount: number;
  externalLinksCount: number;
  contentDraft?: string;
  outlineSections?: string[];
  createdAt: string;
  updatedAt: string;
  reviewedBy?: string;
  publishedUrl?: string;
  notes?: string;
}

export interface InternalLinkSuggestion {
  sourceArticleId: string;
  sourceTitle: string;
  targetArticleId: string;
  targetTitle: string;
  anchorText: string;
  relevanceScore: number;
  contextSnippet: string;
}

export interface MascotConfig {
  enabled: boolean;
  minimized: boolean;
  autoAvoidHover: boolean;
  position: 'bottom-right' | 'bottom-left' | 'top-right';
  theme: 'copilot' | 'owl' | 'robot';
}

// =========================================================================
// CUSTOM ROLE & GRANULAR PERMISSIONS
// =========================================================================

export interface CustomRoleDefinition {
  id: string;
  name: string;
  code: string;
  description: string;
  badgeColor: string;
  isSystem: boolean;
  createdAt: string;
  permissions: Record<string, PermissionAction[]>;
}

// =========================================================================
// BIZONE COMMERCIAL SAAS PLATFORM (MODULES 1, 2, 3)
// =========================================================================

export type SaaSPlanCode = 'TRIAL' | 'TRIAL_7_DAYS' | 'MONTHLY' | 'QUARTERLY' | 'SIX_MONTHS' | 'ANNUAL' | 'BIENNIAL';

export interface SaaSPlan {
  id: string;
  code: SaaSPlanCode;
  name: string;
  price: number;
  currency: 'VND';
  durationDays: number;
  maxUsers: number; // Always 3
  features: 'FULL';
  badge?: string; // 'Miễn phí 7 ngày', 'Phổ biến', 'Tiết kiệm'
  status: 'active' | 'archived';
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export type RegistrationStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED' | 'REQUEST_INFO';

export interface CustomerRegistration {
  id: string;
  registrationCode: string;
  companyName: string;
  taxCode: string;
  representative: string;
  email: string;
  phone: string;
  address: string;
  adminName: string;
  adminUsername?: string;
  adminEmail: string;
  adminPhone: string;
  adminPassword?: string;
  planId: string;
  planCode: SaaSPlanCode;
  planName: string;
  status: RegistrationStatus;
  notes?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  tenantId?: string;
  paymentStatus?: PaymentStatus;
  paymentOrderId?: string;
  paymentMethod?: PaymentMethodType;
  paidAmount?: number;
}

export type TenantStatus = 'ACTIVE' | 'PENDING' | 'EXPIRING_SOON' | 'EXPIRED' | 'SUSPENDED' | 'CANCELLED';

export interface TenantAccount {
  id: string; // e.g. tenant_enterprise_01, tenant_steel_vietnam, demo
  code: string; // e.g. TNT-001
  name: string;
  companyName: string;
  taxCode: string;
  representative: string;
  email: string;
  phone: string;
  address: string;
  adminUserId: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  status: TenantStatus;
  maxUsers: number; // Always 3
  activeUsersCount: number;
  planId: string;
  planCode: SaaSPlanCode;
  planName: string;
  subscriptionId: string;
  licenseId: string;
  startDate: string;
  expiryDate: string;
  healthStatus: 'GOOD' | 'ATTENTION' | 'RISK'; // 🟢 🟡 🔴
  lastActive?: string;
  currentVersion?: string; // e.g. 'v1.2.0'
  targetVersion?: string; // e.g. 'v1.3.0'
  releaseChannel?: ReleaseChannel; // 'stable' | 'beta'
  updateStatus?: TenantUpdateStatus;
  scheduledUpdateAt?: string;
  lastUpdatedAt?: string;
  backupPointId?: string;
  createdAt: string;
  updatedAt: string;
}

// =========================================================================
// VERSION MANAGEMENT & TENANT UPDATE CONTROL (SECTIONS 20-48)
// =========================================================================

export type ReleaseChannel = 'stable' | 'beta';

export type ReleaseStatus = 'DRAFT' | 'TESTING' | 'RELEASED' | 'DEPRECATED' | 'DISABLED';

export type SecuritySeverity = 'NONE' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface PlatformRelease {
  id: string;
  version: string; // e.g. 'v1.0.0', 'v1.1.0', 'v1.2.0', 'v1.3.0', 'v2.0.0-beta.1'
  releaseDate: string;
  summary: string;
  releaseNotes: string[];
  channel: ReleaseChannel;
  status: ReleaseStatus;
  mandatory: boolean;
  securitySeverity: SecuritySeverity;
  minSupportedVersion: string;
  migrationRequired: boolean;
  migrationId?: string;
  migrationDescription?: string;
  featureFlags?: Record<string, boolean>;
  createdBy: string;
  createdAt: string;
  publishedAt?: string;
}

export type TenantUpdateStatus =
  | 'UP_TO_DATE'
  | 'UPDATE_AVAILABLE'
  | 'SCHEDULED'
  | 'UPDATING'
  | 'UPDATED'
  | 'UPDATE_FAILED'
  | 'UPDATE_BLOCKED';

export interface DataIntegrityMetrics {
  customersCount: number;
  productsCount: number;
  skuCount: number;
  ordersCount: number;
  inventoryCount: number;
  fifoLayersCount: number;
  financeTxCount: number;
  usersCount: number;
  auditLogsCount: number;
  passed: boolean;
}

export interface TenantUpdateHistoryItem {
  id: string;
  tenantId: string;
  tenantName: string;
  fromVersion: string;
  toVersion: string;
  channel: ReleaseChannel;
  triggeredBy: string;
  triggeredAt: string;
  completedAt?: string;
  status: 'SUCCESS' | 'FAILED' | 'ROLLED_BACK';
  backupId?: string;
  migrationApplied?: string;
  dataIntegrityBefore?: DataIntegrityMetrics;
  dataIntegrityAfter?: DataIntegrityMetrics;
  errorMessage?: string;
  notes?: string;
}

export type SaaSAuditAction =
  | 'ACTIVATE'
  | 'RENEW'
  | 'SUSPEND'
  | 'REACTIVATE'
  | 'CANCEL'
  | 'CHANGE_PLAN'
  | 'CHANGE_PRICE'
  | 'APPROVE_CUSTOMER'
  | 'REJECT_CUSTOMER'
  | 'CREATE_TENANT'
  | 'ISSUE_LICENSE'
  | 'PUBLISH_RELEASE'
  | 'DISABLE_RELEASE'
  | 'UPDATE_TENANT_VERSION'
  | 'SCHEDULE_TENANT_UPDATE'
  | 'FORCE_TENANT_UPDATE'
  | 'ROLLBACK_RELEASE';

export type SubscriptionStatus =
  | 'PENDING'
  | 'ACTIVE'
  | 'EXPIRING_SOON'
  | 'GRACE_PERIOD'
  | 'EXPIRED'
  | 'SUSPENDED'
  | 'CANCELLED';

export interface SaaSSubscription {
  id: string;
  tenantId: string;
  tenantName: string;
  planId: string;
  planCode: SaaSPlanCode;
  planName: string;
  price: number;
  durationDays: number;
  maxUsers: number;
  startAt: string;
  endAt: string;
  status: SubscriptionStatus;
  paymentStatus: 'PAID' | 'UNPAID' | 'PENDING_CONFIRMATION';
  autoRenew: boolean;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export type LicenseStatus = 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'REVOKED';

export interface SaaSLicense {
  id: string;
  licenseKey: string;
  tenantId: string;
  tenantName: string;
  subscriptionId: string;
  planId: string;
  planCode: SaaSPlanCode;
  planName: string;
  status: LicenseStatus;
  maxUsers: number;
  features: 'FULL';
  issuedAt: string;
  activatedAt: string;
  expiresAt: string;
  suspendedAt?: string;
  fingerprint?: string;
}

export interface SaaSBillingTransaction {
  id: string;
  transactionCode: string;
  customerId: string;
  customerName: string;
  tenantId: string;
  tenantName: string;
  planName: string;
  amount: number;
  currency: 'VND';
  paymentDate: string;
  paymentMethod: 'vietqr' | 'bank_transfer' | 'manual_admin' | 'credit';
  status: 'SUCCESS' | 'PENDING' | 'FAILED' | 'REFUNDED';
  subscriptionId: string;
  licenseId: string;
  referenceCode?: string;
  notes?: string;
  createdAt: string;
}

export interface SaaSContract {
  id: string;
  contractNumber: string;
  customerId: string;
  customerName: string;
  tenantId: string;
  tenantName: string;
  planName: string;
  value: number;
  currency: 'VND';
  startDate: string;
  endDate: string;
  salesPic: string;
  status: 'ACTIVE' | 'EXPIRED' | 'DRAFT' | 'TERMINATED';
  fileName?: string;
  fileUrl?: string;
  signedDate?: string;
  notes?: string;
  createdAt: string;
}

export type TicketPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'NEW' | 'PROCESSING' | 'WAITING_CUSTOMER' | 'RESOLVED' | 'CLOSED';

export interface SaaSSupportTicket {
  id: string;
  ticketCode: string;
  customerId: string;
  customerName: string;
  tenantId: string;
  tenantName: string;
  title: string;
  description: string;
  priority: TicketPriority;
  pic: string;
  status: TicketStatus;
  slaHours: number;
  category: 'SETUP' | 'BILLING' | 'FEATURE' | 'INCIDENT' | 'TRAINING';
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface SaaSAuditLog {
  id: string;
  actorId: string;
  actorName: string;
  actorRole: string;
  action: SaaSAuditAction;
  targetTenantId?: string;
  targetTenantName?: string;
  recordId?: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface PlatformMetrics {
  totalCustomers: number;
  activeTenants: number;
  pendingApproval: number;
  expiringSoon: number;
  expiredTenants: number;
  suspendedTenants: number;
  mrr: number;
  arr: number;
  totalRevenue: number;
  newCustomersThisMonth: number;
  churnRatePercent: number;
  healthDistribution: {
    good: number;
    attention: number;
    risk: number;
  };
}

// =========================================================================
// PAYMENT GATEWAY HUB & COMMERCIAL BILLING (SECTIONS XXV - XLIV)
// =========================================================================

export type PaymentStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'PAID'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentProviderId = 'napas' | 'momo' | 'vnpay' | 'stripe' | 'zalopay' | 'manual_bank';

export type PaymentMethodType =
  | 'vietqr'
  | 'card'
  | 'ewallet'
  | 'apple_pay'
  | 'google_pay'
  | 'bank_transfer'
  | 'international';

export interface PaymentProviderConfig {
  id: PaymentProviderId;
  name: string;
  code: string;
  environment: 'sandbox' | 'production';
  merchantId: string;
  apiEndpoint: string;
  status: 'active' | 'inactive' | 'testing';
  supportedMethods: PaymentMethodType[];
  supportedCurrencies: string[];
  pciCompliantHosted: boolean;
  webhookSecretSet: boolean;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodConfig {
  id: string;
  type: PaymentMethodType;
  providerId: PaymentProviderId;
  name: string;
  tagline: string;
  iconName: string;
  badge?: string;
  isAvailable: boolean;
  supportedCurrencies: string[];
  deviceRequirement?: 'all' | 'apple_devices' | 'google_devices';
  displayOrder: number;
}

export interface PaymentOrder {
  id: string;
  orderCode: string; // e.g. BZ-PAY-202608-8832
  registrationId?: string;
  tenantId?: string;
  tenantName?: string;
  planId: string;
  planCode: SaaSPlanCode;
  planName: string;
  durationDays: number;
  maxUsers: number;
  amount: number;
  currency: 'VND' | 'USD' | 'EUR' | string;
  settlementAmount?: number;
  settlementCurrency?: string;
  status: PaymentStatus;
  providerId?: PaymentProviderId;
  paymentMethod?: PaymentMethodType;
  transactionId?: string;
  qrCodeData?: string;
  bankAccountInfo?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    bin: string;
  };
  transferContent?: string;
  expiresAt: string;
  paidAt?: string;
  cancelledAt?: string;
  refundedAt?: string;
  refundAmount?: number;
  failureReason?: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  taxCode?: string;
  idempotencyKey: string;
  attemptsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentTransaction {
  id: string;
  paymentOrderId: string;
  orderCode: string;
  providerId: PaymentProviderId;
  providerTxId: string;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  maskedCard?: string;
  bankRef?: string;
  signatureVerified: boolean;
  gatewayResponseCode?: string;
  gatewayResponseMessage?: string;
  timestamp: string;
}

export interface PaymentWebhookLog {
  id: string;
  providerId: PaymentProviderId;
  eventType: string;
  orderCode: string;
  transactionId: string;
  amount: number;
  currency: string;
  signature: string;
  isSignatureValid: boolean;
  isDuplicate: boolean;
  idempotencyKey: string;
  status: 'PROCESSED' | 'IGNORED' | 'ERROR';
  rawPayload: Record<string, any>;
  receivedAt: string;
  processedAt?: string;
  errorMessage?: string;
}

export interface PaymentReconciliationItem {
  id: string;
  paymentOrderId: string;
  orderCode: string;
  providerId: PaymentProviderId;
  providerTxId: string;
  orderAmount: number;
  receivedAmount: number;
  currency: string;
  paymentMethod: PaymentMethodType;
  status: 'MATCHED' | 'MISMATCH' | 'PENDING' | 'FAILED' | 'REFUNDED';
  webhookVerified: boolean;
  paidAt?: string;
  notes?: string;
  createdAt: string;
}

// =========================================================================
// TRANSACTION ENGINE & DAILY TARGET & AD OPPORTUNITY TYPES
// =========================================================================

export type TransactionSource =
  | 'ERP'
  | 'SHOPEE'
  | 'TIKTOK_SHOP'
  | 'LAZADA'
  | 'WEBSITE'
  | 'POS'
  | 'API'
  | 'MANUAL';

export type TransactionStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'REFUNDED';

export interface TransactionRecord {
  id: string;
  tenantId: string;
  userId?: string;
  type: 'SALE';
  source: TransactionSource;
  orderId?: string;
  amount?: number;
  currency?: string;
  status: TransactionStatus;
  createdAt: string;
  confirmedAt?: string;
  idempotencyKey: string;
  metadata?: Record<string, any>;
}

export interface DailyTransactionConfig {
  enabled: boolean;
  min: number;
  max: number;
  maxPerDay?: number;
  adaptiveAdOpportunity: boolean;
  updatedAt: string;
  updatedBy?: string;
}

export interface DailyTargetSnapshot {
  tenantId: string;
  date: string; // YYYY-MM-DD
  target: number;
  createdAt: string;
}

export type AdOpportunityLevel = 'HIGH' | 'NORMAL' | 'STOP';

export interface AdOpportunitySignal {
  level: AdOpportunityLevel;
  enabled: boolean;
  reason?: string;
  currentTransactions: number;
  dailyTarget: number;
  maxPerDay: number;
}

export interface TransactionDashboardResponse {
  success: boolean;
  date: string;
  target: {
    min: number;
    max: number;
    today: number;
  };
  actual: number;
  remaining: number;
  progress: number;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'EXCEEDED' | 'DISABLED';
  adOpportunity: {
    level: AdOpportunityLevel;
    enabled: boolean;
    reason?: string;
  };
  metrics: {
    sales: number;
    revenue: number;
    confirmed: number;
    cancelled: number;
    refunded: number;
  };
  recentTransactions?: TransactionRecord[];
}

export interface TransactionAuditEntry {
  id: string;
  tenantId: string;
  actorId: string;
  actorName?: string;
  action:
    | 'TRANSACTION_CREATED'
    | 'TRANSACTION_CONFIRMED'
    | 'TRANSACTION_CANCELLED'
    | 'TRANSACTION_REFUNDED'
    | 'TARGET_CREATED'
    | 'TARGET_UPDATED'
    | 'CONFIG_UPDATED'
    | 'IDEMPOTENCY_DUPLICATE_HIT';
  entityType: string;
  entityId: string;
  before?: any;
  after?: any;
  timestamp: string;
  details?: string;
}

// =========================================================================
// EXECUTIVE BUSINESS DASHBOARD (PHASE 1) VIEW MODEL TYPES
// =========================================================================

export interface ExecutivePrimaryKpi {
  id: 'revenue' | 'orders' | 'gross_profit' | 'cash';
  title: string;
  actual: number;
  previous: number;
  changePercent: number;
  trend: 'up' | 'down' | 'neutral';
  formattedActual: string;
  formattedPrevious: string;
  subtitle?: string;
}

export interface RevenueOrdersChartPoint {
  label: string;
  fullDate?: string;
  revenue: number;
  orders: number;
  aov: number;
}

export type BizOneSalesChannel =
  | 'POS'
  | 'TAKE_AWAY'
  | 'WEBSITE'
  | 'FACEBOOK'
  | 'ZALO'
  | 'SHOPEE'
  | 'TIKTOK_SHOP'
  | 'LAZADA'
  | 'TIKI'
  | 'GRABFOOD'
  | 'SHOPEEFOOD'
  | 'BEFOOD'
  | 'AGENCY'
  | 'B2B';

export interface ChannelPerformanceMetric {
  channelId: string;
  name: string;
  category: 'offline_pos' | 'direct_online' | 'marketplace' | 'food_delivery' | 'b2b_wholesale';
  revenue: number;
  orders: number;
  contributionPercent: number;
  avgOrderValue: number;
}

export interface ProductPerformanceMetric {
  productId: string;
  sku: string;
  name: string;
  category: string;
  quantitySold: number;
  revenue: number;
  grossProfit: number;
  unit: string;
}

export interface InventoryAgingBucketData {
  bucketKey: InventoryAgingBucket;
  label: string;
  daysRange: string;
  lotCount: number;
  skuCount: number;
  quantity: number;
  fifoValue: number;
  percentage: number;
  lots: InventoryLayer[];
}

export interface InventorySnapshotData {
  totalQuantity: number;
  totalValue: number;
  fifoValue: number;
  lowStockCount: number;
  agedStockCount: number;
  agingBuckets: InventoryAgingBucketData[];
}

export interface FinanceSnapshotData {
  grossRevenue: number;
  discount: number;
  refund: number;
  netRevenue: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  receivable: number;
  payable: number;
  isDataSufficient: boolean;
}

export interface MarketplaceFinanceItem {
  channelId: string;
  channelName: string;
  grossSales: number;
  marketplaceCost: number;
  netSettlement: number;
  cogs: number;
  realizedGrossProfit: number;
  status: 'ACTUAL' | 'ESTIMATED' | 'RECONCILED' | 'NOT_AVAILABLE';
  reconciliationNote?: string;
  estimatedPlatformFeeRate?: number;
}

export interface CrmSnapshotData {
  newCustomersCount: number;
  returningCustomersCount: number;
  returningOrdersPercent: number;
  returningOrdersCount: number;
  aov: number;
  topCustomer?: {
    id: string;
    name: string;
    phone?: string;
    totalSpent: number;
    orderCount: number;
  };
}

export interface ExecutiveAlertItem {
  id: string;
  type:
    | 'low_stock'
    | 'aged_stock'
    | 'expiring_soon'
    | 'overdue_debt'
    | 'unprocessed_order'
    | 'failed_order'
    | 'discrepancy'
    | 'margin_drop';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  countOrValue: string;
  targetModule: string;
  targetFilter?: string;
}

export interface DashboardViewModel {
  period: 'today' | '7days' | 'month' | 'quarter' | 'year' | 'custom';
  periodLabel: string;
  kpis: {
    revenue: ExecutivePrimaryKpi;
    orders: ExecutivePrimaryKpi;
    grossProfit: ExecutivePrimaryKpi;
    cash: ExecutivePrimaryKpi;
  };
  revenueChart: {
    granularity: 'day' | 'week' | 'month';
    data: RevenueOrdersChartPoint[];
    totalRevenue: number;
    totalOrders: number;
    averageOrderValue: number;
  };
  channels: ChannelPerformanceMetric[];
  products: {
    topSelling: ProductPerformanceMetric[];
    topRevenue: ProductPerformanceMetric[];
    topProfit: ProductPerformanceMetric[];
  };
  inventory: InventorySnapshotData;
  finance: FinanceSnapshotData;
  marketplaceFinance: MarketplaceFinanceItem[];
  crm: CrmSnapshotData;
  alerts: ExecutiveAlertItem[];
}

// =========================================================================
// PHASE 2.1 — USER CORE BACKEND DOMAIN MODELS & SECURITY ARCHITECTURE
// =========================================================================

export type TenantBusinessType = 'HOUSEHOLD_BUSINESS' | 'COMPANY' | 'INDIVIDUAL';
export type TenantCoreStatus = 'active' | 'suspended' | 'pending' | 'inactive';

export interface TenantCore {
  tenantId: string;
  businessName: string;
  businessType: TenantBusinessType;
  taxCode?: string;
  phone?: string;
  email?: string;
  address?: string;
  status: TenantCoreStatus;
  createdAt: string;
  updatedAt: string;
}

export interface BranchCore {
  branchId: string;
  tenantId: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  managerId?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
  isMain?: boolean;
}

export type WarehouseCoreType =
  | 'MAIN_WAREHOUSE'
  | 'STORE_WAREHOUSE'
  | 'RAW_MATERIAL'
  | 'FINISHED_GOODS'
  | 'FNB'
  | 'OTHER';

export interface WarehouseCore {
  warehouseId: string;
  tenantId: string;
  branchId: string;
  name: string;
  code: string;
  type: WarehouseCoreType;
  managerId?: string;
  status: 'active' | 'inactive';
  createdAt: string;
  updatedAt: string;
}

export type UserCoreStatus = 'active' | 'inactive' | 'locked';

export interface UserCore {
  userId: string;
  tenantId: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  branchIds: string[];
  warehouseIds: string[];
  status: UserCoreStatus;
  createdAt: string;
  updatedAt: string;
  passwordHash?: string;
}

export type StandardRoleCode =
  | 'OWNER'
  | 'CEO'
  | 'DIRECTOR'
  | 'MANAGER'
  | 'STAFF'
  | 'WAREHOUSE_STAFF'
  | 'SALES'
  | 'CSKH'
  | 'ACCOUNTING';

export type DataScopeType =
  | 'COMPANY_WIDE'
  | 'DIVISION'
  | 'BRANCH'
  | 'WAREHOUSE'
  | 'INDIVIDUAL';

export interface RoleCore {
  roleId: string;
  tenantId?: string; // Undefined for global system roles, string for tenant-custom roles
  code: StandardRoleCode | string;
  name: string;
  description: string;
  isSystemRole: boolean;
  permissions: string[]; // Format: 'module.action' e.g. 'order.create', 'finance.view'
  dataScope: DataScopeType;
  createdAt: string;
  updatedAt: string;
}

export interface PermissionDefinition {
  key: string; // e.g. 'order.create'
  module: string; // e.g. 'order'
  action: string; // e.g. 'create'
  name: string;
  description: string;
}

export interface SecurityUserContext {
  userId: string;
  tenantId: string;
  name: string;
  email: string;
  roleId: string;
  roleCode: StandardRoleCode | string;
  dataScope: DataScopeType;
  permissions: Set<string>;
  branchIds: string[];
  warehouseIds: string[];
}

export interface DataScopeFilterCriteria {
  tenantId: string;
  branchId?: string | string[];
  warehouseId?: string | string[];
  createdBy?: string;
  assignedTo?: string;
}

export interface AuditLogCore {
  auditId: string;
  tenantId: string;
  userId: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  timestamp: string;
  ip?: string;
  metadata?: Record<string, any>;
}

// =========================================================================
// PHASE 2.4 — TEMPORAL BUSINESS ENGINE + F&B OPERATION TYPES
// =========================================================================

export type VersionStatus = 'ACTIVE' | 'SUPERSEDED' | 'DRAFT' | 'ARCHIVED';

export interface EffectiveDatedEntity {
  versionId: string;
  version: number;
  effectiveFrom: string; // ISO string or YYYY-MM-DD
  effectiveTo: string | null; // ISO string or YYYY-MM-DD or null if currently active
  status: VersionStatus;
  createdAt: string;
  createdBy: string;
  supersedesVersionId?: string;
  tenantId: string;
}

export type TemporalResolutionStatus = 'SUCCESS' | 'NOT_AVAILABLE' | 'INTEGRITY_VIOLATION';

export interface TemporalResolutionResult<T> {
  status: TemporalResolutionStatus;
  version: T | null;
  resolvedAt: string;
  errorMessage?: string;
}

// 1. Selling Price Versioning
export interface SellingPriceVersion extends EffectiveDatedEntity {
  productId: string;
  sku: string;
  productName?: string;
  priceListId?: string;
  channel?: SalesChannel | 'ALL';
  price: number;
  currency: string;
  minQuantity?: number;
  note?: string;
}

// 2. Purchase Cost Record (Historical Cost Inward)
export interface PurchaseCostRecord {
  recordId: string;
  tenantId: string;
  sku: string;
  productId: string;
  productName: string;
  supplierId: string;
  supplierName: string;
  purchaseDocId: string;
  purchaseDocCode: string;
  purchaseDate: string;
  receivedDate: string;
  unitCost: number;
  quantity: number;
  unit: string;
  currency: string;
  vatRate?: number;
  vatAmount?: number;
  landedCost?: number;
  fifoLayerId?: string;
  notes?: string;
  createdAt: string;
}

// 3. Recipe / BOM Component
export type ConsumptionPolicy = 'PER_TRANSACTION' | 'ACCUMULATED_THRESHOLD';

export interface RecipeComponent {
  componentId: string;
  componentSku: string;
  componentProductId?: string;
  componentName: string;
  componentType: 'RAW_MATERIAL' | 'FNB_INGREDIENT' | 'SEMI_FINISHED' | 'PACKAGING' | 'OTHER';
  quantity: number; // e.g. 80ml, 40g
  unit: string;
  lossPercent?: number; // % hao hụt (e.g. 5%)
  standardCost?: number; // Đơn giá vốn tiêu chuẩn dự kiến
  subtotalCost?: number; // quantity * standardCost * (1 + loss/100)
  consumptionPolicy?: ConsumptionPolicy;
  consumptionThreshold?: number; // Ngưỡng tích lũy (e.g. 500g)
  notes?: string;
}

export interface RecipePackaging {
  packagingSku: string;
  packagingName: string;
  quantity: number;
  unit: string;
  standardCost?: number;
  consumptionPolicy?: ConsumptionPolicy;
}

// 4. Recipe Versioning (Effective-Dated)
export interface RecipeVersion extends EffectiveDatedEntity {
  recipeId: string;
  productSku: string;
  productId: string;
  productName: string;
  recipeCode: string;
  name: string;
  description?: string;
  yieldQuantity: number; // e.g. 1 (1 ly) or 400 (400ml cốt)
  yieldUnit: string;
  components: RecipeComponent[];
  packaging?: RecipePackaging[];
  preparationSteps?: string[];
  estimatedStandardCost: number;
  isReferencedByTransactions?: boolean;
}

// 5. Preparation / Semi-Finished Batch
export interface PreparationBatchInput {
  sku: string;
  productName: string;
  quantity: number;
  unit: string;
  unitCost?: number;
  totalCost?: number;
  fifoAllocations?: FIFOAllocation[];
}

export interface PreparationBatch {
  batchId: string;
  code: string; // e.g. BATCH-20260825-001
  tenantId: string;
  branchId: string;
  branchName?: string;
  warehouseId: string;
  warehouseName?: string;
  recipeVersionId: string;
  recipeCode?: string;
  outputSku: string;
  outputProductName: string;
  plannedOutputQty: number;
  actualOutputQty: number;
  outputUnit: string;
  inputMaterials: PreparationBatchInput[];
  totalBatchCost: number;
  unitBatchCost: number;
  producedAt: string;
  expiryDate?: string;
  operator: string;
  operatorId?: string;
  status: 'PLANNED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';
  createdLayerId?: string;
  notes?: string;
  createdAt: string;
}

// 6. Consumption Ledger & Accumulation
export interface ConsumptionEvent {
  eventId: string;
  tenantId: string;
  orderId: string;
  orderCode: string;
  orderItemId: string;
  productSku: string;
  productName: string;
  recipeVersionId?: string;
  componentSku: string;
  componentName: string;
  quantity: number;
  unit: string;
  branchId: string;
  warehouseId: string;
  occurredAt: string;
  consumptionPolicy: ConsumptionPolicy;
  status: 'RECORDED' | 'PROCESSED' | 'ACCUMULATED' | 'ISSUED';
  stockTransactionId?: string;
  idempotencyKey?: string;
  createdAt: string;
}

export interface AccumulatedConsumptionState {
  id: string;
  tenantId: string;
  warehouseId: string;
  sku: string;
  unit: string;
  thresholdQuantity: number;
  accumulatedQuantity: number; // Tổng tích lũy hiện thời
  pendingQuantity: number; // Phần dư sau khi đã trigger ngưỡng (remainder)
  totalIssuedQuantity: number; // Tổng số lượng đã tạo phiếu xuất kho thực tế
  lastIssuedAt?: string;
  updatedAt: string;
}

// 7. Transaction Snapshot (Immutable Historical Record)
export interface OrderItemSnapshot {
  itemIndex: number;
  productId: string;
  sku: string;
  productName: string;
  productType?: ProductType;
  categoryName?: string;
  unit: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  discountAmount?: number;
  priceVersionId?: string;
  recipeVersionId?: string;
  recipeSnapshot?: {
    recipeId: string;
    version: number;
    recipeCode: string;
    components: RecipeComponent[];
  };
  fifoAllocations: FIFOAllocation[];
  actualFifoCost: number;
  expectedStandardCost: number;
  costVariance: number; // actualFifoCost - expectedStandardCost
  grossProfit: number; // totalPrice - actualFifoCost
  grossMarginPercent: number; // (grossProfit / totalPrice) * 100
}

export interface OrderTransactionSnapshot {
  orderId: string;
  orderCode: string;
  snapshotTimestamp: string;
  tenantId: string;
  branchId: string;
  warehouseId: string;
  totalRevenue: number;
  totalActualCogs: number;
  totalStandardCogs: number;
  cogsVariance: number;
  grossProfit: number;
  grossMarginPercent: number;
  items: OrderItemSnapshot[];
  isFinalized: boolean;
}

// 8. Sales Return & Refund
export interface SalesRefundItem {
  sku: string;
  productId: string;
  productName: string;
  unit: string;
  quantity: number;
  refundUnitPrice: number;
  totalRefund: number;
  restockToInventory: boolean;
  warehouseId?: string;
  condition?: 'good' | 'damaged';
  reason?: string;
}

export interface SalesReturn {
  id: string;
  returnCode: string; // e.g. TH-2026-001
  orderId: string;
  orderCode: string;
  tenantId: string;
  branchId?: string;
  branchName?: string;
  warehouseId?: string;
  warehouseName?: string;
  customerName: string;
  customerPhone?: string;
  refundAmount: number;
  paymentMethod: PaymentMethod;
  refundStatus: 'completed' | 'processing' | 'rejected';
  reason: string;
  items: SalesRefundItem[];
  createdAt: string;
  creator: string;
  notes?: string;
  restockedLayerIds?: string[];
}

// 9. Workspace / Tab Navigation
export interface WorkspaceTab {
  id: string;
  title: string;
  viewMode: ViewMode;
  closable: boolean;
  badge?: string | number;
  filterContext?: {
    channel?: string;
    agingBucket?: string;
    productSku?: string;
    category?: string;
    startDate?: string;
    endDate?: string;
    branchId?: string;
    warehouseId?: string;
    customerName?: string;
    debtOnly?: boolean;
    searchTerm?: string;
  };
}




