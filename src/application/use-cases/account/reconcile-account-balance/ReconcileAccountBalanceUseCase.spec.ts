import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountReconciledEvent } from '@domain/aggregates/account/events/AccountReconciledEvent';
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
import { ReconcileAccountBalanceDto } from './ReconcileAccountBalanceDto';
import { ReconcileAccountBalanceUseCase } from './ReconcileAccountBalanceUseCase';

describe('ReconcileAccountBalanceUseCase', () => {
  let useCase: ReconcileAccountBalanceUseCase;
  let getAccountRepositoryStub: GetAccountRepositoryStub;
  let saveAccountRepositoryStub: SaveAccountRepositoryStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let eventPublisherStub: EventPublisherStub;
  let mockAccount: Account;
  let budgetId: string;
  const userId = EntityId.create().value!.id;

  beforeEach(() => {
    getAccountRepositoryStub = new GetAccountRepositoryStub();
    saveAccountRepositoryStub = new SaveAccountRepositoryStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    eventPublisherStub = new EventPublisherStub();

    budgetId = EntityId.create().value!.id;
    const accountResult = Account.create({
      name: 'Acc',
      type: AccountTypeEnum.CHECKING_ACCOUNT,
      budgetId,
      initialBalance: 1000,
    });
    if (accountResult.hasError) throw new Error('setup error');
    mockAccount = accountResult.data!;
    mockAccount.clearEvents();
    getAccountRepositoryStub.mockAccount = mockAccount;

    useCase = new ReconcileAccountBalanceUseCase(
      getAccountRepositoryStub,
      saveAccountRepositoryStub,
      budgetAuthorizationServiceStub,
      eventPublisherStub,
    );
  });

  const validDto = (): ReconcileAccountBalanceDto => ({
    userId,
    accountId: mockAccount.id,
    newBalance: 1200,
    justification: 'Ajuste bancário',
  });

  describe('execute', () => {
    it('should reconcile account and publish event', async () => {
      const dto = validDto();

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(eventPublisherStub.publishManyCalls.length).toBe(1);
      const events = eventPublisherStub.publishManyCalls[0];
      expect(events[0]).toBeInstanceOf(AccountReconciledEvent);
    });

    it('should return error when account not found', async () => {
      getAccountRepositoryStub.shouldReturnNull = true;
      const dto = validDto();

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new AccountNotFoundError());
    });

    it('should return error when repository fails', async () => {
      getAccountRepositoryStub.shouldFail = true;
      const dto = validDto();

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new AccountRepositoryError());
    });

    it('should return error when user has no permission', async () => {
      budgetAuthorizationServiceStub.mockHasAccess = false;
      const dto = validDto();

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new InsufficientPermissionsError());
    });

    it('should return error when authorization service fails', async () => {
      budgetAuthorizationServiceStub.shouldFail = true;
      const dto = validDto();

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
    });

    it('should return error when reconcile data invalid', async () => {
      const dto = validDto();
      dto.justification = 'short';

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toBeInstanceOf(AccountUpdateFailedError);
    });

    it('should return error when persistence fails', async () => {
      saveAccountRepositoryStub.shouldFail = true;
      const dto = validDto();

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.errors[0]).toEqual(new AccountPersistenceFailedError());
    });

    it('should call repositories with correct params', async () => {
      const dto = validDto();

      await useCase.execute(dto);

      expect(getAccountRepositoryStub.executeCalls[0]).toBe(mockAccount.id);
      expect(saveAccountRepositoryStub.executeCalls[0].id).toBe(mockAccount.id);
    });
  });
});
