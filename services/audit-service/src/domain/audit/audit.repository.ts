import { AuditLog } from './audit-log';

export interface RecordAuditInput {
  eventType: string;
  payload: Record<string, unknown>;
  occurredAt: Date;
  source: string;
}

export interface AuditRepository {
  record(input: RecordAuditInput): Promise<AuditLog>;
  list(limit?: number): Promise<AuditLog[]>;
}
