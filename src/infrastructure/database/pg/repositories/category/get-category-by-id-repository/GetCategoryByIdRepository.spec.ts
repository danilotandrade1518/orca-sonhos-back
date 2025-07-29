import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Category } from '@domain/aggregates/category/category-entity/Category';
import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';

import { DomainError } from '../../../../../../domain/shared/DomainError';
import { Either } from '../../../../../../shared/core/either';
import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  CategoryMapper,
  CategoryRow,
} from '../../../mappers/category/CategoryMapper';
import { GetCategoryByIdRepository } from './GetCategoryByIdRepository';

class TestDomainError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'TestDomainError';
  }
}

jest.mock('../../../mappers/category/CategoryMapper');

describe('GetCategoryByIdRepository', () => {
  let repository: GetCategoryByIdRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockCategoryMapper: jest.Mocked<typeof CategoryMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    mockCategoryMapper = CategoryMapper as jest.Mocked<typeof CategoryMapper>;
    repository = new GetCategoryByIdRepository(mockConnection);
  });

  it('should get category by id successfully', async () => {
    // Arrange
    const categoryId = '550e8400-e29b-41d4-a716-446655440000';
    const categoryRow: CategoryRow = {
      id: categoryId,
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
      budget_id: '550e8400-e29b-41d4-a716-446655440001',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mockCategory = Category.restore({
      id: categoryId,
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
      budgetId: '550e8400-e29b-41d4-a716-446655440001',
      isDeleted: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    mockConnection.queryOne.mockResolvedValue(categoryRow);
    mockCategoryMapper.toDomain.mockReturnValue(mockCategory);

    // Act
    const result = await repository.execute(categoryId);

    // Assert
    expect(result.hasError).toBeFalsy();
    expect(result.data).toBe(mockCategory.data);
    expect(mockConnection.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [categoryId],
    );
    expect(mockCategoryMapper.toDomain).toHaveBeenCalledWith(categoryRow);
  });

  it('should return null when category is not found', async () => {
    // Arrange
    const categoryId = '550e8400-e29b-41d4-a716-446655440000';
    mockConnection.queryOne.mockResolvedValue(null);

    // Act
    const result = await repository.execute(categoryId);

    // Assert
    expect(result.hasError).toBeFalsy();
    expect(result.data).toBeNull();
    expect(mockConnection.queryOne).toHaveBeenCalledWith(
      expect.stringContaining('SELECT'),
      [categoryId],
    );
    expect(mockCategoryMapper.toDomain).not.toHaveBeenCalled();
  });

  it('should return error when mapping fails', async () => {
    // Arrange
    const categoryId = '550e8400-e29b-41d4-a716-446655440000';
    const categoryRow: CategoryRow = {
      id: categoryId,
      name: 'Alimentação',
      type: CategoryTypeEnum.EXPENSE,
      budget_id: '550e8400-e29b-41d4-a716-446655440001',
      is_deleted: false,
      created_at: new Date(),
      updated_at: new Date(),
    };

    const mappingError = Either.error(new TestDomainError('Mapping error'));
    mockConnection.queryOne.mockResolvedValue(categoryRow);
    mockCategoryMapper.toDomain.mockReturnValue(
      mappingError as Either<DomainError, Category>,
    );

    // Act
    const result = await repository.execute(categoryId);

    // Assert
    expect(result.hasError).toBeTruthy();
    expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    expect(result.errors[0].message).toContain('Failed to map category');
  });

  it('should return error when database query fails', async () => {
    // Arrange
    const categoryId = '550e8400-e29b-41d4-a716-446655440000';
    const dbError = new Error('Database connection failed');
    mockConnection.queryOne.mockRejectedValue(dbError);

    // Act
    const result = await repository.execute(categoryId);

    // Assert
    expect(result.hasError).toBeTruthy();
    expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    expect(result.errors[0].message).toContain('Failed to get category by id');
  });
});
