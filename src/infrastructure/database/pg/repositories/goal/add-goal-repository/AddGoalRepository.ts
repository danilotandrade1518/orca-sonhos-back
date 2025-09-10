import { IAddGoalRepository } from '@application/contracts/repositories/goal/IAddGoalRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { GoalMapper } from '../../../mappers/goal/GoalMapper';

export class AddGoalRepository implements IAddGoalRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(goal: Goal): Promise<Either<RepositoryError, void>> {
    try {
      const row = GoalMapper.toRow(goal);

      const query = `
        INSERT INTO goals (
          id, source_account_id, name, total_amount, accumulated_amount, deadline, budget_id, 
          is_deleted, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      `;

      const params = [
        row.id,
        row.source_account_id,
        row.name,
        row.total_amount,
        row.accumulated_amount,
        row.deadline,
        row.budget_id,
        row.is_deleted,
        row.created_at,
        row.updated_at,
      ];

      await this.connection.query(query, params);
      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === '23505') {
        return Either.error(
          new RepositoryError(
            `Goal with id already exists: ${err.message}`,
            err instanceof Error ? err : new Error('Unknown error'),
          ),
        );
      }
      return Either.error(
        new RepositoryError(
          `Failed to add goal: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
          err instanceof Error ? err : new Error('Unknown error'),
        ),
      );
    }
  }
}
