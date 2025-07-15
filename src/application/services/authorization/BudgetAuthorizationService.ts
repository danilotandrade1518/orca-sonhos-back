import { Either } from '@either';

import { IGetBudgetRepository } from '../../contracts/repositories/budget/IGetBudgetRepository';
import { ApplicationError } from '../../shared/errors/ApplicationError';
import { BudgetNotFoundError } from '../../shared/errors/BudgetNotFoundError';
import { BudgetRepositoryError } from '../../shared/errors/BudgetRepositoryError';
import { IBudgetAuthorizationService } from './IBudgetAuthorizationService';

export class BudgetAuthorizationService implements IBudgetAuthorizationService {
  constructor(private readonly getBudgetRepository: IGetBudgetRepository) {}

  async canAccessBudget(
    userId: string,
    budgetId: string,
  ): Promise<Either<ApplicationError, boolean>> {
    const budgetResult = await this.getBudgetRepository.execute(budgetId);

    if (budgetResult.hasError) {
      return Either.error(new BudgetRepositoryError());
    }

    if (!budgetResult.data) {
      return Either.error(new BudgetNotFoundError());
    }

    const budget = budgetResult.data;
    const hasAccess = budget.isParticipant(userId);

    return Either.success(hasAccess);
  }
}
