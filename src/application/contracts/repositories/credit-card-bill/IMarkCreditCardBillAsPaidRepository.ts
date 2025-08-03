import { Either } from '@either';

import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { RepositoryError } from '../../shared/errors/RepositoryError';

export interface IMarkCreditCardBillAsPaidRepository {
  execute(params: {
    creditCardBill: CreditCardBill;
    account: Account;
    transaction: Transaction;
  }): Promise<Either<RepositoryError, void>>;
}
