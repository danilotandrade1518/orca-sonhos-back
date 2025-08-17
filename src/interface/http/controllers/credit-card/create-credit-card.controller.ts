import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreateCreditCardUseCase } from '@application/use-cases/credit-card/create-credit-card/CreateCreditCardUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface CreateCreditCardBody {
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
  budgetId: string;
}

export class CreateCreditCardController implements HttpController {
  constructor(private readonly useCase: CreateCreditCardUseCase) {}

  async handle(
    request: HttpRequest<CreateCreditCardBody>,
  ): Promise<HttpResponse> {
    const { name, limit, closingDay, dueDay, budgetId } = request.body;

    const result = await this.useCase.execute({
      name,
      limit,
      closingDay,
      dueDay,
      budgetId,
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
