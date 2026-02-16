import { Controller } from '@nestjs/common';
import { EventPattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { LEGACY_USER_CREATED_EVENT, USER_CREATED_EVENT } from './constants';
import type { UserCreatedEvent } from './contracts/user-created.event';

@Controller()
export class UsersEventsController {
  constructor(private readonly usersService: UsersService) {}

  @EventPattern(USER_CREATED_EVENT)
  @EventPattern(LEGACY_USER_CREATED_EVENT)
  async handleUserCreated(@Payload() data: UserCreatedEvent) {
    if (!data?.id || !data?.email) return;
    await this.usersService.createFromAuth(data.id, data.email, data.name);
  }
}
