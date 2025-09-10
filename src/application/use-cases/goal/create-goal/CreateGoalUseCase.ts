import { Goal } from '@domain/aggregates/goal/goal-entity/Goal';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IAddGoalRepository } from '../../../contracts/repositories/goal/IAddGoalRepository';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { IUseCase, UseCaseResponse } from './../../../shared/IUseCase';
import { CreateGoalDto } from './CreateGoalDto';

export class CreateGoalUseCase implements IUseCase<CreateGoalDto> {
  constructor(private readonly addGoalRepository: IAddGoalRepository) {}

  async execute(dto: CreateGoalDto) {
    const goalResult = Goal.create({
      name: dto.name,
      totalAmount: dto.totalAmount,
      accumulatedAmount: dto.accumulatedAmount,
      deadline: dto.deadline,
      budgetId: dto.budgetId,
      sourceAccountId: dto.sourceAccountId,
    });

    if (goalResult.hasError)
      return Either.errors<DomainError, UseCaseResponse>(goalResult.errors);

    const goal = goalResult.data!;

    const persistResult = await this.addGoalRepository.execute(goal);

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
