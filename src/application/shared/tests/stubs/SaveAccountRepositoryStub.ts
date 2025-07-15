import { Either } from '@either';

import { Account } from '../../../../domain/aggregates/account/account-entity/Account';
import { ISaveAccountRepository } from '../../../contracts/repositories/account/ISaveAccountRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class SaveAccountRepositoryStub implements ISaveAccountRepository {
  public shouldFail = false;
  public executeCalls: Account[] = [];

  async execute(account: Account): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(account);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success();
  }
}
