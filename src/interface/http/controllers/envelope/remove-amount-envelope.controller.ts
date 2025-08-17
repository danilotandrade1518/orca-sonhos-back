import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { RemoveAmountFromEnvelopeUseCase } from '@application/use-cases/envelope/remove-amount-from-envelope/RemoveAmountFromEnvelopeUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface RemoveAmountEnvelopeBody {
  envelopeId: string;
  userId: string;
  budgetId: string;
  amount: number;
}

export class RemoveAmountEnvelopeController implements HttpController {
  constructor(private readonly useCase: RemoveAmountFromEnvelopeUseCase) {}

  async handle(
    request: HttpRequest<RemoveAmountEnvelopeBody>,
  ): Promise<HttpResponse> {
    const { envelopeId, userId, budgetId, amount } = request.body;
    const result = await this.useCase.execute({
      envelopeId,
      userId,
      budgetId,
      amount,
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
