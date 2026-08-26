import { WarehouseCore, WarehouseCoreType } from '../types';

export const INITIAL_WAREHOUSES: WarehouseCore[] = [
  // Tenant Household 01 Warehouses
  {
    warehouseId: 'WH01',
    tenantId: 'tenant-household-01',
    branchId: 'BR01',
    name: 'Kho Tổng Hà Nội',
    code: 'KHO-HN-TONG',
    type: 'MAIN_WAREHOUSE',
    managerId: 'usr-kho-01',
    status: 'active',
    createdAt: '2026-01-01 08:00:00',
    updatedAt: '2026-01-01 08:00:00'
  },
  {
    warehouseId: 'WH02',
    tenantId: 'tenant-household-01',
    branchId: 'BR01',
    name: 'Kho Vật tư Phụ Hà Nội',
    code: 'KHO-HN-PHU',
    type: 'RAW_MATERIAL',
    managerId: 'usr-kho-01',
    status: 'active',
    createdAt: '2026-01-01 08:00:00',
    updatedAt: '2026-01-01 08:00:00'
  },
  {
    warehouseId: 'WH03',
    tenantId: 'tenant-household-01',
    branchId: 'BR02',
    name: 'Kho Tổng TP.HCM',
    code: 'KHO-HCM-TONG',
    type: 'MAIN_WAREHOUSE',
    managerId: 'usr-kho-02',
    status: 'active',
    createdAt: '2026-01-01 08:00:00',
    updatedAt: '2026-01-01 08:00:00'
  },
  {
    warehouseId: 'WH04',
    tenantId: 'tenant-household-01',
    branchId: 'BR03',
    name: 'Kho Đà Nẵng',
    code: 'KHO-DN-TONG',
    type: 'STORE_WAREHOUSE',
    managerId: 'usr-kho-03',
    status: 'active',
    createdAt: '2026-01-01 08:00:00',
    updatedAt: '2026-01-01 08:00:00'
  },
  // Tenant Company 02 Warehouse
  {
    warehouseId: 'WH-COMP-01',
    tenantId: 'tenant-company-02',
    branchId: 'BR-COMP-01',
    name: 'Kho Trung Tâm Logistics BizOne',
    code: 'KHO-COMP-LOGISTICS',
    type: 'FINISHED_GOODS',
    managerId: 'usr-comp-wh-01',
    status: 'active',
    createdAt: '2026-01-10 09:00:00',
    updatedAt: '2026-01-10 09:00:00'
  }
];

export class WarehouseRepository {
  private static warehouses: Map<string, WarehouseCore> = new Map(
    INITIAL_WAREHOUSES.map((w) => [`${w.tenantId}:${w.warehouseId}`, { ...w }])
  );

  static findById(tenantId: string, warehouseId: string): WarehouseCore | null {
    const key = `${tenantId}:${warehouseId}`;
    const wh = this.warehouses.get(key);
    return wh ? { ...wh } : null;
  }

  static findByTenantId(tenantId: string): WarehouseCore[] {
    const result: WarehouseCore[] = [];
    for (const w of this.warehouses.values()) {
      if (w.tenantId === tenantId) {
        result.push({ ...w });
      }
    }
    return result;
  }

  static findByBranchId(tenantId: string, branchId: string): WarehouseCore[] {
    const result: WarehouseCore[] = [];
    for (const w of this.warehouses.values()) {
      if (w.tenantId === tenantId && w.branchId === branchId) {
        result.push({ ...w });
      }
    }
    return result;
  }

  static findByCode(tenantId: string, code: string): WarehouseCore | null {
    for (const w of this.warehouses.values()) {
      if (w.tenantId === tenantId && w.code.toUpperCase() === code.toUpperCase()) {
        return { ...w };
      }
    }
    return null;
  }

  static create(
    tenantId: string,
    data: Omit<WarehouseCore, 'tenantId' | 'createdAt' | 'updatedAt'>
  ): WarehouseCore {
    const now = new Date().toISOString();
    const newWh: WarehouseCore = {
      ...data,
      tenantId,
      createdAt: now,
      updatedAt: now
    };
    const key = `${tenantId}:${newWh.warehouseId}`;
    this.warehouses.set(key, newWh);
    return { ...newWh };
  }

  static update(
    tenantId: string,
    warehouseId: string,
    updates: Partial<Omit<WarehouseCore, 'warehouseId' | 'tenantId' | 'createdAt'>>
  ): WarehouseCore | null {
    const key = `${tenantId}:${warehouseId}`;
    const existing = this.warehouses.get(key);
    if (!existing) return null;

    const updated: WarehouseCore = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.warehouses.set(key, updated);
    return { ...updated };
  }

  static delete(tenantId: string, warehouseId: string): boolean {
    const key = `${tenantId}:${warehouseId}`;
    return this.warehouses.delete(key);
  }

  static resetToDefault(): void {
    this.warehouses = new Map(
      INITIAL_WAREHOUSES.map((w) => [`${w.tenantId}:${w.warehouseId}`, { ...w }])
    );
  }
}
