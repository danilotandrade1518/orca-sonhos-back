import { Account } from '@domain/aggregates/account/account-entity/Account';
import { Transaction } from '@domain/aggregates/transaction/transaction-entity/Transaction';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IRegisterPastTransactionUnitOfWork } from '@application/contracts/unit-of-works/IRegisterPastTransactionUnitOfWork';

export class IRegisterPastTransactionUnitOfWorkStub
  implements IRegisterPastTransactionUnitOfWork
{
  public executeCalls: Array<{ account: Account; transaction: Transaction }> = [];

  async execute(params: {
    account: Account;
    transaction: Transaction;
  }): Promise<Either<DomainError, void>> {
    this.executeCalls.push(params);
    return Either.success(undefined);
  }
}
