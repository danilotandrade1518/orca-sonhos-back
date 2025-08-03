import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { Category } from '@domain/aggregates/category/category-entity/Category';
import { CategoryTypeEnum } from '@domain/aggregates/category/value-objects/category-type/CategoryType';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { CategoryNotFoundError } from '../../../shared/errors/CategoryNotFoundError';
import { InsufficientPermissionsError } from '../../../shared/errors/InsufficientPermissionsError';
import { TransactionCreationFailedError } from '../../../shared/errors/TransactionCreationFailedError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { IRegisterPastTransactionUnitOfWorkStub } from '../../../shared/tests/stubs/IRegisterPastTransactionUnitOfWorkStub';

import { RegisterPastTransactionDto } from './RegisterPastTransactionDto';
import { RegisterPastTransactionUseCase } from './RegisterPastTransactionUseCase';

describe('RegisterPastTransactionUseCase', () => {
  let useCase: RegisterPastTransactionUseCase;
  let getAccountRepositoryStub: GetAccountRepositoryStub;
  let getCategoryRepository: { execute: jest.Mock };
  let unitOfWorkStub: IRegisterPastTransactionUnitOfWorkStub;
  let authServiceStub: BudgetAuthorizationServiceStub;
  let eventPublisherStub: EventPublisherStub;

  let account: Account;
  let category: Category;
  const userId = EntityId.create().value!.id;
  const budgetId = EntityId.create().value!.id;

  beforeEach(() => {
    getAccountRepositoryStub = new GetAccountRepositoryStub();
    getCategoryRepository = { execute: jest.fn() };
    unitOfWorkStub = new IRegisterPastTransactionUnitOfWorkStub();
    authServiceStub = new BudgetAuthorizationServiceStub();
    eventPublisherStub = new EventPublisherStub();

    useCase = new RegisterPastTransactionUseCase(
      getAccountRepositoryStub,
      getCategoryRepository as any,
      unitOfWorkStub,
      authServiceStub,
      eventPublisherStub,
    );

    account = Account.create({
      name: 'Conta',
      type: AccountTypeEnum.CHECKING_ACCOUNT,
      budgetId,
      initialBalance: 1000,
    }).data!;

    category = Category.create({
      name: 'Cat',
      type: CategoryTypeEnum.EXPENSE,
      budgetId,
    }).data!;

    getAccountRepositoryStub.mockAccount = account;
    getCategoryRepository.execute.mockResolvedValue(Either.success(category));
  });

  afterEach(() => {
    getAccountRepositoryStub.executeCalls = [];
    unitOfWorkStub.executeCalls = [];
    getCategoryRepository.execute.mockReset();
  });

  it('should register past transaction successfully', async () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 5);
    const dto: RegisterPastTransactionDto = {
      userId,
      budgetId,
      accountId: account.id,
      categoryId: category.id,
      amount: 500,
      description: 'Compra',
      transactionDate: pastDate,
      type: TransactionTypeEnum.EXPENSE,
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(false);
    expect(unitOfWorkStub.executeCalls.length).toBe(1);
    expect(account.balance).toBe(500);
    expect(result.data!.id).toBeDefined();
  });

  it('should fail when date is in the future', async () => {
    const future = new Date();
    future.setDate(future.getDate() + 1);
    const dto: RegisterPastTransactionDto = {
      userId,
      budgetId,
      accountId: account.id,
      categoryId: category.id,
      amount: 500,
      description: 'Compra',
      transactionDate: future,
      type: TransactionTypeEnum.EXPENSE,
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(TransactionCreationFailedError);
  });

  it('should fail when date is too old', async () => {
    const old = new Date();
    old.setFullYear(old.getFullYear() - 2);
    const dto: RegisterPastTransactionDto = {
      userId,
      budgetId,
      accountId: account.id,
      categoryId: category.id,
      amount: 500,
      description: 'Compra',
      transactionDate: old,
      type: TransactionTypeEnum.EXPENSE,
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(TransactionCreationFailedError);
  });

  it('should fail when account not found', async () => {
    getAccountRepositoryStub.shouldReturnNull = true;

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    const dto: RegisterPastTransactionDto = {
      userId,
      budgetId,
      accountId: account.id,
      categoryId: category.id,
      amount: 100,
      description: 'Compra',
      transactionDate: pastDate,
      type: TransactionTypeEnum.EXPENSE,
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new AccountNotFoundError());
  });

  it('should fail when category not found', async () => {
    getCategoryRepository.execute.mockResolvedValue(Either.success(null));

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    const dto: RegisterPastTransactionDto = {
      userId,
      budgetId,
      accountId: account.id,
      categoryId: category.id,
      amount: 100,
      description: 'Compra',
      transactionDate: pastDate,
      type: TransactionTypeEnum.EXPENSE,
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new CategoryNotFoundError());
  });

  it('should fail when unauthorized', async () => {
    authServiceStub.mockHasAccess = false;

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    const dto: RegisterPastTransactionDto = {
      userId,
      budgetId,
      accountId: account.id,
      categoryId: category.id,
      amount: 100,
      description: 'Compra',
      transactionDate: pastDate,
      type: TransactionTypeEnum.EXPENSE,
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new InsufficientPermissionsError());
  });

  it('should return persistence error when unit of work fails', async () => {
    jest
      .spyOn(unitOfWorkStub, 'execute')
      .mockResolvedValueOnce(Either.error(new Error('fail') as any));

    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 2);
    const dto: RegisterPastTransactionDto = {
      userId,
      budgetId,
      accountId: account.id,
      categoryId: category.id,
      amount: 100,
      description: 'Compra',
      transactionDate: pastDate,
      type: TransactionTypeEnum.EXPENSE,
    };

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new TransactionPersistenceFailedError());
  });
});
