import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Category } from '@domain/aggregates/category/category-entity/Category';
import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { AddCategoryRepository } from './AddCategoryRepository';

describe('AddCategoryRepository', () => {
  let repository: AddCategoryRepository;
  let mockConnection: {
    queryOne: jest.Mock;
  };

  beforeEach(() => {
    mockConnection = {
      queryOne: jest.fn().mockResolvedValue(undefined),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repository = new AddCategoryRepository(mockConnection as any);
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
      expect(mockConnection.queryOne).toHaveBeenCalledTimes(1);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
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

      const [query, params] = mockConnection.queryOne.mock.calls[0];
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
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        expect.arrayContaining([CategoryTypeEnum.INCOME]),
      );
    });

    it('should handle deleted category', async () => {
      const category = createValidCategory();
      category.delete();

      const result = await repository.execute(category);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO categories'),
        expect.arrayContaining([true]), // is_deleted = true
      );
    });

    it('should return error when database fails with duplicate key', async () => {
      const category = createValidCategory();
      const dbError = new Error('Duplicate key violation') as Error & {
        code: string;
      };
      dbError.code = '23505';

      mockConnection.queryOne.mockRejectedValue(dbError);

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

      mockConnection.queryOne.mockRejectedValue(dbError);

      const result = await repository.execute(category);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to add category');
      expect(result.errors[0].message).toContain('Database connection failed');
    });

    it('should handle unknown error type', async () => {
      const category = createValidCategory();
      const unknownError = 'Unknown error string';

      mockConnection.queryOne.mockRejectedValue(unknownError);

      const result = await repository.execute(category);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to add category');
      expect(result.errors[0].message).toContain('Unknown error');
    });

    it('should preserve all category properties', async () => {
      const budgetId = EntityId.create().value!.id;
      const category = Category.create({
        name: 'Complete Category',
        type: CategoryTypeEnum.EXPENSE,
        budgetId,
      }).data!;

      await repository.execute(category);

      const [, params] = mockConnection.queryOne.mock.calls[0];
      expect(params[0]).toBe(category.id); // id
      expect(params[1]).toBe('Complete Category'); // name
      expect(params[2]).toBe(CategoryTypeEnum.EXPENSE); // type
      expect(params[3]).toBe(budgetId); // budget_id
      expect(params[4]).toBe(false); // is_deleted
      expect(params[5]).toBeInstanceOf(Date); // created_at
      expect(params[6]).toBeInstanceOf(Date); // updated_at
    });
  });
});
