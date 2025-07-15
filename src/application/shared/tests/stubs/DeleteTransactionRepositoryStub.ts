import { Either } from '@either';

import { IDeleteTransactionRepository } from '../../../contracts/repositories/transaction/IDeleteTransactionRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class DeleteTransactionRepositoryStub
  implements IDeleteTransactionRepository
{
  public shouldFail = false;
  public executeCalls: string[] = [];

  async execute(id: string): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(id);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success(undefined);
  }
}
