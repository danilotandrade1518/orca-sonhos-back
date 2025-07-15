export interface CreateAccountDto {
  userId: string;
  name: string;
  type: string;
  budgetId: string;
  initialBalance?: number;
  description?: string;
}
