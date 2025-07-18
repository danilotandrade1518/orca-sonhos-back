import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { Either } from '@either';

import { ISaveBudgetRepository } from '../../../contracts/repositories/budget/ISaveBudgetRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class SaveBudgetRepositoryStub implements ISaveBudgetRepository {
  public shouldFail = false;
  public executeCalls: Budget[] = [];

  async execute(budget: Budget): Promise<Either<RepositoryError, void>> {
    this.executeCalls.push(budget);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    return Either.success();
  }
}
