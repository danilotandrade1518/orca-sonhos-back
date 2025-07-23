import { Either } from '@either';
import { RepositoryError } from '@application/shared/errors/RepositoryError';

export interface ICheckCategoryDependenciesRepository {
  execute(categoryId: string): Promise<Either<RepositoryError, boolean>>;
}
