import { EntityId } from '../../../../domain/shared/value-objects/entity-id/EntityId';
import { Either } from '../../../../shared/core/either';
import { DomainError } from '../../../../domain/shared/DomainError';

import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { CategoryDeletionFailedError } from '../../../shared/errors/CategoryDeletionFailedError';
import { CategoryNotFoundError } from '../../../shared/errors/CategoryNotFoundError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { IGetCategoryRepository } from '../../../contracts/repositories/category/IGetCategoryRepository';
import { ICheckCategoryDependenciesRepository } from '../../../contracts/repositories/category/ICheckCategoryDependenciesRepository';
import { IDeleteCategoryRepository } from '../../../contracts/repositories/category/IDeleteCategoryRepository';
import { DeleteCategoryDto } from './DeleteCategoryDto';

export class DeleteCategoryUseCase implements IUseCase<DeleteCategoryDto> {
  constructor(
    private readonly getCategoryByIdRepository: IGetCategoryRepository,
    private readonly checkCategoryDependenciesRepository: ICheckCategoryDependenciesRepository,
    private readonly deleteCategoryRepository: IDeleteCategoryRepository,
  ) {}

  async execute(
    dto: DeleteCategoryDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const categoryId = EntityId.fromString(dto.id);
    if (categoryId.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        categoryId.errors,
      );
    }

    const getCategoryResult = await this.getCategoryByIdRepository.execute(
      dto.id,
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

    const dependenciesResult =
      await this.checkCategoryDependenciesRepository.execute(dto.id);
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

    const deleteResult = category.delete();
    if (deleteResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        deleteResult.errors,
      );
    }

    const deleteFromRepoResult = await this.deleteCategoryRepository.execute(
      dto.id,
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
