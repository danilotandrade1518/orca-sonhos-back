import { Either } from '@either';
import { IReconcileAccountUnitOfWork } from '@application/contracts/unit-of-works/IReconcileAccountUnitOfWork';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { DomainError } from '@domain/shared/DomainError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { BudgetPersistenceFailedError } from '@application/shared/errors/BudgetPersistenceFailedError';

export class MockReconcileAccountUnitOfWork
  implements IReconcileAccountUnitOfWork
{
  public executeCallCount = 0;
  public shouldFail = false;
  public lastParams: {
    account: Account;
    transaction: Transaction;
  } | null = null;

  async executeReconciliation(params: {
    account: Account;
    transaction: Transaction;
  }): Promise<Either<DomainError | ApplicationError, void>> {
    this.executeCallCount++;
    this.lastParams = params;

    if (this.shouldFail) {
      return Either.error(new BudgetPersistenceFailedError());
    }

    return Either.success();
  }

  reset(): void {
    this.executeCallCount = 0;
    this.shouldFail = false;
    this.lastParams = null;
  }
}
