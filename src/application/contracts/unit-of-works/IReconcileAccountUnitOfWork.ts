import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { ApplicationError } from '../../shared/errors/ApplicationError';

export interface IReconcileAccountUnitOfWork {
  executeReconciliation(params: {
    account: Account;
    transaction: Transaction;
  }): Promise<Either<DomainError | ApplicationError, void>>;
}
