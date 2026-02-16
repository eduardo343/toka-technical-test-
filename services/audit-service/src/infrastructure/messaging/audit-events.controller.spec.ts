import { AuditEventsController } from './audit-events.controller';
import { AUTH_LOGIN_EVENT, ROLE_CREATED_EVENT, USER_CREATED_EVENT } from './constants';

describe('AuditEventsController', () => {
  let recordAuditUseCase: { execute: jest.Mock };
  let controller: AuditEventsController;

  beforeEach(() => {
    recordAuditUseCase = {
      execute: jest.fn(async () => undefined),
    };

    controller = new AuditEventsController(recordAuditUseCase as never);
  });

  it('maps user-created event to audit record', async () => {
    const payload = { id: 'user-1', email: 'user@test.com' };

    await controller.handleUserCreated(payload);

    expect(recordAuditUseCase.execute).toHaveBeenCalledWith({
      eventType: USER_CREATED_EVENT,
      payload,
      occurredAt: expect.any(Date),
      source: 'auth-service',
    });
  });

  it('maps role-created event to audit record', async () => {
    const payload = { id: 'role-1', name: 'admin' };

    await controller.handleRoleCreated(payload);

    expect(recordAuditUseCase.execute).toHaveBeenCalledWith({
      eventType: ROLE_CREATED_EVENT,
      payload,
      occurredAt: expect.any(Date),
      source: 'role-service',
    });
  });

  it('maps auth-login event to audit record', async () => {
    const payload = { credentialId: 'cred-1', email: 'user@test.com' };

    await controller.handleAuthLogin(payload);

    expect(recordAuditUseCase.execute).toHaveBeenCalledWith({
      eventType: AUTH_LOGIN_EVENT,
      payload,
      occurredAt: expect.any(Date),
      source: 'auth-service',
    });
  });
});
