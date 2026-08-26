import { RoleCore } from '../types';
import { CANONICAL_SYSTEM_ROLES } from '../services/roles/roleService';

export class RoleRepository {
  private static customRoles: Map<string, RoleCore> = new Map();

  static findById(roleId: string, tenantId?: string): RoleCore | null {
    // 1. Check system roles
    const sysRole = Object.values(CANONICAL_SYSTEM_ROLES).find((r) => r.roleId === roleId);
    if (sysRole) return { ...sysRole };

    // 2. Check custom tenant roles
    if (tenantId) {
      const key = `${tenantId}:${roleId}`;
      const custom = this.customRoles.get(key);
      if (custom) return { ...custom };
    }

    return null;
  }

  static findByCode(code: string, tenantId?: string): RoleCore | null {
    const sysRole = Object.values(CANONICAL_SYSTEM_ROLES).find((r) => r.code === code);
    if (sysRole) return { ...sysRole };

    if (tenantId) {
      for (const r of this.customRoles.values()) {
        if (r.tenantId === tenantId && r.code.toUpperCase() === code.toUpperCase()) {
          return { ...r };
        }
      }
    }
    return null;
  }

  static findAll(tenantId?: string): RoleCore[] {
    const allRoles: RoleCore[] = Object.values(CANONICAL_SYSTEM_ROLES).map((r) => ({ ...r }));

    if (tenantId) {
      for (const r of this.customRoles.values()) {
        if (r.tenantId === tenantId) {
          allRoles.push({ ...r });
        }
      }
    }

    return allRoles;
  }

  static createCustomRole(
    tenantId: string,
    data: Omit<RoleCore, 'tenantId' | 'isSystemRole' | 'createdAt' | 'updatedAt'>
  ): RoleCore {
    const now = new Date().toISOString();
    const newRole: RoleCore = {
      ...data,
      tenantId,
      isSystemRole: false,
      createdAt: now,
      updatedAt: now
    };
    const key = `${tenantId}:${newRole.roleId}`;
    this.customRoles.set(key, newRole);
    return { ...newRole };
  }

  static resetToDefault(): void {
    this.customRoles.clear();
  }
}
