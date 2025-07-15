import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';

export interface CreateTransactionDto {
  description: string;
  amount: number;
  type: TransactionTypeEnum;
  accountId: string;
  categoryId: string;
  budgetId: string;
  transactionDate?: Date;
}
