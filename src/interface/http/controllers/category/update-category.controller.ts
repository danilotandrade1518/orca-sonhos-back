import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { UpdateCategoryUseCase } from '@application/use-cases/category/update-category/UpdateCategoryUseCase';
import { DomainError } from '@domain/shared/DomainError';
import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface UpdateCategoryBody {
  id: string;
  name: string;
  type: string;
}

export class UpdateCategoryController implements HttpController {
  constructor(private readonly useCase: UpdateCategoryUseCase) {}

  async handle(
    request: HttpRequest<UpdateCategoryBody>,
  ): Promise<HttpResponse> {
    const { id, name, type } = request.body;

    const result = await this.useCase.execute({
      id,
      name,
      type: type as CategoryTypeEnum,
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
