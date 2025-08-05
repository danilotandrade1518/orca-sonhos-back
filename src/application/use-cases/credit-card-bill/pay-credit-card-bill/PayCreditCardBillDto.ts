export interface PayCreditCardBillDto {
  userId: string;
  budgetId: string;
  creditCardBillId: string;
  accountId: string;
  amount: number;
  paymentCategoryId: string;
  paidAt?: Date;
}
