import { Category } from '@domain/aggregates/category/category-entity/Category';
import { Either } from '@either';
import { DomainError } from '@domain/shared/DomainError';

import { ApplicationError } from '../../../shared/errors/ApplicationError';
import { IUseCase, UseCaseResponse } from '../../../shared/IUseCase';
import { IAddCategoryRepository } from '../../../contracts/repositories/category/IAddCategoryRepository';
import { CreateCategoryDto } from './CreateCategoryDto';

export class CreateCategoryUseCase implements IUseCase<CreateCategoryDto> {
  constructor(private readonly addCategoryRepository: IAddCategoryRepository) {}

  async execute(
    dto: CreateCategoryDto,
  ): Promise<Either<DomainError | ApplicationError, UseCaseResponse>> {
    const categoryOrError = Category.create({
      name: dto.name,
      type: dto.type,
      budgetId: dto.budgetId,
    });

    if (categoryOrError.hasError) {
      return Either.errors<DomainError | ApplicationError, UseCaseResponse>(
        categoryOrError.errors,
      );
    }

    const category = categoryOrError.data!;

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
