import { CategoryTypeEnum } from '../../../../domain/aggregates/category/value-objects/category-type/CategoryType';
import { Category } from '../../../../domain/aggregates/category/category-entity/Category';
import { Either } from '../../../../shared/core/either';

import { CategoryNotFoundError } from '../../../shared/errors/CategoryNotFoundError';
import { CategoryDeletionFailedError } from '../../../shared/errors/CategoryDeletionFailedError';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { IGetCategoryRepository } from '../../../contracts/repositories/category/IGetCategoryRepository';
import { ICheckCategoryDependenciesRepository } from '../../../contracts/repositories/category/ICheckCategoryDependenciesRepository';
import { IDeleteCategoryRepository } from '../../../contracts/repositories/category/IDeleteCategoryRepository';
import { DeleteCategoryUseCase } from './DeleteCategoryUseCase';
import { DeleteCategoryDto } from './DeleteCategoryDto';

describe('DeleteCategoryUseCase', () => {
  let deleteCategoryUseCase: DeleteCategoryUseCase;
  let mockGetCategoryByIdRepository: jest.Mocked<IGetCategoryRepository>;
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

  it('should return error when category id is invalid', async () => {
    // Arrange
    const dto: DeleteCategoryDto = {
      id: 'invalid-uuid',
    };

    // Act
    const result = await deleteCategoryUseCase.execute(dto);

    // Assert
    expect(result.hasError).toBeTruthy();
    expect(mockGetCategoryByIdRepository.execute).not.toHaveBeenCalled();
    expect(
      mockCheckCategoryDependenciesRepository.execute,
    ).not.toHaveBeenCalled();
    expect(mockDeleteCategoryRepository.execute).not.toHaveBeenCalled();
  });

  it('should return error when get category repository fails', async () => {
    // Arrange
    const dto: DeleteCategoryDto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
    };

    const repositoryError = new RepositoryError('Database connection failed');
    mockGetCategoryByIdRepository.execute.mockResolvedValue(
      Either.error(repositoryError),
    );

    // Act
    const result = await deleteCategoryUseCase.execute(dto);

    // Assert
    expect(result.hasError).toBeTruthy();
    expect(result.errors[0]).toBe(repositoryError);
    expect(
      mockCheckCategoryDependenciesRepository.execute,
    ).not.toHaveBeenCalled();
    expect(mockDeleteCategoryRepository.execute).not.toHaveBeenCalled();
  });

  it('should return error when check dependencies repository fails', async () => {
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

    const repositoryError = new RepositoryError('Failed to check dependencies');
    mockGetCategoryByIdRepository.execute.mockResolvedValue(
      Either.success(existingCategory.data!),
    );
    mockCheckCategoryDependenciesRepository.execute.mockResolvedValue(
      Either.error(repositoryError),
    );

    // Act
    const result = await deleteCategoryUseCase.execute(dto);

    // Assert
    expect(result.hasError).toBeTruthy();
    expect(result.errors[0]).toBe(repositoryError);
    expect(mockDeleteCategoryRepository.execute).not.toHaveBeenCalled();
  });

  it('should return error when category delete method fails', async () => {
    // Arrange
    const dto: DeleteCategoryDto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
    };

    // Create a category that's already deleted to trigger delete method error
    const alreadyDeletedCategory = Category.restore({
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
      budgetId: '550e8400-e29b-41d4-a716-446655440001',
      isDeleted: true, // Already deleted
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockGetCategoryByIdRepository.execute.mockResolvedValue(
      Either.success(alreadyDeletedCategory.data!),
    );
    mockCheckCategoryDependenciesRepository.execute.mockResolvedValue(
      Either.success(false),
    );

    // Act
    const result = await deleteCategoryUseCase.execute(dto);

    // Assert
    expect(result.hasError).toBeTruthy();
    expect(mockDeleteCategoryRepository.execute).not.toHaveBeenCalled();
  });

  it('should return error when delete repository fails', async () => {
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

    const repositoryError = new RepositoryError(
      'Failed to delete from database',
    );
    mockGetCategoryByIdRepository.execute.mockResolvedValue(
      Either.success(existingCategory.data!),
    );
    mockCheckCategoryDependenciesRepository.execute.mockResolvedValue(
      Either.success(false),
    );
    mockDeleteCategoryRepository.execute.mockResolvedValue(
      Either.error(repositoryError),
    );

    // Act
    const result = await deleteCategoryUseCase.execute(dto);

    // Assert
    expect(result.hasError).toBeTruthy();
    expect(result.errors[0]).toBe(repositoryError);
  });

  it('should return error when empty id is provided', async () => {
    // Arrange
    const dto: DeleteCategoryDto = {
      id: '',
    };

    // Act
    const result = await deleteCategoryUseCase.execute(dto);

    // Assert
    expect(result.hasError).toBeTruthy();
    expect(mockGetCategoryByIdRepository.execute).not.toHaveBeenCalled();
    expect(
      mockCheckCategoryDependenciesRepository.execute,
    ).not.toHaveBeenCalled();
    expect(mockDeleteCategoryRepository.execute).not.toHaveBeenCalled();
  });
});
