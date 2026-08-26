import { PermissionDefinition } from '../../types';

/**
 * CANONICAL PERMISSION REGISTRY (SINGLE SOURCE OF TRUTH)
 * Standard Format: 'module.action'
 */
export const PERMISSION_REGISTRY: Record<string, PermissionDefinition> = {
  // Dashboard Module
  'dashboard.view': {
    key: 'dashboard.view',
    module: 'dashboard',
    action: 'view',
    name: 'Xem Báo cáo Tổng quan',
    description: 'Quyền xem bảng điều khiển kinh doanh, chỉ số KPI và biểu đồ tăng trưởng'
  },

  // Product Master Module
  'product.view': {
    key: 'product.view',
    module: 'product',
    action: 'view',
    name: 'Xem Sản phẩm',
    description: 'Xem danh mục hàng hóa, bảng giá niêm yết và thông tin quy cách'
  },
  'product.create': {
    key: 'product.create',
    module: 'product',
    action: 'create',
    name: 'Thêm mới Sản phẩm',
    description: 'Thêm sản phẩm mới và thiết lập giá bán niêm yết'
  },
  'product.update': {
    key: 'product.update',
    module: 'product',
    action: 'update',
    name: 'Cập nhật Sản phẩm',
    description: 'Chỉnh sửa thông tin, giá bán và định mức tồn an toàn của sản phẩm'
  },
  'product.archive': {
    key: 'product.archive',
    module: 'product',
    action: 'archive',
    name: 'Lưu trữ Sản phẩm',
    description: 'Lưu trữ hoặc ngừng kinh doanh sản phẩm khỏi hệ thống (không xóa vĩnh viễn dữ liệu)'
  },
  'product.delete': {
    key: 'product.delete',
    module: 'product',
    action: 'delete',
    name: 'Xóa Sản phẩm',
    description: 'Xóa hoặc ngừng kinh doanh sản phẩm khỏi hệ thống'
  },

  // SKU Management
  'sku.view': {
    key: 'sku.view',
    module: 'product',
    action: 'view',
    name: 'Xem SKU',
    description: 'Xem danh sách mã SKU và quy cách đóng gói'
  },
  'sku.create': {
    key: 'sku.create',
    module: 'product',
    action: 'create',
    name: 'Tạo SKU',
    description: 'Tạo mã SKU mới cho sản phẩm / biến thể'
  },
  'sku.update': {
    key: 'sku.update',
    module: 'product',
    action: 'update',
    name: 'Cập nhật SKU',
    description: 'Chỉnh sửa thông tin SKU, quy đổi đơn vị, trọng lượng và kích thước'
  },

  // Barcode Management
  'barcode.create': {
    key: 'barcode.create',
    module: 'product',
    action: 'create',
    name: 'Gán Barcode',
    description: 'Tạo và gán mã vạch Barcode (EAN, UPC, CODE128) cho SKU'
  },
  'barcode.delete': {
    key: 'barcode.delete',
    module: 'product',
    action: 'delete',
    name: 'Xóa Barcode',
    description: 'Hủy hoặc xóa mã vạch Barcode khỏi SKU'
  },

  // Category Master
  'category.view': {
    key: 'category.view',
    module: 'product',
    action: 'view',
    name: 'Xem Danh mục',
    description: 'Xem cây danh mục sản phẩm đa cấp'
  },
  'category.create': {
    key: 'category.create',
    module: 'product',
    action: 'create',
    name: 'Tạo Danh mục',
    description: 'Tạo mới danh mục sản phẩm'
  },
  'category.update': {
    key: 'category.update',
    module: 'product',
    action: 'update',
    name: 'Cập nhật Danh mục',
    description: 'Chỉnh sửa tên và cấu trúc phân cấp danh mục'
  },

  // Brand Master
  'brand.view': {
    key: 'brand.view',
    module: 'product',
    action: 'view',
    name: 'Xem Thương hiệu',
    description: 'Xem danh sách thương hiệu sản phẩm'
  },
  'brand.create': {
    key: 'brand.create',
    module: 'product',
    action: 'create',
    name: 'Tạo Thương hiệu',
    description: 'Thêm mới thương hiệu sản phẩm'
  },
  'brand.update': {
    key: 'brand.update',
    module: 'product',
    action: 'update',
    name: 'Cập nhật Thương hiệu',
    description: 'Chỉnh sửa thông tin thương hiệu'
  },

  // Price List Management
  'price.view': {
    key: 'price.view',
    module: 'product',
    action: 'view',
    name: 'Xem Bảng giá',
    description: 'Xem bảng giá bán lẻ, bán sỉ, đại lý, B2B, POS, marketplace'
  },
  'price.create': {
    key: 'price.create',
    module: 'product',
    action: 'create',
    name: 'Tạo Bảng giá',
    description: 'Thiết lập bảng giá mới cho kênh phân phối'
  },
  'price.update': {
    key: 'price.update',
    module: 'product',
    action: 'update',
    name: 'Cập nhật Giá bán',
    description: 'Chỉnh sửa giá niêm yết và biểu giá trên các bảng giá'
  },

  // Sales Channel Mapping
  'product.channel_mapping.view': {
    key: 'product.channel_mapping.view',
    module: 'product',
    action: 'view',
    name: 'Xem Liên kết Kênh bán',
    description: 'Xem liên kết SKU với Shopee, TikTok Shop, GrabFood, Website'
  },
  'product.channel_mapping.update': {
    key: 'product.channel_mapping.update',
    module: 'product',
    action: 'update',
    name: 'Cập nhật Liên kết Kênh bán',
    description: 'Cấu hình và đồng bộ mã sản phẩm trên sàn TMĐT & ứng dụng giao hàng'
  },

  // Combo Management
  'combo.view': {
    key: 'combo.view',
    module: 'product',
    action: 'view',
    name: 'Xem Combo & Set quà',
    description: 'Xem thành phần định lượng của sản phẩm Combo'
  },
  'combo.create': {
    key: 'combo.create',
    module: 'product',
    action: 'create',
    name: 'Tạo Combo',
    description: 'Thiết lập gói sản phẩm Combo và định lượng thành phần'
  },
  'combo.update': {
    key: 'combo.update',
    module: 'product',
    action: 'update',
    name: 'Cập nhật Combo',
    description: 'Chỉnh sửa thành phần và số lượng trong Combo'
  },

  // Inventory Core Module
  'inventory.view': {
    key: 'inventory.view',
    module: 'inventory',
    action: 'view',
    name: 'Xem Tồn kho & Lô FIFO',
    description: 'Xem số lượng tồn kho khả dụng, vị trí ô kệ và tuổi lô hàng'
  },
  'inventory.create': {
    key: 'inventory.create',
    module: 'inventory',
    action: 'create',
    name: 'Nhập kho',
    description: 'Tạo phiếu nhập kho, nhận hàng từ nhà cung cấp theo lô FIFO'
  },
  'inventory.transfer': {
    key: 'inventory.transfer',
    module: 'inventory',
    action: 'transfer',
    name: 'Điều chuyển Kho',
    description: 'Lập và thực hiện phiếu điều chuyển hàng hóa giữa các kho/chi nhánh'
  },
  'inventory.stocktake': {
    key: 'inventory.stocktake',
    module: 'inventory',
    action: 'stocktake',
    name: 'Kiểm kê Kho',
    description: 'Thực hiện kiểm kê, đối soát thực tế và phê duyệt chênh lệch tồn kho'
  },

  // Order Core Module
  'order.view': {
    key: 'order.view',
    module: 'order',
    action: 'view',
    name: 'Xem Đơn hàng',
    description: 'Xem danh sách và chi tiết đơn bán hàng'
  },
  'order.create': {
    key: 'order.create',
    module: 'order',
    action: 'create',
    name: 'Tạo Đơn hàng',
    description: 'Tạo mới đơn đặt hàng và áp dụng chính sách chiết khấu'
  },
  'order.update': {
    key: 'order.update',
    module: 'order',
    action: 'update',
    name: 'Cập nhật Đơn hàng',
    description: 'Chỉnh sửa thông tin giao hàng, sản phẩm hoặc trạng thái đơn'
  },
  'order.cancel': {
    key: 'order.cancel',
    module: 'order',
    action: 'cancel',
    name: 'Hủy Đơn hàng',
    description: 'Hủy đơn hàng và xử lý hoàn trả'
  },

  // POS Module
  'pos.view': {
    key: 'pos.view',
    module: 'pos',
    action: 'view',
    name: 'Xem Màn hình POS',
    description: 'Truy cập giao diện bán hàng tại quầy'
  },
  'pos.create': {
    key: 'pos.create',
    module: 'pos',
    action: 'create',
    name: 'Thanh toán POS',
    description: 'Tạo hóa đơn bán lẻ trực tiếp và thu tiền'
  },

  // CRM Module
  'crm.view': {
    key: 'crm.view',
    module: 'crm',
    action: 'view',
    name: 'Xem Khách hàng & CRM',
    description: 'Xem thông tin khách hàng, lịch sử mua hàng và công nợ'
  },
  'crm.create': {
    key: 'crm.create',
    module: 'crm',
    action: 'create',
    name: 'Tạo Khách hàng / Nhiệm vụ CRM',
    description: 'Thêm mới hồ sơ khách hàng và tạo công việc chăm sóc'
  },
  'crm.update': {
    key: 'crm.update',
    module: 'crm',
    action: 'update',
    name: 'Cập nhật Khách hàng',
    description: 'Chỉnh sửa thông tin khách hàng, phân hạng và hạn mức tín dụng'
  },

  // Finance Module
  'finance.view': {
    key: 'finance.view',
    module: 'finance',
    action: 'view',
    name: 'Xem Sổ Quỹ & Tài chính',
    description: 'Xem dòng tiền thu/chi, số dư tài khoản và đối soát sàn'
  },
  'finance.create': {
    key: 'finance.create',
    module: 'finance',
    action: 'create',
    name: 'Tạo Phiếu Thu/Chi',
    description: 'Lập phiếu thu tiền mặt, phiếu chi và lệnh chuyển khoản'
  },
  'finance.approve': {
    key: 'finance.approve',
    module: 'finance',
    action: 'approve',
    name: 'Duyệt Chi & Báo cáo Tài chính',
    description: 'Phê duyệt các khoản chi lớn, hoàn tiền và chốt sổ kế toán'
  },

  // Report Module
  'report.view': {
    key: 'report.view',
    module: 'report',
    action: 'view',
    name: 'Xem Báo cáo',
    description: 'Xem các báo cáo doanh thu, lãi gộp, tồn kho và công nợ'
  },
  'report.export': {
    key: 'report.export',
    module: 'report',
    action: 'export',
    name: 'Xuất Báo cáo Excel/PDF',
    description: 'Trích xuất dữ liệu báo cáo ra file Excel hoặc PDF'
  },

  // User & Access Control Module
  'user.view': {
    key: 'user.view',
    module: 'user',
    action: 'view',
    name: 'Xem Danh sách Nhân sự',
    description: 'Xem hồ sơ nhân viên trong tổ chức'
  },
  'user.create': {
    key: 'user.create',
    module: 'user',
    action: 'create',
    name: 'Tạo Tài khoản Nhân sự',
    description: 'Tạo tài khoản nhân viên mới và gán vai trò'
  },
  'user.update': {
    key: 'user.update',
    module: 'user',
    action: 'update',
    name: 'Cập nhật Quyền & Nhân sự',
    description: 'Chỉnh sửa vai trò, phân quyền, phạm vi dữ liệu và trạng thái tài khoản'
  },

  // Branch Master Module
  'branch.view': {
    key: 'branch.view',
    module: 'branch',
    action: 'view',
    name: 'Xem Chi nhánh',
    description: 'Xem danh sách các chi nhánh thuộc Tenant'
  },
  'branch.create': {
    key: 'branch.create',
    module: 'branch',
    action: 'create',
    name: 'Tạo Chi nhánh',
    description: 'Thiết lập chi nhánh mới'
  },
  'branch.update': {
    key: 'branch.update',
    module: 'branch',
    action: 'update',
    name: 'Cập nhật Chi nhánh',
    description: 'Chỉnh sửa thông tin chi nhánh'
  },

  // Warehouse Master Module
  'warehouse.view': {
    key: 'warehouse.view',
    module: 'warehouse',
    action: 'view',
    name: 'Xem Kho hàng',
    description: 'Xem danh sách kho hàng thuộc Chi nhánh & Tenant'
  },
  'warehouse.create': {
    key: 'warehouse.create',
    module: 'warehouse',
    action: 'create',
    name: 'Tạo Kho hàng',
    description: 'Thiết lập kho hàng mới'
  },
  'warehouse.update': {
    key: 'warehouse.update',
    module: 'warehouse',
    action: 'update',
    name: 'Cập nhật Kho hàng',
    description: 'Chỉnh sửa thông tin kho hàng'
  },

  // Tenant Setting Module
  'tenant.view': {
    key: 'tenant.view',
    module: 'tenant',
    action: 'view',
    name: 'Xem Thông tin Doanh nghiệp',
    description: 'Xem hồ sơ pháp lý, mã số thuế, cấu hình của Tenant'
  },
  'tenant.update': {
    key: 'tenant.update',
    module: 'tenant',
    action: 'update',
    name: 'Cập nhật Thông tin Doanh nghiệp',
    description: 'Chỉnh sửa hồ sơ kinh doanh và cấu hình chung của Tenant'
  }
};

export class PermissionRegistryService {
  static getAllPermissions(): PermissionDefinition[] {
    return Object.values(PERMISSION_REGISTRY);
  }

  static getPermission(key: string): PermissionDefinition | undefined {
    return PERMISSION_REGISTRY[key];
  }

  static isValidPermission(key: string): boolean {
    return Boolean(PERMISSION_REGISTRY[key]);
  }

  static getPermissionsByModule(module: string): PermissionDefinition[] {
    return Object.values(PERMISSION_REGISTRY).filter((p) => p.module === module);
  }

  static validatePermissionKeys(keys: string[]): { valid: boolean; invalidKeys: string[] } {
    const invalidKeys = keys.filter((k) => !this.isValidPermission(k));
    return {
      valid: invalidKeys.length === 0,
      invalidKeys
    };
  }
}
