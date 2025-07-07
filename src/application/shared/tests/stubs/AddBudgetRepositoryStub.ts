import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { Either } from '@either';

import { IAddBudgetRepository } from '../../../contracts/repositories/budget/IAddBudgetRepository';
import { RepositoryError } from '../../errors/RepositoryError';

export class AddBudgetRepositoryStub implements IAddBudgetRepository {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async execute(_budget: Budget): Promise<Either<RepositoryError, void>> {
    return Either.success(undefined);
  }
}
