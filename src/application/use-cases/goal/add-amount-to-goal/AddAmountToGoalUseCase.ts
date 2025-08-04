import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IGetGoalRepository } from '../../../contracts/repositories/goal/IGetGoalRepository';
import { ISaveGoalRepository } from '../../../contracts/repositories/goal/ISaveGoalRepository';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { GoalNotFoundError } from '../../../shared/errors/GoalNotFoundError';
import { IUseCase, UseCaseResponse } from './../../../shared/IUseCase';
import { AddAmountToGoalDto } from './AddAmountToGoalDto';

export class AddAmountToGoalUseCase implements IUseCase<AddAmountToGoalDto> {
  constructor(
    private readonly getGoalByIdRepository: IGetGoalRepository,
    private readonly saveGoalRepository: ISaveGoalRepository,
  ) {}

  async execute(dto: AddAmountToGoalDto) {
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

    const addAmountResult = goal.addAmount(dto.amount);

    if (addAmountResult.hasError)
      return Either.errors<DomainError, UseCaseResponse>(
        addAmountResult.errors,
      );

    const persistResult = await this.saveGoalRepository.execute(goal);

    if (persistResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(
        persistResult.errors,
      );
    }

    return Either.success<ApplicationError, UseCaseResponse>({
      id: goal.id,
    });
  }
}
