import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { DeleteAccountUseCase } from '@application/use-cases/account/delete-account/DeleteAccountUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

type DeleteAccountBody = {
  userId: string;
  accountId: string;
};

export class DeleteAccountController implements HttpController {
  constructor(private readonly useCase: DeleteAccountUseCase) {}

  async handle(request: HttpRequest<DeleteAccountBody>): Promise<HttpResponse> {
    const body = request.body;
    const result = await this.useCase.execute({
      userId: body.userId,
      accountId: body.accountId,
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
