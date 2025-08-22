import { ListEnvelopesQueryHandler } from '@application/queries/budget/list-envelopes/ListEnvelopesQueryHandler';
import { IListEnvelopesDao } from '@application/contracts/daos/envelope/IListEnvelopesDao';
import { BudgetNotFoundError } from '@application/shared/errors/BudgetNotFoundError';

describe('ListEnvelopesQueryHandler', () => {
  let dao: jest.Mocked<IListEnvelopesDao>;
  let handler: ListEnvelopesQueryHandler;

  beforeEach(() => {
    dao = {
      findByBudgetForUser: jest.fn(),
    };
    handler = new ListEnvelopesQueryHandler(dao);
  });

  it('should throw when dao returns null', async () => {
    dao.findByBudgetForUser.mockResolvedValue(null);
    await expect(
      handler.execute({ budgetId: 'b1', userId: 'u1' }),
    ).rejects.toBeInstanceOf(BudgetNotFoundError);
  });

  it('should return empty array when dao returns empty', async () => {
    dao.findByBudgetForUser.mockResolvedValue([]);
    const result = await handler.execute({ budgetId: 'b1', userId: 'u1' });
    expect(result).toEqual([]);
  });

  it('should map items with remaining and percentUsed', async () => {
    dao.findByBudgetForUser.mockResolvedValue([
      { id: 'e1', name: 'Food', allocated: 10000, spent: 2500 },
      { id: 'e2', name: 'Zero', allocated: 0, spent: 1000 },
    ]);
    const result = await handler.execute({ budgetId: 'b1', userId: 'u1' });
    expect(result).toEqual([
      {
        id: 'e1',
        name: 'Food',
        allocated: 10000,
        spent: 2500,
        remaining: 7500,
        percentUsed: 0.25,
      },
      {
        id: 'e2',
        name: 'Zero',
        allocated: 0,
        spent: 1000,
        remaining: -1000,
        percentUsed: 0,
      },
    ]);
  });
});
