import { AddParticipantToBudgetUseCase } from '@application/use-cases/budget/add-participant/AddParticipantToBudgetUseCase';
import { IGetBudgetRepository } from '@application/contracts/repositories/budget/IGetBudgetRepository';
import { ISaveBudgetRepository } from '@application/contracts/repositories/budget/ISaveBudgetRepository';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

export const makeAddParticipantToBudgetUseCase = (
  getBudgetRepository: IGetBudgetRepository,
  saveBudgetRepository: ISaveBudgetRepository,
  budgetAuthorizationService: IBudgetAuthorizationService,
): AddParticipantToBudgetUseCase => {
  return new AddParticipantToBudgetUseCase(
    getBudgetRepository,
    saveBudgetRepository,
    budgetAuthorizationService,
  );
};
