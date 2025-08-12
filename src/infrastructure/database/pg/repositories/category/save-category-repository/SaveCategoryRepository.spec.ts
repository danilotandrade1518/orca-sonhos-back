import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Category } from '@domain/aggregates/category/category-entity/Category';
import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { SaveCategoryRepository } from './SaveCategoryRepository';

describe('SaveCategoryRepository', () => {
  let repository: SaveCategoryRepository;
  let mockConnection: {
    queryOne: jest.Mock;
  };

  beforeEach(() => {
    mockConnection = {
      queryOne: jest.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repository = new SaveCategoryRepository(mockConnection as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createValidCategory = (): Category => {
    return Category.create({
      name: 'Updated Category',
      type: CategoryTypeEnum.EXPENSE,
      budgetId: EntityId.create().value!.id,
    }).data!;
  };

  describe('execute', () => {
    it('should save category successfully', async () => {
      const category = createValidCategory();
      category.update({
        name: 'New Name',
        type: CategoryTypeEnum.EXPENSE,
      });

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(category);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledTimes(1);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories'),
        expect.arrayContaining([
          category.id,
          'New Name',
          CategoryTypeEnum.EXPENSE,
          category.budgetId,
          false,
          category.updatedAt,
        ]),
      );
    });

    it('should call UPDATE with correct SQL structure', async () => {
      const category = createValidCategory();
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      await repository.execute(category);

      const [query, params] = mockConnection.queryOne.mock.calls[0];
      expect(query).toContain('UPDATE categories');
      expect(query).toContain('name = $2');
      expect(query).toContain('type = $3');
      expect(query).toContain('budget_id = $4');
      expect(query).toContain('is_deleted = $5');
      expect(query).toContain('updated_at = $6');
      expect(query).toContain('WHERE id = $1');
      expect(params).toHaveLength(6);
    });

    it('should handle INCOME category update', async () => {
      const category = Category.create({
        name: 'Salary',
        type: CategoryTypeEnum.INCOME,
        budgetId: EntityId.create().value!.id,
      }).data!;

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(category);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories'),
        expect.arrayContaining([CategoryTypeEnum.INCOME]),
      );
    });

    it('should handle deleted category update', async () => {
      const category = createValidCategory();
      category.delete();

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(category);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories'),
        expect.arrayContaining([true]), // is_deleted = true
      );
    });

    it('should handle category with updated name', async () => {
      const category = createValidCategory();
      category.update({
        name: 'Completely New Name',
        type: CategoryTypeEnum.EXPENSE,
      });

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(category);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories'),
        expect.arrayContaining(['Completely New Name']),
      );
    });

    it('should return error when category not found', async () => {
      const category = createValidCategory();
      mockConnection.queryOne.mockResolvedValue({ rowCount: 0 });

      const result = await repository.execute(category);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Category with id');
      expect(result.errors[0].message).toContain('not found for update');
    });

    it('should return error when query returns null', async () => {
      const category = createValidCategory();
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute(category);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('not found for update');
    });

    it('should return error when database fails', async () => {
      const category = createValidCategory();
      const dbError = new Error('Database connection failed');
      mockConnection.queryOne.mockRejectedValue(dbError);

      const result = await repository.execute(category);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to save category');
      expect(result.errors[0].message).toContain('Database connection failed');
    });

    it('should preserve all category properties during update', async () => {
      const budgetId = EntityId.create().value!.id;
      const category = Category.create({
        name: 'Original Name',
        type: CategoryTypeEnum.EXPENSE,
        budgetId,
      }).data!;

      category.update({
        name: 'Updated Name',
        type: CategoryTypeEnum.EXPENSE,
      });

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      await repository.execute(category);

      const [, params] = mockConnection.queryOne.mock.calls[0];
      expect(params[0]).toBe(category.id); // id
      expect(params[1]).toBe('Updated Name'); // name
      expect(params[2]).toBe(CategoryTypeEnum.EXPENSE); // type
      expect(params[3]).toBe(budgetId); // budget_id
      expect(params[4]).toBe(false); // is_deleted
      expect(params[5]).toBeInstanceOf(Date); // updated_at
    });

    it('should handle category with different budget', async () => {
      const newBudgetId = EntityId.create().value!.id;
      const category = Category.create({
        name: 'Test Category',
        type: CategoryTypeEnum.INCOME,
        budgetId: newBudgetId,
      }).data!;

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(category);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories'),
        expect.arrayContaining([newBudgetId]),
      );
    });
  });
});
