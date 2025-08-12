import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { DeleteCategoryRepository } from './DeleteCategoryRepository';

describe('DeleteCategoryRepository', () => {
  let repository: DeleteCategoryRepository;
  let mockConnection: {
    queryOne: jest.Mock;
  };

  beforeEach(() => {
    mockConnection = {
      queryOne: jest.fn(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    repository = new DeleteCategoryRepository(mockConnection as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('execute', () => {
    it('should delete category successfully', async () => {
      const categoryId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledTimes(1);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories'),
        [categoryId],
      );
    });

    it('should call UPDATE with correct SQL structure', async () => {
      const categoryId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      await repository.execute(categoryId);

      const [query, params] = mockConnection.queryOne.mock.calls[0];
      expect(query).toContain('UPDATE categories');
      expect(query).toContain('is_deleted = true');
      expect(query).toContain('updated_at = NOW()');
      expect(query).toContain('WHERE id = $1 AND is_deleted = false');
      expect(params).toEqual([categoryId]);
      expect(params).toHaveLength(1);
    });

    it('should only update non-deleted categories', async () => {
      const categoryId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      await repository.execute(categoryId);

      const [query] = mockConnection.queryOne.mock.calls[0];
      expect(query).toContain('is_deleted = false');
    });

    it('should set updated_at to current time', async () => {
      const categoryId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      await repository.execute(categoryId);

      const [query] = mockConnection.queryOne.mock.calls[0];
      expect(query).toContain('updated_at = NOW()');
    });

    it('should handle different valid category IDs', async () => {
      const categoryId1 = EntityId.create().value!.id;
      const categoryId2 = EntityId.create().value!.id;

      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result1 = await repository.execute(categoryId1);
      const result2 = await repository.execute(categoryId2);

      expect(result1.hasError).toBe(false);
      expect(result2.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories'),
        [categoryId1],
      );
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories'),
        [categoryId2],
      );
    });

    it('should return error when category not found', async () => {
      const categoryId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 0 });

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Category with id');
      expect(result.errors[0].message).toContain('not found for deletion');
      expect(result.errors[0].message).toContain(categoryId);
    });

    it('should return error when query returns null', async () => {
      const categoryId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('not found for deletion');
    });

    it('should return error when database fails', async () => {
      const categoryId = EntityId.create().value!.id;
      const dbError = new Error('Database connection failed');
      mockConnection.queryOne.mockRejectedValue(dbError);

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to delete category');
      expect(result.errors[0].message).toContain('Database connection failed');
    });

    it('should handle string category ID correctly', async () => {
      const categoryId = 'fixed-category-id-123';
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE categories'),
        [categoryId],
      );
    });

    it('should handle already deleted category (no rows affected)', async () => {
      const categoryId = EntityId.create().value!.id;
      // Simula que nenhuma linha foi afetada porque a categoria já estava deletada
      mockConnection.queryOne.mockResolvedValue({ rowCount: 0 });

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(true);
      expect(result.errors[0].message).toContain('not found for deletion');
    });

    it('should perform soft delete, not hard delete', async () => {
      const categoryId = EntityId.create().value!.id;
      mockConnection.queryOne.mockResolvedValue({ rowCount: 1 });

      await repository.execute(categoryId);

      const [query] = mockConnection.queryOne.mock.calls[0];
      expect(query).toContain('UPDATE categories');
      expect(query).not.toContain('DELETE FROM');
      expect(query).toContain('is_deleted = true');
    });
  });
});
