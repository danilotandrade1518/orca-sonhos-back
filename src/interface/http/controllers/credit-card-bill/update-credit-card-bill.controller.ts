import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { UpdateCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/update-credit-card-bill/UpdateCreditCardBillUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface UpdateCreditCardBillBody {
  id: string;
  closingDate: string;
  dueDate: string;
  amount: number;
}

export class UpdateCreditCardBillController implements HttpController {
  constructor(private readonly useCase: UpdateCreditCardBillUseCase) {}

  async handle(
    request: HttpRequest<UpdateCreditCardBillBody>,
  ): Promise<HttpResponse> {
    const { id, closingDate, dueDate, amount } = request.body;

    const result = await this.useCase.execute({
      id,
      closingDate: new Date(closingDate),
      dueDate: new Date(dueDate),
      amount,
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
