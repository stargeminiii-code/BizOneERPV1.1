import { UserCore, UserCoreStatus } from '../types';

export const INITIAL_CORE_USERS: UserCore[] = [
  // Tenant Household 01 Users
  {
    userId: 'usr-owner-01',
    tenantId: 'tenant-household-01',
    name: 'Vũ Đức Đăng Khôi',
    email: 'contact@freshdangkhoi.com',
    phone: '0972377497',
    roleId: 'role-system-owner',
    branchIds: ['BR01', 'BR02', 'BR03'],
    warehouseIds: ['WH01', 'WH02', 'WH03', 'WH04'],
    status: 'active',
    createdAt: '2026-01-01 08:00:00',
    updatedAt: '2026-01-01 08:00:00'
  },
  {
    userId: 'usr-ceo-01',
    tenantId: 'tenant-household-01',
    name: 'Vũ Đức Đăng Khôi (CEO)',
    email: 'ceo@freshdangkhoi.com',
    phone: '0972377498',
    roleId: 'role-system-ceo',
    branchIds: ['BR01', 'BR02', 'BR03'],
    warehouseIds: ['WH01', 'WH02', 'WH03', 'WH04'],
    status: 'active',
    createdAt: '2026-01-01 08:00:00',
    updatedAt: '2026-01-01 08:00:00'
  },
  {
    userId: 'usr-admin-01',
    tenantId: 'tenant-household-01',
    name: 'Nguyễn Thu Thảo',
    email: 'admin@wiup.vn',
    phone: '0909123456',
    roleId: 'role-system-manager',
    branchIds: ['BR01'],
    warehouseIds: ['WH01', 'WH02'],
    status: 'active',
    createdAt: '2026-01-01 08:00:00',
    updatedAt: '2026-01-01 08:00:00'
  },
  {
    userId: 'usr-kho-01',
    tenantId: 'tenant-household-01',
    name: 'Nguyễn Văn An',
    email: 'kho.hanoi@wiup.vn',
    phone: '0912345678',
    roleId: 'role-system-warehouse-staff',
    branchIds: ['BR01'],
    warehouseIds: ['WH01', 'WH02'],
    status: 'active',
    createdAt: '2026-01-01 08:00:00',
    updatedAt: '2026-01-01 08:00:00'
  },
  {
    userId: 'usr-sales-01',
    tenantId: 'tenant-household-01',
    name: 'Trần Thị Bích',
    email: 'sales.bich@wiup.vn',
    phone: '0988112233',
    roleId: 'role-system-sales',
    branchIds: ['BR01'],
    warehouseIds: ['WH01'],
    status: 'active',
    createdAt: '2026-01-05 09:00:00',
    updatedAt: '2026-01-05 09:00:00'
  },
  {
    userId: 'usr-acc-01',
    tenantId: 'tenant-household-01',
    name: 'Lê Thu Hà',
    email: 'ketoan@wiup.vn',
    phone: '0977223344',
    roleId: 'role-system-accounting',
    branchIds: ['BR01', 'BR02', 'BR03'],
    warehouseIds: ['WH01', 'WH02', 'WH03', 'WH04'],
    status: 'active',
    createdAt: '2026-01-05 09:00:00',
    updatedAt: '2026-01-05 09:00:00'
  },
  // Tenant Company 02 User (Isolate test)
  {
    userId: 'usr-comp-owner-02',
    tenantId: 'tenant-company-02',
    name: 'Đặng Minh Quân',
    email: 'quan.dang@bizone.vn',
    phone: '0933445566',
    roleId: 'role-system-owner',
    branchIds: ['BR-COMP-01'],
    warehouseIds: ['WH-COMP-01'],
    status: 'active',
    createdAt: '2026-01-10 09:00:00',
    updatedAt: '2026-01-10 09:00:00'
  }
];

export class UserRepository {
  private static users: Map<string, UserCore> = new Map(
    INITIAL_CORE_USERS.map((u) => [`${u.tenantId}:${u.userId}`, { ...u }])
  );

  static findById(tenantId: string, userId: string): UserCore | null {
    const key = `${tenantId}:${userId}`;
    const u = this.users.get(key);
    return u ? { ...u } : null;
  }

  static findByEmail(tenantId: string, email: string): UserCore | null {
    const cleanEmail = email.trim().toLowerCase();
    for (const u of this.users.values()) {
      if (u.tenantId === tenantId && u.email.toLowerCase() === cleanEmail) {
        return { ...u };
      }
    }
    return null;
  }

  static findByPhone(tenantId: string, phone: string): UserCore | null {
    const cleanPhone = phone.replace(/\D/g, '');
    for (const u of this.users.values()) {
      if (u.tenantId === tenantId && u.phone.replace(/\D/g, '') === cleanPhone) {
        return { ...u };
      }
    }
    return null;
  }

  static findByTenantId(tenantId: string): UserCore[] {
    const result: UserCore[] = [];
    for (const u of this.users.values()) {
      if (u.tenantId === tenantId) {
        result.push({ ...u });
      }
    }
    return result;
  }

  static create(
    tenantId: string,
    data: Omit<UserCore, 'tenantId' | 'createdAt' | 'updatedAt'>
  ): UserCore {
    const now = new Date().toISOString();
    const newUser: UserCore = {
      ...data,
      tenantId,
      createdAt: now,
      updatedAt: now
    };
    const key = `${tenantId}:${newUser.userId}`;
    this.users.set(key, newUser);
    return { ...newUser };
  }

  static update(
    tenantId: string,
    userId: string,
    updates: Partial<Omit<UserCore, 'userId' | 'tenantId' | 'createdAt'>>
  ): UserCore | null {
    const key = `${tenantId}:${userId}`;
    const existing = this.users.get(key);
    if (!existing) return null;

    const updated: UserCore = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.users.set(key, updated);
    return { ...updated };
  }

  static updateStatus(tenantId: string, userId: string, status: UserCoreStatus): UserCore | null {
    return this.update(tenantId, userId, { status });
  }

  static resetToDefault(): void {
    this.users = new Map(
      INITIAL_CORE_USERS.map((u) => [`${u.tenantId}:${u.userId}`, { ...u }])
    );
  }
}
