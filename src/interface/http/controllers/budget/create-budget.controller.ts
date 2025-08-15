import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreateBudgetUseCase } from '@application/use-cases/budget/create-budget/CreateBudgetUseCase';
import { BudgetTypeEnum } from '@domain/aggregates/budget/value-objects/budget-type/BudgetType';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

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
      return DefaultResponseBuilder.errors(
        request.requestId,
        result.errors as (DomainError | ApplicationError)[],
      );

    return DefaultResponseBuilder.created(request.requestId, {
      id: result.data?.id,
    });
  }
}
