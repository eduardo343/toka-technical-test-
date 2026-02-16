import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { ROLE_REPOSITORY } from '../../../domain/role/tokens';
import type { RoleRepository } from '../../../domain/role/role.repository';

@Injectable()
export class DeleteRoleUseCase {
  constructor(@Inject(ROLE_REPOSITORY) private readonly roleRepository: RoleRepository) {}

  async execute(id: string): Promise<{ message: string }> {
    const removed = await this.roleRepository.remove(id);
    if (!removed) {
      throw new NotFoundException(`Role with ID ${id} not found`);
    }

    return { message: `Role with ID ${id} deleted successfully` };
  }
}
