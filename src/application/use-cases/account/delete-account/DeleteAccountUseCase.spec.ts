import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountDeletedEvent } from '@domain/aggregates/account/events/AccountDeletedEvent';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { CannotDeleteAccountWithTransactionsError } from '../../../shared/errors/CannotDeleteAccountWithTransactionsError';
import { AccountDeletionFailedError } from '../../../shared/errors/AccountDeletionFailedError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { CheckAccountDependenciesRepositoryStub } from '../../../shared/tests/stubs/CheckAccountDependenciesRepositoryStub';
import { DeleteAccountRepositoryStub } from '../../../shared/tests/stubs/DeleteAccountRepositoryStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { DeleteAccountDto } from './DeleteAccountDto';
import { DeleteAccountUseCase } from './DeleteAccountUseCase';

describe('DeleteAccountUseCase', () => {
  let useCase: DeleteAccountUseCase;
  let getAccountRepositoryStub: GetAccountRepositoryStub;
  let deleteAccountRepositoryStub: DeleteAccountRepositoryStub;
  let checkAccountDependenciesRepositoryStub: CheckAccountDependenciesRepositoryStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let eventPublisherStub: EventPublisherStub;
  let mockAccount: Account;

  beforeEach(() => {
    getAccountRepositoryStub = new GetAccountRepositoryStub();
    deleteAccountRepositoryStub = new DeleteAccountRepositoryStub();
    checkAccountDependenciesRepositoryStub =
      new CheckAccountDependenciesRepositoryStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    eventPublisherStub = new EventPublisherStub();

    const accountResult = Account.create({
      name: 'Test Account',
      type: AccountTypeEnum.CHECKING_ACCOUNT,
      budgetId: EntityId.create().value!.id,
      initialBalance: 100,
    });

    if (accountResult.hasError) {
      throw new Error(
        `Failed to create account: ${accountResult.errors.map((e) => e.message).join(', ')}`,
      );
    }

    mockAccount = accountResult.data!;
    mockAccount.clearEvents();
    getAccountRepositoryStub.mockAccount = mockAccount;
    budgetAuthorizationServiceStub.mockHasAccess = true;

    useCase = new DeleteAccountUseCase(
      getAccountRepositoryStub,
      deleteAccountRepositoryStub,
      checkAccountDependenciesRepositoryStub,
      budgetAuthorizationServiceStub,
      eventPublisherStub,
    );
  });

  describe('execute', () => {
    it('should delete account successfully when user has permission and no transactions', async () => {
      const dto: DeleteAccountDto = {
        accountId: mockAccount.id,
        userId: 'authorized-user',
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.data).toEqual({ id: mockAccount.id });
      expect(deleteAccountRepositoryStub.executeCalls).toContain(
        mockAccount.id,
      );
      expect(eventPublisherStub.publishManyCalls).toHaveLength(1);
      expect(eventPublisherStub.publishManyCalls[0][0]).toBeInstanceOf(
        AccountDeletedEvent,
      );
    });

    it('should return error when account not found', async () => {
      getAccountRepositoryStub.shouldReturnNull = true;

      const dto: DeleteAccountDto = {
        accountId: 'non-existent',
        userId: 'user',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(AccountNotFoundError);
    });

    it('should return error when user has no permission', async () => {
      budgetAuthorizationServiceStub.mockHasAccess = false;

      const dto: DeleteAccountDto = {
        accountId: mockAccount.id,
        userId: 'unauthorized',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
      expect(deleteAccountRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should return error when account has transactions', async () => {
      checkAccountDependenciesRepositoryStub.mockHasTransactions = true;

      const dto: DeleteAccountDto = {
        accountId: mockAccount.id,
        userId: 'authorized-user',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(
        CannotDeleteAccountWithTransactionsError,
      );
      expect(deleteAccountRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should return error when get account repository fails', async () => {
      getAccountRepositoryStub.shouldFail = true;

      const dto: DeleteAccountDto = {
        accountId: mockAccount.id,
        userId: 'user',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(AccountRepositoryError);
    });

    it('should return error when delete account repository fails', async () => {
      deleteAccountRepositoryStub.shouldFail = true;

      const dto: DeleteAccountDto = {
        accountId: mockAccount.id,
        userId: 'authorized-user',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(AccountDeletionFailedError);
    });

    it('should return error when check dependencies repository fails', async () => {
      checkAccountDependenciesRepositoryStub.shouldFail = true;

      const dto: DeleteAccountDto = {
        accountId: mockAccount.id,
        userId: 'authorized-user',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(AccountRepositoryError);
    });

    it('should return error when authorization service fails', async () => {
      budgetAuthorizationServiceStub.shouldFail = true;

      const dto: DeleteAccountDto = {
        accountId: mockAccount.id,
        userId: 'user',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(deleteAccountRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should call services with correct parameters', async () => {
      const dto: DeleteAccountDto = {
        accountId: mockAccount.id,
        userId: 'test-user',
      };

      await useCase.execute(dto);

      expect(getAccountRepositoryStub.executeCalls).toContain(mockAccount.id);
      expect(
        checkAccountDependenciesRepositoryStub.hasTransactionsCalls,
      ).toContain(mockAccount.id);
      expect(deleteAccountRepositoryStub.executeCalls).toContain(
        mockAccount.id,
      );
      expect(budgetAuthorizationServiceStub.canAccessBudgetCalls[0]).toEqual({
        userId: 'test-user',
        budgetId: mockAccount.budgetId!,
      });
    });

    it('should handle event publishing errors gracefully', async () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      jest
        .spyOn(eventPublisherStub, 'publishMany')
        .mockRejectedValueOnce(new Error('publish error'));

      const dto: DeleteAccountDto = {
        accountId: mockAccount.id,
        userId: 'authorized-user',
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);

      consoleSpy.mockRestore();
    });
  });
});
