import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { TransferBetweenEnvelopesUseCase } from '@application/use-cases/envelope/transfer-between-envelopes/TransferBetweenEnvelopesUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface TransferBetweenEnvelopesBody {
  sourceEnvelopeId: string;
  targetEnvelopeId: string;
  userId: string;
  budgetId: string;
  amount: number;
}

export class TransferBetweenEnvelopesController implements HttpController {
  constructor(private readonly useCase: TransferBetweenEnvelopesUseCase) {}

  async handle(
    request: HttpRequest<TransferBetweenEnvelopesBody>,
  ): Promise<HttpResponse> {
    const { sourceEnvelopeId, targetEnvelopeId, userId, budgetId, amount } =
      request.body;
    const result = await this.useCase.execute({
      sourceEnvelopeId,
      targetEnvelopeId,
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
