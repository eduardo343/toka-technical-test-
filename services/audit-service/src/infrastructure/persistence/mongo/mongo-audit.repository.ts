import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog } from '../../../domain/audit/audit-log';
import { AuditRepository, RecordAuditInput } from '../../../domain/audit/audit.repository';
import { AuditLogMongoEntity } from './audit-log.schema';

@Injectable()
export class MongoAuditRepository implements AuditRepository {
  constructor(
    @InjectModel(AuditLogMongoEntity.name)
    private readonly auditModel: Model<AuditLogMongoEntity>,
  ) {}

  async record(input: RecordAuditInput): Promise<AuditLog> {
    const created = await this.auditModel.create({
      eventType: input.eventType,
      payload: input.payload,
      source: input.source,
      occurredAt: input.occurredAt,
    });

    return this.toDomain(created);
  }

  async list(limit = 50): Promise<AuditLog[]> {
    const records = await this.auditModel.find().sort({ occurredAt: -1 }).limit(limit).exec();
    return records.map((record) => this.toDomain(record));
  }

  private toDomain(record: AuditLogMongoEntity & { _id: unknown }): AuditLog {
    return new AuditLog(
      String(record._id),
      record.eventType,
      record.payload,
      record.occurredAt,
      record.source,
    );
  }
}
