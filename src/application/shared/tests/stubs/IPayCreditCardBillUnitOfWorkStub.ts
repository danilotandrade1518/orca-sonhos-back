import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { CreditCardBillPaidEvent } from '@domain/aggregates/credit-card-bill/events/CreditCardBillPaidEvent';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IPayCreditCardBillUnitOfWork } from '../../../contracts/unit-of-works/IPayCreditCardBillUnitOfWork';

export class IPayCreditCardBillUnitOfWorkStub
  implements IPayCreditCardBillUnitOfWork
{
  public shouldFail: boolean = false;
  public executedParams: {
    debitTransaction: Transaction;
    bill: CreditCardBill;
    billPaidEvent: CreditCardBillPaidEvent;
  } | null = null;

  async executePayment(params: {
    debitTransaction: Transaction;
    bill: CreditCardBill;
    billPaidEvent: CreditCardBillPaidEvent;
  }): Promise<Either<DomainError, void>> {
    this.executedParams = params;

    if (this.shouldFail) {
      return Either.error(new Error('Unit of work failed') as DomainError);
    }

    return Either.success(undefined);
  }

  reset(): void {
    this.shouldFail = false;
    this.executedParams = null;
  }
}
