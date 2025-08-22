export interface BudgetListItem {
  id: string;
  name: string;
  type: string;
  participantsCount: number;
}

export interface IListBudgetsDao {
  findByUser(params: { userId: string }): Promise<BudgetListItem[]>;
}
