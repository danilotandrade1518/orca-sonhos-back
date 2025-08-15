import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { DeleteBudgetUseCase } from '@application/use-cases/budget/delete-budget/DeleteBudgetUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { HttpController, HttpRequest, HttpResponse } from '../../http-types';
import { mapErrorsToHttp } from '../../mappers/error-mapper';

type DeleteBudgetBody = {
  userId: string;
  budgetId: string;
};

export class DeleteBudgetController implements HttpController {
  constructor(private readonly useCase: DeleteBudgetUseCase) {}

  async handle(request: HttpRequest<DeleteBudgetBody>): Promise<HttpResponse> {
    const body = request.body;

    const result = await this.useCase.execute({
      userId: body.userId,
      budgetId: body.budgetId,
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
