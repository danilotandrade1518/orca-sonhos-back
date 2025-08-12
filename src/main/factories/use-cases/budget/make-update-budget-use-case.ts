import { UpdateBudgetUseCase } from '@application/use-cases/budget/update-budget/UpdateBudgetUseCase';
import { IGetBudgetRepository } from '@application/contracts/repositories/budget/IGetBudgetRepository';
import { ISaveBudgetRepository } from '@application/contracts/repositories/budget/ISaveBudgetRepository';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

export const makeUpdateBudgetUseCase = (
  getBudgetRepository: IGetBudgetRepository,
  saveBudgetRepository: ISaveBudgetRepository,
  budgetAuthorizationService: IBudgetAuthorizationService,
): UpdateBudgetUseCase => {
  return new UpdateBudgetUseCase(
    getBudgetRepository,
    saveBudgetRepository,
    budgetAuthorizationService,
  );
};
