import { IReconcileAccountUnitOfWork } from '@application/contracts/unit-of-works/IReconcileAccountUnitOfWork';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { RepositoryError } from '../../errors/RepositoryError';

export class IReconcileAccountUnitOfWorkStub
  implements IReconcileAccountUnitOfWork
{
  public shouldFail = false;
  public executeCalls: Array<{ account: Account; transaction: Transaction }> =
    [];

  async executeReconciliation(params: {
    account: Account;
    transaction: Transaction;
  }): Promise<Either<DomainError | ApplicationError, void>> {
    this.executeCalls.push(params);
    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }
    return Either.success();
  }
}
