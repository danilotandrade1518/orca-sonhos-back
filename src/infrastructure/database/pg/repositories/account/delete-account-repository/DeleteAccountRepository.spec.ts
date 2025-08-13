import { RepositoryError } from '@application/shared/errors/RepositoryError';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { DeleteAccountRepository } from './DeleteAccountRepository';

describe('DeleteAccountRepository', () => {
  let repository: DeleteAccountRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();

    const mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn().mockResolvedValue(mockClient),
    };

    repository = new DeleteAccountRepository(mockConnection);
  });

  describe('execute', () => {
    it('should mark account as deleted successfully', async () => {
      const result = await repository.execute('acc-id');

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [
        'acc-id',
      ]);
    });

    it('should be idempotent', async () => {
      const first = await repository.execute('acc-id');
      const second = await repository.execute('acc-id');

      expect(first.hasError).toBe(false);
      expect(second.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledTimes(2);
    });

    it('should not fail when account already deleted', async () => {
      const result = await repository.execute('acc-id');

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE accounts'),
        ['acc-id'],
      );
    });

    it('should return error when database query fails', async () => {
      const err = new Error('db');
      mockConnection.query.mockRejectedValue(err);

      const result = await repository.execute('acc-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
