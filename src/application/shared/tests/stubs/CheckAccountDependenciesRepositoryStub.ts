import { Either } from '@either';

import { ICheckAccountDependenciesRepository } from '../../../contracts/repositories/account/ICheckAccountDependenciesRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class CheckAccountDependenciesRepositoryStub
  implements ICheckAccountDependenciesRepository
{
  public shouldFail = false;
  public mockHasTransactions = false;
  public hasTransactionsCalls: string[] = [];

  async hasTransactions(
    accountId: string,
  ): Promise<Either<RepositoryError, boolean>> {
    this.hasTransactionsCalls.push(accountId);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success(this.mockHasTransactions);
  }
}
