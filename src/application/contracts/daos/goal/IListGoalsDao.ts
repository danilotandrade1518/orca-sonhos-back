export interface GoalListItem {
  id: string;
  name: string;
  totalAmount: number;
  accumulatedAmount: number;
  deadline: string | null;
  budgetId: string;
  sourceAccountId?: string;
}

export interface IListGoalsDao {
  findByBudget(params: { budgetId: string }): Promise<GoalListItem[]>;
}
