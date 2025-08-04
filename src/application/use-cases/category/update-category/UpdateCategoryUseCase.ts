import { EntityId } from '../../../../domain/shared/value-objects/entity-id/EntityId';
import { Either } from '../../../../shared/core/either';
import { DomainError } from '../../../../domain/shared/DomainError';

import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { CategoryNotFoundError } from '../../../shared/errors/CategoryNotFoundError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { IGetCategoryRepository } from '../../../contracts/repositories/category/IGetCategoryRepository';
import { ISaveCategoryRepository } from '../../../contracts/repositories/category/ISaveCategoryRepository';
import { UpdateCategoryDto } from './UpdateCategoryDto';

export class UpdateCategoryUseCase implements IUseCase<UpdateCategoryDto> {
  constructor(
    private readonly getCategoryByIdRepository: IGetCategoryRepository,
    private readonly saveCategoryRepository: ISaveCategoryRepository,
  ) {}

  async execute(
    dto: UpdateCategoryDto,
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

    const updateResult = category.update({
      name: dto.name,
      type: dto.type,
    });

    if (updateResult.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        updateResult.errors,
      );
    }

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
