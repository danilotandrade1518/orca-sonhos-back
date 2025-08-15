import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreateBudgetUseCase } from '@application/use-cases/budget/create-budget/CreateBudgetUseCase';
import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { DomainError } from '@domain/shared/DomainError';

import { HttpController, HttpRequest, HttpResponse } from '../../http-types';
import { mapErrorsToHttp } from '../../mappers/error-mapper';

type CreateBudgetBody = {
  name: string;
  ownerId: string;
  participantIds: string[];
  type: string;
};

export class CreateBudgetController implements HttpController {
  constructor(private readonly useCase: CreateBudgetUseCase) {}

  async handle(request: HttpRequest<CreateBudgetBody>): Promise<HttpResponse> {
    const body = request.body;
    const participantIds = Array.isArray(body.participantIds)
      ? body.participantIds
      : [];

    const result = await this.useCase.execute({
      name: body.name,
      ownerId: body.ownerId,
      participantIds,
      type: body.type as BudgetTypeEnum,
    });

    if (result.hasError)
      return mapErrorsToHttp(
        result.errors as (DomainError | ApplicationError)[],
        request.requestId,
      );

    return {
      status: 201,
      body: { id: result.data?.id, traceId: request.requestId },
    };
  }
}
