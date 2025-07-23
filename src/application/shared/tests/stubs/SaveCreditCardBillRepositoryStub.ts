import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Either } from '@either';

import { ISaveCreditCardBillRepository } from '../../../contracts/repositories/credit-card-bill/ISaveCreditCardBillRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class SaveCreditCardBillRepositoryStub
  implements ISaveCreditCardBillRepository
{
  public shouldFail = false;
  public executeCalls: CreditCardBill[] = [];

  async execute(
    creditCardBill: CreditCardBill,
  ): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(creditCardBill);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success();
  }
}
