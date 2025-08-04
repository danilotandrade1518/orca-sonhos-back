import { Either } from '@either';

import { IHasTransactionByEnvelopeRepository } from '../../../contracts/repositories/transaction/IHasTransactionByEnvelopeRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class TransactionRepositoryStub
  implements IHasTransactionByEnvelopeRepository
{
  public shouldFail = false;
  public hasTransactionsResult = false;
  public hasByEnvelopeCalls: string[] = [];

  async hasTransactionByEnvelope(
    envelopeId: string,
  ): Promise<Either<RepositoryError, boolean>> {
    this.hasByEnvelopeCalls.push(envelopeId);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }
    return Either.success(this.hasTransactionsResult);
  }
}
