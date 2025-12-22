import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { IPostgresConnectionAdapter } from '../../../../../adapters/IPostgresConnectionAdapter';
import {
  AccountMapper,
  AccountRow,
} from '../../../mappers/account/AccountMapper';
import { AddAccountRepository } from './AddAccountRepository';

jest.mock('../../../mappers/account/AccountMapper');

describe('AddAccountRepository', () => {
  let repository: AddAccountRepository;
  let mockConnection: jest.Mocked<IPostgresConnectionAdapter>;
  let mockAccountMapper: jest.Mocked<typeof AccountMapper>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockConnection = {
      query: jest.fn(),
      transaction: jest.fn(),
      getClient: jest.fn(),
    };

    mockAccountMapper = AccountMapper as jest.Mocked<typeof AccountMapper>;
    repository = new AddAccountRepository(mockConnection);
  });

  describe('execute', () => {
    it('should add account successfully', async () => {
      const budgetId = EntityId.create().value!.id;
      const accountResult = Account.create({
        name: 'Test Account',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
        initialBalance: 1000,
      });

      const account = accountResult.data!;

      const mockRow: AccountRow = {
        id: account.id,
        name: account.name || 'Test Account',
        type: account.type || AccountTypeEnum.CHECKING_ACCOUNT,
        budget_id: account.budgetId || budgetId,
        balance: account.balance?.toString() || '1000',
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAccountMapper.toRow.mockReturnValue(mockRow);

      const result = await repository.execute(account);

      expect(result.hasError).toBe(false);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO accounts'),
        expect.arrayContaining([
          account.id,
          'Test Account',
          AccountTypeEnum.CHECKING_ACCOUNT,
          budgetId,
          '1000',
        ]),
      );
    });

    it('should return error when database operation fails', async () => {
      const budgetId = EntityId.create().value!.id;
      const accountResult = Account.create({
        name: 'Test Account',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
        initialBalance: 1000,
      });

      const account = accountResult.data!;

      const mockRow: AccountRow = {
        id: account.id,
        name: account.name || 'Test Account',
        type: account.type || AccountTypeEnum.CHECKING_ACCOUNT,
        budget_id: account.budgetId || budgetId,
        balance: account.balance?.toString() || '1000',
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      mockAccountMapper.toRow.mockReturnValue(mockRow);

      const dbError = new Error('Database connection failed');
      mockConnection.query.mockRejectedValue(dbError);

      const result = await repository.execute(account);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
      expect(result.errors[0].message).toContain('Failed to add account');
    });
  });
});
