import {
  IListCategoriesDao,
  ListCategoriesItem,
} from '@application/contracts/daos/category/IListCategoriesDao';
import { ListCategoriesQueryHandler } from '@application/queries/category/list-categories/ListCategoriesQueryHandler';

class ListCategoriesDaoStub implements IListCategoriesDao {
  public items: ListCategoriesItem[] = [];

  async findAll(): Promise<ListCategoriesItem[]> {
    return this.items;
  }
}

describe('ListCategoriesQueryHandler', () => {
  it('should return empty array when dao returns no items', async () => {
    const dao = new ListCategoriesDaoStub();
    const handler = new ListCategoriesQueryHandler(dao);
    const result = await handler.execute({ userId: 'u1', budgetId: 'b1' });
    expect(result).toEqual([]);
  });

  it('should return adapted items', async () => {
    const dao = new ListCategoriesDaoStub();
    dao.items = [
      { id: 'c1', name: 'Salary', type: 'INCOME' },
      { id: 'c2', name: 'Food', type: 'EXPENSE' },
    ];
    const handler = new ListCategoriesQueryHandler(dao);
    const result = await handler.execute({ userId: 'u1', budgetId: 'b1' });
    expect(result).toEqual([
      { id: 'c1', name: 'Salary', type: 'INCOME' },
      { id: 'c2', name: 'Food', type: 'EXPENSE' },
    ]);
  });
});
