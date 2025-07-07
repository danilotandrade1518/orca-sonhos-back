import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IAddBudgetRepository {
  execute(budget: Budget): Promise<Either<RepositoryError, void>>;
}
