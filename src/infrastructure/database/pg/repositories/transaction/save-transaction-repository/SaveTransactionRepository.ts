import { ISaveTransactionRepository } from '@application/contracts/repositories/transaction/ISaveTransactionRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  TransactionMapper,
  TransactionRow,
} from '../../../mappers/transaction/TransactionMapper';

export class SaveTransactionRepository implements ISaveTransactionRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

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
        UPDATE transactions SET
          description = $2,
          amount = $3,
          type = $4,
          account_id = $5,
          category_id = $6,
          budget_id = $7,
          transaction_date = $8,
          status = $9,
          is_deleted = $10,
          updated_at = $11
        WHERE id = $1
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
        row.updated_at,
      ];

      await this.connection.query(query, params);
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
