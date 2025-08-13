import { IFindOverdueScheduledTransactionsRepository } from '@application/contracts/repositories/transaction/IFindOverdueScheduledTransactionsRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  TransactionMapper,
  TransactionRow,
} from '../../../mappers/transaction/TransactionMapper';

export class FindOverdueScheduledTransactionsRepository
  implements IFindOverdueScheduledTransactionsRepository
{
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(
    referenceDate: Date,
  ): Promise<Either<RepositoryError, Transaction[]>> {
    try {
      const query = `
        SELECT
          id, description, amount, type, account_id, category_id,
          budget_id, transaction_date, status, is_deleted, created_at, updated_at
        FROM transactions
        WHERE status = $1 
          AND transaction_date < $2 
          AND is_deleted = false
        ORDER BY transaction_date ASC
      `;

      const queryResultRow = await this.connection.query<TransactionRow>(
        query,
        ['SCHEDULED', referenceDate],
      );

      const rows = queryResultRow?.rows || [];

      const transactions: Transaction[] = [];

      for (const row of rows) {
        const txResult = TransactionMapper.toDomain(row);
        if (txResult.hasError) {
          return Either.error(
            new RepositoryError(
              `Failed to map transaction: ${txResult.errors.map((e) => e.message).join(', ')}`,
              new Error('Mapping error'),
            ),
          );
        }
        transactions.push(txResult.data!);
      }

      return Either.success<RepositoryError, Transaction[]>(transactions);
    } catch (error) {
      return Either.error(
        new RepositoryError(
          `Failed to find overdue scheduled transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}
