import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { UpdateBudgetUseCase } from '@application/use-cases/budget/update-budget/UpdateBudgetUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { HttpController, HttpRequest, HttpResponse } from '../../http-types';
import { mapErrorsToHttp } from '../../mappers/error-mapper';

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
      return mapErrorsToHttp(
        result.errors as (DomainError | ApplicationError)[],
        request.requestId,
      );

    return {
      status: 200,
      body: { id: result.data?.id, traceId: request.requestId },
    };
  }
}
