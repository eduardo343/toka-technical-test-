import { Inject, Injectable } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../../../domain/role/tokens';
import type { RoleRepository } from '../../../domain/role/role.repository';
import { Role } from '../../../domain/role/role';

@Injectable()
export class ListRolesUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository) {}

  execute(): Promise<Role[]> {
    return this.roleRepository.findAll();
  }
}
