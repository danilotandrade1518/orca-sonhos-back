import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { IMarkTransactionLateRepository } from '../../../contracts/repositories/transaction/IMarkTransactionLateRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class MarkTransactionLateRepositoryStub
  implements IMarkTransactionLateRepository
{
  public overdueTransactions: Transaction[] = [];
  public shouldFail = false;
  public findCalls = 0;
  public saveCalls: Transaction[] = [];

  async findOverdue(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    date: Date,
  ): Promise<Either<RepositoryError, Transaction[]>> {
    this.findCalls++;
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }
    return Either.success(this.overdueTransactions);
  }

  async save(transaction: Transaction): Promise<Either<RepositoryError, void>> {
    this.saveCalls.push(transaction);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }
    return Either.success();
  }
}
