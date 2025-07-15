import { Either } from '@either';

import { Account } from '../../../../domain/aggregates/account/account-entity/Account';
import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class GetAccountRepositoryStub implements IGetAccountRepository {
  public shouldFail = false;
  public shouldReturnNull = false;
  public mockAccount: Account | null = null;
  public executeCalls: string[] = [];

  async execute(id: string): Promise<Either<RepositoryError, Account | null>> {
    this.executeCalls.push(id);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    if (this.shouldReturnNull) {
      return Either.success(null);
    }

    return Either.success(this.mockAccount);
  }
}
