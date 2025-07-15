import { Either } from '@either';

import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../errors/ApplicationError';
import { BudgetRepositoryError } from '../../errors/BudgetRepositoryError';

export class BudgetAuthorizationServiceStub
  implements IBudgetAuthorizationService
{
  public shouldFail = false;
  public mockHasAccess = true;
  public canAccessBudgetCalls: Array<{ userId: string; budgetId: string }> = [];

  async canAccessBudget(
    userId: string,
    budgetId: string,
  ): Promise<Either<ApplicationError, boolean>> {
    this.canAccessBudgetCalls.push({ userId, budgetId });

    if (this.shouldFail) {
      return Either.error(new BudgetRepositoryError());
    }

    return Either.success(this.mockHasAccess);
  }
}
