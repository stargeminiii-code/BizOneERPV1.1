import { Response, NextFunction } from 'express';
import { AuthenticatedCoreRequest } from './authorization';
import { DataScopeEngine } from '../services/dataScope/dataScopeEngine';
import { AuditLogRepository } from '../repositories/auditLogRepository';
import { UserService } from '../services/users/userService';

/**
 * Middleware: Enforce Server-Side Data Scope on Mutations (POST, PUT, PATCH, DELETE)
 * Prevents clients from spoofing tenantId, branchId, or warehouseId
 */
export function enforceDataScopeMutation() {
  return (req: AuthenticatedCoreRequest, res: Response, next: NextFunction) => {
    // 1. Resolve security context if not already attached
    if (!req.securityContext) {
      const userPayload = req.user;
      if (!userPayload || !userPayload.uid) {
        return res.status(401).json({
          success: false,
          errorType: 'UNAUTHORIZED',
          error: 'Yêu cầu đăng nhập trước khi thao tác dữ liệu'
        });
      }

      if (userPayload.role === 'super_admin') {
        return next();
      }

      const tenantId = userPayload.tenantId || userPayload.tenant || 'tenant-household-01';
      const ctx = UserService.buildSecurityContext(tenantId, userPayload.uid);
      if (!ctx) {
        return res.status(403).json({
          success: false,
          errorType: 'FORBIDDEN',
          error: 'Không tìm thấy ngữ cảnh bảo mật hợp lệ cho tài khoản'
        });
      }
      req.securityContext = ctx;
    }

    const context = req.securityContext;

    // 2. Extract payload coordinates
    const targetTenantId = req.body?.tenantId || req.params?.tenantId || req.query?.tenantId;
    const targetBranchId = req.body?.branchId || req.params?.branchId || req.query?.branchId;
    const targetWarehouseId = req.body?.warehouseId || req.params?.warehouseId || req.query?.warehouseId;

    const validation = DataScopeEngine.validateMutation(context, {
      tenantId: targetTenantId ? String(targetTenantId) : undefined,
      branchId: targetBranchId ? String(targetBranchId) : undefined,
      warehouseId: targetWarehouseId ? String(targetWarehouseId) : undefined
    });

    if (!validation.valid) {
      AuditLogRepository.record({
        tenantId: context.tenantId,
        userId: context.userId,
        action: 'SCOPE_VIOLATION_BLOCKED',
        module: 'security',
        entityType: 'MUTATION_TARGET',
        entityId: targetTenantId || targetBranchId || targetWarehouseId || 'UNKNOWN',
        metadata: {
          error: validation.error,
          payload: { targetTenantId, targetBranchId, targetWarehouseId },
          userScope: context.dataScope,
          userBranches: context.branchIds,
          userWarehouses: context.warehouseIds
        },
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        errorType: 'DATA_SCOPE_VIOLATION',
        error: validation.error || 'Thao tác vi phạm phạm vi phân quyền dữ liệu (DataScope).'
      });
    }

    // Force payload's tenantId to match authenticated context (Anti-tampering)
    if (req.body && typeof req.body === 'object') {
      req.body.tenantId = context.tenantId;
    }

    next();
  };
}
