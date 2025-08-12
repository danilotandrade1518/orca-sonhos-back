import { CreateBudgetUseCase } from '@application/use-cases/budget/create-budget/CreateBudgetUseCase';
import { IAddBudgetRepository } from '@application/contracts/repositories/budget/IAddBudgetRepository';

export const makeCreateBudgetUseCase = (
  addBudgetRepository: IAddBudgetRepository,
): CreateBudgetUseCase => {
  return new CreateBudgetUseCase(addBudgetRepository);
};
