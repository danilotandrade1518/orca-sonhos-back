import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';

export interface UpdateTransactionDto {
  userId: string;
  id: string;
  description?: string;
  amount?: number;
  type?: TransactionTypeEnum;
  accountId?: string;
  categoryId?: string;
  transactionDate?: Date;
}
