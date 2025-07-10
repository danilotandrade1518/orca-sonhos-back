import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IAddAccountRepository {
  execute(account: Account): Promise<Either<RepositoryError, void>>;
}
