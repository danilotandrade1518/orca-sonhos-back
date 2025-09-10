import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IGetAccountRepository } from '../../../contracts/repositories/account/IGetAccountRepository';
import { IGetGoalRepository } from '../../../contracts/repositories/goal/IGetGoalRepository';
import { ISaveGoalRepository } from '../../../contracts/repositories/goal/ISaveGoalRepository';
import { IBudgetAuthorizationService } from '../../../services/authorization/IBudgetAuthorizationService';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { GoalNotFoundError } from '../../../shared/errors/GoalNotFoundError';
import { IUseCase, UseCaseResponse } from './../../../shared/IUseCase';
import { RemoveAmountFromGoalDto } from './RemoveAmountFromGoalDto';

class BudgetAuthorizationError extends ApplicationError {
  constructor() {
    super('User is not authorized to access this budget');
    this.name = 'BudgetAuthorizationError';
    this.fieldName = 'userId';
  }
}

class GoalAccountMismatchError extends ApplicationError {
  constructor() {
    super('Goal and Account must belong to the same Budget');
    this.name = 'GoalAccountMismatchError';
    this.fieldName = 'budgetId';
  }
}
export class RemoveAmountFromGoalUseCase
  implements IUseCase<RemoveAmountFromGoalDto>
{
  constructor(
    private readonly getGoalByIdRepository: IGetGoalRepository,
    private readonly getAccountByIdRepository: IGetAccountRepository,
    private readonly saveGoalRepository: ISaveGoalRepository,
    private readonly budgetAuthorizationService: IBudgetAuthorizationService,
  ) {}

  async execute(dto: RemoveAmountFromGoalDto) {
    const goalResult = await this.getGoalByIdRepository.execute(dto.id);
    if (goalResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(
        goalResult.errors,
      );
    }

    const goal = goalResult.data;
    if (!goal) {
      return Either.error<ApplicationError, UseCaseResponse>(
        new GoalNotFoundError(),
      );
    }

    const authResult = await this.budgetAuthorizationService.canAccessBudget(
      dto.userId,
      goal.budgetId,
    );
    if (authResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(
        authResult.errors,
      );
    }
    if (!authResult.data) {
      return Either.error<ApplicationError, UseCaseResponse>(
        new BudgetAuthorizationError(),
      );
    }

    const accountResult = await this.getAccountByIdRepository.execute(
      goal.sourceAccountId,
    );
    if (accountResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(
        accountResult.errors,
      );
    }

    const sourceAccount = accountResult.data;
    if (!sourceAccount) {
      return Either.error<ApplicationError, UseCaseResponse>(
        new AccountNotFoundError(),
      );
    }

    if (goal.budgetId !== sourceAccount.budgetId) {
      return Either.error<ApplicationError, UseCaseResponse>(
        new GoalAccountMismatchError(),
      );
    }

    const removeAmountResult = goal.removeAmount(dto.amount);
    if (removeAmountResult.hasError) {
      return Either.errors<DomainError, UseCaseResponse>(
        removeAmountResult.errors,
      );
    }

    const saveGoalResult = await this.saveGoalRepository.execute(goal);
    if (saveGoalResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(
        saveGoalResult.errors,
      );
    }

    return Either.success<ApplicationError, UseCaseResponse>({
      id: goal.id,
    });
  }
}
