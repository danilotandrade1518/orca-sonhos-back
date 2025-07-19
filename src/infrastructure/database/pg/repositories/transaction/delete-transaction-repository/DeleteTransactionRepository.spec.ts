import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import { DeleteTransactionRepository } from './DeleteTransactionRepository';

jest.mock('../../../connection/PostgreSQLConnection');

describe('DeleteTransactionRepository', () => {
  let repository: DeleteTransactionRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQueryOne: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryOne = jest.fn();
    (PostgreSQLConnection.getInstance as jest.Mock).mockReturnValue({
      queryOne: mockQueryOne,
    });
    repository = new DeleteTransactionRepository();
  });

  describe('execute', () => {
    it('should mark transaction as deleted', async () => {
      mockQueryOne.mockResolvedValue(null);
      const result = await repository.execute('id');
      expect(result.hasError).toBe(false);
      expect(mockQueryOne).toHaveBeenCalledWith(expect.any(String), ['id']);
    });

    it('should be idempotent', async () => {
      mockQueryOne.mockResolvedValue(null);
      await repository.execute('id');
      await repository.execute('id');
      expect(mockQueryOne).toHaveBeenCalledTimes(2);
    });

    it('should return error on db failure', async () => {
      mockQueryOne.mockRejectedValue(new Error('db'));
      const result = await repository.execute('id');
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
