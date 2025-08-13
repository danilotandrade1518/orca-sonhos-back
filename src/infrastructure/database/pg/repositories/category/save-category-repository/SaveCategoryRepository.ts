import { ISaveCategoryRepository } from '@application/contracts/repositories/category/ISaveCategoryRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Category } from '@domain/aggregates/category/category-entity/Category';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { CategoryMapper } from '../../../mappers/category/CategoryMapper';

export class SaveCategoryRepository implements ISaveCategoryRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(category: Category): Promise<Either<RepositoryError, void>> {
    try {
      const row = CategoryMapper.toRow(category);

      const query = `
        UPDATE categories 
        SET 
          name = $2,
          type = $3,
          budget_id = $4,
          is_deleted = $5,
          updated_at = $6
        WHERE id = $1
      `;

      const params = [
        row.id,
        row.name,
        row.type,
        row.budget_id,
        row.is_deleted,
        row.updated_at,
      ];

      await this.connection.query(query, params);

      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error;
      return Either.error(
        new RepositoryError(`Failed to save category: ${err.message}`, err),
      );
    }
  }
}
