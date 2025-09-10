import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreateGoalUseCase } from '@application/use-cases/goal/create-goal/CreateGoalUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface CreateGoalBody {
  name: string;
  totalAmount: number;
  accumulatedAmount?: number;
  deadline?: string;
  budgetId: string;
  sourceAccountId: string;
}

export class CreateGoalController implements HttpController {
  constructor(private readonly useCase: CreateGoalUseCase) {}

  async handle(request: HttpRequest<CreateGoalBody>): Promise<HttpResponse> {
    const {
      name,
      totalAmount,
      accumulatedAmount,
      deadline,
      budgetId,
      sourceAccountId,
    } = request.body;

    const result = await this.useCase.execute({
      name,
      totalAmount,
      accumulatedAmount,
      deadline: deadline ? new Date(deadline) : undefined,
      budgetId,
      sourceAccountId,
    });

    if (result.hasError)
      return DefaultResponseBuilder.errors(
        request.requestId,
        result.errors as (DomainError | ApplicationError)[],
      );

    return DefaultResponseBuilder.created(request.requestId, {
      id: result.data?.id,
    });
  }
}
