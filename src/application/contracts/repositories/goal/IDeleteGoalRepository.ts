import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Either } from '@either';

export interface IDeleteGoalRepository {
  execute(id: string): Promise<Either<RepositoryError, void>>;
}
