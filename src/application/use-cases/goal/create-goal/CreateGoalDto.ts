export interface CreateGoalDto {
  name: string;
  totalAmount: number;
  accumulatedAmount?: number;
  deadline?: Date;
  budgetId: string;
  sourceAccountId: string;
}
