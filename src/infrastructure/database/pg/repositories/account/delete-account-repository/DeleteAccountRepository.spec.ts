import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import { DeleteAccountRepository } from './DeleteAccountRepository';

jest.mock('../../../connection/PostgreSQLConnection');

describe('DeleteAccountRepository', () => {
  let repository: DeleteAccountRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQueryOne: jest.MockedFunction<any>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryOne = jest.fn();
    (PostgreSQLConnection.getInstance as jest.Mock).mockReturnValue({
      queryOne: mockQueryOne,
    });
    repository = new DeleteAccountRepository();
  });

  describe('execute', () => {
    it('should mark account as deleted successfully', async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await repository.execute('acc-id');

      expect(result.hasError).toBe(false);
      expect(mockQueryOne).toHaveBeenCalledWith(expect.any(String), ['acc-id']);
    });

    it('should be idempotent', async () => {
      mockQueryOne.mockResolvedValue(null);

      const first = await repository.execute('acc-id');
      const second = await repository.execute('acc-id');

      expect(first.hasError).toBe(false);
      expect(second.hasError).toBe(false);
      expect(mockQueryOne).toHaveBeenCalledTimes(2);
    });

    it('should not fail when account already deleted', async () => {
      mockQueryOne.mockResolvedValue(null);

      const result = await repository.execute('acc-id');

      expect(result.hasError).toBe(false);
      expect(mockQueryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
        ['acc-id'],
      );
    });

    it('should return error when database query fails', async () => {
      mockQueryOne.mockRejectedValue(new Error('fail'));

      const result = await repository.execute('acc-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
