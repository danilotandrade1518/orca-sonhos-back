import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { UpdateGoalUseCase } from '@application/use-cases/goal/update-goal/UpdateGoalUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface UpdateGoalBody {
  id: string;
  name: string;
  totalAmount: number;
  deadline?: string;
}

export class UpdateGoalController implements HttpController {
  constructor(private readonly useCase: UpdateGoalUseCase) {}

  async handle(request: HttpRequest<UpdateGoalBody>): Promise<HttpResponse> {
    const { id, name, totalAmount, deadline } = request.body;
    const result = await this.useCase.execute({
      id,
      name,
      totalAmount,
      deadline: deadline ? new Date(deadline) : undefined,
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
