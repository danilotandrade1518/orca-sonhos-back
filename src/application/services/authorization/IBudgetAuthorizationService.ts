import { Either } from '@either';

import { ApplicationError } from '../../shared/errors/ApplicationError';

export interface IBudgetAuthorizationService {
  canAccessBudget(
    userId: string,
    budgetId: string,
  ): Promise<Either<ApplicationError, boolean>>;
}
