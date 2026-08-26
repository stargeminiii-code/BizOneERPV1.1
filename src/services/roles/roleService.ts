import { RoleCore, StandardRoleCode, DataScopeType } from '../../types';
import { PERMISSION_REGISTRY } from '../permissions/permissionRegistry';

/**
 * CANONICAL SYSTEM ROLES (SINGLE SOURCE OF TRUTH)
 */
export const CANONICAL_SYSTEM_ROLES: Record<StandardRoleCode, RoleCore> = {
  OWNER: {
    roleId: 'role-system-owner',
    code: 'OWNER',
    name: 'Chủ sở hữu Doanh nghiệp (Owner)',
    description: 'Toàn quyền tối cao quản trị tổ chức, tài chính, phân quyền và cấu hình toàn bộ hệ thống.',
    isSystemRole: true,
    dataScope: 'COMPANY_WIDE',
    permissions: Object.keys(PERMISSION_REGISTRY),
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-01 00:00:00'
  },
  CEO: {
    roleId: 'role-system-ceo',
    code: 'CEO',
    name: 'Tổng Giám Đốc (CEO)',
    description: 'Quản trị điều hành toàn diện, kiểm soát KPI kinh doanh, tài chính và phê duyệt hạn mức.',
    isSystemRole: true,
    dataScope: 'COMPANY_WIDE',
    permissions: [
      'dashboard.view',
      'product.view', 'product.create', 'product.update', 'product.archive',
      'sku.view', 'sku.create', 'sku.update',
      'barcode.create', 'barcode.delete',
      'category.view', 'category.create', 'category.update',
      'brand.view', 'brand.create', 'brand.update',
      'price.view', 'price.create', 'price.update',
      'product.channel_mapping.view', 'product.channel_mapping.update',
      'combo.view', 'combo.create', 'combo.update',
      'inventory.view', 'inventory.create', 'inventory.transfer', 'inventory.stocktake',
      'order.view', 'order.create', 'order.update', 'order.cancel',
      'pos.view',
      'crm.view', 'crm.create', 'crm.update',
      'finance.view', 'finance.create', 'finance.approve',
      'report.view', 'report.export',
      'user.view', 'user.create', 'user.update',
      'branch.view', 'branch.create', 'branch.update',
      'warehouse.view', 'warehouse.create', 'warehouse.update',
      'tenant.view', 'tenant.update'
    ],
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-01 00:00:00'
  },
  DIRECTOR: {
    roleId: 'role-system-director',
    code: 'DIRECTOR',
    name: 'Giám Đốc Khối / Bộ Phận (Director)',
    description: 'Điều hành khối nghiệp vụ, phân bổ kế hoạch, theo dõi KPI và xem báo cáo tổng hợp.',
    isSystemRole: true,
    dataScope: 'DIVISION',
    permissions: [
      'dashboard.view',
      'product.view', 'product.update',
      'sku.view', 'sku.update',
      'category.view',
      'brand.view',
      'price.view', 'price.update',
      'product.channel_mapping.view',
      'combo.view',
      'inventory.view', 'inventory.transfer',
      'order.view', 'order.create', 'order.update',
      'pos.view',
      'crm.view', 'crm.create', 'crm.update',
      'finance.view',
      'report.view', 'report.export',
      'user.view',
      'branch.view',
      'warehouse.view'
    ],
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-01 00:00:00'
  },
  MANAGER: {
    roleId: 'role-system-manager',
    code: 'MANAGER',
    name: 'Quản Lý Chi Nhánh / Trưởng Phòng (Manager)',
    description: 'Quản lý vận hành chi nhánh, nhân sự trực thuộc, bán hàng và xuất nhập kho chi nhánh.',
    isSystemRole: true,
    dataScope: 'BRANCH',
    permissions: [
      'dashboard.view',
      'product.view', 'product.create', 'product.update', 'product.archive',
      'sku.view', 'sku.create', 'sku.update',
      'barcode.create', 'barcode.delete',
      'category.view', 'category.create', 'category.update',
      'brand.view', 'brand.create', 'brand.update',
      'price.view', 'price.create', 'price.update',
      'product.channel_mapping.view', 'product.channel_mapping.update',
      'combo.view', 'combo.create', 'combo.update',
      'inventory.view', 'inventory.create', 'inventory.transfer', 'inventory.stocktake',
      'order.view', 'order.create', 'order.update', 'order.cancel',
      'pos.view', 'pos.create',
      'crm.view', 'crm.create', 'crm.update',
      'finance.view', 'finance.create',
      'report.view', 'report.export',
      'user.view',
      'branch.view',
      'warehouse.view'
    ],
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-01 00:00:00'
  },
  STAFF: {
    roleId: 'role-system-staff',
    code: 'STAFF',
    name: 'Nhân Viên Nghiệp Vụ Tổng Hợp (Staff)',
    description: 'Thực hiện tác vụ hàng ngày theo phân công trong phạm vi cá nhân / chi nhánh.',
    isSystemRole: true,
    dataScope: 'INDIVIDUAL',
    permissions: [
      'dashboard.view',
      'product.view',
      'inventory.view',
      'order.view', 'order.create',
      'pos.view', 'pos.create',
      'crm.view', 'crm.create',
      'report.view'
    ],
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-01 00:00:00'
  },
  WAREHOUSE_STAFF: {
    roleId: 'role-system-warehouse-staff',
    code: 'WAREHOUSE_STAFF',
    name: 'Nhân Viên Thủ Kho (Warehouse Staff)',
    description: 'Quản lý nhập hàng, xuất chuyển kho, kiểm kê hàng hóa và vị trí ô kệ tại kho phụ trách.',
    isSystemRole: true,
    dataScope: 'WAREHOUSE',
    permissions: [
      'dashboard.view',
      'product.view',
      'inventory.view', 'inventory.create', 'inventory.transfer', 'inventory.stocktake',
      'order.view',
      'warehouse.view',
      'report.view'
    ],
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-01 00:00:00'
  },
  SALES: {
    roleId: 'role-system-sales',
    code: 'SALES',
    name: 'Nhân Viên Kinh Doanh (Sales)',
    description: 'Tìm kiếm khách hàng, lập báo giá, tạo đơn hàng và theo dõi chỉ tiêu doanh số cá nhân.',
    isSystemRole: true,
    dataScope: 'INDIVIDUAL',
    permissions: [
      'dashboard.view',
      'product.view',
      'order.view', 'order.create', 'order.update',
      'pos.view', 'pos.create',
      'crm.view', 'crm.create', 'crm.update',
      'report.view'
    ],
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-01 00:00:00'
  },
  CSKH: {
    roleId: 'role-system-cskh',
    code: 'CSKH',
    name: 'Nhân Viên Chăm Sóc Khách Hàng (CSKH)',
    description: 'Chăm sóc khách hàng, xử lý khiếu nại, hỗ trợ sau bán và cập nhật thông tin CRM.',
    isSystemRole: true,
    dataScope: 'INDIVIDUAL',
    permissions: [
      'dashboard.view',
      'product.view',
      'order.view',
      'crm.view', 'crm.create', 'crm.update',
      'report.view'
    ],
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-01 00:00:00'
  },
  ACCOUNTING: {
    roleId: 'role-system-accounting',
    code: 'ACCOUNTING',
    name: 'Kế Toán Viên (Accounting)',
    description: 'Quản lý sổ quỹ, hóa đơn chứng từ, công nợ phải thu / phải trả và đối soát tài chính.',
    isSystemRole: true,
    dataScope: 'COMPANY_WIDE',
    permissions: [
      'dashboard.view',
      'product.view',
      'inventory.view',
      'order.view',
      'crm.view',
      'finance.view', 'finance.create',
      'report.view', 'report.export'
    ],
    createdAt: '2026-01-01 00:00:00',
    updatedAt: '2026-01-01 00:00:00'
  }
};

export class RoleService {
  static getSystemRoles(): RoleCore[] {
    return Object.values(CANONICAL_SYSTEM_ROLES);
  }

  static getRoleByCode(code: StandardRoleCode | string): RoleCore | undefined {
    return CANONICAL_SYSTEM_ROLES[code as StandardRoleCode];
  }

  static getRoleById(roleId: string, customRoles: RoleCore[] = []): RoleCore | undefined {
    const systemRole = Object.values(CANONICAL_SYSTEM_ROLES).find((r) => r.roleId === roleId);
    if (systemRole) return systemRole;
    return customRoles.find((r) => r.roleId === roleId);
  }

  static hasPermission(role: RoleCore, requiredPermission: string): boolean {
    if (!role || !role.permissions) return false;
    // OWNER has all permissions
    if (role.code === 'OWNER' || role.permissions.includes('*')) {
      return true;
    }
    return role.permissions.includes(requiredPermission);
  }
}
