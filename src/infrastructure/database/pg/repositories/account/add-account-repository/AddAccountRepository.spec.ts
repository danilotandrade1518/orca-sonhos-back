import { RepositoryError } from '@application/shared/errors/RepositoryError';
import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { PostgreSQLConnection } from '../../../connection/PostgreSQLConnection';
import {
  AccountMapper,
  AccountRow,
} from '../../../mappers/account/AccountMapper';
import { AddAccountRepository } from './AddAccountRepository';

jest.mock('../../../connection/PostgreSQLConnection');
jest.mock('../../../mappers/account/AccountMapper');

describe('AddAccountRepository', () => {
  let repository: AddAccountRepository;
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
    repository = new AddAccountRepository();
  });

  describe('execute', () => {
    it('should add account successfully', async () => {
      const budgetId = EntityId.create().value!.id;
      const account = Account.create({
        name: 'Acc',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
        initialBalance: 100,
      }).data!;
      const row = {
        id: account.id,
        name: account.name!,
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budget_id: budgetId,
        balance: '100',
        is_deleted: false,
        created_at: account.createdAt,
        updated_at: account.updatedAt,
      } as AccountRow;

      mockMapper.toRow.mockReturnValue(row);
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
        row.created_at,
        row.updated_at,
      ]);
    });

    it('should return error when account already exists', async () => {
      const budgetId = EntityId.create().value!.id;
      const account = Account.create({
        name: 'Acc',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
      }).data!;
      const constraintError = new Error('duplicate') as Error & {
        code?: string;
      };
      constraintError.code = '23505';

      mockMapper.toRow.mockReturnValue({} as AccountRow);
      mockQueryOne.mockRejectedValue(constraintError);

      const result = await repository.execute(account);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });

    it('should return error when database throws', async () => {
      const budgetId = EntityId.create().value!.id;
      const account = Account.create({
        name: 'Acc',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
      }).data!;
      mockMapper.toRow.mockReturnValue({} as AccountRow);
      mockQueryOne.mockRejectedValue(new Error('fail'));

      const result = await repository.execute(account);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(RepositoryError);
    });
  });
});
