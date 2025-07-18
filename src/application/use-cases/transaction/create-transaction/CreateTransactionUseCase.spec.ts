import { Account } from '@domain/aggregates/account/account-entity/Account';
import { AccountTypeEnum } from '@domain/aggregates/account/value-objects/account-type/AccountType';
import { TransactionTypeEnum } from '@domain/aggregates/transaction/value-objects/transaction-type/TransactionType';
import { EntityId } from '@domain/shared/value-objects/entity-id/EntityId';
import { Either } from '@either';

import { RepositoryError } from '../../../shared/errors/RepositoryError';
import { AccountNotFoundError } from '../../../shared/errors/AccountNotFoundError';
import { AccountRepositoryError } from '../../../shared/errors/AccountRepositoryError';
import { TransactionPersistenceFailedError } from '../../../shared/errors/TransactionPersistenceFailedError';
import { AddTransactionRepositoryStub } from '../../../shared/tests/stubs/AddTransactionRepositoryStub';
import { BudgetAuthorizationServiceStub } from '../../../shared/tests/stubs/BudgetAuthorizationServiceStub';
import { GetAccountRepositoryStub } from '../../../shared/tests/stubs/GetAccountRepositoryStub';
import { EventPublisherStub } from '../../../shared/tests/stubs/EventPublisherStub';
import { CreateTransactionDto } from './CreateTransactionDto';
import { CreateTransactionUseCase } from './CreateTransactionUseCase';

describe('CreateTransactionUseCase', () => {
  let useCase: CreateTransactionUseCase;
  let addTransactionRepositoryStub: AddTransactionRepositoryStub;
  let getAccountRepositoryStub: GetAccountRepositoryStub;
  let budgetAuthorizationServiceStub: BudgetAuthorizationServiceStub;
  let eventPublisherStub: EventPublisherStub;
  let validAccount: Account;
  const userId = EntityId.create().value!.id;

  beforeEach(() => {
    addTransactionRepositoryStub = new AddTransactionRepositoryStub();
    getAccountRepositoryStub = new GetAccountRepositoryStub();
    budgetAuthorizationServiceStub = new BudgetAuthorizationServiceStub();
    eventPublisherStub = new EventPublisherStub();
    useCase = new CreateTransactionUseCase(
      addTransactionRepositoryStub,
      getAccountRepositoryStub,
      budgetAuthorizationServiceStub,
      eventPublisherStub,
    );

    const accountResult = Account.create({
      name: 'Conta Teste',
      type: AccountTypeEnum.CHECKING_ACCOUNT,
      budgetId: EntityId.create().value!.id,
      initialBalance: 1000,
    });
    validAccount = accountResult.data!;
    getAccountRepositoryStub.mockAccount = validAccount;
  });

  afterEach(() => {
    getAccountRepositoryStub.mockAccount = null;
    getAccountRepositoryStub.executeCalls = [];
  });

  describe('execute', () => {
    it('should create transaction successfully with valid data', async () => {
      const dto: CreateTransactionDto = {
        userId,
        description: 'Compra no Supermercado',
        amount: 150.5,
        type: TransactionTypeEnum.EXPENSE,
        accountId: validAccount.id,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBeDefined();
    });

    it('should create transaction successfully with minimal data', async () => {
      const dto: CreateTransactionDto = {
        userId,
        description: 'Transferência PIX',
        amount: 200,
        type: TransactionTypeEnum.INCOME,
        accountId: validAccount.id,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
      };

      const result = await useCase.execute(dto);

      expect(result.hasData).toBe(true);
      expect(result.hasError).toBe(false);
      expect(result.data!.id).toBeDefined();
    });

    it('should fail when account does not exist', async () => {
      const nonExistentAccountId = EntityId.create().value!.id;
      getAccountRepositoryStub.shouldReturnNull = true;
      const dto: CreateTransactionDto = {
        userId,
        description: 'Compra Online',
        amount: 100,
        type: TransactionTypeEnum.EXPENSE,
        accountId: nonExistentAccountId,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new AccountNotFoundError());
    });

    it('should fail when transaction description is empty', async () => {
      const dto: CreateTransactionDto = {
        userId,
        description: '',
        amount: 100,
        type: TransactionTypeEnum.EXPENSE,
        accountId: validAccount.id,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
    });

    it('should create transaction successfully with zero amount', async () => {
      const dto: CreateTransactionDto = {
        userId,
        description: 'Transação com valor zero',
        amount: 0,
        type: TransactionTypeEnum.EXPENSE,
        accountId: validAccount.id,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(false);
      expect(result.hasData).toBe(true);
      expect(result.data!.id).toBeDefined();
    });

    it('should fail when amount is negative', async () => {
      const dto: CreateTransactionDto = {
        userId,
        description: 'Transação Inválida',
        amount: -100,
        type: TransactionTypeEnum.EXPENSE,
        accountId: validAccount.id,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
    });

    it('should fail when accountId is invalid', async () => {
      getAccountRepositoryStub.shouldReturnNull = true;
      const dto: CreateTransactionDto = {
        userId,
        description: 'Compra Teste',
        amount: 100,
        type: TransactionTypeEnum.EXPENSE,
        accountId: 'invalid-id',
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new AccountNotFoundError());
    });

    it('should fail when categoryId is invalid', async () => {
      const dto: CreateTransactionDto = {
        userId,
        description: 'Compra Teste',
        amount: 100,
        type: TransactionTypeEnum.EXPENSE,
        accountId: validAccount.id,
        categoryId: 'invalid-id',
        budgetId: EntityId.create().value!.id,
      };

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0].message).toContain('invalid-id');
    });

    it('should fail when repository returns error', async () => {
      const dto: CreateTransactionDto = {
        userId,
        description: 'Compra Teste',
        amount: 100,
        type: TransactionTypeEnum.EXPENSE,
        accountId: validAccount.id,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
      };

      const repositoryError = new RepositoryError('Database connection failed');
      jest
        .spyOn(addTransactionRepositoryStub, 'execute')
        .mockResolvedValueOnce(Either.errors([repositoryError]));

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new TransactionPersistenceFailedError());
    });

    it('should fail when find account repository returns error', async () => {
      const dto: CreateTransactionDto = {
        userId,
        description: 'Compra Teste',
        amount: 100,
        type: TransactionTypeEnum.EXPENSE,
        accountId: validAccount.id,
        categoryId: EntityId.create().value!.id,
        budgetId: EntityId.create().value!.id,
      };

      const repositoryError = new RepositoryError('Database connection failed');
      jest
        .spyOn(getAccountRepositoryStub, 'execute')
        .mockResolvedValueOnce(Either.errors([repositoryError]));

      const result = await useCase.execute(dto);

      expect(result.hasError).toBe(true);
      expect(result.hasData).toBe(false);
      expect(result.errors[0]).toEqual(new AccountRepositoryError());
    });
  });
});
