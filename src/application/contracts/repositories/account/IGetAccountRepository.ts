import { Either } from '@either';

import { Account } from '@domain/aggregates/account/account-entity/Account';
import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IGetAccountRepository {
  execute(id: string): Promise<Either<RepositoryError, Account | null>>;
}
