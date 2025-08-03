import { Account } from '@domain/aggregates/account/account-entity/Account';
import { CreditCardBill } from '@domain/aggregates/credit-card-bill/credit-card-bill-entity/CreditCardBill';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface IPayCreditCardBillUnitOfWork {
  executePayment(params: {
    account: Account;
    bill: CreditCardBill;
    transaction: Transaction;
  }): Promise<Either<DomainError, void>>;
}
