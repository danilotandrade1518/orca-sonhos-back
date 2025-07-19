import { ICheckAccountDependenciesRepository } from '@application/contracts/repositories/account/ICheckAccountDependenciesRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';

export class CheckAccountDependenciesRepository
  implements ICheckAccountDependenciesRepository
{
  private readonly connection = PostgreSQLConnection.getInstance();

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

      const result = await this.connection.queryOne<{
        has_transactions: boolean;
      }>(query, [accountId]);

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
