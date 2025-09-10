import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { RemoveAmountFromGoalUseCase } from '@application/use-cases/goal/remove-amount-from-goal/RemoveAmountFromGoalUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface RemoveAmountGoalBody {
  id: string;
  amount: number;
}

export class RemoveAmountGoalController implements HttpController {
  constructor(private readonly useCase: RemoveAmountFromGoalUseCase) {}

  async handle(
    request: HttpRequest<RemoveAmountGoalBody>,
  ): Promise<HttpResponse> {
    const { id, amount } = request.body;
    const userId = request.principal!.userId;

    const result = await this.useCase.execute({ id, amount, userId });

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
