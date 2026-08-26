import { TenantService } from './tenant/tenantService';
import { UserService } from './users/userService';
import { RoleService, CANONICAL_SYSTEM_ROLES } from './roles/roleService';
import { PermissionRegistryService } from './permissions/permissionRegistry';
import { DataScopeEngine } from './dataScope/dataScopeEngine';
import { AuditLogService } from './audit/auditLogService';
import { TenantRepository } from '../repositories/tenantRepository';
import { BranchRepository } from '../repositories/branchRepository';
import { WarehouseRepository } from '../repositories/warehouseRepository';
import { UserRepository } from '../repositories/userRepository';
import { AuditLogRepository } from '../repositories/auditLogRepository';

export function runCoreBackendUnitTests(): {
  total: number;
  passed: number;
  failed: number;
  results: { testName: string; passed: boolean; message?: string }[];
} {
  const results: { testName: string; passed: boolean; message?: string }[] = [];

  function recordTest(testName: string, fn: () => void) {
    try {
      fn();
      results.push({ testName, passed: true });
    } catch (err: any) {
      results.push({ testName, passed: false, message: err.message || String(err) });
    }
  }

  // Reset repositories before test run
  TenantRepository.resetToDefault();
  BranchRepository.resetToDefault();
  WarehouseRepository.resetToDefault();
  UserRepository.resetToDefault();
  AuditLogRepository.clear();

  // =========================================================================
  // 1. TENANT ISOLATION TESTS
  // =========================================================================

  recordTest('1.1 Tenant Isolation: Tenant A cannot see Tenant B branches or warehouses', () => {
    const tenantA_Id = 'tenant-household-01';
    const tenantB_Id = 'tenant-company-02';

    const branchesA = TenantService.getTenantBranches(tenantA_Id);
    const branchesB = TenantService.getTenantBranches(tenantB_Id);

    if (branchesA.length === 0 || branchesB.length === 0) {
      throw new Error('Branches not loaded for tenants');
    }

    // Verify all branches in A have tenantId === tenantA_Id
    for (const b of branchesA) {
      if (b.tenantId !== tenantA_Id) {
        throw new Error(`Branch ${b.branchId} from Tenant A has invalid tenantId: ${b.tenantId}`);
      }
    }

    // Verify branches from B are completely absent in A
    const branchA_Ids = branchesA.map((b) => b.branchId);
    for (const b of branchesB) {
      if (branchA_Ids.includes(b.branchId)) {
        throw new Error(`Tenant B branch ${b.branchId} leaked into Tenant A!`);
      }
    }
  });

  recordTest('1.2 Tenant Isolation: User of Tenant A cannot access Tenant B resources via DataScopeEngine', () => {
    const userAContext = UserService.buildSecurityContext('tenant-household-01', 'usr-owner-01');
    if (!userAContext) throw new Error('Failed to build context for usr-owner-01');

    const tenantB_Entity = {
      tenantId: 'tenant-company-02',
      branchId: 'BR-COMP-01',
      warehouseId: 'WH-COMP-01'
    };

    const access = DataScopeEngine.canAccess(userAContext, tenantB_Entity);
    if (access.allowed) {
      throw new Error('DataScopeEngine illegally allowed cross-tenant access to Tenant B resource!');
    }
  });

  recordTest('1.3 Tenant Creation: Supports HOUSEHOLD_BUSINESS, COMPANY, and INDIVIDUAL', () => {
    const resHousehold = TenantService.createTenant({
      tenantId: 't-test-hh',
      businessName: 'Hộ Kinh Doanh Test 1',
      businessType: 'HOUSEHOLD_BUSINESS',
      taxCode: '8880001111'
    });
    if (!resHousehold.success || resHousehold.tenant?.businessType !== 'HOUSEHOLD_BUSINESS') {
      throw new Error('Failed to create HOUSEHOLD_BUSINESS tenant');
    }

    const resCompany = TenantService.createTenant({
      tenantId: 't-test-comp',
      businessName: 'Công Ty Test 2',
      businessType: 'COMPANY',
      taxCode: '8880002222'
    });
    if (!resCompany.success || resCompany.tenant?.businessType !== 'COMPANY') {
      throw new Error('Failed to create COMPANY tenant');
    }

    const resIndiv = TenantService.createTenant({
      tenantId: 't-test-indiv',
      businessName: 'Cá Nhân Kinh Doanh Test 3',
      businessType: 'INDIVIDUAL',
      taxCode: '8880003333'
    });
    if (!resIndiv.success || resIndiv.tenant?.businessType !== 'INDIVIDUAL') {
      throw new Error('Failed to create INDIVIDUAL tenant');
    }
  });

  // =========================================================================
  // 2. BRANCH ISOLATION TESTS
  // =========================================================================

  recordTest('2.1 Branch Isolation: Branch Manager scoped to BR01 cannot access BR02 records', () => {
    const mgrContext = UserService.buildSecurityContext('tenant-household-01', 'usr-admin-01');
    if (!mgrContext) throw new Error('Failed to build context for usr-admin-01');

    if (mgrContext.dataScope !== 'BRANCH') {
      throw new Error(`Expected dataScope to be BRANCH, got ${mgrContext.dataScope}`);
    }

    const entityBR01 = { tenantId: 'tenant-household-01', branchId: 'BR01' };
    const entityBR02 = { tenantId: 'tenant-household-01', branchId: 'BR02' };

    const accessBR01 = DataScopeEngine.canAccess(mgrContext, entityBR01);
    const accessBR02 = DataScopeEngine.canAccess(mgrContext, entityBR02);

    if (!accessBR01.allowed) {
      throw new Error('Manager denied access to own assigned branch BR01');
    }
    if (accessBR02.allowed) {
      throw new Error('Manager illegally allowed access to unassigned branch BR02');
    }
  });

  recordTest('2.2 Branch Mutation: User cannot spoof unassigned branch in payload', () => {
    const mgrContext = UserService.buildSecurityContext('tenant-household-01', 'usr-admin-01')!;
    
    const mutValid = DataScopeEngine.validateMutation(mgrContext, {
      tenantId: 'tenant-household-01',
      branchId: 'BR01'
    });
    if (!mutValid.valid) {
      throw new Error(`Valid mutation was rejected: ${mutValid.error}`);
    }

    const mutInvalid = DataScopeEngine.validateMutation(mgrContext, {
      tenantId: 'tenant-household-01',
      branchId: 'BR02'
    });
    if (mutInvalid.valid) {
      throw new Error('Branch scope violation mutation was illegally accepted!');
    }
  });

  // =========================================================================
  // 3. WAREHOUSE ISOLATION TESTS
  // =========================================================================

  recordTest('3.1 Warehouse Isolation: Warehouse staff scoped to WH01/WH02 cannot access WH03/WH04', () => {
    const whStaffContext = UserService.buildSecurityContext('tenant-household-01', 'usr-kho-01');
    if (!whStaffContext) throw new Error('Failed to build context for usr-kho-01');

    const entityWH01 = { tenantId: 'tenant-household-01', branchId: 'BR01', warehouseId: 'WH01' };
    const entityWH03 = { tenantId: 'tenant-household-01', branchId: 'BR02', warehouseId: 'WH03' };

    const accessWH01 = DataScopeEngine.canAccess(whStaffContext, entityWH01);
    const accessWH03 = DataScopeEngine.canAccess(whStaffContext, entityWH03);

    if (!accessWH01.allowed) {
      throw new Error('Warehouse staff denied access to assigned warehouse WH01');
    }
    if (accessWH03.allowed) {
      throw new Error('Warehouse staff illegally allowed access to unassigned warehouse WH03');
    }
  });

  // =========================================================================
  // 4. ROLE & PERMISSION RBAC TESTS
  // =========================================================================

  recordTest('4.1 Canonical Roles & Permissions: Owner has all permissions', () => {
    const ownerRole = CANONICAL_SYSTEM_ROLES.OWNER;
    const allPerms = PermissionRegistryService.getAllPermissions();

    for (const p of allPerms) {
      if (!RoleService.hasPermission(ownerRole, p.key)) {
        throw new Error(`Owner missing permission: ${p.key}`);
      }
    }
  });

  recordTest('4.2 Role Permission: Sales has order & crm permissions, but lacks finance.approve or product.delete', () => {
    const salesRole = CANONICAL_SYSTEM_ROLES.SALES;

    if (!RoleService.hasPermission(salesRole, 'order.create')) {
      throw new Error('Sales should have order.create permission');
    }
    if (!RoleService.hasPermission(salesRole, 'crm.create')) {
      throw new Error('Sales should have crm.create permission');
    }

    if (RoleService.hasPermission(salesRole, 'finance.approve')) {
      throw new Error('Sales should NOT have finance.approve permission');
    }
    if (RoleService.hasPermission(salesRole, 'product.delete')) {
      throw new Error('Sales should NOT have product.delete permission');
    }
  });

  recordTest('4.3 Role Permission: Warehouse Staff has inventory.create & inventory.stocktake, lacks finance.create', () => {
    const whRole = CANONICAL_SYSTEM_ROLES.WAREHOUSE_STAFF;

    if (!RoleService.hasPermission(whRole, 'inventory.create')) {
      throw new Error('Warehouse staff should have inventory.create');
    }
    if (!RoleService.hasPermission(whRole, 'inventory.stocktake')) {
      throw new Error('Warehouse staff should have inventory.stocktake');
    }
    if (RoleService.hasPermission(whRole, 'finance.create')) {
      throw new Error('Warehouse staff should NOT have finance.create');
    }
  });

  // =========================================================================
  // 5. DATA SCOPE HIERARCHY TESTS
  // =========================================================================

  recordTest('5.1 Data Scope: Individual scope only matches records where createdBy or assignedTo matches userId', () => {
    const salesContext = UserService.buildSecurityContext('tenant-household-01', 'usr-sales-01');
    if (!salesContext) throw new Error('Failed to build context for usr-sales-01');

    const ownRecord = {
      tenantId: 'tenant-household-01',
      createdBy: 'usr-sales-01'
    };
    const assignedRecord = {
      tenantId: 'tenant-household-01',
      assignedTo: 'usr-sales-01'
    };
    const otherRecord = {
      tenantId: 'tenant-household-01',
      createdBy: 'usr-admin-01',
      assignedTo: 'usr-admin-01'
    };

    if (!DataScopeEngine.canAccess(salesContext, ownRecord).allowed) {
      throw new Error('Sales user denied access to own created record');
    }
    if (!DataScopeEngine.canAccess(salesContext, assignedRecord).allowed) {
      throw new Error('Sales user denied access to assigned record');
    }
    if (DataScopeEngine.canAccess(salesContext, otherRecord).allowed) {
      throw new Error('Sales user illegally allowed access to other user individual record');
    }
  });

  // =========================================================================
  // 6. AUDIT LOGGING TESTS
  // =========================================================================

  recordTest('6.1 Audit Logging: Logs tenant actions and security violations', () => {
    AuditLogService.log(
      'tenant-household-01',
      'usr-owner-01',
      'ORDER_CREATED',
      'order',
      'ORDER',
      'ORD-2026-001',
      { totalAmount: 500000 }
    );

    const history = AuditLogService.getAuditHistory('tenant-household-01');
    const entry = history.find((h) => h.entityId === 'ORD-2026-001');

    if (!entry) {
      throw new Error('Audit log entry was not found in tenant history');
    }
    if (entry.action !== 'ORDER_CREATED' || entry.tenantId !== 'tenant-household-01') {
      throw new Error('Audit log entry corrupted');
    }
  });

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = total - passed;

  return { total, passed, failed, results };
}
