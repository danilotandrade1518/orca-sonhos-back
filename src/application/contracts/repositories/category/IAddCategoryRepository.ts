import { Category } from '@domain/aggregates/category/category-entity/Category';
import { Either } from '@either';
import { RepositoryError } from '@application/shared/errors/RepositoryError';

export interface IAddCategoryRepository {
  execute(category: Category): Promise<Either<RepositoryError, void>>;
}
