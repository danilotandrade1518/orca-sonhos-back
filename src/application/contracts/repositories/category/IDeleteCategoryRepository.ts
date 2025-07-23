import { Either } from '@either';
import { RepositoryError } from '@application/shared/errors/RepositoryError';

export interface IDeleteCategoryRepository {
  execute(categoryId: string): Promise<Either<RepositoryError, void>>;
}
