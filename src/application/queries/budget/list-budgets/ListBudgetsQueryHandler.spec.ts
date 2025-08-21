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
});
