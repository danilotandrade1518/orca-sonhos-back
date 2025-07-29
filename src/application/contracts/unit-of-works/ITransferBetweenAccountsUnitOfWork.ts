import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTransferredEvent } from '@domain/aggregates/account/events/AccountTransferredEvent';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

export interface ITransferBetweenAccountsUnitOfWork {
  executeTransfer(params: {
    fromAccount: Account;
    toAccount: Account;
    debitTransaction: Transaction;
    creditTransaction: Transaction;
    fromAccountEvent: AccountTransferredEvent;
    toAccountEvent: AccountTransferredEvent;
  }): Promise<Either<DomainError, void>>;
}
