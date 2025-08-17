import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { AddAmountToEnvelopeUseCase } from '@application/use-cases/envelope/add-amount-to-envelope/AddAmountToEnvelopeUseCase';
import { DomainError } from '@domain/shared/DomainError';
import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface AddAmountEnvelopeBody {
  envelopeId: string;
  userId: string;
  budgetId: string;
  amount: number;
}

export class AddAmountEnvelopeController implements HttpController {
  constructor(private readonly useCase: AddAmountToEnvelopeUseCase) {}

  async handle(
    request: HttpRequest<AddAmountEnvelopeBody>,
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
