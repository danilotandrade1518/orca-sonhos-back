import { IAddBudgetRepository } from '@application/contracts/repositories/budget/IAddBudgetRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { BudgetMapper } from '../../../mappers/budget/BudgetMapper';

export class AddBudgetRepository implements IAddBudgetRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(budget: Budget): Promise<Either<RepositoryError, void>> {
    try {
      const row = BudgetMapper.toRow(budget);

      const query = `
        INSERT INTO budgets (
          id, name, owner_id, participant_ids, is_deleted, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      const params = [
        row.id,
        row.name,
        row.owner_id,
        row.participant_ids,
        row.is_deleted,
        row.created_at,
        row.updated_at,
      ];

      await this.connection.queryOne(query, params);
      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === '23505') {
        return Either.error(
          new RepositoryError(
            `Budget with id already exists: ${err.message}`,
            err instanceof Error ? err : new Error('Unknown error'),
          ),
        );
      }
      return Either.error(
        new RepositoryError(
          `Failed to add budget: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
          err instanceof Error ? err : new Error('Unknown error'),
        ),
      );
    }
  }
}
