import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from '../../../domain/role/role';
import {
  CreateRoleInput,
  RoleRepository,
  UpdateRoleInput,
} from '../../../domain/role/role.repository';
import { RoleOrmEntity } from './role.orm-entity';

@Injectable()
export class RoleTypeOrmRepository implements RoleRepository {
  constructor(
    @InjectRepository(RoleOrmEntity)
    private readonly roleRepository: Repository<RoleOrmEntity>,
  ) {}

  async create(input: CreateRoleInput): Promise<Role> {
    const created = this.roleRepository.create({
      name: input.name,
      description: input.description,
    });
    const saved = await this.roleRepository.save(created);
    return this.toDomain(saved);
  }

  async findAll(): Promise<Role[]> {
    const roles = await this.roleRepository.find({ order: { createdAt: 'DESC' } });
    return roles.map((role) => this.toDomain(role));
  }

  async findById(id: string): Promise<Role | null> {
    const role = await this.roleRepository.findOne({ where: { id } });
    return role ? this.toDomain(role) : null;
  }

  async findByName(name: string): Promise<Role | null> {
    const role = await this.roleRepository.findOne({ where: { name } });
    return role ? this.toDomain(role) : null;
  }

  async update(input: UpdateRoleInput): Promise<Role | null> {
    const role = await this.roleRepository.findOne({ where: { id: input.id } });
    if (!role) {
      return null;
    }

    if (input.name !== undefined) {
      role.name = input.name;
    }
    if (input.description !== undefined) {
      role.description = input.description;
    }

    const saved = await this.roleRepository.save(role);
    return this.toDomain(saved);
  }

  async remove(id: string): Promise<boolean> {
    const result = await this.roleRepository.delete({ id });
    return Boolean(result.affected);
  }

  private toDomain(role: RoleOrmEntity): Role {
    return new Role(
      role.id,
      role.name,
      role.description ?? null,
      role.createdAt,
      role.updatedAt,
    );
  }
}
