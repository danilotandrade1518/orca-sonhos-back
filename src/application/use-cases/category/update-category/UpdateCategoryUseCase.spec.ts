import { CategoryTypeEnum } from '../../../../domain/aggregates/category/value-objects/category-type/CategoryType';
import { Category } from '../../../../domain/aggregates/category/category-entity/Category';
import { Either } from '../../../../shared/core/either';

import { CategoryNotFoundError } from '../../../shared/errors/CategoryNotFoundError';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { IGetCategoryByIdRepository } from '../../../contracts/repositories/category/IGetCategoryByIdRepository';
import { ISaveCategoryRepository } from '../../../contracts/repositories/category/ISaveCategoryRepository';
import { UpdateCategoryUseCase } from './UpdateCategoryUseCase';
import { UpdateCategoryDto } from './UpdateCategoryDto';

describe('UpdateCategoryUseCase', () => {
  let updateCategoryUseCase: UpdateCategoryUseCase;
  let mockGetCategoryByIdRepository: jest.Mocked<IGetCategoryByIdRepository>;
  let mockSaveCategoryRepository: jest.Mocked<ISaveCategoryRepository>;

  beforeEach(() => {
    mockGetCategoryByIdRepository = {
      execute: jest.fn(),
    };

    mockSaveCategoryRepository = {
      execute: jest.fn(),
    };

    updateCategoryUseCase = new UpdateCategoryUseCase(
      mockGetCategoryByIdRepository,
      mockSaveCategoryRepository,
    );
  });

  it('should update a category successfully', async () => {
    // Arrange
    const dto: UpdateCategoryDto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Alimentação Atualizada',
      type: CategoryTypeEnum.EXPENSE,
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
    mockSaveCategoryRepository.execute.mockResolvedValue(
      Either.success(undefined),
    );

    // Act
    const result = await updateCategoryUseCase.execute(dto);

    // Assert
    expect(result.hasError).toBeFalsy();
    expect(result.data).toBeDefined();
    expect(result.data!.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(mockGetCategoryByIdRepository.execute).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
    );
    expect(mockSaveCategoryRepository.execute).toHaveBeenCalledTimes(1);
  });

  it('should return error when category is not found', async () => {
    // Arrange
    const dto: UpdateCategoryDto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
    };

    mockGetCategoryByIdRepository.execute.mockResolvedValue(
      Either.success(null),
    );

    // Act
    const result = await updateCategoryUseCase.execute(dto);

    // Assert
    expect(result.hasError).toBeTruthy();
    expect(result.errors[0]).toBeInstanceOf(CategoryNotFoundError);
    expect(mockSaveCategoryRepository.execute).not.toHaveBeenCalled();
  });

  it('should return error when repository get fails', async () => {
    // Arrange
    const dto: UpdateCategoryDto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
    };

    const repositoryError = Either.error<RepositoryError, Category | null>(
      new RepositoryError('Repository error', new Error('Database error')),
    );
    mockGetCategoryByIdRepository.execute.mockResolvedValue(repositoryError);

    // Act
    const result = await updateCategoryUseCase.execute(dto);

    // Assert
    expect(result.hasError).toBeTruthy();
    expect(mockSaveCategoryRepository.execute).not.toHaveBeenCalled();
  });
});
