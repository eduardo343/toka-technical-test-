import { ConflictException, Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../../../domain/role/tokens';
import type { RoleRepository, UpdateRoleInput } from '../../../domain/role/role.repository';
import { Role } from '../../../domain/role/role';

@Injectable()
export class UpdateRoleUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository) {}

  async execute(input: UpdateRoleInput): Promise<Role> {
    if (input.name) {
      const exists = await this.roleRepository.findByName(input.name);
      if (exists && exists.id !== input.id) {
        throw new ConflictException('Role name already exists');
      }
    }

    const updated = await this.roleRepository.update(input);
    if (!updated) {
      throw new NotFoundException(`Role with ID ${input.id} not found`);
    }

    return updated;
  }
}
