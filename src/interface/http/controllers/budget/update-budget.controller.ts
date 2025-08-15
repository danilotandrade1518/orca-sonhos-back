import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { UpdateBudgetUseCase } from '@application/use-cases/budget/update-budget/UpdateBudgetUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

type UpdateBudgetBody = {
  userId: string;
  budgetId: string;
  name: string;
};

export class UpdateBudgetController implements HttpController {
  constructor(private readonly useCase: UpdateBudgetUseCase) {}

  async handle(request: HttpRequest<UpdateBudgetBody>): Promise<HttpResponse> {
    const body = request.body;

    const result = await this.useCase.execute({
      userId: body.userId,
      budgetId: body.budgetId,
      name: body.name,
    });

    if (result.hasError)
      return DefaultResponseBuilder.errors(
        request.requestId,
        result.errors as (DomainError | ApplicationError)[],
      );

    return DefaultResponseBuilder.ok(request.requestId, {
      id: result.data?.id,
    });
  }
}
