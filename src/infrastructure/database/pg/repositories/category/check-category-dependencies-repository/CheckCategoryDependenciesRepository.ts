import { ICheckCategoryDependenciesRepository } from '@application/contracts/repositories/category/ICheckCategoryDependenciesRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';

export class CheckCategoryDependenciesRepository
  implements ICheckCategoryDependenciesRepository
{
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(categoryId: string): Promise<Either<RepositoryError, boolean>> {
    try {
      const transactionQuery = `
        SELECT COUNT(*) as count
        FROM transactions 
        WHERE category_id = $1 AND is_deleted = false
      `;

      const queryResultRow = await this.connection.query<{
        count: string;
      }>(transactionQuery, [categoryId]);

      const transactionResult = queryResultRow?.rows[0];

      const transactionCount = parseInt(transactionResult?.count || '0', 10);

      return Either.success<RepositoryError, boolean>(transactionCount > 0);
    } catch (error) {
      const err = error as Error;
      return Either.error(
        new RepositoryError(
          `Failed to check category dependencies: ${err.message}`,
          err,
        ),
      );
    }
  }
}
