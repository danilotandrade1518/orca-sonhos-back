import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreateAccountUseCase } from '@application/use-cases/account/create-account/CreateAccountUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

type CreateAccountBody = {
  userId: string;
  name: string;
  type: string;
  budgetId: string;
  initialBalance?: number;
  description?: string;
};

export class CreateAccountController implements HttpController {
  constructor(private readonly useCase: CreateAccountUseCase) {}

  async handle(request: HttpRequest<CreateAccountBody>): Promise<HttpResponse> {
    const body = request.body;
    const result = await this.useCase.execute({
      userId: body.userId,
      name: body.name,
      type: body.type,
      budgetId: body.budgetId,
      initialBalance: body.initialBalance,
      description: body.description,
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
