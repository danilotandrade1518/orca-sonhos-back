import { IGetGoalRepository } from '@application/contracts/repositories/goal/IGetGoalRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { GoalMapper, GoalRow } from '../../../mappers/goal/GoalMapper';

export class GetGoalByIdRepository implements IGetGoalRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(id: string): Promise<Either<RepositoryError, Goal | null>> {
    try {
      const query = `
        SELECT 
          id, name, total_amount, accumulated_amount, deadline, budget_id,
          source_account_id, is_deleted, created_at, updated_at
        FROM goals 
        WHERE id = $1 AND is_deleted = false
      `;

      const queryResultRow = await this.connection.query<GoalRow>(query, [id]);

      const result = queryResultRow?.rows[0];

      if (!result) {
        return Either.success<RepositoryError, Goal | null>(null);
      }

      const goalOrError = GoalMapper.toDomain(result);
      if (goalOrError.hasError) {
        return Either.error(
          new RepositoryError(
            `Failed to map goal from database: ${goalOrError.errors[0].message}`,
            goalOrError.errors[0],
          ),
        );
      }

      return Either.success<RepositoryError, Goal | null>(goalOrError.data!);
    } catch (error) {
      const err = error as Error;
      return Either.error(
        new RepositoryError(`Failed to get goal by id: ${err.message}`, err),
      );
    }
  }
}
