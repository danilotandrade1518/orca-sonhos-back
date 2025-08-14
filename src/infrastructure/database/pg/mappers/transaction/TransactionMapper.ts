import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { TransactionStatusEnum } from '@domain/aggregates/transaction/value-objects/transaction-status/TransactionStatus';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface TransactionRow {
  id: string;
  description: string;
  amount: number;
  type: string;
  account_id: string;
  category_id: string;
  budget_id: string;
  transaction_date: Date;
  status: string;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  cancellation_reason?: string;
  cancelled_at?: Date;
}

export class TransactionMapper {
  static toDomain(row: TransactionRow): Either<DomainError, Transaction> {
    return Transaction.restore({
      id: row.id,
      description: row.description,
      amount: Number(row.amount),
      type: row.type as TransactionTypeEnum,
      accountId: row.account_id,
      categoryId: row.category_id,
      budgetId: row.budget_id,
      transactionDate: row.transaction_date,
      status: row.status as TransactionStatusEnum,
      isDeleted: row.is_deleted,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      cancellationReason: row.cancellation_reason,
      cancelledAt: row.cancelled_at,
    });
  }

  static toRow(transaction: Transaction): TransactionRow {
    return {
      id: transaction.id,
      description: transaction.description,
      amount: transaction.amount,
      type: transaction.type,
      account_id: transaction.accountId,
      category_id: transaction.categoryId || null,
      budget_id: transaction.budgetId,
      transaction_date: transaction.transactionDate,
      status: transaction.status,
      is_deleted: transaction.isDeleted,
      created_at: transaction.createdAt,
      updated_at: transaction.updatedAt,
      cancellation_reason: transaction.cancellationReason,
      cancelled_at: transaction.cancelledAt,
    } as TransactionRow;
  }
}
