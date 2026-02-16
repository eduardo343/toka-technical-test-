import { AuditLog } from '../../../domain/audit/audit-log';
import { ListAuditsUseCase } from './list-audits.use-case';
import { RecordAuditUseCase } from './record-audit.use-case';

describe('Audit use-cases', () => {
  const auditLog = new AuditLog('audit-1', 'user.created.v1', { id: 'user-1' }, new Date(), 'auth-service');

  let repository: {
    record: jest.Mock;
    list: jest.Mock;
  };

  beforeEach(() => {
    repository = {
      record: jest.fn(async () => auditLog),
      list: jest.fn(async () => [auditLog]),
    };
  });

  it('RecordAuditUseCase delegates to repository', async () => {
    const useCase = new RecordAuditUseCase(repository as never);

    const result = await useCase.execute({
      eventType: 'user.created.v1',
      payload: { id: 'user-1' },
      occurredAt: new Date(),
      source: 'auth-service',
    });

    expect(result).toBe(auditLog);
    expect(repository.record).toHaveBeenCalledTimes(1);
  });

  it('ListAuditsUseCase delegates to repository with limit', async () => {
    const useCase = new ListAuditsUseCase(repository as never);

    const result = await useCase.execute(25);

    expect(result).toEqual([auditLog]);
    expect(repository.list).toHaveBeenCalledWith(25);
  });
});
