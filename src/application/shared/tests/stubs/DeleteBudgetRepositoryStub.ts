import { Either } from '@either';

import { IDeleteBudgetRepository } from '../../../contracts/repositories/budget/IDeleteBudgetRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class DeleteBudgetRepositoryStub implements IDeleteBudgetRepository {
  public shouldFail = false;
  public executeCalls: string[] = [];

  async execute(budgetId: string): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(budgetId);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success();
  }
}
