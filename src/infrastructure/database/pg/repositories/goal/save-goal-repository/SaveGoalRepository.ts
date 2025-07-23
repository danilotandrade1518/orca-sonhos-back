import { ISaveGoalRepository } from '@application/contracts/repositories/goal/ISaveGoalRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { GoalMapper } from '../../../mappers/goal/GoalMapper';

export class SaveGoalRepository implements ISaveGoalRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(goal: Goal): Promise<Either<RepositoryError, void>> {
    try {
      const row = GoalMapper.toRow(goal);

      const query = `
        UPDATE goals 
        SET 
          name = $2,
          total_amount = $3,
          accumulated_amount = $4,
          deadline = $5,
          budget_id = $6,
          is_achieved = $7,
          is_deleted = $8,
          updated_at = $9
        WHERE id = $1
      `;

      const params = [
        row.id,
        row.name,
        row.total_amount,
        row.accumulated_amount,
        row.deadline,
        row.budget_id,
        row.is_achieved,
        row.is_deleted,
        row.updated_at,
      ];

      const result = await this.connection.queryOne(query, params);

      if (!result || result.rowCount === 0) {
        return Either.error(
          new RepositoryError(
            `Goal with id ${goal.id} not found for update`,
            new Error('Goal not found'),
          ),
        );
      }

      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error;
      return Either.error(
        new RepositoryError(`Failed to save goal: ${err.message}`, err),
      );
    }
  }
}
