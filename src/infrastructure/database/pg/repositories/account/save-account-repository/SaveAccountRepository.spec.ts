import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import {
  AccountMapper,
  AccountRow,
} from '../../../mappers/account/AccountMapper';
import { SaveAccountRepository } from './SaveAccountRepository';

jest.mock('../../../connection/PostgreSQLConnection');
jest.mock('../../../mappers/account/AccountMapper');

describe('SaveAccountRepository', () => {
  let repository: SaveAccountRepository;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let mockQueryOne: jest.MockedFunction<any>;
  let mockMapper: jest.Mocked<typeof AccountMapper>;

  beforeEach(() => {
    jest.clearAllMocks();
    mockQueryOne = jest.fn();
    mockMapper = AccountMapper as jest.Mocked<typeof AccountMapper>;
    (PostgreSQLConnection.getInstance as jest.Mock).mockReturnValue({
      queryOne: mockQueryOne,
    });
    repository = new SaveAccountRepository();
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
      mockQueryOne.mockResolvedValue(null);

      const result = await repository.execute(account);

      expect(result.hasError).toBe(false);
      expect(mockQueryOne).toHaveBeenCalledWith(expect.any(String), [
        row.id,
        row.name,
        row.type,
        row.budget_id,
        row.balance,
        row.is_deleted,
        expect.any(Date), // updated_at é atualizado dinamicamente
      ]);
    });

    it('should update existing account', async () => {
      mockMapper.toRow.mockReturnValue({ ...row });
      mockQueryOne.mockResolvedValue(null);

      await repository.execute(account);

      expect(mockQueryOne.mock.calls[0][0]).toContain('UPDATE accounts SET');
      expect(mockQueryOne.mock.calls[0][0]).toContain('WHERE id = $1');
    });

    it('should return error when database query fails', async () => {
      mockMapper.toRow.mockReturnValue({ ...row });
      const dbErr = new Error('db');
      mockQueryOne.mockRejectedValue(dbErr);

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
      expect(result.errors[0].message).toContain('Failed to map account');
    });
  });
});
