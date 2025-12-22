import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Category } from '@domain/aggregates/category/category-entity/Category';
import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { IPostgresConnectionAdapter } from '@infrastructure/adapters/IPostgresConnectionAdapter';

import { AddCategoryRepository } from './AddCategoryRepository';

describe('AddCategoryRepository', () => {
  let repository: AddCategoryRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    repository = new AddCategoryRepository(mockConnection);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createValidCategory = (): Category => {
    return Category.create({
      name: 'Test Category',
      type: CategoryTypeEnum.EXPENSE,
      budgetId: EntityId.create().value!.id,
    }).data!;
  };

  describe('execute', () => {
    it('should add category successfully', async () => {
      const category = createValidCategory();

      const result = await repository.execute(category);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledTimes(1);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        expect.arrayContaining([
          category.id,
          'Test Category',
          CategoryTypeEnum.EXPENSE,
          category.budgetId,
          false,
          category.createdAt,
          category.updatedAt,
        ]),
      );
    });

    it('should call INSERT with correct SQL structure', async () => {
      const category = createValidCategory();

      await repository.execute(category);

      const [query, params] = mockConnection.query.mock.calls[0];
      expect(query).toContain('INSERT INTO categories');
      expect(query).toContain(
        'id, name, type, budget_id, is_deleted, created_at, updated_at',
      );
      expect(query).toContain('VALUES ($1, $2, $3, $4, $5, $6, $7)');
      expect(params).toHaveLength(7);
    });

    it('should handle income category type', async () => {
      const category = Category.create({
        name: 'Income Category',
        type: CategoryTypeEnum.INCOME,
        budgetId: EntityId.create().value!.id,
      }).data!;

      const result = await repository.execute(category);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        expect.arrayContaining([CategoryTypeEnum.INCOME]),
      );
    });

    it('should handle deleted category', async () => {
      const category = createValidCategory();
      category.delete();

      const result = await repository.execute(category);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        expect.arrayContaining([true]),
      );
    });

    it('should return error when database fails with duplicate key', async () => {
      const category = createValidCategory();
      const dbError = new Error('Duplicate key violation') as Error & {
        code: string;
      };
      dbError.code = '23505';

      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.execute(category);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain(
        'Category with id already exists',
      );
    });

    it('should return error when database fails with generic error', async () => {
      const category = createValidCategory();
      const dbError = new Error('Database connection failed');

      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.execute(category);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to add category');
      expect(result.errors[0].message).toContain('Database connection failed');
    });

    it('should handle unknown error type', async () => {
      const category = createValidCategory();
      const unknownError = 'Unknown error string';

      mockConnection.query.mockRejectedValue(unknownError);

      const result = await repository.execute(category);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to add category');
      expect(result.errors[0].message).toContain('Unknown error');
    });
  });
});
