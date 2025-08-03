import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface IRegisterPastTransactionUnitOfWork {
  execute(params: {
    account: Account;
    transaction: Transaction;
  }): Promise<Either<DomainError, void>>;
}
