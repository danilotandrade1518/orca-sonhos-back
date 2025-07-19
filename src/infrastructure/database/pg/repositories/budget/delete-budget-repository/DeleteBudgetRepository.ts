import { IDeleteBudgetRepository } from '@application/contracts/repositories/budget/IDeleteBudgetRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';

export class DeleteBudgetRepository implements IDeleteBudgetRepository {
  private readonly connection = PostgreSQLConnection.getInstance();

  async execute(budgetId: string): Promise<Either<RepositoryError, void>> {
    try {
      const query = `
        UPDATE budgets
        SET is_deleted = true, updated_at = NOW()
        WHERE id = $1 AND is_deleted = false
      `;

      await this.connection.queryOne(query, [budgetId]);

      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      return Either.error<RepositoryError, void>(
        new RepositoryError(
          `Failed to delete budget: ${error instanceof Error ? error.message : 'Unknown error'}`,
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}
