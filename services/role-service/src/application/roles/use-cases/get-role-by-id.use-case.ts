import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../../../domain/role/tokens';
import type { RoleRepository } from '../../../domain/role/role.repository';
import { Role } from '../../../domain/role/role';

@Injectable()
export class GetRoleByIdUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository) {}

  async execute(id: string): Promise<Role> {
    const role = await this.roleRepository.findById(id);
    if (!role) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return role;
  }
}
