import { Either } from '@either';

import { IGetBudgetRepository } from '../../../contracts/repositories/budget/IGetBudgetRepository';
import { ISaveBudgetRepository } from '../../../contracts/repositories/budget/ISaveBudgetRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { BudgetNotFoundError } from '../../../shared/errors/BudgetNotFoundError';
import { BudgetRepositoryError } from '../../../shared/errors/BudgetRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { BudgetPersistenceFailedError } from './../../../shared/errors/BudgetPersistenceFailedError';
import { BudgetUpdateFailedError } from './../../../shared/errors/BudgetUpdateFailedError';
import { AddParticipantToBudgetDto } from './AddParticipantToBudgetDto';

export class AddParticipantToBudgetUseCase
  implements IUseCase<AddParticipantToBudgetDto>
{
  constructor(
    private getBudgetRepository: IGetBudgetRepository,
    private saveBudgetRepository: ISaveBudgetRepository,
    private budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    dto: AddParticipantToBudgetDto,
  ): Promise<Either<ApplicationError, UseCaseResponse>> {
    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      dto.budgetId,
    );

    if (authResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(
        authResult.errors,
      );
    }

    if (!authResult.data) {
      return Either.error(new InsufficientPermissionsError());
    }

    const budgetResult = await this.getBudgetRepository.execute(dto.budgetId);

    if (budgetResult.hasError) {
      return Either.error(new BudgetRepositoryError());
    }

    if (!budgetResult.data) {
      return Either.error(new BudgetNotFoundError());
    }

    const budget = budgetResult.data;

    const addResult = budget.addParticipant(dto.participantId);

    if (addResult.hasError) {
      const errorMessage = addResult.errors.map((e) => e.message).join('; ');
      return Either.error(new BudgetUpdateFailedError(errorMessage));
    }

    const saveResult = await this.saveBudgetRepository.execute(budget);

    if (saveResult.hasError) {
      return Either.error(new BudgetPersistenceFailedError());
    }

    return Either.success({ id: budget.id });
  }
}
