import { ListBudgetsQueryHandler } from '@application/queries/budget/list-budgets/ListBudgetsQueryHandler';
import { ListBudgetsDaoStub } from '@application/shared/tests/stubs/ListBudgetsDaoStub';

describe('ListBudgetsQueryHandler', () => {
  it('should return adapted items', async () => {
    const dao = new ListBudgetsDaoStub();
    dao.items = [
      { id: 'b1', name: 'Meu Budget', type: 'PERSONAL', participantsCount: 1 },
      { id: 'b2', name: 'Família', type: 'SHARED', participantsCount: 3 },
    ];
    const handler = new ListBudgetsQueryHandler(dao);
    const result = await handler.execute({ userId: 'user-123' });
    expect(result).toHaveLength(2);
    expect(result[0]).toEqual({
      id: 'b1',
      name: 'Meu Budget',
      type: 'PERSONAL',
      participantsCount: 1,
    });
  });

  it('should pass includeDeleted parameter to dao', async () => {
    const dao = new ListBudgetsDaoStub();
    dao.items = [
      {
        id: 'b1',
        name: 'Active Budget',
        type: 'PERSONAL',
        participantsCount: 1,
      },
      {
        id: 'b2',
        name: 'Deleted Budget',
        type: 'SHARED',
        participantsCount: 0,
      },
    ];
    const handler = new ListBudgetsQueryHandler(dao);
    const result = await handler.execute({
      userId: 'user-123',
      includeDeleted: true,
    });
    expect(dao.lastParams?.includeDeleted).toBe(true);
    expect(result).toHaveLength(2);
  });

  it('should not include deleted by default', async () => {
    const dao = new ListBudgetsDaoStub();
    dao.items = [
      {
        id: 'b1',
        name: 'Active Budget',
        type: 'PERSONAL',
        participantsCount: 1,
      },
    ];
    const handler = new ListBudgetsQueryHandler(dao);
    await handler.execute({ userId: 'user-123' });
    expect(dao.lastParams?.includeDeleted).toBeUndefined();
  });
});
