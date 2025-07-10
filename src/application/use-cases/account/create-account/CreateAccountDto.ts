export interface CreateAccountDto {
  name: string;
  type: string;
  budgetId: string;
  initialBalance?: number;
  description?: string;
}
