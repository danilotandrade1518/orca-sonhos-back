import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { ReopenCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/reopen-bill/ReopenCreditCardBillUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface ReopenCreditCardBillBody {
  creditCardBillId: string;
  userId: string;
  budgetId: string;
  justification: string;
}

export class ReopenCreditCardBillController implements HttpController {
  constructor(private readonly useCase: ReopenCreditCardBillUseCase) {}

  async handle(
    request: HttpRequest<ReopenCreditCardBillBody>,
  ): Promise<HttpResponse> {
    const { creditCardBillId, userId, budgetId, justification } = request.body;
    const result = await this.useCase.execute({
      creditCardBillId,
      userId,
      budgetId,
      justification,
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
