import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CancelScheduledTransactionUseCase } from '@application/use-cases/transaction/cancel-scheduled-transaction/CancelScheduledTransactionUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface CancelScheduledTransactionBody {
  userId: string;
  budgetId: string;
  transactionId: string;
  cancellationReason: string;
}

export class CancelScheduledTransactionController implements HttpController {
  constructor(private readonly useCase: CancelScheduledTransactionUseCase) {}

  async handle(
    request: HttpRequest<CancelScheduledTransactionBody>,
  ): Promise<HttpResponse> {
    const { userId, budgetId, transactionId, cancellationReason } =
      request.body;
    const result = await this.useCase.execute({
      userId,
      budgetId,
      transactionId,
      cancellationReason,
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
