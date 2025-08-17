import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { DeleteEnvelopeUseCase } from '@application/use-cases/envelope/delete-envelope/DeleteEnvelopeUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface DeleteEnvelopeBody {
  envelopeId: string;
  userId: string;
  budgetId: string;
}

export class DeleteEnvelopeController implements HttpController {
  constructor(private readonly useCase: DeleteEnvelopeUseCase) {}

  async handle(
    request: HttpRequest<DeleteEnvelopeBody>,
  ): Promise<HttpResponse> {
    const { envelopeId, userId, budgetId } = request.body;
    const result = await this.useCase.execute({ envelopeId, userId, budgetId });

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
