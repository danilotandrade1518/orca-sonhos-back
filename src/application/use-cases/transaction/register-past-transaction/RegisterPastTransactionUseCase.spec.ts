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
import { AccountPersistenceFailedError } from '../../../shared/errors/AccountPersistenceFailedError';
import { AddTransactionRepositoryStub } from '../../../shared/tests/stubs/AddTransactionRepositoryStub';
import { SaveAccountRepositoryStub } from '../../../shared/tests/stubs/SaveAccountRepositoryStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { GetCategoryByIdRepositoryStub } from '../../../shared/tests/stubs/GetCategoryByIdRepositoryStub';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { RegisterPastTransactionDto } from './RegisterPastTransactionDto';
import { RegisterPastTransactionUseCase } from './RegisterPastTransactionUseCase';

const makeAccount = () =>
  Account.create({
    name: 'Conta',
    type: AccountTypeEnum.CHECKING_ACCOUNT,
    budgetId: EntityId.create().value!.id,
    initialBalance: 1000,
  }).data!;

const makeCategory = (budgetId: string) =>
  Category.create({
    name: 'Cat',
    type: CategoryTypeEnum.EXPENSE,
    budgetId,
  }).data!;

const makeDto = (
  accountId: string,
  categoryId: string,
  budgetId: string,
): RegisterPastTransactionDto => ({
  userId: EntityId.create().value!.id,
  description: 'Compra',
  amount: 500,
  type: TransactionTypeEnum.EXPENSE,
  accountId,
  categoryId,
  budgetId,
  transactionDate: new Date(Date.now() - 86400000),
});

describe('RegisterPastTransactionUseCase', () => {
  let useCase: RegisterPastTransactionUseCase;
  let addTransactionRepository: AddTransactionRepositoryStub;
  let saveAccountRepository: SaveAccountRepositoryStub;
  let getAccountRepository: GetAccountRepositoryStub;
  let getCategoryRepository: GetCategoryByIdRepositoryStub;
  let budgetAuthorizationService: BudgetAuthorizationServiceStub;
  let eventPublisher: EventPublisherStub;
  let account: Account;
  let category: Category;

  beforeEach(() => {
    addTransactionRepository = new AddTransactionRepositoryStub();
    saveAccountRepository = new SaveAccountRepositoryStub();
    getAccountRepository = new GetAccountRepositoryStub();
    getCategoryRepository = new GetCategoryByIdRepositoryStub();
    budgetAuthorizationService = new BudgetAuthorizationServiceStub();
    eventPublisher = new EventPublisherStub();

    useCase = new RegisterPastTransactionUseCase(
      addTransactionRepository,
      saveAccountRepository,
      getAccountRepository,
      getCategoryRepository,
      budgetAuthorizationService,
      eventPublisher,
    );

    account = makeAccount();
    category = makeCategory(account.budgetId!);
    getAccountRepository.mockAccount = account;
    getCategoryRepository.mockCategory = category;
  });

  it('should register past transaction and update account balance', async () => {
    const dto = makeDto(account.id, category.id, account.budgetId!);

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(false);
    expect(account.balance).toBe(500); // 1000 - 500
    expect(saveAccountRepository.executeCalls.length).toBe(1);
  });

  it('should return error when account not found', async () => {
    getAccountRepository.shouldReturnNull = true;
    const dto = makeDto(EntityId.create().value!.id, category.id, account.budgetId!);

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new AccountNotFoundError());
  });

  it('should return error when category not found', async () => {
    getCategoryRepository.shouldReturnNull = true;
    const dto = makeDto(account.id, EntityId.create().value!.id, account.budgetId!);

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new CategoryNotFoundError());
  });

  it('should return error when unauthorized', async () => {
    budgetAuthorizationService.mockHasAccess = false;
    const dto = makeDto(account.id, category.id, account.budgetId!);

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new InsufficientPermissionsError());
  });

  it('should return error when transaction creation fails', async () => {
    const dto = makeDto(account.id, category.id, account.budgetId!);
    dto.transactionDate = new Date(Date.now() + 86400000); // future

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toBeInstanceOf(TransactionCreationFailedError);
  });

  it('should return error when save account repository fails', async () => {
    saveAccountRepository.shouldFail = true;
    const dto = makeDto(account.id, category.id, account.budgetId!);

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new AccountPersistenceFailedError());
  });

  it('should return error when add transaction repository fails', async () => {
    jest.spyOn(addTransactionRepository, 'execute').mockResolvedValueOnce(
      Either.errors([new TransactionPersistenceFailedError()]),
    );
    const dto = makeDto(account.id, category.id, account.budgetId!);

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new TransactionPersistenceFailedError());
  });

  it('should return error when account repository fails', async () => {
    getAccountRepository.shouldFail = true;
    const dto = makeDto(account.id, category.id, account.budgetId!);

    const result = await useCase.execute(dto);

    expect(result.hasError).toBe(true);
    expect(result.errors[0]).toEqual(new AccountRepositoryError());
  });
});
