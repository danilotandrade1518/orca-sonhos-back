import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { MarkTransactionLateUseCase } from '@application/use-cases/transaction/mark-transaction-late/MarkTransactionLateUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface MarkTransactionLateBody {
  transactionId: string;
  lateDate?: string;
}

export class MarkTransactionLateController implements HttpController {
  constructor(private readonly useCase: MarkTransactionLateUseCase) {}

  async handle(
    request: HttpRequest<MarkTransactionLateBody>,
  ): Promise<HttpResponse> {
    const { transactionId, lateDate } = request.body;
    const result = await this.useCase.execute({
      transactionId,
      lateDate: lateDate ? new Date(lateDate) : undefined,
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
