import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PassportModule } from '@nestjs/passport';
import { RecordAuditUseCase } from './application/audit/use-cases/record-audit.use-case';
import { ListAuditsUseCase } from './application/audit/use-cases/list-audits.use-case';
import { AuditLogMongoEntity, AuditLogSchema } from './infrastructure/persistence/mongo/audit-log.schema';
import { MongoAuditRepository } from './infrastructure/persistence/mongo/mongo-audit.repository';
import { AUDIT_REPOSITORY } from './domain/audit/tokens';
import { AuditEventsController } from './infrastructure/messaging/audit-events.controller';
import { AuditsController } from './interfaces/http/audits.controller';
import { JwtStrategy } from './infrastructure/auth/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([{ name: AuditLogMongoEntity.name, schema: AuditLogSchema }]),
  ],
  controllers: [AuditsController, AuditEventsController],
  providers: [
    { provide: AUDIT_REPOSITORY, useClass: MongoAuditRepository },
    RecordAuditUseCase,
    ListAuditsUseCase,
    JwtStrategy,
  ],
})
export class AuditModule {}
