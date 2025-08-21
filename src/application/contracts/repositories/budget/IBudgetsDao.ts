export interface BudgetListItem {
  id: string;
  name: string;
  type: 'PERSONAL' | 'SHARED';
  participantsCount: number;
}

export interface IBudgetsDao {
  findByUser(userId: string): Promise<BudgetListItem[]>;
}
