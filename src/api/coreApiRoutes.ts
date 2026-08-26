import { Router } from 'express';
import { TenantService } from '../services/tenant/tenantService';
import { UserService } from '../services/users/userService';
import { RoleService } from '../services/roles/roleService';
import { PermissionRegistryService } from '../services/permissions/permissionRegistry';
import { AuditLogService } from '../services/audit/auditLogService';
import { requireCorePermission, AuthenticatedCoreRequest } from '../middleware/authorization';
import { enforceDataScopeMutation } from '../middleware/dataScopeMiddleware';
import { runCoreBackendUnitTests } from '../services/coreBackendVerification';

export function createCoreApiRouter(authenticateToken: any): Router {
  const router = Router();

  // 1. Current Security Context & Permissions Introspection
  router.get('/context', authenticateToken, (req: AuthenticatedCoreRequest, res) => {
    const userPayload = req.user;
    if (!userPayload || !userPayload.uid) {
      return res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
    }

    const tenantId = userPayload.tenantId || userPayload.tenant || 'tenant-household-01';
    const context = UserService.buildSecurityContext(tenantId, userPayload.uid);

    if (!context) {
      // Fallback for demo / super admin accounts
      return res.json({
        success: true,
        context: {
          userId: userPayload.uid,
          tenantId,
          roleCode: userPayload.role || 'STAFF',
          dataScope: 'COMPANY_WIDE',
          permissions: ['*'],
          branchIds: ['BR01', 'BR02', 'BR03'],
          warehouseIds: ['WH01', 'WH02', 'WH03', 'WH04']
        }
      });
    }

    return res.json({
      success: true,
      context: {
        ...context,
        permissions: Array.from(context.permissions)
      }
    });
  });

  // 2. Tenant Profile & Settings
  router.get('/tenant', authenticateToken, (req: AuthenticatedCoreRequest, res) => {
    const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01';
    const tenant = TenantService.getTenant(tenantId);
    if (!tenant) {
      return res.status(404).json({ success: false, error: 'Không tìm thấy Tenant' });
    }
    return res.json({ success: true, tenant });
  });

  router.put(
    '/tenant',
    authenticateToken,
    requireCorePermission('tenant.update'),
    enforceDataScopeMutation(),
    (req: AuthenticatedCoreRequest, res) => {
      const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01';
      const result = TenantService.updateTenant(tenantId, req.body, req.user?.uid);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      return res.json({ success: true, tenant: result.tenant });
    }
  );

  // 3. Branches Scoped to Tenant
  router.get('/branches', authenticateToken, (req: AuthenticatedCoreRequest, res) => {
    const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01';
    const branches = TenantService.getTenantBranches(tenantId);
    return res.json({ success: true, branches });
  });

  router.post(
    '/branches',
    authenticateToken,
    requireCorePermission('branch.create'),
    enforceDataScopeMutation(),
    (req: AuthenticatedCoreRequest, res) => {
      const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01';
      const result = TenantService.createBranch(tenantId, req.body, req.user?.uid);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      return res.json({ success: true, branch: result.branch });
    }
  );

  // 4. Warehouses Scoped to Tenant
  router.get('/warehouses', authenticateToken, (req: AuthenticatedCoreRequest, res) => {
    const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01';
    const branchId = req.query.branchId as string | undefined;

    const warehouses = branchId
      ? TenantService.getBranchWarehouses(tenantId, branchId)
      : TenantService.getTenantWarehouses(tenantId);

    return res.json({ success: true, warehouses });
  });

  router.post(
    '/warehouses',
    authenticateToken,
    requireCorePermission('warehouse.create'),
    enforceDataScopeMutation(),
    (req: AuthenticatedCoreRequest, res) => {
      const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01';
      const result = TenantService.createWarehouse(tenantId, req.body, req.user?.uid);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      return res.json({ success: true, warehouse: result.warehouse });
    }
  );

  // 5. Users Scoped to Tenant
  router.get(
    '/users',
    authenticateToken,
    requireCorePermission('user.view'),
    (req: AuthenticatedCoreRequest, res) => {
      const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01';
      const users = UserService.getUsersByTenant(tenantId);
      return res.json({ success: true, users });
    }
  );

  router.post(
    '/users',
    authenticateToken,
    requireCorePermission('user.create'),
    enforceDataScopeMutation(),
    (req: AuthenticatedCoreRequest, res) => {
      const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01';
      const actorContext = req.securityContext!;
      const result = UserService.createUser(tenantId, req.body, actorContext);
      if (!result.success) {
        return res.status(400).json({ success: false, error: result.error });
      }
      return res.json({ success: true, user: result.user });
    }
  );

  // 6. Canonical Roles & Permissions Registry
  router.get('/roles', authenticateToken, (req: AuthenticatedCoreRequest, res) => {
    const roles = RoleService.getSystemRoles();
    return res.json({ success: true, roles });
  });

  router.get('/permissions', authenticateToken, (req: AuthenticatedCoreRequest, res) => {
    const permissions = PermissionRegistryService.getAllPermissions();
    return res.json({ success: true, permissions });
  });

  // 7. Audit Log History
  router.get('/audit-logs', authenticateToken, (req: AuthenticatedCoreRequest, res) => {
    const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01';
    const module = req.query.module as string | undefined;
    const entityType = req.query.entityType as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

    const logs = AuditLogService.getAuditHistory(tenantId, { module, entityType, limit });
    return res.json({ success: true, logs });
  });

  // 8. Automated Core Backend Verification Runner Endpoint
  router.post('/tests/run', (req, res) => {
    const testReport = runCoreBackendUnitTests();
    return res.json({
      success: testReport.failed === 0,
      report: testReport
    });
  });

  return router;
}
