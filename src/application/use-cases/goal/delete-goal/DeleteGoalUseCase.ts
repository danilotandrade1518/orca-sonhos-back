import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IGetGoalRepository } from '../../../contracts/repositories/goal/IGetGoalRepository';
import { IDeleteGoalRepository } from '../../../contracts/repositories/goal/IDeleteGoalRepository';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { GoalNotFoundError } from '../../../shared/errors/GoalNotFoundError';
import { GoalDeletionFailedError } from '../../../shared/errors/GoalDeletionFailedError';
import { IUseCase, UseCaseResponse } from './../../../shared/IUseCase';
import { DeleteGoalDto } from './DeleteGoalDto';

export class DeleteGoalUseCase implements IUseCase<DeleteGoalDto> {
  constructor(
    private readonly getGoalByIdRepository: IGetGoalRepository,
    private readonly deleteGoalRepository: IDeleteGoalRepository,
  ) {}

  async execute(dto: DeleteGoalDto) {
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

    const deleteResult = goal.delete();

    if (deleteResult.hasError) {
      return Either.errors<DomainError, UseCaseResponse>(deleteResult.errors);
    }

    const persistResult = await this.deleteGoalRepository.execute(goal.id);

    if (persistResult.hasError) {
      return Either.error<ApplicationError, UseCaseResponse>(
        new GoalDeletionFailedError(),
      );
    }

    return Either.success<ApplicationError, UseCaseResponse>({
      id: goal.id,
    });
  }
}
