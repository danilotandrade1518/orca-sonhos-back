import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  AccountMapper,
  AccountRow,
} from '../../../mappers/account/AccountMapper';
import { SaveAccountRepository } from './SaveAccountRepository';

jest.mock('../../../mappers/account/AccountMapper');

describe('SaveAccountRepository', () => {
  let repository: SaveAccountRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockMapper: jest.Mocked<typeof AccountMapper>;
  let mockClient: jest.Mocked<{ query: jest.Mock; release: jest.Mock }>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockClient = {
      query: jest.fn(),
      release: jest.fn(),
    };

    mockConnection = {
      query: jest.fn(),
      queryOne: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn().mockResolvedValue(mockClient),
    };

    mockMapper = AccountMapper as jest.Mocked<typeof AccountMapper>;
    repository = new SaveAccountRepository(mockConnection);
  });

  describe('execute', () => {
    const budgetId = EntityId.create().value!.id;
    const account = Account.create({
      name: 'Acc',
      type: AccountTypeEnum.CHECKING_ACCOUNT,
      budgetId,
      initialBalance: 500,
    }).data!;

    const row: AccountRow = {
      id: account.id,
      name: account.name!,
      type: AccountTypeEnum.CHECKING_ACCOUNT,
      budget_id: budgetId,
      balance: '500',
      is_deleted: false,
      created_at: account.createdAt,
      updated_at: account.updatedAt,
    };

    it('should update account successfully', async () => {
      mockMapper.toRow.mockReturnValue({ ...row });

      const result = await repository.execute(account);
      expect(result.hasError).toBe(false);
      expect(mockClient.query).toHaveBeenCalledWith(expect.any(String), [
        row.id,
        row.name,
        row.type,
        row.budget_id,
        row.balance,
        row.is_deleted,
        row.updated_at,
      ]);
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should update existing account', async () => {
      mockMapper.toRow.mockReturnValue({ ...row });

      await repository.execute(account);
      const query = mockClient.query.mock.calls[0][0];
      expect(query).toContain('UPDATE accounts SET');
      expect(query).toContain('WHERE id = $1');
    });

    it('should call UPDATE with correct parameters', async () => {
      mockMapper.toRow.mockReturnValue({ ...row });

      await repository.execute(account);
      const params = mockClient.query.mock.calls[0][1];
      expect(params).toEqual([
        row.id,
        row.name,
        row.type,
        row.budget_id,
        row.balance,
        row.is_deleted,
        row.updated_at,
      ]);
    });

    it('should return error when database query fails', async () => {
      mockMapper.toRow.mockReturnValue({ ...row });
      const dbErr = new Error('db');
      mockClient.query.mockRejectedValue(dbErr);

      const result = await repository.execute(account);
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('should return error when mapping fails', async () => {
      mockMapper.toRow.mockImplementation(() => {
        throw new Error('map');
      });

      const result = await repository.execute(account);
      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to save account');
    });
  });
});
