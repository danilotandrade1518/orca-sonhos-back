import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { IGetTransactionRepository } from '../../../contracts/repositories/transaction/IGetTransactionRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class GetTransactionRepositoryStub implements IGetTransactionRepository {
  public shouldFail = false;
  public shouldReturnNull = false;
  public mockTransaction: Transaction | null = null;

  async execute(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id: string,
  ): Promise<Either<RepositoryError, Transaction | null>> {
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    if (this.shouldReturnNull) {
      return Either.success(null);
    }

    return Either.success(this.mockTransaction);
  }
}
