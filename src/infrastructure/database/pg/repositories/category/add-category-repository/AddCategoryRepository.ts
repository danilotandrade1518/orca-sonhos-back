import { IAddCategoryRepository } from '@application/contracts/repositories/category/IAddCategoryRepository';
import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Category } from '@domain/aggregates/category/category-entity/Category';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { CategoryMapper } from '../../../mappers/category/CategoryMapper';

export class AddCategoryRepository implements IAddCategoryRepository {
  constructor(private readonly connection: IPostgresConnectionAdapter) {}

  async execute(category: Category): Promise<Either<RepositoryError, void>> {
    try {
      const row = CategoryMapper.toRow(category);

      const query = `
        INSERT INTO categories (
          id, name, type, budget_id, is_deleted, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      `;

      const params = [
        row.id,
        row.name,
        row.type,
        row.budget_id,
        row.is_deleted,
        row.created_at,
        row.updated_at,
      ];

      await this.connection.queryOne(query, params);
      return Either.success<RepositoryError, void>(undefined);
    } catch (error) {
      const err = error as Error & { code?: string };
      if (err.code === '23505') {
        return Either.error(
          new RepositoryError(
            `Category with id already exists: ${err.message}`,
            err instanceof Error ? err : new Error('Unknown error'),
          ),
        );
      }
      return Either.error(
        new RepositoryError(
          `Failed to add category: ${
            err instanceof Error ? err.message : 'Unknown error'
          }`,
          err instanceof Error ? err : new Error('Unknown error'),
        ),
      );
    }
  }
}
