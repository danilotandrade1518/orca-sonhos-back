import { Either } from '@either';

import { IDeleteCreditCardBillRepository } from '../../../contracts/repositories/credit-card-bill/IDeleteCreditCardBillRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class DeleteCreditCardBillRepositoryStub
  implements IDeleteCreditCardBillRepository
{
  public shouldFail = false;
  public executeCalls: string[] = [];

  async execute(
    creditCardBillId: string,
  ): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(creditCardBillId);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success();
  }
}
