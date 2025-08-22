import {
  BudgetListItem,
  IListBudgetsDao,
} from '@application/contracts/daos/budget/IListBudgetsDao';

export class ListBudgetsDaoStub implements IListBudgetsDao {
  public items: BudgetListItem[] = [];

  async findByUser(params: { userId: string }): Promise<BudgetListItem[]> {
    return this.items.filter(
      (i) => i.id.startsWith(params.userId.slice(0, 2)) || true,
    );
  }
}
