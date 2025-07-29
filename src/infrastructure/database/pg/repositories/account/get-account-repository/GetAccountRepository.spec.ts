import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { DomainError } from '@domain/shared/DomainError';
import { Either } from '@either';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  AccountMapper,
  AccountRow,
} from '../../../mappers/account/AccountMapper';
import { GetAccountRepository } from './GetAccountRepository';

jest.mock('../../../mappers/account/AccountMapper');

describe('GetAccountRepository', () => {
  let repository: GetAccountRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockMapper: jest.Mocked<typeof AccountMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    mockMapper = AccountMapper as jest.Mocked<typeof AccountMapper>;
    repository = new GetAccountRepository(mockConnection);
  });

  describe('execute', () => {
    const validRow: AccountRow = {
      id: 'acc-id',
      name: 'Acc',
      type: 'CHECKING_ACCOUNT',
      budget_id: 'bud-id',
      balance: '1000',
      is_deleted: false,
      created_at: new Date('2023-01-01'),
      updated_at: new Date('2023-01-02'),
    };

    it('should return account when found', async () => {
      const account = {} as Account;
      mockConnection.queryOne.mockResolvedValue(validRow);
      mockMapper.toDomain.mockReturnValue(Either.success(account));

      const result = await repository.execute('acc-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBe(account);
      expect(mockConnection.queryOne).toHaveBeenCalledWith(expect.any(String), [
        'acc-id',
      ]);
      expect(mockMapper.toDomain).toHaveBeenCalledWith(validRow);
    });

    it('should return null when account not found', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      const result = await repository.execute('acc-id');

      expect(result.hasError).toBe(false);
      expect(result.data).toBeNull();
      expect(mockMapper.toDomain).not.toHaveBeenCalled();
    });

    it('should filter deleted accounts', async () => {
      mockConnection.queryOne.mockResolvedValue(null);

      await repository.execute('acc-id');

      expect(mockConnection.queryOne).toHaveBeenCalledWith(
        expect.stringContaining('is_deleted = false'),
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

    it('should return error when mapping fails', async () => {
      mockConnection.queryOne.mockResolvedValue(validRow);
      mockMapper.toDomain.mockReturnValue(
        Either.error(new Error('map') as unknown as DomainError),
      );

      const result = await repository.execute('acc-id');

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
