import { SecurityUserContext, DataScopeType, DataScopeFilterCriteria } from '../../types';

export interface ScopedEntityMeta {
  tenantId: string;
  branchId?: string;
  warehouseId?: string;
  createdBy?: string;
  assignedTo?: string;
  department?: string;
}

export class DataScopeEngine {
  /**
   * Evaluates if a given security context has read or write access to an entity
   */
  static canAccess(
    context: SecurityUserContext,
    entity: ScopedEntityMeta
  ): { allowed: boolean; reason?: string } {
    // 1. Mandatory Tenant Isolation Barrier
    if (!entity.tenantId || entity.tenantId !== context.tenantId) {
      return {
        allowed: false,
        reason: `Vi phạm cách ly Tenant: Người dùng [${context.userId}] của Tenant [${context.tenantId}] không thể truy cập tài nguyên của Tenant [${entity.tenantId || 'UNKNOWN'}]`
      };
    }

    // 2. Data Scope Check within the same Tenant
    switch (context.dataScope) {
      case 'COMPANY_WIDE':
        return { allowed: true };

      case 'DIVISION':
        if (
          !entity.branchId ||
          context.branchIds.includes(entity.branchId) ||
          (entity.department && context.roleCode === 'DIRECTOR')
        ) {
          return { allowed: true };
        }
        return {
          allowed: false,
          reason: `Phạm vi Khối/Bộ phận không cho phép truy cập chi nhánh [${entity.branchId}]`
        };

      case 'BRANCH':
        if (entity.branchId && !context.branchIds.includes(entity.branchId)) {
          return {
            allowed: false,
            reason: `Phạm vi Chi nhánh bị giới hạn: Người dùng chỉ có quyền tại chi nhánh [${context.branchIds.join(', ')}], không được truy cập chi nhánh [${entity.branchId}]`
          };
        }
        return { allowed: true };

      case 'WAREHOUSE':
        if (entity.warehouseId && !context.warehouseIds.includes(entity.warehouseId)) {
          return {
            allowed: false,
            reason: `Phạm vi Kho hàng bị giới hạn: Người dùng chỉ có quyền tại kho [${context.warehouseIds.join(', ')}], không được truy cập kho [${entity.warehouseId}]`
          };
        }
        // Also ensure branch matches if present
        if (entity.branchId && context.branchIds.length > 0 && !context.branchIds.includes(entity.branchId)) {
          return {
            allowed: false,
            reason: `Chi nhánh của kho không nằm trong danh sách chi nhánh được phân công`
          };
        }
        return { allowed: true };

      case 'INDIVIDUAL':
        const isOwner = entity.createdBy === context.userId || entity.assignedTo === context.userId;
        if (!isOwner) {
          return {
            allowed: false,
            reason: `Phạm vi Cá nhân: Chỉ người tạo (${entity.createdBy}) hoặc người được giao (${entity.assignedTo}) mới có quyền thao tác`
          };
        }
        return { allowed: true };

      default:
        return { allowed: false, reason: 'DataScope không xác định' };
    }
  }

  /**
   * Filters an in-memory array of entities by applying strict Tenant and DataScope rules
   */
  static filterList<T>(
    items: T[],
    context: SecurityUserContext,
    metaExtractor: (item: T) => ScopedEntityMeta
  ): T[] {
    if (!items || !Array.isArray(items)) return [];

    return items.filter((item) => {
      const meta = metaExtractor(item);
      const access = this.canAccess(context, meta);
      return access.allowed;
    });
  }

  /**
   * Enforces server-side mutation constraints when creating or modifying records
   * (Prevents user from spoofing tenantId, branchId, warehouseId in payload)
   */
  static validateMutation(
    context: SecurityUserContext,
    payload: {
      tenantId?: string;
      branchId?: string;
      warehouseId?: string;
    }
  ): { valid: boolean; error?: string } {
    // 1. Tenant match validation
    if (payload.tenantId && payload.tenantId !== context.tenantId) {
      return {
        valid: false,
        error: `Không thể tạo hoặc sửa bản ghi cho Tenant [${payload.tenantId}] khác với Tenant hiện tại [${context.tenantId}].`
      };
    }

    // 2. Branch scope validation for non-company-wide users
    if (
      (context.dataScope === 'BRANCH' || context.dataScope === 'WAREHOUSE' || context.dataScope === 'INDIVIDUAL') &&
      payload.branchId &&
      !context.branchIds.includes(payload.branchId)
    ) {
      return {
        valid: false,
        error: `Bạn không có quyền thao tác trên Chi nhánh [${payload.branchId}]. Danh sách hợp lệ: [${context.branchIds.join(', ')}].`
      };
    }

    // 3. Warehouse scope validation for warehouse-level users
    if (
      context.dataScope === 'WAREHOUSE' &&
      payload.warehouseId &&
      !context.warehouseIds.includes(payload.warehouseId)
    ) {
      return {
        valid: false,
        error: `Bạn không có quyền thao tác trên Kho hàng [${payload.warehouseId}]. Danh sách hợp lệ: [${context.warehouseIds.join(', ')}].`
      };
    }

    return { valid: true };
  }

  /**
   * Constructs standardized filter criteria for database queries
   */
  static buildQueryFilter(context: SecurityUserContext): DataScopeFilterCriteria {
    const filter: DataScopeFilterCriteria = {
      tenantId: context.tenantId
    };

    switch (context.dataScope) {
      case 'BRANCH':
        filter.branchId = context.branchIds;
        break;
      case 'WAREHOUSE':
        filter.warehouseId = context.warehouseIds;
        break;
      case 'INDIVIDUAL':
        filter.createdBy = context.userId;
        filter.assignedTo = context.userId;
        break;
    }

    return filter;
  }
}
