import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Either } from '@either';

import { IReopenCreditCardBillRepository } from '../../../contracts/repositories/credit-card-bill/IReopenCreditCardBillRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class ReopenCreditCardBillRepositoryStub
  implements IReopenCreditCardBillRepository
{
  public shouldFail = false;
  public executeCalls: CreditCardBill[] = [];

  async execute(bill: CreditCardBill): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(bill);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }
    return Either.success();
  }
}
