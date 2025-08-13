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
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    repository = new CheckBudgetDependenciesRepository(mockConnection);
  });

  describe('hasAccounts', () => {
    it('should return true when budget has active accounts', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ has_accounts: true }],
        rowCount: 1,
      });

      const result = await repository.hasAccounts('budget-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(true);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS'),
        ['budget-id'],
      );
    });

    it('should return false when budget has no accounts', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ has_accounts: false }],
        rowCount: 1,
      });

      const result = await repository.hasAccounts('budget-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should ignore deleted accounts', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ has_accounts: false }],
        rowCount: 1,
      });

      await repository.hasAccounts('budget-id');

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        ['budget-id'],
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('db error');
      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.hasAccounts('budget-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });

  describe('hasTransactions', () => {
    it('should return true when budget has active transactions', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ has_transactions: true }],
        rowCount: 1,
      });

      const result = await repository.hasTransactions('budget-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(true);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS'),
        ['budget-id'],
      );
    });

    it('should return false when budget has no transactions', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ has_transactions: false }],
        rowCount: 1,
      });

      const result = await repository.hasTransactions('budget-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should ignore deleted transactions', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ has_transactions: false }],
        rowCount: 1,
      });

      await repository.hasTransactions('budget-id');

      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        ['budget-id'],
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('db error');
      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.hasTransactions('budget-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
