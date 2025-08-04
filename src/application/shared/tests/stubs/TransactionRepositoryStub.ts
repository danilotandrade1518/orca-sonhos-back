import { Either } from '@either';

import { ITransactionRepository } from '../../../contracts/repositories/transaction/ITransactionRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class TransactionRepositoryStub implements ITransactionRepository {
  public shouldFail = false;
  public hasTransactionsResult = false;
  public hasByEnvelopeCalls: string[] = [];

  async hasByEnvelope(
    envelopeId: string,
  ): Promise<Either<RepositoryError, boolean>> {
    this.hasByEnvelopeCalls.push(envelopeId);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }
    return Either.success(this.hasTransactionsResult);
  }
}
