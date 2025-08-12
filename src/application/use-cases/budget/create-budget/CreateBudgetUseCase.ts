import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IAddBudgetRepository } from '../../../contracts/repositories/budget/IAddBudgetRepository';
import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { IUseCase, UseCaseResponse } from './../../../shared/IUseCase';
import { CreateBudgetDto } from './CreateBudgetDto';

export class CreateBudgetUseCase implements IUseCase<CreateBudgetDto> {
  constructor(private readonly addBudgetRepository: IAddBudgetRepository) {}

  async execute(dto: CreateBudgetDto) {
    const budgetResult = Budget.create({
      name: dto.name,
      ownerId: dto.ownerId,
      participantIds: dto.participantIds,
      type: dto.type,
    });

    if (budgetResult.hasError)
      return Either.errors<DomainError, UseCaseResponse>(budgetResult.errors);

    const budget = budgetResult.data!;

    const persistResult = await this.addBudgetRepository.execute(budget);

    if (persistResult.hasError) {
      return Either.errors<ApplicationError, UseCaseResponse>(
        persistResult.errors,
      );
    }

    return Either.success<ApplicationError, UseCaseResponse>({
      id: budget.id,
    });
  }
}
