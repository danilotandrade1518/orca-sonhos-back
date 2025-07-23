import { IDeleteGoalRepository } from '@application/contracts/repositories/goal/IDeleteGoalRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';

export class DeleteGoalRepository implements IDeleteGoalRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(id: string): Promise<Either<RepositoryError, void>> {
    try {
      const query = `
        UPDATE goals 
        SET 
          is_deleted = true,
          updated_at = NOW()
        WHERE id = $1 AND is_deleted = false
      `;

      const result = await this.connection.queryOne(query, [id]);

      if (!result || result.rowCount === 0) {
        return Either.error(
          new RepositoryError(
            `Goal with id ${id} not found for deletion`,
            new Error('Goal not found'),
          ),
        );
      }

      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error;
      return Either.error(
        new RepositoryError(`Failed to delete goal: ${err.message}`, err),
      );
    }
  }
}
