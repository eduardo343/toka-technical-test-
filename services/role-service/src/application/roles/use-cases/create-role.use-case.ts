import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { ROLE_EVENTS_PUBLISHER, ROLE_REPOSITORY } from '../../../domain/role/tokens';
import type { CreateRoleInput, RoleRepository } from '../../../domain/role/role.repository';
import { Role } from '../../../domain/role/role';
import type { RoleEventsPublisher } from '../../../domain/role/role-events.publisher';

@Injectable()
export class CreateRoleUseCase {
  constructor(
    @Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository,
    @Inject(ROLE_EVENTS_PUBLISHER) private readonly roleEventsPublisher: RoleEventsPublisher,
  ) {}

  async execute(input: CreateRoleInput): Promise<Role> {
    const exists = await this.roleRepository.findByName(input.name);
    if (exists) {
      throw new ConflictException('Role already exists');
    }

    const role = await this.roleRepository.create(input);
    this.roleEventsPublisher.publishRoleCreated(role);
    return role;
  }
}
