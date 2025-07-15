import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountUpdatedEvent } from '@domain/aggregates/account/events/AccountUpdatedEvent';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountPersistenceFailedError } from '../../../shared/errors/AccountPersistenceFailedError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { AccountUpdateFailedError } from '../../../shared/errors/AccountUpdateFailedError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { SaveAccountRepositoryStub } from '../../../shared/tests/stubs/SaveAccountRepositoryStub';
import { UpdateAccountDto } from './UpdateAccountDto';
import { UpdateAccountUseCase } from './UpdateAccountUseCase';

describe('UpdateAccountUseCase', () => {
  let useCase: UpdateAccountUseCase;
  let getAccountRepositoryStub: GetAccountRepositoryStub;
  let saveAccountRepositoryStub: SaveAccountRepositoryStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let eventPublisherStub: EventPublisherStub;
  let mockAccount: Account;
  let budgetId: string;

  beforeEach(() => {
    getAccountRepositoryStub = new GetAccountRepositoryStub();
    saveAccountRepositoryStub = new SaveAccountRepositoryStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    eventPublisherStub = new EventPublisherStub();

    budgetId = EntityId.create().value!.id;

    const accountResult = Account.create({
      name: 'Original Account',
      type: AccountTypeEnum.CHECKING_ACCOUNT,
      budgetId,
      initialBalance: 1000,
      description: 'Original description',
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

    useCase = new UpdateAccountUseCase(
      getAccountRepositoryStub,
      saveAccountRepositoryStub,
      budgetAuthorizationServiceStub,
      eventPublisherStub,
    );
  });

  describe('execute', () => {
    it('should update account name successfully', async () => {
      const dto: UpdateAccountDto = {
        id: mockAccount.id,
        userId: 'authorized-user',
        name: 'Updated Account Name',
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(mockAccount.id);
    });

    it('should update account description successfully', async () => {
      const dto: UpdateAccountDto = {
        id: mockAccount.id,
        userId: 'authorized-user',
        description: 'Updated description',
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(mockAccount.id);
    });

    it('should update account initial balance and emit event', async () => {
      const dto: UpdateAccountDto = {
        id: mockAccount.id,
        userId: 'authorized-user',
        initialBalance: 2000,
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBe(mockAccount.id);
      expect(eventPublisherStub.publishManyCalls).toHaveLength(1);

      const events = eventPublisherStub.publishManyCalls[0];
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AccountUpdatedEvent);

      const event = events[0] as AccountUpdatedEvent;
      expect(event.aggregateId).toBe(mockAccount.id);
      expect(event.budgetId).toBe(budgetId);
      expect(event.previousInitialBalance).toBe(1000);
      expect(event.newInitialBalance).toBe(2000);
    });

    it('should update multiple fields and emit single event', async () => {
      const dto: UpdateAccountDto = {
        id: mockAccount.id,
        userId: 'authorized-user',
        name: 'New Name',
        initialBalance: 1500,
        description: 'New description',
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(eventPublisherStub.publishManyCalls).toHaveLength(1);

      const events = eventPublisherStub.publishManyCalls[0];
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(AccountUpdatedEvent);

      const event = events[0] as AccountUpdatedEvent;
      expect(event.previousName).toBe('Original Account');
      expect(event.newName).toBe('New Name');
      expect(event.previousInitialBalance).toBe(1000);
      expect(event.newInitialBalance).toBe(1500);
    });

    it('should not emit events when only description changes', async () => {
      const dto: UpdateAccountDto = {
        id: mockAccount.id,
        userId: 'authorized-user',
        description: 'Only description change',
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(eventPublisherStub.publishManyCalls).toHaveLength(0);
    });

    it('should return account id after successful update', async () => {
      const dto: UpdateAccountDto = {
        id: mockAccount.id,
        userId: 'authorized-user',
        name: 'Updated Name',
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.data!.id).toBe(mockAccount.id);
    });

    it('should return error when user has no permission', async () => {
      budgetAuthorizationServiceStub.mockHasAccess = false;

      const dto: UpdateAccountDto = {
        id: mockAccount.id,
        userId: 'unauthorized-user',
        name: 'Updated Name',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(InsufficientPermissionsError);
      expect(saveAccountRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should return error when budget authorization service fails', async () => {
      budgetAuthorizationServiceStub.shouldFail = true;

      const dto: UpdateAccountDto = {
        id: mockAccount.id,
        userId: 'authorized-user',
        name: 'Updated Name',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(saveAccountRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should call budgetAuthorizationService with correct parameters', async () => {
      const dto: UpdateAccountDto = {
        id: mockAccount.id,
        userId: 'test-user',
        name: 'Updated Name',
      };

      await useCase.execute(dto);

      expect(budgetAuthorizationServiceStub.canAccessBudgetCalls).toHaveLength(
        1,
      );
      expect(budgetAuthorizationServiceStub.canAccessBudgetCalls[0]).toEqual({
        userId: 'test-user',
        budgetId: budgetId,
      });
    });

    it('should return error when account not found', async () => {
      getAccountRepositoryStub.shouldReturnNull = true;

      const dto: UpdateAccountDto = {
        id: 'non-existent-id',
        userId: 'authorized-user',
        name: 'Updated Name',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(AccountNotFoundError);
      expect(saveAccountRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should return error when update data is invalid', async () => {
      const dto: UpdateAccountDto = {
        id: mockAccount.id,
        userId: 'authorized-user',
        name: '', // Invalid empty name
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(AccountUpdateFailedError);
      expect(saveAccountRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should return error when getAccount repository fails', async () => {
      getAccountRepositoryStub.shouldFail = true;

      const dto: UpdateAccountDto = {
        id: mockAccount.id,
        userId: 'authorized-user',
        name: 'Updated Name',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(AccountRepositoryError);
      expect(saveAccountRepositoryStub.executeCalls).toHaveLength(0);
    });

    it('should return error when saveAccount repository fails', async () => {
      saveAccountRepositoryStub.shouldFail = true;

      const dto: UpdateAccountDto = {
        id: mockAccount.id,
        userId: 'authorized-user',
        name: 'Updated Name',
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(AccountPersistenceFailedError);
    });

    it('should call repositories with correct parameters', async () => {
      const dto: UpdateAccountDto = {
        id: mockAccount.id,
        userId: 'authorized-user',
        name: 'Updated Name',
      };

      await useCase.execute(dto);

      expect(getAccountRepositoryStub.executeCalls).toHaveLength(1);
      expect(getAccountRepositoryStub.executeCalls[0]).toBe(mockAccount.id);

      expect(saveAccountRepositoryStub.executeCalls).toHaveLength(1);
      expect(saveAccountRepositoryStub.executeCalls[0].id).toBe(mockAccount.id);
    });
  });
});
