import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface ICheckAccountDependenciesRepository {
  hasTransactions(accountId: string): Promise<Either<RepositoryError, boolean>>;
}
