import { Category } from '@domain/aggregates/category/category-entity/Category';
import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';
import { Either } from '@either';
import { DomainError } from '@domain/shared/DomainError';

import { ApplicationError } from '../../shared/errors/ApplicationError';
import { IUseCase, UseCaseResponse } from '../../shared/IUseCase';
import { IAddCategoryRepository } from '../../contracts/repositories/category/IAddCategoryRepository';

export type CreateCategoryRequest = {
  name: string;
  type: CategoryTypeEnum;
  budgetId: string;
};

export class CreateCategoryUseCase implements IUseCase<CreateCategoryRequest> {
  constructor(private readonly addCategoryRepository: IAddCategoryRepository) {}

  async execute(
    request: CreateCategoryRequest,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    // Create category entity
    const categoryOrError = Category.create({
      name: request.name,
      type: request.type,
      budgetId: request.budgetId,
    });

    if (categoryOrError.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        categoryOrError.errors,
      );
    }

    const category = categoryOrError.data!;

    // Save to repository
    const addResult = await this.addCategoryRepository.execute(category);
    if (addResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        addResult.errors,
      );
    }

    return Either.success<DomainError | ApplicationError, UseCaseResponse>({
      id: category.id,
    });
  }
}
