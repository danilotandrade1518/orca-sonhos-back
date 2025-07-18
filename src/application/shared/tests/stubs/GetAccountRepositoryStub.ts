import { Either } from '@either';

import { Account } from '../../../../domain/aggregates/account/account-entity/Account';
import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class GetAccountRepositoryStub implements IGetAccountRepository {
  public shouldFail = false;
  public shouldReturnNull = false;
  private accounts: Record<string, Account> = {};

  private _mockAccount: Account | null = null;
  public executeCalls: string[] = [];
  private accounts: Record<string, Account> = {};

  set mockAccount(account: Account | null) {
    this._mockAccount = account;
    if (account) {
      this.accounts[account.id] = account;
    } else {
      this.accounts = {};
    }
  }

  get mockAccount(): Account | null {
    return this._mockAccount;
  }

  set mockAccount(account: Account | null) {
    if (account) {
      this.accounts[account.id] = account;
    } else {
      this.accounts = {};
    }
    this._mockAccount = account;
  }

  get mockAccount(): Account | null {
    return this._mockAccount;
  }

  async execute(id: string): Promise<Either<RepositoryError, Account | null>> {
    this.executeCalls.push(id);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    if (this.shouldReturnNull) {
      return Either.success(null);
    }

    const account = this.accounts[id];

    if (!account) {
      return Either.success(null);
    }

    return Either.success(account);
  }
}
