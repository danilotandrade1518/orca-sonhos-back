import { Either } from '@either';
import { ITransferBetweenAccountsUnitOfWork } from '@application/contracts/unit-of-works/ITransferBetweenAccountsUnitOfWork';
import { DomainError } from '@domain/shared/DomainError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { RequiredFieldError } from '@domain/shared/errors/RequiredFieldError';

export class MockTransferBetweenAccountsUnitOfWork
  implements ITransferBetweenAccountsUnitOfWork
{
  public executeCallCount = 0;
  public shouldFail = false;
  public lastParams: {
    fromAccount: Account;
    toAccount: Account;
    debitTransaction: Transaction;
    creditTransaction: Transaction;
  } | null = null;

  async executeTransfer(params: {
    fromAccount: Account;
    toAccount: Account;
    debitTransaction: Transaction;
    creditTransaction: Transaction;
  }): Promise<Either<DomainError, void>> {
    this.executeCallCount++;
    this.lastParams = params;

    if (this.shouldFail) {
      return Either.error(new RequiredFieldError('Mock transfer failed'));
    }

    return Either.success();
  }

  reset(): void {
    this.executeCallCount = 0;
    this.shouldFail = false;
    this.lastParams = null;
  }
}
