import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreateEnvelopeUseCase } from '@application/use-cases/envelope/create-envelope/CreateEnvelopeUseCase';
import { DomainError } from '@domain/shared/DomainError';
import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface CreateEnvelopeBody {
  name: string;
  monthlyLimit: number;
  budgetId: string;
  categoryId: string;
  userId: string;
}

export class CreateEnvelopeController implements HttpController {
  constructor(private readonly useCase: CreateEnvelopeUseCase) {}

  async handle(
    request: HttpRequest<CreateEnvelopeBody>,
  ): Promise<HttpResponse> {
    const { name, monthlyLimit, budgetId, categoryId, userId } = request.body;

    const result = await this.useCase.execute({
      name,
      monthlyLimit,
      budgetId,
      categoryId,
      userId,
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
