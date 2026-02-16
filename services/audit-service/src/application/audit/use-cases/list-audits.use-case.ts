import { Inject, Injectable } from '@nestjs/common';
import { AuditLog } from '../../../domain/audit/audit-log';
import type { AuditRepository } from '../../../domain/audit/audit.repository';
import { AUDIT_REPOSITORY } from '../../../domain/audit/tokens';

@Injectable()
export class ListAuditsUseCase {
  constructor(@Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepository) {}

  execute(limit?: number): Promise<AuditLog[]> {
    return this.auditRepository.list(limit);
  }
}
