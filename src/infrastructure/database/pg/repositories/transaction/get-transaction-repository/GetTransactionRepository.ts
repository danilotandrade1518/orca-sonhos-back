import { IGetTransactionRepository } from '@application/contracts/repositories/transaction/IGetTransactionRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  TransactionMapper,
  TransactionRow,
} from '../../../mappers/transaction/TransactionMapper';

export class GetTransactionRepository implements IGetTransactionRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(
    id: string,
  ): Promise<Either<RepositoryError, Transaction | null>> {
    try {
      const query = `
        SELECT
          id, description, amount, type, account_id, category_id,
          budget_id, transaction_date, status, is_deleted, created_at, updated_at
        FROM transactions
        WHERE id = $1 AND is_deleted = false
      `;

      const row = await this.connection.queryOne<TransactionRow>(query, [id]);

      if (!row) {
        return Either.success<RepositoryError, Transaction | null>(null);
      }

      const txResult = TransactionMapper.toDomain(row);
      if (txResult.hasError) {
        return Either.error(
          new RepositoryError(
            `Failed to map transaction: ${txResult.errors.map((e) => e.message).join(', ')}`,
            new Error('Mapping error'),
          ),
        );
      }

      return Either.success<RepositoryError, Transaction | null>(
        txResult.data!,
      );
    } catch (error) {
      return Either.error(
        new RepositoryError(
          'Failed to get transaction: ' +
            (error instanceof Error ? error.message : 'Unknown error'),
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}
