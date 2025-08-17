import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { DeleteTransactionUseCase } from '@application/use-cases/transaction/delete-transaction/DeleteTransactionUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface DeleteTransactionBody {
  id: string;
  userId: string;
}

export class DeleteTransactionController implements HttpController {
  constructor(private readonly useCase: DeleteTransactionUseCase) {}

  async handle(
    request: HttpRequest<DeleteTransactionBody>,
  ): Promise<HttpResponse> {
    const { id, userId } = request.body;
    const result = await this.useCase.execute({ id, userId });

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
