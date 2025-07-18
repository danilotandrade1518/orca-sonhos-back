import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface IDeleteBudgetRepository {
  execute(budgetId: string): Promise<Either<RepositoryError, void>>;
}
