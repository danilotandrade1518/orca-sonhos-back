export interface MarkCreditCardBillAsPaidDto {
  userId: string;
  budgetId: string;
  creditCardBillId: string;
  paymentAmount: number;
  paymentDate: Date;
  sourceAccountId: string;
  description?: string;
}
