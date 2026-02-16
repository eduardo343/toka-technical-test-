import { Role } from './role';

export interface CreateRoleInput {
  name: string;
  description?: string;
}

export interface UpdateRoleInput {
  id: string;
  name?: string;
  description?: string;
}

export interface RoleRepository {
  create(input: CreateRoleInput): Promise<Role>;
  findAll(): Promise<Role[]>;
  findById(id: string): Promise<Role | null>;
  findByName(name: string): Promise<Role | null>;
  update(input: UpdateRoleInput): Promise<Role | null>;
  remove(id: string): Promise<boolean>;
}
