import { Either } from '@either';

import { IEventPublisher } from '../../../contracts/events/IEventPublisher';
import { IGetBudgetRepository } from '../../../contracts/repositories/budget/IGetBudgetRepository';
import { ISaveBudgetRepository } from '../../../contracts/repositories/budget/ISaveBudgetRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { IUseCase } from '../../../shared/IUseCase';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { BudgetNotFoundError } from '../../../shared/errors/BudgetNotFoundError';
import { BudgetRepositoryError } from '../../../shared/errors/BudgetRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { BudgetPersistenceFailedError } from '../../../shared/errors/BudgetPersistenceFailedError';
import { BudgetUpdateFailedError } from '../../../shared/errors/BudgetUpdateFailedError';
import { UpdateBudgetDto } from './UpdateBudgetDto';

export class UpdateBudgetUseCase implements IUseCase<UpdateBudgetDto> {
  constructor(
    private readonly getBudgetRepository: IGetBudgetRepository,
    private readonly saveBudgetRepository: ISaveBudgetRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
    private readonly eventPublisher: IEventPublisher,
  ) {}

  async execute(
    dto: UpdateBudgetDto,
  ): Promise<Either<ApplicationError, { id: string }>> {
    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      dto.budgetId,
    );

    if (authResult.hasError) {
      return Either.errors<ApplicationError, { id: string }>(authResult.errors);
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

    const updateResult = budget.update({ name: dto.name });

    if (updateResult.hasError) {
      const message = updateResult.errors.map((e) => e.message).join('; ');
      return Either.error(new BudgetUpdateFailedError(message));
    }

    const saveResult = await this.saveBudgetRepository.execute(budget);

    if (saveResult.hasError) {
      return Either.error(new BudgetPersistenceFailedError());
    }

    const events = budget.getEvents();
    if (events.length > 0) {
      try {
        await this.eventPublisher.publishMany(events);
        budget.clearEvents();
      } catch (error) {
        console.error('Failed to publish events:', error);
      }
    }

    return Either.success({ id: budget.id });
  }
}
