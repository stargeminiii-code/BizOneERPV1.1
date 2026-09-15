import { PermissionDefinition } from '../../types';

/**
 * CANONICAL PERMISSION REGISTRY (SINGLE SOURCE OF TRUTH)
 * Standard Format: 'module.action'
 */
export const PERMISSION_REGISTRY: Record<string, PermissionDefinition> = {
  // Dashboard Module
  'dashboard.view': { key: 'dashboard.view', module: 'dashboard', action: 'view', name: 'Xem Báo cáo Tổng quan', description: 'Quyền xem bảng điều khiển kinh doanh, chỉ số KPI và biểu đồ tăng trưởng' },
  'product.view': { key: 'product.view', module: 'product', action: 'view', name: 'Xem Sản phẩm', description: 'Xem danh mục hàng hóa, bảng giá niêm yết và thông tin quy cách' },
  'product.create': { key: 'product.create', module: 'product', action: 'create', name: 'Thêm mới Sản phẩm', description: 'Thêm sản phẩm mới và thiết lập giá bán niêm yết' },
  'product.update': { key: 'product.update', module: 'product', action: 'update', name: 'Cập nhật Sản phẩm', description: 'Chỉnh sửa thông tin, giá bán và định mức tồn an toàn của sản phẩm' },
  'product.archive': { key: 'product.archive', module: 'product', action: 'archive', name: 'Lưu trữ Sản phẩm', description: 'Lưu trữ hoặc ngừng kinh doanh sản phẩm khỏi hệ thống' },
  'product.delete': { key: 'product.delete', module: 'product', action: 'delete', name: 'Xóa Sản phẩm', description: 'Xóa hoặc ngừng kinh doanh sản phẩm khỏi hệ thống' },
  'sku.view': { key: 'sku.view', module: 'product', action: 'view', name: 'Xem SKU', description: 'Xem danh sách mã SKU và quy cách đóng gói' },
  'sku.create': { key: 'sku.create', module: 'product', action: 'create', name: 'Tạo SKU', description: 'Tạo mã SKU mới cho sản phẩm / biến thể' },
  'sku.update': { key: 'sku.update', module: 'product', action: 'update', name: 'Cập nhật SKU', description: 'Chỉnh sửa thông tin SKU, quy đổi đơn vị, trọng lượng và kích thước' },
  'barcode.create': { key: 'barcode.create', module: 'product', action: 'create', name: 'Gán Barcode', description: 'Tạo và gán mã vạch Barcode' },
  'barcode.delete': { key: 'barcode.delete', module: 'product', action: 'delete', name: 'Xóa Barcode', description: 'Hủy hoặc xóa mã vạch Barcode khỏi SKU' },
  'category.view': { key: 'category.view', module: 'product', action: 'view', name: 'Xem Danh mục', description: 'Xem cây danh mục sản phẩm đa cấp' },
  'category.create': { key: 'category.create', module: 'product', action: 'create', name: 'Tạo Danh mục', description: 'Tạo mới danh mục sản phẩm' },
  'category.update': { key: 'category.update', module: 'product', action: 'update', name: 'Cập nhật Danh mục', description: 'Chỉnh sửa tên và cấu trúc phân cấp danh mục' },
  'brand.view': { key: 'brand.view', module: 'product', action: 'view', name: 'Xem Thương hiệu', description: 'Xem danh sách thương hiệu sản phẩm' },
  'brand.create': { key: 'brand.create', module: 'product', action: 'create', name: 'Tạo Thương hiệu', description: 'Thêm mới thương hiệu sản phẩm' },
  'brand.update': { key: 'brand.update', module: 'product', action: 'update', name: 'Cập nhật Thương hiệu', description: 'Chỉnh sửa thông tin thương hiệu' },
  'price.view': { key: 'price.view', module: 'product', action: 'view', name: 'Xem Bảng giá', description: 'Xem bảng giá bán' },
  'price.create': { key: 'price.create', module: 'product', action: 'create', name: 'Tạo Bảng giá', description: 'Thiết lập bảng giá mới' },
  'price.update': { key: 'price.update', module: 'product', action: 'update', name: 'Cập nhật Giá bán', description: 'Chỉnh sửa giá bán' },
  'product.channel_mapping.view': { key: 'product.channel_mapping.view', module: 'product', action: 'view', name: 'Xem Liên kết Kênh bán', description: 'Xem liên kết SKU với kênh bán' },
  'product.channel_mapping.update': { key: 'product.channel_mapping.update', module: 'product', action: 'update', name: 'Cập nhật Liên kết Kênh bán', description: 'Cấu hình liên kết SKU với kênh bán' },
  'combo.view': { key: 'combo.view', module: 'product', action: 'view', name: 'Xem Combo', description: 'Xem thành phần Combo' },
  'combo.create': { key: 'combo.create', module: 'product', action: 'create', name: 'Tạo Combo', description: 'Thiết lập Combo' },
  'combo.update': { key: 'combo.update', module: 'product', action: 'update', name: 'Cập nhật Combo', description: 'Chỉnh sửa Combo' },
  'inventory.view': { key: 'inventory.view', module: 'inventory', action: 'view', name: 'Xem Tồn kho & Lô FIFO', description: 'Xem tồn kho' },
  'inventory.create': { key: 'inventory.create', module: 'inventory', action: 'create', name: 'Nhập kho', description: 'Tạo phiếu nhập kho' },
  'inventory.transfer': { key: 'inventory.transfer', module: 'inventory', action: 'transfer', name: 'Điều chuyển Kho', description: 'Điều chuyển kho' },
  'inventory.stocktake': { key: 'inventory.stocktake', module: 'inventory', action: 'stocktake', name: 'Kiểm kê Kho', description: 'Kiểm kê kho' },
  'order.view': { key: 'order.view', module: 'order', action: 'view', name: 'Xem Đơn hàng', description: 'Xem đơn hàng' },
  'order.create': { key: 'order.create', module: 'order', action: 'create', name: 'Tạo Đơn hàng', description: 'Tạo đơn hàng' },
  'order.update': { key: 'order.update', module: 'order', action: 'update', name: 'Cập nhật Đơn hàng', description: 'Cập nhật đơn hàng' },
  'order.cancel': { key: 'order.cancel', module: 'order', action: 'cancel', name: 'Hủy Đơn hàng', description: 'Hủy đơn hàng' },
  'pos.view': { key: 'pos.view', module: 'pos', action: 'view', name: 'Xem Màn hình POS', description: 'Truy cập POS' },
  'pos.create': { key: 'pos.create', module: 'pos', action: 'create', name: 'Thanh toán POS', description: 'Thanh toán POS' },
  'crm.view': { key: 'crm.view', module: 'crm', action: 'view', name: 'Xem Khách hàng & CRM', description: 'Xem CRM' },
  'crm.create': { key: 'crm.create', module: 'crm', action: 'create', name: 'Tạo Khách hàng / Nhiệm vụ CRM', description: 'Tạo CRM' },
  'crm.update': { key: 'crm.update', module: 'crm', action: 'update', name: 'Cập nhật Khách hàng', description: 'Cập nhật CRM' },
  'finance.view': { key: 'finance.view', module: 'finance', action: 'view', name: 'Xem Sổ Quỹ & Tài chính', description: 'Xem tài chính' },
  'finance.create': { key: 'finance.create', module: 'finance', action: 'create', name: 'Tạo Phiếu Thu/Chi', description: 'Tạo phiếu thu chi' },
  'finance.approve': { key: 'finance.approve', module: 'finance', action: 'approve', name: 'Duyệt Chi & Báo cáo Tài chính', description: 'Duyệt tài chính' },
  'report.view': { key: 'report.view', module: 'report', action: 'view', name: 'Xem Báo cáo', description: 'Xem báo cáo' },
  'report.export': { key: 'report.export', module: 'report', action: 'export', name: 'Xuất Báo cáo Excel/PDF', description: 'Xuất báo cáo' },
  'user.view': { key: 'user.view', module: 'user', action: 'view', name: 'Xem Danh sách Nhân sự', description: 'Xem nhân sự' },
  'user.create': { key: 'user.create', module: 'user', action: 'create', name: 'Tạo Tài khoản Nhân sự', description: 'Tạo nhân sự' },
  'user.update': { key: 'user.update', module: 'user', action: 'update', name: 'Cập nhật Quyền & Nhân sự', description: 'Cập nhật quyền' },
  'branch.view': { key: 'branch.view', module: 'branch', action: 'view', name: 'Xem Chi nhánh', description: 'Xem chi nhánh' },
  'branch.create': { key: 'branch.create', module: 'branch', action: 'create', name: 'Tạo Chi nhánh', description: 'Tạo chi nhánh' },
  'branch.update': { key: 'branch.update', module: 'branch', action: 'update', name: 'Cập nhật Chi nhánh', description: 'Cập nhật chi nhánh' },
  'warehouse.view': { key: 'warehouse.view', module: 'warehouse', action: 'view', name: 'Xem Kho hàng', description: 'Xem kho' },
  'warehouse.create': { key: 'warehouse.create', module: 'warehouse', action: 'create', name: 'Tạo Kho hàng', description: 'Tạo kho' },
  'warehouse.update': { key: 'warehouse.update', module: 'warehouse', action: 'update', name: 'Cập nhật Kho hàng', description: 'Cập nhật kho' },
  'tenant.view': { key: 'tenant.view', module: 'tenant', action: 'view', name: 'Xem Thông tin Doanh nghiệp', description: 'Xem tenant' },
  'tenant.update': { key: 'tenant.update', module: 'tenant', action: 'update', name: 'Cập nhật Thông tin Doanh nghiệp', description: 'Cập nhật tenant' },

  // FAD Migration
  'migration.fad.view': { key: 'migration.fad.view', module: 'migration', action: 'view', name: 'Xem Migration FAD', description: 'Xem lịch sử và dữ liệu migration FAD của Tenant' },
  'migration.fad.validate': { key: 'migration.fad.validate', module: 'migration', action: 'validate', name: 'Kiểm tra Manifest FAD', description: 'Kiểm tra manifest trước khi nhập dữ liệu FAD' },
  'migration.fad.import': { key: 'migration.fad.import', module: 'migration', action: 'import', name: 'Import dữ liệu FAD', description: 'Nhập dữ liệu FAD vào vùng dữ liệu migration của Tenant' }
};

export class PermissionRegistryService {
  static getAllPermissions(): PermissionDefinition[] { return Object.values(PERMISSION_REGISTRY); }
  static getPermission(key: string): PermissionDefinition | undefined { return PERMISSION_REGISTRY[key]; }
}
