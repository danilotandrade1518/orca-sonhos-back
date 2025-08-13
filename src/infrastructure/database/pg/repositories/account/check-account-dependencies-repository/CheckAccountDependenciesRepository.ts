import { ICheckAccountDependenciesRepository } from '@application/contracts/repositories/account/ICheckAccountDependenciesRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';

export class CheckAccountDependenciesRepository
  implements ICheckAccountDependenciesRepository
{
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async hasTransactions(
    accountId: string,
  ): Promise<Either<RepositoryError, boolean>> {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM transactions
          WHERE account_id = $1 AND is_deleted = false
        ) as has_transactions
      `;

      const queryResultRow = await this.connection.query<{
        has_transactions: boolean;
      }>(query, [accountId]);

      const result = queryResultRow?.rows[0];

      return Either.success<RepositoryError, boolean>(
        result?.has_transactions || false,
      );
    } catch (error) {
      return Either.error(
        new RepositoryError(
          `Failed to check account transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}
