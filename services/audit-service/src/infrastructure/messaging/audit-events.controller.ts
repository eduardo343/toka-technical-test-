import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { RecordAuditUseCase } from '../../application/audit/use-cases/record-audit.use-case';
import {
  AUTH_LOGIN_EVENT,
  LEGACY_USER_CREATED_EVENT,
  ROLE_CREATED_EVENT,
  USER_CREATED_EVENT,
} from './constants';

@Controller()
export class AuditEventsController {
  constructor(private readonly recordAuditUseCase: RecordAuditUseCase) {}

  @EventPattern(USER_CREATED_EVENT)
  @EventPattern(LEGACY_USER_CREATED_EVENT)
  async handleUserCreated(@Payload() payload: Record<string, unknown>) {
    await this.recordAuditUseCase.execute({
      eventType: USER_CREATED_EVENT,
      payload,
      occurredAt: new Date(),
      source: 'auth-service',
    });
  }

  @EventPattern(ROLE_CREATED_EVENT)
  async handleRoleCreated(@Payload() payload: Record<string, unknown>) {
    await this.recordAuditUseCase.execute({
      eventType: ROLE_CREATED_EVENT,
      payload,
      occurredAt: new Date(),
      source: 'role-service',
    });
  }

  @EventPattern(AUTH_LOGIN_EVENT)
  async handleAuthLogin(@Payload() payload: Record<string, unknown>) {
    await this.recordAuditUseCase.execute({
      eventType: AUTH_LOGIN_EVENT,
      payload,
      occurredAt: new Date(),
      source: 'auth-service',
    });
  }
}
