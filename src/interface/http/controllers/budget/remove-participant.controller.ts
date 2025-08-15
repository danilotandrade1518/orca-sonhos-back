import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { RemoveParticipantFromBudgetUseCase } from '@application/use-cases/budget/remove-participant/RemoveParticipantFromBudgetUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { HttpController, HttpRequest, HttpResponse } from '../../http-types';
import { mapErrorsToHttp } from '../../mappers/error-mapper';

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
      return mapErrorsToHttp(
        result.errors as (DomainError | ApplicationError)[],
        request.requestId,
      );

    return {
      status: 200,
      body: { id: result.data?.id, traceId: request.requestId },
    };
  }
}
