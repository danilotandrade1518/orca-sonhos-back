import { Either } from '@either';

import { Account } from '../../../../domain/aggregates/account/account-entity/Account';
import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface ISaveAccountRepository {
  execute(account: Account): Promise<Either<RepositoryError, void>>;
}
