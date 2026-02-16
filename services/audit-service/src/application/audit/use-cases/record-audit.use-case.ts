import { Inject, Injectable } from '@nestjs/common';
import { AuditLog } from '../../../domain/audit/audit-log';
import type { AuditRepository, RecordAuditInput } from '../../../domain/audit/audit.repository';
import { AUDIT_REPOSITORY } from '../../../domain/audit/tokens';

@Injectable()
export class RecordAuditUseCase {
  constructor(@Inject(AUDIT_REPOSITORY) private readonly auditRepository: AuditRepository) {}

  execute(input: RecordAuditInput): Promise<AuditLog> {
    return this.auditRepository.record(input);
  }
}
