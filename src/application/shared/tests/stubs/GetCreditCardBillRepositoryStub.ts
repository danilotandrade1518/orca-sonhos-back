import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Either } from '@either';

import { IGetCreditCardBillRepository } from '../../../contracts/repositories/credit-card-bill/IGetCreditCardBillRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class GetCreditCardBillRepositoryStub
  implements IGetCreditCardBillRepository
{
  public shouldFail = false;
  public shouldReturnNull = false;
  public executeCalls: string[] = [];
  private creditCardBills: Record<string, CreditCardBill> = {};
  private _mockCreditCardBill: CreditCardBill | null = null;

  set mockCreditCardBill(creditCardBill: CreditCardBill | null) {
    this._mockCreditCardBill = creditCardBill;
    if (creditCardBill) {
      this.creditCardBills[creditCardBill.id] = creditCardBill;
    } else {
      this.creditCardBills = {};
    }
  }

  setCreditCardBill(creditCardBill: CreditCardBill | null) {
    this.mockCreditCardBill = creditCardBill;
  }

  async execute(
    creditCardBillId: string,
  ): Promise<Either<RepositoryError, CreditCardBill | null>> {
    this.executeCalls.push(creditCardBillId);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    if (this.shouldReturnNull) {
      return Either.success(null);
    }

    const creditCardBill =
      this.creditCardBills[creditCardBillId] || this._mockCreditCardBill;
    return Either.success(creditCardBill);
  }
}
