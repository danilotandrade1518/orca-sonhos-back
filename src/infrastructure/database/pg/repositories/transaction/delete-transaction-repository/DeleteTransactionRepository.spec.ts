import { RepositoryError } from '@application/shared/errors/RepositoryError';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import { DeleteTransactionRepository } from './DeleteTransactionRepository';

describe('DeleteTransactionRepository', () => {
  let repository: DeleteTransactionRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    repository = new DeleteTransactionRepository(mockConnection);
  });

  describe('execute', () => {
    it('should mark transaction as deleted', async () => {
      mockConnection.query.mockResolvedValue(null);
      const result = await repository.execute('id');
      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(expect.any(String), [
        'id',
      ]);
    });

    it('should be idempotent', async () => {
      mockConnection.query.mockResolvedValue(null);
      await repository.execute('id');
      await repository.execute('id');
      expect(mockConnection.query).toHaveBeenCalledTimes(2);
    });

    it('should return error on db failure', async () => {
      mockConnection.query.mockRejectedValue(new Error('db'));
      const result = await repository.execute('id');
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
