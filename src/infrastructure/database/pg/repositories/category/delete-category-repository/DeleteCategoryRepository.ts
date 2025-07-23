import { IDeleteCategoryRepository } from '@application/contracts/repositories/category/IDeleteCategoryRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';

export class DeleteCategoryRepository implements IDeleteCategoryRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(id: string): Promise<Either<RepositoryError, void>> {
    try {
      const query = `
        UPDATE categories 
        SET 
          is_deleted = true,
          updated_at = NOW()
        WHERE id = $1 AND is_deleted = false
      `;

      const result = await this.connection.queryOne(query, [id]);

      if (!result || result.rowCount === 0) {
        return Either.error(
          new RepositoryError(
            `Category with id ${id} not found for deletion`,
            new Error('Category not found'),
          ),
        );
      }

      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error;
      return Either.error(
        new RepositoryError(`Failed to delete category: ${err.message}`, err),
      );
    }
  }
}
