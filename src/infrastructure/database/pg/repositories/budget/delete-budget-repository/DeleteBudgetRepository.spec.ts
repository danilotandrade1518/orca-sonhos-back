import { RepositoryError } from '@application/shared/errors/RepositoryError';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { DeleteBudgetRepository } from './DeleteBudgetRepository';

describe('DeleteBudgetRepository', () => {
  let repository: DeleteBudgetRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    repository = new DeleteBudgetRepository(mockConnection);
  });

  describe('execute', () => {
    it('should mark budget as deleted successfully', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute('budget-id');

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE budgets'),
        ['budget-id'],
      );
    });

    it('should be idempotent when called multiple times', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      const first = await repository.execute('budget-id');
      const second = await repository.execute('budget-id');

      expect(first.hasError).toBe(false);
      expect(second.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledTimes(2);
    });

    it('should not fail when budget is already deleted', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute('already-deleted');

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        ['already-deleted'],
      );
    });

    it('should return error when database query fails', async () => {
      const dbError = new Error('connection error');
      mockConnection.queryOne.mockRejectedValue(dbError);

      const result = await repository.execute('budget-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('should use correct SQL query', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      await repository.execute('budget-id');

      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringMatching(
          /UPDATE budgets[\s\S]*SET is_deleted = true, updated_at = NOW()[\s\S]*WHERE id = \$1 AND is_deleted = false/,
        ),
        ['budget-id'],
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockConnection.queryOne.mockRejectedValue('fail');

      const result = await repository.execute('budget-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].cause).toBeInstanceOf(Error);
    });

    it('should handle invalid ids', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      const resultNull = await repository.execute('');
      expect(resultNull.hasError).toBe(false);
    });
  });
});
