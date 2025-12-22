import { Category } from '../../../../domain/aggregates/category/category-entity/Category';
import { CategoryTypeEnum } from '../../../../domain/aggregates/category/value-objects/category-type/CategoryType';
import { Either } from '../../../../shared/core/either';
import { IGetCategoryRepository } from '../../../contracts/repositories/category/IGetCategoryRepository';
import { ISaveCategoryRepository } from '../../../contracts/repositories/category/ISaveCategoryRepository';
import { CategoryNotFoundError } from '../../../shared/errors/CategoryNotFoundError';
import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { UpdateCategoryDto } from './UpdateCategoryDto';
import { UpdateCategoryUseCase } from './UpdateCategoryUseCase';

describe('UpdateCategoryUseCase', () => {
  let updateCategoryUseCase: UpdateCategoryUseCase;
  let mockGetCategoryByIdRepository: jest.Mocked<IGetCategoryRepository>;
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

    const result = await updateCategoryUseCase.execute(dto);

    expect(result.hasError).toBeFalsy();
    expect(result.data).toBeDefined();
    expect(result.data!.id).toBe('550e8400-e29b-41d4-a716-446655440000');
    expect(mockGetCategoryByIdRepository.execute).toHaveBeenCalledWith(
      '550e8400-e29b-41d4-a716-446655440000',
    );
    expect(mockSaveCategoryRepository.execute).toHaveBeenCalledTimes(1);
  });

  it('should return error when category is not found', async () => {
    const dto: UpdateCategoryDto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
    };

    mockGetCategoryByIdRepository.execute.mockResolvedValue(
      Either.success(null),
    );

    const result = await updateCategoryUseCase.execute(dto);

    expect(result.hasError).toBeTruthy();
    expect(result.errors[0]).toBeInstanceOf(CategoryNotFoundError);
    expect(mockSaveCategoryRepository.execute).not.toHaveBeenCalled();
  });

  it('should return error when repository get fails', async () => {
    const dto: UpdateCategoryDto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
    };

    const repositoryError = Either.error<RepositoryError, Category | null>(
      new RepositoryError('Repository error', new Error('Database error')),
    );
    mockGetCategoryByIdRepository.execute.mockResolvedValue(repositoryError);

    const result = await updateCategoryUseCase.execute(dto);

    expect(result.hasError).toBeTruthy();
    expect(mockSaveCategoryRepository.execute).not.toHaveBeenCalled();
  });

  it('should return error when category id is invalid', async () => {
    const dto: UpdateCategoryDto = {
      id: 'invalid-uuid',
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
    };

    const result = await updateCategoryUseCase.execute(dto);

    expect(result.hasError).toBeTruthy();
    expect(mockGetCategoryByIdRepository.execute).not.toHaveBeenCalled();
    expect(mockSaveCategoryRepository.execute).not.toHaveBeenCalled();
  });

  it('should return error when category update fails', async () => {
    const dto: UpdateCategoryDto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: '',
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

    const result = await updateCategoryUseCase.execute(dto);

    expect(result.hasError).toBeTruthy();
    expect(mockSaveCategoryRepository.execute).not.toHaveBeenCalled();
  });

  it('should return error when save repository fails', async () => {
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

    const saveError = new RepositoryError(
      'Failed to save category',
      new Error('Database error'),
    );

    mockGetCategoryByIdRepository.execute.mockResolvedValue(
      Either.success(existingCategory.data!),
    );
    mockSaveCategoryRepository.execute.mockResolvedValue(
      Either.error(saveError),
    );

    const result = await updateCategoryUseCase.execute(dto);

    expect(result.hasError).toBeTruthy();
    expect(result.errors[0]).toBe(saveError);
  });

  it('should return error when empty id is provided', async () => {
    const dto: UpdateCategoryDto = {
      id: '',
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
    };

    const result = await updateCategoryUseCase.execute(dto);

    expect(result.hasError).toBeTruthy();
    expect(mockGetCategoryByIdRepository.execute).not.toHaveBeenCalled();
    expect(mockSaveCategoryRepository.execute).not.toHaveBeenCalled();
  });

  it('should update category type successfully', async () => {
    const dto: UpdateCategoryDto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: 'Renda Mensal',
      type: CategoryTypeEnum.INCOME,
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

    const result = await updateCategoryUseCase.execute(dto);

    expect(result.hasError).toBeFalsy();
    expect(result.data!.id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should handle valid category names', async () => {
    const validName = 'Categoria com Nome Válido';
    const dto: UpdateCategoryDto = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      name: validName,
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

    const result = await updateCategoryUseCase.execute(dto);

    expect(result.hasError).toBeFalsy();
    expect(result.data!.id).toBe('550e8400-e29b-41d4-a716-446655440000');
  });
});
