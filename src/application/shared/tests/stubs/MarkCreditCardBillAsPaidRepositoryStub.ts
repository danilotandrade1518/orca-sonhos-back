import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { Either } from '@either';

import { IMarkCreditCardBillAsPaidRepository } from '../../../contracts/repositories/credit-card-bill/IMarkCreditCardBillAsPaidRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class MarkCreditCardBillAsPaidRepositoryStub
  implements IMarkCreditCardBillAsPaidRepository
{
  public shouldFail = false;
  public executeCalls: Array<{
    creditCardBill: CreditCardBill;
    account: Account;
    transaction: Transaction;
  }> = [];

  async execute(params: {
    creditCardBill: CreditCardBill;
    account: Account;
    transaction: Transaction;
  }): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(params);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }
    return Either.success();
  }
}
