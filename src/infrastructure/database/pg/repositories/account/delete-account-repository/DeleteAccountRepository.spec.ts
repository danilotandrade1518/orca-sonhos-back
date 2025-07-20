import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { DeleteAccountRepository } from './DeleteAccountRepository';

describe('DeleteAccountRepository', () => {
  let repository: DeleteAccountRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(),
      healthCheck: jest.fn(),
      close: jest.fn(),
      getPoolSize: jest.fn(),
      getIdleCount: jest.fn(),
      getWaitingCount: jest.fn(),
    };

    repository = new DeleteAccountRepository(mockConnection);
  });

  describe('execute', () => {
    it('should mark account as deleted successfully', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute('acc-id');

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(expect.any(String), [
        'acc-id',
      ]);
    });

    it('should be idempotent', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      const first = await repository.execute('acc-id');
      const second = await repository.execute('acc-id');

      expect(first.hasError).toBe(false);
      expect(second.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledTimes(2);
    });

    it('should not fail when account already deleted', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute('acc-id');

      expect(result.hasError).toBe(false);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE accounts'),
        ['acc-id'],
      );
    });

    it('should return error when database query fails', async () => {
      const err = new Error('db');
      mockConnection.queryOne.mockRejectedValue(err);

      const result = await repository.execute('acc-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
