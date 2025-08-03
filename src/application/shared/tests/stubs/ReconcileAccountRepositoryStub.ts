import { Either } from '@either';

import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { IReconcileAccountRepository } from '../../../contracts/repositories/account/IReconcileAccountRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class ReconcileAccountRepositoryStub implements IReconcileAccountRepository {
  public shouldFail = false;
  public executeCalls: Array<{ account: Account; transaction: Transaction }> = [];

  async execute(params: {
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
