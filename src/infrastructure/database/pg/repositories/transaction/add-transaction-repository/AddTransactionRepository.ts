import { IAddTransactionRepository } from '@application/contracts/repositories/transaction/IAddTransactionRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { TransactionMapper } from '../../../mappers/transaction/TransactionMapper';

export class AddTransactionRepository implements IAddTransactionRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(
    transaction: Transaction,
  ): Promise<Either<RepositoryError, void>> {
    try {
      const row = TransactionMapper.toRow(transaction);
      const query = `
        INSERT INTO transactions (
          id, description, amount, type, account_id, category_id,
          budget_id, transaction_date, status, is_deleted, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      `;
      const params = [
        row.id,
        row.description,
        row.amount,
        row.type,
        row.account_id,
        row.category_id,
        row.budget_id,
        row.transaction_date,
        row.status,
        row.is_deleted,
        row.created_at,
        row.updated_at,
      ];
      await this.connection.queryOne(query, params);
      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === '23505') {
        return Either.error(
          new RepositoryError(
            `Transaction with id already exists: ${err.message}`,
            err instanceof Error ? err : new Error('Unknown error'),
          ),
        );
      }
      return Either.error(
        new RepositoryError(
          `Failed to add transaction: ${err instanceof Error ? err.message : 'Unknown error'}`,
          err instanceof Error ? err : new Error('Unknown error'),
        ),
      );
    }
  }
}
