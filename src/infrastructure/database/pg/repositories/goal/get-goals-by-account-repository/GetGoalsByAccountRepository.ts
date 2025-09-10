import { IGetGoalsByAccountRepository } from '@application/contracts/repositories/goal/IGetGoalsByAccountRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { GoalMapper, GoalRow } from '../../../mappers/goal/GoalMapper';

export class GetGoalsByAccountRepository
  implements IGetGoalsByAccountRepository
{
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(accountId: string): Promise<Either<RepositoryError, Goal[]>> {
    try {
      const query = `
        SELECT 
          id, name, total_amount, accumulated_amount, deadline, budget_id,
          source_account_id, is_deleted, created_at, updated_at
        FROM goals 
        WHERE source_account_id = $1 AND is_deleted = false
      `;

      const queryResultRow = await this.connection.query<GoalRow>(query, [
        accountId,
      ]);

      const rows = queryResultRow?.rows || [];
      const goals: Goal[] = [];

      for (const row of rows) {
        const goalOrError = GoalMapper.toDomain(row);
        if (goalOrError.hasError) {
          return Either.error(
            new RepositoryError(
              `Failed to map goal from database: ${goalOrError.errors[0].message}`,
              goalOrError.errors[0],
            ),
          );
        }
        goals.push(goalOrError.data!);
      }

      return Either.success<RepositoryError, Goal[]>(goals);
    } catch (error) {
      const err = error as Error;
      return Either.error(
        new RepositoryError(
          `Failed to get goals by account: ${err.message}`,
          err,
        ),
      );
    }
  }
}
