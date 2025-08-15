import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { CreateCategoryUseCase } from '@application/use-cases/category/create-category/CreateCategoryUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface CreateCategoryBody {
  name: string;
  type: string;
  budgetId: string;
}

export class CreateCategoryController implements HttpController {
  constructor(private readonly useCase: CreateCategoryUseCase) {}

  async handle(
    request: HttpRequest<CreateCategoryBody>,
  ): Promise<HttpResponse> {
    const { name, type, budgetId } = request.body;

    const result = await this.useCase.execute({
      name,
      type: type as CategoryTypeEnum,
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
