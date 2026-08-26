import { UserCore, SecurityUserContext, StandardRoleCode } from '../../types';
import { UserRepository } from '../../repositories/userRepository';
import { RoleRepository } from '../../repositories/roleRepository';
import { BranchRepository } from '../../repositories/branchRepository';
import { WarehouseRepository } from '../../repositories/warehouseRepository';
import { AuditLogRepository } from '../../repositories/auditLogRepository';
import { CANONICAL_SYSTEM_ROLES } from '../roles/roleService';

export class UserService {
  static getUser(tenantId: string, userId: string): UserCore | null {
    return UserRepository.findById(tenantId, userId);
  }

  static getUsersByTenant(tenantId: string): UserCore[] {
    return UserRepository.findByTenantId(tenantId);
  }

  /**
   * Constructs the full runtime SecurityUserContext for a user, resolving their role,
   * dataScope, permissions, and authorized branches/warehouses.
   */
  static buildSecurityContext(tenantId: string, userId: string): SecurityUserContext | null {
    const user = UserRepository.findById(tenantId, userId);
    if (!user || user.status !== 'active') {
      return null;
    }

    // Resolve Role
    const role = RoleRepository.findById(user.roleId, tenantId) || CANONICAL_SYSTEM_ROLES.STAFF;

    // Build permissions set
    const permissions = new Set<string>(role.permissions);

    return {
      userId: user.userId,
      tenantId: user.tenantId,
      name: user.name,
      email: user.email,
      roleId: role.roleId,
      roleCode: (role.code as StandardRoleCode) || 'STAFF',
      dataScope: role.dataScope || 'INDIVIDUAL',
      permissions,
      branchIds: user.branchIds || [],
      warehouseIds: user.warehouseIds || []
    };
  }

  static createUser(
    tenantId: string,
    data: {
      userId: string;
      name: string;
      email: string;
      phone: string;
      roleId: string;
      branchIds: string[];
      warehouseIds: string[];
    },
    actorContext: SecurityUserContext
  ): { success: boolean; user?: UserCore; error?: string } {
    // 1. Validate actor has permission
    if (!actorContext.permissions.has('user.create') && actorContext.roleCode !== 'OWNER') {
      return { success: false, error: 'Không có quyền tạo người dùng (user.create)' };
    }

    // 2. Validate actor tenant matches target tenant
    if (actorContext.tenantId !== tenantId) {
      return { success: false, error: 'Không được phép tạo người dùng cho Tenant khác' };
    }

    // 3. Validate uniqueness
    const existing = UserRepository.findById(tenantId, data.userId);
    if (existing) {
      return { success: false, error: `Mã nhân sự [${data.userId}] đã tồn tại` };
    }

    const existingEmail = UserRepository.findByEmail(tenantId, data.email);
    if (existingEmail) {
      return { success: false, error: `Email [${data.email}] đã được sử dụng trong tổ chức` };
    }

    // 4. Validate branchIds and warehouseIds belong to this Tenant
    const tenantBranches = BranchRepository.findByTenantId(tenantId).map((b) => b.branchId);
    const invalidBranches = data.branchIds.filter((bId) => !tenantBranches.includes(bId));
    if (invalidBranches.length > 0) {
      return { success: false, error: `Chi nhánh không hợp lệ: ${invalidBranches.join(', ')}` };
    }

    const tenantWarehouses = WarehouseRepository.findByTenantId(tenantId).map((w) => w.warehouseId);
    const invalidWarehouses = data.warehouseIds.filter((wId) => !tenantWarehouses.includes(wId));
    if (invalidWarehouses.length > 0) {
      return { success: false, error: `Kho hàng không hợp lệ: ${invalidWarehouses.join(', ')}` };
    }

    const newUser = UserRepository.create(tenantId, {
      ...data,
      status: 'active'
    });

    AuditLogRepository.record({
      tenantId,
      userId: actorContext.userId,
      action: 'USER_CREATED',
      module: 'user',
      entityType: 'USER',
      entityId: newUser.userId,
      metadata: { name: newUser.name, email: newUser.email, roleId: newUser.roleId }
    });

    return { success: true, user: newUser };
  }

  static updateUser(
    tenantId: string,
    userId: string,
    updates: Partial<Omit<UserCore, 'userId' | 'tenantId' | 'createdAt'>>,
    actorContext: SecurityUserContext
  ): { success: boolean; user?: UserCore; error?: string } {
    if (!actorContext.permissions.has('user.update') && actorContext.roleCode !== 'OWNER') {
      return { success: false, error: 'Không có quyền cập nhật người dùng (user.update)' };
    }

    if (actorContext.tenantId !== tenantId) {
      return { success: false, error: 'Không được phép cập nhật người dùng của Tenant khác' };
    }

    const updated = UserRepository.update(tenantId, userId, updates);
    if (!updated) {
      return { success: false, error: `Không tìm thấy người dùng [${userId}] trong Tenant [${tenantId}]` };
    }

    AuditLogRepository.record({
      tenantId,
      userId: actorContext.userId,
      action: 'USER_UPDATED',
      module: 'user',
      entityType: 'USER',
      entityId: userId,
      metadata: updates
    });

    return { success: true, user: updated };
  }
}
