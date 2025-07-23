import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { DomainError } from '@domain/shared/DomainError';

import { ApplicationError } from '../../shared/errors/ApplicationError';
import { CategoryNotFoundError } from '../../shared/errors/CategoryNotFoundError';
import { IUseCase, UseCaseResponse } from '../../shared/IUseCase';
import { IGetCategoryByIdRepository } from '../../contracts/repositories/category/IGetCategoryByIdRepository';
import { ISaveCategoryRepository } from '../../contracts/repositories/category/ISaveCategoryRepository';

export type UpdateCategoryRequest = {
  id: string;
  name: string;
  type: CategoryTypeEnum;
};

export class UpdateCategoryUseCase implements IUseCase<UpdateCategoryRequest> {
  constructor(
    private readonly getCategoryByIdRepository: IGetCategoryByIdRepository,
    private readonly saveCategoryRepository: ISaveCategoryRepository,
  ) {}

  async execute(
    request: UpdateCategoryRequest,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    // Create EntityId to validate the format
    const categoryId = EntityId.fromString(request.id);
    if (categoryId.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        categoryId.errors,
      );
    }

    // Get category from repository using string ID
    const getCategoryResult = await this.getCategoryByIdRepository.execute(
      request.id,
    );
    if (getCategoryResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        getCategoryResult.errors,
      );
    }

    const category = getCategoryResult.data;
    if (!category) {
      return Either.error<DomainError | ApplicationError, UseCaseResponse>(
        new CategoryNotFoundError(),
      );
    }

    // Update category
    const updateResult = category.update({
      name: request.name,
      type: request.type,
    });

    if (updateResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        updateResult.errors,
      );
    }

    // Save to repository
    const saveResult = await this.saveCategoryRepository.execute(category);
    if (saveResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        saveResult.errors,
      );
    }

    return Either.success<DomainError | ApplicationError, UseCaseResponse>({
      id: category.id,
    });
  }
}
