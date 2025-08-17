import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { DeleteGoalUseCase } from '@application/use-cases/goal/delete-goal/DeleteGoalUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface DeleteGoalBody {
  id: string;
}

export class DeleteGoalController implements HttpController {
  constructor(private readonly useCase: DeleteGoalUseCase) {}

  async handle(request: HttpRequest<DeleteGoalBody>): Promise<HttpResponse> {
    const { id } = request.body;
    const result = await this.useCase.execute({ id });

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
