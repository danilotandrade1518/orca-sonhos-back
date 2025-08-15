import { ApplicationError } from '@application/shared/errors/ApplicationError';
import { DeleteCategoryUseCase } from '@application/use-cases/category/delete-category/DeleteCategoryUseCase';
import { DomainError } from '@domain/shared/DomainError';

import { DefaultResponseBuilder } from '../../builders/DefaultResponseBuilder';
import { HttpController, HttpRequest, HttpResponse } from '../../http-types';

interface DeleteCategoryBody {
  id: string;
}

export class DeleteCategoryController implements HttpController {
  constructor(private readonly useCase: DeleteCategoryUseCase) {}

  async handle(
    request: HttpRequest<DeleteCategoryBody>,
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
