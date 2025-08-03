import { Either } from '@either';

import { Account } from '../../../../domain/aggregates/account/account-entity/Account';
import { Transaction } from '../../../../domain/aggregates/transaction/transaction-entity/Transaction';
import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IReconcileAccountRepository {
  execute(params: {
    account: Account;
    transaction: Transaction;
  }): Promise<Either<RepositoryError, void>>;
}
