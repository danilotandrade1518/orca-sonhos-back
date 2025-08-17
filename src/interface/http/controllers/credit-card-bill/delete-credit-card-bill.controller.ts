import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { DeleteCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/delete-credit-card-bill/DeleteCreditCardBillUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface DeleteCreditCardBillBody {
  id: string;
}

export class DeleteCreditCardBillController implements HttpController {
  constructor(private readonly useCase: DeleteCreditCardBillUseCase) {}

  async handle(
    request: HttpRequest<DeleteCreditCardBillBody>,
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
