import { CategoryTypeEnum } from '../../../../domain/aggregates/category/value-objects/category-type/CategoryType';
import { Category } from '../../../../domain/aggregates/category/category-entity/Category';
import { Either } from '../../../../shared/core/either';

import { CategoryNotFoundError } from '../../../shared/errors/CategoryNotFoundError';
import { CategoryDeletionFailedError } from '../../../shared/errors/CategoryDeletionFailedError';
import { IGetCategoryByIdRepository } from '../../../contracts/repositories/category/IGetCategoryByIdRepository';
import { ICheckCategoryDependenciesRepository } from '../../../contracts/repositories/category/ICheckCategoryDependenciesRepository';
import { IDeleteCategoryRepository } from '../../../contracts/repositories/category/IDeleteCategoryRepository';
import { DeleteCategoryUseCase } from './DeleteCategoryUseCase';
import { DeleteCategoryDto } from './DeleteCategoryDto';

describe('DeleteCategoryUseCase', () => {
  let deleteCategoryUseCase: DeleteCategoryUseCase;
  let mockGetCategoryByIdRepository: jest.Mocked<IGetCategoryByIdRepository>;
  let mockCheckCategoryDependenciesRepository: jest.Mocked<ICheckCategoryDependenciesRepository>;
  let mockDeleteCategoryRepository: jest.Mocked<IDeleteCategoryRepository>;

  beforeEach(() => {
    mockGetCategoryByIdRepository = {
      execute: jest.fn(),
    };

    mockCheckCategoryDependenciesRepository = {
      execute: jest.fn(),
    };

    mockDeleteCategoryRepository = {
      execute: jest.fn(),
    };

    deleteCategoryUseCase = new DeleteCategoryUseCase(
      mockGetCategoryByIdRepository,
      mockCheckCategoryDependenciesRepository,
      mockDeleteCategoryRepository,
    );
  });

  it('should delete a category successfully', async () => {
    // Arrange
    const dto: DeleteCategoryDto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
    };

    const existingCategory = Category.restore({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
      budgetId: '550e8400-e29b-41d4-a716-446655440001',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockGetCategoryByIdRepository.execute.mockResolvedValue(
      Either.success(existingCategory.data!),
    );
    mockCheckCategoryDependenciesRepository.execute.mockResolvedValue(
      Either.success(false),
    );
    mockDeleteCategoryRepository.execute.mockResolvedValue(
      Either.success(undefined),
    );

    // Act
    const result = await deleteCategoryUseCase.execute(dto);

    // Assert
    expect(result.hasError).toBeFalsy();
    expect(result.data).toBeDefined();
    expect(result.data!.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(mockGetCategoryByIdRepository.execute).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
    );
    expect(
      mockCheckCategoryDependenciesRepository.execute,
    ).toHaveBeenCalledWith('550e8400-e29b-41d4-a716-446655440000');
    expect(mockDeleteCategoryRepository.execute).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
    );
  });

  it('should return error when category is not found', async () => {
    // Arrange
    const dto: DeleteCategoryDto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
    };

    mockGetCategoryByIdRepository.execute.mockResolvedValue(
      Either.success(null),
    );

    // Act
    const result = await deleteCategoryUseCase.execute(dto);

    // Assert
    expect(result.hasError).toBeTruthy();
    expect(result.errors[0]).toBeInstanceOf(CategoryNotFoundError);
    expect(
      mockCheckCategoryDependenciesRepository.execute,
    ).not.toHaveBeenCalled();
    expect(mockDeleteCategoryRepository.execute).not.toHaveBeenCalled();
  });

  it('should return error when category has dependencies', async () => {
    // Arrange
    const dto: DeleteCategoryDto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
    };

    const existingCategory = Category.restore({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
      budgetId: '550e8400-e29b-41d4-a716-446655440001',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockGetCategoryByIdRepository.execute.mockResolvedValue(
      Either.success(existingCategory.data!),
    );
    mockCheckCategoryDependenciesRepository.execute.mockResolvedValue(
      Either.success(true),
    );

    // Act
    const result = await deleteCategoryUseCase.execute(dto);

    // Assert
    expect(result.hasError).toBeTruthy();
    expect(result.errors[0]).toBeInstanceOf(CategoryDeletionFailedError);
    expect(mockDeleteCategoryRepository.execute).not.toHaveBeenCalled();
  });
});
