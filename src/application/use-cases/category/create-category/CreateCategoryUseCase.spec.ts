import { CategoryTypeEnum } from '../../../../domain/aggregates/category/value-objects/category-type/CategoryType';
import { Either } from '../../../../shared/core/either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { IAddCategoryRepository } from '../../../contracts/repositories/category/IAddCategoryRepository';
import { CreateCategoryUseCase } from './CreateCategoryUseCase';
import { CreateCategoryDto } from './CreateCategoryDto';

describe('CreateCategoryUseCase', () => {
  let createCategoryUseCase: CreateCategoryUseCase;
  let mockAddCategoryRepository: jest.Mocked<IAddCategoryRepository>;

  beforeEach(() => {
    mockAddCategoryRepository = {
      execute: jest.fn(),
    };

    createCategoryUseCase = new CreateCategoryUseCase(
      mockAddCategoryRepository,
    );
  });

  it('should create a category successfully', async () => {
    const dto: CreateCategoryDto = {
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
      budgetId: '550e8400-e29b-41d4-a716-446655440000',
    };

    mockAddCategoryRepository.execute.mockResolvedValue(
      Either.success(undefined),
    );

    const result = await createCategoryUseCase.execute(dto);

    expect(result.hasError).toBeFalsy();
    expect(result.data).toBeDefined();
    expect(result.data!.id).toBeDefined();
    expect(mockAddCategoryRepository.execute).toHaveBeenCalledTimes(1);
  });

  it('should return error when category creation fails', async () => {
    const dto: CreateCategoryDto = {
      name: '',
      type: CategoryTypeEnum.EXPENSE,
      budgetId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const result = await createCategoryUseCase.execute(dto);

    expect(result.hasError).toBeTruthy();
    expect(mockAddCategoryRepository.execute).not.toHaveBeenCalled();
  });

  it('should return error when repository fails', async () => {
    const dto: CreateCategoryDto = {
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
      budgetId: '550e8400-e29b-41d4-a716-446655440000',
    };

    const repositoryError = Either.error<RepositoryError, void>(
      new RepositoryError('Repository error', new Error('Database error')),
    );
    mockAddCategoryRepository.execute.mockResolvedValue(repositoryError);

    const result = await createCategoryUseCase.execute(dto);

    expect(result.hasError).toBeTruthy();
    expect(mockAddCategoryRepository.execute).toHaveBeenCalledTimes(1);
  });
});
