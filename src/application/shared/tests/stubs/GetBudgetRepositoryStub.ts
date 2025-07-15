import { Either } from '@either';

import { Budget } from '../../../../domain/aggregates/budget/budget-entity/Budget';
import { IGetBudgetRepository } from '../../../contracts/repositories/budget/IGetBudgetRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class GetBudgetRepositoryStub implements IGetBudgetRepository {
  public shouldFail = false;
  public shouldReturnNull = false;
  public mockBudget: Budget | null = null;
  public executeCalls: string[] = [];

  async execute(id: string): Promise<Either<RepositoryError, Budget | null>> {
    this.executeCalls.push(id);

    if (this.shouldFail) {
      return Either.error(new RepositoryError('Repository failure'));
    }

    if (this.shouldReturnNull) {
      return Either.success(null);
    }

    return Either.success(this.mockBudget);
  }
}
