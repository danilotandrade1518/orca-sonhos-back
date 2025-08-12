import { DeleteBudgetUseCase } from '@application/use-cases/budget/delete-budget/DeleteBudgetUseCase';
import { IGetBudgetRepository } from '@application/contracts/repositories/budget/IGetBudgetRepository';
import { IDeleteBudgetRepository } from '@application/contracts/repositories/budget/IDeleteBudgetRepository';
import { ICheckBudgetDependenciesRepository } from '@application/contracts/repositories/budget/ICheckBudgetDependenciesRepository';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

export const makeDeleteBudgetUseCase = (
  getBudgetRepository: IGetBudgetRepository,
  deleteBudgetRepository: IDeleteBudgetRepository,
  checkDependenciesRepository: ICheckBudgetDependenciesRepository,
  budgetAuthorizationService: IBudgetAuthorizationService,
): DeleteBudgetUseCase => {
  return new DeleteBudgetUseCase(
    getBudgetRepository,
    deleteBudgetRepository,
    checkDependenciesRepository,
    budgetAuthorizationService,
  );
};
