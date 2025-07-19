import { RepositoryError } from '@application/shared/errors/RepositoryError';

import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import { DeleteBudgetRepository } from './DeleteBudgetRepository';

jest.mock('../../../connection/PostgreSQLConnection');

describe('DeleteBudgetRepository', () => {
  let repository: DeleteBudgetRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQueryOne: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryOne = jest.fn();

    (PostgreSQLConnection.getInstance as jest.Mock).mockReturnValue({
      queryOne: mockQueryOne,
    });

    repository = new DeleteBudgetRepository();
  });

  describe('execute', () => {
    it('should mark budget as deleted successfully', async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await repository.execute('budget-id');

      expect(result.hasError).toBe(false);
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE budgets'),
        ['budget-id'],
      );
    });

    it('should be idempotent when called multiple times', async () => {
      mockQueryOne.mockResolvedValue(null);

      const first = await repository.execute('budget-id');
      const second = await repository.execute('budget-id');

      expect(first.hasError).toBe(false);
      expect(second.hasError).toBe(false);
      expect(mockQueryOne).toHaveBeenCalledTimes(2);
    });

    it('should not fail when budget is already deleted', async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await repository.execute('already-deleted');

      expect(result.hasError).toBe(false);
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        ['already-deleted'],
      );
    });

    it('should return error when database query fails', async () => {
      const dbError = new Error('connection error');
      mockQueryOne.mockRejectedValue(dbError);

      const result = await repository.execute('budget-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('should use correct SQL query', async () => {
      mockQueryOne.mockResolvedValue(null);

      await repository.execute('budget-id');

      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringMatching(
          /UPDATE budgets[\s\S]*SET is_deleted = true, updated_at = NOW()[\s\S]*WHERE id = \$1 AND is_deleted = false/,
        ),
        ['budget-id'],
      );
    });

    it('should handle non-Error exceptions', async () => {
      mockQueryOne.mockRejectedValue('fail');

      const result = await repository.execute('budget-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].cause).toBeInstanceOf(Error);
    });

    it('should handle invalid ids', async () => {
      mockQueryOne.mockResolvedValue(null);

      const resultNull = await repository.execute('');
      expect(resultNull.hasError).toBe(false);
    });
  });
});
