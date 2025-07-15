import { Either } from '../../../../shared/core/either';
import { RepositoryError } from '../../errors/RepositoryError';
import { IFindAccountByIdRepository } from '../../../contracts/repositories/account/IFindAccountByIdRepository';
import { Account } from '../../../../domain/aggregates/account/account-entity/Account';

export class FindAccountByIdRepositoryStub
  implements IFindAccountByIdRepository
{
  private accounts: Account[] = [];

  async execute(id: string): Promise<Either<RepositoryError, Account | null>> {
    const account = this.accounts.find((acc) => acc.id === id);
    return Either.success(account || null);
  }

  // Helper method for tests
  addAccount(account: Account): void {
    this.accounts.push(account);
  }

  // Helper method for tests
  clear(): void {
    this.accounts = [];
  }
}
