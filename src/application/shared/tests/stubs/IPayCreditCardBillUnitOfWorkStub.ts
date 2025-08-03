import { Account } from '@domain/aggregates/account/account-entity/Account';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IPayCreditCardBillUnitOfWork } from '../../../contracts/unit-of-works/IPayCreditCardBillUnitOfWork';

export class IPayCreditCardBillUnitOfWorkStub implements IPayCreditCardBillUnitOfWork {
  public executePaymentCalls: Array<{
    account: Account;
    bill: CreditCardBill;
    transaction: Transaction;
  }> = [];

  async executePayment(params: {
    account: Account;
    bill: CreditCardBill;
    transaction: Transaction;
  }): Promise<Either<DomainError, void>> {
    this.executePaymentCalls.push(params);
    return Either.success(undefined);
  }
}
