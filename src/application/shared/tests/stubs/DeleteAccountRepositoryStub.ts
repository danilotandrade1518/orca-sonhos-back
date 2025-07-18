import { Either } from '@either';

import { IDeleteAccountRepository } from '../../../contracts/repositories/account/IDeleteAccountRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class DeleteAccountRepositoryStub implements IDeleteAccountRepository {
  public shouldFail = false;
  public executeCalls: string[] = [];

  async execute(accountId: string): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(accountId);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success();
  }
}
