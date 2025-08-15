import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { AddParticipantToBudgetUseCase } from '@application/use-cases/budget/add-participant/AddParticipantToBudgetUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { HttpController, HttpRequest, HttpResponse } from '../../http-types';
import { mapErrorsToHttp } from '../../mappers/error-mapper';

type AddParticipantBody = {
  userId: string;
  budgetId: string;
  participantId: string;
};

export class AddParticipantToBudgetController implements HttpController {
  constructor(private readonly useCase: AddParticipantToBudgetUseCase) {}

  async handle(
    request: HttpRequest<AddParticipantBody>,
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
