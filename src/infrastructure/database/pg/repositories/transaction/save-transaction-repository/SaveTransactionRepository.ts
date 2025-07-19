import { ISaveTransactionRepository } from '@application/contracts/repositories/transaction/ISaveTransactionRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';
import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import {
  TransactionMapper,
  TransactionRow,
} from '../../../mappers/transaction/TransactionMapper';

export class SaveTransactionRepository implements ISaveTransactionRepository {
  private readonly connection = PostgreSQLConnection.getInstance();

  async execute(
    transaction: Transaction,
  ): Promise<Either<RepositoryError, void>> {
    let row: TransactionRow;
    try {
      row = TransactionMapper.toRow(transaction);
      row.updated_at = new Date();
    } catch (error) {
      return Either.error(
        new RepositoryError(
          `Failed to map transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }

    try {
      const query = `
        INSERT INTO transactions (
          id, description, amount, type, account_id, category_id,
          budget_id, transaction_date, status, is_deleted, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          description = EXCLUDED.description,
          amount = EXCLUDED.amount,
          type = EXCLUDED.type,
          account_id = EXCLUDED.account_id,
          category_id = EXCLUDED.category_id,
          budget_id = EXCLUDED.budget_id,
          transaction_date = EXCLUDED.transaction_date,
          status = EXCLUDED.status,
          is_deleted = EXCLUDED.is_deleted,
          updated_at = EXCLUDED.updated_at
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
      return Either.error(
        new RepositoryError(
          'Database error',
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}
