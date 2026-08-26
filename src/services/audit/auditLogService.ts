import { AuditLogCore } from '../../types';
import { AuditLogRepository } from '../../repositories/auditLogRepository';

export class AuditLogService {
  static log(
    tenantId: string,
    userId: string,
    action: string,
    module: string,
    entityType: string,
    entityId: string,
    metadata?: Record<string, any>,
    ip?: string
  ): AuditLogCore {
    return AuditLogRepository.record({
      tenantId,
      userId,
      action,
      module,
      entityType,
      entityId,
      metadata,
      ip
    });
  }

  static getAuditHistory(
    tenantId: string,
    options?: {
      module?: string;
      entityType?: string;
      entityId?: string;
      limit?: number;
    }
  ): AuditLogCore[] {
    return AuditLogRepository.findByTenantId(tenantId, options);
  }
}
