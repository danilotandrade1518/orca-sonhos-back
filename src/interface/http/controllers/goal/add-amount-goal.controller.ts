import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { AddAmountToGoalUseCase } from '@application/use-cases/goal/add-amount-to-goal/AddAmountToGoalUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface AddAmountGoalBody {
  id: string;
  amount: number;
}

export class AddAmountGoalController implements HttpController {
  constructor(private readonly useCase: AddAmountToGoalUseCase) {}

  async handle(request: HttpRequest<AddAmountGoalBody>): Promise<HttpResponse> {
    const { id, amount } = request.body;
    const result = await this.useCase.execute({ id, amount });

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
