import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { UpdateAccountUseCase } from '@application/use-cases/account/update-account/UpdateAccountUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

type UpdateAccountBody = {
  id: string;
  userId: string;
  name?: string;
  description?: string;
  initialBalance?: number;
};

export class UpdateAccountController implements HttpController {
  constructor(private readonly useCase: UpdateAccountUseCase) {}

  async handle(request: HttpRequest<UpdateAccountBody>): Promise<HttpResponse> {
    const body = request.body;
    const result = await this.useCase.execute({
      id: body.id,
      userId: body.userId,
      name: body.name,
      description: body.description,
      initialBalance: body.initialBalance,
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
