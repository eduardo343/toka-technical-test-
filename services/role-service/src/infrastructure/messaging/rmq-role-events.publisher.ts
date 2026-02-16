import { Inject, Injectable, Logger } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import { EMPTY, catchError, timeout } from 'rxjs';
import { RoleEventsPublisher } from '../../domain/role/role-events.publisher';
import { Role } from '../../domain/role/role';
import { RoleCreatedEvent } from '../../domain/role/role-created.event';
import { AUDIT_CLIENT, ROLE_CREATED_EVENT } from './constants';

@Injectable()
export class RmqRoleEventsPublisher implements RoleEventsPublisher {
  private readonly logger = new Logger(RmqRoleEventsPublisher.name);

  constructor(@Inject(AUDIT_CLIENT) private readonly auditClient: ClientProxy) {}

  publishRoleCreated(role: Role): void {
    const payload: RoleCreatedEvent = {
      id: role.id,
      name: role.name,
      description: role.description ?? undefined,
      occurredAt: new Date().toISOString(),
    };

    this.auditClient
      .emit<RoleCreatedEvent>(ROLE_CREATED_EVENT, payload)
      .pipe(
        timeout(2000),
        catchError((error: unknown) => {
          const message = error instanceof Error ? error.stack ?? error.message : String(error);
          this.logger.error(`Failed to publish \"${ROLE_CREATED_EVENT}\"`, message);
          return EMPTY;
        }),
      )
      .subscribe();
  }
}
