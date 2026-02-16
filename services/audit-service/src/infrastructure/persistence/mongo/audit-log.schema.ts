import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type AuditLogDocument = HydratedDocument<AuditLogMongoEntity>;

@Schema({ collection: 'audit_logs', timestamps: false })
export class AuditLogMongoEntity {
  @Prop({ required: true })
  eventType: string;

  @Prop({ required: true, type: Object })
  payload: Record<string, unknown>;

  @Prop({ required: true })
  source: string;

  @Prop({ required: true })
  occurredAt: Date;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLogMongoEntity);
