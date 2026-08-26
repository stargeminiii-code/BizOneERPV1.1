import { TenantCore } from '../types';

export const INITIAL_TENANTS: TenantCore[] = [
  {
    tenantId: 'tenant-household-01',
    businessName: 'Hộ Kinh Doanh Vũ Đức Đăng Khôi',
    businessType: 'HOUSEHOLD_BUSINESS',
    taxCode: '0109988776',
    phone: '0972377497',
    email: 'contact@freshdangkhoi.com',
    address: 'Số 18 Phạm Hùng, Cầu Giấy, Hà Nội',
    status: 'active',
    createdAt: '2026-01-01 08:00:00',
    updatedAt: '2026-01-01 08:00:00'
  },
  {
    tenantId: 'tenant-company-02',
    businessName: 'Công Ty Cổ Phần Công Nghệ & Thương Mại BizOne',
    businessType: 'COMPANY',
    taxCode: '0109123456',
    phone: '0909123456',
    email: 'admin@bizone.vn',
    address: 'Tòa nhà Landmark 81, Bình Thạnh, TP.HCM',
    status: 'active',
    createdAt: '2026-01-10 09:00:00',
    updatedAt: '2026-01-10 09:00:00'
  },
  {
    tenantId: 'tenant-individual-03',
    businessName: 'Cửa Hàng Bán Lẻ Đăng Khôi',
    businessType: 'INDIVIDUAL',
    taxCode: '8490123456',
    phone: '0912345678',
    email: 'retail.dangkhoi@gmail.com',
    address: 'Số 45 Trần Phú, Hải Châu, Đà Nẵng',
    status: 'active',
    createdAt: '2026-02-01 10:00:00',
    updatedAt: '2026-02-01 10:00:00'
  }
];

export class TenantRepository {
  private static tenants: Map<string, TenantCore> = new Map(
    INITIAL_TENANTS.map((t) => [t.tenantId, { ...t }])
  );

  static findById(tenantId: string): TenantCore | null {
    const tenant = this.tenants.get(tenantId);
    return tenant ? { ...tenant } : null;
  }

  static findByTaxCode(taxCode: string): TenantCore | null {
    for (const t of this.tenants.values()) {
      if (t.taxCode === taxCode) {
        return { ...t };
      }
    }
    return null;
  }

  static findAll(): TenantCore[] {
    return Array.from(this.tenants.values()).map((t) => ({ ...t }));
  }

  static create(data: Omit<TenantCore, 'createdAt' | 'updatedAt'>): TenantCore {
    const now = new Date().toISOString();
    const newTenant: TenantCore = {
      ...data,
      createdAt: now,
      updatedAt: now
    };
    this.tenants.set(newTenant.tenantId, newTenant);
    return { ...newTenant };
  }

  static update(tenantId: string, updates: Partial<Omit<TenantCore, 'tenantId' | 'createdAt'>>): TenantCore | null {
    const existing = this.tenants.get(tenantId);
    if (!existing) return null;

    const updated: TenantCore = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.tenants.set(tenantId, updated);
    return { ...updated };
  }

  static updateStatus(tenantId: string, status: TenantCore['status']): TenantCore | null {
    return this.update(tenantId, { status });
  }

  // Used for test reset
  static resetToDefault(): void {
    this.tenants = new Map(INITIAL_TENANTS.map((t) => [t.tenantId, { ...t }]));
  }
}
