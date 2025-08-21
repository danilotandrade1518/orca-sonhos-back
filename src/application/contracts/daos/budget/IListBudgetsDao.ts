export interface BudgetListItem {
  id: string;
  name: string;
  type: 'PERSONAL' | 'SHARED';
  participantsCount: number;
}

export interface IListBudgetsDao {
  findByUser(userId: string): Promise<BudgetListItem[]>;
}
