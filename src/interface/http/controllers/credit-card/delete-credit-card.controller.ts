import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { DeleteCreditCardUseCase } from '@application/use-cases/credit-card/delete-credit-card/DeleteCreditCardUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface DeleteCreditCardBody {
  id: string;
}

export class DeleteCreditCardController implements HttpController {
  constructor(private readonly useCase: DeleteCreditCardUseCase) {}

  async handle(
    request: HttpRequest<DeleteCreditCardBody>,
  ): Promise<HttpResponse> {
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
