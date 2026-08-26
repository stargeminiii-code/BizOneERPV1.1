import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/users/userService';
import { PermissionRegistryService } from '../services/permissions/permissionRegistry';
import { RoleService } from '../services/roles/roleService';
import { AuditLogRepository } from '../repositories/auditLogRepository';
import { SecurityUserContext } from '../types';

export interface AuthenticatedCoreRequest extends Request {
  user?: {
    uid: string;
    username: string;
    role: string;
    tenant: string;
    tenantId?: string;
    branchId?: string;
    dataScope?: string;
  };
  securityContext?: SecurityUserContext;
}

/**
 * Middleware: Require Canonical Permission ('module.action')
 * e.g. requireCorePermission('order.create')
 */
export function requireCorePermission(permissionKey: string) {
  return (req: AuthenticatedCoreRequest, res: Response, next: NextFunction) => {
    const userPayload = req.user;
    if (!userPayload || !userPayload.uid) {
      return res.status(401).json({
        success: false,
        errorType: 'UNAUTHORIZED',
        error: 'Yêu cầu xác thực tài khoản trước khi truy cập tài nguyên'
      });
    }

    const tenantId = userPayload.tenantId || userPayload.tenant || 'tenant-household-01';
    const securityContext = UserService.buildSecurityContext(tenantId, userPayload.uid);

    if (!securityContext) {
      // Fallback for platform super admin or custom token payload
      if (userPayload.role === 'super_admin') {
        return next();
      }

      return res.status(403).json({
        success: false,
        errorType: 'ACCOUNT_INACTIVE_OR_NOT_FOUND',
        error: 'Tài khoản không tồn tại hoặc đã bị vô hiệu hóa trong Tenant hiện tại'
      });
    }

    // Attach security context to request for downstream handlers & scope engine
    req.securityContext = securityContext;

    // Check permission
    const hasPerm =
      securityContext.roleCode === 'OWNER' ||
      securityContext.permissions.has(permissionKey) ||
      securityContext.permissions.has('*');

    if (!hasPerm) {
      // Log unauthorized attempt in Audit Log
      AuditLogRepository.record({
        tenantId: securityContext.tenantId,
        userId: securityContext.userId,
        action: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        module: permissionKey.split('.')[0] || 'unknown',
        entityType: 'SECURITY_GATE',
        entityId: permissionKey,
        metadata: {
          requiredPermission: permissionKey,
          userRole: securityContext.roleCode,
          userPermissions: Array.from(securityContext.permissions)
        },
        ip: req.ip
      });

      return res.status(403).json({
        success: false,
        errorType: 'FORBIDDEN',
        error: `Truy cập bị từ chối: Cần quyền '${permissionKey}' để thực hiện hành động này.`
      });
    }

    next();
  };
}
