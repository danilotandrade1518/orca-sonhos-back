import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IDeleteTransactionRepository {
  execute(id: string): Promise<Either<RepositoryError, void>>;
}
