import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';

export interface ICheckBudgetDependenciesRepository {
  hasAccounts(budgetId: string): Promise<Either<RepositoryError, boolean>>;
  hasTransactions(budgetId: string): Promise<Either<RepositoryError, boolean>>;
}
