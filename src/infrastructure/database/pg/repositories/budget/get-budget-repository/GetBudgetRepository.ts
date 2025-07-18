import { Either } from '../../../../../../shared/core/either';

import { Budget } from '../../../../../../domain/aggregates/budget/budget-entity/Budget';
import { IGetBudgetRepository } from '../../../../../../application/contracts/repositories/budget/IGetBudgetRepository';
import { RepositoryError } from '../../../../../../application/shared/errors/RepositoryError';
import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import { BudgetMapper, BudgetRow } from '../../../mappers/BudgetMapper';

export class GetBudgetRepository implements IGetBudgetRepository {
  private readonly connection = PostgreSQLConnection.getInstance();

  async execute(id: string): Promise<Either<RepositoryError, Budget | null>> {
    try {
      const query = `
        SELECT 
          id,
          name,
          owner_id,
          participant_ids,
          is_deleted,
          created_at,
          updated_at
        FROM budgets 
        WHERE id = $1 AND is_deleted = false
      `;

      const result = await this.connection.queryOne<BudgetRow>(query, [id]);

      if (!result) {
        return Either.success<RepositoryError, Budget | null>(null);
      }

      const budgetResult = BudgetMapper.toDomain(result);
      if (budgetResult.hasError) {
        return Either.error<RepositoryError, Budget | null>(
          new RepositoryError(
            `Failed to map budget: ${budgetResult.errors.map((e) => e.message).join(', ')}`,
            new Error('Mapping error'),
          ),
        );
      }

      return Either.success<RepositoryError, Budget | null>(budgetResult.data!);
    } catch (error) {
      return Either.error<RepositoryError, Budget | null>(
        new RepositoryError(
          'Database error',
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }
  }
}
