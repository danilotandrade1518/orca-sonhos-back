import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { RemoveParticipantFromBudgetUseCase } from '@application/use-cases/budget/remove-participant/RemoveParticipantFromBudgetUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

type RemoveParticipantBody = {
  userId: string;
  budgetId: string;
  participantId: string;
};

export class RemoveParticipantFromBudgetController implements HttpController {
  constructor(private readonly useCase: RemoveParticipantFromBudgetUseCase) {}

  async handle(
    request: HttpRequest<RemoveParticipantBody>,
  ): Promise<HttpResponse> {
    const body = request.body;

    const result = await this.useCase.execute({
      userId: body.userId,
      budgetId: body.budgetId,
      participantId: body.participantId,
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
