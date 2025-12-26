import { RemoveParticipantFromBudgetUseCase } from '@application/use-cases/budget/remove-participant/RemoveParticipantFromBudgetUseCase';
import { AuthTokenInvalidError } from '@application/shared/errors/AuthTokenInvalidError';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

type RemoveParticipantBody = {
  budgetId: string;
  participantId: string;
};

export class RemoveParticipantFromBudgetController implements HttpController {
  constructor(private readonly useCase: RemoveParticipantFromBudgetUseCase) {}

  async handle(
    request: HttpRequest<RemoveParticipantBody>,
  ): Promise<HttpResponse> {
    const body = request.body;
    const userId = request.principal?.userId;

    if (!userId) {
      return DefaultResponseBuilder.errors(request.requestId, [
        new AuthTokenInvalidError('Missing principal'),
      ]);
    }

    const result = await this.useCase.execute({
      userId,
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
