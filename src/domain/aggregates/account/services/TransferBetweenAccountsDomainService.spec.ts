import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { AccountsFromDifferentBudgetsError } from '../errors/AccountsFromDifferentBudgetsError';
import { SameAccountTransferError } from '../errors/SameAccountTransferError';
import { TransferBetweenAccountsDomainService } from './TransferBetweenAccountsDomainService';

describe('TransferBetweenAccountsDomainService', () => {
  let domainService: TransferBetweenAccountsDomainService;
  const validBudgetId = EntityId.create().value!.id;
  const transferCategoryId = EntityId.create().value!.id;

  beforeEach(() => {
    domainService = new TransferBetweenAccountsDomainService();
  });

  describe('createTransferOperation', () => {
    it('should create transfer operation with proper transactions and events', () => {
      const fromAccount = Account.create({
        name: 'From Account',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: validBudgetId,
        initialBalance: 1000,
      }).data!;

      const toAccount = Account.create({
        name: 'To Account',
        type: AccountTypeEnum.SAVINGS_ACCOUNT,
        budgetId: validBudgetId,
        initialBalance: 500,
      }).data!;

      const result = domainService.createTransferOperation(
        fromAccount,
        toAccount,
        200,
        transferCategoryId,
      );

      if (result.hasError) {
        console.log('Domain Service errors:', result.errors);
      }

      expect(result.hasError).toBe(false);
      expect(result.data!.debitTransaction).toBeDefined();
      expect(result.data!.creditTransaction).toBeDefined();
      expect(result.data!.fromAccountEvent).toBeDefined();
      expect(result.data!.toAccountEvent).toBeDefined();
    });

    it('should return error when accounts belong to different budgets', async () => {
      const fromAccount = Account.create({
        name: 'From Account',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: validBudgetId,
        initialBalance: 1000,
      }).data!;

      const toAccount = Account.create({
        name: 'To Account',
        type: AccountTypeEnum.SAVINGS_ACCOUNT,
        budgetId: EntityId.create().value!.id, // Different budget
        initialBalance: 500,
      }).data!;

      const result = domainService.createTransferOperation(
        fromAccount,
        toAccount,
        200,
        transferCategoryId,
      );

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new AccountsFromDifferentBudgetsError());
    });

    it('should return error when transferring to the same account', async () => {
      const sameAccount = Account.create({
        name: 'From Account',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: validBudgetId,
        initialBalance: 1000,
      }).data!;

      const result = domainService.createTransferOperation(
        sameAccount,
        sameAccount,
        200,
        transferCategoryId,
      );

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new SameAccountTransferError());
    });

    it('should return error for invalid transfer amount', () => {
      const fromAccount = Account.create({
        name: 'From Account',
        type: AccountTypeEnum.CHECKING_ACCOUNT,
        budgetId: validBudgetId,
        initialBalance: 1000,
      }).data!;

      const toAccount = Account.create({
        name: 'To Account',
        type: AccountTypeEnum.SAVINGS_ACCOUNT,
        budgetId: validBudgetId,
        initialBalance: 500,
      }).data!;

      const result = domainService.createTransferOperation(
        fromAccount,
        toAccount,
        0, // Invalid amount
        transferCategoryId,
      );

      expect(result.hasError).toBe(true);
    });
  });
});
