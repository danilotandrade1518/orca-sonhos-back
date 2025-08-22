export interface GoalListItem {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  dueDate: string | null;
}

export interface IListGoalsDao {
  findByBudget(params: { budgetId: string }): Promise<GoalListItem[]>;
}
