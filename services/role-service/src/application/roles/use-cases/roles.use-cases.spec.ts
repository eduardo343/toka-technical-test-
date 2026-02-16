import { ConflictException, NotFoundException } from '@nestjs/common';
import { Role } from '../../../domain/role/role';
import { CreateRoleUseCase } from './create-role.use-case';
import { DeleteRoleUseCase } from './delete-role.use-case';
import { GetRoleByIdUseCase } from './get-role-by-id.use-case';
import { ListRolesUseCase } from './list-roles.use-case';
import { UpdateRoleUseCase } from './update-role.use-case';

describe('Role use-cases', () => {
  const role = new Role('role-1', 'admin', 'platform admin', new Date(), new Date());

  let repository: {
    create: jest.Mock;
    findAll: jest.Mock;
    findById: jest.Mock;
    findByName: jest.Mock;
    update: jest.Mock;
    remove: jest.Mock;
  };
  let eventsPublisher: { publishRoleCreated: jest.Mock };

  beforeEach(() => {
    repository = {
      create: jest.fn(async () => role),
      findAll: jest.fn(async () => [role]),
      findById: jest.fn(async () => role),
      findByName: jest.fn(async () => null),
      update: jest.fn(async () => role),
      remove: jest.fn(async () => true),
    };

    eventsPublisher = {
      publishRoleCreated: jest.fn(),
    };
  });

  it('CreateRoleUseCase throws conflict when role name already exists', async () => {
    repository.findByName.mockResolvedValue(role);
    const useCase = new CreateRoleUseCase(repository as never, eventsPublisher as never);

    await expect(useCase.execute({ name: 'admin' })).rejects.toBeInstanceOf(ConflictException);
  });

  it('CreateRoleUseCase creates role and publishes event', async () => {
    const useCase = new CreateRoleUseCase(repository as never, eventsPublisher as never);

    const result = await useCase.execute({ name: 'admin', description: 'platform admin' });

    expect(result).toBe(role);
    expect(eventsPublisher.publishRoleCreated).toHaveBeenCalledWith(role);
  });

  it('ListRolesUseCase returns roles', async () => {
    const useCase = new ListRolesUseCase(repository as never);

    const result = await useCase.execute();

    expect(result).toEqual([role]);
  });

  it('GetRoleByIdUseCase throws when role does not exist', async () => {
    repository.findById.mockResolvedValue(null);
    const useCase = new GetRoleByIdUseCase(repository as never);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('UpdateRoleUseCase throws conflict when new name belongs to another role', async () => {
    repository.findByName.mockResolvedValue(new Role('role-2', 'admin', null, new Date(), new Date()));
    const useCase = new UpdateRoleUseCase(repository as never);

    await expect(useCase.execute({ id: 'role-1', name: 'admin' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('UpdateRoleUseCase throws when role does not exist', async () => {
    repository.findByName.mockResolvedValue(null);
    repository.update.mockResolvedValue(null);
    const useCase = new UpdateRoleUseCase(repository as never);

    await expect(useCase.execute({ id: 'missing', name: 'ops' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('UpdateRoleUseCase updates role', async () => {
    repository.findByName.mockResolvedValue(null);
    const useCase = new UpdateRoleUseCase(repository as never);

    const result = await useCase.execute({ id: 'role-1', name: 'ops' });

    expect(result).toBe(role);
    expect(repository.update).toHaveBeenCalledWith({ id: 'role-1', name: 'ops' });
  });

  it('DeleteRoleUseCase throws when role does not exist', async () => {
    repository.remove.mockResolvedValue(false);
    const useCase = new DeleteRoleUseCase(repository as never);

    await expect(useCase.execute('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('DeleteRoleUseCase returns confirmation message', async () => {
    const useCase = new DeleteRoleUseCase(repository as never);

    const result = await useCase.execute('role-1');

    expect(result).toEqual({ message: 'Role with ID role-1 deleted successfully' });
  });
});
