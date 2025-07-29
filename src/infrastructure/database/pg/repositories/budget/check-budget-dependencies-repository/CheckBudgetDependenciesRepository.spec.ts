import { RepositoryError } from '@application/shared/errors/RepositoryError';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { CheckBudgetDependenciesRepository } from './CheckBudgetDependenciesRepository';

describe('CheckBudgetDependenciesRepository', () => {
  let repository: CheckBudgetDependenciesRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    repository = new CheckBudgetDependenciesRepository(mockConnection);
  });

  describe('hasAccounts', () => {
    it('should return true when budget has active accounts', async () => {
      mockConnection.queryOne.mockResolvedValue({ has_accounts: true });

      const result = await repository.hasAccounts('budget-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(true);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS'),
        ['budget-id'],
      );
    });

    it('should return false when budget has no accounts', async () => {
      mockConnection.queryOne.mockResolvedValue({ has_accounts: false });

      const result = await repository.hasAccounts('budget-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should ignore deleted accounts', async () => {
      mockConnection.queryOne.mockResolvedValue({ has_accounts: false });

      await repository.hasAccounts('budget-id');

      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        ['budget-id'],
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('db error');
      mockConnection.queryOne.mockRejectedValue(dbError);

      const result = await repository.hasAccounts('budget-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });

  describe('hasTransactions', () => {
    it('should return true when budget has active transactions', async () => {
      mockConnection.queryOne.mockResolvedValue({ has_transactions: true });

      const result = await repository.hasTransactions('budget-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(true);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS'),
        ['budget-id'],
      );
    });

    it('should return false when budget has no transactions', async () => {
      mockConnection.queryOne.mockResolvedValue({ has_transactions: false });

      const result = await repository.hasTransactions('budget-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should ignore deleted transactions', async () => {
      mockConnection.queryOne.mockResolvedValue({ has_transactions: false });

      await repository.hasTransactions('budget-id');

      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        ['budget-id'],
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('db error');
      mockConnection.queryOne.mockRejectedValue(dbError);

      const result = await repository.hasTransactions('budget-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
