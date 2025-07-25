import { IGetGoalByIdRepository } from '@application/contracts/repositories/goal/IGetGoalByIdRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { GoalMapper, GoalRow } from '../../../mappers/goal/GoalMapper';

export class GetGoalByIdRepository implements IGetGoalByIdRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(id: string): Promise<Either<RepositoryError, Goal | null>> {
    try {
      const query = `
        SELECT 
          id, name, total_amount, accumulated_amount, deadline, budget_id,
          is_achieved, is_deleted, created_at, updated_at
        FROM goals 
        WHERE id = $1 AND is_deleted = false
      `;

      const result = await this.connection.queryOne<GoalRow>(query, [id]);

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
