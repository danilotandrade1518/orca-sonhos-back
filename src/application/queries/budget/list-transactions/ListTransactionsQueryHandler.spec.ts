import {
  IListTransactionsDao,
  ListTransactionsItem,
} from '@application/contracts/daos/transaction/IListTransactionsDao';
import { ListTransactionsQueryHandler } from './ListTransactionsQueryHandler';

class ListTransactionsDaoStub implements IListTransactionsDao {
  public result: { rows: ListTransactionsItem[]; hasNext: boolean } | null = {
    rows: [],
    hasNext: false,
  };
  public params: any;
  async findPageForBudgetUser(params: any) {
    this.params = params;
    return this.result;
  }
}

describe('ListTransactionsQueryHandler', () => {
  it('should throw INVALID_INPUT when budgetId missing or page invalid', async () => {
    const dao = new ListTransactionsDaoStub();
    const handler = new ListTransactionsQueryHandler(dao);
    await expect(
      handler.execute({ budgetId: '', userId: 'u1' }),
    ).rejects.toThrow('INVALID_INPUT');
    await expect(
      handler.execute({ budgetId: 'b1', userId: 'u1', page: 0 }),
    ).rejects.toThrow('INVALID_INPUT');
  });

  it('should throw NOT_FOUND when dao returns null', async () => {
    const dao = new ListTransactionsDaoStub();
    dao.result = null;
    const handler = new ListTransactionsQueryHandler(dao);
    await expect(
      handler.execute({ budgetId: 'b1', userId: 'u1' }),
    ).rejects.toThrow('NOT_FOUND');
  });

  it('should return empty items when dao returns none', async () => {
    const dao = new ListTransactionsDaoStub();
    dao.result = { rows: [], hasNext: false };
    const handler = new ListTransactionsQueryHandler(dao);
    const result = await handler.execute({ budgetId: 'b1', userId: 'u1' });
    expect(result.items).toHaveLength(0);
    expect(result.meta).toEqual({ page: 1, pageSize: 20, hasNext: false });
  });

  it('should adapt items and meta correctly', async () => {
    const dao = new ListTransactionsDaoStub();
    dao.result = {
      rows: [
        {
          id: 't1',
          date: '2023-01-01',
          description: 'desc',
          amount: 100,
          direction: 'IN',
          accountId: 'a1',
          categoryId: null,
        },
      ],
      hasNext: true,
    };
    const handler = new ListTransactionsQueryHandler(dao);
    const result = await handler.execute({
      budgetId: 'b1',
      userId: 'u1',
      page: 2,
      pageSize: 1,
    });
    expect(dao.params).toMatchObject({ offset: 1, limit: 2 });
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toEqual({
      id: 't1',
      date: '2023-01-01',
      description: 'desc',
      amount: 100,
      direction: 'IN',
      accountId: 'a1',
      categoryId: null,
    });
    expect(result.meta).toEqual({ page: 2, pageSize: 1, hasNext: true });
  });
});
