import { RepositoryError } from '../../../../../../application/shared/errors/RepositoryError';
import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import { CheckBudgetDependenciesRepository } from './CheckBudgetDependenciesRepository';

jest.mock('../../../connection/PostgreSQLConnection');

describe('CheckBudgetDependenciesRepository', () => {
  let repository: CheckBudgetDependenciesRepository;
  let mockQueryOne: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryOne = jest.fn();

    (PostgreSQLConnection.getInstance as jest.Mock).mockReturnValue({
      queryOne: mockQueryOne,
    });

    repository = new CheckBudgetDependenciesRepository();
  });

  describe('hasAccounts', () => {
    it('should return true when budget has active accounts', async () => {
      mockQueryOne.mockResolvedValue({ has_accounts: true });

      const result = await repository.hasAccounts('budget-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(true);
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS'),
        ['budget-id'],
      );
    });

    it('should return false when budget has no accounts', async () => {
      mockQueryOne.mockResolvedValue({ has_accounts: false });

      const result = await repository.hasAccounts('budget-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should ignore deleted accounts', async () => {
      mockQueryOne.mockResolvedValue({ has_accounts: false });

      await repository.hasAccounts('budget-id');

      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        ['budget-id'],
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('db error');
      mockQueryOne.mockRejectedValue(dbError);

      const result = await repository.hasAccounts('budget-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });

  describe('hasTransactions', () => {
    it('should return true when budget has active transactions', async () => {
      mockQueryOne.mockResolvedValue({ has_transactions: true });

      const result = await repository.hasTransactions('budget-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(true);
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('EXISTS'),
        ['budget-id'],
      );
    });

    it('should return false when budget has no transactions', async () => {
      mockQueryOne.mockResolvedValue({ has_transactions: false });

      const result = await repository.hasTransactions('budget-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should ignore deleted transactions', async () => {
      mockQueryOne.mockResolvedValue({ has_transactions: false });

      await repository.hasTransactions('budget-id');

      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        ['budget-id'],
      );
    });

    it('should handle database errors', async () => {
      const dbError = new Error('db error');
      mockQueryOne.mockRejectedValue(dbError);

      const result = await repository.hasTransactions('budget-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
