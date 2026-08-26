import { AuditLogCore } from '../types';

export class AuditLogRepository {
  private static logs: AuditLogCore[] = [];
  private static sequence = 1000;

  static record(entry: Omit<AuditLogCore, 'auditId' | 'timestamp'> & { timestamp?: string }): AuditLogCore {
    this.sequence = (this.sequence + 1) % 900000 + 1000;
    const newLog: AuditLogCore = {
      ...entry,
      auditId: `audit-${Date.now()}-${this.sequence}`,
      timestamp: entry.timestamp || new Date().toISOString()
    };
    this.logs.unshift(newLog);
    if (this.logs.length > 5000) {
      this.logs.length = 5000;
    }
    return { ...newLog };
  }

  static findByTenantId(
    tenantId: string,
    options?: { module?: string; entityType?: string; entityId?: string; limit?: number }
  ): AuditLogCore[] {
    let filtered = this.logs.filter((l) => l.tenantId === tenantId);

    if (options?.module) {
      filtered = filtered.filter((l) => l.module === options.module);
    }
    if (options?.entityType) {
      filtered = filtered.filter((l) => l.entityType === options.entityType);
    }
    if (options?.entityId) {
      filtered = filtered.filter((l) => l.entityId === options.entityId);
    }
    if (options?.limit && options.limit > 0) {
      filtered = filtered.slice(0, options.limit);
    }

    return filtered.map((l) => ({ ...l }));
  }

  static clear(): void {
    this.logs = [];
  }
}
