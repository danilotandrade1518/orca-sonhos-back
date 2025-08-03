import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { ISaveTransactionRepository } from '../../../contracts/repositories/transaction/ISaveTransactionRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class SaveTransactionRepositoryStub
  implements ISaveTransactionRepository
{
  public shouldFail = false;
  public executeCalls: Transaction[] = [];

  async execute(
    transaction: Transaction,
  ): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(transaction);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success();
  }
}
