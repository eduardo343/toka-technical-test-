import { UsersEventsController } from './users.events';

describe('UsersEventsController', () => {
  let usersService: { createFromAuth: jest.Mock };
  let controller: UsersEventsController;

  beforeEach(() => {
    usersService = {
      createFromAuth: jest.fn(async () => undefined),
    };

    controller = new UsersEventsController(usersService as never);
  });

  it('ignores events without id or email', async () => {
    await controller.handleUserCreated({} as never);
    await controller.handleUserCreated({ id: 'x' } as never);

    expect(usersService.createFromAuth).not.toHaveBeenCalled();
  });

  it('delegates valid event to UsersService', async () => {
    await controller.handleUserCreated({ id: 'user-1', email: 'user@test.com', name: 'User' });

    expect(usersService.createFromAuth).toHaveBeenCalledWith('user-1', 'user@test.com', 'User');
  });
});
