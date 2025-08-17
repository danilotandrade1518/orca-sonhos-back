import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreateCreditCardBillUseCase } from '@application/use-cases/credit-card-bill/create-credit-card-bill/CreateCreditCardBillUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface CreateCreditCardBillBody {
  creditCardId: string;
  closingDate: string;
  dueDate: string;
  amount: number;
}

export class CreateCreditCardBillController implements HttpController {
  constructor(private readonly useCase: CreateCreditCardBillUseCase) {}

  async handle(
    request: HttpRequest<CreateCreditCardBillBody>,
  ): Promise<HttpResponse> {
    const { creditCardId, closingDate, dueDate, amount } = request.body;

    const result = await this.useCase.execute({
      creditCardId,
      closingDate: new Date(closingDate),
      dueDate: new Date(dueDate),
      amount,
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
