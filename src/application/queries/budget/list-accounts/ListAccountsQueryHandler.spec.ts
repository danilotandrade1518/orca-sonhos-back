import {
  IListAccountsDao,
  ListAccountsItem,
} from '@application/contracts/daos/account/IListAccountsDao';
import { BudgetAuthorizationServiceStub } from '@application/shared/tests/stubs/BudgetAuthorizationServiceStub';
import { ListAccountsQueryHandler } from './ListAccountsQueryHandler';

class ListAccountsDaoStub implements IListAccountsDao {
  public items: ListAccountsItem[] = [];

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async findByBudget(params: {
    budgetId: string;
  }): Promise<ListAccountsItem[]> {
    return this.items;
  }
}

describe('ListAccountsQueryHandler', () => {
  let dao: ListAccountsDaoStub;
  let handler: ListAccountsQueryHandler;

  beforeEach(() => {
    dao = new ListAccountsDaoStub();
    handler = new ListAccountsQueryHandler(
      dao,
      new BudgetAuthorizationServiceStub(),
    );
  });

  it('should return empty array when dao returns []', async () => {
    dao.items = [];
    const result = await handler.execute({ budgetId: 'b1', userId: 'u1' });
    expect(result).toEqual([]);
  });

  it('should adapt items', async () => {
    dao.items = [
      { id: 'a1', name: 'Conta 1', type: 'CHECKING', balance: 100 },
      { id: 'a2', name: 'Conta 2', type: 'SAVINGS', balance: 200 },
    ];
    const result = await handler.execute({ budgetId: 'b1', userId: 'u1' });
    expect(result).toEqual([
      { id: 'a1', name: 'Conta 1', type: 'CHECKING', balance: 100 },
      { id: 'a2', name: 'Conta 2', type: 'SAVINGS', balance: 200 },
    ]);
  });
});
