import { RemoveParticipantFromBudgetUseCase } from '@application/use-cases/budget/remove-participant/RemoveParticipantFromBudgetUseCase';
import { IGetBudgetRepository } from '@application/contracts/repositories/budget/IGetBudgetRepository';
import { ISaveBudgetRepository } from '@application/contracts/repositories/budget/ISaveBudgetRepository';
import { IBudgetAuthorizationService } from '@application/services/authorization/IBudgetAuthorizationService';

export const makeRemoveParticipantFromBudgetUseCase = (
  getBudgetRepository: IGetBudgetRepository,
  saveBudgetRepository: ISaveBudgetRepository,
  budgetAuthorizationService: IBudgetAuthorizationService,
): RemoveParticipantFromBudgetUseCase => {
  return new RemoveParticipantFromBudgetUseCase(
    getBudgetRepository,
    saveBudgetRepository,
    budgetAuthorizationService,
  );
};
