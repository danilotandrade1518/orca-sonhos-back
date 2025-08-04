import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';

import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { IReconcileAccountUnitOfWorkStub } from '../../../shared/tests/stubs/IReconcileAccountUnitOfWorkStub';
import { ReconcileAccountDto } from './ReconcileAccountDto';
import { ReconcileAccountUseCase } from './ReconcileAccountUseCase';

describe('ReconcileAccountUseCase', () => {
  let useCase: ReconcileAccountUseCase;
  let getAccountRepositoryStub: GetAccountRepositoryStub;
  let reconcileAccountRepositoryStub: IReconcileAccountUnitOfWorkStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let eventPublisherStub: EventPublisherStub;
  let account: Account;
  const userId = EntityId.create().value!.id;
  const adjustmentCategoryId = EntityId.create().value!.id;

  beforeEach(() => {
    getAccountRepositoryStub = new GetAccountRepositoryStub();
    reconcileAccountRepositoryStub = new IReconcileAccountUnitOfWorkStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    eventPublisherStub = new EventPublisherStub();
    useCase = new ReconcileAccountUseCase(
      getAccountRepositoryStub,
      reconcileAccountRepositoryStub,
      budgetAuthorizationServiceStub,
      eventPublisherStub,
      adjustmentCategoryId,
    );

    const result = Account.create({
      name: 'Conta',
      type: AccountTypeEnum.CHECKING_ACCOUNT,
      budgetId: EntityId.create().value!.id,
      initialBalance: 1000,
    });
    account = result.data!;
    getAccountRepositoryStub.mockAccount = account;
    budgetAuthorizationServiceStub.mockHasAccess = true;
  });

  it('should reconcile with positive difference', async () => {
    const dto: ReconcileAccountDto = {
      userId,
      budgetId: account.budgetId!,
      accountId: account.id,
      realBalance: 1500,
      justification: 'Deposito esquecido',
    };

    const result = await useCase.execute(dto);

    expect(result.hasData).toBe(true);
    expect(account.balance).toBe(1500);
    expect(reconcileAccountRepositoryStub.executeCalls).toHaveLength(1);
  });

  it('should reconcile with negative difference', async () => {
    const dto: ReconcileAccountDto = {
      userId,
      budgetId: account.budgetId!,
      accountId: account.id,
      realBalance: 800,
      justification: 'Tarifa bancária',
    };

    const result = await useCase.execute(dto);

    expect(result.hasData).toBe(true);
    expect(account.balance).toBe(800);
  });

  it('should return error when account not found', async () => {
    getAccountRepositoryStub.shouldReturnNull = true;
    const dto: ReconcileAccountDto = {
      userId,
      budgetId: account.budgetId!,
      accountId: EntityId.create().value!.id,
      realBalance: 1100,
      justification: 'Justificativa valida',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new AccountNotFoundError());
  });

  it('should return permission error', async () => {
    budgetAuthorizationServiceStub.mockHasAccess = false;
    const dto: ReconcileAccountDto = {
      userId,
      budgetId: account.budgetId!,
      accountId: account.id,
      realBalance: 1200,
      justification: 'Justificativa valida',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new InsufficientPermissionsError());
  });

  it('should return repository error on persistence fail', async () => {
    reconcileAccountRepositoryStub.shouldFail = true;
    const dto: ReconcileAccountDto = {
      userId,
      budgetId: account.budgetId!,
      accountId: account.id,
      realBalance: 1400,
      justification: 'Justificativa valida',
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new TransactionPersistenceFailedError());
  });
});
