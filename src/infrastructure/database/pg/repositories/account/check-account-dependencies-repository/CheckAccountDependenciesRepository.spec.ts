import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import { CheckAccountDependenciesRepository } from './CheckAccountDependenciesRepository';

jest.mock('../../../connection/PostgreSQLConnection');

describe('CheckAccountDependenciesRepository', () => {
  let repository: CheckAccountDependenciesRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQueryOne: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryOne = jest.fn();
    (PostgreSQLConnection.getInstance as jest.Mock).mockReturnValue({
      queryOne: mockQueryOne,
    });
    repository = new CheckAccountDependenciesRepository();
  });

  describe('hasTransactions', () => {
    it('should return true when account has transactions', async () => {
      mockQueryOne.mockResolvedValue({ has_transactions: true });

      const result = await repository.hasTransactions('acc-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(true);
      expect(mockQueryOne).toHaveBeenCalledWith(expect.any(String), ['acc-id']);
    });

    it('should return false when account has no transactions', async () => {
      mockQueryOne.mockResolvedValue({ has_transactions: false });

      const result = await repository.hasTransactions('acc-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(false);
    });

    it('should ignore deleted transactions', async () => {
      mockQueryOne.mockResolvedValue({ has_transactions: false });

      await repository.hasTransactions('acc-id');

      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        ['acc-id'],
      );
    });

    it('should handle database errors', async () => {
      mockQueryOne.mockRejectedValue(new Error('db'));

      const result = await repository.hasTransactions('acc-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
