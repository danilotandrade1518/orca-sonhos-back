import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';

export interface RegisterPastTransactionDto {
  userId: string;
  budgetId: string;
  accountId: string;
  categoryId: string;
  amount: number;
  description: string;
  transactionDate: Date;
  type: TransactionTypeEnum;
}
