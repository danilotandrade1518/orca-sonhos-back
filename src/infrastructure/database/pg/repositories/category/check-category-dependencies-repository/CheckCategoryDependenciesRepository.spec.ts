import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { CheckCategoryDependenciesRepository } from './CheckCategoryDependenciesRepository';

describe('CheckCategoryDependenciesRepository', () => {
  let repository: CheckCategoryDependenciesRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    repository = new CheckCategoryDependenciesRepository(mockConnection);
  });

  describe('execute', () => {
    it('should return true when category has transactions', async () => {
      const categoryId = EntityId.create().value!.id;

      mockConnection.query.mockResolvedValueOnce({
        rows: [{ count: '2' }],
        rowCount: 1,
      });

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(true);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining(
          'SELECT COUNT(*) as count\n        FROM transactions \n        WHERE category_id = $1 AND is_deleted = false',
        ),
        [categoryId],
      );
    });

    it('should return false when category has no transactions', async () => {
      const categoryId = EntityId.create().value!.id;

      mockConnection.query.mockResolvedValueOnce({
        rows: [{ count: '0' }],
        rowCount: 1,
      });

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should return false when query returns null', async () => {
      const categoryId = EntityId.create().value!.id;

      mockConnection.query.mockResolvedValueOnce(null);

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should return false when count is undefined', async () => {
      const categoryId = EntityId.create().value!.id;

      mockConnection.query.mockResolvedValueOnce({
        rows: [{ count: undefined }],
        rowCount: 1,
      });

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should handle valid category ID with string format', async () => {
      const categoryId = 'valid-category-id';

      mockConnection.query.mockResolvedValueOnce({
        rows: [{ count: '1' }],
        rowCount: 1,
      });

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(true);
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [
        categoryId,
      ]);
    });

    it('should return error when database query fails', async () => {
      const categoryId = EntityId.create().value!.id;
      const dbError = new Error('Database connection failed');

      mockConnection.query.mockRejectedValueOnce(dbError);

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(true);
      expect(result.errors![0]).toBeInstanceOf(RepositoryError);
      expect(result.errors![0].message).toContain(
        'Failed to check category dependencies',
      );
      expect(result.errors![0].message).toContain('Database connection failed');
    });

    it('should handle network timeout error', async () => {
      const categoryId = EntityId.create().value!.id;
      const timeoutError = new Error('Connection timeout');

      mockConnection.query.mockRejectedValueOnce(timeoutError);

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(true);
      expect(result.errors![0]).toBeInstanceOf(RepositoryError);
      expect(result.errors![0].message).toContain('Connection timeout');
    });

    it('should use correct SQL query structure', async () => {
      const categoryId = EntityId.create().value!.id;

      mockConnection.query.mockResolvedValueOnce({
        rows: [{ count: '0' }],
        rowCount: 1,
      });

      await repository.execute(categoryId);

      const calledQuery = mockConnection.query.mock.calls[0][0];
      expect(calledQuery).toContain('SELECT COUNT(*) as count');
      expect(calledQuery).toContain('FROM transactions');
      expect(calledQuery).toContain(
        'WHERE category_id = $1 AND is_deleted = false',
      );
    });

    it('should handle empty category ID', async () => {
      const categoryId = '';

      mockConnection.query.mockResolvedValueOnce({
        rows: [{ count: '0' }],
        rowCount: 1,
      });

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [
        '',
      ]);
    });

    it('should handle special characters in category ID', async () => {
      const categoryId = 'test-id-with-special-chars-@#$';

      mockConnection.query.mockResolvedValueOnce({
        rows: [{ count: '1' }],
        rowCount: 1,
      });

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(true);
    });

    it('should handle large count numbers', async () => {
      const categoryId = EntityId.create().value!.id;

      mockConnection.query.mockResolvedValueOnce({
        rows: [{ count: '999999' }],
        rowCount: 1,
      });

      const result = await repository.execute(categoryId);

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(true);
    });
  });
});
