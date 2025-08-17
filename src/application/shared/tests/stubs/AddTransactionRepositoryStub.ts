import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { IAddTransactionRepository } from '../../../contracts/repositories/transaction/IAddTransactionRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class AddTransactionRepositoryStub implements IAddTransactionRepository {
  public shouldFail = false;

  async execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    transaction: Transaction,
  ): Promise<Either<RepositoryError, void>> {
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success();
  }
}
