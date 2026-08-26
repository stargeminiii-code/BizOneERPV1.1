import { BranchCore } from '../types';

export const INITIAL_BRANCHES: BranchCore[] = [
  // Tenant Household 01 Branches
  {
    branchId: 'BR01',
    tenantId: 'tenant-household-01',
    code: 'CN-HN',
    name: 'Chi nhánh Chính - Hà Nội',
    address: 'Số 18 Phạm Hùng, Cầu Giấy, Hà Nội',
    phone: '024 3888 9999',
    managerId: 'usr-admin-01',
    status: 'active',
    isMain: true,
    createdAt: '2026-01-01 08:00:00',
    updatedAt: '2026-01-01 08:00:00'
  },
  {
    branchId: 'BR02',
    tenantId: 'tenant-household-01',
    code: 'CN-HCM',
    name: 'Chi nhánh Miền Nam - TP.HCM',
    address: 'Số 120 Quốc Lộ 1A, Bình Tân, TP.HCM',
    phone: '028 3777 8888',
    managerId: 'usr-kho-02',
    status: 'active',
    isMain: false,
    createdAt: '2026-01-01 08:00:00',
    updatedAt: '2026-01-01 08:00:00'
  },
  {
    branchId: 'BR03',
    tenantId: 'tenant-household-01',
    code: 'CN-DN',
    name: 'Chi nhánh Miền Trung - Đà Nẵng',
    address: 'KCN Hòa Khánh, Liên Chiểu, Đà Nẵng',
    phone: '0236 366 7777',
    managerId: 'usr-kho-03',
    status: 'active',
    isMain: false,
    createdAt: '2026-01-01 08:00:00',
    updatedAt: '2026-01-01 08:00:00'
  },
  // Tenant Company 02 Branches
  {
    branchId: 'BR-COMP-01',
    tenantId: 'tenant-company-02',
    code: 'CN-COMP-HCM',
    name: 'Trụ sở TP.HCM - BizOne Corp',
    address: 'Tòa nhà Landmark 81, Bình Thạnh, TP.HCM',
    phone: '028 9999 1234',
    managerId: 'usr-comp-mgr-01',
    status: 'active',
    isMain: true,
    createdAt: '2026-01-10 09:00:00',
    updatedAt: '2026-01-10 09:00:00'
  }
];

export class BranchRepository {
  private static branches: Map<string, BranchCore> = new Map(
    INITIAL_BRANCHES.map((b) => [`${b.tenantId}:${b.branchId}`, { ...b }])
  );

  static findById(tenantId: string, branchId: string): BranchCore | null {
    const key = `${tenantId}:${branchId}`;
    const branch = this.branches.get(key);
    return branch ? { ...branch } : null;
  }

  static findByTenantId(tenantId: string): BranchCore[] {
    const result: BranchCore[] = [];
    for (const b of this.branches.values()) {
      if (b.tenantId === tenantId) {
        result.push({ ...b });
      }
    }
    return result;
  }

  static findByCode(tenantId: string, code: string): BranchCore | null {
    for (const b of this.branches.values()) {
      if (b.tenantId === tenantId && b.code.toUpperCase() === code.toUpperCase()) {
        return { ...b };
      }
    }
    return null;
  }

  static create(
    tenantId: string,
    data: Omit<BranchCore, 'tenantId' | 'createdAt' | 'updatedAt'>
  ): BranchCore {
    const now = new Date().toISOString();
    const newBranch: BranchCore = {
      ...data,
      tenantId,
      createdAt: now,
      updatedAt: now
    };
    const key = `${tenantId}:${newBranch.branchId}`;
    this.branches.set(key, newBranch);
    return { ...newBranch };
  }

  static update(
    tenantId: string,
    branchId: string,
    updates: Partial<Omit<BranchCore, 'branchId' | 'tenantId' | 'createdAt'>>
  ): BranchCore | null {
    const key = `${tenantId}:${branchId}`;
    const existing = this.branches.get(key);
    if (!existing) return null;

    const updated: BranchCore = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.branches.set(key, updated);
    return { ...updated };
  }

  static delete(tenantId: string, branchId: string): boolean {
    const key = `${tenantId}:${branchId}`;
    return this.branches.delete(key);
  }

  static resetToDefault(): void {
    this.branches = new Map(
      INITIAL_BRANCHES.map((b) => [`${b.tenantId}:${b.branchId}`, { ...b }])
    );
  }
}
