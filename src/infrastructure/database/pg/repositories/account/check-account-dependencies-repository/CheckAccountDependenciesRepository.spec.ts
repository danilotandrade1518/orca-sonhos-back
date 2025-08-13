import { RepositoryError } from '@application/shared/errors/RepositoryError';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { CheckAccountDependenciesRepository } from './CheckAccountDependenciesRepository';

describe('CheckAccountDependenciesRepository', () => {
  let repository: CheckAccountDependenciesRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    repository = new CheckAccountDependenciesRepository(mockConnection);
  });

  describe('hasTransactions', () => {
    it('should return true when account has transactions', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ has_transactions: true }],
        rowCount: 1,
      });

      const result = await repository.hasTransactions('acc-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(true);
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [
        'acc-id',
      ]);
    });

    it('should return false when account has no transactions', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ has_transactions: false }],
        rowCount: 1,
      });

      const result = await repository.hasTransactions('acc-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should ignore deleted transactions', async () => {
      await repository.hasTransactions('acc-id');

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        ['acc-id'],
      );
    });

    it('should handle database errors', async () => {
      const err = new Error('db');
      mockConnection.query.mockRejectedValue(err);

      const result = await repository.hasTransactions('acc-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
