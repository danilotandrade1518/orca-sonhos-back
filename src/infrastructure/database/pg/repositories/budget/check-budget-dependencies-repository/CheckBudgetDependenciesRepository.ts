import { ICheckBudgetDependenciesRepository } from '@application/contracts/repositories/budget/ICheckBudgetDependenciesRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';

export class CheckBudgetDependenciesRepository
  implements ICheckBudgetDependenciesRepository
{
  private readonly connection = PostgreSQLConnection.getInstance();

  async hasAccounts(
    budgetId: string,
  ): Promise<Either<RepositoryError, boolean>> {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM accounts 
          WHERE budget_id = $1 AND is_deleted = false
        ) as has_accounts
      `;

      const result = await this.connection.queryOne<{ has_accounts: boolean }>(
        query,
        [budgetId],
      );
      return Either.success<RepositoryError, boolean>(
        result?.has_accounts || false,
      );
    } catch (error) {
      return Either.error(
        new RepositoryError(
          `Failed to check budget accounts: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }

  async hasTransactions(
    budgetId: string,
  ): Promise<Either<RepositoryError, boolean>> {
    try {
      const query = `
        SELECT EXISTS(
          SELECT 1 FROM transactions 
          WHERE budget_id = $1 AND is_deleted = false
        ) as has_transactions
      `;

      const result = await this.connection.queryOne<{
        has_transactions: boolean;
      }>(query, [budgetId]);
      return Either.success<RepositoryError, boolean>(
        result?.has_transactions || false,
      );
    } catch (error) {
      return Either.error(
        new RepositoryError(
          `Failed to check budget transactions: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}
