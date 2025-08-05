import { Either } from '@either';

import { IGetBudgetRepository } from '../../../contracts/repositories/budget/IGetBudgetRepository';
import { ISaveBudgetRepository } from '../../../contracts/repositories/budget/ISaveBudgetRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { BudgetNotFoundError } from '../../../shared/errors/BudgetNotFoundError';
import { BudgetPersistenceFailedError } from '../../../shared/errors/BudgetPersistenceFailedError';
import { BudgetRepositoryError } from '../../../shared/errors/BudgetRepositoryError';
import { BudgetUpdateFailedError } from '../../../shared/errors/BudgetUpdateFailedError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { RemoveParticipantFromBudgetDto } from './RemoveParticipantFromBudgetDto';

export class RemoveParticipantFromBudgetUseCase
  implements IUseCase<RemoveParticipantFromBudgetDto>
{
  constructor(
    private getBudgetRepository: IGetBudgetRepository,
    private saveBudgetRepository: ISaveBudgetRepository,
    private budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(
    dto: RemoveParticipantFromBudgetDto,
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

    const removeResult = budget.removeParticipant(dto.participantId);

    if (removeResult.hasError) {
      const errorMessage = removeResult.errors.map((e) => e.message).join('; ');
      return Either.error(new BudgetUpdateFailedError(errorMessage));
    }

    const saveResult = await this.saveBudgetRepository.execute(budget);

    if (saveResult.hasError) {
      return Either.error(new BudgetPersistenceFailedError());
    }

    return Either.success({ id: budget.id });
  }
}
