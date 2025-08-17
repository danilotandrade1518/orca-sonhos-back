import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { UpdateEnvelopeUseCase } from '@application/use-cases/envelope/update-envelope/UpdateEnvelopeUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface UpdateEnvelopeBody {
  envelopeId: string;
  userId: string;
  budgetId: string;
  name?: string;
  monthlyLimit?: number;
}

export class UpdateEnvelopeController implements HttpController {
  constructor(private readonly useCase: UpdateEnvelopeUseCase) {}

  async handle(
    request: HttpRequest<UpdateEnvelopeBody>,
  ): Promise<HttpResponse> {
    const { envelopeId, userId, budgetId, name, monthlyLimit } = request.body;
    const result = await this.useCase.execute({
      envelopeId,
      userId,
      budgetId,
      name,
      monthlyLimit,
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
