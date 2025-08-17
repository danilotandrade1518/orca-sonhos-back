import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { UpdateCreditCardUseCase } from '@application/use-cases/credit-card/update-credit-card/UpdateCreditCardUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface UpdateCreditCardBody {
  id: string;
  name: string;
  limit: number;
  closingDay: number;
  dueDay: number;
}

export class UpdateCreditCardController implements HttpController {
  constructor(private readonly useCase: UpdateCreditCardUseCase) {}

  async handle(
    request: HttpRequest<UpdateCreditCardBody>,
  ): Promise<HttpResponse> {
    const { id, name, limit, closingDay, dueDay } = request.body;

    const result = await this.useCase.execute({
      id,
      name,
      limit,
      closingDay,
      dueDay,
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
