import { Either } from '@either';

import { ICheckBudgetDependenciesRepository } from '../../../contracts/repositories/budget/ICheckBudgetDependenciesRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class CheckBudgetDependenciesRepositoryStub
  implements ICheckBudgetDependenciesRepository
{
  public shouldFail = false;
  public hasAccountsResult = false;
  public hasTransactionsResult = false;
  public hasAccountsCalls: string[] = [];
  public hasTransactionsCalls: string[] = [];

  async hasAccounts(
    budgetId: string,
  ): Promise<Either<RepositoryError, boolean>> {
    this.hasAccountsCalls.push(budgetId);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success(this.hasAccountsResult);
  }

  async hasTransactions(
    budgetId: string,
  ): Promise<Either<RepositoryError, boolean>> {
    this.hasTransactionsCalls.push(budgetId);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success(this.hasTransactionsResult);
  }
}
