import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { ICancelScheduledTransactionRepository } from '../../../contracts/repositories/transaction/ICancelScheduledTransactionRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class CancelScheduledTransactionRepositoryStub
  implements ICancelScheduledTransactionRepository
{
  public shouldFail = false;
  public executeCalls: Transaction[] = [];

  async execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transaction: Transaction,
  ): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(transaction);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }
    return Either.success();
  }
}
