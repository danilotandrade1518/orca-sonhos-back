import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { IFindOverdueScheduledTransactionsRepository } from '../../../contracts/repositories/transaction/IFindOverdueScheduledTransactionsRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class FindOverdueScheduledTransactionsRepositoryStub
  implements IFindOverdueScheduledTransactionsRepository
{
  public shouldFail = false;
  public transactions: Transaction[] = [];
  public executeCalls: Date[] = [];

  async execute(
    referenceDate: Date,
  ): Promise<Either<RepositoryError, Transaction[]>> {
    this.executeCalls.push(referenceDate);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }
    return Either.success(this.transactions);
  }
}
