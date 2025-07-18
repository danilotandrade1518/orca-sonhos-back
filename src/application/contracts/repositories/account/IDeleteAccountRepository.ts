import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IDeleteAccountRepository {
  execute(accountId: string): Promise<Either<RepositoryError, void>>;
}
