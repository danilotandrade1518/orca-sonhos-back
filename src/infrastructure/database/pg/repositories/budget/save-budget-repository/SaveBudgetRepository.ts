import { ISaveBudgetRepository } from '@application/contracts/repositories/budget/ISaveBudgetRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { BudgetMapper, BudgetRow } from '../../../mappers/budget/BudgetMapper';

export class SaveBudgetRepository implements ISaveBudgetRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(budget: Budget): Promise<Either<RepositoryError, void>> {
    let row: BudgetRow;
    try {
      row = BudgetMapper.toRow(budget);
      row.updated_at = new Date();
    } catch (error) {
      return Either.error(
        new RepositoryError(
          `Failed to map budget: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          error instanceof Error ? error : new Error('Unknown error'),
        ),
      );
    }

    try {
      const query = `
        UPDATE budgets SET
          name = $2,
          participant_ids = $3,
          is_deleted = $4,
          updated_at = $5
        WHERE id = $1
      `;

      const params = [
        row.id,
        row.name,
        row.participant_ids,
        row.is_deleted,
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
