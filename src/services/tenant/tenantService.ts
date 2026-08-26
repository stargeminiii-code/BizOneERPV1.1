import { TenantCore, BranchCore, WarehouseCore, TenantBusinessType } from '../../types';
import { TenantRepository } from '../../repositories/tenantRepository';
import { BranchRepository } from '../../repositories/branchRepository';
import { WarehouseRepository } from '../../repositories/warehouseRepository';
import { AuditLogRepository } from '../../repositories/auditLogRepository';

export class TenantService {
  static getTenant(tenantId: string): TenantCore | null {
    return TenantRepository.findById(tenantId);
  }

  static getAllTenants(): TenantCore[] {
    return TenantRepository.findAll();
  }

  static createTenant(data: {
    tenantId: string;
    businessName: string;
    businessType: TenantBusinessType;
    taxCode?: string;
    phone?: string;
    email?: string;
    address?: string;
  }): { success: boolean; tenant?: TenantCore; error?: string } {
    if (!data.tenantId || !data.businessName || !data.businessType) {
      return { success: false, error: 'Thiếu thông tin bắt buộc: tenantId, businessName, businessType' };
    }

    const existing = TenantRepository.findById(data.tenantId);
    if (existing) {
      return { success: false, error: `Tenant ID [${data.tenantId}] đã tồn tại` };
    }

    if (data.taxCode) {
      const existingTax = TenantRepository.findByTaxCode(data.taxCode);
      if (existingTax) {
        return { success: false, error: `Mã số thuế [${data.taxCode}] đã được đăng ký bởi Tenant khác` };
      }
    }

    const newTenant = TenantRepository.create({
      tenantId: data.tenantId,
      businessName: data.businessName,
      businessType: data.businessType,
      taxCode: data.taxCode,
      phone: data.phone,
      email: data.email,
      address: data.address,
      status: 'active'
    });

    // Automatically create Default Primary Branch & Main Warehouse for new Tenant
    const defaultBranchId = `BR-${data.tenantId}-01`;
    const defaultBranch = BranchRepository.create(data.tenantId, {
      branchId: defaultBranchId,
      code: 'CN-CHINH',
      name: `Chi nhánh Chính - ${data.businessName}`,
      address: data.address || 'Trụ sở chính',
      phone: data.phone || '',
      status: 'active',
      isMain: true
    });

    WarehouseRepository.create(data.tenantId, {
      warehouseId: `WH-${data.tenantId}-01`,
      branchId: defaultBranch.branchId,
      code: 'KHO-TONG',
      name: `Kho Tổng - ${data.businessName}`,
      type: 'MAIN_WAREHOUSE',
      status: 'active'
    });

    AuditLogRepository.record({
      tenantId: data.tenantId,
      userId: 'SYSTEM',
      action: 'TENANT_CREATED',
      module: 'tenant',
      entityType: 'TENANT',
      entityId: data.tenantId,
      metadata: { businessName: data.businessName, businessType: data.businessType }
    });

    return { success: true, tenant: newTenant };
  }

  static updateTenant(
    tenantId: string,
    updates: Partial<Omit<TenantCore, 'tenantId' | 'createdAt' | 'updatedAt'>>,
    actorId = 'SYSTEM'
  ): { success: boolean; tenant?: TenantCore; error?: string } {
    const updated = TenantRepository.update(tenantId, updates);
    if (!updated) {
      return { success: false, error: `Không tìm thấy Tenant [${tenantId}]` };
    }

    AuditLogRepository.record({
      tenantId,
      userId: actorId,
      action: 'TENANT_UPDATED',
      module: 'tenant',
      entityType: 'TENANT',
      entityId: tenantId,
      metadata: updates
    });

    return { success: true, tenant: updated };
  }

  // Branch operations scoped to Tenant
  static getTenantBranches(tenantId: string): BranchCore[] {
    return BranchRepository.findByTenantId(tenantId);
  }

  static getTenantBranch(tenantId: string, branchId: string): BranchCore | null {
    return BranchRepository.findById(tenantId, branchId);
  }

  static createBranch(
    tenantId: string,
    data: {
      branchId: string;
      code: string;
      name: string;
      address: string;
      phone: string;
      managerId?: string;
    },
    actorId = 'SYSTEM'
  ): { success: boolean; branch?: BranchCore; error?: string } {
    const tenant = TenantRepository.findById(tenantId);
    if (!tenant) {
      return { success: false, error: `Tenant [${tenantId}] không tồn tại` };
    }

    const existingCode = BranchRepository.findByCode(tenantId, data.code);
    if (existingCode) {
      return { success: false, error: `Mã chi nhánh [${data.code}] đã tồn tại trong Tenant` };
    }

    const branch = BranchRepository.create(tenantId, {
      ...data,
      status: 'active',
      isMain: false
    });

    AuditLogRepository.record({
      tenantId,
      userId: actorId,
      action: 'BRANCH_CREATED',
      module: 'branch',
      entityType: 'BRANCH',
      entityId: branch.branchId,
      metadata: { code: branch.code, name: branch.name }
    });

    return { success: true, branch };
  }

  // Warehouse operations scoped to Tenant
  static getTenantWarehouses(tenantId: string): WarehouseCore[] {
    return WarehouseRepository.findByTenantId(tenantId);
  }

  static getBranchWarehouses(tenantId: string, branchId: string): WarehouseCore[] {
    return WarehouseRepository.findByBranchId(tenantId, branchId);
  }

  static getTenantWarehouse(tenantId: string, warehouseId: string): WarehouseCore | null {
    return WarehouseRepository.findById(tenantId, warehouseId);
  }

  static createWarehouse(
    tenantId: string,
    data: {
      warehouseId: string;
      branchId: string;
      code: string;
      name: string;
      type: WarehouseCore['type'];
      managerId?: string;
    },
    actorId = 'SYSTEM'
  ): { success: boolean; warehouse?: WarehouseCore; error?: string } {
    const branch = BranchRepository.findById(tenantId, data.branchId);
    if (!branch) {
      return { success: false, error: `Chi nhánh [${data.branchId}] không tồn tại trong Tenant [${tenantId}]` };
    }

    const existingCode = WarehouseRepository.findByCode(tenantId, data.code);
    if (existingCode) {
      return { success: false, error: `Mã kho [${data.code}] đã tồn tại trong Tenant` };
    }

    const warehouse = WarehouseRepository.create(tenantId, {
      ...data,
      status: 'active'
    });

    AuditLogRepository.record({
      tenantId,
      userId: actorId,
      action: 'WAREHOUSE_CREATED',
      module: 'warehouse',
      entityType: 'WAREHOUSE',
      entityId: warehouse.warehouseId,
      metadata: { code: warehouse.code, name: warehouse.name, branchId: data.branchId }
    });

    return { success: true, warehouse };
  }
}
