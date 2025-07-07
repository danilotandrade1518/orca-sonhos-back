import { Budget } from '@domain/aggregates/budget/budget-entity/Budget';

import { IAddBudgetRepository } from '../../../contracts/repositories/budget/IAddBudgetRepository';
import { ResponseBuilder } from '../../../shared/ResponseBuilder';
import { IUseCase } from './../../../shared/IUseCase';
import { CreateBudgetDto } from './CreateBudgetDto';
import { CreateBudgetResponse } from './CreateBudgetResponse';

export class CreateBudgetUseCase
  implements IUseCase<CreateBudgetDto, CreateBudgetResponse>
{
  constructor(private readonly addBudgetRepository: IAddBudgetRepository) {}

  async execute(dto: CreateBudgetDto): Promise<CreateBudgetResponse> {
    const budgetResult = Budget.create({
      name: dto.name,
      ownerId: dto.ownerId,
      participantIds: dto.participantIds,
    });

    if (budgetResult.hasError) {
      const errorMessages = budgetResult.errors.map((error) => error.message);
      return ResponseBuilder.failure(errorMessages);
    }

    const budget = budgetResult.data!;

    const persistResult = await this.addBudgetRepository.execute(budget);

    if (persistResult.hasError) {
      const errorMessages = persistResult.errors.map((error) => error.message);
      return ResponseBuilder.failure(errorMessages);
    }

    return ResponseBuilder.success(budget.id);
  }
}
