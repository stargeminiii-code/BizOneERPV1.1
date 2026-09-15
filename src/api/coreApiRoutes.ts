import { Router } from 'express';
import { TenantService } from '../services/tenant/tenantService';
import { UserService } from '../services/users/userService';
import { RoleService } from '../services/roles/roleService';
import { PermissionRegistryService } from '../services/permissions/permissionRegistry';
import { AuditLogService } from '../services/audit/auditLogService';
import { requireCorePermission, AuthenticatedCoreRequest } from '../middleware/authorization';
import { enforceDataScopeMutation } from '../middleware/dataScopeMiddleware';
import { runCoreBackendUnitTests } from '../services/coreBackendVerification';
import { FadMigrationService, FadMigrationManifestInput } from '../services/migration/fadMigrationService';
import { FadBizOneDomainAdapter } from '../services/migration/fadBizOneDomainAdapter';

export function createCoreApiRouter(authenticateToken: any): Router {
  const router = Router();
  router.get('/context', authenticateToken, (req: AuthenticatedCoreRequest, res) => {
    const userPayload = req.user;
    if (!userPayload || !userPayload.uid) return res.status(401).json({ success: false, error: 'Chưa đăng nhập' });
    const tenantId = userPayload.tenantId || userPayload.tenant || 'tenant-household-01';
    const context = UserService.buildSecurityContext(tenantId, userPayload.uid);
    if (!context) return res.json({ success: true, context: { userId: userPayload.uid, tenantId, roleCode: userPayload.role || 'STAFF', dataScope: 'COMPANY_WIDE', permissions: ['*'], branchIds: ['BR01', 'BR02', 'BR03'], warehouseIds: ['WH01', 'WH02', 'WH03', 'WH04'] } });
    return res.json({ success: true, context: { ...context, permissions: Array.from(context.permissions) } });
  });
  router.get('/tenant', authenticateToken, (req: AuthenticatedCoreRequest, res) => { const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01'; const tenant = TenantService.getTenant(tenantId); if (!tenant) return res.status(404).json({ success: false, error: 'Không tìm thấy Tenant' }); return res.json({ success: true, tenant }); });
  router.put('/tenant', authenticateToken, requireCorePermission('tenant.update'), enforceDataScopeMutation(), (req: AuthenticatedCoreRequest, res) => { const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01'; const result = TenantService.updateTenant(tenantId, req.body, req.user?.uid); if (!result.success) return res.status(400).json({ success: false, error: result.error }); return res.json({ success: true, tenant: result.tenant }); });
  router.get('/branches', authenticateToken, (req: AuthenticatedCoreRequest, res) => { const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01'; return res.json({ success: true, branches: TenantService.getTenantBranches(tenantId) }); });
  router.post('/branches', authenticateToken, requireCorePermission('branch.create'), enforceDataScopeMutation(), (req: AuthenticatedCoreRequest, res) => { const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01'; const result = TenantService.createBranch(tenantId, req.body, req.user?.uid); if (!result.success) return res.status(400).json({ success: false, error: result.error }); return res.json({ success: true, branch: result.branch }); });
  router.get('/warehouses', authenticateToken, (req: AuthenticatedCoreRequest, res) => { const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01'; const branchId = req.query.branchId as string | undefined; const warehouses = branchId ? TenantService.getBranchWarehouses(tenantId, branchId) : TenantService.getTenantWarehouses(tenantId); return res.json({ success: true, warehouses }); });
  router.post('/warehouses', authenticateToken, requireCorePermission('warehouse.create'), enforceDataScopeMutation(), (req: AuthenticatedCoreRequest, res) => { const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01'; const result = TenantService.createWarehouse(tenantId, req.body, req.user?.uid); if (!result.success) return res.status(400).json({ success: false, error: result.error }); return res.json({ success: true, warehouse: result.warehouse }); });
  router.get('/users', authenticateToken, requireCorePermission('user.view'), (req: AuthenticatedCoreRequest, res) => { const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01'; return res.json({ success: true, users: UserService.getUsersByTenant(tenantId) }); });
  router.post('/users', authenticateToken, requireCorePermission('user.create'), enforceDataScopeMutation(), (req: AuthenticatedCoreRequest, res) => { const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01'; const result = UserService.createUser(tenantId, req.body, req.securityContext!); if (!result.success) return res.status(400).json({ success: false, error: result.error }); return res.json({ success: true, user: result.user }); });
  router.get('/roles', authenticateToken, (req: AuthenticatedCoreRequest, res) => res.json({ success: true, roles: RoleService.getSystemRoles() }));
  router.get('/permissions', authenticateToken, (req: AuthenticatedCoreRequest, res) => res.json({ success: true, permissions: PermissionRegistryService.getAllPermissions() }));
  router.get('/audit-logs', authenticateToken, (req: AuthenticatedCoreRequest, res) => { const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01'; const module = req.query.module as string | undefined; const entityType = req.query.entityType as string | undefined; const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50; return res.json({ success: true, logs: AuditLogService.getAuditHistory(tenantId, { module, entityType, limit }) }); });

  router.post('/fad-migrations/validate', authenticateToken, requireCorePermission('migration.fad.validate'), (req: AuthenticatedCoreRequest, res) => { const validation = FadMigrationService.validateManifest(req.body as FadMigrationManifestInput); return res.status(validation.valid ? 200 : 422).json({ success: validation.valid, validation }); });

  router.post('/fad-migrations/import', authenticateToken, requireCorePermission('migration.fad.import'), enforceDataScopeMutation(), (req: AuthenticatedCoreRequest, res) => {
    const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01';
    const userId = req.user?.uid || 'unknown';
    const manifest = req.body as FadMigrationManifestInput;
    const result = FadMigrationService.importManifest(tenantId, userId, manifest);
    if (!result.success) return res.status(422).json({ success: false, migration: result.migration });
    let adapterResult;
    try {
      adapterResult = FadBizOneDomainAdapter.importRecords(tenantId, manifest.records);
    } catch (error) {
      adapterResult = { imported: 0, skipped: 0, products: 0, variants: 0, inventoryLayers: 0, warnings: [error instanceof Error ? error.message : 'Domain adapter failed'] };
    }
    result.migration.domainCounts = { ...(result.migration.domainCounts || {}), bizoneProducts: adapterResult.products, bizoneVariants: adapterResult.variants, bizoneInventoryLayers: adapterResult.inventoryLayers };
    AuditLogService.log(tenantId, userId, 'IMPORT', 'migration', 'FAD_MIGRATION', result.migration.migrationId, { sourceSystem: 'FAD', importedCount: result.migration.importedCount, skippedCount: result.migration.skippedCount, bizoneProducts: adapterResult.products, bizoneVariants: adapterResult.variants, bizoneInventoryLayers: adapterResult.inventoryLayers, warnings: adapterResult.warnings });
    return res.json({ success: true, migration: result.migration, adapter: adapterResult });
  });

  router.get('/fad-migrations/history', authenticateToken, requireCorePermission('migration.fad.view'), (req: AuthenticatedCoreRequest, res) => { const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01'; const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50; return res.json({ success: true, history: FadMigrationService.getHistory(tenantId, limit) }); });
  router.get('/fad-migrations/records', authenticateToken, requireCorePermission('migration.fad.view'), (req: AuthenticatedCoreRequest, res) => { const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01'; const migrationId = req.query.migrationId as string | undefined; const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 500; return res.json({ success: true, records: FadMigrationService.getImportedRecords(tenantId, migrationId, limit) }); });
  router.get('/fad-migrations/domain-records', authenticateToken, requireCorePermission('migration.fad.view'), (req: AuthenticatedCoreRequest, res) => { const tenantId = req.user?.tenantId || req.user?.tenant || 'tenant-household-01'; const domain = String(req.query.domain || ''); const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 500; return res.json({ success: true, domain, records: FadMigrationService.getDomainRecords(tenantId, domain, limit) }); });
  router.post('/tests/run', (req, res) => { const testReport = runCoreBackendUnitTests(); return res.json({ success: testReport.failed === 0, report: testReport }); });
  return router;
}
