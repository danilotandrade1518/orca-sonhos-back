export interface CreateCreditCardDto {
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  budgetId: string;
}
