import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { AccountMapper, AccountRow } from './AccountMapper';

describe('AccountMapper', () => {
  describe('toDomain', () => {
    it('should convert valid row to Account entity', () => {
      const id = EntityId.create().value!.id;
      const budgetId = EntityId.create().value!.id;

      const row: AccountRow = {
        id,
        name: 'Test Account',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budget_id: budgetId,
        balance: '1000',
        is_deleted: false,
        created_at: new Date('2023-01-01'),
        updated_at: new Date('2023-01-02'),
      };

      const result = AccountMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      const account = result.data!;
      expect(account.id).toBe(id);
      expect(account.name).toBe('Test Account');
      expect(account.type).toBe(AccountTypeEnum.CHECKING_ACCOUNT);
      expect(account.budgetId).toBe(budgetId);
      expect(account.balance).toBe(1000);
      expect(account.isDeleted).toBe(false);
      expect(account.createdAt).toEqual(new Date('2023-01-01'));
      expect(account.updatedAt).toEqual(new Date('2023-01-02'));
    });

    it('should convert deleted account', () => {
      const id = EntityId.create().value!.id;
      const budgetId = EntityId.create().value!.id;

      const row: AccountRow = {
        id,
        name: 'Deleted',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budget_id: budgetId,
        balance: '0',
        is_deleted: true,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = AccountMapper.toDomain(row);

      expect(result.hasError).toBe(false);
      expect(result.data!.isDeleted).toBe(true);
    });

    it('should return error with invalid name', () => {
      const id = EntityId.create().value!.id;

      const row: AccountRow = {
        id,
        name: '',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budget_id: EntityId.create().value!.id,
        balance: '0',
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = AccountMapper.toDomain(row);

      expect(result.hasError).toBe(true);
    });

    it('should return error with invalid type', () => {
      const id = EntityId.create().value!.id;

      const row: AccountRow = {
        id,
        name: 'Valid Name',
        type: 'INVALID',
        budget_id: EntityId.create().value!.id,
        balance: '0',
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = AccountMapper.toDomain(row);

      expect(result.hasError).toBe(true);
    });

    it('should return error with invalid id', () => {
      const row: AccountRow = {
        id: '',
        name: 'Name',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budget_id: EntityId.create().value!.id,
        balance: '0',
        is_deleted: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const result = AccountMapper.toDomain(row);

      expect(result.hasError).toBe(true);
    });
  });

  describe('toRow', () => {
    it('should convert Account entity to row', () => {
      const budgetId = EntityId.create().value!.id;
      const account = Account.create({
        name: 'Account',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId,
        initialBalance: 500,
      }).data!;

      const row = AccountMapper.toRow(account);

      expect(row.id).toBe(account.id);
      expect(row.name).toBe('Account');
      expect(row.type).toBe(AccountTypeEnum.CHECKING_ACCOUNT);
      expect(row.budget_id).toBe(budgetId);
      expect(row.balance).toBe('500');
      expect(row.is_deleted).toBe(false);
      expect(row.created_at).toEqual(account.createdAt);
      expect(row.updated_at).toEqual(account.updatedAt);
    });
  });
});
