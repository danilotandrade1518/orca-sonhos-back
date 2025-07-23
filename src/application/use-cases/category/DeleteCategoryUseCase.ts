import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';
import { DomainError } from '@domain/shared/DomainError';

import { ApplicationError } from '../../shared/errors/ApplicationError';
import { CategoryDeletionFailedError } from '../../shared/errors/CategoryDeletionFailedError';
import { CategoryNotFoundError } from '../../shared/errors/CategoryNotFoundError';
import { IUseCase, UseCaseResponse } from '../../shared/IUseCase';
import { IGetCategoryByIdRepository } from '../../contracts/repositories/category/IGetCategoryByIdRepository';
import { ICheckCategoryDependenciesRepository } from '../../contracts/repositories/category/ICheckCategoryDependenciesRepository';
import { IDeleteCategoryRepository } from '../../contracts/repositories/category/IDeleteCategoryRepository';

export type DeleteCategoryRequest = {
  id: string;
};

export class DeleteCategoryUseCase implements IUseCase<DeleteCategoryRequest> {
  constructor(
    private readonly getCategoryByIdRepository: IGetCategoryByIdRepository,
    private readonly checkCategoryDependenciesRepository: ICheckCategoryDependenciesRepository,
    private readonly deleteCategoryRepository: IDeleteCategoryRepository,
  ) {}

  async execute(
    request: DeleteCategoryRequest,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    // Create EntityId to validate the format
    const categoryId = EntityId.fromString(request.id);
    if (categoryId.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        categoryId.errors,
      );
    }

    // Check if category exists
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

    // Check for dependencies
    const dependenciesResult =
      await this.checkCategoryDependenciesRepository.execute(request.id);
    if (dependenciesResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        dependenciesResult.errors,
      );
    }

    const hasDependencies = dependenciesResult.data!;
    if (hasDependencies) {
      return Either.error<DomainError | ApplicationError, UseCaseResponse>(
        new CategoryDeletionFailedError(),
      );
    }

    // Delete category using domain method
    const deleteResult = category.delete();
    if (deleteResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        deleteResult.errors,
      );
    }

    // Delete from repository
    const deleteFromRepoResult = await this.deleteCategoryRepository.execute(
      request.id,
    );
    if (deleteFromRepoResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        deleteFromRepoResult.errors,
      );
    }

    return Either.success<DomainError | ApplicationError, UseCaseResponse>({
      id: category.id,
    });
  }
}
