import { IGetCategoryByIdRepository } from '@application/contracts/repositories/category/IGetCategoryByIdRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Category } from '@domain/aggregates/category/category-entity/Category';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  CategoryMapper,
  CategoryRow,
} from '../../../mappers/category/CategoryMapper';

export class GetCategoryByIdRepository implements IGetCategoryByIdRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(id: string): Promise<Either<RepositoryError, Category | null>> {
    try {
      const query = `
        SELECT 
          id, name, type, budget_id, is_deleted, created_at, updated_at
        FROM categories 
        WHERE id = $1 AND is_deleted = false
      `;

      const result = await this.connection.queryOne<CategoryRow>(query, [id]);

      if (!result) {
        return Either.success<RepositoryError, Category | null>(null);
      }

      const categoryOrError = CategoryMapper.toDomain(result);
      if (categoryOrError.hasError) {
        return Either.error(
          new RepositoryError(
            `Failed to map category from database: ${categoryOrError.errors[0].message}`,
            categoryOrError.errors[0],
          ),
        );
      }

      return Either.success<RepositoryError, Category | null>(
        categoryOrError.data!,
      );
    } catch (error) {
      const err = error as Error;
      return Either.error(
        new RepositoryError(
          `Failed to get category by id: ${err.message}`,
          err,
        ),
      );
    }
  }
}
