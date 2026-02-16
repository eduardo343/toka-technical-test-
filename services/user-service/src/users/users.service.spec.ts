import { ConflictException, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';

describe('UsersService', () => {
  let userRepository: {
    create: jest.Mock;
    save: jest.Mock;
    findOne: jest.Mock;
    find: jest.Mock;
    remove: jest.Mock;
  };
  let service: UsersService;

  const existingUser = {
    id: 'user-1',
    email: 'user@test.com',
    name: 'User',
  };

  beforeEach(() => {
    userRepository = {
      create: jest.fn((input) => ({ ...input })),
      save: jest.fn(async (input) => input),
      findOne: jest.fn(),
      find: jest.fn(async () => []),
      remove: jest.fn(async (input) => input),
    };

    service = new UsersService(userRepository as never);
  });

  it('create persists a new user', async () => {
    const result = await service.create({ email: 'new@test.com', name: 'New User' });

    expect(result).toMatchObject({ email: 'new@test.com', name: 'New User' });
    expect(userRepository.create).toHaveBeenCalledWith({
      email: 'new@test.com',
      name: 'New User',
    });
  });

  it('create maps unique violation to conflict', async () => {
    userRepository.save.mockRejectedValue({ code: '23505' });

    await expect(service.create({ email: 'dup@test.com', name: 'Dup' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('createFromAuth returns existing user by id', async () => {
    userRepository.findOne.mockResolvedValue(existingUser);

    const result = await service.createFromAuth('user-1', 'user@test.com', 'User');

    expect(result).toBe(existingUser);
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('createFromAuth returns user when email is already in use by another id', async () => {
    userRepository.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({ id: 'user-2', email: 'user@test.com', name: 'Other' });

    const result = await service.createFromAuth('user-1', 'user@test.com');

    expect(result).toMatchObject({ id: 'user-2', email: 'user@test.com' });
    expect(userRepository.create).not.toHaveBeenCalled();
  });

  it('createFromAuth creates user when id and email are new', async () => {
    userRepository.findOne.mockResolvedValueOnce(null).mockResolvedValueOnce(null);

    const result = await service.createFromAuth('user-1', 'user@test.com', 'User');

    expect(result).toMatchObject({ id: 'user-1', email: 'user@test.com', name: 'User' });
    expect(userRepository.create).toHaveBeenCalledWith({
      id: 'user-1',
      email: 'user@test.com',
      name: 'User',
    });
  });

  it('findOne throws when user does not exist', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(service.findOne('missing')).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update throws conflict when email belongs to another user', async () => {
    userRepository.findOne
      .mockResolvedValueOnce(existingUser)
      .mockResolvedValueOnce({ id: 'user-2', email: 'other@test.com' });

    await expect(service.update('user-1', { email: 'other@test.com' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  it('update persists changes when email is available', async () => {
    userRepository.findOne.mockResolvedValueOnce(existingUser).mockResolvedValueOnce(null);

    const result = await service.update('user-1', { name: 'Updated Name' });

    expect(result).toMatchObject({ id: 'user-1', name: 'Updated Name' });
    expect(userRepository.save).toHaveBeenCalledWith(
      expect.objectContaining({ id: 'user-1', name: 'Updated Name' }),
    );
  });

  it('remove deletes user and returns confirmation message', async () => {
    userRepository.findOne.mockResolvedValue(existingUser);

    const result = await service.remove('user-1');

    expect(userRepository.remove).toHaveBeenCalledWith(existingUser);
    expect(result).toEqual({ message: 'User with ID user-1 deleted successfully' });
  });

  it('remove propagates not found error', async () => {
    userRepository.findOne.mockResolvedValue(null);

    await expect(service.remove('missing')).rejects.toBeInstanceOf(NotFoundException);
  });
});
