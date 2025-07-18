import { Either } from '@either';

import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IGetBudgetRepository {
  execute(id: string): Promise<Either<RepositoryError, Budget | null>>;
}
