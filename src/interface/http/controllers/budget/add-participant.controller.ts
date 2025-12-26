import { AddParticipantToBudgetUseCase } from '@application/use-cases/budget/add-participant/AddParticipantToBudgetUseCase';
import { AuthTokenInvalidError } from '@application/shared/errors/AuthTokenInvalidError';
import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

type AddParticipantBody = {
  budgetId: string;
  participantId: string;
};

export class AddParticipantToBudgetController implements HttpController {
  constructor(private readonly useCase: AddParticipantToBudgetUseCase) {}

  async handle(
    request: HttpRequest<AddParticipantBody>,
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
