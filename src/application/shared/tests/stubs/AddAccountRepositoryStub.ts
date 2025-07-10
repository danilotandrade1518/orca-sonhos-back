import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Either } from '@either';

import { IAddAccountRepository } from '../../../contracts/repositories/account/IAddAccountRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class AddAccountRepositoryStub implements IAddAccountRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_account: Account): Promise<Either<RepositoryError, void>> {
    return Either.success();
  }
}
