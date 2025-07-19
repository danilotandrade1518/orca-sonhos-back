import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';

export interface TransactionRow {
  id: string;
  description: string;
  amount: string;
  type: string;
  account_id: string;
  category_id: string | null;
  budget_id: string;
  transaction_date: Date;
  status: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
}

export class TransactionMapper {
  static toDomain(row: TransactionRow): Either<DomainError, Transaction> {
    const amount = Math.round(parseFloat(row.amount) * 100);

    return Transaction.restore({
      id: row.id,
      description: row.description,
      amount,
      type: row.type as TransactionTypeEnum,
      accountId: row.account_id,
      categoryId: row.category_id,
      budgetId: row.budget_id,
      transactionDate: row.transaction_date,
      status: row.status as TransactionStatusEnum,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  static toRow(transaction: Transaction): TransactionRow {
    return {
      id: transaction.id,
      description: transaction.description,
      amount: (transaction.amount / 100).toFixed(2),
      type: transaction.type,
      account_id: transaction.accountId,
      category_id: transaction.categoryId || null,
      budget_id: transaction.budgetId,
      transaction_date: transaction.transactionDate,
      status: transaction.status,
      is_deleted: transaction.isDeleted,
      created_at: transaction.createdAt,
      updated_at: transaction.updatedAt,
    } as TransactionRow;
  }
}
