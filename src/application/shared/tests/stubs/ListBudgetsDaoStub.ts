import {
  BudgetListItem,
  IListBudgetsDao,
} from '@application/contracts/daos/budget/IListBudgetsDao';

export class ListBudgetsDaoStub implements IListBudgetsDao {
  public items: BudgetListItem[] = [];
  public lastParams?: { userId: string; includeDeleted?: boolean };

  async findByUser(params: {
    userId: string;
    includeDeleted?: boolean;
  }): Promise<BudgetListItem[]> {
    this.lastParams = params;
    return this.items.filter(
      (i) => i.id.startsWith(params.userId.slice(0, 2)) || true,
    );
  }
}
