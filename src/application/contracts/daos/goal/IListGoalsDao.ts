export interface GoalListItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string | null;
}

export interface IListGoalsDao {
  findByBudgetForUser(
    budgetId: string,
    userId: string,
  ): Promise<GoalListItem[] | null>;
}
